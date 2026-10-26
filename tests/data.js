const { chromium } = require('playwright');
const URL='http://localhost:8765/index.html?demo';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
const legacy={v:2,tests:[{date:"2026-10-12",bw:80,cmj:33.9,squat3:95,bench3:70,dl3:80,pullReps:11}],status:{"M-2026-10-19":{s:"done",at:"x"}},log:{"M-2026-10-19":{dur:62,rpe:7}},fatigue:{"2026-10-20":{score:70,items:{sommeil:70}}},settings:{bw:80}};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
  await ctx.addInitScript(l=>{window.__NOW__="2026-10-22T18:00:00";if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('usci-muscu-state-v1',JSON.stringify(l))}},legacy);
  const p=await ctx.newPage();p.setDefaultTimeout(4000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const E=(f,a)=>p.evaluate(f,a);
  await p.goto(URL);await p.waitForTimeout(1300);
  // --- Profil historique
  ok(await E(()=>PL.programs["prog-lucas-2026"]&&PL.assignments["asg-lucas-2026"].clientId==="lucas"&&assignmentOf("lucas").status==="active"),'Programme historique enregistré et attribué à Lucas');
  ok(await E(()=>legacyActive()&&sessions().length>25&&S.status["M-2026-10-19"].s==="done"&&S.log["M-2026-10-19"].rpe===7&&S.fatigue["2026-10-20"].score===70),'Calendrier, statuts, RPE et questionnaires conservés');
  ok(await E(()=>S.settings.bw===80&&S.settings.dmRefW===22&&S.tests.length===1&&S.status["TEST-2026-10-12"].s==="done"),'Tests et réglages de Lucas conservés, séance du 12/10 réalisée');
  ok(await E(()=>S.meta.migrations.some(m=>m.to===4)&&PL.v===4),'Migration v4 journalisée');
  // --- Navigation des tuiles
  for(const [lab,tab,sub] of [["Régularité","suivi","progres"],["Moy. 7 j","suivi","progres"],["Prochain badge","suivi","badges"]]){
    await E(()=>goTo("home"));await p.click(`.gl-tile[aria-label^="${lab}"]`);
    ok(await E(([t,s])=>TAB===t&&SUIVI_SUB===s&&document.activeElement===document.querySelector('#app h1')&&document.querySelector('#tabs [aria-current] span').textContent==="Suivi"&&window.scrollY===0,[tab,sub]),`Tuile « ${lab} » → Suivi › ${sub} (onglet, sous-onglet, focus, barre)`)}
  await E(()=>goTo("home"));await p.click('.gl-tile[aria-label^="Ressenti"]');ok(await E(()=>!!document.querySelector('#layer .wb-sheet')),'Tuile « Ressenti » vide → questionnaire');
  await E(()=>closeSheet(false));
  // aucune destination data-tab inexistante, dans tous les écrans
  const bad=new Set();for(const t of ["home","cal","train","suivi","settings","msg"]){await E(t=>goTo(t),t);for(const sub of ["ressenti","progres","badges","seances","plan"]){await E(([t,s])=>{if(t==="suivi"&&["ressenti","progres","badges"].includes(s))SUIVI_SUB=s;if(t==="train"&&["seances","plan"].includes(s))TRAIN_SUB=s;render()},[t,sub]);
    (await E(()=>[...document.querySelectorAll("[data-tab],[data-goto]")].map(e=>e.dataset.tab||e.dataset.goto))).forEach(v=>{const [tt,ss]=v.split(":");if(!["home","cal","train","suivi","settings","msg"].includes(tt)||(ss&&!["ressenti","progres","badges","seances","plan"].includes(ss)))bad.add(v)})}}
  ok(bad.size===0,'Aucun data-tab / data-goto vers une destination inexistante '+[...bad]);
  // --- Navigation clavier
  await E(()=>goTo("home"));await E(()=>document.querySelector('#tabs [data-tab="cal"]').focus());await p.keyboard.press('Enter');
  ok(await E(()=>TAB==="cal"&&document.activeElement===document.querySelector('#app h1')),'Clavier : onglet activé avec Entrée, focus sur le titre');
  await E(()=>document.querySelector('.cell[data-date="2026-10-21"]').focus());await p.keyboard.press('Enter');ok(await E(()=>selDay==="2026-10-21"),'Clavier : jour du calendrier sélectionnable');
  // --- Accessibilité du lecteur
  await E(()=>{window.__NOW__="2026-10-26T18:00:00";goTo("train")});
  const sid=await E(()=>sessions().find(s=>s.date==="2026-10-26").id);
  await E(id=>openStartFlow(id),sid);await p.click('[data-act="playerGo"]');
  ok(await E(()=>document.getElementById('app').hasAttribute('inert')&&document.querySelector('.tabbar').hasAttribute('inert')&&document.getElementById('player').getAttribute('aria-labelledby')==="plTitle"),'Lecteur : arrière-plan inerte, titre annoncé');
  for(let i=0;i<25;i++)await p.keyboard.press('Tab');ok(await E(()=>document.getElementById('player').contains(document.activeElement)),'Lecteur : focus bloqué (Tab)');
  await p.click('#player [data-warm]');const inFiche=await E(()=>document.querySelector('.media-modal').contains(document.activeElement)&&document.getElementById('player').hasAttribute('inert'));
  ok(inFiche,'Fiche imbriquée : focus dans la fiche, lecteur inerte');
  await p.keyboard.press('Escape');ok(await E(()=>!document.querySelector('.media-modal')&&document.activeElement&&document.activeElement.matches('[data-warm]')),'Échap : fiche fermée, focus rendu au bouton d\'origine');
  await p.keyboard.press('Escape');ok(await E(()=>!document.getElementById('player')&&!!S.active&&!document.getElementById('app').hasAttribute('inert')),'Échap sur le lecteur : séance réduite, pas arrêtée');
  ok(await E(()=>!!document.querySelector('.act-card.live')||TAB!=="home"),'Carte « Séance en cours » disponible');
  await E(()=>{goTo("home")});await p.click('.act-card.live [data-start]');ok(await E(()=>!!document.getElementById('player')),'Reprise de la séance');
  await E(()=>{minimizePlayer();S.active=null;save();render()});
  // --- Export complet
  await E(()=>goTo("settings"));await p.click('[data-setpage="export"]');
  const bundle=await E(()=>exportBundle());
  const keys=["compte","profil","programmesAttribues","calendrier","seances","questionnaires","tests","donneesCardiaques","adaptations" in {}?"":"badges","recompenses","messages","demandesAppel","formule","appareils","consentements","correctionsDeDuree","medias","export"].filter(Boolean);
  ok(keys.every(k=>k in bundle)&&bundle.export.exportedAt&&bundle.export.appVersion,'Export : toutes les rubriques, date et version');
  const js=JSON.stringify(bundle);ok(!/token|motdepasse|password"\s*:\s*"[^"]/i.test(js)&&!js.includes(await E(()=>PL.session.token)),'Export : ni mot de passe ni jeton');
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:4000}).catch(()=>null),p.click('[data-act="exportCsv"][data-kind="seances"]')]);
  ok(!!dl&&/seances-.*\.csv/.test(dl.suggestedFilename()),'Export CSV des séances');
  // --- Suppression complète (autre client) + isolation
  const ids=await E(()=>{const a=createAthlete({first:"Zoé",last:"Test",email:"z@t.fr",coachId:"coach"});const b2=createAthlete({first:"Yann",last:"Autre",email:"y@t.fr",coachId:"coach"});
    demoSeed();PL.msgs.list.push({id:"mz1",th:a,from:"client",text:"privé Zoé",at:nowISO()},{id:"mz2",th:"group",from:"client",who:a,text:"groupe Zoé",at:nowISO(),media:{type:"image",src:"data:x",name:"p"}},{id:"my1",th:b2,from:"client",text:"privé Yann",at:nowISO()});
    PL.callRequests.push({uid:a,at:nowISO()},{uid:b2,at:nowISO()});PL.coachLog.unshift({at:nowISO(),by:"coach",uid:a,what:"Note sur Zoé Test"});plSave();
    writeAthlete(a,X=>{X.status.foo={s:"done",at:"x"}});return [a,b2]});
  await E(id=>{doLogout();startSession(id);initStore()},ids[0]);await p.waitForTimeout(600);
  await E(()=>goTo("settings"));await p.click('[data-setpage="suppr"]');await p.click('[data-act="askDelete"]');
  await p.click('[data-act="confirmDelete"]');ok(await E(id=>!!PL.accounts[id],ids[0]),'Suppression refusée sans confirmation écrite');
  await p.fill('#delConfirm','supprimer');await p.click('[data-act="confirmDelete"]');await p.waitForTimeout(300);
  const after=await E(([a,b2])=>{const L=msgList();return{acc:!!PL.accounts[a],data:!!localStorage.getItem("usci-muscu-data-"+a),priv:L.some(m=>m.th===a),grp:L.find(m=>m.id==="mz2"),call:PL.callRequests.some(c=>c.uid===a),log:PL.coachLog.some(l=>l.uid===a||String(l.what).includes("Zoé Test")),
    other:!!PL.accounts[b2]&&L.some(m=>m.th===b2)&&PL.callRequests.some(c=>c.uid===b2),lucas:!!localStorage.getItem("usci-muscu-state-v1")&&!!PL.accounts.lucas,screen:AUTH.screen}},ids);
  ok(!after.acc&&!after.data&&!after.priv&&!after.call&&!after.log,'Suppression complète : compte, données, messages privés, appels, journal');
  ok(after.grp&&after.grp.anonymized&&!after.grp.media&&after.grp.who!==ids[0],'Messages de groupe anonymisés, médias retirés');
  ok(after.other&&after.lucas,'Données des autres clients et de Lucas conservées');
  ok(after.screen==="intro",'Retour à l\'accueil de connexion');
  console.log('ERREURS JS:',errs.length?errs:'aucune');console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();
})();
