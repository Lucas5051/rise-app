/* =====================================================================
   MODULE · LIAISONS (inscription, connexion, réglages, médias, récompenses, rappels)
   ===================================================================== */
let UNLOCKED=false;   // Face ID : déverrouillage valable pour cette ouverture de l'appli seulement
let REWARD_ID=null;
const POST_AUTH=["migrate","migReport","newPass","notif","widget","widgetLater","faceid","processing","call","callWhy","callBook","offers","lock"];
const inAuthFlow=()=>!sessionValid()||POST_AUTH.includes(AUTH.screen);
const reduceMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Rappel « séance pas terminée » : notification native à fin estimée + 30 min, puis + 90 min (appli iPhone).
   Dans le navigateur : la question est posée à la prochaine ouverture (checkForgotten), jamais de durée inventée. */
Notify.scheduleForgot=async function(id,estEnd){
  if(!this.native()||!isNum(estEnd))return false;
  try{const LN=window.Capacitor.Plugins.LocalNotifications;const p=await LN.checkPermissions();if(p.display!=="granted")return false;
    const base=Math.abs([...("fg"+id)].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,7))%1000000000;
    await LN.schedule({notifications:[
      {id:base,title:"Séance toujours en cours ?",body:"Tu n'as pas terminé ta séance. Indique l'heure de fin.",schedule:{at:new Date(estEnd+FORGOT_MARGIN)}},
      {id:base+1,title:"Durée à confirmer",body:"Ta séance n'est pas terminée dans l'appli. Ouvre-la pour indiquer l'heure de fin.",schedule:{at:new Date(estEnd+3*FORGOT_MARGIN)}}]});
    return true}catch(e){return false}
};
Notify.cancelForgot=async function(id){if(!this.native())return;try{const base=Math.abs([...("fg"+id)].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,7))%1000000000;await window.Capacitor.Plugins.LocalNotifications.cancel({notifications:[{id:base},{id:base+1}]})}catch(e){}};

/* ---------- Sélecteur de raison (statuts, adaptations) ---------- */
function pickReason(el){
  const [pref,k]=el.dataset.reason.split(":");const grp=el.closest("[role=radiogroup]");
  if(grp)grp.querySelectorAll("[data-reason]").forEach(b=>{const on=b===el;b.setAttribute("aria-checked",on);b.setAttribute("aria-pressed",on)});
  const h=document.getElementById(pref+"Reason");if(h)h.value=k;
  const w=document.getElementById(pref+"OtherW");if(w){w.hidden=k!=="autre";if(k==="autre"){const i=document.getElementById(pref+"Other");i&&i.focus()}}
}

/* ---------- Média d'exécution depuis la fiche séance (hors lecteur) ---------- */
function openMediaByName(name){
  const s=sessionById(openId);if(!s)return;const e=playerItems(s).find(x=>x.n===name);if(e)openFiche({name:e.n,ex:e});
}
/* ---------- Récompense « au choix » ---------- */
const REWARD_CHOICES=["Récupération","Activité plaisir","Nouvel équipement","Moment détente","Petit plaisir gourmand, sucré ou salé"];
function openRewardChoice(id){REWARD_ID=id;const r=S.rewards[id];
  openSheet(`<div class="sheet-scroll">`+head("Récompense au choix",esc(r.why||""))+`<div class="stack"><p class="small">Choisis ce qui te fait plaisir. Tu l'as gagnée par ta régularité.</p>
   <div class="stack tight">${REWARD_CHOICES.map(x=>`<button class="btn secondary full" data-pickreward="${esc(x)}">${esc(x)}</button>`).join("")}</div></div></div>`)}

/* ---------- Session, Face ID, offres ---------- */
async function doLogout(all){
  if(Cloud.isCloud()&&!(await cloudLogout(all)))return;
  const uid=PL.session&&PL.session.uid;Native.deleteToken&&Native.deleteToken("usci-muscu");
  if(S.active&&document.getElementById("player"))closePlayer();
  CELEB.length=0;endSession();UNLOCKED=false;CUR_UID=null;DATA_KEY=LS_KEY;S=defaults();REV++;
  AUTH={screen:"intro"};TAB="home";SET_PAGE=null;CTAB="dash";CATH=null;COACH_TH=null;closeSheet(false);render();window.scrollTo(0,0);
  toast(uid?"Tu es déconnecté":"Déconnecté");
}
async function toggleFaceId(){const a=me();if(!a)return;
  if(a.faceId){a.faceId=false;plSave();render();toast("Face ID désactivé");return}
  try{await Native.verify("Activer Face ID pour "+APP_CONFIG.name);a.faceId=true;await Native.saveToken("usci-muscu",a.id,PL.session.token);plSave();render();toast("Face ID activé")}catch(e){toast("Face ID n'a pas pu être activé")}
}
function openOffersInApp(){AUTH={screen:"offers",inApp:true};render();window.scrollTo(0,0)}
function enterApp(msg){const inApp=AUTH.inApp;AUTH={screen:"intro"};
  if(inApp){TAB="settings";SET_PAGE=null}else TAB="home";UNLOCKED=true;
  if(isCoachAccount()){render();return}
  loadAthlete(PL.session.uid);checkAwards();STORE.live=true;render();window.scrollTo(0,0);msg&&toast(msg)}
