/* =====================================================================
   DOMAINE · SYNCHRONISATION (hors ligne d'abord)
   Principe : l'appli travaille toujours sur sa copie locale. Chaque modification est transformée en
   « lignes » serveur, comparée à la dernière version envoyée, et placée dans une file d'attente
   persistante (IndexedDB). La file est envoyée dès que la connexion revient (nouvel essai automatique,
   délai croissant). Côté serveur, chaque ligne a une clé naturelle (pas de doublon si un envoi est rejoué)
   et la modification la plus récente l'emporte (horodatage client, déclencheur keep_newest).
   ===================================================================== */
const SYNC={state:"idle",pending:0,failed:0,lastOk:null,err:null,timer:null,busy:false,backoff:2000,deb:{}};
const TABLE_PK={test_results:"athlete_id,date,key",session_logs:"athlete_id,slot_id",wellness_entries:"athlete_id,date",pain_reports:"athlete_id,ref",
  other_activities:"athlete_id,ref",club_events:"athlete_id,ref",hr_records:"athlete_id,ref",athlete_state:"athlete_id"};
const h32=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)+s.length.toString(36)};
const sidOf=lid=>{const a=PL&&PL.accounts&&PL.accounts[lid];return a&&a.sid||null};
const localOf=sid=>{if(!PL)return sid;const a=Object.values(PL.accounts).find(x=>x.sid===sid&&x.role==="athlete");return a?a.id:sid};
const slotDate=id=>{const m=/(\d{4}-\d{2}-\d{2})/.exec(id);return m?m[1]:null};
const numOrNull=v=>isNum(v)?+v:null;

