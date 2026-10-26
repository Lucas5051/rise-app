/* =====================================================================
   DOMAINE · ESPACE COACH (rubriques ajoutées en v10)
   Tests personnalisés, demandes d'appel, identité de marque, confidentialité, export, compte,
   fiche client « Tests » et « Profil et questionnaire » (usage réel de chaque réponse).
   ===================================================================== */
const coachTT=()=>(PL.testTypes||[]).filter(t=>t.coach_id||t.local);
/* ---------- Bibliothèque › Tests ---------- */
function coachTests(){const mine=coachTT();const std=testTypes().filter(t=>!t.coach_id&&!t.local);
  return ch("Tests","Bibliothèque")+`<div class="stack">
   <p class="small muted">Les types de tests servent aux prescriptions « % du 1RM » ou « % d'un test » des programmes. Sans résultat, aucune charge n'est calculée.</p>
   <form class="card stack" id="ttForm" autocomplete="off"><h3>Créer un type de test</h3>
    <div class="grid2">${fld("ttName","Nom du test","text","",null,'placeholder="Ex. : Fente bulgare 5RM"')}${fld("ttUnit","Unité","text","kg")}</div>
    <div class="grid2"><div class="field"><label for="ttKind">Type</label><select id="ttKind"><option value="rm">Charge sur X répétitions (XRM)</option><option value="1rm">1RM mesuré</option><option value="reps">Répétitions max</option><option value="time">Temps</option><option value="distance">Distance</option><option value="jump">Saut</option><option value="other">Autre</option></select></div>${fld("ttReps","Répétitions (si XRM)","number","5","1")}</div>
    <div class="field"><label for="ttFormula">Estimation du 1RM</label><select id="ttFormula"><option value="brzycki">${esc(FORMULAS.brzycki.l)}</option><option value="epley">${esc(FORMULAS.epley.l)}</option><option value="none">Pas d'estimation</option></select></div>
    ${fld("ttEx","Exercices associés (séparés par des virgules)","text","",null,'list="exNamesT"')}<datalist id="exNamesT">${allExerciseNames().map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    <p class="small" id="ttMsg" role="alert"></p><button class="btn full" type="submit">Créer le test</button></form>
   <section class="card"><h3>Tests créés</h3>${mine.length?mine.map(t=>`<div class="list-item" style="cursor:default"><div class="grow"><b>${esc(t.name)}</b><div class="small muted">${esc(t.unit)} · ${t.estimate_1rm?"1RM estimé : "+esc((FORMULAS[(t.formula||"").split(":")[0]]||{}).l||t.formula):"sans estimation"}${(t.exercises||[]).length?" · "+esc(t.exercises.join(", ")):""}</div></div></div>`).join(""):'<p class="small muted">Aucun test personnalisé.</p>'}</section>
   <section class="card"><h3>Tests standards</h3><ul class="clean small">${std.map(t=>`<li>${esc(t.name)} (${esc(t.unit)})${t.estimate_1rm?" · 1RM estimé (Brzycki)":""}</li>`).join("")}</ul></section></div>`}
document.addEventListener("submit",ev=>{if(ev.target.id!=="ttForm")return;ev.preventDefault();if(!isCoachAccount())return;const m=document.getElementById("ttMsg");
  const name=val("ttName").trim(),unit=val("ttUnit").trim()||"kg",kind=val("ttKind"),reps=num(val("ttReps"),1,20),f=val("ttFormula");
  if(!name){m.textContent="Donne un nom au test.";return}const key="c_"+name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,30);
  if(testType(key)){m.textContent="Un test porte déjà ce nom.";return}
  const t={key,name,unit,kind,estimate_1rm:kind==="rm"&&f!=="none",formula:kind==="rm"&&f!=="none"?f+":"+(reps||5):kind==="1rm"?"mesure":null,exercises:val("ttEx").split(",").map(x=>x.trim()).filter(Boolean),coach_id:sidOf("coach")||"local",local:!Cloud.isCloud()};
  PL.testTypes=[...(PL.testTypes||[]),t];PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Type de test créé : « "+name+" »"});plSave();render();toast("Test créé");
  if(Cloud.isCloud()){const row={coach_id:sidOf("coach"),key,name,unit,kind,estimate_1rm:t.estimate_1rm,formula:t.formula,exercises:t.exercises};enqueue({id:"tt|"+key,kind:"upsert",table:"test_types",row,onConflict:"coach_id,key"})}});
