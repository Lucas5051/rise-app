/* =====================================================================
   DOMAINE · DONNÉES PERSONNELLES (export complet, suppression complète)
   Export : tout ce qui appartient au compte connecté, jamais le mot de passe (non stocké), ni les jetons, ni les données
   d'autres clients. Suppression : nettoyage réel de TOUTES les structures locales ; ce qui doit rester (journaux) est anonymisé.
   Côté serveur : voir docs/DONNEES-RGPD.md.
   ===================================================================== */
const anonRef=uid=>"anonyme-"+[...String(uid)].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,7).toString(36).replace("-","x");
function exportBundle(){
  const uid=CUR_UID,acc=PL.accounts[uid];if(!acc)return null;
  const {dataKey,...account}=acc;                       // la clé de stockage interne n'est pas une donnée personnelle
  const msgs=msgList().filter(m=>m.th===uid||(m.th==="group"&&authorOf(m)===uid)).map(m=>({...m,media:m.media?{type:m.media.type,name:m.media.name,src:m.media.src?"(image incluse)":null,note:m.media.src?null:"vidéo non conservée"}:null,imageData:m.media&&m.media.src||undefined}));
  const asg=assignmentsOf(uid).map(a=>({...a}));
  const {active,...sport}=S;
  return{
    export:{app:APP_CONFIG.name,appVersion:APP_CONFIG.version,schema:APP_CONFIG.schema,exportedAt:nowISO(),format:"JSON",contenu:"Toutes les données de ce compte sur cet appareil. Aucun mot de passe, jeton ou secret, aucune donnée d'un autre client."},
    compte:account,
    profil:S.profile||{},
    inscription:(acc.id===(PL.onboardDraft||{}).accountId?PL.onboardDraft.answers:(S.profile||{}).onboarding)||null,
    entretienCoach:(S.profile||{}).interview||null,
    formule:{formula:acc.formula||null,choix:acc.formulaRequest||null},
    programmesAttribues:asg,
    calendrier:sessions().map(s=>({id:s.id,date:s.date,dateInitiale:s.origDate,seance:tpl(s).name,statut:displayStatus(s)})),
    seances:{statuts:S.status,journal:S.log,deplacements:S.moves,adaptations:S.adapt,variantes:S.cond,seanceEnCours:active||null},
    clubEtMatchs:S.club,autresActivites:S.other,
    questionnaires:S.fatigue,
    tests:S.tests,
    donneesCardiaques:S.hr,
    progressions:{ajustements:S.loadAdj,historique:S.loadAdjLog},
    badges:S.awards,recompenses:S.rewards,
    messages:msgs,
    demandesAppel:(PL.callRequests||[]).filter(c=>c.uid===uid),
    appareils:{polar:{consentement:S.settings.consent||null,fcMax:S.settings.hrMax||null,simulation:!!S.settings.mock}},
    consentements:{notifications:PL.prefs.notif??null,faceId:!!acc.faceId,polar:S.settings.consent||null},
    reglages:S.settings,
    correctionsDeDuree:Object.entries(S.log).filter(([,l])=>l&&l.durHist).map(([id,l])=>({seance:id,historique:l.durHist})),
    medias:msgs.filter(m=>m.media).map(m=>({message:m.id,type:m.media.type,nom:m.media.name})),
    historiqueMigrations:S.meta.migrations,
    archives:S.legacy
  }}
function exportPreview(b){const rows=[["Compte et profil",1],["Programmes attribués",b.programmesAttribues.length],["Séances du calendrier",b.calendrier.length],["Séances renseignées",Object.keys(b.seances.statuts).length],["Questionnaires",Object.keys(b.questionnaires).length],["Tests",b.tests.length],["Données cardiaques",b.donneesCardiaques.length],["Messages",b.messages.length],["Demandes d'appel",b.demandesAppel.length],["Badges",Object.keys(b.badges).length],["Corrections de durée",b.correctionsDeDuree.length]];
  return `<table class="export-sum"><tbody>${rows.map(([l,n])=>`<tr><td>${l}</td><td class="num"><b>${n}</b></td></tr>`).join("")}</tbody></table><p class="tiny muted">Exclus : mot de passe (jamais stocké), jeton de session, secrets techniques, données des autres clients.</p>`}
