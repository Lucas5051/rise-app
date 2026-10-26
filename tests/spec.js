const { chromium } = require('playwright');
const URL='http://localhost:8765/index.html?demo';
const legacy={v:2,tests:[{date:"2026-10-12",bw:80,cmj:33.9,squat3:95,bench3:70,dl3:80,pullReps:11}],status:{"F-2026-10-16":{s:"fatigue",at:"2026-10-16T18:00:00Z"}},settings:{bw:80,barInc:2.5,dbInc:2}};
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await ctx.addInitScript(l=>{window.__NOW__="2026-10-22T18:00:00";if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('usci-muscu-state-v1',JSON.stringify(l))}},legacy);
  const p=await ctx.newPage();p.setDefaultTimeout(3000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.waitForTimeout(1300);
  const E=(f,a)=>p.evaluate(f,a);
  // Migration
  ok(await E(()=>Object.keys(localStorage).some(k=>k.startsWith('usci-muscu-backup-v2-'))),'Sauvegarde brute avant migration');
  ok(await E(()=>S.status["TEST-2026-10-12"]&&S.status["TEST-2026-10-12"].s==="done"),'Séance de tests du 12/10 marquée réalisée');
  ok(await E(()=>S.tests.find(t=>t.date==="2026-10-12").dm8===22),'Développé militaire 22 kg × 8 ajouté');
  ok(await E(()=>S.status["F-2026-10-16"].s==="missed"&&S.status["F-2026-10-16"].reason==="fatigue"),'Ancien statut fatigue → Non réalisée (raison fatigue)');
  ok(await E(()=>{const r=oneRMs();return Math.abs(r.squat-100.6)<1&&Math.abs(r.bench-74.1)<1}),'1RM estimés conservés (squat ≈100,6, DC ≈74,1)');
  ok(await E(()=>S.profile.ctx==="lucas-2026"&&planActive()),'Contexte sportif rattaché au profil de Lucas');
  ok(await E(()=>!/ACLF/i.test(document.body.innerText)),'Aucune mention ACLF à l\'accueil');
  // Badge au démarrage : pas de popup, bannière
  ok(await E(()=>!document.querySelector('.done-wrap')),'Aucun popup de badge à l\'ouverture');
  ok(await E(()=>!!document.querySelector('.badge-banner')),'Badge gagné en arrière-plan signalé sur l\'accueil');
  // Rôles
  await E(()=>{TAB="coach";render()});
  ok(await E(()=>!document.querySelector('.coach-shell')&&/réservé/i.test(document.body.innerText)),'Compte athlète : espace coach refusé');
  await E(()=>{TAB="home";render()});
  ok(await E(()=>document.querySelectorAll('#tabs button').length===4&&!!document.querySelector('#tabs [aria-current] span:not(.sr-only)')),'4 onglets, actif = icône + libellé');
  await E(()=>showDone(sessions()[0],false,true));
  ok(await E(()=>!document.querySelector('.confetti i')),'Mouvement réduit : validation sans confettis');
  await E(()=>{$('#layer').innerHTML='';DLG=null;document.body.style.overflow=''});
  // Séance oubliée
  await E(()=>{const s=sessions().find(x=>x.date==="2026-10-22"&&!isOpt(x))||sessions().find(x=>x.date==="2026-10-22");const now=nowMs();S.active={id:s.id,startedAt:now-4*3600e3,phase:"main",phaseAt:now-4*3600e3,ph:{wu:{s:null,e:null,planned:600},main:{s:now-4*3600e3,e:null,planned:2400},cd:{s:null,e:null,planned:300}},paused:false,pauseAt:null,pauses:[],steps:buildSteps(playerItems(s)),cur:0,sub:"work",subAt:now,done:{},adapt:{},estEnd:now-3*3600e3,devices:[],alerted:{}};save();render()});
  await p.waitForTimeout(400);
  ok(await E(()=>/As-tu terminé/.test(document.getElementById('layer').innerText)),'Séance non terminée : question à l\'ouverture');
  await p.click('[data-act="forgotUnknown"]');await p.waitForTimeout(300);
  const fid=await E(()=>Object.keys(S.log).find(k=>S.log[k].durPending));
  ok(!!fid,'Durée inconnue → « Durée à confirmer », aucune durée inventée');
  ok(await E(id=>!S.active&&!(S.log[id].dur>0),fid),'Aucune durée enregistrée automatiquement');
  // Coach corrige la durée
  await E(()=>{doLogout()});await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');
  await p.click('[data-ctab="clients"]');await p.click('[data-cath="lucas"]');await p.click('[data-cathsub="seances"]');
  await p.click(`[data-cdur="${fid}"]`);await p.waitForTimeout(200);
  const ids=await E(()=>[...document.querySelectorAll('#layer input,#layer textarea,#layer select')].map(e=>e.id));
  console.log('  champs correction:',ids.join(','));
  for(const id of ids){const t=await E(i=>document.getElementById(i).type,id);if(t==='number')await p.fill('#'+id,'55');else if(t!=='hidden'&&t!=='select-one')await p.fill('#'+id,'Durée confirmée par message');}
  await p.click('[data-act="coachDurSave"]');await p.waitForTimeout(300);
  const h=await E(id=>{const pS=S;return withAthlete("lucas",()=>JSON.stringify(S.log[id].durHist||null))},fid);
  ok(h&&h.includes('55')&&/coach/i.test(h),'Correction coach : historique (ancienne/nouvelle valeur, auteur, raison) '+h);
  // Invitations
  await p.click('[data-ctab="msgs"]');await p.click('[data-ctab="invites"]');await p.fill('#ivFirst','Zoé');await p.click('#inviteForm [type=submit]');
  const code=await E(()=>PL.invites[0].code);
  ok(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code),'Code au format XXXX-XXXX sans caractères ambigus');
  await p.click('[data-ctab="formulas"]');await p.click('[data-ctab="account"]');await p.click('.coach-main [data-act="logout"]');
  for(let i=0;i<5;i++)await E(()=>checkInvite('ZZZZ-ZZZZ'));
  ok(await E(c=>!checkInvite(c).ok&&/Trop d'essais/.test(checkInvite(c).msg),code),'5 essais ratés : saisie bloquée 15 min');
  await E(()=>{PL.inviteFails=[];plSave()});
  ok(await E(c=>checkInvite(c).ok,code),'Code valide accepté');
  await E(c=>{const i=PL.invites.find(x=>x.code===c);i.revokedAt=nowISO();plSave()},code);
  ok(await E(c=>!checkInvite(c).ok&&/invalide ou expiré/.test(checkInvite(c).msg),code),'Code révoqué refusé (message neutre)');
  await E(c=>{const i=PL.invites.find(x=>x.code===c);i.revokedAt=null;plSave()},code);
  await p.click('[data-act="authCode"]');await p.fill('#cdCode',code.toLowerCase().replace('-',''));await p.click('#codeForm [type=submit]');
  ok(await E(()=>AUTH.screen==="codeVerify"&&/Zoé/.test(document.body.innerText)),'Code saisi en minuscules sans tiret : identité affichée');
  await p.click('[data-act="codeConfirm"]');await p.fill('#acLast','Durand');await p.fill('#acEmail','zoe@x.fr');await p.fill('#acPass','abcdefgh');await p.click('#accountForm [type=submit]');
  for(const a of ['notifNo','widgetNo','afterWidget','faceNo'])await p.click(`[data-act="${a}"]`);
  ok(await E(()=>TAB==="home"&&!!CUR_UID&&CUR_UID!=="lucas"&&me().coachId==="coach"),'Compte créé, rattaché au coach, arrivée directe (sans questionnaire ni offres)');
  ok(await E(()=>S.tests.length===0&&!planActive()&&S.settings.bw!==80||S.tests.length===0),'Nouveau client : aucune donnée de Lucas par défaut');
  ok(await E(c=>!checkInvite(c).ok,code),'Code à usage unique');
  ok(await E(()=>!JSON.stringify(localStorage).includes('abcdefgh')&&!JSON.stringify(localStorage).includes('motdepasse')),'Mot de passe jamais stocké');
  ok(await E(()=>!localStorage.getItem('usci-muscu-state-v1')||JSON.parse(localStorage.getItem('usci-muscu-state-v1')).tests.length>0),'Données de Lucas intactes après création d\'un autre compte');
  // Mouvement réduit
  // Brouillon d'inscription
  await E(()=>doLogout());await p.click('[data-act="obStart"]');await p.click('[data-obm="goals:force"]');await p.click('[data-act="obContinue"]');await p.click('[data-act="obLater"]');
  await p.reload();await p.waitForTimeout(800);
  ok(await E(()=>/Reprendre mon inscription \(étape 2/.test(document.body.innerText)),'Brouillon d\'inscription repris après rechargement');
  await p.click('[data-act="obResume"]');
  ok(await E(()=>OB_STEPS[draft().step].k==="sports"&&ans().goals.v.includes("force")),'Reprise à la bonne question avec les réponses');
  ok(await E(()=>!document.querySelector('input[id^="obOther"]')),'Champ « Autre » absent tant que non choisi');
  await p.click('[data-obm="sports:autre"]');
  ok(await E(()=>!!document.getElementById('obOther_sports')),'Champ « Autre » affiché quand choisi');
  console.log('ERREURS JS:',errs.length?errs:'aucune');
  console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();
})();