/* ---------- Fiche client › Tests : saisie, historique, évolution, 1RM avec formule ---------- */
function caTests(a){const types=testTypes();const rows=types.map(t=>({t,h:testHistory(t.key)})).filter(x=>x.h.length||coachTT().some(c=>c.key===x.t.key));
  return `<form class="card stack" id="caTestForm" data-uid="${a.id}"><h3>Saisir un résultat</h3><div class="grid2">${fld("ctDate","Date","date",todayISO())}<div class="field"><label for="ctKey">Test</label><select id="ctKey">${types.map(t=>`<option value="${esc(t.key)}">${esc(t.name)} (${esc(t.unit)})</option>`).join("")}</select></div></div>
    ${fld("ctVal","Résultat","number","","0.1")}<p class="small" id="ctMsg" role="alert"></p><button class="btn full" type="submit">Enregistrer pour ${esc(accountName(a))}</button>
    <p class="tiny muted">Les charges futures sont recalculées ; les séances déjà réalisées gardent la charge de l'époque.</p></form>
   ${rows.length?rows.map(({t,h})=>{const l=h[h.length-1];const e=t.estimate_1rm||REF_TEST_KEY[t.key]?est1RM(Object.keys(REF_TEST_KEY).find(k=>REF_TEST_KEY[k]===t.key)||t.key):null;
     return `<section class="card"><div class="row between"><h3>${esc(t.name)}</h3>${spark(h.map(p=>({v:p.value})))}</div>${l?`<p class="small">Dernier : <b class="num">${fmt(l.value)} ${esc(t.unit)}</b> le ${fmtShort(l.date)}${h.length>1?" · évolution "+((l.value-h[0].value)>0?"+":"")+fmt(l.value-h[0].value)+" depuis le "+fmtShort(h[0].date):""}</p>`:'<p class="small muted">Aucun résultat.</p>'}
      ${e?`<p class="small">1RM estimé : <b class="num">${fmt(e.v)} kg</b> <span class="tiny muted">(${esc(e.src)})</span></p>`:""}
      ${h.length?`<details class="fold mini-fold"><summary>Historique (${h.length})</summary><div class="fold-body"><ul class="clean small">${h.slice().reverse().map(p=>`<li>${fmtShort(p.date)} : ${fmt(p.value)} ${esc(t.unit)}</li>`).join("")}</ul></div></details>`:""}</section>`}).join(""):'<p class="small muted">Aucun test enregistré.</p>'}`}
document.addEventListener("submit",ev=>{if(ev.target.id!=="caTestForm")return;ev.preventDefault();if(!isCoachAccount())return;const uid_=ev.target.dataset.uid;const m=document.getElementById("ctMsg");
  const key=val("ctKey"),date=val("ctDate")||todayISO(),v=num(val("ctVal"),0,100000);if(v===""){m.textContent="Indique le résultat.";return}const t=testType(key);
  writeAthlete(uid_,S=>{const i=S.tests.findIndex(x=>x.date===date);if(i>=0)S.tests[i]={...S.tests[i],[key]:v};else S.tests.push({date,[key]:v,src:"saisi par le coach"});S.tests.sort((a,b)=>a.date<b.date?-1:1)});
  PL.coachLog.unshift({at:nowISO(),by:"coach",uid:uid_,what:"Test saisi : "+(t?t.name:key)+" = "+fmt(v)+" ("+fmtShort(date)+")"});plSave();render();toast("Résultat enregistré")});
