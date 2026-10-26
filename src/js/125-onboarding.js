/* =====================================================================
   MODULE 28 · PREMIÈRE PRISE EN MAIN : introduction, inscription guidée, connexion, code coach,
   notifications, widget, Face ID, traitement, appel gratuit, offres.
   - Brouillon enregistré automatiquement (PL.onboardDraft) : on peut reprendre plus tard.
   - Aucun mot de passe n'est conservé. Apple, Google et Face ID : uniquement avec le serveur et l'appli iPhone.
   ===================================================================== */
let AUTH={screen:"intro"};
const OB_GOALS=[["muscle","Se muscler"],["force","Gagner en force"],["poids","Perdre du poids"],["bases","Apprendre les bases"],["renfo","Faire du renforcement"],["perf","Améliorer mes performances sportives"],["reprise","Reprendre en sécurité"],["mobilite","Améliorer ma mobilité"],["regulier","Devenir plus régulier"],["autre","Autre"]];
const OB_SPORTS=[["football","Football"],["futsal","Futsal"],["basket","Basket"],["handball","Handball"],["rugby","Rugby"],["volley","Volley"],["tennis","Tennis"],["padel","Padel"],["course","Course à pied"],["velo","Cyclisme"],["natation","Natation"],["combat","Sports de combat"],["aucun","Aucun"],["autre","Autre"]];
const OB_LEVELS=[["loisir","Loisir"],["amateur","Compétition amateur"],["national","Avancé ou national"],["haut","Haut niveau"],["pro","Professionnel"]];
const OB_EXP=[["debut","Je débute",1],["m6","Moins de 6 mois",2],["m12","6 à 12 mois",3],["a3","1 à 3 ans",4],["a3p","Plus de 3 ans",5],["compet","Pratique en compétition",6]];
const OB_DAYS=[["1","Lun"],["2","Mar"],["3","Mer"],["4","Jeu"],["5","Ven"],["6","Sam"],["0","Dim"]];
const OB_EQUIP={salle:["Barres et disques","Haltères","Rack ou cage à squat","Banc","Poulies","Machines guidées","Traîneau","Kettlebells","Élastiques"],domicile:["Haltères","Kettlebell","Élastiques","Barre de traction","Banc","Tapis","Médecine-ball"],aucun:[]};
const OB_PAIN=[["aucune","Aucune"],["genou","Genou"],["cheville","Cheville"],["dos","Dos"],["epaule","Épaule"],["ischios","Ischios"],["adducteurs","Adducteurs"],["hanche","Hanche"],["autre","Autre"]];
const OB_DEVICES=[["sante","Apple Santé"],["montre","Montre connectée"],["whoop","Bracelet ou WHOOP"],["oura","Bague Oura"],["ceinture","Ceinture cardiaque"],["gps","Gilet GPS"],["appli","Application d'entraînement"],["aucun","Aucun appareil"],["autre","Autre"]];
const OB_EXPECT=[["suivre","Suivre mes entraînements"],["programme","Recevoir un programme"],["perso","Obtenir un programme personnalisé"],["coach","Être accompagné par un coach"],["perf","Améliorer mes performances"],["reprise","Reprendre en sécurité"],["regularite","Gagner en régularité"],["autre","Autre"]];
const OB_SOURCES=[["instagram","Instagram"],["tiktok","TikTok"],["facebook","Facebook"],["youtube","YouTube"],["google","Google"],["appstore","App Store"],["ami","Ami ou famille"],["club","Club ou coach"],["autre","Autre"]];
/* Ordre imposé par le cahier des charges */
const OB_STEPS=[
 {k:"goals",q:"Quels sont tes objectifs ?",sub:"Choisis-en autant que tu veux, puis désigne ton objectif principal.",type:"goals",req:true},
 {k:"sports",q:"Quels sports pratiques-tu ?",sub:"Plusieurs choix possibles.",type:"multi",opts:OB_SPORTS,req:true,excl:"aucun"},
 {k:"levels",q:"Quel est ton niveau dans chaque sport ?",type:"levels",req:true,skipIf:a=>sportsSel(a).length===0},
 {k:"freq",q:"Combien d'entraînements par semaine pour chaque sport ?",type:"freq",req:true,skipIf:a=>sportsSel(a).length===0},
 {k:"sportDetail",q:"Ton calendrier sportif",sub:"Facultatif. Il sert à éviter les séances lourdes la veille et le lendemain des matchs.",type:"sportDetail",req:false,skipIf:a=>sportsSel(a).length===0},
 {k:"exp",q:"Quelle est ton expérience en musculation ?",type:"exp",req:true},
 {k:"sex",q:"Quel est ton sexe ?",sub:"Il fait partie de l'individualisation, avec tes tests, ton niveau, ton sport, tes contraintes et ta récupération.",type:"single",opts:[["femme","Femme"],["homme","Homme"]],req:true},
 {k:"dispo",q:"Quand peux-tu t'entraîner ?",sub:"Tes jours disponibles et la durée que tu préfères.",type:"dispo",req:true},
 {k:"equip",q:"Quel équipement as-tu ?",type:"equip",req:true},
 {k:"pain",q:"As-tu des douleurs, blessures ou restrictions ?",sub:"Ces informations restent entre toi et ton coach.",type:"pain",req:true},
 {k:"body",q:"Combien pèses-tu ?",type:"weight",req:true},
 {k:"devices",q:"Quels appareils ou applications utilises-tu ?",type:"devices",req:false},
 {k:"expect",q:"Qu'attends-tu de l'application ?",type:"multi",opts:OB_EXPECT,req:true},
 {k:"source",q:"Comment as-tu découvert l'application ?",sub:"Question facultative.",type:"single",opts:OB_SOURCES,req:false},
 {k:"recap",q:"Vérifie tes réponses",sub:"Tu peux corriger chaque réponse avant de créer ton compte.",type:"recap",req:false},
 {k:"account",q:"Crée ton compte",type:"account",req:true}
];
const sportsSel=a=>((a.sports||{}).v||[]).filter(x=>x!=="aucun");
const draft=()=>{if(!PL.onboardDraft)PL.onboardDraft={answers:{},step:0,startedAt:nowISO()};return PL.onboardDraft};
const ans=()=>draft().answers;
function obSave(){draft().updatedAt=nowISO();plSave()}
function obGo(i){const a=ans();let j=i;while(OB_STEPS[j]&&OB_STEPS[j].skipIf&&OB_STEPS[j].skipIf(a))j+=(j>=draft().step?1:-1);draft().step=Math.max(0,Math.min(OB_STEPS.length-1,j));AUTH.screen="q";obSave();render();window.scrollTo(0,0)}
function obNext(){const d=draft();if(d.returnToRecap){d.returnToRecap=false;obGo(OB_STEPS.findIndex(x=>x.k==="recap"));return}obGo(d.step+1)}
function obBack(){if(draft().step===0){AUTH.screen="intro";render();return}const a=ans();let j=draft().step-1;while(j>0&&OB_STEPS[j].skipIf&&OB_STEPS[j].skipIf(a))j--;draft().step=j;obSave();render()}
const optLabel=(list,k)=>(list.find(x=>x[0]===k)||[k,k])[1];
/* ---------- Vues ---------- */
function viewAuth(){
  const s=AUTH.screen;
  return `<div class="auth">${!Cloud.isCloud()?`<div class="demo-banner mode-banner" role="note"><b>Mode démonstration.</b> Les données restent sur cet appareil et aucun compte réel n'est créé.</div>`:""}${({checkMail:authCheckMail,forgot:authForgot,newPass:authNewPass,migrate:authMigrate,migReport:authMigReport,intro:authIntro,q:authQuestion,login:authLogin,coachLogin:authCoachLogin,code:authCode,codeVerify:authCodeVerify,notif:authNotif,widget:authWidget,widgetLater:authWidgetLater,faceid:authFaceId,processing:authProcessing,call:authCall,callWhy:authCallWhy,callBook:authCallBook,offers:authOffers,lock:authLock}[s]||authIntro)()}</div>`;
}
function afterAuthRender(){
  const f=document.querySelector(".auth [data-autofocus]")||document.querySelector(".auth h1");if(f){if(f.tagName==="H1")f.setAttribute("tabindex","-1");f.focus({preventScroll:true})}
  if(AUTH.screen==="q"&&OB_STEPS[draft().step].type==="weight")initWheels();
  if(AUTH.screen==="processing")runProcessing();
}
const obHead=(back=true)=>{const i=draft().step,n=OB_STEPS.length;return `<div class="ob-top">${back?`<button class="icon-btn" data-act="obBack" aria-label="Étape précédente">${ICONS.back}</button>`:"<span></span>"}<div class="ob-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${i+1}" aria-label="Étape ${i+1} sur ${n}"><i style="width:${Math.round((i+1)/n*100)}%"></i></div><button class="linkish small" data-act="obLater">Reprendre plus tard</button></div>`};
/* Introduction : téléphone animé montrant de vrais écrans de l'appli */
function authIntro(){
  const d=PL.onboardDraft;
  return `<div class="intro"><div class="phone" aria-hidden="true"><div class="phone-screen"><div class="slides">${introScreens()}</div></div></div>
   <h1 class="intro-t">Tu viens de faire le premier pas.</h1><p class="intro-p">Construisons la suite, séance après séance, jusqu'à tes objectifs.</p>
   <div class="stack tight intro-btns">${d&&d.step>0?`<button class="btn full big" data-act="obResume" data-autofocus>Reprendre mon inscription (étape ${d.step+1}/${OB_STEPS.length})</button>`:""}
    <button class="btn ${d&&d.step>0?"secondary":""} full big" data-act="obStart" ${d&&d.step>0?"":"data-autofocus"}>Commencer</button>
    <button class="btn secondary full" data-act="authLogin">J'ai déjà un compte</button>
    <button class="btn ghost full" data-act="authCode">J'ai un code coach</button></div>
   <button class="linkish small coach-link" data-act="authCoach">Espace coach</button></div>`;
}
function introScreens(){
  const ring=(v,c)=>`<span class="m-ring" style="--p:${v};--c:${c}"><b>${v}</b></span>`;
  return `<div class="slide"><div class="m-h">Bonjour</div><div class="m-card"><b>Ton ressenti du jour</b><span class="m-btn">Remplir</span></div><div class="m-tiles">${ring(78,"#16a34a")}${ring(86,"#2563EB")}${ring(74,"#4F46E5")}${ring(60,"#F59E0B")}</div><div class="m-card m-act"><b>Principale · force</b><small>65 min · Commencer</small></div></div>
   <div class="slide"><div class="m-h">Calendrier</div><div class="m-cal">${Array.from({length:28},(_,i)=>`<i class="${[1,4,8,11,15,18].includes(i)?"m":[2,9,16].includes(i)?"f":[6,13].includes(i)?"x":""}"></i>`).join("")}</div></div>
   <div class="slide"><div class="m-h">Séance</div><div class="m-work"><b>TRAVAIL</b><span>Série 2/4</span></div><div class="m-card"><b>Squat arrière</b><small>4 × 4 · 85 kg</small></div><div class="m-btn wide">Série terminée</div></div>
   <div class="slide"><div class="m-h">Suivi</div><div class="m-curve"><svg viewBox="0 0 100 40"><polyline points="2,30 18,22 34,26 50,14 66,18 82,10 98,12" fill="none" stroke="#2563EB" stroke-width="3"/></svg></div><div class="m-tiles">${ring(92,"#2563EB")}${ring(4,"#F59E0B")}</div></div>`;
}
/* Marques tierces : logo officiel si son fichier a été déposé dans BRAND_ASSETS (00-config.js), sinon pictogramme neutre
   (jamais l'initiale seule) ; le nom complet du service est toujours écrit à côté. */
