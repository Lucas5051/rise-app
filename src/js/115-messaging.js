/* =====================================================================
   MODULE 23 · MESSAGERIE CLIENT ↔ COACH — MAQUETTE
   Données fictives sur cet appareil : aucun message n'est envoyé à quelqu'un d'autre.
   Sert à valider l'interface avant de choisir une vraie plateforme (comptes + base de données).
   ===================================================================== */
/* Les messages sont partagés entre l'espace athlète et l'espace coach : ils sont rangés dans la plateforme (PL.msgs), pas dans les données d'un athlète. */
const myId=()=>CUR_UID||"";
const isDemoMsg=m=>!!m.demo||/^[dg]\d$/.test(m.id||"");
/* Clients fictifs de démonstration (jamais présentés comme réels) */
const DEMO_FAKE=[
 {id:"hugo",name:"Hugo Martin",pos:"Milieu",score:58,reg:71,avg:62,alerts:[{k:"low",t:"41/100 ce matin (sommeil très mauvais)"}]},
 {id:"theo",name:"Théo Lefèvre",pos:"Attaquant",score:82,reg:100,avg:79,alerts:[]},
 {id:"nathan",name:"Nathan Roussel",pos:"Gardien",score:66,reg:43,avg:64,alerts:[{k:"pain",t:"« mal au genou droit après la séance »"},{k:"adapt",t:"Réduction du volume · Principale · force"}]}
];
const demoFake=()=>Cloud.isCloud()?[]:DEMO_FAKE;
function demoSeed(){
  if(Cloud.isCloud()){if(!isObj(PL.msgs))PL.msgs={list:[]};if(!Array.isArray(PL.msgs.list))PL.msgs.list=[];return}
  if(!isObj(PL.msgs)){PL.msgs=isObj(S.msgs)&&Array.isArray(S.msgs.list)?{...S.msgs}:{};} // reprise des messages de la version précédente
  if(PL.msgs.seeded){groupSeed();return}
  const h=n=>new Date(nowMs()-n*3600e3).toISOString();
  PL.msgs={seeded:true,list:[...(PL.msgs.list||[]),
   {id:"d1",th:LUCAS.uid,demo:true,from:"coach",text:"Salut Lucas, bienvenue sur l'appli. Remplis ton ressenti chaque matin, je regarde tout ici.",at:h(30),read:true},
   {id:"d2",th:"hugo",from:"client",text:"Coach, j'ai très mal dormi, je fais quand même la séance de force ce soir ?",at:h(3),read:false},
   {id:"d3",th:"theo",from:"client",text:"Séance terminée, j'ai pu monter à 90 kg au squat !",at:h(20),read:true},
   {id:"d4",th:"theo",from:"coach",text:"Top Théo, on garde 90 kg la semaine prochaine et on valide la technique.",at:h(19),read:true},
   {id:"d5",th:"nathan",from:"client",text:"J'ai une gêne au genou depuis hier, je dois adapter ?",at:h(6),read:false,ref:{label:"Principale · force (jeu. 22/10)"}}
  ]};groupSeed();plSave();
}
/* Chat de groupe (tous les clients + coach) : quelques messages d'exemple */
const DEMO_PHOTO="data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3447D6"/><stop offset="1" stop-color="#6A3FCB"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><rect x="40" y="92" width="240" height="10" rx="5" fill="#fff"/><rect x="52" y="70" width="18" height="54" rx="4" fill="#D4F25A"/><rect x="250" y="70" width="18" height="54" rx="4" fill="#D4F25A"/><text x="160" y="170" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">Photo d\'exemple</text></svg>');
function groupSeed(){
  if(PL.msgs.groupSeeded)return;const h=n=>new Date(nowMs()-n*3600e3).toISOString();
  PL.msgs.list.push(
   {id:"g1",th:"group",from:"coach",text:"Bienvenue dans le groupe ! Posez vos questions, partagez vos séances et entraidez-vous. Je réponds à tout le monde ici.",at:h(48),rk:true,rc:true},
   {id:"g2",th:"group",from:"client",who:"theo",text:"Quelqu'un a une astuce pour garder le dos neutre au soulevé de terre ?",at:h(26),rk:true,rc:true},
   {id:"g3",th:"group",from:"client",who:"nathan",text:"Pense à pousser le sol avec les jambes et à garder la barre collée aux tibias, ça m'a aidé.",at:h(25),rk:true,rc:true},
   {id:"g4",th:"group",from:"client",who:"hugo",text:"Ma barre de ce matin, nouveau record !",at:h(4),rk:false,rc:false,media:{type:"image",src:DEMO_PHOTO,name:"exemple"}});
  PL.msgs.groupSeeded=true;
}
const msgList=()=>(PL&&isObj(PL.msgs)&&Array.isArray(PL.msgs.list))?PL.msgs.list:[];
const threadOf=id=>msgList().filter(m=>m.th===id).sort((a,b)=>a.at<b.at?-1:1);
const authorOf=m=>m.from==="coach"?"coach":(m.who||m.th);
const nameOf=a=>a==="coach"?"Coach":PL.accounts[a]&&PL.accounts[a].role==="athlete"?accountName(PL.accounts[a]):((DEMO_FAKE.find(c=>c.id===a)||{}).name||a);
const isUnread=(m,role)=>m.th==="group"?(role==="coach"?authorOf(m)!=="coach"&&!m.rk:authorOf(m)!==myId()&&!m.rc):(!m.read&&(role==="coach"?m.from==="client":m.th===myId()&&m.from==="coach"));
const unreadFor=(role,th)=>msgList().filter(m=>(th?m.th===th:true)&&isUnread(m,role)).length;
let CLIENT_CH="private",MSG_MEDIA=null;
const isCoach=()=>isCoachAccount();
let MSG_REF=null,COACH_TH=null;
const timeTxt=iso=>{const d=new Date(iso);const t=iso.slice(0,10);return (t===todayISO()?"":fmtShort(t)+" · ")+pad(d.getHours())+"h"+pad(d.getMinutes())};
const demoBanner=()=>Cloud.isCloud()?"":`<div class="demo-banner" role="note"><b>Démonstration.</b> Les messages et les clients autres que toi sont des exemples fictifs. Rien n'est envoyé à personne : la vraie messagerie nécessite le serveur.</div>`;
function mediaHtml(m){const md=m.media;if(!md)return "";const who=nameOf(authorOf(m));
  if(md.type==="image")return `<img class="bub-img" src="${esc(md.src)}" alt="Photo partagée par ${esc(who)}" loading="lazy">`;
  const vs=md.src||TEMP_MEDIA[m.id];
  return vs?`<video class="bub-img" src="${esc(vs)}" controls playsinline preload="metadata" aria-label="Vidéo partagée par ${esc(who)}"></video>`:`<p class="tiny" style="opacity:.8">🎬 Vidéo « ${esc(md.name||"")} » (non conservée après rechargement dans la maquette)</p>`}