/* ---------- Communication › Demandes d'appel ---------- */
function coachCalls(){const L=(PL.callRequests||[]).slice().sort((a,b)=>a.at<b.at?1:-1);
  return ch("Demandes d'appel","Communication")+`<section class="card">${L.length?L.map((c,i)=>`<div class="list-item" style="cursor:default"><div class="grow"><b>${esc(accountName(PL.accounts[c.uid])||"Client")}</b><div class="small muted">${whenLabel(Date.parse(c.at))} · ${c.mode==="visio"?"visio":"téléphone"}${c.phone?" · "+esc(c.phone):""}${c.slot?" · « "+esc(c.slot)+" »":""}</div></div><span class="chip ${c.status==="fait"?"st-done":"st-todo"}">${esc(c.status||"à traiter")}</span>${c.status!=="fait"?`<button class="btn ghost small" data-calldone="${i}">Marquer traité</button>`:""}</div>`).join(""):'<p class="small muted">Aucune demande.</p>'}</section>`}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-calldone]");if(!b||!isCoachAccount())return;const L=(PL.callRequests||[]).slice().sort((a,c)=>a.at<c.at?1:-1);const c=L[+b.dataset.calldone];if(!c)return;
  c.status="fait";plSave();if(Cloud.isCloud()&&c.id)enqueue({id:"callst|"+c.id,kind:"patch",table:"call_requests",row:{status:"fait"},match:{id:c.id}});render();toast("Demande marquée comme traitée")});
/* ---------- Paramètres coach ---------- */
function coachBrand(){const B=APP_CONFIG;
  return ch("Identité de marque","Paramètres coach")+`<div class="stack"><section class="card"><div class="tablewrap"><table><tbody>
   <tr><td>Nom de l'appli</td><td><b>${esc(B.name)}</b></td></tr><tr><td>Nom court</td><td>${esc(B.shortName)}</td></tr><tr><td>Espace coach</td><td>${esc(B.coachBrand)}</td></tr><tr><td>Coach</td><td>${esc(B.coachName||"—")}</td></tr>
   <tr><td>Couleurs</td><td><span class="swatch" style="background:${B.primaryColor}"></span> ${B.primaryColor} · <span class="swatch" style="background:${B.secondaryColor}"></span> ${B.secondaryColor}</td></tr>
   <tr><td>Logo</td><td>${B.logo?"Fourni":"Aucun logo (aucun logo n'est inventé)"}</td></tr><tr><td>E-mail de support</td><td>${esc(B.supportEmail||"À renseigner")}</td></tr>
   <tr><td>Mentions légales</td><td>${B.legal.editor?esc(B.legal.editor):"À compléter (éditeur, adresse, hébergeur)"}</td></tr><tr><td>Liens</td><td>${Object.entries(B.links).filter(([,v])=>v).map(([k,v])=>esc(k)+" : "+esc(v)).join(" · ")||"Aucun"}</td></tr></tbody></table></div>
   <p class="small muted" style="margin-top:8px">Ces informations sont centralisées dans le fichier de configuration (APP_CONFIG). Logos Apple, Google, Instagram, TikTok, App Store : uniquement les fichiers officiels déposés dans BRAND_ASSETS ; sinon un pictogramme neutre et le nom complet.</p></section></div>`}
function coachPrivacy(){const n=athletes().length;
  return ch("Confidentialité","Paramètres coach")+`<div class="stack"><section class="card stack tight"><h3>Ce que tu peux voir</h3><p class="small">Uniquement les clients rattachés à ton compte (${n}). Le serveur refuse tout autre accès, même en modifiant l'appli.</p>
   <h3>Données de santé</h3><p class="small">Ressentis, douleurs, RPE et fréquence cardiaque sont des données de santé : chaque client donne son consentement à la création du compte et peut exporter ou supprimer ses données à tout moment.</p>
   <h3>Où sont les données</h3><p class="small">${Cloud.isCloud()?"Serveur Supabase, région Paris (UE). Médias dans des compartiments privés, lus par liens temporaires.":"Mode démonstration : sur cet appareil uniquement."}</p>
   <h3>À compléter avant la commercialisation</h3><ul class="clean small"><li>Politique de confidentialité et mentions légales (APP_CONFIG.legal)</li><li>Registre des traitements, durée de conservation</li><li>Contrat de sous-traitance avec l'hébergeur</li></ul></section></div>`}
