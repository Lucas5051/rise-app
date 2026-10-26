// Test bout en bout contre le VRAI serveur Supabase, avec deux navigateurs isolés (= deux appareils) :
// coach sur ordinateur, athlète sur iPhone. Comptes de test en @usci-muscu.test, supprimés à la fin.
const { chromium } = require('playwright');
const BASE=process.env.BASE||'http://localhost:8765/index.html?mode=cloud';
const COACH={email:'coach.test@usci-muscu.test',pass:'TestCoach-2026!'};
const TS=Date.now().toString(36);const ATH={email:`athlete.${TS}@usci-muscu.test`,pass:'Athlete-'+TS+'!x'};
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const cCtx=await b.newContext({viewport:{width:1280,height:900},timezoneId:'Europe/Paris',locale:'fr-FR'});
  const aCtx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Paris',locale:'fr-FR'});
  const errs=[];const mk=async(ctx,tag)=>{const p=await ctx.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>errs.push(tag+': '+e.message));
    p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::/.test(m.text()))errs.push(tag+' console: '+m.text())});return p};
  const C=await mk(cCtx,'coach');const EC=(f,a)=>C.evaluate(f,a);
  const outEmpty=async(p)=>{await wait(1500);for(let i=0;i<40;i++){const n=await p.evaluate(()=>IDB.outAll().then(l=>l.filter(o=>!o.failed).length));if(!n)return true;await wait(500)}return false};

  // ---------- Appareil 1 : coach ----------
  await C.goto(BASE);await C.waitForTimeout(1500);
  ok(await EC(()=>Cloud.isCloud()),'Mode production (serveur) actif');
  await C.click('[data-act="authLogin"]');await C.fill('#lgEmail',COACH.email);await C.fill('#lgPass',COACH.pass);await C.click('#loginForm [type=submit]');
  await C.waitForSelector('.coach-shell');ok(await EC(()=>isCoachAccount()&&Cloud.profile.role==='coach'),'Coach connecté : rôle lu sur le serveur');
  {const t0=Date.now();await EC(()=>pullAll());const ms=Date.now()-t0;ok(ms<3000,'Chargement complet de l\'espace coach en moins de 3 s ('+ms+' ms)');}
  const dow=await EC(()=>(new Date().getDay()+6)%7);const monday=await EC(()=>mondayOf(todayISO()));
  await C.click('[data-ctab="programs"]');await C.click('[data-pe="create"]');
  await C.fill('#pmName','Test serveur '+TS);await C.fill('#pmGoal','Force');await C.selectOption('#pmStatus','active');await C.click('[data-pe="saveMeta"]');
  await C.click('[data-pe="addSession"]');await C.fill('#psName','Full body serveur');await C.selectOption('#psDay',String(dow));await C.fill('#psDur','50');
  await C.click('[data-pe="psGo"][data-step="3"]');await C.click('[data-pe="exAdd"]');await C.fill('#exn0','Squat arrière');await C.fill('#exs0','3');await C.fill('#exr0','8');
  await C.click('[data-pe="saveSession"]');await C.click('[data-pe="close"]');
  const progId=await EC(n=>Object.values(PL.programs).find(p=>p.name===n).id,'Test serveur '+TS);
  ok(await outEmpty(C),'Programme envoyé au serveur (file vide)');
  ok(await EC(id=>Cloud.sb.from('programs').select('id,name,kind').eq('ref',id).then(r=>r.data.length===1&&r.data[0].kind==='template'),progId),'Programme présent en base (tables normalisées)');
  // média d'exercice : envoi dans le stockage privé du serveur
  ok(await EC(async()=>{PL.library["Squat arrière"]={...(PL.library["Squat arrière"]||{}),rights:"Photo de test prise par le coach",status:"publie"};plSave(true);
    const c=document.createElement('canvas');c.width=c.height=8;c.getContext('2d').fillRect(0,0,8,8);return uploadMedia("Squat arrière","photo",dataUrlBlob(c.toDataURL('image/jpeg',.8)),"image/jpeg")}),'Média envoyé dans le stockage privé (droits renseignés)');
  ok(await EC(()=>uploadMedia("Tractions","photo",new Blob(["x"],{type:"image/gif"}),"image/gif").then(r=>r===false)),'Format non autorisé refusé');
  const draftPath=await EC(async()=>{PL.library["Gainage planche"]={...(PL.library["Gainage planche"]||{}),rights:"Photo de test prise par le coach",status:"a_completer"};plSave(true);
    const c=document.createElement('canvas');c.width=c.height=8;c.getContext('2d').fillRect(0,0,8,8);const r=await uploadMedia("Gainage planche","photo",dataUrlBlob(c.toDataURL('image/jpeg',.8)),"image/jpeg");return r&&PL.library["Gainage planche"].photo.slice(3)});
  ok(!!draftPath,'Média d\'une fiche en brouillon envoyé');
  await C.click('[data-ctab="msgs"]');await C.click('[data-ctab="invites"]');await C.fill('#ivFirst','Camille');await C.fill('#ivLast','Test');await C.fill('#ivEmail',ATH.email);
  await C.selectOption('#ivFormula','perso');await C.selectOption('#ivProg',progId);await C.fill('#ivStart',monday);await C.click('#inviteForm [type=submit]');
  await C.waitForSelector('.code-big');const code=(await C.textContent('.code-big')).trim();
  ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code),'Code généré par le serveur : '+code.slice(0,2)+'••-••••');
  await C.click('[data-act="closeSheet"]');
  ok(await EC(()=>/••••-••/.test(document.querySelector('.coach-main').textContent)),'Liste des codes : code masqué (empreinte seulement)');

  // ---------- Appareil 2 : athlète (autre navigateur, aucune donnée partagée) ----------
  const A=await mk(aCtx,'athlete');const EA=(f,a)=>A.evaluate(f,a);
  await A.goto(BASE);await A.waitForTimeout(1500);
  ok(await EA(()=>!localStorage.getItem('usci-platform-v3')||!JSON.parse(localStorage.getItem('usci-platform-v3')).programs||Object.keys(JSON.parse(localStorage.getItem('usci-platform-v3')).programs).length<=1),'Appareil athlète vierge (aucune donnée du coach en local)');
  await A.click('[data-act="authCode"]');await A.fill('#cdCode',code.toLowerCase().replace('-',''));await A.click('#codeForm [type=submit]');
  await A.waitForSelector('[data-act="codeConfirm"]');const vt=await A.textContent('.auth');
  ok(/Camille/.test(vt)&&vt.includes('Test serveur '+TS)&&/Programme personnalisé/.test(vt),'Code reconnu sur un autre appareil : identité, programme et formule préparés');
  await A.fill('#cvLast','Test-Martin');await A.click('[data-act="codeConfirm"]');
  await A.waitForSelector('#accountForm');ok(await EA(e=>document.getElementById('acEmail').value===e,ATH.email),'Adresse préparée par le coach préremplie');
  await A.fill('#acPass','court');await A.click('#accountForm [type=submit]');ok(/10 caractères/.test(await A.textContent('#acMsg')),'Mot de passe trop court refusé');
  await A.fill('#acPass',ATH.pass);await A.click('#accountForm [type=submit]');ok(/consentement/.test(await A.textContent('#acMsg')),'Consentement données de santé obligatoire');
  await A.check('#acConsent');await A.click('#accountForm [type=submit]');
  await A.waitForSelector('[data-act="notifNo"]',{timeout:25000});for(const x of ['notifNo','widgetNo','afterWidget','faceNo'])await A.click(`[data-act="${x}"]`);
  await A.waitForTimeout(800);
  const st=await EA(()=>({tab:TAB,role:Cloud.profile.role,last:me().last,asg:!!assignmentOf(CUR_UID),n:sessions().length,today:sessions().some(s=>s.date===todayISO()),coach:Cloud.isCloud()&&isCoachAccount()}));
  ok(st.tab==='home'&&st.role==='athlete'&&!st.coach,'Compte athlète créé par le serveur (rôle athlète)');
  ok(st.asg&&st.n>=1&&st.today,'Programme attribué et calendrier visible immédiatement '+JSON.stringify(st));
  ok(st.last==='Test-Martin','Correction de l\'athlète enregistrée sur le serveur');
  ok(await EA(()=>!document.querySelector('[data-tab="msg"]')),'Formule « Programme personnalisé » : pas de messagerie affichée');
  ok(await EA(()=>can('auto_loads')&&!can('private_messaging')),'Droits fournis par le serveur (charges oui, messagerie non)');
  ok(await EA(async()=>{await pullLibrary();const v=PL.library["Squat arrière"]&&PL.library["Squat arrière"].photo;if(!isSbMedia(v))return false;
    const r=await Cloud.sb.storage.from("exercise-media").createSignedUrl(v.slice(3),60);if(!r.data)return false;const f=await fetch(r.data.signedUrl);return f.ok}),'Client : média du coach lu par URL signée temporaire');
  ok(await EA(p=>Cloud.sb.storage.from("exercise-media").createSignedUrl(p,60).then(r=>!r.data||!r.data.signedUrl),draftPath),'Client : média d\'une fiche en brouillon illisible');
  ok(await EA(()=>Cloud.sb.storage.from("exercise-media").list(Cloud.coach.id).then(r=>true)&&Cloud.sb.storage.from("exercise-media").upload(Cloud.coach.id+"/pirate.jpg",new Blob(["x"],{type:"image/jpeg"}),{contentType:"image/jpeg"}).then(r=>!!r.error)),'Client : écriture dans les médias du coach refusée');
  const sid=await EA(()=>sessions().find(s=>s.date===todayISO()).id);
  await EA(id=>openSession(id),sid);await A.click('[data-act="toggleMore"]');await A.click('[data-act="manualDone"]');
  await A.click('[data-durmode="md:times"]');await A.fill('#mdStart','18:00');await A.fill('#mdEnd','18:52');await A.click('[data-rpemode="md:now"]');await A.click('[data-rpev="7"]');
  await A.click('[data-act="saveManualDone"]');await A.waitForTimeout(400);await A.click('[data-act="rpeLater"]').catch(()=>{});
  ok(await EA(id=>S.status[id].s==='done'&&S.log[id].dur===52&&S.log[id].rpe===7,sid),'Séance réalisée : 52 min, RPE 7');
  ok(await outEmpty(A),'Séance envoyée au serveur');
  // ---------- Hors ligne ----------
  await aCtx.setOffline(true);await A.waitForTimeout(300);
  await EA(()=>{S.fatigue[todayISO()]={score:72,items:{sommeil:70},at:nowISO(),src:"test hors ligne"};save()});await A.waitForTimeout(1500);
  ok(await EA(()=>IDB.outAll().then(l=>l.some(o=>o.table==='wellness_entries'))),'Hors ligne : modification placée dans la file persistante (IndexedDB)');
  ok(await EA(()=>/Hors ligne/.test(syncLabel().t)),'Indicateur : « Hors ligne · … en attente »');
  await A.close();await aCtx.setOffline(false);                       // appli fermée pendant la coupure, puis réseau revenu
  const A2=await mk(aCtx,'athlete2');const EA2=(f,a)=>A2.evaluate(f,a);await A2.goto(BASE);await A2.waitForTimeout(2500);
  ok(await outEmpty(A2),'Réouverture avec réseau : file envoyée automatiquement');
  ok(await EA2(()=>S.fatigue[todayISO()]&&S.fatigue[todayISO()].score===72),'Aucune perte : questionnaire saisi hors ligne conservé');
  await EA2(()=>flushOutbox());
  // ---------- Sécurité depuis le navigateur de l'athlète ----------
  ok(await EA2(()=>Cloud.sb.from('profiles').update({role:'coach'}).eq('id',Cloud.profile.id).then(r=>!!r.error)),'Client : changement de rôle refusé par le serveur');
  ok(await EA2(()=>Cloud.rpc('coach_snapshot').then(()=>false,()=>true)),'Client : données coach refusées par le serveur');
  ok(await EA2(()=>{PL.accounts[CUR_UID].role='coach';const r=isCoachAccount();PL.accounts[CUR_UID].role='athlete';return r===false}),'Valeur locale modifiée : aucun accès à l\'espace coach');
  ok(await EA2(()=>Cloud.sb.from('programs').update({name:'Piraté'}).neq('id','00000000-0000-0000-0000-000000000000').select().then(r=>(r.data||[]).length===0)),'Client : programme non modifiable');
  ok(await EA2(()=>Cloud.sb.from('session_logs').select('athlete_id').then(r=>r.data.every(x=>x.athlete_id===Cloud.profile.id))),'Client : ne lit que ses propres séances');
  ok(await EA2(()=>Cloud.sb.from('messages').insert({ref:'x1',coach_id:Cloud.coach.id,client_id:Cloud.profile.id,sender_id:Cloud.profile.id,body:'test'}).then(r=>!!r.error)),'Formule sans messagerie : envoi refusé côté serveur');
  ok(await EA2(()=>!document.documentElement.outerHTML.includes('service_role')&&!/sb_secret_/.test(document.documentElement.outerHTML)),'Aucun secret dans le code client');
  const B=await mk(await b.newContext(),'tiers');await B.goto(BASE);await B.waitForTimeout(1200);
  ok(await B.evaluate(c=>Cloud.fn('invite',{action:'preview',code:c}).then(r=>!r.ok&&/invalide ou expiré/.test(r.message)),code),'Code déjà utilisé : refusé (message générique)');
  // ---------- Remontée chez le coach ----------
  await EC(()=>pullAll().then(()=>render()));await C.click('[data-ctab="clients"]');
  const cl=await EC(e=>{const a=Object.values(PL.accounts).find(x=>x.email===e);return a&&a.id},ATH.email);ok(!!cl,'Coach : nouveau client visible après synchronisation');
  await C.click(`[data-cath="${cl}"]`);await C.click('[data-cathsub="seances"]');const txt=await C.textContent('.coach-main');
  ok(/52 min/.test(txt),'Coach : durée réelle synchronisée (52 min)');
  ok(await EC(([u,id])=>withAthlete(u,()=>S.status[id]&&S.status[id].s==='done'&&S.log[id].rpe===7),[cl,sid]),'Coach : statut et RPE synchronisés');
  ok(await EC(u=>withAthlete(u,()=>S.fatigue[todayISO()]&&S.fatigue[todayISO()].score===72),cl),'Coach : questionnaire saisi hors ligne reçu');
  ok(await EC(e=>Cloud.sb.from('profiles').select('id').eq('email',e).then(async r=>{const id=r.data[0].id;const w=await Cloud.sb.from('wellness_entries').select('date').eq('athlete_id',id);const l=await Cloud.sb.from('session_logs').select('slot_id').eq('athlete_id',id);return w.data.length===1&&l.data.length===1}),ATH.email),'Aucun doublon en base (1 séance, 1 questionnaire)');
  // ---------- Export et suppression ----------
  const exp=await EA2(()=>Cloud.rpc('export_my_data'));ok(exp.logs.length===1&&exp.wellness.length===1&&!/password|code_hash/.test(JSON.stringify(exp)),'Export serveur complet, sans secret');
  await EA2(()=>{TAB="settings";SET_PAGE="suppr";render();openDeleteAccount()});await A2.fill('#delConfirm','SUPPRIMER');await A2.click('[data-act="confirmDelete"]');
  await A2.waitForSelector('[data-act="authLogin"]',{timeout:20000});
  await EC(()=>pullAll());ok(await EC(e=>!Object.values(PL.accounts).some(x=>x.email===e&&x.sid),ATH.email),'Suppression : le client disparaît chez le coach');
  ok(await EC(e=>Cloud.sb.from('profiles').select('id').eq('email',e).then(r=>r.data.length===0),ATH.email),'Suppression : profil supprimé en base');
  ok(await EC(id=>Cloud.sb.from('programs').select('name').eq('ref',id).then(r=>r.data[0].name.startsWith('Test serveur')),progId),'Suppression : modèle du coach intact');
  await EC(p=>deleteMedia(p),draftPath);
  ok(await EC(async()=>{const v=PL.library["Squat arrière"].photo;await deleteMedia(v.slice(3));const r=await Cloud.sb.storage.from("exercise-media").list(sidOf("coach")+"/squat-arriere");return !(r.data||[]).length}),'Suppression réelle du fichier média');
  console.log('ERREURS JS:',errs.length?errs:'aucune');console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
