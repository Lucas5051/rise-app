/* =====================================================================
   MODULE 25 · PARAMÈTRES (engrenage en haut à droite)
   ===================================================================== */
const SET_ITEMS=[["profil","Profil"],["compte","Compte"],["notif","Notifications"],["widget","Widget"],["appareils","Appareils connectés"],["unites","Unités"],["securite","Sécurité et Face ID"],["confid","Confidentialité"],["export","Export des données"],["suppr","Suppression des données"]];
const units=()=>(PL&&PL.prefs&&PL.prefs.units)==="lb"?"lb":"kg";
const wStr=(kg,d=1)=>units()==="lb"?fmt(kg*2.20462,d)+" lb":fmt(kg,d)+" kg";
function viewSettings(){
  const a=me();
  let h=`<header class="top"><button class="icon-btn" data-act="${SET_PAGE?"setBack":"closeSettings"}" aria-label="${SET_PAGE?"Retour aux paramètres":"Fermer les paramètres"}">${ICONS.back}</button><div class="grow" style="margin-left:10px"><div class="eyebrow">Paramètres</div><h1>${SET_PAGE?esc((SET_ITEMS.find(x=>x[0]===SET_PAGE)||[0,""])[1]):"Paramètres"}</h1></div></header><div class="stack">`;
  if(!SET_PAGE){
    h+=`<section class="card me-card"><span class="avatar" aria-hidden="true">${esc(((a.first||"?")[0]+(a.last||"")[0]||"").toUpperCase())}</span><div class="grow"><b>${esc(accountName(a))}</b><div class="small muted">${esc(a.email||"Adresse e-mail non renseignée")}</div></div></section>`;
    h+=`<nav class="card set-list" aria-label="Rubriques">${SET_ITEMS.map(([k,l])=>`<button class="list-item" data-setpage="${k}"><div class="grow"><b>${l}</b></div>${ICONS.chevron}</button>`).join("")}</nav>`;
    h+=`<section class="card stack tight"><h3>Synchronisation</h3><p class="small" id="syncLine">${esc(syncLabel().t)}</p>${Cloud.isCloud()?`<button class="btn ghost small" data-act="syncNow">Synchroniser maintenant</button>`:""}</section>`;
    if(Cloud.isCloud()&&Cloud.profile&&Cloud.profile.role==="coach")h+=`<button class="btn secondary full" data-act="goCoach">Aller à l'espace coach</button>`;
    h+=`<button class="btn danger full" data-act="logout">Se déconnecter</button>`;
    if(Cloud.isCloud())h+=`<button class="btn ghost full" data-act="logoutAll">Se déconnecter de tous mes appareils</button>`;
    return h+`</div>`;
  }
  h+=({profil:setProfil,compte:setCompte,notif:setNotif,widget:setWidget,appareils:setDevices,unites:setUnits,securite:setSecurity,confid:setPrivacy,export:setExport,suppr:setDelete}[SET_PAGE]||(()=>""))();
  return h+`</div>`;
}
function setProfil(){const p=S.profile||{};
  return `<section class="card stack"><h3>Identité</h3><div class="grid2">${fld("pfirst","Prénom","text",me().first)}${fld("plast","Nom","text",me().last)}</div>
   ${planActive()?`<div class="grid2"><div class="field"><label for="spos">Poste principal</label><input id="spos" value="${esc(S.settings.pos)}"></div><div class="field"><label for="spos2">Poste secondaire</label><input id="spos2" value="${esc(S.settings.pos2)}"></div></div>`:""}
   ${fld("pbw","Poids de corps (kg)","number",S.settings.bw,"0.1")}
   <button class="btn secondary full" data-act="saveProfil">Enregistrer</button></section>
   <section class="card stack"><h3>Réglages des charges</h3><div class="grid2">${fld("sbar","Incrément barre (kg)","number",S.settings.barInc,"0.5")}${fld("sdb","Incrément haltères (kg)","number",S.settings.dbInc,"0.5")}</div>
   ${Object.keys(S.loadAdj).filter(k=>S.loadAdj[k]).length?`<p class="small">Progressions confirmées : ${Object.entries(S.loadAdj).filter(([,v])=>v).map(([k,v])=>LIFT_NAME[k]+" "+(v>0?"+":"")+fmt(v)+" kg").join(" · ")} <button type="button" class="btn ghost small" data-act="resetAdj">Remettre à zéro</button></p>`:""}
   <button class="btn secondary full" data-act="saveSettings">Enregistrer</button></section>
   ${p.onboarding?`<details class="fold"><summary>Réponses de l'inscription</summary><div class="fold-body small">${onboardSummary(p.onboarding)}</div></details>`:""}`}
function setCompte(){const a=me();const f=a.formula&&PL.formulas[a.formula];
  return `<section class="card stack"><h3>Compte</h3>${fld("aemail","Adresse e-mail","email",a.email||"")}<p class="small muted">Connexion : ${esc({email:"e-mail",apple:"Apple",google:"Google",migration:"compte historique sur cet appareil",invite:"code coach"}[a.provider]||a.provider)}.</p>
   <button class="btn secondary full" data-act="saveCompte">Enregistrer</button></section>
   <section class="card"><h3>Formule</h3><p class="small" style="margin-top:4px">${f?esc(f.name):"Aucune formule choisie"}${a.coachId?" · suivi par ton coach":""}</p>${a.coachId?"":`<button class="btn secondary full" style="margin-top:10px" data-act="showOffers">Voir les formules</button>`}</section>
   <section class="card"><h3>Mot de passe</h3><p class="small muted" style="margin-top:4px">Le mot de passe est géré par le serveur d'authentification : il n'est jamais enregistré sur cet appareil. Dans ce prototype, aucun mot de passe n'est conservé ni vérifié.</p></section>`}
function setNotif(){const r=remCfg();
  return `<section class="card stack"><h3>Rappel du questionnaire de ressenti</h3><p class="small">${r.on?"Activé : "+r.times.map(x=>x.replace(":","h")).join(", "):"Désactivé"}</p><button class="btn secondary full" data-act="openReminders">Régler les rappels</button></section>
   <section class="card stack"><h3>Autres rappels</h3><ul class="clean small"><li>RPE environ 30 min après la fin d'une séance.</li><li>Séance non terminée : rappel après l'heure de fin estimée, puis un second rappel.</li></ul>
   <p class="small muted">Sur iPhone, ces notifications fonctionnent dans l'appli installée (couche native). Dans ce prototype web, elles s'affichent seulement quand l'appli est ouverte.</p>
   <button class="btn secondary full" data-act="askNotifPerm">${"Notification" in window&&Notification.permission==="granted"?"Notifications du navigateur autorisées":"Autoriser les notifications"}</button></section>`}
function widgetPreview(){const t=todayISO(),mon=addDays(t,-((D(t).getDay()+6)%7)),start=addDays(mon,-21);let cells="";
  for(let i=0;i<28;i++){const d=addDays(start,i);const ss=sessions().filter(s=>s.date===d&&!isOpt(s));const done=ss.some(isDone);cells+=`<i class="${done?"on":ss.length?"pl":""} ${d===t?"td":""}" aria-hidden="true">${done?"✓":""}</i>`}
  return `<div class="widget-prev" role="img" aria-label="Aperçu du widget : séances prévues et réalisées des 4 dernières semaines, série en cours ${sStats().best}"><div class="row between"><b>${cap(MOIS[D(t).getMonth()])}</b><span class="wp-streak">${ICONS.check}${streak()}</span></div><div class="wp-dow">${["L","M","M","J","V","S","D"].map(x=>`<span>${x}</span>`).join("")}</div><div class="wp-grid">${cells}</div></div>`}
function setWidget(){return `<section class="card stack"><h3>Widget d'écran d'accueil</h3>${widgetPreview()}
   <p class="small">Il affichera tes séances prévues, tes séances réalisées, ta série en cours et un aperçu du calendrier.</p>
   <p class="small muted">Disponible avec l'appli iPhone (extension WidgetKit). Le prototype web ne peut pas ajouter de widget : l'aperçu ci-dessus montre ce qu'il affichera.</p></section>`}
function setDevices(){const hm=+S.settings.hrMax;
  return `<section class="card" id="polarCard" aria-live="polite"></section>
   <details class="fold"><summary>Saisir ou importer un résumé de séance</summary><div class="fold-body stack">
    <p class="small muted">Saisis les valeurs affichées par l'appli de ta montre ou de ta ceinture, ou importe un fichier (TCX recommandé, CSV pris en charge au mieux).</p>
    <div class="grid2">${fld("hrDate","Date","date",todayISO())}${fld("hrDur","Durée (min)","number","","1")}${fld("hrAvgIn","FC moyenne","number","","1")}${fld("hrMaxIn","FC maximale","number","","1")}</div>
    <details class="fold"><summary>Temps par zone (min, facultatif)</summary><div class="fold-body grid3">${[1,2,3,4,5].map(z=>fld("hrZ"+z,"Zone "+z,"number","","1")).join("")}</div></details>
    <button class="btn secondary full" data-act="saveHrManual">Enregistrer le résumé</button>
    <div class="field"><label for="hrFile">Importer un fichier (.tcx, .csv)</label><input id="hrFile" type="file" accept=".tcx,.csv,.xml,text/csv,application/xml"></div><p class="small" id="hrImportMsg" role="status"></p></div></details>
   <section class="card stack"><h3>Fréquence cardiaque maximale</h3><p class="small muted">Jamais calculée avec une formule générique (220 − âge) : renseigne une valeur mesurée.</p>
   <div class="grid2">${fld("shm","FC max mesurée (bpm)","number",S.settings.hrMax,"1")}<div class="field"><label for="shms">Origine</label><select id="shms">${["","Test terrain","Polar (profil)","Maximum relevé en match","Autre"].map(o=>`<option ${S.settings.hrMaxSource===o?"selected":""} value="${o}">${o||"—"}</option>`).join("")}</select></div></div>
   ${hm?`<p class="small">Zones : ${ZONES.map((z,i)=>"Z"+(i+1)+" "+Math.round(z[0]*hm)+"–"+Math.min(hm,Math.round(z[1]*hm))).join(" · ")} bpm (convention Polar).</p>`:""}
   <button class="btn secondary full" data-act="saveHrSettings">Enregistrer</button></section>
   <section class="card"><h3>Autres appareils</h3><ul class="clean small" style="margin-top:6px"><li>Apple Santé et Apple Watch : avec l'appli iPhone (HealthKit).</li><li>Montres et bracelets (Garmin, WHOOP…), bague Oura, gilet GPS : connexion par leurs services officiels, côté serveur.</li></ul><p class="small muted" style="margin-top:6px">Aucune de ces connexions n'est active dans ce prototype.</p></section>`}
function setUnits(){return `<section class="card stack"><h3>Unité de poids</h3><div class="seg" role="radiogroup" aria-label="Unité de poids">${[["kg","Kilogrammes (kg)"],["lb","Livres (lb)"]].map(([k,l])=>`<button role="radio" aria-checked="${units()===k}" data-units="${k}">${l}</button>`).join("")}</div><p class="small muted">Les calculs restent faits en kilogrammes ; seul l'affichage change.</p></section>`}
function setSecurity(){const a=me(),nat=Native.has("biometric");
  return `<section class="card stack"><h3>Face ID</h3><p class="small">${a.faceId?"Activé pour ce compte.":"Désactivé."}</p>
   ${nat?`<button class="btn secondary full" data-act="toggleFaceId">${a.faceId?"Désactiver Face ID":"Activer Face ID"}</button>`:`<p class="small muted">Face ID et le code de déverrouillage de l'iPhone fonctionnent seulement dans l'appli iPhone installée. Le prototype web ne peut pas les utiliser : aucune protection biométrique n'est active ici.</p>`}</section>
   <section class="card"><h3>Session</h3><p class="small" style="margin-top:4px">Connecté depuis le ${PL.session&&PL.session.at?fmtShort(PL.session.at.slice(0,10)):"—"} · expire le ${PL.session?fmtShort(iso(new Date(PL.session.exp))):"—"}.</p><p class="small muted" style="margin-top:6px">Dans l'appli iPhone, le jeton de session sera rangé dans le trousseau iOS (jamais le mot de passe).</p></section>`}
function setPrivacy(){return `<section class="card stack"><h3>Tes données</h3><ul class="clean small"><li>Dans ce prototype, tout est enregistré sur cet appareil (stockage local du navigateur).</li><li>Données de ressenti, séances, tests, messages : visibles par toi et, si tu as un coach, par lui seul.</li><li>Aucun mot de passe n'est conservé sur l'appareil.</li><li>Tu peux exporter ou supprimer tes données à tout moment.</li></ul>
   <p class="small muted">${esc(syncText())}. Structure version ${S.v}.</p>
   ${S.meta.migrations.length?`<details class="fold"><summary>Historique des migrations</summary><div class="fold-body"><ul class="clean tiny">${S.meta.migrations.map(m=>`<li>${esc(String(m.from))} → ${esc(String(m.to))} (${esc((m.at||"").slice(0,10))}) : ${esc((m.notes||[]).join(" ; ")||"aucun changement")}</li>`).join("")}</ul></div></details>`:""}</section>`}
function setExport(){const b=exportBundle();return `<section class="card stack"><h3>Exporter toutes mes données</h3><p class="small">Le fichier JSON contient tout ce qui appartient à ton compte : profil, réponses d'inscription, programme attribué, calendrier, séances, durées, RPE, tests, questionnaires, données cardiaques, adaptations, commentaires, badges, récompenses, messages, demandes d'appel, formule, appareils, consentements et historique des corrections.</p>
   ${b?exportPreview(b):""}
   <button class="btn full" data-act="export">Exporter tout (JSON)</button>
   <div class="grid2"><button class="btn secondary" data-act="exportCsv" data-kind="seances">Séances (CSV)</button><button class="btn secondary" data-act="exportCsv" data-kind="questionnaires">Questionnaires (CSV)</button></div>
   <p class="tiny muted">Export du ${fmtLong(todayISO())} · version ${esc(APP_CONFIG.version)} · structure ${APP_CONFIG.schema}.</p></section>`}
function setDelete(){return `<section class="card stack"><h3>Supprimer mon compte</h3><p class="small">Efface ton compte et toutes tes données personnelles de cet appareil (messages privés compris ; tes messages de groupe sont anonymisés). Tu verras le détail et pourras exporter avant de confirmer.</p><button class="btn danger full" data-act="askDelete">Supprimer mon compte et mes données</button></section>`}