function coachExport(){return ch("Export","Paramètres coach")+`<section class="card stack"><p class="small">Exporte tes programmes, tes clients (identité et formule), les attributions, les formules, les types de tests et le journal. Les codes d'invitation ne sont jamais exportés en clair.</p><button class="btn full" data-act="coachExportDl">Télécharger (JSON)</button></section>`}
function coachExportData(){const clean=a=>({id:a.id,prenom:a.first,nom:a.last,email:a.email,formule:a.formula||null});
  return{app:APP_CONFIG.name,version:APP_CONFIG.version,exportedAt:nowISO(),coach:clean(PL.accounts.coach||{}),clients:athletes().map(clean),programmes:Object.values(PL.programs||{}),
    attributions:Object.values(PL.assignments||{}).map(a=>({...a,prog:undefined,programme:a.prog&&a.prog.name})),formules:PL.formulas,typesDeTests:coachTT(),journal:PL.coachLog,
    invitations:(PL.srvInvites||PL.invites||[]).map(i=>({prenom:(i.draft||{}).first,cree:i.createdAt,expire:i.expiresAt,utilise:i.usedAt||null,revoque:i.revokedAt||null}))}}
function coachAccount(){const a=PL.accounts.coach||{};
  return ch("Compte","Paramètres coach")+`<div class="stack"><section class="card stack tight"><p><b>${esc(accountName(a))}</b></p><p class="small muted">${esc(a.email||"")}</p>
   <p class="small">Rôle : <b>coach</b>${Cloud.isCloud()?" (attribué par le serveur)":" (démonstration)"}.</p>${Cloud.isCloud()?`<p class="small" id="syncLine">${esc(syncLabel().t)}</p><button class="btn ghost small" data-act="syncNow">Synchroniser maintenant</button>`:""}</section>
   ${coachIsAlsoAthlete()?`<button class="btn secondary full" data-act="goMyTraining">Mon entraînement</button>`:""}
   ${v9ImportCard()}
   <button class="btn danger full" data-act="logout">Se déconnecter</button>${Cloud.isCloud()?`<button class="btn ghost full" data-act="logoutAll">Se déconnecter de tous mes appareils</button>`:""}
   <p class="tiny muted">Un coach qui suit encore des clients ne peut pas supprimer son compte : termine d'abord les suivis.</p></div>`}
document.addEventListener("click",ev=>{if(!ev.target.closest('[data-act="coachExportDl"]')||!isCoachAccount())return;downloadText("export-coach-"+todayISO()+".json",JSON.stringify(coachExportData(),null,1),"application/json")});

/* ---------- Questionnaire : usage réel de chaque réponse ---------- */
const PAIN_OB_TO_ZONE={genou:"genou",cheville:"cheville",dos:"bas_dos",epaule:"epaule",ischios:"ischios",adducteurs:"aine",hanche:"hanche"};
const EQ_NEED=[[/barre(?! de traction)|disque/i,"Barres et disques"],[/rack|cage/i,"Rack ou cage à squat"],[/banc/i,"Banc"],[/halt[èe]re/i,"Haltères"],[/poulie/i,"Poulies"],[/tra[iî]neau/i,"Traîneau"],[/kettlebell/i,"Kettlebells"],[/[ée]lastique/i,"Élastiques"],[/barre de traction/i,"Barre de traction"],[/m[ée]decine|medball/i,"Médecine-ball"],[/machine/i,"Machines guidées"]];
function obOf(clientId){const a=PL.accounts[clientId]||{};const q=a.questionnaire&&Object.keys(a.questionnaire).length?a.questionnaire:null;
  return q||withAthlete(clientId,()=>(S.profile&&S.profile.onboarding)||null)||{}}
