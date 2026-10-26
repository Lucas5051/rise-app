/* =====================================================================
   DOMAINE · CONNEXION AU SERVEUR (mode production)
   Connexion e-mail/mot de passe, mot de passe oublié, code d'invitation vérifié et consommé par le serveur,
   inscription libre avec vérification de l'adresse, Apple/Google (si activés sur le serveur), déconnexion
   de cet appareil ou de tous les appareils. Le rôle (coach / athlète) vient UNIQUEMENT du serveur.
   ===================================================================== */
const CONSENT_VERSION="2026-10";
const consentBox=()=>`<label class="row consent" style="gap:10px;align-items:flex-start"><input type="checkbox" id="acConsent" required> <span class="small">J'accepte que mes données d'entraînement, de ressenti et de douleur (données de santé) soient enregistrées sur le serveur et transmises à mon coach pour mon suivi. Je peux les exporter ou les supprimer à tout moment (Paramètres › Mes données).${APP_CONFIG.legal.privacyUrl?` <a href="${esc(APP_CONFIG.legal.privacyUrl)}" target="_blank" rel="noopener">Politique de confidentialité</a>`:""}</span></label>`;
const busy=(btn,on,txt)=>{if(!btn)return;if(on){btn.dataset.t=btn.textContent;btn.textContent=txt||"Patiente…";btn.disabled=true}else{btn.textContent=btn.dataset.t||btn.textContent;btn.disabled=false}};

async function cloudLogin(){
  const email=val("lgEmail").trim().toLowerCase(),pass=val("lgPass");const m=document.getElementById("lgMsg");const b=document.querySelector('#loginForm [type=submit]');
  if(!email||!pass){m.textContent="Indique ton adresse e-mail et ton mot de passe.";return}
  busy(b,true,"Connexion…");
  try{await Cloud.signIn(email,pass);await afterCloudAuth(false)}catch(e){m.textContent=authErrText(e)}finally{busy(b,false)}
}
/* Après une connexion réussie : données du serveur, puis espace correspondant au rôle serveur */
async function afterCloudAuth(fromCode){
  await pullAll();const p=Cloud.profile;if(!p)throw new Error("profil introuvable");
  if(PL.pendingQuestionnaire&&p.role==="athlete"){try{await Cloud.sb.from("profiles").update({questionnaire:PL.pendingQuestionnaire}).eq("id",p.id);delete PL.pendingQuestionnaire}catch(e){}}
  if(PL.pendingConsent){try{await Cloud.sb.from("consents").insert([{user_id:p.id,kind:"cgu",version:CONSENT_VERSION,granted:true},{user_id:p.id,kind:"donnees_sante",version:CONSENT_VERSION,granted:true}]);delete PL.pendingConsent}catch(e){}}
  if(p.role==="coach"){startSession("coach");AUTH={screen:"intro"};CTAB="dash";CUR_UID=null;S=defaults();setPeriod();REV++;STORE.live=true;
    if(legacyLocalData()&&p.legacy_ctx!==LUCAS.ctx){AUTH={screen:"migrate"};}
    render();window.scrollTo(0,0);scheduleFlush(400);return}
  const lid=localOf(p.id);startSession(lid);
  if(fromCode){loadAthlete(lid);AUTH={screen:"notif",fromCode:true};render();return}
  enterApp();scheduleFlush(400);
}
async function cloudCode(){
  const code=val("cdCode");const m=document.getElementById("cdMsg");const b=document.querySelector('#codeForm [type=submit]');
  if(String(code).replace(/[^A-Za-z0-9]/g,"").length!==8){m.textContent="Le code contient 8 caractères (XXXX-XXXX).";return}
  busy(b,true,"Vérification…");
  try{const r=await Cloud.fn("invite",{action:"preview",code});
    if(!r.ok){m.textContent=r.message||"Code invalide ou expiré. Vérifie-le auprès de ton coach.";return}
    AUTH={screen:"codeVerify",invite:{code,cloud:true,draft:{first:r.first||"",last:r.last||"",email:r.email||"",sport:r.sport||"",goal:r.goal||"",
      formulaName:r.formula||"",programName:r.program||"",startDate:r.startDate||"",startWeek:+r.startWeek||0,coachName:r.coach||"",emailLocked:!!r.email}}};render()}
  catch(e){m.textContent=authErrText(e)}finally{busy(b,false)}
}
async function cloudAccount(){
  const first=val("acFirst").trim(),last=val("acLast").trim(),email=val("acEmail").trim().toLowerCase(),pass=val("acPass");const msg=document.getElementById("acMsg");
  const ok=document.getElementById("acConsent");const b=document.querySelector('#accountForm [type=submit]');
  if(!first||!last){msg.textContent="Indique ton prénom et ton nom.";return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent="Adresse e-mail invalide.";return}
  if(String(pass).length<10){msg.textContent="Le mot de passe doit contenir au moins 10 caractères.";return}
  if(ok&&!ok.checked){msg.textContent="Coche la case de consentement pour créer ton compte.";ok.focus();return}
  busy(b,true,"Création du compte…");
  try{
    const inv=AUTH.invite;
    if(inv&&inv.cloud){const d=inv.draft;
      const r=await Cloud.fn("invite",{action:"redeem",code:inv.code,email,password:pass,patch:{first,last,sport:d.sport,goal:d.goal},consent:{version:CONSENT_VERSION,health:true}});
      if(!r.ok){msg.textContent=r.message||"Code invalide ou expiré. Vérifie-le auprès de ton coach.";return}
      await Cloud.signIn(r.email||email,pass);await afterCloudAuth(true);return}
    // inscription libre : vérification de l'adresse par e-mail (serveur)
    PL.pendingQuestionnaire={...ans(),source:"inscription"};PL.pendingConsent=true;plSave(true);
    const r=await Cloud.signUp(email,pass,{first_name:first,last_name:last});
    if(r.session){await afterCloudAuth(false);return}
    PL.onboardDraft={...draft(),done:true};plSave(true);AUTH={screen:"checkMail",email};render();
  }catch(e){msg.textContent=authErrText(e)}finally{busy(b,false)}
}
function authCheckMail(){return `<div class="ob center"><h1>Vérifie ta boîte mail</h1><p class="ob-sub">Un lien de confirmation a été envoyé à <b>${esc(AUTH.email||"")}</b>. Ouvre-le sur ce téléphone, puis connecte-toi.</p>
  <div class="ob-foot"><button class="btn full big" data-act="authLogin" data-autofocus>Se connecter</button><button class="btn ghost full" data-act="toIntro">Retour</button></div></div>`}