async function downloadText(filename,text,mime){
  try{if(window.claude&&window.claude.use){const dl=await window.claude.use("downloads");if(dl){await dl.save({filename,data:text});toast("Fichier proposé au téléchargement");return true}}}catch(e){if(e&&e.code==="declined"){toast("Export annulé");return true}}
  try{const blob=new Blob([text],{type:mime});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast("Fichier téléchargé");return true}catch(e){return false}}
async function exportData(){let b=exportBundle();if(!b)return;
  if(Cloud.isCloud()){const srv=await cloudExport();if(srv)b={...b,serveur:srv,source:"serveur + copie de cet appareil"};else toast("Serveur injoignable : export de la copie de cet appareil uniquement")}
  const txt=JSON.stringify(b,null,2);
  const ok=await downloadText("export-"+APP_CONFIG.shortName.toLowerCase()+"-"+todayISO()+".json",txt,"application/json");
  if(!ok)openSheet(`<div class="sheet-scroll">${head("Exporter","Mes données (JSON)")}<p class="small muted" style="margin-bottom:8px">Le téléchargement n'est pas disponible ici : copie le texte.</p><textarea class="export" id="exportTxt" readonly aria-label="Données exportées">${esc(txt)}</textarea><button class="btn secondary full" data-act="copyExport" style="margin-top:10px">Copier</button></div>`,"Export")}