/* Contrôles avant attribution / dans l'éditeur, à partir des réponses du client */
function profileChecks(clientId,prog,startDate,startWeek=0){const o=obOf(clientId);const out=[];if(!prog)return out;
  const days=(o.dispo&&o.dispo.days)||null,pref=o.dispo&&+o.dispo.dur;const eq=o.equip||null;const painZ=((o.pain&&o.pain.v)||[]).map(k=>PAIN_OB_TO_ZONE[k]).filter(Boolean);
  const sd=o.sportDetail||{};const matchDays=new Set(Object.values(sd).flatMap(x=>x&&x.matchDays||[]));const sportDays=new Set(Object.values(sd).flatMap(x=>x&&x.days||[]));
  const ss=progSessions(prog).slice(0);const dayKey=d=>String((+d+1)%7); // 0 = lundi dans le programme ; OB_DAYS : "1" = lundi … "0" = dimanche
  ss.forEach(x=>{const ps=x.ps;const dk=dayKey(ps.day);
    if(days&&!days.includes(dk))out.push({k:"dispo",t:`« ${ps.name} » le ${DAYS_L[ps.day].toLowerCase()} : jour non disponible pour ce client.`});
    if(pref&&+ps.dur>pref+10)out.push({k:"duree",t:`« ${ps.name} » dure ${ps.dur} min, plus que la durée préférée (${pref} min).`});
    if((ps.fam==="heavy"||ps.fam==="power")&&[...matchDays].some(m=>m===String((+dk+1)%7)||m===String((+dk+6)%7)))out.push({k:"match",t:`« ${ps.name} » (séance lourde) la veille ou le lendemain d'un jour de match : à éviter (${srcLabel?ruleSrcTxt("legsJ1"):"règle J-1/J+1"}).`});
    if(sportDays.has(dk)&&(ps.fam==="heavy"))out.push({k:"sport",t:`« ${ps.name} » tombe un jour d'entraînement sportif.`});
    (ps.main||[]).forEach(r=>{if(eq){const need=EQ_NEED.filter(([re])=>re.test(exLib(r.n).equip||"")).map(x=>x[1]);const have=eq.cat==="aucun"?[]:(eq.items||[]);const miss=need.filter(n=>!have.includes(n));
        if(need.length&&miss.length)out.push({k:"materiel",t:`« ${r.n} » : matériel absent (${miss.join(", ")}).`})}
      painZ.forEach(z=>{if(painHits({n:r.n,z:exLib(r.n).z||[]},z))out.push({k:"douleur",t:`« ${r.n} » sollicite une zone déclarée douloureuse (${PAIN_ZL(z).toLowerCase()}) : à valider.`})})})});
  const lvl=o.exp&&o.exp.v;if(lvl&&prog.level){const g=(OB_EXP.find(x=>x[0]===lvl)||[])[2]||0;if(prog.level==="avance"&&g<=2||prog.level==="competition"&&g<=3)out.push({k:"niveau",t:`Programme « ${PROG_LEVELS.find(x=>x[0]===prog.level)[1]} » pour un client dont l'expérience est « ${optLabel(OB_EXP,lvl)} ».`})}
  const seen=new Set();return out.filter(x=>!seen.has(x.t)&&seen.add(x.t))}
