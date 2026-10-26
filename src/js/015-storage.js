/* =====================================================================
   MODULE 2 · STOCKAGE (structure versionnée, migration, sauvegarde)
   - Sauvegarde principale : localStorage de l'appareil.
   - Copie facultative sur le compte Claude (capacité « db ») si disponible.
   - L'application fonctionne sans aucune fonction propre à Claude.
   ===================================================================== */
const LS_KEY="usci-muscu-state-v1"; // clé historique conservée pour retrouver les données existantes
const SCHEMA=APP_CONFIG.schema; // 4 : multi-client (programmes génériques)
let CUR_UID=null; // compte athlète dont les données sont chargées
const FIXED_IDS=["TEST-2026-10-12","HP-2026-10-15"];
function defaults(){return{
  v:SCHEMA,
  tests:[],          // résultats de tests (historique complet)
  status:{},         // statut des séances de musculation {id:{s,at}}
  moves:{},          // déplacements {id:date}
  adapt:{},          // adaptations confirmées {id:{mode,targets,reasons,at}}
  cond:{},           // variante choisie pour une séance conditionnelle {id:code}
  log:{},            // séance de musculation réellement faite {id:{dur,rpe,rpeAt,endAt,rpeDue,hrAvg,hrMax,zones,hrId}}
  caen:{},           // entraînements à Caen choisis par semaine de cours {S4:"mar"|"jeu"|"both"}
  msgs:{},           // messagerie (maquette) {seeded,list:[{id,th,from,text,at,read,ref}]}
  awards:{},         // badges obtenus {id:date}
  rewards:{},        // récompenses {id:{label,earned,used}}
  pain:{},           // douleurs signalées {id:{date,zone,side,intensity,onset,trigger,atRest,comment,slot}}
  other:{},          // autres activités {id:{date,sport,label,focus,dur,rpe,comment,at}}
  club:{},           // séances club et matchs : modifications, ajouts, saisies réelles
  fatigue:{},        // bien-être du jour (questionnaire de l'appli) {date:{score,cmj,factors,at,src}}
  hr:[],             // enregistrements cardiaques (Polar, import, simulation)
  loadAdj:{},        // ajustements de charge confirmés {lift:kg}
  loadAdjLog:[],
  aclfPerf:[],       // imports de l'ancienne version (conservés, non utilisés)
  settings:{bw:"",barInc:2.5,dbInc:2,dmRefW:"",dmRefR:"",fatAbs:60,fatDrop:10,wbRem:{on:false,times:["08:00"],days:[0,1,2,3,4,5,6]},otZone:1.2,otAlert:1.5,monoMax:2,strainMax:6000,hrMax:"",hrMaxSource:"",hrMaxDate:"",
    pos:"",pos2:"",mock:false,consent:null,accessLinkUrl:""},
  legacy:{},         // données anciennes sans équivalent : conservées, jamais supprimées
  meta:{created:nowISO(),updatedAt:null,migrations:[],seed1210:false}
}}
let S=defaults();
let REV=0; // incrémenté à chaque modification : invalide les calculs mis en cache
let CACHE={rev:-1};
function memo(key,fn){if(CACHE.rev!==REV)CACHE={rev:REV};if(!(key in CACHE))CACHE[key]=fn();return CACHE[key]}
const STORE={mode:"local",localOk:true,dbRef:null,pending:false,lastOk:null,error:null,corrupt:null};

function sanitize(x){
  const b=defaults();const o=isObj(x)?x:{};const r={...b,...o};
  ["status","moves","adapt","cond","log","caen","pain","other","awards","rewards","club","fatigue","loadAdj","legacy"].forEach(k=>{if(!isObj(r[k]))r[k]={}});
  ["tests","hr","loadAdjLog","aclfPerf"].forEach(k=>{if(!Array.isArray(r[k]))r[k]=[]});
  r.settings={...b.settings,...(isObj(o.settings)?o.settings:{})};
  r.meta={...b.meta,...(isObj(o.meta)?o.meta:{})};
  if(!Array.isArray(r.meta.migrations))r.meta.migrations=[];
  delete r.loadBase;
  if(!isObj(r.msgs))r.msgs={};if(r.msgs.list&&!Array.isArray(r.msgs.list))r.msgs.list=[];
  r.tests=r.tests.filter(isObj);r.hr=r.hr.filter(isObj);
  Object.keys(r.status).forEach(k=>{const v=r.status[k];if(!isObj(v)||!["done","adapted","missed","fatigue"].includes(v.s)){(r.legacy.status=r.legacy.status||{})[k]=v;delete r.status[k]}});
  if(!isObj(r.profile))r.profile={};
  return r;
}
function migrate(raw){
  let x=isObj(raw)?JSON.parse(JSON.stringify(raw)):{};
  const from=+x.v||1;
  if(Object.keys(x).length&&from<2)x=migrateV1(x);
  if(Object.keys(x).length&&from<3)x=migrateV2toV3(x,CUR_UID);
  if(Object.keys(x).length&&from<4)x=migrateV3toV4(x,CUR_UID);
  x.v=SCHEMA;
  return sanitize(x);
}
/* Version 1 (appli du 09/10) → version 2.
   Les identifiants de séances changent (« H-2026-10-19 » devient « M-2026-10-19 »).
   Tout ce qui n'a plus d'équivalent part dans « legacy » : rien n'est supprimé. */
