const { chromium } = require('playwright');
const URL='http://localhost:8765/index.html?demo';
let pass=0,fail=0;let ERRS=null;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m);if(!c&&ERRS)console.log('   errs:',ERRS.slice(-3))};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(()=>{window.__NOW__=window.__NOW__||"2026-11-05T09:00:00";if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('usci-muscu-state-v1',JSON.stringify({v:2,tests:[{date:"2026-10-12",bw:80,squat3:95,bench3:70,dl3:80,pullReps:11}],status:{},settings:{bw:80}}))}});
  const p=await ctx.newPage();p.setDefaultTimeout(4000);const errs=[];ERRS=errs;p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  const E=(f,a)=>p.evaluate(f,a);
  await p.goto(URL);await p.waitForTimeout(800);await E(()=>doLogout());
  // 1. Coach : créer un programme
  await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');
  await p.click('[data-ctab="programs"]');await p.click('[data-pe="create"]');await p.waitForTimeout(400);
  await p.fill('#pmName','Force débutant 4 semaines');await p.fill('#pmGoal','Bases de force');await p.selectOption('#pmStatus','active');await p.click('[data-pe="saveMeta"]');
  // séance 1 semaine 1
  await p.click('[data-pe="addSession"]');await p.fill('#psName','Full body A');await p.selectOption('#psDay','1');await p.fill('#psDur','50');
  await p.click('[data-pe="psGo"][data-step="3"]');await p.click('[data-pe="exAdd"]');await p.fill('#exn0','Squat arrière');await p.fill('#exs0','3');await p.fill('#exr0','8');await p.fill('#exp0','2 min');
  await p.click('[data-pe="exAdd"]');await p.fill('#exn1','Développé couché');await p.fill('#exs1','3');await p.fill('#exr1','8');
  await p.click('[data-pe="exAdd"]');await p.fill('#exn2','Gainage maison');await p.fill('#exs2','2');await p.fill('#exr2','30 s');
  const est=await p.textContent('#psEst');console.log('  ',est);
  await p.click('[data-pe="saveSession"]');
  await p.click('[data-pe="addSession"]');await p.fill('#psName','Full body B');await p.selectOption('#psDay','3');await p.click('[data-pe="psGo"][data-step="3"]');await p.click('[data-pe="exAdd"]');await p.fill('#exn0','Tractions');await p.fill('#exr0','6');await p.click('[data-pe="saveSession"]');
  await p.click('[data-pe="dupWeek"]');await p.click('[data-pe="addBlock"]');
  const prog=await E(()=>{const P=Object.values(PL.programs).find(x=>x.name==="Force débutant 4 semaines");return P&&{id:P.id,st:progStats(P),blocks:P.blocks.length}});
  ok(prog&&prog.st.weeks===3&&prog.st.sessions===4,'Programme créé : blocs, semaines dupliquées, séances, exercices '+JSON.stringify(prog));
  // déplacer une séance
  await p.click('[data-pe="moveSession"]');await p.selectOption('#mvD','4');await p.click('[data-pe="saveMove"]');
  ok(await E(id=>PL.programs[id].blocks[0].weeks[0].sessions.some(s=>s.day===4),prog.id),'Séance déplacée dans le modèle');
  // dupliquer le programme et le programme de Lucas
  await p.click('[data-pe="close"]');
  const n0=await E(()=>Object.keys(PL.programs).length);
  await p.click(`[data-pe="dup"][data-id="${prog.id}"]`);await p.click('[data-pe="close"]');
  await p.click('[data-pe="dup"][data-id="prog-lucas-2026"]');await p.click('[data-pe="close"]');
  ok(await E(()=>Object.keys(PL.programs).length)===n0+2,'Duplication du programme et du programme historique');
  ok(await E(()=>{const c=Object.values(PL.programs).find(x=>x.name.startsWith("Copie de Programme historique"));return c&&!c.engine&&progStats(c).sessions>20&&!JSON.stringify(c).includes("6,93")}),'Copie du programme historique : modifiable, sans données personnelles de Lucas');
  // 2. Invitation avec programme et date
  await p.click('[data-ctab="msgs"]');await p.click('[data-ctab="invites"]');await p.fill('#ivFirst','Camille');await p.fill('#ivLast','Petit');await p.fill('#ivEmail','camille@ex.fr');await p.fill('#ivSport','Handball, régional');await p.fill('#ivGoal','Force');
  await p.selectOption('#ivProg',prog.id);await p.fill('#ivStart','2026-11-02');await p.selectOption('#ivWeek','0');await p.fill('#ivNotes','Genou fragile');
  await p.click('#inviteForm [type=submit]');
  const inv=await E(()=>PL.invites[0]);ok(inv.draft.programId===prog.id&&inv.draft.startDate==="2026-11-02"&&inv.draft.coachId==="coach"&&!!inv.draft.clientDraftId&&inv.draft.formula,'Code : coachId, clientDraftId, programId, startDate, formulaId');
  await p.click('.coach-out');
  // 3. Client avec code
  await p.click('[data-act="authCode"]');await p.fill('#cdCode',inv.code);await p.click('#codeForm [type=submit]');
  ok(/Force débutant/.test(await p.textContent('.auth')),'Programme préparé affiché à la vérification');
  await p.fill('#cvLast','Petit-Durand');await p.click('[data-act="codeConfirm"]');
  await p.fill('#acPass','motdepasse9');await p.click('#accountForm [type=submit]');
  for(const a of ['notifNo','widgetNo','afterWidget','faceNo'])await p.click(`[data-act="${a}"]`);
  const st=await E(()=>({tab:TAB,uid:CUR_UID,last:me().last,coach:me().coachId,asg:!!assignmentOf(CUR_UID),n:sessions().length,first:sessions()[0]&&sessions()[0].date,ob:!!PL.onboardDraft&&PL.onboardDraft.accountId===CUR_UID}));
  ok(st.tab==="home"&&st.coach==="coach"&&st.asg&&st.n===4&&st.first==="2026-11-05"&&st.last==="Petit-Durand"&&!st.ob,'Compte lié au coach, programme attribué, calendrier généré (4 séances, 1re le 05/11), questionnaire et offres ignorés '+JSON.stringify(st));
  await E(()=>{window.__NOW__="2026-11-05T09:00:00";render()});
  ok(await E(()=>/Full body B/.test(document.querySelector('.act-card').textContent)),'Accueil : séance du jour issue du programme');
  ok(await E(()=>S.tests.length===0&&!legacyActive()&&S.settings.bw===""),'Aucune donnée de Lucas chez le nouveau client');
  // 4. Séance dans le lecteur
  await p.click('.act-card[data-open]');await p.click('[data-start]');await p.click('[data-act="playerGo"]');
  ok(await E(()=>document.querySelectorAll('#player [data-warm]').length>3),'Échauffement interactif : une ligne par exercice');
  const t0=await E(()=>S.active.startedAt);
  await p.click('#player [data-warm]');ok(await E(()=>!!document.querySelector('.media-modal')&&document.getElementById('player').hasAttribute('inert')),'Fiche ouverte, lecteur rendu inerte');
  await p.keyboard.press('Escape');ok(await E(()=>!document.querySelector('.media-modal')&&!!document.getElementById('player')&&!document.getElementById('player').hasAttribute('inert')),'Échap ferme la fiche, retour au lecteur');
  ok(await E(t=>S.active&&S.active.startedAt===t,t0),'Chronomètre conservé');
  await E(()=>{window.__NOW__="2026-11-05T09:10:00"});await p.click('[data-act="playerNextPhase"]');
  await E(()=>{window.__NOW__="2026-11-05T09:12:00"});await p.click('[data-act="playerSetDone"]');
  ok(await E(()=>S.active.sub==="rest"&&/REPOS/.test(document.querySelector('.pl-state').textContent)),'Repos affiché en texte');
  await p.click('[data-act="playerPause"]');await E(()=>{window.__NOW__="2026-11-05T09:17:00"});await p.click('[data-act="playerPause"]');
  await p.click('[data-act="playerAdapt"]');await p.click('[data-padapt="lighter"]');
  await E(()=>{window.__NOW__="2026-11-05T09:40:00"});await p.click('[data-act="playerNextPhase"]');
  await E(()=>{window.__NOW__="2026-11-05T09:45:00"});await p.click('[data-act="playerFinish"]');
  const r=await E(()=>recapData(S.active));console.log('   recap',JSON.stringify({wu:r.wu,main:r.main,cd:r.cd,pause:r.pause,active:r.active,total:r.total}));
  ok(Math.abs(r.active+r.pause-r.total)<=2&&r.pause===300&&r.total===2700,'Temps actif + pauses = temps total écoulé');
  ok(await E(()=>/Temps actif cumulé/.test(document.getElementById('player').textContent)&&/Temps total écoulé/.test(document.getElementById('player').textContent)),'Récapitulatif : temps actif, pauses, total');
  await p.click('[data-recst="adapted"]');await p.click('[data-reason="rec:douleur"]');await p.fill('#recCom','Charge allégée au squat');await p.click('[data-act="recValidate"]');
  await p.click('[data-act="rpeNow"]');await p.click('[data-rpev="7"]');await p.click('#layer [data-act="saveLog"]');
  const lg=await E(()=>{const s=sessions()[0];return{st:S.status[s.id],l:S.log[s.id]}});
  ok(lg.st.s==="adapted"&&lg.st.reason==="douleur"&&lg.l.dur===40,'Séance adaptée enregistrée, durée = temps actif (40 min) '+JSON.stringify({dur:lg.l.dur,rpe:lg.l.rpe}));ok(lg.l.rpe===7,'RPE enregistré');
  // suivi
  await p.click('[data-tab="suivi"]');await p.click('[data-sub="suivi:progres"]');
  ok(await E(()=>/1/.test(document.querySelector('.kpis').textContent)),'Suivi › Progrès alimenté');
  // 5. Validation manuelle sans durée
  const s2=await E(()=>sessions()[1].id);
  await E(id=>{window.__NOW__="2026-11-06T20:00:00";openSession(id)},s2);await p.click('[data-act="toggleMore"]');await p.click('[data-act="manualDone"]');
  await p.click('[data-act="saveManualDone"]');ok(/Choisis comment/.test(await p.textContent('#mdMsg')),'Validation manuelle : durée obligatoire (aucune durée prévue utilisée)');
  await p.click('[data-durmode="md:unknown"]');await p.click('[data-act="saveManualDone"]');
  const l2=await E(id=>S.log[id],s2);ok(l2.dur===null&&l2.durPending===true,'« Je ne sais plus » → réalisée, durée à confirmer');
  await p.click('[data-act="rpeLater"]').catch(()=>{});
  const s3=await E(()=>sessions()[2].id);
  await E(id=>{window.__NOW__="2026-11-10T21:00:00";openSession(id)},s3);await p.click('[data-act="toggleMore"]');await p.click('[data-act="manualDone"]');
  await p.click('[data-mdst="adapted"]');await p.click('[data-durmode="md:times"]');await p.fill('#mdStart','18:00');await p.fill('#mdEnd','18:55');await p.click('[data-act="saveManualDone"]');
  ok(/raison/.test(await p.textContent('#mdMsg')),'Adaptation sans raison refusée');
  await p.click('[data-reason="md:temps"]');await p.click('[data-act="saveManualDone"]');ok(/commentaire/.test(await p.textContent('#mdMsg')),'Adaptation sans commentaire refusée');
  await p.fill('#mdCom','Séance raccourcie');await p.click('[data-rpemode="md:now"]');await p.click('[data-rpev="6"]');await p.click('[data-act="saveManualDone"]');
  const l3=await E(id=>({l:S.log[id],s:S.status[id]}),s3);ok(l3.l.dur===55&&l3.l.rpe===6&&l3.s.s==="adapted"&&l3.s.comment,'Heures début/fin → 55 min, RPE saisi, adaptation complète');
  // 6. Coach consulte
  await E(()=>doLogout());await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');
  await p.click('[data-ctab="clients"]');const uid=await E(()=>Object.values(PL.accounts).find(a=>a.last==="Petit-Durand").id);
  await p.click(`[data-cath="${uid}"]`);ok(/Force débutant/.test(await p.textContent('.coach-main')),'Coach : programme visible dans la fiche');
  await p.click('[data-cathsub="seances"]');const txt=await p.textContent('.coach-main');
  ok(/Charge allégée au squat/.test(txt)&&/Durée à confirmer/.test(txt)&&/55 min/.test(txt),'Coach : séances, raisons, durées, durée à confirmer');
  // personnalisation sans toucher au modèle
  await p.click('[data-cathsub="plan"]');await p.click('[data-pe="customize"]');await p.click('[data-pe="editSession"]');await p.fill('#psName','Full body A (genou)');await p.click('[data-pe="saveSession"]');
  ok(await E(([pid,uid])=>{const a=assignmentOf(uid);return JSON.stringify(a.prog).includes("Full body A (genou)")&&!JSON.stringify(PL.programs[pid]).includes("(genou)")&&a.customized&&a.history.length>1},[prog.id,uid]),'Personnalisation du client sans modifier le modèle, historisée');
  // 7. Client classique : inscription, offre, apparition chez le coach, attribution
  await E(()=>doLogout());
  await p.click('[data-act="obStart"]');await E(()=>{const a=ans();a.goals={v:["force"],main:"force"};a.sports={v:["football"]};a.levels={v:{football:"amateur"}};a.freq={v:{football:2}};a.exp={v:"a3"};a.sex={v:"femme"};a.dispo={days:["1"],dur:"60"};a.equip={cat:"salle",items:[]};a.pain={v:["aucune"]};obGo(OB_STEPS.findIndex(s=>s.k==="body"))});
  ok(await E(()=>OB_STEPS[draft().step].k==="body"&&document.querySelector('[data-act="obContinue"]').disabled&&!(ans().body&&ans().body.kg)),'Poids : rien enregistré à l\'arrivée, Continuer désactivé');
  await p.click('[data-act="obConfirmW"]');ok(await E(()=>ans().body.kg===70&&ans().body.confirmed&&!document.querySelector('[data-act="obContinue"]').disabled),'Poids enregistré seulement après « Confirmer »');
  await p.click('[data-obunit="lb"]');await p.fill('#wKey','176.4');ok(await E(()=>Math.abs(ans().body.kg-80)<0.1),'Conversion lb → kg (176,4 lb = 80 kg)');
  await p.fill('#wKey','20');ok(await E(()=>/hors limites/.test(document.getElementById('wState').textContent)&&Math.abs(ans().body.kg-80)<0.1),'Valeur hors limites refusée');
  await p.click('[data-act="obContinue"]');await p.click('[data-act="obContinue"]');await p.click('[data-obm="expect:perso"]');await p.click('[data-act="obContinue"]');await p.click('[data-obs="source:instagram"]');await p.waitForTimeout(400);ok(await E(()=>OB_STEPS[draft().step].k==="recap"&&/Football/.test(document.querySelector('.auth').textContent)),'Récapitulatif modifiable avant création du compte');await p.click('[data-act="obContinue"]');
  await p.fill('#acFirst','Inès');await p.fill('#acLast','Roux');await p.fill('#acEmail','ines@ex.fr');await p.fill('#acPass','12345678');await p.click('#accountForm [type=submit]');
  for(const a of ['notifNo','widgetNo','afterWidget','faceNo'])await p.click(`[data-act="${a}"]`);
  await p.waitForTimeout(2500);await p.click('[data-act="callNo"]');await p.click('[data-act="toOffers"]');await p.click('[data-pickoffer="perso"]');
  const ines=await E(()=>CUR_UID);ok(await E(()=>S.settings.bw===80&&!planActive()),'Nouveau client : poids confirmé enregistré, pas de programme');
  await E(()=>doLogout());await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');await p.click('[data-ctab="clients"]');
  ok(await E(id=>!!document.querySelector(`[data-cath="${id}"]`),ines),'Client classique visible dans l\'espace coach');
  await p.click(`[data-cath="${ines}"]`);console.log('   fiche:',(await p.textContent('.coach-main')).slice(0,200),await E(()=>{try{viewCoachShell();return 'ok'}catch(e){return e.message+' '+e.stack.split('\n').slice(0,4).join(' | ')}}));await p.click(`[data-pe="assign"][data-id="${prog.id}"]`);await p.fill('#asStart','2026-11-04');await p.click('[data-pe="doAssign"]');
  ok(await E(id=>withAthlete(id,()=>sessions().length===4&&sessions()[0].date>="2026-11-04"),ines),'Attribution par le coach : calendrier généré à partir du 04/11');
  await E(()=>doLogout());await E(id=>{startSession(id);initStore()},ines);await p.waitForTimeout(800);
  ok(await E(()=>planActive()&&sessions().length===4&&/Full body/.test(document.body.textContent)),'Première séance disponible côté client');
  // 8. Isolation
  ok(await E(([u1,u2])=>{const a=withAthlete(u1,()=>Object.keys(S.status).length),b=withAthlete(u2,()=>Object.keys(S.status).length);return a===3&&b===0},[uid,ines]),'Isolation des données entre deux comptes');
  console.log('ERREURS JS:',errs.length?errs:'aucune');console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();
})();
