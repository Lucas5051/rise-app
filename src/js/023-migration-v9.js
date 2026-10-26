/* =====================================================================
   DOMAINE · MIGRATION DE LA VERSION 9 VERS LE SERVEUR
   Détecte les données locales de la v9 (profil historique de Lucas), impose une sauvegarde JSON
   avant l'import, rattache le programme historique au compte serveur du coach (qui s'entraîne lui-même),
   envoie tests, statuts, durées, RPE, déplacements, questionnaires et réglages, puis vérifie le résultat
   sur le serveur. Relancer l'import ne crée aucun doublon (clés naturelles). Les comptes et messages
   d'exemple de la démonstration ne sont jamais envoyés.
   ===================================================================== */
function legacyLocalData(){
  try{const raw=localStorage.getItem(LS_KEY);if(!raw)return null;const x=JSON.parse(raw);
    if(!x||!(x.profile&&x.profile.ctx===LUCAS.ctx||(Array.isArray(x.tests)&&x.tests.some(t=>t.date==="2026-10-12"))))return null;
    return x}catch(e){return null}
}
function legacyBackupText(){const out={app:APP_CONFIG.name,version:"9",exportedAt:nowISO(),keys:{}};
  try{Object.keys(localStorage).filter(k=>k.startsWith("usci-")).forEach(k=>{if(k==="usci-auth")return;out.keys[k]=localStorage.getItem(k)})}catch(e){}
  return JSON.stringify(out,null,1)}
function authMigrate(){const x=legacyLocalData()||{};const st=x.status||{};
  const nT=(x.tests||[]).length,nS=Object.keys(st).length,nR=Object.values(x.log||{}).filter(l=>isNum(l&&l.rpe)).length,nF=Object.keys(x.fatigue||{}).length;
  return `<div class="ob"><h1>Importer tes données de la version 9</h1>
   <p class="ob-sub">Cet appareil contient ton programme historique et tes séances. Ils vont être envoyés sur ton compte serveur pour être visibles sur tous tes appareils.</p>
   <section class="card stack tight"><p class="small"><b>Trouvé sur cet appareil :</b> ${nT} séance(s) de tests · ${nS} statut(s) de séance · ${nR} RPE · ${nF} questionnaire(s) de ressenti${st["TEST-2026-10-12"]?" · séance de tests du 12/10 : <b>réalisée</b>":""}.</p>
    <p class="small muted">Ne sont pas envoyés : les clients et messages d'exemple de la démonstration.</p></section>
   <ol class="steps-ol small"><li>Télécharge d'abord la sauvegarde complète (obligatoire).</li><li>Lance l'import. Il peut être relancé sans créer de doublon.</li><li>Un rapport vérifie le résultat directement sur le serveur.</li></ol>
   <p class="small" id="migMsg" role="status"></p>
   <div class="ob-foot"><button class="btn secondary full" data-act="migBackup" data-autofocus>1. Télécharger la sauvegarde JSON</button>
    <button class="btn full big" data-act="migRun" ${PL.meta.v9backupAt?"":"disabled"}>2. Importer mes données</button><button class="btn ghost full" data-act="migLater">Plus tard</button></div></div>`}