function migrateV1(x){
  const out={...x};const notes=[];const legacy={};
  const slotIds=new Set(baseSlotsFor(BASE_CLUB).map(s=>s.id));
  const remap=id=>{if(FIXED_IDS.includes(id))return id;const m=/(\d{4}-\d{2}-\d{2})$/.exec(id);if(m&&slotIds.has("M-"+m[1]))return "M-"+m[1];return null};
  ["status","moves","adapt"].forEach(k=>{
    const src=isObj(x[k])?x[k]:{};const dst={};
    Object.entries(src).forEach(([id,v])=>{
      const n=remap(id);
      if(n&&!(n in dst)){
        dst[n]=k==="adapt"?(v===true?{mode:"volume",targets:[],reasons:["Allégement choisi dans la version précédente de l'appli."],at:null}:v):v;
        if(n!==id)notes.push(k+" : "+id+" → "+n);
      }else{(legacy[k]=legacy[k]||{})[id]=v;notes.push(k+" : "+id+" archivé (plus de séance à cette date dans le nouveau plan)")}
    });
    out[k]=dst;
  });
  if(isObj(x.fatigue))Object.values(x.fatigue).forEach(f=>{if(isObj(f)&&!f.src)f.src="manuel"});
  (Array.isArray(x.tests)?x.tests:[]).forEach(t=>{if(isObj(t)&&isNum(t.rdl5)&&!isNum(t.rdlRefW)){t.rdlRefW=t.rdl5;t.rdlRefR=5;notes.push("Test roumain 5RM du "+t.date+" conservé comme référence au roumain")}});
  out.legacy={...(isObj(x.legacy)?x.legacy:{}),...legacy};
  const meta=isObj(x.meta)?x.meta:{};
  out.meta={...meta,migrations:[...(Array.isArray(meta.migrations)?meta.migrations:[]),{from:1,to:2,at:nowISO(),notes}]};
  return out;
}
/* Résultats des tests du lundi 12/10/2026 transmis par Lucas */
const testsSeed1210=()=>LUCAS.tests1210;
function ensureSeedTests(){
  if(S.meta.seed1210)return;
  if(CUR_UID!==LUCAS.uid){S.meta.seed1210=true;return} // les tests du 12/10 appartiennent au seul profil de Lucas
  const notes=[];let t=S.tests.find(x=>x.date==="2026-10-12");
  if(!t){S.tests.push({...testsSeed1210()});notes.push("Résultats des tests du 12/10 ajoutés")}
  else Object.entries(testsSeed1210()).forEach(([k,v])=>{
    if(!isNum(t[k])&&typeof v==="number"){t[k]=v;notes.push("Test du 12/10 : "+k+" complété ("+v+")")}
    else if(typeof v==="number"&&+t[k]!==v)notes.push("Test du 12/10 : valeur déjà saisie conservée pour "+k+" ("+t[k]+", valeur transmise "+v+")");
  });
  S.meta.seed1210=true;S.meta.migrations.push({from:"tests",to:"12/10",at:nowISO(),notes});
}
function lsRead(){try{return{ok:true,raw:localStorage.getItem(DATA_KEY)}}catch(e){return{ok:false,raw:null}}}
function lsWrite(){if(!CUR_UID)return true;try{localStorage.setItem(DATA_KEY,JSON.stringify(S));STORE.localOk=true;return true}catch(e){STORE.localOk=false;return false}}
function loadLocal(){
  const r=lsRead();if(!r.ok){STORE.localOk=false;return null}
  if(!r.raw)return null;
  try{return JSON.parse(r.raw)}catch(e){
    try{localStorage.setItem(DATA_KEY+"-illisible-"+nowMs(),r.raw)}catch(_){}
    STORE.corrupt="Les données enregistrées sur cet appareil étaient illisibles. Une copie brute a été conservée et l'appli repart des données disponibles.";
    return null;
  }
}
let saveTimer=null,writing=false,again=false;
function save(){
  REV++;S.meta.updatedAt=nowISO();
  if(CUR_UID&&STORE.ready!==false){try{if(freezeLoads())REV++}catch(e){console.warn(e)}}
  const ok=lsWrite();
  if(Cloud.isCloud()&&CUR_UID)queueAthleteSoon(CUR_UID,S);
  if(!save.busy&&typeof checkAwards==="function"&&STORE.ready!==false){save.busy=true;try{checkAwards()}catch(e){console.error(e)}save.busy=false}
  if(STORE.dbRef){STORE.pending=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,600)}
  return ok;
}
async function flush(){
  if(!STORE.dbRef)return;if(writing){again=true;return}writing=true;
  try{await STORE.dbRef.set(JSON.parse(JSON.stringify(S)));STORE.pending=false;STORE.lastOk=nowMs();STORE.error=null}
  catch(e){STORE.error="Copie sur ton compte Claude impossible pour le moment."}
  writing=false;if(again){again=false;flush()}
  const el=document.getElementById("syncLine");if(el)el.textContent=syncText();
}
function syncText(){
  if(Cloud.isCloud()||Cloud.mode==="demo")return syncLabel().t;
  if(!STORE.localOk)return "Stockage indisponible sur cet appareil : tes saisies seront perdues à la fermeture de la page.";
  if(STORE.mode==="claude")return STORE.error?("Enregistré sur cet appareil · "+STORE.error):STORE.pending?"Enregistré sur cet appareil · copie sur ton compte Claude en attente":"Enregistré sur cet appareil et copié sur ton compte Claude";
  return "Enregistré sur cet appareil";
}
/* Appareil sans données locales : si la copie Claude du profil historique existe, le compte de Lucas est recréé à partir d'elle (aucune donnée inventée). */
async function restoreLegacyFromClaude(){
  try{if(!window.claude||typeof window.claude.use!=="function")return;
    const user=await window.claude.use("user");const db=await window.claude.use("db");if(!user||!db)return;
    const id=await user.id();if(!id)return;const snap=await db.doc("data/users/"+id+"/muscu").get();if(!snap.exists)return;
    const remote=snap.data();if(!remote||!isObj(remote))return;
    try{localStorage.setItem(LS_KEY,JSON.stringify(remote))}catch(e){return}
    PL.accounts[LUCAS.uid]={id:LUCAS.uid,role:"athlete",...LUCAS.identity,email:"",provider:"migration",createdAt:nowISO(),dataKey:LS_KEY,coachId:"coach",formula:"coaching",programId:LUCAS.programId};
    PL.meta.migrations.push({from:2,to:3,at:nowISO(),notes:["Profil de Lucas restauré depuis la copie Claude (appareil sans données locales)."]});ensureLucasProgram();startSession(LUCAS.uid);
  }catch(e){}
}
async function initStore(){
  platformBoot();
  if(Cloud.isCloud())return cloudBoot();
  if(!PL.accounts[LUCAS.uid]&&!PL.session)await restoreLegacyFromClaude();
  if(sessionValid()&&Native.isApp()&&(me()||{}).faceId&&!UNLOCKED){CUR_UID=null;S=defaults();REV++;AUTH={screen:"lock"};render();return}
  if(!sessionValid()||isCoachAccount()){CUR_UID=null;S=defaults();setPeriod();REV++;STORE.live=true;render();return}
  CUR_UID=PL.session.uid;DATA_KEY=dataKeyFor(CUR_UID);
  const local=loadLocal();
  S=migrate(local||{});ensureSeedTests();setPeriod();REV++;lsWrite();
  render();setTimeout(()=>{checkAwards();STORE.live=true;if(!DLG&&!document.getElementById("player"))render();if(S.active&&!document.getElementById("player"))checkForgotten()},600);
  if(CUR_UID!==LUCAS.uid)return; // copie Claude réservée au profil historique (prototype)
  try{
    if(!window.claude||typeof window.claude.use!=="function")return;
    const user=await window.claude.use("user");const db=await window.claude.use("db");
    if(!user||!db)return;
    const id=await user.id();if(!id)return;
    const ref=db.doc("data/users/"+id+"/muscu");
    const snap=await ref.get();
    STORE.dbRef=ref;STORE.mode="claude";
    if(snap.exists){
      const remote=snap.data();
      const rT=Date.parse((remote&&remote.meta&&remote.meta.updatedAt)||0)||0;
      const lT=Date.parse((local&&local.meta&&local.meta.updatedAt)||0)||0;
      if(!local||rT>lT){S=migrate(remote);ensureSeedTests();REV++;lsWrite()}
    }
    STORE.pending=true;flush();render();
  }catch(e){STORE.dbRef=null;STORE.mode="local"}
}