/* me = "coach" ou l'identifiant du client qui regarde */
function bubbles(list,me,group){
  if(!list.length)return `<p class="small muted" style="text-align:center;margin:20px 0">Aucun message pour l'instant.</p>`;
  return `<div class="chat">`+list.map(m=>{const a=authorOf(m),mine=a===me;
    return `<div class="bub ${mine?"me":"them"} ${a==="coach"&&!mine?"coach-b":""}">${isDemoMsg(m)?'<span class="demo-tag">Exemple fictif</span>':""}${group&&!mine?`<span class="bub-who">${esc(nameOf(a))}${a==="coach"?" ✓":""}</span>`:""}${m.ref?`<span class="bub-ref">${m.ref.id&&!isCoach()?`<button type="button" class="linkish" data-open="${m.ref.id}">`:""}Séance : ${esc(m.ref.label)}${m.ref.id&&!isCoach()?"</button>":""}</span>`:""}${mediaHtml(m)}${m.text?`<p>${esc(m.text)}</p>`:""}<small>${timeTxt(m.at)}</small></div>`}).join("")+`</div>`;
}
function composer(ph,allowMedia){
  return `<div class="composer">${MSG_REF?`<div class="ref-draft"><span>Séance : ${esc(MSG_REF.label)}</span><button type="button" class="linkish" data-act="msgRefClear" aria-label="Retirer la séance">Retirer</button></div>`:""}
   ${MSG_MEDIA?`<div class="ref-draft"><span>${MSG_MEDIA.type==="image"?"Photo":"Vidéo"} : ${esc(MSG_MEDIA.name)}</span><button type="button" class="linkish" data-act="msgMediaClear">Retirer</button></div>`:""}
   <div class="row" style="gap:8px;align-items:flex-end;flex-wrap:nowrap">${allowMedia?`<label class="btn secondary attach" aria-label="Ajouter une photo ou une vidéo"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg><input type="file" id="msgFile" accept="image/*,video/*" hidden></label>`:""}<textarea id="msgTxt" rows="2" placeholder="${esc(ph)}" aria-label="Message"></textarea><button class="btn" data-act="msgSend" style="min-height:48px">Envoyer</button></div></div>`;
}
/* Photo : réduite à 720 px (JPEG) pour rester légère ; vidéo : gardée en mémoire seulement dans la maquette */
function msgPickFile(f){
  if(!f)return;
  if(f.type.startsWith("video/")){if(f.size>50*1024*1024){toast("Vidéo trop lourde (50 Mo maximum)");return}MSG_MEDIA={type:"video",src:URL.createObjectURL(f),name:f.name,temp:true};render();toast("Vidéo temporaire : elle ne sera pas conservée après fermeture de l'appli (prototype)");return}
  if(!/^image\/(jpeg|png|webp|gif)$/.test(f.type)){toast("Format non pris en charge (JPEG, PNG, WebP)");return}
  if(f.size>8*1024*1024){toast("Image trop lourde (8 Mo maximum)");return}
  if(storageUse().pct>85){toast("Stockage de l'appareil presque plein : supprime des médias avant d'en ajouter");return}
  const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{const k=Math.min(1,720/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    MSG_MEDIA={type:"image",src:c.toDataURL("image/jpeg",.72),name:f.name};render()};img.onerror=()=>toast("Image illisible");img.src=rd.result};rd.readAsDataURL(f);
}
/* ---------- Côté client ---------- */
function viewMsgClient(){
  demoSeed();const g=CLIENT_CH==="group";
  msgList().forEach(m=>{if(g&&m.th==="group")m.rc=true;if(!g&&m.th===myId()&&m.from==="coach")m.read=true});plSave();
  const uP=unreadFor("client",myId()),uG=unreadFor("client","group");
  let h=`<header class="top"><button class="icon-btn" data-tab="home" aria-label="Retour à l'accueil">${ICONS.back}</button><div class="grow" style="margin-left:10px"><div class="eyebrow">${g?"Tous les clients + le coach":"Privé · toi et ton coach"}</div><h1>Messages</h1></div></header><div class="stack">${demoBanner()}
   <div class="seg" role="tablist" aria-label="Choix de la conversation"><button role="tab" aria-selected="${!g}" data-msgch="private">Privé${uP?` <span class="dot-n static">${uP}</span>`:""}</button><button role="tab" aria-selected="${g}" data-msgch="group">Groupe${uG?` <span class="dot-n static">${uG}</span>`:""}</button></div>`;
  h+=`<section class="card">${bubbles(threadOf(g?"group":myId()),myId(),g)}</section>`;
  h+=composer(g?"Écris au groupe : une question, un conseil, ta séance…":"Écris à ton coach… (seul ton coach verra ce message)",true);
  return h+`</div>`;
}
function msgBtn(){const n=unreadFor("client");return `<button class="icon-btn msg-btn" data-tab="msg" aria-label="Messages${n?", "+n+" non lu"+(n>1?"s":""):""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>${n?`<span class="dot-n">${n}</span>`:""}</button>`}
function askCoach(id){const s=sessionById(id);if(!s)return;CLIENT_CH="private";MSG_REF={id,label:tpl(s).name+" ("+fmtShort(s.date)+")"};closeSheet(false);TAB="msg";render();setTimeout(()=>{const t=document.getElementById("msgTxt");t&&t.focus()},50)}
/* ---------- Alertes automatiques (calculées à partir des données de Lucas) ---------- */
function liveAlerts(){
  const out=[],t=todayISO();
  for(let i=0;i<3;i++){const d=addDays(t,-i);const fe=fatigueEval(d);const f=S.fatigue[d];
    if((fe&&fe.pain)||(f&&commentSignals(f.comment).pain))out.push({k:"pain",d,t:(f&&f.comment?"« "+f.comment+" » · ":"")+fmtShort(d)});
    if(f&&isNum(f.score)&&+f.score<45)out.push({k:"low",d,t:f.score+"/100 · "+fmtShort(d)});
    otherOn(d).forEach(o=>{const sg=commentSignals(o.comment);if(sg.pain)out.push({k:"pain",d,t:"après "+sportOf(o).name.toLowerCase()+" : « "+o.comment+" » · "+fmtShort(d)})})}
  sessions().filter(s=>S.adapt[s.id]&&S.adapt[s.id].mode&&S.adapt[s.id].mode!=="none"&&diff(s.date,t)<=3&&diff(t,s.date)<=3).forEach(s=>out.push({k:"adapt",d:s.date,t:ADAPT_LABEL[S.adapt[s.id].mode]+" · "+tpl(s).name+" · "+fmtShort(s.date)}));
  return out;
}
const ALERT_L={pain:"Douleur",low:"Ressenti bas",adapt:"Allègement accepté"};
const clientAlerts=c=>c.real?liveAlerts():c.alerts;
function clientStats(c){
  if(!c.real)return{score:c.score,reg:c.reg,avg:c.avg};
  const t=todayISO(),f=S.fatigue[t];let n=0,q=0,v=[];for(let i=0;i<7;i++){const d=addDays(t,-i);if(d<PERIOD_START)continue;n++;if(wbFilled(d)){q++;v.push(+S.fatigue[d].score)}}
  return{score:f&&isNum(f.score)?+f.score:null,reg:n?Math.round(q/n*100):null,avg:v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null};
}
function msgSend(){
  const ta=document.getElementById("msgTxt");const txt=(ta&&ta.value||"").trim();if(!txt&&!MSG_MEDIA){toast("Écris ton message");return}
  demoSeed();const coach=isCoach();const th=coach?COACH_TH:(CLIENT_CH==="group"?"group":myId());if(!th)return;
  const m={id:"m"+Date.now().toString(36),th,from:coach?"coach":"client",text:txt.slice(0,1000),at:nowISO(),read:false};
  if(th==="group"){if(!coach)m.who=myId();m.rc=!coach;m.rk=coach}
  if(!coach&&MSG_REF)m.ref={...MSG_REF};
  if(MSG_MEDIA){m.media={type:MSG_MEDIA.type,name:MSG_MEDIA.name,src:MSG_MEDIA.temp?null:MSG_MEDIA.src};if(MSG_MEDIA.temp)TEMP_MEDIA[m.id]=MSG_MEDIA.src}
  MSG_REF=null;MSG_MEDIA=null;demoSeed();PL.msgs.list.push(m);
  if(!plSave()&&m.media){toast("Mémoire de l'appareil pleine : photo trop lourde pour la démonstration");PL.msgs.list.pop();plSave();return}
  render();toast(th==="group"?(coach?"Message envoyé à tous tes clients (maquette)":"Message posté dans le groupe (maquette)"):coach?"Réponse enregistrée (maquette)":"Message enregistré (maquette) : ton coach le verra dans l'espace coach");
  const c=document.querySelector(".chat");c&&c.lastElementChild&&c.lastElementChild.scrollIntoView({block:"end"});
}
const TEMP_MEDIA={};