/* ---------- Données d'un athlète → lignes serveur (et inverse, sans perte) ---------- */
function stateRows(st){
  const R={test_results:[],session_logs:[],wellness_entries:[],pain_reports:[],other_activities:[],club_events:[],hr_records:[],athlete_state:[]};
  const testsMeta={};
  (st.tests||[]).forEach(t=>{if(!t||!t.date)return;const meta={};
    Object.entries(t).forEach(([k,v])=>{if(k==="date")return;if(typeof v==="number"&&isFinite(v))R.test_results.push({_k:t.date+"|"+k,date:t.date,key:k,value:v});else meta[k]=v});
    if(Object.keys(meta).length)testsMeta[t.date]=meta;});
  const ids=new Set([...Object.keys(st.status||{}),...Object.keys(st.log||{}),...Object.keys(st.adapt||{}),...Object.keys(st.moves||{}),...Object.keys(st.cond||{})]);
  ids.forEach(id=>{const s=(st.status||{})[id]||null,l=(st.log||{})[id]||null,a=(st.adapt||{})[id]||null,mv=(st.moves||{})[id]||null,c=(st.cond||{})[id]||null;
    const dur=l&&isNum(l.dur)?+l.dur:null;
    R.session_logs.push({_k:id,slot_id:id,date:slotDate(id),status:s&&["done","adapted","missed"].includes(s.s)?s.s:null,reason:s&&s.reason||null,comment:s&&s.comment||null,
      duration_min:dur&&dur>=1&&dur<=600?dur:null,duration_state:l?(l.durUnknown?"unknown":dur?"confirmed":"to_complete"):null,
      active_s:l&&numOrNull(l.activeS),pause_s:l&&numOrNull(l.pauseS),total_s:l&&numOrNull(l.totalS),
      rpe:l&&isNum(l.rpe)&&+l.rpe>=0&&+l.rpe<=10?+l.rpe:null,rpe_at:l&&l.rpeAt||null,adaptation:a,moved_to:typeof mv==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(mv)?mv:null,
      cond_code:c||null,loads:l&&l.loads||null,data:{status:s,log:l,adapt:a,move:mv,cond:c}})});
  Object.entries(st.fatigue||{}).forEach(([d,f])=>R.wellness_entries.push({_k:d,date:d,score:isObj(f)&&isNum(f.score)?+f.score:null,data:f}));
  Object.entries(st.pain||{}).forEach(([id,p])=>{if(!isObj(p))return;R.pain_reports.push({_k:id,ref:id,at:p.at||nowISO(),date:p.date||null,location:p.zone||p.location||"autre",side:p.side||null,
    intensity:isNum(p.intensity)?Math.round(+p.intensity):null,onset:["recente","habituelle","nr"].includes(p.onset)?p.onset:"nr",trigger_movement:p.trigger||null,
    at_rest:typeof p.atRest==="boolean"?p.atRest:null,comment:p.comment||"",slot_id:p.slot||null,proposal:p.proposal||null,decision:p.decision||null})});
  Object.entries(st.other||{}).forEach(([id,o])=>R.other_activities.push({_k:id,ref:id,date:isObj(o)&&o.date||null,sport:isObj(o)&&o.sport||null,duration_min:isObj(o)&&numOrNull(o.dur),rpe:isObj(o)&&numOrNull(o.rpe),data:o}));
  Object.entries(st.club||{}).forEach(([id,o])=>R.club_events.push({_k:id,ref:id,data:o}));
  (st.hr||[]).forEach((h,i)=>{const id=h.id||("hr-"+(h.at||h.date||i));R.hr_records.push({_k:id,ref:id,at:h.at||null,data:h})});
  const doc={};Object.keys(st).forEach(k=>{if(!["tests","status","log","adapt","moves","cond","fatigue","pain","other","club","hr","active"].includes(k))doc[k]=st[k]});
  doc.testsMeta=testsMeta;doc.active=st.active||null; // séance en cours : reprise possible sur un autre appareil
  R.athlete_state.push({_k:"state",doc});
  return R;
}
function rowsToState(snap){
  const st=defaults();const doc=snap.state||{};
  Object.keys(doc).forEach(k=>{if(k!=="testsMeta")st[k]=doc[k]});
  const byDate={};(snap.tests||[]).forEach(r=>{(byDate[r.date]=byDate[r.date]||{date:r.date})[r.key]=+r.value});
  Object.entries(doc.testsMeta||{}).forEach(([d,m])=>{byDate[d]={...(byDate[d]||{date:d}),...m}});
  st.tests=Object.values(byDate).sort((a,b)=>a.date<b.date?-1:1);
  (snap.logs||[]).forEach(r=>{const d=r.data||{};
    if(d.status)st.status[r.slot_id]=d.status;else if(r.status)st.status[r.slot_id]={s:r.status,reason:r.reason||undefined,comment:r.comment||undefined,at:r.updated_at};
    if(d.log)st.log[r.slot_id]=d.log;else if(r.duration_min||r.rpe!=null)st.log[r.slot_id]={dur:r.duration_min,rpe:r.rpe,rpeAt:r.rpe_at};
    if(d.adapt)st.adapt[r.slot_id]=d.adapt;if(d.move)st.moves[r.slot_id]=d.move;if(d.cond)st.cond[r.slot_id]=d.cond});
  (snap.wellness||[]).forEach(r=>{st.fatigue[r.date]=r.data&&Object.keys(r.data).length?r.data:{score:r.score}});
  st.pain={};(snap.pain||[]).forEach(r=>{st.pain[r.ref]={at:r.at,date:r.date||String(r.at).slice(0,10),zone:r.location,location:PAIN_ZL(r.location),side:r.side||undefined,intensity:r.intensity,onset:r.onset,trigger:r.trigger_movement||undefined,
    atRest:r.at_rest==null?undefined:r.at_rest,comment:r.comment,slot:r.slot_id||undefined,proposal:r.proposal||undefined,decision:r.decision||undefined}});
  (snap.other||[]).forEach(r=>{st.other[r.ref]=r.data});(snap.club||[]).forEach(r=>{st.club[r.ref]=r.data});
  st.hr=(snap.hr||[]).map(r=>r.data).sort((a,b)=>String(a.at||a.date)<String(b.at||b.date)?-1:1);
  if(doc.active)st.active=doc.active;else delete st.active;
  return sanitize(st);
}
/* Clé normalisée pour comparer deux versions (ordre des clés indifférent) */
const canon=v=>JSON.stringify(v,(k,x)=>isObj(x)?Object.keys(x).sort().reduce((o,kk)=>(o[kk]=x[kk],o),{}):x);
const rowHash=r=>{const{_k,...x}=r;return h32(canon(x))};