async function runMigration(){
  const m=document.getElementById("migMsg");const say=t=>{if(m)m.textContent=t};const rep={startedAt:nowISO(),steps:[],checks:[]};
  try{
    const raw=legacyLocalData();if(!raw)throw new Error("Aucune donnée v9 trouvée");
    say("Rattachement du programme historique…");
    await Cloud.rpc("claim_legacy_ctx",{p_ctx:LUCAS.ctx});rep.steps.push("Programme historique rattaché à ton compte (coach qui s'entraîne lui-même).");
    const csid=Cloud.profile.id;PL.accounts.coach={...(PL.accounts.coach||{}),id:"coach",sid:csid,role:"coach"};
    PL.accounts[LUCAS.uid]={...(PL.accounts[LUCAS.uid]||{id:LUCAS.uid,role:"athlete",...LUCAS.identity,createdAt:nowISO()}),sid:csid,role:"athlete",dataKey:LS_KEY,coachId:"coach",formula:"coaching",programId:LUCAS.programId};
    ensureLucasProgram();plSave(true);
    const st=migrate(raw);const saved=CUR_UID;CUR_UID=LUCAS.uid;ensureSeedTests();CUR_UID=saved;
    try{localStorage.setItem(LS_KEY,JSON.stringify(st))}catch(e){}
    say("Préparation des envois…");
    const prevSession=PL.session;startSession("coach");await queueCoach(true);
    await queueAthlete(LUCAS.uid,st);rep.steps.push("Tests, statuts, durées, RPE, déplacements, questionnaires, activités et réglages mis en file d'envoi.");
    say("Envoi au serveur…");await flushOutbox();
    for(let i=0;i<5&&(await IDB.outAll()).some(o=>!o.failed);i++){await new Promise(r=>setTimeout(r,1500));await flushOutbox()}
    const left=(await IDB.outAll());const failed=left.filter(o=>o.failed);
    if(left.some(o=>!o.failed))rep.steps.push(left.filter(o=>!o.failed).length+" envoi(s) encore en attente (connexion) : ils partiront automatiquement.");
    if(failed.length)rep.steps.push(failed.length+" envoi(s) refusé(s) par le serveur : "+failed.slice(0,3).map(o=>o.table||o.fn).join(", "));
    say("Vérification sur le serveur…");
    const srv=await Cloud.rpc("athlete_snapshot");const back=rowsToState(srv);
    const chk=(ok,t)=>rep.checks.push({ok:!!ok,t});
    chk((srv.profile||{}).legacy_ctx===LUCAS.ctx,"Profil rattaché au programme historique « lucas-2026 »");
    chk(back.tests.length===st.tests.length,`Tests : ${back.tests.length}/${st.tests.length} séance(s) de tests retrouvées`);
    const t12=back.tests.find(t=>t.date==="2026-10-12"),l12=st.tests.find(t=>t.date==="2026-10-12");
    chk(t12&&l12&&Object.keys(l12).filter(k=>typeof l12[k]==="number").every(k=>t12[k]===l12[k]),"Résultats du 12/10 identiques (squat, développé couché, soulevé de terre, CMJ, tractions, poids)");
    chk(back.status["TEST-2026-10-12"]&&back.status["TEST-2026-10-12"].s==="done","Séance de tests du 12/10 : réalisée");
    const same=k=>JSON.stringify(Object.keys(st[k]||{}).sort())===JSON.stringify(Object.keys(back[k]||{}).sort());
    chk(same("status"),`Statuts : ${Object.keys(back.status).length}/${Object.keys(st.status).length}`);
    chk(same("log"),`Durées et RPE : ${Object.keys(back.log).length}/${Object.keys(st.log).length} séance(s)`);
    chk(same("moves"),`Déplacements : ${Object.keys(back.moves).length}/${Object.keys(st.moves).length}`);
    chk(same("fatigue"),`Questionnaires de ressenti : ${Object.keys(back.fatigue).length}/${Object.keys(st.fatigue).length}`);
    chk(same("other")&&same("club"),"Autres activités et séances club conservées");
    const asg=await Cloud.rpc("assignments_json");chk(asg.some(a=>a.id===LUCAS.assignmentId&&a.status==="active"),"Programme historique attribué et actif");
    rep.ok=rep.checks.every(c=>c.ok);rep.finishedAt=nowISO();PL.meta.v9report=rep;PL.meta.v9migratedAt=rep.ok?nowISO():null;plSave(true);
    PL.session=prevSession;AUTH={screen:"migReport"};render();
  }catch(e){rep.error=String(e.message||e);PL.meta.v9report=rep;plSave(true);say("Import interrompu : "+(navigator.onLine===false?"pas de connexion.":rep.error)+" Tes données locales sont intactes ; tu peux relancer.")}
}
function authMigReport(){const r=PL.meta.v9report||{checks:[],steps:[]};
  return `<div class="ob"><h1>${r.ok?"Import terminé":"Import à vérifier"}</h1><p class="ob-sub">Rapport de migration du ${r.finishedAt?whenLabel(Date.parse(r.finishedAt)):"—"}.</p>
   <section class="card stack tight"><h3>Vérifications sur le serveur</h3><ul class="clean">${r.checks.map(c=>`<li class="row" style="gap:8px">${c.ok?ICONS.check:ICONS.cross}<span class="small"><span class="sr-only">${c.ok?"Conforme":"Écart"} : </span>${esc(c.t)}</span></li>`).join("")}</ul></section>
   <section class="card stack tight"><h3>Étapes</h3>${r.steps.map(s=>`<p class="small">${esc(s)}</p>`).join("")}</section>
   <div class="ob-foot"><button class="btn secondary full" data-act="migReportDl">Télécharger le rapport</button><button class="btn full big" data-act="migDone" data-autofocus>Continuer</button></div></div>`}
