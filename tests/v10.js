// Tests v10 (mode démonstration, sans serveur) : charges structurées, tests personnalisés, règles du coach,
// douleur localisée, formules, questionnaire, navigation coach, éditeur de séance en 4 étapes.
const { chromium } = require('playwright');
const URL='http://localhost:8765/index.html?demo';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.__NOW__="2026-11-05T09:00:00"});
  const p=await ctx.newPage();p.setDefaultTimeout(4000);const errs=[];p.on('pageerror',e=>errs.push(e.message));const E=(f,a)=>p.evaluate(f,a);
  await p.goto(URL);await p.waitForTimeout(700);
  // ---------- Coach : navigation ----------
  await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');
  ok(await E(()=>document.querySelectorAll('.coach-nav [data-ctab]').length===6),'Espace coach : 6 rubriques principales');
  await p.click('[data-ctab="msgs"]');ok(await E(()=>[...document.querySelectorAll('.ctabs button')].map(b=>b.textContent.trim().replace(/\d+$/,'').trim()).join('|')==="Messages privés|Groupe|Invitations|Demandes d'appel"),'Communication : messages, groupe, invitations, demandes d\'appel');
  await p.click('[data-ctab="formulas"]');ok(await E(()=>document.querySelectorAll('.ctabs button').length===7&&/Identité de marque/.test(document.querySelector('.ctabs').textContent)),'Paramètres coach : 7 sous-rubriques');
  await p.click('[data-ctab="library"]');await p.click('[data-ctab="tests"]');
  await p.fill('#ttName','Fente bulgare 5RM');await p.selectOption('#ttKind','rm');await p.fill('#ttReps','5');await p.selectOption('#ttFormula','epley');await p.click('#ttForm [type=submit]');
  ok(await E(()=>!!testType("c_fente_bulgare_5rm")&&testType("c_fente_bulgare_5rm").formula==="epley:5"),'Test personnalisé créé (unité, répétitions, formule Epley)');
  // ---------- Programme + éditeur en 4 étapes ----------
  await p.click('[data-ctab="programs"]');await p.click('[data-pe="create"]');await p.fill('#pmName','Prog v10');await p.selectOption('#pmStatus','active');
  await p.uncheck('#pmR_volume');await p.click('[data-pe="saveMeta"]');
  const pid=await E(()=>Object.values(PL.programs).find(x=>x.name==="Prog v10").id);
  ok(await E(id=>PL.programs[id].rules.volume===false,pid),'Règle « réduction du volume » désactivée par le coach');
  await p.click('[data-pe="addSession"]');ok(await E(()=>document.querySelectorAll('.ps-steps button').length===4),'Éditeur de séance en 4 étapes');
  await p.fill('#psName','Force A');await p.selectOption('#psDay','3');await p.fill('#psDur','15');await p.selectOption('#psFam','heavy');
  await p.click('[data-pe="psGo"][data-step="2"]');ok(await E(()=>!!document.getElementById('psWuMin')),'Étape 2 : échauffement');
  await p.click('[data-pe="psGo"][data-step="3"]');
  await p.fill('#psLibQ','couché');ok(await E(()=>/Développé couché/.test(document.getElementById('psLibRes').textContent)&&!/Squat arrière/.test(document.getElementById('psLibRes').textContent)),'Recherche dans la bibliothèque');
  await p.click('#psLibRes [data-n="Développé couché"]');await p.fill('#psLibQ','squat');await p.click('#psLibRes [data-n="Squat arrière"]');
  ok(await E(()=>PSD.ps.main.length===2),'Exercices ajoutés depuis la bibliothèque');
  await p.selectOption('#exm1','pct1rm');await p.fill('#expp1','80');await p.selectOption('#exref1','squat');await p.fill('#exrd1','2.5');
  await p.selectOption('#exm0','fixed');await p.fill('#exv0','60');
  await p.click('[data-pe="exDup"][data-i="0"]');ok(await E(()=>PSD.ps.main.length===3&&PSD.ps.main[1].n==="Développé couché"),'Exercice dupliqué');
  await p.click('[data-pe="psUndo"]');ok(await E(()=>PSD.ps.main.length===2),'Annuler : dernière modification annulée');
  // brouillon : fermeture sans enregistrer puis reprise
  await E(()=>{psRead();psSaveDraft();closeSheet(false)});await p.click('[data-pe="addSession"]');
  ok(await E(()=>PSD.restored&&PSD.ps.name==="Force A"&&PSD.ps.main.length===2),'Brouillon enregistré automatiquement et repris');
  await p.click('[data-pe="psGo"][data-step="4"]');const chk=await p.textContent('#psForm');
  ok(/Durée annoncée 15 min/.test(chk),'Vérification : durée annoncée incohérente signalée');
  ok(/Tests nécessaires.*Squat/.test(chk),'Vérification : tests nécessaires indiqués');
  ok(/Aperçu athlète/.test(chk)&&/80 % · Squat/.test(chk)&&/60 kg/.test(chk),'Aperçu athlète avec les charges prescrites');
  await p.click('[data-pe="saveSession"]');
  await p.click('[data-pe="dupSession"]');ok(await E(id=>progSessions(PL.programs[id]).length===2,pid),'Séance dupliquée');
  await E(id=>{const s=progSessions(PL.programs[id]);s[1].ps.day=4;s[1].ps.name="Force B"},pid);
  await E(id=>{const f=progSessions(PL.programs[id])[0];openPsEditor(f.ps.id,null,false);PSD.step=4;psRefresh()},pid);
  ok(/deux séances lourdes à moins de 48 h/.test(await p.textContent('#psForm')),'Vérification : deux séances lourdes trop proches signalées (avec source)');
  await p.click('[data-pe="psCancel"]');
  // ---------- Client : attribution avec contrôles du questionnaire ----------
  const uid=await E(()=>{const id=createAthlete({first:"Zoé",last:"Test",email:"zoe@ex.fr",coachId:"coach",formula:"perso",profile:{onboarding:{equip:{cat:"domicile",items:["Haltères"]},pain:{v:["epaule"]},dispo:{days:["1","3"],dur:"45"},sportDetail:{football:{days:["3"],matchDays:["5"]}}}}});return id});
  await E(([id,u])=>openAssign(id,u),[pid,uid]);const ac=await p.textContent('#asChecks');
  ok(/matériel absent/.test(ac)&&/zone déclarée douloureuse/.test(ac)&&/non disponible/.test(ac)&&/veille ou le lendemain d'un jour de match/.test(ac),'Attribution : matériel, douleurs, disponibilités et matchs du questionnaire contrôlés');
  ok(/Tests manquants/.test(await p.textContent('.sheet')),'Attribution : tests manquants signalés');
  await E(([id,u])=>{assignProgram({clientId:u,programId:id,startDate:"2026-11-02"});closeSheet(false)},[pid,uid]);
  // ---------- Charges ----------
  const L=await E(u=>withAthlete(u,()=>{const s=sessions().find(x=>tpl(x).name==="Force A");const it=sessionItems(s);return{fixed:loadInfo(it[0]),pct:loadInfo(it[1]),id:s.id}}),uid);
  ok(L.fixed.kg==="60 kg","Charge fixe affichée : 60 kg");
  ok(L.pct.kg===null&&/Test requis pour calculer cette charge/.test(L.pct.note),'Test absent : aucune charge inventée (« Test requis »)');
  await E(u=>writeAthlete(u,S=>{S.tests.push({date:"2026-11-03",squat3:100})}),uid);
  const L2=await E(u=>withAthlete(u,()=>{const s=sessions().find(x=>tpl(x).name==="Force A");return loadInfo(sessionItems(s)[1])}),uid);
  ok(L2.kg==="85 kg"&&/Brzycki/.test(L2.formula),'80 % du 1RM estimé (100 kg × 3 → 105,9 kg) arrondi à 2,5 kg = 85 kg, formule affichée');
  await E(([u,id])=>writeAthlete(u,S=>{S.status[id]={s:"done",at:"2026-11-05T19:00:00Z"};S.log[id]={dur:50,rpe:7};freezeLoads()}),[uid,L.id]);
  await E(u=>writeAthlete(u,S=>{S.tests.push({date:"2026-11-10",squat3:110})}),uid);
  const fz=await E(([u,id])=>withAthlete(u,()=>({frozen:S.log[id].loads["Squat arrière"].text,future:loadInfo(sessionItems(sessions().filter(x=>tpl(x).name==="Force A").pop())[1]).kg})),[uid,L.id]);
  ok(fz.frozen==="85 kg","Séance réalisée : charge historique conservée (85 kg)");ok(fz.future==="92,5 kg",'Nouveau test : charges futures recalculées (92,5 kg)');
  ok(await E(()=>{const r=prescLoad({mode:"pct1rm",ref:"c_fente_bulgare_5rm",pct:70});return r.missing}),'Test personnalisé sans résultat : « Test requis »');
  // ---------- Règles du coach réellement appliquées ----------
  const R=await E(([u])=>withAthlete(u,()=>{const s=sessions().find(x=>tpl(x).name==="Force A");const base={mode:"volume",label:"",trig:[],why:["test"],changes:[],effect:"",targets:[],notes:[],level:1};
    const r1=enforceRules(s,base);const a=asgFor(s);a.prog.rules={volume:false,power:false,micro:false,upper:false,active:false,targeted:false,move:false};const r2=enforceRules(s,base);
    a.prog.rules={...DEFAULT_RULES};return{r1:r1.mode,refused:r1.rule.refused,r2:r2.mode}}),[uid]);
  ok(R.r1==="active"&&R.refused.includes("volume"),'Adaptation interdite jamais proposée : repli sur une option autorisée plus prudente');
  ok(R.r2==="coach",'Aucune option autorisée : l\'athlète est invité à contacter son coach');
  // ---------- Douleur localisée ----------
  const P=await E(u=>withAthlete(u,()=>{const s=sessions().find(x=>tpl(x).name==="Force A");const base={mode:"pain",trig:[],why:[],notes:[],level:2,targets:[]};
    const ask=painPlan(s,base);S.pain={p1:{date:s.date,zone:"epaule",intensity:4,onset:"recente",atRest:false,at:nowISO()}};const t=painPlan(s,base);
    S.pain.p1.intensity=8;const r=painPlan(s,base);delete S.pain.p1;
    return{ask:ask.mode,t:t.mode,removed:t.changes.join("|"),r:r.mode,txt:JSON.stringify([ask,t,r])}}),uid);
  ok(P.ask==="painAsk"&&!/upper/.test(P.ask),'Douleur sans zone : la zone est demandée, aucune séance « haut du corps » automatique');
  ok(P.t==="painTargeted"&&/Développé couché/.test(P.removed)&&!/Squat arrière/.test(P.removed),'Douleur à l\'épaule : retrait ciblé du développé couché, squat conservé');
  ok(P.r==="rest",'Douleur importante (8/10) : repos et avis d\'un professionnel');
  ok(/aucun diagnostic/i.test(P.txt)&&!/(tendinite|entorse|déchirure|lésion)/i.test(P.txt),'Aucun diagnostic affiché');
  // ---------- Formules ----------
  await E(()=>doLogout());await E(u=>{PL.accounts[u].formula="programmes";startSession(u);initStore()},uid);await p.waitForTimeout(500);
  ok(await E(()=>!can("auto_loads")&&!can("private_messaging")&&!document.querySelector('[data-tab="msg"]')),'Formule « Programmes » : pas de messagerie ni de calcul des charges');
  ok(await E(()=>{const s=sessions().find(x=>tpl(x).name==="Force B");return /Charge au ressenti/.test(loadInfo(sessionItems(s)[1]).note)}),'Formule « Programmes » : charge au ressenti (calcul verrouillé)');
  ok(await E(()=>{const s=sessions().find(x=>tpl(x).name==="Force B");return recommend(s).mode==="none"||enforceRules(s,{mode:"volume",why:[],level:1}).mode==="coach"}),'Formule sans adaptations automatiques : renvoi au coach');
  await E(u=>{PL.accounts[u].formula="coaching";plSave();render()},uid);
  ok(await E(()=>can("private_messaging")&&!!document.querySelector('[data-tab="msg"]')),'Formule « Coaching » : messagerie disponible');
  // douleur depuis la fiche séance
  await E(()=>{const s=sessions().find(x=>tpl(x).name==="Force B");openSession(s.id)});await p.click('#layer [data-act="openPain"]');
  await p.click('[data-act="savePain"]');ok(/Choisis la zone/.test(await p.textContent('#pnMsg')),'Formulaire douleur : zone obligatoire');
  await p.selectOption('#pnZone','epaule');await p.click('[data-pnonset="recente"]');await p.click('[data-pnrest="non"]');await p.fill('#pnTrig','bras au-dessus de la tête');await p.click('[data-act="savePain"]');
  ok(await E(()=>Object.values(S.pain).some(x=>x.zone==="epaule"&&x.onset==="recente"&&x.atRest===false&&x.trigger)),'Douleur enregistrée : zone, intensité, apparition, déclencheur, repos');
  ok(/Retrait ciblé/.test(await p.textContent('#layer')),'Proposition conservatrice expliquée dans la séance');
  // navigation coach sur mobile : pas de défilement horizontal
  const m=await b.newContext({viewport:{width:375,height:812},isMobile:true});const mp=await m.newPage();await mp.goto(URL);await mp.waitForTimeout(500);
  await mp.click('[data-act="authCoach"]');await mp.click('[data-act="coachEnter"]');
  ok(await mp.evaluate(()=>{const n=document.querySelector('.coach-nav');return n.scrollWidth<=n.clientWidth+1&&[...n.querySelectorAll('[data-ctab]')].every(x=>x.getBoundingClientRect().width>=44&&x.getBoundingClientRect().height>=44)}),'Mobile : navigation coach compacte, sans défilement horizontal, cibles ≥ 44 px');
  console.log('ERREURS JS:',errs.length?errs:'aucune');console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