/* ---------- File d'attente ---------- */
let OPSEQ=0;
async function enqueue(op){op.owner=op.owner||(Cloud.user&&Cloud.user.id)||(Cloud.profile&&Cloud.profile.id)||null;op.seq=nowMs()*1000+(OPSEQ++%1000);op.tries=0;op.failed=false;await IDB.outPut(op);SYNC.pending++;syncIndicator();scheduleFlush(300)}
/* Données d'un athlète : compare aux dernières lignes envoyées et met en file ce qui a changé */
async function queueAthlete(lid,st){
  if(!Cloud.isCloud())return;const sid=sidOf(lid);if(!sid||!st)return;
  const rows=stateRows(st);const key="sync-h:"+sid;const prev=(await IDB.get(key))||{};const next={};const t=nowISO();
  for(const [table,list] of Object.entries(rows))for(const r of list){const k=table+"|"+r._k;const h=rowHash(r);const p=prev[k];
    next[k]={h,t:p&&p.h===h?p.t:t};
    if(!p||p.h!==h){const{_k,...row}=r;row.athlete_id=sid;if(table!=="test_results"&&table!=="pain_reports")row.client_updated_at=next[k].t;
      await enqueue({id:"up|"+sid+"|"+k,kind:"upsert",table,row,onConflict:TABLE_PK[table]})}}
  for(const k of Object.keys(prev))if(!next[k]){const [table,...rest]=k.split("|");const rk=rest.join("|");const match={athlete_id:sid};
    if(table==="test_results"){const [d,...kk]=rk.split("|");match.date=d;match.key=kk.join("|")}
    else if(table==="session_logs")match.slot_id=rk;else if(table==="wellness_entries")match.date=rk;else if(table!=="athlete_state")match.ref=rk;
    await enqueue({id:"del|"+sid+"|"+k,kind:"delete",table,match});await IDB.outDel("up|"+sid+"|"+k)}
  await IDB.set(key,next);
}
function queueAthleteSoon(lid,st){if(!Cloud.isCloud()||!lid)return;clearTimeout(SYNC.deb[lid]);const snap=st;SYNC.deb[lid]=setTimeout(()=>queueAthlete(lid,snap).catch(e=>console.warn(e)),700)}
/* Données du coach (programmes, attributions, formules, journal) et messages */
async function queueCoach(force){
  if(!Cloud.isCloud()||(!force&&!isCoachAccount())||!sidOf("coach"))return;const key="sync-c:"+sidOf("coach");const prev=(await IDB.get(key))||{};const next={};
  const put=async(k,obj,op)=>{const h=h32(canon(obj));next[k]=h;if(prev[k]!==h)await enqueue({id:k,...op})};
  for(const p of Object.values(PL.programs||{}))await put("prog|"+p.id,p,{kind:"rpc",fn:"save_program",args:{p}});
  for(const a of Object.values(PL.assignments||{})){const sid=sidOf(a.clientId);if(!sid)continue;const body={...a,clientSid:sid};delete body.clientId;
    await put("asg|"+a.id,body,{kind:"rpc",fn:"save_assignment",args:{a:body}})}
  for(const [k,f] of Object.entries(PL.formulas||{})){const row={coach_id:sidOf("coach"),key:k,name:f.name,price_label:f.price||"",engagement:f.engagement||"",enabled:f.enabled!==false,
    recommended:!!f.recommended,entitlements:Array.isArray(f.ent)?f.ent:ENT_DEFAULT[k]||[]};await put("form|"+k,row,{kind:"upsert",table:"formulas",row,onConflict:"coach_id,key"})}
  for(const [name,c] of Object.entries(PL.library||{})){if(!c||c.srv&&!c.dirty)continue;const row=libRow(name,c);await put("lib|"+name,row,{kind:"upsert",table:"exercises",row,onConflict:"coach_id,name"})}
  for(const l of (PL.coachLog||[]).slice(0,200)){if(l.srv||l.by!=="coach")continue;l.srv=1;const row={ref:h32(l.at+"|"+l.what),actor_id:sidOf("coach"),coach_id:sidOf("coach"),client_id:l.uid?sidOf(l.uid):null,action:"coach_note",detail:{what:l.what}};
    await enqueue({id:"log|"+row.ref,kind:"insert",table:"audit_log",row,onConflict:"actor_id,ref"})}
  await IDB.set(key,{...prev,...next});
}
async function queueMessages(){
  if(!Cloud.isCloud())return;const me_=sidOf(isCoachAccount()?"coach":CUR_UID);if(!me_)return;const coach=isCoachAccount()?me_:Cloud.coach&&Cloud.coach.id;if(!coach)return;
  for(const m of msgList()){if(m.srv||isDemoMsg(m))continue;const mine=isCoachAccount()?m.from==="coach":(m.from==="client"&&(m.th===CUR_UID||(m.th==="group"&&(m.who||CUR_UID)===CUR_UID)));if(!mine)continue;
    const row={ref:m.id,coach_id:coach,client_id:m.th==="group"?null:(isCoachAccount()?sidOf(m.th):me_),sender_id:me_,body:m.text||"",created_at:m.at};
    if(row.client_id===undefined)continue;m.srv="queued";await enqueue({id:"msg|"+m.id,kind:"insert",table:"messages",row,onConflict:"sender_id,ref"})}
}
/* ---------- Envoi ---------- */
function scheduleFlush(ms){clearTimeout(SYNC.timer);SYNC.timer=setTimeout(flushOutbox,ms)}
async function flushOutbox(){
  if(!Cloud.isCloud()||SYNC.busy)return;if(!(await Cloud.session())){SYNC.state="signedout";syncIndicator();return}
  if(navigator.onLine===false){SYNC.state="offline";syncIndicator();return}
  SYNC.busy=true;SYNC.state="sending";syncIndicator();
  const me_=(await Cloud.session()).user.id;
  try{const ops=(await IDB.outAll()).filter(o=>!o.failed&&(!o.owner||o.owner===me_)).sort((a,b)=>a.seq-b.seq);
    for(const op of ops){let r;
      try{
        if(op.kind==="upsert")r=await Cloud.sb.from(op.table).upsert(op.row,{onConflict:op.onConflict});
        else if(op.kind==="insert")r=await Cloud.sb.from(op.table).upsert(op.row,{onConflict:op.onConflict,ignoreDuplicates:true});
        else if(op.kind==="delete"){let q=Cloud.sb.from(op.table).delete();Object.entries(op.match).forEach(([k,v])=>{q=q.eq(k,v)});r=await q}
        else if(op.kind==="patch"){let q=Cloud.sb.from(op.table).update(op.row);Object.entries(op.match).forEach(([k,v])=>{q=q.eq(k,v)});r=await q}
        else if(op.kind==="rpc")r=await Cloud.sb.rpc(op.fn,op.args);
      }catch(e){r={error:{message:String(e.message||e),network:true}}}
      if(r&&r.error){const net=r.error.network||/fetch|network|timeout/i.test(r.error.message||"")||!r.error.code;
        if(net){SYNC.state="retry";SYNC.err="Connexion interrompue";break}
        op.tries=(op.tries||0)+1;if(op.tries>=3){op.failed=true;op.error=r.error.message||r.error.code;SYNC.failed++}
        await IDB.outPut(op);continue}
      await IDB.outDel(op.id);
      if(op.table==="messages"){const m=msgList().find(x=>x.id===op.row.ref);if(m){m.srv="ok";plSave(true)}}
    }
    const left=(await IDB.outAll()).filter(o=>!o.owner||o.owner===me_);SYNC.pending=left.filter(o=>!o.failed).length;SYNC.failed=left.filter(o=>o.failed).length;
    if(SYNC.state!=="retry"){SYNC.state=SYNC.pending?"retry":"ok";SYNC.lastOk=nowISO();SYNC.err=null;SYNC.backoff=2000}
  }finally{SYNC.busy=false}
  if(SYNC.state==="retry"){SYNC.backoff=Math.min(SYNC.backoff*2,60000);scheduleFlush(SYNC.backoff)}
  syncIndicator();
}
window.addEventListener("online",()=>{SYNC.state="sending";syncIndicator();scheduleFlush(200);pullSoon(1500)});
window.addEventListener("offline",()=>{SYNC.state="offline";syncIndicator()});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&Cloud.isCloud()){scheduleFlush(300);pullSoon(800)}});