const csvCell=v=>{const s=v==null?"":String(v);return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
function csvOf(rows){return "﻿"+rows.map(r=>r.map(csvCell).join(";")).join("\n")}
function exportCsv(kind){
  if(kind==="seances"){const rows=[["Date","Séance","Statut","Raison","Commentaire","Durée réelle (min)","Durée à confirmer","Source de la durée","RPE","sRPE (UA)","Tonnage (kg)"]];
    sessions().forEach(s=>{const st=S.status[s.id]||{},l=S.log[s.id]||{};rows.push([s.date,tpl(s).name,STATUS_LABEL[displayStatus(s)],st.reason?reasonLabel(st.reason):"",st.comment||"",l.dur??"",l.durPending?"oui":"",l.durSrc||"",l.rpe??"",srpe(l)??"",l.ton||""])});
    downloadText("seances-"+todayISO()+".csv",csvOf(rows),"text/csv")}
  else{const rows=[["Date","Score /100","Sommeil","Fraîcheur","Stress","Courbatures","Douleurs","Commentaire"]];
    Object.keys(S.fatigue).sort().forEach(d=>{const f=S.fatigue[d]||{},i=f.items||{};rows.push([d,f.score??"",i.sommeil??"",i.fatigue??"",i.stress??"",i.courbatures??"",i.douleur??"",f.comment||""])});
    downloadText("questionnaires-"+todayISO()+".csv",csvOf(rows),"text/csv")}}
/* ---------- Suppression du compte ---------- */
function openDeleteAccount(){const b=exportBundle();sheetMode="delete";
  openSheet(`<div class="sheet-scroll">${head("Supprimer mon compte","Ce qui sera supprimé")}<div class="stack">
   <ul class="clean small"><li>Ton compte, ton profil et tes réponses d'inscription.</li><li>Toutes tes données sportives : séances, statuts, durées, RPE, tests, questionnaires, données cardiaques, badges, récompenses.</li><li>Tes messages privés avec le coach ; dans le groupe, tes messages sont anonymisés et tes photos retirées.</li><li>Tes demandes d'appel, ton programme attribué, ton code d'invitation (rendu anonyme).</li><li>Dans le journal du coach, ton nom est remplacé par une référence anonyme.</li></ul>
   ${Cloud.isCloud()?`<p class="small">La suppression est faite <b>sur le serveur</b> (compte, données, fichiers) puis sur cet appareil. Il faut être connecté à internet.</p>`:""}<p class="small"><b>Les autres clients et leurs données ne sont pas touchés.</b> Cette action est définitive.</p>
   ${b?exportPreview(b):""}
   <button class="btn secondary full" data-act="export">Exporter mes données d'abord</button>
   <div class="field"><label for="delConfirm">Pour confirmer, écris SUPPRIMER</label><input id="delConfirm" autocomplete="off" autocapitalize="characters"></div>
   <p class="small" id="delMsg" role="alert"></p></div></div>
   <div class="sheet-actions"><button class="btn danger full" data-act="confirmDelete">Supprimer définitivement</button><button class="btn ghost full" data-act="closeSheet">Annuler</button></div>`,"Supprimer mon compte")}
async function deleteAccountConfirmed(){
  if(val("delConfirm").trim().toUpperCase()!=="SUPPRIMER"){document.getElementById("delMsg").textContent="Écris SUPPRIMER pour confirmer.";document.getElementById("delConfirm").focus();return}
  const uid=CUR_UID;if(!uid)return;
  if(Cloud.isCloud()){const m=document.getElementById("delMsg");m.textContent="Suppression sur le serveur…";
    const r=await cloudDelete();if(!r.ok){m.textContent=r.message||(navigator.onLine===false?"Pas de connexion : la suppression doit être faite en ligne.":"Suppression impossible pour le moment. Réessaie.");return}
    const sid=sidOf(uid);try{for(const o of await IDB.outAll())if(o.owner===sid)await IDB.outDel(o.id);await IDB.del("sync-h:"+sid)}catch(e){}
    purgeAccount(uid);LOGOUT_FORCE=true;closeSheet(false);await doLogout();toast("Compte supprimé sur le serveur ("+(r.filesRemoved||0)+" fichier(s), messages de groupe anonymisés)");return}
  const report=purgeAccount(uid);
  if(uid===LUCAS.uid&&STORE.dbRef){try{await STORE.dbRef.delete()}catch(e){}}
  closeSheet(false);doLogout();toast("Compte supprimé : "+report.join(", "));
}
/* Nettoyage réel de toutes les structures locales. Renvoie le résumé de ce qui a été fait. */
function purgeAccount(uid){const out=[];const ref=anonRef(uid);const acc=PL.accounts[uid];const nm=acc?accountName(acc):"";
  try{localStorage.removeItem(dataKeyFor(uid));out.push("données sportives")}catch(e){}
  if(uid===LUCAS.uid){Object.keys(localStorage).filter(k=>k.startsWith("usci-muscu-backup-")||k.startsWith("usci-muscu-state-v1-illisible")).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});out.push("sauvegardes de migration")}
  delete PL.accounts[uid];out.push("compte et profil");
  const before=msgList().length;
  if(isObj(PL.msgs)&&Array.isArray(PL.msgs.list)){PL.msgs.list=PL.msgs.list.filter(m=>m.th!==uid).map(m=>m.th==="group"&&m.who===uid?{...m,who:ref,media:null,anonymized:true}:m)}
  out.push((before-msgList().length)+" messages privés supprimés");
  PL.callRequests=(PL.callRequests||[]).filter(c=>c.uid!==uid);
  Object.keys(PL.assignments||{}).forEach(id=>{if(PL.assignments[id].clientId===uid)delete PL.assignments[id]});out.push("programme attribué");
  (PL.invites||[]).forEach(i=>{if(i.usedBy===uid){i.usedBy=ref;i.draft={formula:i.draft.formula,programId:i.draft.programId,anonymized:true}}});
  (PL.coachLog||[]).forEach(l=>{if(l.uid===uid){l.uid=ref;l.what=nm?l.what.split(nm).join(ref):l.what}else if(nm&&l.what&&l.what.includes(nm))l.what=l.what.split(nm).join(ref)});
  if(PL.onboardDraft&&PL.onboardDraft.accountId===uid)PL.onboardDraft=null;
  PL.meta.deletions=PL.meta.deletions||[];PL.meta.deletions.push({ref,at:nowISO()});
  plSave();out.push("références anonymisées");return out}
document.addEventListener("click",async ev=>{if(!ev.target.closest('[data-act="copyExport"]'))return;const ta=document.getElementById("exportTxt");try{await navigator.clipboard.writeText(ta.value);toast("Copié")}catch(e){ta.focus();ta.select();toast("Texte sélectionné : copie-le avec le menu")}});