const afterFace=()=>{if(AUTH.fromCode){enterApp("Bienvenue ! Ton programme t'attend.")}else{AUTH={screen:"processing"};render()}};

/* ---------- Clics de l'inscription / connexion ---------- */
function authClick(tg){
  const q=s=>tg.closest(s);let el;const a=()=>ans();const st=()=>OB_STEPS[draft().step];
  const refresh=()=>{obSave();render()};
  if((el=q("[data-obm]"))){const [k,o]=el.dataset.obm.split(":");const v=a()[k]=a()[k]||{};let sel=v.v||[];const step=OB_STEPS.find(x=>x.k===k)||{};
    const excl=step.excl||({pain:"aucune",devices:"aucun"})[k];
    if(sel.includes(o))sel=sel.filter(x=>x!==o);else sel=o===excl?[o]:[...sel.filter(x=>x!==excl),o];
    v.v=sel;if(k==="goals"){if(!sel.includes(v.main))v.main=sel.length===1?sel[0]:null;if(sel.length===1)v.main=sel[0]}
    if(!sel.includes("autre"))delete v.other;refresh();return true}
  if((el=q("[data-obs]"))){const [k,o]=el.dataset.obs.split(":");a()[k]={...(a()[k]||{}),v:o};if(o!=="autre")delete a()[k].other;obSave();
    if(o==="autre"){render();const i=document.getElementById("obOther_"+k);i&&i.focus();return true}
    render();setTimeout(()=>{if(AUTH.screen==="q"&&st().k===k)obNext()},reduceMotion()?0:220);return true}
  if((el=q("[data-obsd]"))){const [sp,f,x]=el.dataset.obsd.split(":");const D=a().sportDetail=a().sportDetail||{};const v=D[sp]=D[sp]||{};
    if(f==="days"||f==="matchDays"){v[f]=(v[f]||[]).includes(x)?v[f].filter(y=>y!==x):[...(v[f]||[]),x]}else if(f==="dur")v.dur=x;else if(f==="fixed")v.fixed=x==="1";refresh();return true}
  if((el=q("[data-obedit]"))){const i=+el.dataset.obedit;draft().returnToRecap=true;obGo(i);return true}
  if((el=q("[data-obmain]"))){a().goals.main=el.dataset.obmain;refresh();return true}
  if((el=q("[data-oblv]"))){const [sp,l]=el.dataset.oblv.split(":");const v=a().levels=a().levels||{v:{}};v.v=v.v||{};v.v[sp]=l;refresh();return true}
  if((el=q("[data-obfq]"))){const [sp,d]=el.dataset.obfq.split(":");const v=a().freq=a().freq||{v:{}};v.v=v.v||{};const cur=isNum(v.v[sp])?+v.v[sp]:(+d>0?0:1);v.v[sp]=Math.max(0,Math.min(14,cur+ +d));refresh();return true}
  if((el=q("[data-obday]"))){const v=a().dispo=a().dispo||{};const d=el.dataset.obday;v.days=(v.days||[]).includes(d)?v.days.filter(x=>x!==d):[...(v.days||[]),d];refresh();return true}
  if((el=q("[data-obdur]"))){const v=a().dispo=a().dispo||{};v.dur=el.dataset.obdur;refresh();return true}
  if((el=q("[data-obeqcat]"))){const v=a().equip=a().equip||{};if(v.cat!==el.dataset.obeqcat){v.cat=el.dataset.obeqcat;v.items=[]}refresh();return true}
  if((el=q("[data-obeq]"))){const v=a().equip;const x=el.dataset.obeq;v.items=(v.items||[]).includes(x)?v.items.filter(y=>y!==x):[...(v.items||[]),x];refresh();return true}
  if((el=q("[data-obunit]"))){const v=a().body=a().body||{};v.unit=el.dataset.obunit;refresh();return true}
  if((el=q("[data-sso]"))&&Cloud.isCloud()){cloudSso(el.dataset.sso);return true}
  if((el=q("[data-sso]"))){const n=el.dataset.sso==="apple"?"Apple":"Google";const m=document.getElementById("ssoMsg");if(m)m.textContent="La connexion avec "+n+" nécessite l'appli iPhone et le serveur (non disponibles dans ce prototype). Utilise ton adresse e-mail.";return true}
  if((el=q("[data-callmode]"))){AUTH.callMode=el.dataset.callmode;const ph=val("cbPhone"),sl=val("cbSlot");render();const p=document.getElementById("cbPhone"),s=document.getElementById("cbSlot");if(p)p.value=ph;if(s)s.value=sl;return true}
  if((el=q("[data-pickoffer]"))){const k=el.dataset.pickoffer;const ac=me();if(ac){ac.formulaRequest={k,at:nowISO()};PL.coachLog.unshift({at:nowISO(),by:"système",uid:ac.id,what:accountName(ac)+" a choisi la formule « "+PL.formulas[k].name+" »"});plSave()}
    enterApp("Formule « "+PL.formulas[k].name+" » transmise à ton coach");return true}
  const b=q("[data-act]");if(!b)return false;
  switch(b.dataset.act){
   case "obStart":if(PL.onboardDraft&&(PL.onboardDraft.done||PL.onboardDraft.step>0)&&!confirmRestart())return true;PL.onboardDraft=null;AUTH={screen:"q"};obGo(0);return true;
   case "obResume":AUTH={screen:"q"};obGo(draft().step);return true;
   case "obBack":obBack();return true;
   case "obConfirmW":{const v=a().body||{};const u=v.unit||"kg";const kg=isNum(v.kg)?+v.kg:70;setWeight(Math.round((u==="lb"?kg*LB:kg)*10)/10,u,true);a().body.confirmed=true;obSave();render();return true}
   case "obContinue":{const s=st();if(!stepValid(s,a()))return true;if(s.type==="weight"){const v=a().body;const h=num(val("obHeight"),100,250),y=num(val("obBirth"),1920,2020);v.height=isNum(h)?h:null;v.birth=isNum(y)?y:null}obNext();return true}
   case "obSkip":{const s=st();a()[s.k]={...(a()[s.k]||{}),skipped:true};obNext();return true}
   case "obLater":obSave();AUTH={screen:"intro"};render();toast("Inscription enregistrée : tu pourras la reprendre ici");return true;
   case "authLogin":AUTH={screen:"login"};render();return true;
   case "authCode":AUTH={screen:"code"};render();return true;
   case "authCoach":AUTH={screen:Cloud.isCloud()?"login":"coachLogin"};render();return true;
   case "authForgot":AUTH={screen:"forgot"};render();return true;
   case "migBackup":case "migRun":case "migLater":case "migDone":case "migReportDl":return migClick(b.dataset.act);
   case "toIntro":AUTH={screen:"intro"};render();return true;
   case "coachEnter":startSession("coach");PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Connexion à l'espace coach (démonstration)"});plSave();AUTH={screen:"intro"};CTAB="dash";initStore();return true;
   case "codeBack":AUTH.screen="codeVerify";render();return true;
   case "codeConfirm":codeConfirm();return true;
   case "notifYes":{PL.prefs.notif=true;plSave();const go=()=>{AUTH.screen="widget";render()};
     if(Notify.native()){window.Capacitor.Plugins.LocalNotifications.requestPermissions().finally(go)}else if("Notification" in window&&Notification.permission==="default"){Notification.requestPermission().finally(go)}else go();return true}
   case "notifNo":PL.prefs.notif=false;plSave();AUTH.screen="widget";render();return true;
   case "widgetYes":Native.pushWidget(widgetPayload()).then(ok=>{toast(ok?"Widget prêt : ajoute-le depuis l'écran d'accueil de l'iPhone":"Le widget s'ajoute depuis l'appli iPhone installée");AUTH.screen="faceid";render()});return true;
   case "widgetNo":AUTH.screen="widgetLater";render();return true;
   case "afterWidget":AUTH.screen="faceid";render();return true;
   case "faceYes":Native.verify("Activer Face ID pour "+APP_CONFIG.name).then(async()=>{me().faceId=true;await Native.saveToken("usci-muscu",me().id,PL.session.token);plSave();toast("Face ID activé")},()=>toast("Face ID non activé : tu pourras le faire dans Paramètres")).finally(afterFace);return true;
   case "faceNo":afterFace();return true;
   case "callYes":AUTH.screen="callBook";AUTH.callMode=AUTH.callMode||"tel";render();return true;
   case "callNo":AUTH.screen="callWhy";render();return true;
   case "callBack":AUTH.screen=AUTH.screen==="callBook"?"call":"call";render();return true;
   case "callSend":{const ph=val("cbPhone").trim(),sl=val("cbSlot").trim();if(AUTH.callMode==="tel"&&!/^[+0-9 .()-]{8,}$/.test(ph)){toast("Indique un numéro de téléphone valide");return true}
     if(Cloud.isCloud()){cloudCall(AUTH.callMode,ph,sl).then(ok=>{if(ok){toast("Demande envoyée à ton coach");AUTH.screen="offers";render();window.scrollTo(0,0)}});return true}
     PL.callRequests=PL.callRequests||[];PL.callRequests.unshift({at:nowISO(),uid:CUR_UID,mode:AUTH.callMode,phone:ph,slot:sl,status:"à traiter"});PL.coachLog.unshift({at:nowISO(),by:"système",uid:CUR_UID,what:"Demande d'appel gratuit ("+(AUTH.callMode==="visio"?"visio":"téléphone")+")"});plSave();
     toast("Demande envoyée à ton coach");AUTH.screen="offers";render();window.scrollTo(0,0);return true}
   case "toOffers":AUTH.screen="offers";render();window.scrollTo(0,0);return true;
   case "offersBack":if(AUTH.inApp){enterApp();return true}AUTH.screen="callWhy";render();return true;
   case "offersSkip":enterApp();return true;
   case "unlock":tryUnlock();return true;
   case "logout":doLogout();return true;
  }
  return false;
}
function confirmRestart(){return true} // l'ancien brouillon est remplacé uniquement par « Commencer » ; « Reprendre » le conserve
function widgetPayload(){const t=todayISO();const s=sessions().find(x=>x.date===t&&!isOpt(x));return{date:t,streak:qStats().cur,next:s?tpl(s).name:null,updatedAt:nowISO()}}
/* Saisie au clavier pendant l'inscription (sans rafraîchir l'écran, pour ne pas perdre le focus) */
document.addEventListener("input",ev=>{
  const t=ev.target;if(!t.closest||!t.closest(".auth"))return;const A=ans();
  if(t.dataset.obother){const k=t.dataset.obother;A[k]=A[k]||{};A[k].other=t.value}
  else if(t.dataset.obtext){const k=t.dataset.obtext;A[k]=A[k]||{};A[k].txt=t.value}
  else if(t.dataset.obsdt){const D=A.sportDetail=A.sportDetail||{};(D[t.dataset.obsdt]=D[t.dataset.obsdt]||{}).time=t.value}
  else if(t.dataset.obdev){const v=A.devices=A.devices||{};v.models=v.models||{};v.models[t.dataset.obdev]=t.value}
  else if(t.id==="wKey"){const u=(A.body||{}).unit||"kg";const x=parseFloat(String(t.value).replace(",","."));const st=document.getElementById("wState");
    if(isFinite(x)&&setWeight(Math.round(x*10)/10,u,true)){}else if(st&&t.value){st.textContent="Valeur hors limites : entre "+W_RANGE[u][0]+" et "+W_RANGE[u][1]+" "+u+".";}return}
  else return;
  obSave();const st=OB_STEPS[draft().step];const b=document.querySelector('.auth [data-act="obContinue"]');if(b&&st)b.disabled=!stepValid(st,A);
});
document.addEventListener("change",ev=>{const t=ev.target;
});
document.addEventListener("submit",ev=>{const id=ev.target.id;
  if(id==="accountForm"){ev.preventDefault();submitAccount()}
  else if(id==="loginForm"){ev.preventDefault();submitLogin()}
  else if(id==="codeForm"){ev.preventDefault();submitCode()}
  else if(id==="inviteForm"){ev.preventDefault();if(!isCoachAccount())return;
    const d={clientDraftId:uid("draft"),coachId:me().id,first:val("ivFirst").trim(),last:val("ivLast").trim(),email:val("ivEmail").trim(),sport:val("ivSport").trim(),goal:val("ivGoal").trim(),formula:val("ivFormula"),
      programId:val("ivProg")||null,startDate:val("ivStart")||todayISO(),startWeek:+val("ivWeek")||0,notes:val("ivNotes").trim()};const m=document.getElementById("ivMsg");
    if(!d.first){m.textContent="Indique au moins le prénom.";document.getElementById("ivFirst").focus();return}
    if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)){m.textContent="Adresse e-mail invalide.";return}
    if(d.programId&&!d.startDate){m.textContent="Choisis la date de démarrage.";return}
    if(Cloud.isCloud()){cloudInvite(d,+val("ivDays")||14);return}
    const inv=createInvite(d,+val("ivDays")||14);render();toast("Code créé : "+inv.code)}
});