/* ---------- Réception ---------- */
let PULL_T=null;function pullSoon(ms){if(!Cloud.isCloud())return;clearTimeout(PULL_T);PULL_T=setTimeout(()=>pullAll().then(()=>{if(!DLG&&!document.getElementById("player"))render()}).catch(e=>console.warn(e)),ms)}
/* Fusion : la version serveur s'applique, sauf pour les lignes encore en attente d'envoi sur cet appareil */
async function mergeAthlete(lid,snap,localSt){
  const sid=sidOf(lid);const ops=(await IDB.outAll()).filter(o=>o.id.startsWith("up|"+sid+"|")||o.id.startsWith("del|"+sid+"|"));
  const pendingUp=new Set(ops.filter(o=>o.kind==="upsert").map(o=>o.id.slice(("up|"+sid+"|").length)));
  const pendingDel=new Set(ops.filter(o=>o.kind==="delete").map(o=>o.id.slice(("del|"+sid+"|").length)));
  let st=rowsToState(snap);
  if(localSt&&(pendingUp.size||pendingDel.size)){
    const L=stateRows(localSt),Srv=stateRows(st);const merged={};
    Object.keys(Srv).forEach(t=>{const m=new Map(Srv[t].map(r=>[t+"|"+r._k,r]));
      (L[t]||[]).forEach(r=>{if(pendingUp.has(t+"|"+r._k))m.set(t+"|"+r._k,r)});pendingDel.forEach(k=>m.delete(k));merged[t]=[...m.values()]});
    st=rowsToState(rowsSnap(merged));
  }
  // les lignes reçues deviennent la référence « déjà envoyée »
  const ref={};Object.entries(stateRows(rowsToState(snap))).forEach(([t,list])=>list.forEach(r=>{ref[t+"|"+r._k]={h:rowHash(r),t:nowISO()}}));
  const prev=(await IDB.get("sync-h:"+sid))||{};pendingUp.forEach(k=>{if(prev[k])ref[k]=prev[k];else delete ref[k]});
  await IDB.set("sync-h:"+sid,ref);
  return st;
}
const rowsSnap=R=>({state:(R.athlete_state[0]||{}).doc||{},tests:R.test_results,logs:R.session_logs,wellness:R.wellness_entries,pain:R.pain_reports,other:R.other_activities,club:R.club_events,hr:R.hr_records});
function acctFromProfile(p,extra){const lid=p.legacy_ctx===LUCAS.ctx?LUCAS.uid:(localOf(p.id)||p.id);
  const prev=PL.accounts[lid]||{};
  PL.accounts[lid]={...prev,id:lid,sid:p.id,role:"athlete",questionnaire:p.questionnaire||prev.questionnaire||{},first:p.first_name||prev.first||"",last:p.last_name||prev.last||"",email:p.email||"",provider:"serveur",createdAt:p.created_at||prev.createdAt,
    coachId:"coach",dataKey:lid===LUCAS.uid?LS_KEY:undefined,...(extra||{})};return lid}