const BRAND_GLYPH={apple:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',google:'<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20"/>',instagram:'<rect x="4" y="6" width="16" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',tiktok:'<path d="M9 18a3 3 0 1 1 0-6M9 18V5l8 2"/>',facebook:'<circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M3 19c.6-3 3-5 6-5s5.4 2 6 5M14 15.5c2.6 0 4.4 1.4 5 3.5"/>',youtube:'<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',appstore:'<path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2"/>'};
function brandMark(k){const a=BRAND_ASSETS[k];if(a)return `<img class="brand-mark" src="${esc(a)}" alt="" width="22" height="22">`;const g=BRAND_GLYPH[k];
  return g?`<span class="brand-mark" aria-hidden="true">${svg(g)}</span>`:`<span class="brand-mark" aria-hidden="true">${svg('<circle cx="12" cy="12" r="7"/>')}</span>`}
/* Questions */
function authQuestion(){
  const st=OB_STEPS[draft().step],a=ans(),v=a[st.k]||{};
  let body="",cont=true;
  if(st.type==="goals"){const sel=v.v||[];body=`<div class="ob-grid">${OB_GOALS.map(([k,l],i)=>`<button class="ob-card ${sel.includes(k)?"on":""}" data-obm="goals:${k}" aria-pressed="${sel.includes(k)}"><span class="ob-ic c${i%4}" aria-hidden="true">${goalIcon(k)}</span><span>${l}</span></button>`).join("")}</div>
    ${sel.includes("autre")?`<div class="field"><label for="obOther_goals">Précise ton objectif</label><input id="obOther_goals" value="${esc(v.other||"")}" data-obother="goals"></div>`:""}
    ${sel.length>1?`<div class="field"><span class="lbl" id="mainL">Objectif principal</span><div class="toggles" role="radiogroup" aria-labelledby="mainL">${sel.map(k=>`<button class="toggle" role="radio" aria-checked="${v.main===k}" aria-pressed="${v.main===k}" data-obmain="${k}">${optLabel(OB_GOALS,k)}</button>`).join("")}</div></div>`:""}`}
  else if(st.type==="multi"){const sel=v.v||[];body=`<div class="ob-list">${st.opts.map(([k,l])=>`<button class="ob-opt ${sel.includes(k)?"on":""}" data-obm="${st.k}:${k}" aria-pressed="${sel.includes(k)}"><span>${l}</span><span class="ob-check" aria-hidden="true">${sel.includes(k)?ICONS.check:""}</span></button>`).join("")}</div>${sel.includes("autre")?`<div class="field"><label for="obOther_${st.k}">Précise</label><input id="obOther_${st.k}" value="${esc(v.other||"")}" data-obother="${st.k}"></div>`:""}`}
  else if(st.type==="single"){cont=st.k==="source"?false:false;body=`<div class="ob-list" role="radiogroup" aria-label="${esc(st.q)}">${st.opts.map(([k,l])=>`<button class="ob-opt ${v.v===k?"on":""}" role="radio" aria-checked="${v.v===k}" data-obs="${st.k}:${k}"><span>${st.k==="source"?brandMark(k):""}${l}</span></button>`).join("")}</div>${v.v==="autre"?`<div class="field"><label for="obOther_${st.k}">Précise</label><input id="obOther_${st.k}" value="${esc(v.other||"")}" data-obother="${st.k}"></div>`:""}`;cont=v.v==="autre"}
  else if(st.type==="levels"){body=sportsSel(a).map(sp=>`<div class="field"><span class="lbl" id="lv_${sp}">${esc(sp==="autre"?((a.sports||{}).other||"Autre sport"):optLabel(OB_SPORTS,sp))}</span><div class="toggles" role="radiogroup" aria-labelledby="lv_${sp}">${OB_LEVELS.map(([k,l])=>`<button class="toggle" role="radio" aria-checked="${(v.v||{})[sp]===k}" aria-pressed="${(v.v||{})[sp]===k}" data-oblv="${sp}:${k}">${l}</button>`).join("")}</div></div>`).join("")}
  else if(st.type==="freq"){body=sportsSel(a).map(sp=>{const n=(v.v||{})[sp]??"";return `<div class="stepper-row"><span>${esc(sp==="autre"?((a.sports||{}).other||"Autre sport"):optLabel(OB_SPORTS,sp))}</span><div class="stepper"><button class="icon-btn" data-obfq="${sp}:-1" aria-label="Moins">−</button><b class="num" aria-live="polite">${n===""?"–":n}</b><button class="icon-btn" data-obfq="${sp}:1" aria-label="Plus">+</button></div><span class="small muted">/ semaine</span></div>`}).join("")}
  else if(st.type==="exp"){cont=false;body=`<div class="ob-list" role="radiogroup" aria-label="Expérience">${OB_EXP.map(([k,l,g])=>`<button class="ob-opt exp ${v.v===k?"on":""}" role="radio" aria-checked="${v.v===k}" data-obs="exp:${k}"><span>${l}</span><span class="gauge" aria-hidden="true">${[1,2,3,4,5,6].map(x=>`<i class="${x<=g?"on":""}"></i>`).join("")}</span></button>`).join("")}</div>`}
  else if(st.type==="dispo"){const days=v.days||[];body=`<div class="field"><span class="lbl">Jours disponibles</span><div class="toggles">${OB_DAYS.map(([k,l])=>`<button class="toggle" aria-pressed="${days.includes(k)}" data-obday="${k}">${l}</button>`).join("")}</div></div>
    <div class="field"><span class="lbl" id="durL">Durée préférée d'une séance</span><div class="toggles" role="radiogroup" aria-labelledby="durL">${["30","45","60","75","90"].map(m=>`<button class="toggle" role="radio" aria-checked="${v.dur===m}" aria-pressed="${v.dur===m}" data-obdur="${m}">${m} min</button>`).join("")}</div></div>`}
  else if(st.type==="equip"){const cat=v.cat;body=`<div class="ob-list" role="radiogroup" aria-label="Catégorie">${[["salle","Salle de sport"],["domicile","Matériel à domicile"],["aucun","Aucun matériel"]].map(([k,l])=>`<button class="ob-opt ${cat===k?"on":""}" role="radio" aria-checked="${cat===k}" data-obeqcat="${k}"><span>${l}</span></button>`).join("")}</div>
    ${cat&&OB_EQUIP[cat].length?`<div class="field"><span class="lbl">Précise ton matériel</span><div class="toggles">${OB_EQUIP[cat].map(x=>`<button class="toggle" aria-pressed="${(v.items||[]).includes(x)}" data-obeq="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>`:""}`}
  else if(st.type==="pain"){const sel=v.v||[];body=`<div class="toggles">${OB_PAIN.map(([k,l])=>`<button class="toggle" aria-pressed="${sel.includes(k)}" data-obm="pain:${k}">${l}</button>`).join("")}</div>
    ${sel.includes("autre")?`<div class="field"><label for="obOther_pain">Précise</label><input id="obOther_pain" value="${esc(v.other||"")}" data-obother="pain"></div>`:""}
    <div class="field"><label for="obPainTxt">Restrictions médicales ou précisions (facultatif)</label><textarea id="obPainTxt" data-obtext="pain">${esc(v.txt||"")}</textarea></div>`}
  else if(st.type==="weight"){const u=v.unit||"kg",w=isNum(v.kg)?+v.kg:70,disp=u==="lb"?w*LB:w;const r10=Math.round(disp*10)/10,ip=Math.floor(r10),dp=Math.round((r10-ip)*10)%10;const [lo,hi]=W_RANGE[u];
    body=`<div class="w-big num" aria-live="polite" id="wBig">${fmt(r10,1)} ${u}</div><p class="small center ${v.confirmed?"":"muted"}" id="wState">${v.confirmed?"Poids confirmé.":"Valeur proposée, pas encore enregistrée : fais défiler, saisis ton poids ou confirme."}</p>
     <div class="wheels" aria-hidden="true"><div class="wheel" id="wInt">${Array.from({length:hi-lo+1},(_,i)=>`<span data-v="${i+lo}" class="${i+lo===ip?"on":""}">${i+lo}</span>`).join("")}</div><b class="w-dot">,</b><div class="wheel" id="wDec">${Array.from({length:10},(_,i)=>`<span data-v="${i}" class="${i===dp?"on":""}">${i}</span>`).join("")}</div>
     <div class="w-unit" role="radiogroup" aria-label="Unité">${["kg","lb"].map(x=>`<button role="radio" aria-checked="${u===x}" data-obunit="${x}">${x}</button>`).join("")}</div></div>
     ${v.confirmed?"":`<button class="btn secondary full" data-act="obConfirmW">Confirmer ${fmt(r10,1)} ${u}</button>`}
     <div class="field"><label for="wKey">Saisir au clavier (${u}, entre ${lo} et ${hi})</label><input id="wKey" type="number" inputmode="decimal" step="0.1" min="${lo}" max="${hi}" value="${v.confirmed?r10:""}" placeholder="${r10}" aria-describedby="wState"></div>
     <div class="grid2">${fld("obHeight","Taille (cm, facultatif)","number",v.height||"","1")}${fld("obBirth","Année de naissance (facultatif)","number",v.birth||"","1")}</div>`}
  else if(st.type==="devices"){const sel=v.v||[];body=`<div class="ob-list">${OB_DEVICES.map(([k,l])=>`<button class="ob-opt ${sel.includes(k)?"on":""}" data-obm="devices:${k}" aria-pressed="${sel.includes(k)}"><span>${l}</span><span class="ob-check" aria-hidden="true">${sel.includes(k)?ICONS.check:""}</span></button>`).join("")}</div>
    ${sel.filter(k=>k!=="aucun"&&k!=="sante").map(k=>`<div class="field"><label for="dv_${k}">${optLabel(OB_DEVICES,k)} : marque et modèle</label><input id="dv_${k}" value="${esc((v.models||{})[k]||"")}" data-obdev="${k}"></div>`).join("")}`}
  else if(st.type==="sportDetail"){const D=a.sportDetail=a.sportDetail||{};body=sportsSel(a).map(sp=>{const v=D[sp]||{};const nm=esc(sp==="autre"?((a.sports||{}).other||"Autre sport"):optLabel(OB_SPORTS,sp));
      return `<section class="card stack tight sd-card"><h3>${nm}${(a.freq&&a.freq.v&&isNum(a.freq.v[sp]))?` <span class="small muted">· ${a.freq.v[sp]} entraînement(s) par semaine</span>`:""}</h3>
       <div class="field"><span class="lbl">Jours habituels</span><div class="toggles">${OB_DAYS.map(([k,l])=>`<button class="toggle" aria-pressed="${(v.days||[]).includes(k)}" data-obsd="${sp}:days:${k}">${l}</button>`).join("")}</div></div>
       <div class="grid2"><div class="field"><label for="sdt_${sp}">Horaire habituel</label><input id="sdt_${sp}" type="time" value="${esc(v.time||"")}" data-obsdt="${sp}"></div>
       <div class="field"><span class="lbl" id="sdd_${sp}">Durée habituelle</span><div class="toggles" role="radiogroup" aria-labelledby="sdd_${sp}">${["60","75","90","120"].map(m=>`<button class="toggle" role="radio" aria-checked="${v.dur===m}" aria-pressed="${v.dur===m}" data-obsd="${sp}:dur:${m}">${m} min</button>`).join("")}</div></div></div>
       <div class="field"><span class="lbl">Jours de match ou de compétition</span><div class="toggles">${OB_DAYS.map(([k,l])=>`<button class="toggle" aria-pressed="${(v.matchDays||[]).includes(k)}" data-obsd="${sp}:matchDays:${k}">${l}</button>`).join("")}</div></div>
       <div class="field"><span class="lbl" id="sdf_${sp}">Calendrier</span><div class="toggles" role="radiogroup" aria-labelledby="sdf_${sp}">${[["1","Fixe"],["0","Variable"]].map(([k,l])=>`<button class="toggle" role="radio" aria-checked="${String(v.fixed===false?0:v.fixed===true?1:"")===k}" aria-pressed="${String(v.fixed===false?0:v.fixed===true?1:"")===k}" data-obsd="${sp}:fixed:${k}">${l}</button>`).join("")}</div></div></section>`}).join("")}
  else if(st.type==="recap"){body=`<div class="stack tight">${OB_STEPS.map((x,i)=>({x,i})).filter(({x})=>!["recap","account"].includes(x.k)&&!(x.skipIf&&x.skipIf(a))).map(({x,i})=>{const t=recapText(x.k,a);
      return `<div class="list-item recap-row" style="cursor:default"><div class="grow"><b class="small">${esc(x.q)}</b><div class="small ${t?"":"muted"}">${t?esc(t):(a[x.k]&&a[x.k].skipped?"Passée":"Non renseignée")}</div></div><button class="btn ghost small" data-obedit="${i}" aria-label="Modifier : ${esc(x.q)}">Modifier</button></div>`}).join("")}</div>`;cont=true}
  else if(st.type==="account")return authAccount();
  const ok=stepValid(st,a);
  return `<div class="ob">${obHead()}<h1>${esc(st.q)}</h1>${st.sub?`<p class="ob-sub">${esc(st.sub)}</p>`:""}<div class="ob-body">${body}</div>
   <div class="ob-foot">${cont||["goals","multi","levels","freq","sportDetail","recap","dispo","equip","pain","weight","devices"].includes(st.type)?`<button class="btn full big" data-act="obContinue" ${ok?"":"disabled"}>Continuer</button>`:""}${!st.req?`<button class="btn ghost full" data-act="obSkip">Passer cette question</button>`:""}</div></div>`;
}
function goalIcon(k){return ({muscle:ICONS.train,force:svg('<path d="M4 12h16M7 8v8M17 8v8"/>'),poids:svg('<path d="M5 20h14l-2-12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),bases:svg('<path d="M4 19V5l8 4 8-4v14l-8 4z"/>'),renfo:svg('<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>'),perf:ICONS.run,reprise:ICONS.heart,mobilite:svg('<circle cx="12" cy="12" r="8"/><path d="M12 4v8l5 3"/>'),regulier:ICONS.cal,autre:ICONS.plus})[k]}
function stepValid(st,a){const v=a[st.k]||{};
  switch(st.type){case "goals":return (v.v||[]).length>0&&((v.v||[]).length<2||!!v.main)&&(!(v.v||[]).includes("autre")||!!(v.other||"").trim());
   case "multi":return !st.req||((v.v||[]).length>0&&(!(v.v||[]).includes("autre")||!!(v.other||"").trim()));
   case "levels":return sportsSel(a).every(sp=>(v.v||{})[sp]);
   case "freq":return sportsSel(a).every(sp=>isNum((v.v||{})[sp]));
   case "dispo":return (v.days||[]).length>0&&!!v.dur;
   case "equip":return !!v.cat;
   case "pain":return (v.v||[]).length>0&&(!(v.v||[]).includes("autre")||!!(v.other||"").trim());
   case "weight":return isNum(v.kg)&&!!v.confirmed;
   case "devices":return true;
   default:return true}}
/* Sélecteur de poids à rouleaux (défilement + clavier) */
const LB=2.20462;const W_RANGE={kg:[30,250],lb:[66,551]};
/* Le poids n'est enregistré qu'après une action volontaire : défilement par l'utilisateur, saisie, ou « Confirmer ». */
function initWheels(){
  ["wInt","wDec"].forEach(id=>{const w=document.getElementById(id);if(!w)return;const on=w.querySelector(".on");if(on)w.scrollTop=on.offsetTop-w.clientHeight/2+on.clientHeight/2;
    const mark=()=>{w._user=true};["pointerdown","touchstart","wheel","keydown"].forEach(e=>w.addEventListener(e,mark,{passive:true}));
    let tm=null;w.addEventListener("scroll",()=>{if(!w._user)return;clearTimeout(tm);tm=setTimeout(()=>setWheel(true),120)},{passive:true});
    w.addEventListener("click",e=>{const s=e.target.closest("span[data-v]");if(!s)return;w._user=true;s.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})})});
}
function wheelVal(id){const w=document.getElementById(id);if(!w)return 0;const mid=w.scrollTop+w.clientHeight/2;let best=null,bd=1e9;w.querySelectorAll("span").forEach(s=>{const d=Math.abs(s.offsetTop+s.clientHeight/2-mid);if(d<bd){bd=d;best=s}});w.querySelectorAll("span").forEach(s=>s.classList.toggle("on",s===best));return best?+best.dataset.v:0}
function setWheel(confirm){const a=ans(),u=(a.body||{}).unit||"kg";const disp=wheelVal("wInt")+wheelVal("wDec")/10;setWeight(disp,u,confirm)}
function setWeight(disp,u,confirm){const a=ans();const [lo,hi]=W_RANGE[u];if(!(disp>=lo&&disp<=hi))return false;const kg=u==="lb"?disp/LB:disp;
  a.body={...(a.body||{}),kg:Math.round(kg*10)/10,unit:u,confirmed:a.body&&a.body.confirmed||!!confirm};obSave();
  const b=document.getElementById("wBig");if(b)b.textContent=fmt(disp,1)+" "+u;const st=document.getElementById("wState");if(st&&a.body.confirmed){st.textContent="Poids confirmé : "+fmt(disp,1)+" "+u+(u==="lb"?" ("+fmt(a.body.kg,1)+" kg)":"")+".";st.classList.remove("muted")}
  const c=document.querySelector('.auth [data-act="obConfirmW"]');if(c&&a.body.confirmed)c.remove();
  const btn=document.querySelector('.auth [data-act="obContinue"]');if(btn)btn.disabled=!stepValid(OB_STEPS[draft().step],a);return true}
/* Création du compte */
function authAccount(){const fromCode=!!AUTH.invite;const d=AUTH.invite?AUTH.invite.draft:{};const v=ans().account||{};
  return `<div class="ob">${fromCode?`<div class="ob-top"><button class="icon-btn" data-act="codeBack" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div>`:obHead()}<h1>Crée ton compte</h1><p class="ob-sub">Choisis ta méthode de connexion.</p>
   <div class="stack tight"><button class="btn sso full" data-sso="apple">${brandMark("apple")}Continuer avec Apple</button>
    <button class="btn sso full" data-sso="google">${brandMark("google")}Continuer avec Google</button>
    <p class="small muted" id="ssoMsg" role="status"></p></div>
   <div class="or"><span>ou avec ton e-mail</span></div>
   <form class="stack" id="accountForm" autocomplete="on" novalidate>
    <div class="grid2">${fld("acFirst","Prénom","text",v.first||d.first||"",null,'autocomplete="given-name" required')}${fld("acLast","Nom","text",v.last||d.last||"",null,'autocomplete="family-name" required')}</div>
    ${fld("acEmail","Adresse e-mail","email",v.email||d.email||"",null,'autocomplete="email" required')}
    <div class="field"><label for="acPass">Mot de passe (${Cloud.isCloud()?10:8} caractères minimum)</label><input id="acPass" type="password" autocomplete="new-password" minlength="${Cloud.isCloud()?10:8}" required aria-describedby="passHelp"><p class="tiny muted" id="passHelp">${Cloud.isCloud()?"10 caractères minimum. Il est vérifié par le serveur et n'est jamais enregistré sur ton téléphone.":"Démonstration : il n'est ni conservé ni vérifié."}</p></div>${Cloud.isCloud()?consentBox():""}
    <p class="small" id="acMsg" role="alert"></p>
    <button class="btn full big" type="submit">Créer mon compte</button></form></div>`}
function submitAccount(){
  if(Cloud.isCloud())return cloudAccount();
  const first=val("acFirst").trim(),last=val("acLast").trim(),email=val("acEmail").trim().toLowerCase(),pass=val("acPass");const msg=document.getElementById("acMsg");
  if(!first||!last){msg.textContent="Indique ton prénom et ton nom.";return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent="Adresse e-mail invalide.";return}
  if(String(pass).length<8){msg.textContent="Le mot de passe doit contenir au moins 8 caractères.";return}
  if(Object.values(PL.accounts).some(x=>(x.email||"").toLowerCase()===email)){msg.textContent="Un compte existe déjà avec cette adresse : utilise « J'ai déjà un compte ».";return}
  // le mot de passe n'est ni conservé ni transmis dans ce prototype
  const inv=AUTH.invite;
  const id=createAthlete({first,last,email,provider:"email",coachId:inv?"coach":null,formula:inv?inv.draft.formula:null,profile:inv?{fromInvite:true,interview:inv.draft}:{onboarding:{...ans()}}});
  if(inv){const I=PL.invites.find(x=>x.code===inv.code);if(I){I.usedAt=nowISO();I.usedBy=id}PL.coachLog.unshift({at:nowISO(),by:"système",uid:id,what:"Compte créé avec le code "+inv.code+" ("+first+" "+last+")"});
    const d=inv.draft;if(d.programId&&PL.programs[d.programId]){try{assignProgram({clientId:id,programId:d.programId,startDate:d.startDate||todayISO(),startWeek:+d.startWeek||0,coachId:d.coachId||"coach",by:"invitation",note:"code "+inv.code})}catch(e){}}}
  else PL.onboardDraft={...draft(),done:true,accountId:id};
  startSession(id);loadAthlete(id);
  AUTH={screen:"notif",fromCode:!!inv};render();
}
/* Notifications : explication personnalisée, puis demande du téléphone seulement si l'athlète accepte */
function authNotif(){const n=firstName();
  return `<div class="ob center"><div class="ob-hero">${svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>','width="64" height="64"')}</div><h1>${n?esc(n)+", on":"On"} te rappelle l'essentiel ?</h1>
   <p class="ob-sub">Un rappel pour ton ressenti du matin, ton RPE 30 min après la séance, et si tu oublies de terminer une séance. Jamais de publicité.</p>
   <div class="ob-foot"><button class="btn full big" data-act="notifYes" data-autofocus>Activer les rappels</button><button class="btn ghost full" data-act="notifNo">Pas maintenant</button></div></div>`}
function authWidget(){
  return `<div class="ob center"><h1>Ajoute le widget à ton écran d'accueil pour garder ta série visible.</h1><div class="phone-mini" aria-hidden="true">${widgetPreview()}</div>
   <p class="small muted">Le widget fonctionne avec l'appli iPhone installée. Dans ce prototype, l'ajout n'est pas possible : l'aperçu montre ce qu'il affichera.</p>
   <div class="ob-foot"><button class="btn full big" data-act="widgetYes" data-autofocus>Ajouter un widget</button><button class="btn ghost full" data-act="widgetNo">Pas maintenant</button></div></div>`}
function authWidgetLater(){return `<div class="ob center"><p class="eyebrow big-eyebrow">PAS DE SOUCI</p><h1>Tu pourras toujours ajouter le widget plus tard.</h1><p class="ob-sub">Il reste accessible dans Paramètres › Widget.</p><div class="ob-foot"><button class="btn full big" data-act="afterWidget" data-autofocus>Continuer</button></div></div>`}
function authFaceId(){const nat=Native.has("biometric");
  return `<div class="ob center"><div class="ob-hero">${svg('<path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2M9 9v1M15 9v1M12 9v4h-1M9 16c1.5 1.3 4.5 1.3 6 0"/>','width="64" height="64"')}</div><h1>Activer Face ID ?</h1>
   <p class="ob-sub">${nat?"À chaque ouverture, ton visage (ou le code de ton iPhone en secours) déverrouille l'appli.":"Face ID et le code de l'iPhone fonctionnent dans l'appli iPhone installée. Ce prototype web ne peut pas les utiliser : rien n'est activé ici."}</p>
   <div class="ob-foot">${nat?`<button class="btn full big" data-act="faceYes" data-autofocus>Activer Face ID</button>`:""}<button class="btn ${nat?"ghost":""} full" data-act="faceNo" ${nat?"":"data-autofocus"}>${nat?"Plus tard":"Continuer"}</button></div></div>`}
/* Traitement : vraies étapes, jamais artificiellement longues */
const PROC_STEPS=["Création du profil","Analyse des objectifs","Préparation des recommandations","Finalisation du calendrier"];
function authProcessing(){return `<div class="ob center"><h1>Préparation de ton espace</h1><ol class="proc" aria-live="polite">${PROC_STEPS.map((x,i)=>`<li data-pi="${i}"><span class="pi" aria-hidden="true"></span>${x}</li>`).join("")}</ol><p class="small muted" id="procOut"></p></div>`}
async function runProcessing(){
  const a=PL.accounts[CUR_UID],o=(S.profile||{}).onboarding||{};const res={};
  const steps=[
   ()=>{S.profile={...(S.profile||{}),first:a.first,last:a.last,sex:(o.sex||{}).v,exp:(o.exp||{}).v,weight:(o.body||{}).kg,height:(o.body||{}).height,birth:(o.body||{}).birth};if(isNum((o.body||{}).kg))S.settings.bw=+o.body.kg},
   ()=>{const g=o.goals||{};res.goal=g.main||(g.v||[])[0];S.profile.goals=g.v||[];S.profile.mainGoal=res.goal},
   ()=>{const e=(o.expect||{}).v||[];res.formula=e.includes("coach")?"coaching":e.includes("perso")?"perso":"programmes";S.profile.suggestedFormula=res.formula},
   ()=>{const d=o.dispo||{};S.profile.days=d.days||[];S.profile.prefDur=d.dur;save()}];
  for(let i=0;i<steps.length;i++){steps[i]();const li=document.querySelector(`[data-pi="${i}"]`);if(li)li.classList.add("ok");await new Promise(r=>setTimeout(r,matchMedia("(prefers-reduced-motion: reduce)").matches?60:280))}
  const out=document.getElementById("procOut");if(out)out.textContent="Objectif principal : "+(res.goal?optLabel(OB_GOALS,res.goal):"—")+". Formule conseillée : "+PL.formulas[res.formula].name+".";
  setTimeout(()=>{AUTH={screen:"call"};render()},matchMedia("(prefers-reduced-motion: reduce)").matches?100:500);
}
/* Appel gratuit */
function authCall(){return `<div class="ob center"><div class="ob-hero">${svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>','width="64" height="64"')}</div><h1>Un appel gratuit pour choisir ta formule ?</h1>
  <p class="ob-sub">15 minutes par téléphone ou en visio avec ton coach, sans engagement.</p>
  <div class="ob-foot"><button class="btn full big" data-act="callYes" data-autofocus>Réserver un appel gratuit</button><button class="btn ghost full" data-act="callNo">Non merci</button></div></div>`}
function authCallWhy(){return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="callBack" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>Ce que cet échange peut t'apporter</h1>
  <ul class="why">${["Clarifier tes objectifs","T'orienter vers la formule la plus adaptée","Recevoir tes premières recommandations","Avoir des réponses à toutes tes questions"].map(x=>`<li>${ICONS.check}<span>${x}</span></li>`).join("")}</ul>
  <div class="ob-foot"><button class="btn full big" data-act="callYes">Réserver finalement un appel</button><button class="btn secondary full" data-act="toOffers" data-autofocus>Passer et voir les formules</button></div></div>`}
function authCallBook(){return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="callBack" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>Réserver un appel</h1>
  <div class="field"><span class="lbl" id="cmL">Format</span><div class="toggles" role="radiogroup" aria-labelledby="cmL">${[["tel","Téléphone"],["visio","Visioconférence"]].map(([k,l])=>`<button class="toggle" role="radio" data-callmode="${k}" aria-checked="${AUTH.callMode===k}" aria-pressed="${AUTH.callMode===k}">${l}</button>`).join("")}</div></div>
  ${fld("cbPhone","Téléphone (si appel)","tel","")}<div class="field"><label for="cbSlot">Créneaux qui t'arrangent</label><input id="cbSlot" placeholder="Ex. : mardi soir après 19 h"></div>
  <p class="small muted">Ta demande est transmise à ton coach, qui te recontacte. (Prototype : la demande est enregistrée sur cet appareil.)</p>
  <div class="ob-foot"><button class="btn full big" data-act="callSend">Envoyer ma demande</button></div></div>`}
/* Offres : 3 cartes verticales, formule recommandée identifiée, comparaison dépliable */
const OFFERS={
 programmes:{feat:["Programmes prédéfinis","Calendrier","Séances guidées","Suivi simple","Questionnaire de ressenti","Badges"],no:["Pas d'individualisation complète","Pas de suivi hebdomadaire par le coach"]},
 perso:{feat:["Toutes les fonctions de « Programmes »","Programme adapté à ton profil","Tests individualisés","Calcul des charges","Planification personnalisée","Adaptations automatiques encadrées"],no:["Pas de suivi hebdomadaire systématique par le coach"]},
 coaching:{feat:["Toutes les fonctions précédentes","Suivi direct par le coach","Adaptations manuelles","Messagerie privée","Bilan hebdomadaire","Appels ou visios selon la formule"],no:[]}
};
const CMP=[["Séances guidées et calendrier",1,1,1],["Questionnaire de ressenti et badges",1,1,1],["Programme adapté à ton profil",0,1,1],["Tests individualisés et calcul des charges",0,1,1],["Adaptations automatiques encadrées",0,1,1],["Suivi direct et adaptations manuelles par le coach",0,0,1],["Messagerie privée",0,0,1],["Bilan hebdomadaire",0,0,1]];
function authOffers(){
  return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="offersBack" aria-label="Retour">${ICONS.back}</button><span></span><button class="linkish small" data-act="offersSkip">Plus tard</button></div><h1>Choisis ta formule</h1>
   <div class="offers">${Object.entries(PL.formulas).filter(([,f])=>f.enabled!==false).map(([k,f])=>`<section class="offer ${f.recommended?"rec":""}" aria-labelledby="of_${k}">${f.recommended?`<span class="rec-tag">Recommandée</span>`:""}<h2 id="of_${k}">${esc(f.name)}${k==="coaching"&&f.placesLimited?` <span class="chip st-todo">Places limitées</span>`:""}</h2>
     <p class="price">${f.price?esc(f.price):"Tarif communiqué par le coach"}</p><p class="small muted">Engagement : ${f.engagement?esc(f.engagement):"communiqué par le coach"}</p>
     <ul class="clean inc">${OFFERS[k].feat.map(x=>`<li>${ICONS.check}<span>${esc(x)}</span></li>`).join("")}${(k==="coaching"&&f.callsNote?[f.callsNote]:[]).map(x=>`<li>${ICONS.check}<span>${esc(x)}</span></li>`).join("")}</ul>
     ${OFFERS[k].no.length?`<ul class="clean exc">${OFFERS[k].no.map(x=>`<li>${ICONS.cross}<span>${esc(x)}</span></li>`).join("")}</ul>`:""}
     <button class="btn ${f.recommended?"":"secondary"} full" data-pickoffer="${k}">Choisir ${esc(f.name)}</button></section>`).join("")}</div>
   <details class="fold"><summary>Comparer les formules</summary><div class="fold-body tablewrap"><table class="cmp"><thead><tr><th>Fonction</th>${Object.values(PL.formulas).map(f=>`<th>${esc(f.name)}</th>`).join("")}</tr></thead><tbody>${CMP.map(r=>`<tr><td>${esc(r[0])}</td>${r.slice(1).map(x=>`<td>${x?`<span class="yes">${ICONS.check}<span class="sr-only">Inclus</span></span>`:`<span class="no">${ICONS.cross}<span class="sr-only">Non inclus</span></span>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>
   <button class="btn ghost full" data-act="callYes">Réserver un appel pour en parler</button></div>`}
/* Connexion */
function authLogin(){return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="toIntro" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>Connexion</h1>
  <div class="stack tight"><button class="btn sso full" data-sso="apple">${brandMark("apple")}Continuer avec Apple</button><button class="btn sso full" data-sso="google">${brandMark("google")}Continuer avec Google</button><p class="small muted" id="ssoMsg" role="status"></p></div>
  <div class="or"><span>ou avec ton e-mail</span></div>
  <form class="stack" id="loginForm" novalidate>${fld("lgEmail","Adresse e-mail","email","",null,'autocomplete="email"')}<div class="field"><label for="lgPass">Mot de passe</label><input id="lgPass" type="password" autocomplete="current-password"></div>
  ${Cloud.isCloud()?"":`<p class="tiny muted">Mode démonstration : le mot de passe n'est pas vérifié sur cet appareil.</p>`}<p class="small" id="lgMsg" role="alert"></p>
  <button class="btn full big" type="submit">Se connecter</button></form>${Cloud.isCloud()?`<button class="btn ghost full" data-act="authForgot">Mot de passe oublié ?</button><p class="small muted" style="text-align:center">Coach ou athlète : la même connexion. Ton espace dépend du rôle enregistré sur le serveur.</p>`:""}</div>`}
function submitLogin(){if(Cloud.isCloud())return cloudLogin();const email=val("lgEmail").trim().toLowerCase();const m=document.getElementById("lgMsg");
  const acc=Object.values(PL.accounts).find(a=>a.role==="athlete"&&(a.email||"").toLowerCase()===email);
  if(!acc){m.textContent="Aucun compte athlète avec cette adresse sur cet appareil.";return}
  startSession(acc.id);location.hash="";initStore()}
function authCoachLogin(){if(Cloud.isCloud())return authLogin();return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="toIntro" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>Espace coach</h1>
  <p class="ob-sub">Réservé au coach. Les comptes athlètes n'y ont jamais accès.</p>
  <div class="demo-banner" role="note"><b>Prototype.</b> Sans serveur, l'accès coach est simulé sur cet appareil et aucun mot de passe n'est vérifié. En production, l'authentification et le rôle « coach » sont contrôlés par le serveur.</div>
  <div class="ob-foot"><button class="btn full big" data-act="coachEnter" data-autofocus>Entrer dans l'espace coach (démonstration)</button></div></div>`}
/* Code coach */
function authCode(){return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="toIntro" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>J'ai un code coach</h1>
  <p class="ob-sub">Ton coach t'a donné un code personnel après votre entretien.</p>
  <form class="stack" id="codeForm" novalidate><div class="field"><label for="cdCode">Code (8 caractères)</label><input id="cdCode" class="code-in" autocomplete="one-time-code" autocapitalize="characters" maxlength="9" placeholder="XXXX-XXXX" data-autofocus></div>
  <p class="small" id="cdMsg" role="alert"></p><button class="btn full big" type="submit">Valider le code</button></form></div>`}
function submitCode(){if(Cloud.isCloud())return cloudCode();const r=checkInvite(val("cdCode"));const m=document.getElementById("cdMsg");if(!r.ok){m.textContent=r.msg;return}
  AUTH={screen:"codeVerify",invite:{code:r.inv.code,draft:{...r.inv.draft}}};render()}
function authCodeVerify(){const d=AUTH.invite.draft;const f=AUTH.invite.cloud?{name:d.formulaName}:PL.formulas[d.formula];
  return `<div class="ob"><div class="ob-top"><button class="icon-btn" data-act="authCode" aria-label="Retour">${ICONS.back}</button><span></span><span></span></div><h1>Bonjour ${esc(d.first||"")} !</h1>
   <p class="ob-sub">Ce code est à ton nom. Vérifie les informations préparées avec ton coach et corrige-les si besoin.</p>
   <div class="stack"><div class="grid2">${fld("cvFirst","Prénom","text",d.first||"")}${fld("cvLast","Nom","text",d.last||"")}</div>${fld("cvEmail","E-mail","email",d.email||"",null,d.emailLocked?'readonly aria-describedby="cvEmH"':"")}${d.emailLocked?`<p class="tiny muted" id="cvEmH">Adresse préparée par ton coach : elle sert d'identifiant. Tu pourras la changer ensuite dans Paramètres › Compte.</p>`:""}
    <div class="grid2">${fld("cvSport","Sport et niveau","text",d.sport||"")}${fld("cvGoal","Objectif principal","text",d.goal||"")}</div>
    <section class="card"><p class="small"><b>Formule :</b> ${f?esc(f.name):"—"}</p>${d.programName?`<p class="small" style="margin-top:4px"><b>Programme :</b> ${esc(d.programName)} · démarrage le ${fmtLong(d.startDate||todayISO())}${+d.startWeek?" (semaine "+(+d.startWeek+1)+")":""}${d.coachName?` · coach : ${esc(d.coachName)}`:""}</p>`:d.programId&&PL.programs[d.programId]?`<p class="small" style="margin-top:4px"><b>Programme :</b> ${esc(PL.programs[d.programId].name)} · démarrage le ${fmtLong(d.startDate||todayISO())}${+d.startWeek?" (semaine "+(+d.startWeek+1)+")":""}</p>`:`<p class="small muted" style="margin-top:4px">Ton coach t'attribuera ton programme.</p>`}${d.notes?`<p class="small" style="margin-top:4px"><b>Notes de l'entretien :</b> ${esc(d.notes)}</p>`:""}</section></div>
   <div class="ob-foot"><button class="btn full big" data-act="codeConfirm">C'est bien moi : créer mon compte</button></div></div>`}
function codeConfirm(){const d=AUTH.invite.draft;d.first=val("cvFirst").trim();d.last=val("cvLast").trim();d.email=val("cvEmail").trim();d.sport=val("cvSport").trim();d.goal=val("cvGoal").trim();
  ans().account={first:d.first,last:d.last,email:d.email};obSave();AUTH.screen="q";draft().step=OB_STEPS.length-1;render()}
/* Verrouillage Face ID à l'ouverture (appli iPhone seulement) */
function authLock(){return `<div class="ob center"><h1>${esc(APP_CONFIG.name)} est verrouillée</h1><p class="ob-sub" id="lockMsg">Déverrouille avec Face ID ou le code de ton iPhone.</p><div class="ob-foot"><button class="btn full big" data-act="unlock" data-autofocus>Déverrouiller</button><button class="btn ghost full" data-act="logout">Se connecter autrement</button></div></div>`}
async function tryUnlock(){try{await Native.verify("Déverrouiller "+APP_CONFIG.name);UNLOCKED=true;initStore()}catch(e){const m=document.getElementById("lockMsg");if(m)m.textContent="Échec du déverrouillage. Réessaie ou connecte-toi avec ton e-mail."}}
function recapText(k,a){const v=a[k];if(!v||v.skipped)return "";const L=(list,x)=>optLabel(list,x);
  switch(k){case "goals":return (v.v||[]).map(x=>x==="autre"?v.other:L(OB_GOALS,x)).join(", ")+(v.main?" (principal : "+L(OB_GOALS,v.main)+")":"");
   case "sports":return (v.v||[]).map(x=>x==="autre"?v.other:L(OB_SPORTS,x)).join(", ");
   case "levels":return Object.entries(v.v||{}).map(([s,l])=>L(OB_SPORTS,s)+" : "+L(OB_LEVELS,l)).join(", ");
   case "freq":return Object.entries(v.v||{}).map(([s,n])=>L(OB_SPORTS,s)+" : "+n+"/sem.").join(", ");
   case "sportDetail":return Object.entries(v).filter(([s,d])=>isObj(d)).map(([s,d])=>L(OB_SPORTS,s)+" : "+((d.days||[]).map(x=>L(OB_DAYS,x)).join(" ")||"jours non précisés")+(d.time?" à "+d.time:"")+(d.dur?", "+d.dur+" min":"")+((d.matchDays||[]).length?", matchs "+d.matchDays.map(x=>L(OB_DAYS,x)).join(" "):"")+(d.fixed===false?", variable":d.fixed===true?", fixe":"")).join(" ; ");
   case "exp":return L(OB_EXP,v.v);case "sex":return L([["femme","Femme"],["homme","Homme"]],v.v);
   case "dispo":return (v.days||[]).map(x=>L(OB_DAYS,x)).join(", ")+(v.dur?" · "+v.dur+" min":"");
   case "equip":return ({salle:"Salle",domicile:"Domicile",aucun:"Aucun matériel"}[v.cat]||"")+((v.items||[]).length?" : "+v.items.join(", "):"");
   case "pain":return (v.v||[]).map(x=>x==="autre"?v.other:L(OB_PAIN,x)).join(", ")+(v.txt?" · "+v.txt:"");
   case "body":return isNum(v.kg)?fmt(v.kg)+" kg"+(v.height?" · "+v.height+" cm":"")+(v.birth?" · "+v.birth:""):"";
   case "devices":return (v.v||[]).map(x=>L(OB_DEVICES,x)).join(", ");case "expect":return (v.v||[]).map(x=>L(OB_EXPECT,x)).join(", ");
   case "source":return L(OB_SOURCES,v.v);default:return ""}}
function onboardSummary(o){const L=(list,k)=>optLabel(list,k);const out=[];
  if(o.goals)out.push("Objectifs : "+(o.goals.v||[]).map(k=>L(OB_GOALS,k)).join(", ")+(o.goals.main?" (principal : "+L(OB_GOALS,o.goals.main)+")":""));
  if(o.sports)out.push("Sports : "+(o.sports.v||[]).map(k=>L(OB_SPORTS,k)).join(", "));
  if(o.exp)out.push("Musculation : "+L(OB_EXP,o.exp.v));if(o.dispo)out.push("Disponibilités : "+(o.dispo.days||[]).map(k=>L(OB_DAYS,k)).join(", ")+" · "+(o.dispo.dur||"—")+" min");
  if(o.equip)out.push("Équipement : "+({salle:"salle",domicile:"domicile",aucun:"aucun"}[o.equip.cat]||"—")+((o.equip.items||[]).length?" ("+o.equip.items.join(", ")+")":""));
  if(o.pain)out.push("Douleurs / restrictions : "+(o.pain.v||[]).map(k=>L(OB_PAIN,k)).join(", ")+(o.pain.txt?" · "+o.pain.txt:""));
  if(o.expect)out.push("Attentes : "+(o.expect.v||[]).map(k=>L(OB_EXPECT,k)).join(", "));
  return out.map(x=>`<p>${esc(x)}</p>`).join("")}

