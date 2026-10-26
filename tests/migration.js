// Migration v9 → serveur avec les données historiques de Lucas (copie de test, compte coach de test).
const { chromium } = require('playwright');
const BASE='http://localhost:8765/index.html?mode=cloud';
const COACH={email:'coach.test@usci-muscu.test',pass:'TestCoach-2026!'};
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Données v9 représentatives (structure réelle de l'appli : tests du 12/10, statuts, RPE, déplacement, questionnaires)
const V9={v:4,profile:{ctx:"lucas-2026",first:"Lucas",last:"Besnard"},tests:[{date:"2026-10-12",bw:80,cmj:33.9,squat3:95,bench3:70,dl3:80,pullReps:11,dm8:22,src:"Saisis à partir des résultats transmis"}],
  status:{"TEST-2026-10-12":{s:"done",at:"2026-10-12T20:00:00.000Z",src:"tests transmis"},"M-2026-10-19":{s:"adapted",reason:"fatigue",comment:"Volume réduit",at:"2026-10-19T19:00:00Z"},"F-2026-10-16":{s:"missed",reason:"fatigue",at:"2026-10-16T18:00:00Z"}},
  log:{"M-2026-10-19":{dur:48,rpe:7,rpeAt:"2026-10-19T19:40:00Z"},"TEST-2026-10-12":{dur:75,rpe:null}},moves:{"HP-2026-10-15":"2026-10-14"},
  fatigue:{"2026-10-19":{score:64,items:{sommeil:60,fatigue:55,stress:70,courbatures:65,humeur:70},at:"2026-10-19T07:30:00Z",src:"appli"},"2026-10-20":{score:71,at:"2026-10-20T07:30:00Z",src:"appli"}},
  other:{"o1":{date:"2026-10-18",sport:"padel",label:"Padel",dur:60,rpe:6}},club:{},settings:{bw:80,barInc:2.5,dbInc:2,dmRefW:22,dmRefR:8},meta:{seed1210:true,migrations:[]}};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1280,height:900},timezoneId:'Europe/Paris'});
  await ctx.addInitScript(v=>{if(!localStorage.getItem('usci-muscu-state-v1'))localStorage.setItem('usci-muscu-state-v1',JSON.stringify(v))},V9);
  const p=await ctx.newPage();p.setDefaultTimeout(20000);const errs=[];p.on('pageerror',e=>errs.push(e.message));const E=(f,a)=>p.evaluate(f,a);
  await p.goto(BASE);await p.waitForTimeout(1500);
  await p.click('[data-act="authLogin"]');await p.fill('#lgEmail',COACH.email);await p.fill('#lgPass',COACH.pass);await p.click('#loginForm [type=submit]');
  await p.waitForSelector('[data-act="migBackup"]',{timeout:45000});ok(/Importer tes données de la version 9/.test(await p.textContent('.auth')),'Données v9 détectées à la connexion du coach');
  ok(await E(()=>document.querySelector('[data-act="migRun"]').disabled),'Import bloqué tant que la sauvegarde JSON n\'est pas téléchargée');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act="migBackup"]')]);const path=await dl.path();const bk=JSON.parse(require('fs').readFileSync(path,'utf8'));
  ok(bk.keys['usci-muscu-state-v1']&&!bk.keys['usci-auth'],'Sauvegarde JSON complète téléchargée (sans jeton de session)');
  await p.click('[data-act="migRun"]');await p.waitForSelector('[data-act="migDone"]',{timeout:60000});
  const rep=await E(()=>PL.meta.v9report);rep.checks.forEach(c=>ok(c.ok,'Rapport : '+c.t));
  // relance : pas de doublon
  const count=()=>E(()=>Cloud.rpc('athlete_snapshot').then(s=>({t:s.tests.length,l:s.logs.length,w:s.wellness.length,o:s.other.length})));const c1=await count();
  await p.click('[data-act="migDone"]');await E(()=>{AUTH={screen:"migrate"};render()});await p.click('[data-act="migRun"]');await p.waitForSelector('[data-act="migDone"]',{timeout:60000});
  const c2=await count();ok(JSON.stringify(c1)===JSON.stringify(c2),'Import relancé : aucun doublon '+JSON.stringify(c2));
  await p.click('[data-act="migDone"]');await p.waitForSelector('.coach-shell');
  ok(await E(()=>coachIsAlsoAthlete()&&!!document.querySelector('[data-act="goMyTraining"]')),'Espace coach : accès « Mon entraînement »');
  await p.click('[data-act="goMyTraining"]');await p.waitForTimeout(800);
  ok(await E(()=>CUR_UID===LUCAS.uid&&legacyActive()&&S.status["TEST-2026-10-12"].s==="done"),'Mon entraînement : planification historique, tests du 12/10 réalisés');
  ok(await E(()=>Math.abs(oneRMs().squat-100.6)<1),'1RM estimés identiques (squat ≈ 100,6 kg, Brzycki)');
  // nouvel appareil : tout revient du serveur
  const ctx2=await b.newContext({viewport:{width:390,height:844},isMobile:true});const p2=await ctx2.newPage();p2.setDefaultTimeout(20000);
  await p2.goto(BASE);await p2.waitForTimeout(1200);await p2.click('[data-act="authLogin"]');await p2.fill('#lgEmail',COACH.email);await p2.fill('#lgPass',COACH.pass);await p2.click('#loginForm [type=submit]');
  await p2.waitForSelector('.coach-shell');await p2.click('.dash-mytrain');await p2.waitForTimeout(1000);
  ok(await p2.evaluate(()=>S.status["TEST-2026-10-12"].s==="done"&&S.log["M-2026-10-19"].rpe===7&&S.moves["HP-2026-10-15"]==="2026-10-14"&&S.fatigue["2026-10-20"].score===71&&S.tests[0].dm8===22),'Autre appareil : statuts, RPE, déplacement, questionnaires et tests restaurés depuis le serveur');
  ok(await p2.evaluate(()=>!Object.values(PL.accounts).some(a=>a.role==="athlete"&&a.id!==LUCAS.uid&&a.sid===Cloud.profile.id)),'Données de Lucas rattachées à son seul profil');
  console.log('ERREURS JS:',errs.length?errs:'aucune');console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