function authForgot(){return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="authLogin" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>Mot de passe oublié</h1>
  <p class="ob-sub">Indique ton adresse : tu recevras un lien pour choisir un nouveau mot de passe.</p>
  <form class="stack" id="forgotForm" novalidate>${fld("fgEmail","Adresse e-mail","email","",null,'autocomplete="email"')}<p class="small" id="fgMsg" role="status"></p><button class="btn full big" type="submit">Envoyer le lien</button></form></div>`}
async function submitForgot(){const email=val("fgEmail").trim().toLowerCase();const m=document.getElementById("fgMsg");const b=document.querySelector('#forgotForm [type=submit]');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){m.textContent="Adresse e-mail invalide.";return}
  busy(b,true,"Envoi…");try{await Cloud.reset(email);m.textContent="Si un compte existe avec cette adresse, un lien vient d'être envoyé."}catch(e){m.textContent=authErrText(e)}finally{busy(b,false)}}
function authNewPass(){return `<div class="ob"><h1>Nouveau mot de passe</h1><form class="stack" id="newPassForm" novalidate><div class="field"><label for="npPass">Nouveau mot de passe (10 caractères minimum)</label><input id="npPass" type="password" autocomplete="new-password" minlength="10"></div><p class="small" id="npMsg" role="alert"></p><button class="btn full big" type="submit">Enregistrer</button></form></div>`}
async function submitNewPass(){const p=val("npPass");const m=document.getElementById("npMsg");if(String(p).length<10){m.textContent="10 caractères minimum.";return}
  try{await Cloud.newPassword(p);history.replaceState(null,"",location.pathname);await afterCloudAuth(false);toast("Mot de passe modifié")}catch(e){m.textContent=authErrText(e)}}
async function cloudSso(provider){const m=document.getElementById("ssoMsg");try{await Cloud.oauth(provider)}catch(e){if(m)m.textContent=authErrText(e)}}
let LOGOUT_FORCE=false;
async function cloudLogout(all){
  if(!LOGOUT_FORCE){const mine=o=>!o.failed&&o.owner===(Cloud.user&&Cloud.user.id);
    if(navigator.onLine!==false&&(await IDB.outAll()).some(mine))await flushOutbox();
    const left=(await IDB.outAll()).filter(mine).length;
    if(left){openSheet(`<div class="sheet-scroll">`+head("Modifications non envoyées",left+" en attente")+`<p class="small">${left} modification${left>1?"s":""} n'${left>1?"ont":"a"} pas encore été envoyée${left>1?"s":""} au serveur (pas de connexion). Elle${left>1?"s":""} reste${left>1?"nt":""} sur cet appareil et partir${left>1?"ont":"a"} à ta prochaine connexion sur cet appareil.</p></div>
      <div class="sheet-actions"><button class="btn full" data-act="closeSheet">Rester connecté</button><button class="btn danger full" data-logoutforce="${all?1:0}">Se déconnecter quand même</button></div>`);return false}}
  LOGOUT_FORCE=false;await Cloud.signOut(!!all);return true}
/* Démarrage en production : session serveur (ou dernière session connue si hors ligne) */
async function cloudBoot(){
  const q=new URLSearchParams(location.search);let s=await Cloud.session();
  const offline=navigator.onLine===false;
  if(!s&&!(offline&&PL.session&&PL.meta.lastProfile)){PL.session=null;plSave(true);CUR_UID=null;S=defaults();setPeriod();REV++;STORE.live=true;render();return}
  if(s&&q.has("reset")){AUTH={screen:"newPass"};render();return}
  let p=null;
  if(s&&!offline){try{await pullAll();p=Cloud.profile}catch(e){console.warn(e)}}
  if(!p&&PL.meta.lastProfile){p=PL.meta.lastProfile;Cloud.profile=Cloud.profile||p;if(s)Cloud.user=s.user}
  if(!p){render();return}
  PL.meta.lastProfile={id:p.id,role:p.role,legacy_ctx:p.legacy_ctx,first_name:p.first_name,last_name:p.last_name,email:p.email};
  if(!Cloud.ent.length&&PL.meta.lastEnt)Cloud.ent=PL.meta.lastEnt;else PL.meta.lastEnt=Cloud.ent;
  if(p.role==="coach"){if(!PL.session||(PL.session.uid!=="coach"&&PL.session.uid!==LUCAS.uid))startSession("coach");
    if(PL.session.uid==="coach"&&legacyLocalData()&&p.legacy_ctx!==LUCAS.ctx&&!PL.meta.v9migratedAt){AUTH={screen:"migrate"}}}
  else{const lid=localOf(p.id);if(!PL.session||PL.session.uid!==lid)startSession(lid)}
  plSave(true);
  if(isCoachAccount()){CUR_UID=null;S=defaults();setPeriod();REV++;STORE.live=true;render();scheduleFlush(800);return}
  CUR_UID=PL.session.uid;DATA_KEY=dataKeyFor(CUR_UID);S=migrate(loadLocal()||{});ensureSeedTests();setPeriod();REV++;lsWrite();
  render();setTimeout(()=>{checkAwards();STORE.live=true;if(!DLG&&!document.getElementById("player"))render();if(S.active&&!document.getElementById("player"))checkForgotten()},600);
  scheduleFlush(800);
}
/* Invitation créée par le serveur : le code n'est montré qu'une fois */
async function cloudInvite(d,days){const m=document.getElementById("ivMsg");const b=document.querySelector('#inviteForm [type=submit]');busy(b,true,"Création…");
  try{const p=d.programId&&PL.programs[d.programId];
    if(p&&(await IDB.outAll()).some(o=>o.id==="prog|"+p.id))await flushOutbox(); // le programme doit exister sur le serveur
    const r=await Cloud.rpc("create_invite",{p:{draft:{first:d.first,last:d.last,sport:d.sport,goal:d.goal,notes:d.notes},email:d.email||null,formula:d.formula,programRef:p?p.id:null,startDate:d.startDate,startWeek:d.startWeek,days}});
    await pullAll();render();
    openSheet(`<div class="sheet-scroll">`+head("Code d'invitation créé","À transmettre à "+esc(d.first))+`<div class="stack"><p class="code-big num" aria-label="Code ${esc(r.code.split("").join(" "))}">${esc(r.code)}</p>
      <p class="small">Ce code est affiché <b>une seule fois</b> : le serveur ne conserve que son empreinte. Note-le ou copie-le maintenant. Valable jusqu'au ${fmtLong(String(r.expiresAt).slice(0,10))}, utilisable une seule fois, depuis n'importe quel téléphone.</p>
      <button class="btn full" data-copy="${esc(r.code)}">Copier le code</button><button class="btn ghost full" data-act="closeSheet">Fermer</button></div></div>`);
  }catch(e){m.textContent=/program_not_found/.test(e.message)?"Le programme n'est pas encore enregistré sur le serveur : réessaie dans un instant.":"Création impossible : "+(navigator.onLine===false?"pas de connexion.":"réessaie.")}
  finally{busy(b,false)}}
async function cloudRevoke(id){try{await Cloud.rpc("revoke_invite",{p_id:id});await pullAll();render();toast("Code révoqué")}catch(e){toast("Révocation impossible")}}
async function cloudCall(mode,phone,slot){
  if(!can("calls")){toast("Les appels ne font pas partie de ta formule");return false}
  const sid=sidOf(CUR_UID),coach=Cloud.coach&&Cloud.coach.id;if(!sid||!coach){toast("Aucun coach associé à ton compte");return false}
  await enqueue({id:"call|"+uid("c"),kind:"insert",table:"call_requests",row:{ref:uid("call"),coach_id:coach,client_id:sid,mode,phone:phone||null,slot:slot||null},onConflict:"client_id,ref"});return true}
async function cloudExport(){try{const srv=await Cloud.rpc("export_my_data");return srv}catch(e){return null}}
async function cloudDelete(){const r=await Cloud.fn("delete-account",{confirm:"SUPPRIMER"});return r}

/* ---------- Bascule coach ↔ « mon entraînement » (coach qui suit aussi son propre programme) ---------- */
const coachIsAlsoAthlete=()=>!!(PL.accounts[LUCAS.uid]&&PL.accounts.coach&&PL.accounts[LUCAS.uid].sid&&PL.accounts[LUCAS.uid].sid===PL.accounts.coach.sid);
function goMyTraining(){if(!coachIsAlsoAthlete())return;startSession(LUCAS.uid);enterApp()}
function goCoachSpace(){if(!Cloud.isCloud()||!Cloud.profile||Cloud.profile.role!=="coach")return;startSession("coach");CUR_UID=null;S=defaults();setPeriod();REV++;CTAB="dash";AUTH={screen:"intro"};render();window.scrollTo(0,0)}
document.addEventListener("click",ev=>{const t=ev.target.closest("[data-logoutforce],[data-srvrevoke],[data-copy],[data-act='logoutAll'],[data-act='goMyTraining'],[data-act='goCoach'],[data-act='syncNow']");if(!t)return;
  if(t.dataset.logoutforce!=null){LOGOUT_FORCE=true;closeSheet(false);doLogout(t.dataset.logoutforce==="1")}
  else if(t.dataset.srvrevoke){cloudRevoke(t.dataset.srvrevoke)}
  else if(t.dataset.copy!=null){navigator.clipboard&&navigator.clipboard.writeText(t.dataset.copy).then(()=>toast("Copié"),()=>toast("Copie impossible : note le code"))}
  else if(t.dataset.act==="logoutAll"){doLogout(true)}
  else if(t.dataset.act==="goMyTraining"){goMyTraining()}
  else if(t.dataset.act==="goCoach"){goCoachSpace()}
  else if(t.dataset.act==="syncNow"){scheduleFlush(0);pullSoon(200);toast("Synchronisation lancée")}
  ev.stopPropagation()},true);
document.addEventListener("submit",ev=>{const id=ev.target.id;
  if(id==="forgotForm"){ev.preventDefault();submitForgot()}else if(id==="newPassForm"){ev.preventDefault();submitNewPass()}});

/* Liste des invitations lue sur le serveur : le code n'est plus lisible (seuls ses 2 derniers caractères) */
function srvInviteList(){const L=PL.srvInvites||[];const st=i=>i.revokedAt?"révoqué":i.usedAt?"utilisé":Date.parse(i.expiresAt)<Date.now()?"expiré":"actif";
  return `<section class="card"><h3>Codes</h3>${L.length?L.map(i=>`<div class="list-item" style="cursor:default"><div class="grow"><b class="num code">••••-••${esc(i.hint)}</b><div class="small muted">${esc(((i.draft.first||"")+" "+(i.draft.last||"")).trim()||"—")}${i.email?" · "+esc(i.email):""}${i.startDate?" · démarrage "+fmtShort(i.startDate):""} · <span class="chip st-${st(i)==="actif"?"todo":"done"}">${st(i)}</span>${st(i)==="actif"?" jusqu'au "+fmtShort(String(i.expiresAt).slice(0,10)):""}</div></div>${st(i)==="actif"?`<button class="btn danger small" data-srvrevoke="${esc(i.id)}">Révoquer</button>`:""}</div>`).join(""):'<p class="small muted">Aucun code.</p>'}</section>
  <p class="small muted">Le code complet n'est affiché qu'au moment de sa création : le serveur ne conserve que son empreinte. Un code perdu se révoque et se recrée.</p>`}