const ruleSrcTxt=k=>{try{return ruleJustif(k)}catch(e){return "règle J-1 / J+1"}};
const CHK_L={dispo:"Disponibilités",duree:"Durée",match:"Matchs",sport:"Sport",materiel:"Matériel",douleur:"Douleurs déclarées",niveau:"Niveau"};
const checksHtml=L=>L.length?`<div class="alert"><span class="dot"></span><div><b>${L.length} point${L.length>1?"s":""} à vérifier d'après le questionnaire du client</b><ul class="clean small">${L.slice(0,12).map(x=>`<li><b>${esc(CHK_L[x.k])} :</b> ${esc(x.t)}</li>`).join("")}</ul>${L.length>12?`<p class="tiny">… et ${L.length-12} autre(s).</p>`:""}</div></div>`:`<p class="small muted">Aucun conflit détecté avec le questionnaire du client.</p>`;
/* Fiche client › Profil et questionnaire : chaque réponse et ce qu'elle change réellement */
function caProfil(a){const o=obOf(a.id);const L=(list,k)=>optLabel(list,k);const asg=assignmentOf(a.id);
  const R=[
   ["Objectifs",o.goals?(o.goals.v||[]).map(k=>L(OB_GOALS,k)).join(", ")+(o.goals.main?" · principal : "+L(OB_GOALS,o.goals.main):""):null,"Affichés au coach ; servent à proposer une formule. Ne modifient pas un programme automatiquement."],
   ["Sports et niveau",o.sports?(o.sports.v||[]).map(k=>L(OB_SPORTS,k)+(o.levels&&o.levels.v&&o.levels.v[k]?" ("+L(OB_LEVELS,o.levels.v[k])+")":"")).join(", "):null,"Affichés au coach."],
   ["Fréquence par sport",o.freq?Object.entries(o.freq.v||{}).map(([k,v])=>L(OB_SPORTS,k)+" : "+v+"/sem.").join(", "):null,"Affichée au coach."],
   ["Calendrier sportif",o.sportDetail?Object.entries(o.sportDetail).map(([k,v])=>L(OB_SPORTS,k)+" : "+(v.days||[]).map(d=>L(OB_DAYS,d)).join(", ")+(v.time?" à "+v.time:"")+(v.dur?" · "+v.dur+" min":"")+((v.matchDays||[]).length?" · matchs "+v.matchDays.map(d=>L(OB_DAYS,d)).join(", "):"")+(v.fixed===false?" · variable":"")).join(" ; "):null,"UTILISÉ : contrôle des séances lourdes la veille ou le lendemain d'un match et des séances lourdes un jour d'entraînement."],
   ["Expérience en musculation",o.exp?L(OB_EXP,o.exp.v):null,"UTILISÉE : alerte si le niveau du programme attribué est trop élevé."],
   ["Sexe",o.sex?L([["femme","Femme"],["homme","Homme"]],o.sex.v):null,"Enregistré, sans effet automatique."],
   ["Poids, taille, âge",o.body?[isNum(o.body.kg)?fmt(o.body.kg)+" kg":null,o.body.height?o.body.height+" cm":null,o.body.birth?"né(e) en "+o.body.birth:null].filter(Boolean).join(" · "):null,"Poids UTILISÉ : poids de corps des tractions lestées et du suivi. Taille et âge : enregistrés, sans effet automatique."],
   ["Disponibilités",o.dispo?(o.dispo.days||[]).map(k=>L(OB_DAYS,k)).join(", ")+" · "+(o.dispo.dur||"—")+" min":null,"UTILISÉES : alerte si une séance tombe un jour indisponible ou dépasse la durée préférée."],
   ["Équipement",o.equip?({salle:"Salle",domicile:"Domicile",aucun:"Aucun matériel"}[o.equip.cat]||"—")+((o.equip.items||[]).length?" : "+o.equip.items.join(", "):""):null,"UTILISÉ : alerte si un exercice demande un matériel absent."],
   ["Douleurs ou limitations",o.pain?(o.pain.v||[]).map(k=>L(OB_PAIN,k)).join(", ")+(o.pain.txt?" · "+o.pain.txt:""):null,"UTILISÉES : alerte si un exercice sollicite une zone déclarée. Aucun diagnostic."],
   ["Appareils",o.devices?(o.devices.v||[]).map(k=>L(OB_DEVICES,k)).join(", "):null,"Enregistrés, sans effet automatique (connexion Polar proposée dans les réglages de l'athlète)."],
   ["Attentes",o.expect?(o.expect.v||[]).map(k=>L(OB_EXPECT,k)).join(", "):null,"UTILISÉES : formule conseillée à l'inscription."],
   ["Formule",a.formula?(PL.formulas[a.formula]||{}).name:(a.formulaRequest?"demandée : "+(PL.formulas[a.formulaRequest.k]||{}).name:null),"UTILISÉE : droits d'accès (messagerie, calcul des charges, adaptations, suivi…) appliqués par le serveur."]];
  return `<section class="card"><h3>Réponses et utilisation réelle</h3><div class="tablewrap"><table class="q-use"><thead><tr><th>Information</th><th>Réponse</th><th>Ce qu'elle change</th></tr></thead><tbody>${R.map(([k,v,u])=>`<tr><td>${esc(k)}</td><td>${v?esc(v):'<span class="muted">Non renseigné</span>'}</td><td class="small">${esc(u)}</td></tr>`).join("")}</tbody></table></div>
   <p class="tiny muted" style="margin-top:6px">Aucune individualisation n'est annoncée pour une réponse seulement enregistrée.</p></section>
   ${asg&&!asg.prog.engine?`<section class="card stack tight"><h3>Contrôle du programme attribué</h3>${checksHtml(profileChecks(a.id,asg.prog,asg.startDate,asg.startWeek))}</section>`:""}`}
document.addEventListener("change",ev=>{if(ev.target.id!=="asClient")return;const b=document.querySelector('[data-pe="doAssign"]');const p=b&&PL.programs[b.dataset.id];const box=document.getElementById("asChecks");
  if(p&&box){const mt=missingTestsFor(p,ev.target.value);box.innerHTML=checksHtml(profileChecks(ev.target.value,p))+(mt.length?`<div class="alert"><span class="dot"></span><div class="small"><b>Tests manquants :</b> ${mt.map(r=>esc(refLabel(r))).join(", ")}.</div></div>`:"")}});