function applyAssignments(list){
  Object.keys(PL.assignments).forEach(k=>{if(PL.assignments[k].srv)delete PL.assignments[k]});
  (list||[]).forEach(a=>{const lid=localOf(a.clientSid);const prev=PL.assignments[a.id]||{};
    PL.assignments[a.id]={...prev,...a,clientId:lid,coachId:"coach",srv:true,history:a.history||[]};delete PL.assignments[a.id].clientSid});
}
function applyServerMessages(rows,meSid){
  const keep=msgList().filter(m=>m.srv!=="ok"&&m.srv!=="in"&&!isDemoMsg(m));const out=[];
  (rows||[]).forEach(r=>{const coachSent=r.sender_id===r.coach_id&&isCoachAccount()?true:r.sender_id&&r.sender_id===sidOf("coach");
    const fromCoach=r.sender_id===r.coach_id;const th=r.client_id?localOf(r.client_id):"group";
    out.push({id:r.ref,th,from:fromCoach?"coach":"client",who:r.client_id?undefined:(r.sender_id?localOf(r.sender_id):"ancien-membre"),text:r.body,at:r.created_at,
      read:!!r.read_at||r.sender_id===meSid,rk:true,rc:r.sender_id===meSid,srv:r.sender_id===meSid?"ok":"in"})});
  const ids=new Set(out.map(m=>m.id));PL.msgs={seeded:true,groupSeeded:true,list:[...out,...keep.filter(m=>!ids.has(m.id))]};
}
async function pullAll(){
  if(!Cloud.isCloud())return;const prof=await Cloud.loadMe();if(!prof)return;
  if(prof.role==="coach"){
    PL.accounts.coach={...(PL.accounts.coach||{}),id:"coach",sid:prof.id,role:"coach",first:prof.first_name||"",last:prof.last_name||"",email:prof.email||"",provider:"serveur"};
    if(PL.meta.coachPushed!==prof.id){await queueCoach(true);PL.meta.coachPushed=prof.id} // 1re connexion : les programmes créés sur cet appareil partent au serveur
    const snap=await Cloud.rpc("coach_snapshot");
    (snap.clients||[]).forEach(c=>acctFromProfile(c,{formula:c.formula_key||null,linkStatus:c.link_status}));
    const live=new Set((snap.clients||[]).map(c=>c.id));
    Object.values(PL.accounts).forEach(x=>{if(x.role==="athlete"&&x.sid&&!live.has(x.sid)){try{localStorage.removeItem(dataKeyFor(x.id))}catch(e){}delete PL.accounts[x.id]}}); // compte supprimé ou détaché sur le serveur
    const pend=new Set((await IDB.outAll()).map(o=>o.id));
    PL.programs=Object.fromEntries([...(snap.programs||[]).map(p=>[p.id,p]),...Object.values(PL.programs||{}).filter(p=>pend.has("prog|"+p.id)).map(p=>[p.id,p])]);
    applyAssignments(snap.assignments);
    (snap.formulas||[]).forEach(f=>{PL.formulas[f.key]={...(PL.formulas[f.key]||{}),name:f.name,price:f.price_label,engagement:f.engagement,enabled:f.enabled,recommended:f.recommended,ent:f.entitlements}});
    PL.srvInvites=snap.invites||[];PL.callRequests=(snap.calls||[]).map(c=>({at:c.created_at,uid:localOf(c.client_id),mode:c.mode,phone:c.phone,slot:c.slot,status:c.status==="a_traiter"?"à traiter":c.status,id:c.id}));
    const unsent=(PL.coachLog||[]).filter(l=>l.by==="coach"&&l.srv!==2&&pend.has("log|"+h32(l.at+"|"+l.what)));
    PL.coachLog=[...unsent,...(snap.audit||[]).map(l=>({at:l.at,by:l.actor_id===prof.id?"coach":l.actor_id?"athlète":"système",uid:l.client_id?localOf(l.client_id):undefined,what:auditText(l),srv:2}))];
    PL.testTypes=snap.testTypes||[];await pullLibrary();
    const ms=await Cloud.sb.from("messages").select("*").order("created_at");applyServerMessages(ms.data,prof.id);
    // données de chaque client (lecture seule sauf tests et corrections de séance)
    for(const c of snap.clients||[]){const lid=localOf(c.id);const s=await Cloud.rpc("athlete_snapshot",{p_athlete:c.id});
      const local=readAthlete(lid);const st=await mergeAthlete(lid,s,local?migrate(local):null);try{localStorage.setItem(dataKeyFor(lid),JSON.stringify(st))}catch(e){}}
    await IDB.set("sync-c:"+prof.id,Object.fromEntries([...Object.values(PL.programs).map(p=>["prog|"+p.id,h32(canon(p))])]));
  }else{
    const s=await Cloud.rpc("athlete_snapshot");Cloud.coach=s.coach||null;Cloud.formula=s.formula||null;
    const lid=acctFromProfile(prof,{formula:s.formula&&s.formula.key||null});
    if(s.coach)PL.accounts.coach={...(PL.accounts.coach||{}),id:"coach",sid:s.coach.id,role:"coach",first:s.coach.first_name,last:s.coach.last_name};
    applyAssignments(await Cloud.rpc("assignments_json"));
    try{const tt=await Cloud.sb.from("test_types").select("*");if(!tt.error)PL.testTypes=tt.data}catch(e){}
    await pullLibrary();
    const ms=await Cloud.sb.from("messages").select("*").order("created_at");applyServerMessages(ms.data,prof.id);
    const local=readAthlete(lid);const st=await mergeAthlete(lid,s,local?migrate(local):null);
    if(PL.session&&PL.session.uid===lid&&CUR_UID===lid){S=st;setPeriod();REV++;lsWrite()}else{try{localStorage.setItem(dataKeyFor(lid),JSON.stringify(st))}catch(e){}}
  }
  PL.meta.lastPull=nowISO();plSave(true);SYNC.lastOk=nowISO();if(SYNC.state!=="retry"&&SYNC.state!=="offline")SYNC.state=SYNC.pending?"retry":"ok";syncIndicator();
}
const AUDIT_L={program_saved:"Programme enregistré",client_program_saved:"Programme d'un client personnalisé",invite_created:"Code d'invitation créé",invite_revoked:"Code d'invitation révoqué",
  invite_used:"Compte créé avec un code d'invitation",legacy_ctx_claimed:"Programme historique rattaché",coach_note:"Note du coach"};