/* ---------- Cloche des alertes de l'athlète ---------- */
function athleteAlerts(t){
  const out=[];
  sessions().filter(s=>s.date===t&&!statusOf(s)&&!S.adapt[s.id]).forEach(s=>{const r=recommend(s);if(r.mode!=="none")out.push({k:r.pain?"pain":"warn",t:"Adaptation proposée : "+r.label.toLowerCase(),d:tpl(s).name+" · "+(r.why[0]||""),a:`data-open="${s.id}"`})});
  const fe=fatigueEval(t),f=S.fatigue[t];
  if(f&&((fe&&fe.pain)||commentSignals(f.comment).pain))out.push({k:"pain",t:"Douleur signalée",d:"Évite les exercices qui la réveillent ; si elle persiste, demande l'avis d'un professionnel de santé.",a:'data-act="openWellness"'});
  else if(fe&&fe.high)out.push({k:"warn",t:"Fatigue élevée",d:fe.reasons[0]||"",a:'data-act="openWellness"'});
  [addDays(t,-1),t].forEach(d=>{if(!otherOn(d).length)return;const v=otherVerdict(d);if(v.tier>=1)out.push({k:v.tier===2?"pain":"warn",t:"Autre activité : "+OT_TIER[v.tier].toLowerCase(),d:fmtShort(d)+" · "+otherOn(d).map(o=>sportOf(o).name).join(", "),a:`data-otherv="${d}"`})});
  if(!wbFilled(t))out.push({k:remDue()?"warn":"info",t:"Questionnaire du jour à remplir",d:"Ton ressenti en 1 minute.",a:'data-act="openWellness"'});
  sessions().filter(s=>s.date<=t&&isDone(s)&&!isNum((S.log[s.id]||{}).rpe)).forEach(s=>out.push({k:"info",t:"RPE à noter",d:tpl(s).name+" · "+fmtShort(s.date),a:`data-rpe="${s.id}"`}));
  const un=unreadFor("client");if(un)out.push({k:"info",t:un+" message"+(un>1?"s":"")+" non lu"+(un>1?"s":""),d:"Ton coach ou le groupe t'a écrit.",a:'data-tab="msg"'});
  return out;
}
function bellBtn(t){const al=athleteAlerts(t),n=al.length,hot=al.some(a=>a.k!=="info");
  return `<button class="icon-btn hd-btn bell ${hot?"ring":""}" data-act="openAlerts" aria-label="Alertes${n?", "+n:", aucune"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>${n?`<span class="dot-n ${hot?"":"calm"}">${n}</span>`:""}</button>`}
function openAlerts(){const t=todayISO(),al=athleteAlerts(t);sheetMode="alerts";
  openSheet(`<div class="sheet-scroll">`+head(cap(fmtLong(t)),"Mes alertes")+`<div class="stack tight">`+(al.length?al.map(a=>`<button class="list-item al-item al-${a.k}" ${a.a}><span class="sbar"></span><div class="grow"><b>${esc(a.t)}</b>${a.d?`<div class="small muted">${esc(a.d)}</div>`:""}</div><span aria-hidden="true">›</span></button>`).join(""):`<p class="small">Aucune alerte : tout est à jour.</p>`)+`</div></div>`,"Mes alertes")}

