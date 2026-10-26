// Migration v9 → serveur à partir d'un FICHIER (appli hébergée à une autre adresse que la v9) : export « Mes données » v9.
const { chromium } = require('playwright');const fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/index.html?mode=cloud';
const COACH={email:'coach.test@usci-muscu.test',pass:'TestCoach-2026!'};
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
// Export v9 (format réel de la fonction exportBundle de la v9), données représentatives
const EXP={export:{app:"USCI Muscu",appVersion:"9",schema:4,exportedAt:"2026-10-23T08:00:00Z",format:"JSON"},compte:{id:"u-lucas",role:"athlete"},profil:{ctx:"lucas-2026",first:"Lucas",last:"Besnard"},
  seances:{statuts:{"TEST-2026-10-12":{s:"done",at:"2026-10-12T20:00:00.000Z"},"M-2026-10-19":{s:"adapted",reason:"fatigue",comment:"Volume réduit",at:"2026-10-19T19:00:00Z"}},journal:{"M-2026-10-19":{dur:48,rpe:7}},deplacements:{"HP-2026-10-15":"2026-10-14"},adaptations:{},variantes:{}},
  clubEtMatchs:{},autresActivites:{},questionnaires:{"2026-10-19":{score:64,at:"2026-10-19T07:30:00Z",src:"appli"}},tests:[{date:"2026-10-12",bw:80,cmj:33.9,squat3:95,bench3:70,dl3:80,pullReps:11,dm8:22}],
  donneesCardiaques:{},progressions:{ajustements:{},historique:[]},badges:{},recompenses:{},reglages:{bw:80,barInc:2.5},historiqueMigrations:[]};
const file='/tmp/claude-0/-home-claude/c535ae2e-eeaa-5372-bb06-0e7cbc008ce8/scratchpad/export-v9-test.json';fs.writeFileSync(file,JSON.stringify(EXP));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Paris'});
  const p=await ctx.newPage();p.setDefaultTimeout(20000);const errs=[];p.on('pageerror',e=>errs.push(e.message));const E=(f,a)=>p.evaluate(f,a);
  await p.goto(BASE);await p.waitForTimeout(1500);
  ok(await E(()=>!legacyLocalData()),'Nouvelle adresse : aucune donnée v9 lisible sur cet appareil');
  await p.click('[data-act="authLogin"]');await p.fill('#lgEmail',COACH.email);await p.fill('#lgPass',COACH.pass);await p.click('#loginForm [type=submit]');
  await p.waitForSelector('.coach-shell');await E(()=>{CTAB="account";render()});
  ok(await p.isVisible('label[for="v9File"]'),'Paramètres coach › Compte : import du fichier v9 proposé');
  await p.setInputFiles('#v9File',{name:'mauvais.json',mimeType:'application/json',buffer:Buffer.from('{"a":1}')});await p.waitForTimeout(300);
  ok(/pas un export/.test(await p.textContent('#v9Msg')),'Fichier étranger refusé');
  await p.setInputFiles('#v9File',file);await p.waitForSelector('[data-act="migBackup"]');
  ok(/12\/10 : <b>réalisée|réalisée/.test(await p.textContent('.ob')),'Fichier reconnu : séance de tests du 12/10 réalisée détectée');
  ok(await E(()=>document.querySelector('[data-act="migRun"]').disabled),'Sauvegarde toujours obligatoire avant l\'import');
  await Promise.all([p.waitForEvent('download'),p.click('[data-act="migBackup"]')]);
  await p.click('[data-act="migRun"]');await p.waitForSelector('[data-act="migDone"]',{timeout:60000});
  const rep=await E(()=>PL.meta.v9report);rep.checks.forEach(c=>ok(c.ok,'Rapport : '+c.t));
  console.log('ERREURS JS:',errs.length?errs:'aucune');console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(2)});