function auditText(l){const d=l.detail||{};return (AUDIT_L[l.action]||l.action)+(d.program?" · « "+d.program+" »":"")+(d.first?" ("+d.first+")":"")+(d.what?" · "+d.what:"")}

/* ---------- Indicateur de synchronisation ---------- */
function syncLabel(){
  if(!Cloud.isCloud())return{k:"demo",t:"Mode démonstration : données sur cet appareil uniquement"};
  if(navigator.onLine===false||SYNC.state==="offline")return{k:"off",t:SYNC.pending?`Hors ligne · ${SYNC.pending} modification${SYNC.pending>1?"s":""} en attente, envoi automatique au retour du réseau`:"Hors ligne · tes saisies sont enregistrées sur l'appareil"};
  if(SYNC.failed)return{k:"err",t:`${SYNC.failed} modification${SYNC.failed>1?"s":""} refusée${SYNC.failed>1?"s":""} par le serveur`};
  if(SYNC.state==="sending")return{k:"send",t:"Envoi en cours…"};
  if(SYNC.pending)return{k:"wait",t:`${SYNC.pending} modification${SYNC.pending>1?"s":""} en attente · nouvel essai automatique`};
  return{k:"ok",t:SYNC.lastOk?"Synchronisé à "+hhmm(Date.parse(SYNC.lastOk)):"Synchronisé"};
}
function syncIndicator(){const L=syncLabel();document.querySelectorAll("[data-sync]").forEach(el=>{el.dataset.sync=L.k;const t=el.querySelector(".sync-t");if(t)t.textContent=L.t;el.setAttribute("title",L.t)});
  const sl=document.getElementById("syncLine");if(sl)sl.textContent=L.t}
const syncChip=()=>{const L=syncLabel();return `<span class="sync-chip" data-sync="${L.k}" role="status" aria-live="polite" title="${esc(L.t)}"><span class="sync-dot" aria-hidden="true"></span><span class="sync-t">${esc(L.t)}</span></span>`};
setInterval(()=>{if(Cloud.isCloud()&&SYNC.pending&&!SYNC.busy)flushOutbox()},30000);