function migClick(act){
  if(act==="migBackup"){downloadText("usci-muscu-v9-sauvegarde-"+todayISO()+".json",legacyBackupText(),"application/json");PL.meta.v9backupAt=nowISO();plSave(true);render();toast("Sauvegarde téléchargée");return true}
  if(act==="migRun"){if(!PL.meta.v9backupAt){toast("Télécharge d'abord la sauvegarde");return true}runMigration();return true}
  if(act==="migLater"||act==="migDone"){AUTH={screen:"intro"};startSession("coach");render();return true}
  if(act==="migReportDl"){downloadText("usci-muscu-rapport-migration-v9.json",JSON.stringify(PL.meta.v9report,null,1),"application/json");return true}
  return false}
/* ---------- Import depuis un FICHIER (autre adresse que la v9) ----------
   Les données de la v9 sont rangées dans le navigateur, à l'adresse où la v9 était ouverte. Une appli hébergée
   ailleurs (autre adresse) ne peut pas les lire : on passe alors par un fichier. Formats acceptés :
   - l'export de la v9 (engrenage › Export des données › « Exporter tout (JSON) ») ;
   - la sauvegarde complète créée par l'étape 1 de la migration v10 ({keys:{"usci-muscu-state-v1":…}}).
   Le fichier est seulement converti et rangé sur cet appareil ; l'import vers le serveur reste l'écran habituel
   (sauvegarde obligatoire, rapport, aucune donnée de démonstration envoyée). */
function v9FileToState(o){
  if(!isObj(o))return null;
  if(isObj(o.keys)&&typeof o.keys[LS_KEY]==="string"){try{return JSON.parse(o.keys[LS_KEY])}catch(e){return null}}
  if(isObj(o.export)&&isObj(o.seances)){const s=o.seances||{},p=o.progressions||{};
    return{v:4,profile:o.profil||{},tests:Array.isArray(o.tests)?o.tests:[],status:s.statuts||{},log:s.journal||{},moves:s.deplacements||{},adapt:s.adaptations||{},cond:s.variantes||{},
      club:o.clubEtMatchs||{},other:o.autresActivites||{},fatigue:o.questionnaires||{},hr:o.donneesCardiaques||{},loadAdj:p.ajustements||{},loadAdjLog:p.historique||[],
      awards:o.badges||{},rewards:o.recompenses||{},settings:o.reglages||{},meta:{migrations:o.historiqueMigrations||[],importedFrom:"fichier export v"+((o.export||{}).appVersion||"9")},legacy:o.archives||undefined}}
  if(Array.isArray(o.tests)&&isObj(o.status))return o; // état brut
  return null}
function v9ImportCard(){if(!Cloud.isCloud())return"";
  return `<section class="card stack tight"><h3>Données de la version 9</h3>
   <p class="small">Si tu utilisais la v9 à une autre adresse (ou sur un autre appareil), exporte d'abord tes données depuis la v9 (engrenage › Export des données › « Exporter tout (JSON) »), puis choisis le fichier ici.</p>
   <label class="btn secondary full" for="v9File">Choisir le fichier JSON de la v9</label><input type="file" id="v9File" accept=".json,application/json" class="sr-only">
   <p class="small" id="v9Msg" role="status"></p></section>`}
document.addEventListener("change",ev=>{if(ev.target.id!=="v9File"||!isCoachAccount())return;const f=ev.target.files&&ev.target.files[0];const m=document.getElementById("v9Msg");
  if(!f)return;if(f.size>20e6){m.textContent="Fichier trop lourd (20 Mo maximum).";return}
  const r=new FileReader();r.onload=()=>{let st=null;try{st=v9FileToState(JSON.parse(r.result))}catch(e){}
    if(!st){m.textContent="Ce fichier n'est pas un export de la v9 d'USCI Muscu.";return}
    if(!(st.profile&&st.profile.ctx===LUCAS.ctx||(st.tests||[]).some(t=>t&&t.date==="2026-10-12"))){m.textContent="Ce fichier ne contient pas le programme historique (tests du 12/10) : rien n'est importé.";return}
    const cur=legacyLocalData();
    if(cur&&Object.keys(cur.status||{}).length>Object.keys(st.status||{}).length){m.textContent="Cet appareil contient déjà plus de données v9 que le fichier : le fichier n'est pas utilisé. Lance l'import depuis l'écran suivant.";}
    else{try{localStorage.setItem(LS_KEY,JSON.stringify(st))}catch(e){m.textContent="Stockage de l'appareil plein : import impossible.";return}}
    PL.meta.v9migratedAt=null;PL.meta.v9backupAt=null;plSave(true);AUTH={screen:"migrate"};render();window.scrollTo(0,0)};
  r.onerror=()=>{m.textContent="Lecture du fichier impossible."};r.readAsText(f)});
