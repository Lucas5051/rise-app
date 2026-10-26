/* =====================================================================
   MODULE 14 · INTERFACE ATHLÈTE — navigation, accueil, calendrier, entraînement
   ===================================================================== */
let TAB="home",calMonth=null,selDay=null,reorg=false,editTest=null,TRAIN_SUB="seances",SUIVI_SUB="ressenti",SET_PAGE=null;
const $=s=>document.querySelector(s);
const svg=(d,extra="")=>`<svg ${extra} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS={
 home:svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
 cal:svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
 train:svg('<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'),
 suivi:svg('<path d="M3 12h4l2-5 4 10 2-5h6"/>'),
 gear:svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
 msg:svg('<path d="M4 5h16v11H9l-5 4z"/>'),
 play:svg('<path d="M7 4l13 8-13 8z"/>'),
 chevron:svg('<path d="M9 6l6 6-6 6"/>'),
 back:svg('<path d="M15 6l-6 6 6 6"/>'),
 ball:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>'),
 whistle:svg('<path d="M3 13a5 5 0 1 0 10 0V9h8V6H8a5 5 0 0 0-5 5z"/><circle cx="8" cy="13" r="1.5"/>'),
 run:svg('<circle cx="15" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M6 12l3-3 4 1 3 3 3 1M11 15l-1-5"/>'),
 rest:svg('<path d="M20 15A8 8 0 1 1 9 4a6.5 6.5 0 0 0 11 11z"/>'),
 check:svg('<path d="M5 12l5 5L20 7"/>'),
 cross:svg('<path d="M6 6l12 12M18 6L6 18"/>'),
 pencil:svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
 question:svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>'),
 alert:svg('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.01"/>'),
 lock:svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
 clock:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 heart:svg('<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>'),
 plus:svg('<path d="M12 5v14M5 12h14"/>'),
 sync:svg('<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>')
};
const TABS=[["home","Accueil"],["cal","Calendrier"],["train","Entraînement"],["suivi","Suivi"]];
/* Onglet actif : icône + texte dans une capsule bleue ; onglets inactifs : icône seule (texte réservé aux lecteurs d'écran) */
function renderTabs(){
  const nav=$("#tabs");if(!nav)return;
  if(inAuthFlow()||isCoachAccount()){document.body.classList.add("no-tabs");nav.innerHTML="";return}
  document.body.classList.remove("no-tabs");
  nav.innerHTML=TABS.map(([k,l])=>{const on=TAB===k;return `<button type="button" data-tab="${k}" ${on?'aria-current="page"':""} aria-label="${l}">${ICONS[k]}${on?`<span>${l}</span>`:`<span class="sr-only">${l}</span>`}</button>`}).join("");
}
function render(){
  pickAdapter();
  const a=$("#app");
  document.body.classList.toggle("is-coach",sessionValid()&&isCoachAccount());
  if(inAuthFlow()){document.body.classList.add("no-tabs");renderTabs();a.innerHTML=viewAuth();afterAuthRender();return}
  if(isCoachAccount()){renderTabs();a.innerHTML=viewCoachShell();afterCoachRender();return}
  if(COACH_ROUTES.includes(TAB)){a.innerHTML=viewDenied();renderTabs();return} // un compte athlète n'accède jamais à l'espace coach
  if(!ATH_TABS.includes(TAB))TAB="home";
  renderTabs();
  a.innerHTML=TAB==="home"?viewHome():TAB==="cal"?viewCal():TAB==="train"?viewTrain():TAB==="suivi"?viewSuivi():TAB==="settings"?viewSettings():viewMsgClient();
  document.body.classList.toggle("reorg",reorg&&TAB==="cal");
  updatePolarUI();
  if(TAB==="home")centerStrip();
  checkForgotten();
}
const COACH_ROUTES=["coach"]; // toute tentative d'ouvrir l'espace coach depuis un compte athlète (lien direct, ancien état)
function viewDenied(){return `<header class="top"><div><h1>Accès refusé</h1></div></header><div class="stack"><section class="card"><p>Cet espace est réservé au coach. Ton compte athlète n'y a pas accès.</p><button class="btn full" data-tab="home" style="margin-top:12px">Retour à l'accueil</button></section></div>`}
const durOf=s=>{const T=tpl(s);return S.adapt[s.id]&&S.adapt[s.id].mode==="volume"?Math.round(T.dur*.8):T.dur};
/* Statut : couleur + icône + texte (jamais la couleur seule) */
function statusChip(s){const st=displayStatus(s);
  if(st==="future")return isOpt(s)?'<span class="chip st-future">Optionnelle</span>':'<span class="chip st-future">À venir</span>';
  if(st==="today")return '<span class="chip st-today">Aujourd\'hui</span>';
  const ic={done:ICONS.check,adapted:ICONS.pencil,missed:ICONS.cross,fatigue:ICONS.cross,todo:ICONS.question}[st]||"";
  const r=S.status[s.id]&&S.status[s.id].reason;
  return `<span class="chip ${STATUS_CHIP[st]}">${ic}${STATUS_LABEL[st]}${st==="missed"&&r?" · "+esc(reasonLabel(r).toLowerCase()):""}</span>`}
function recoveryText(date){
  const fe=fatigueEval(date);const parts=[];
  if(fe){parts.push(fe.high?"fatigue élevée signalée":"ressenti "+(isNum(fe.score)?fe.score+"/100":"renseigné")+", pas d'alerte")}else parts.push("ressenti du jour non renseigné");
  const rec=activeClub().filter(e=>{const g=diff(e.date,date);return g>=0&&g<=3&&e.date<=todayISO()});
  const done=rec.filter(e=>srpe(e.actual)!=null);const high=done.filter(e=>{const c=classifyLoad(e);return c&&c.high});
  if(rec.length)parts.push(done.length+" séance"+(done.length>1?"s":"")+" club renseignée"+(done.length>1?"s":"")+" sur "+rec.length+" en 72 h"+(high.length?", dont "+high.length+" chargée"+(high.length>1?"s":""):""));
  return esc(cap(parts.join(" · ")))+".";
}
const firstName=()=>{const a=me();return (a&&a.first)||(S.profile&&S.profile.first)||""};
function topBar(eyebrow,title){
  const a=me();const msgOk=a&&a.coachId&&(can("private_messaging")||can("group_messaging"));const n=msgOk?unreadFor("client"):0;const L=syncLabel();
  return `<header class="top"><div class="grow"><div class="eyebrow">${eyebrow}${!Cloud.isCloud()?' <span class="mode-tag" title="Mode démonstration : données sur cet appareil uniquement">Démo</span>':""}</div><h1>${title}</h1>${Cloud.isCloud()&&L.k!=="ok"?syncChip():""}</div><div class="hd-btns">
   ${msgOk?`<button class="icon-btn hd-btn" data-tab="msg" aria-label="Messages${n?", "+n+" non lu"+(n>1?"s":""):""}">${ICONS.msg}${n?`<span class="dot-n">${n}</span>`:""}</button>`:""}
   <button class="icon-btn hd-btn" data-act="openSettings" aria-label="Paramètres">${ICONS.gear}</button></div></header>`;
}

/* Navigation : onglet + sous-onglet + défilement + focus clavier + barre d'onglets mis à jour ensemble */
const ATH_TABS=["home","cal","train","suivi","settings","msg"];
const SUBS={train:["seances","plan"],suivi:["ressenti","progres","badges"]};
function focusMain(){const h=document.querySelector("#app h1");if(h){h.setAttribute("tabindex","-1");h.focus({preventScroll:true})}}
function goTo(tab,sub){if(!ATH_TABS.includes(tab))tab="home";TAB=tab;if(sub&&SUBS[tab]&&SUBS[tab].includes(sub)){if(tab==="suivi")SUIVI_SUB=sub;else TRAIN_SUB=sub}
  SET_PAGE=null;reorg=false;closeSheet(false);render();window.scrollTo(0,0);focusMain()}
/* ---------- ACCUEIL ---------- */
function viewHome(){
  const t=todayISO(),w=weekOf(t);
  let h=topBar(cap(fmtLong(t))+(w?" · "+w.n+" · "+WTYPE[w.type]:""),"Bonjour"+(firstName()?" "+esc(firstName()):""))+`<div class="stack">`;
  if(STORE.corrupt)h+=`<div class="alert pain" role="alert"><span class="dot"></span><div>${esc(STORE.corrupt)}</div></div>`;
  if(S.active){const s=sessionById(S.active.id);if(s)h+=`<section class="card act-card live" aria-labelledby="liveH"><div class="act-ic" aria-hidden="true">${ICONS.play}</div><div class="grow"><p class="eyebrow">Séance en cours</p><h2 id="liveH">${esc(tpl(s).name)}</h2><p class="small muted">Commencée à ${hhmm(S.active.startedAt)}</p></div><button class="btn" data-start="${esc(S.active.id)}">Reprendre</button></section>`}
  h+=wellbeingCard(t)+glanceTiles(t);
  h+=mainActivityCard(t);
  h+=weekStrip(t);
  h+=importantAlert(t);
  h+=newBadgeBanner();
  if(!planActive())h+=noPlanCard();
  h+=`<p class="sync" id="syncLine">${ICONS.sync}<span>${esc(syncText())}</span></p></div>`;
  return h;
}
function noPlanCard(){const a=me();
  return `<section class="card"><h3>Ton programme</h3><p class="small" style="margin-top:6px">${a&&a.coachId?"Ton coach prépare ton programme. Il apparaîtra ici dès qu'il sera prêt.":"Aucun programme n'est encore associé à ton compte. Choisis une formule ou réserve un appel gratuit pour démarrer."}</p>
   ${a&&a.coachId?"":`<button class="btn secondary full" style="margin-top:10px" data-act="showOffers">Voir les formules</button>`}</section>`}
/* Activité principale du jour : séance > match > entraînement club > autre activité > repos */
function mainActivityCard(t){
  const ss=sessions().filter(s=>s.date===t),club=clubOn(t).filter(e=>!e.cancelled),ot=otherOn(t);
  const match=club.find(e=>e.kind==="match"),train=club.find(e=>e.kind==="training");
  let main="",others=[];
  if(ss.length){const s=ss[0],T=tpl(s),st=displayStatus(s),rec=["done","adapted","missed"].includes(st)?null:recommend(s),ad=S.adapt[s.id];
    main=`<button class="act-card st-${st}" data-open="${s.id}" aria-label="${esc(T.name)} : ouvrir la séance">
      <span class="act-ic ic-muscu">${ICONS.train}</span><span class="grow"><span class="eyebrow">${s.cond?"Séance conditionnelle":"Séance du jour"} · ${esc(s.timeLabel)}</span>
      <b class="act-t">${esc(T.name)}</b><span class="small muted">${durOf(s)} min · ${esc(T.int)} · ${esc(matchCtx(t).label)}</span>
      <span class="act-st">${statusChip(s)}${rec&&rec.mode!=="none"&&!ad?`<span class="chip st-todo">${ICONS.alert}Adaptation proposée</span>`:""}${ad&&ad.mode!=="none"?`<span class="chip st-adapted">${ICONS.pencil}${esc(ADAPT_LABEL[ad.mode])}</span>`:""}</span></span>
      <span class="act-go">${["done","adapted","missed"].includes(st)?ICONS.chevron:ICONS.play}</span></button>`;
    others=[...club.map(e=>({e})),...ot.map(o=>({o}))];
  }else if(match||train){const e=match||train;
    main=`<button class="act-card" data-club="${e.id}"><span class="act-ic ic-foot">${match?ICONS.ball:ICONS.whistle}</span><span class="grow"><span class="eyebrow">${match?"Match":"Entraînement club"} · ${esc(String(e.time).replace(":","h"))}</span>
      <b class="act-t">${match?esc(e.title):"Séance club"}</b><span class="small muted">${esc(e.content||"")}</span>${e.actual?`<span class="act-st"><span class="chip st-done">${ICONS.check}Renseignée</span></span>`:""}</span><span class="act-go">${ICONS.chevron}</span></button>`;
    others=[...club.filter(x=>x!==e).map(x=>({e:x})),...ot.map(o=>({o}))];
  }else if(ot.length){const o=ot[0];
    main=`<button class="act-card" data-other="${o.id}"><span class="act-ic ic-other">${ICONS.run}</span><span class="grow"><span class="eyebrow">Autre activité</span><b class="act-t">${esc(sportOf(o).name)}</b><span class="small muted">${o.dur} min × RPE ${o.rpe} = ${srpe(o)} UA</span></span><span class="act-go">${ICONS.chevron}</span></button>`;
    others=ot.slice(1).map(o=>({o}));
  }else if(!planActive()){
    main=`<div class="act-card"><span class="act-ic ic-muscu">${ICONS.cal}</span><span class="grow"><span class="eyebrow">Aujourd'hui</span><b class="act-t">Aucune séance prévue</b><span class="small muted">Ton calendrier se remplira quand ton programme sera prêt.</span></span></div>`;
  }else{
    const nx=sessions().find(s=>s.date>t);const w=weekOf(t);
    main=`<div class="act-card rest"><span class="act-ic ic-rest">${ICONS.rest}</span><span class="grow"><span class="eyebrow">Aujourd'hui</span><b class="act-t">${w&&w.type==="treve"?"Récupération active":"Repos"}</b><span class="small muted">${w&&w.type==="treve"?"Bouge un peu si tu en as envie, sans chercher la fatigue.":"Récupère : sommeil, hydratation, repas complets."}</span>
      ${nx?`<button class="linkish small" data-open="${nx.id}" style="margin-top:6px">Prochaine séance : ${esc(tpl(nx).name)} · ${fmtShort(nx.date)}</button>`:""}</span></div>`;
  }
  const extra=others.map(x=>x.e?`<button class="mini-row" data-club="${x.e.id}">${x.e.kind==="match"?ICONS.ball:ICONS.whistle}<span class="grow">${x.e.kind==="match"?"Match":"Entraînement club"} · ${esc(String(x.e.time).replace(":","h"))}</span>${x.e.actual?'<span class="chip st-done">'+ICONS.check+'Renseignée</span>':ICONS.chevron}</button>`:`<button class="mini-row" data-other="${x.o.id}">${ICONS.run}<span class="grow">${esc(sportOf(x.o).name)} · ${x.o.dur} min</span>${ICONS.chevron}</button>`).join("");
  return `<section aria-label="Activité du jour" class="stack tight">${main}${extra}<button class="linkish small add-other" data-addother="${t}">${ICONS.plus}Ajouter une autre activité (padel, vélo…)</button></section>`;
}
/* Bande des 7 jours de la semaine, centrée automatiquement sur aujourd'hui */
function weekStrip(t){
  const mon=addDays(t,-((D(t).getDay()+6)%7));let h=`<section aria-label="Ta semaine"><h2 class="sec-h">Ta semaine</h2><div class="strip" id="strip" role="list">`;
  for(let i=0;i<7;i++){const d=addDays(mon,i);const ss=sessions().filter(s=>s.date===d),cl=clubOn(d).filter(e=>!e.cancelled),ot=otherOn(d);
    const marks=[...ss.map(s=>{const st=displayStatus(s,t);return `<span class="mk mk-m st-${st}" title="${esc(tpl(s).name)}">${STATUS_SYM[st]||""}${esc(tpl(s).short)}</span>`}),...cl.map(e=>`<span class="mk mk-f">${e.kind==="match"?"Match":"Club"}</span>`),...ot.map(o=>`<span class="mk mk-o">${esc(sportOf(o).name.split(" ")[0])}</span>`)];
    const lab=cap(fmtLong(d))+" : "+([...ss.map(s=>tpl(s).name+", "+STATUS_LABEL[displayStatus(s,t)]),...cl.map(e=>e.kind==="match"?"match":"entraînement club"),...ot.map(o=>sportOf(o).name)].join(" ; ")||"repos");
    h+=`<button class="day ${d===t?"is-today":""}" role="listitem" data-stripday="${d}" aria-label="${esc(lab)}" ${d===t?'aria-current="date"':""}><small>${JOURS_C[D(d).getDay()]}</small><b class="num">${D(d).getDate()}</b><span class="mks">${marks.join("")||(planActive()?'<span class="mk mk-r">Repos</span>':'<span class="mk mk-r" aria-hidden="true">–</span>')}</span></button>`}
  return h+`</div></section>`;
}
function centerStrip(){const s=document.getElementById("strip");const c=s&&s.querySelector(".is-today");if(s&&c)s.scrollLeft=c.offsetLeft-(s.clientWidth-c.clientWidth)/2}
/* Alerte importante (une seule, la plus prioritaire) */
function importantAlert(t){
  const al=athleteAlerts(t).filter(a=>a.k==="pain"||a.k==="warn");if(!al.length)return "";
  const a=al[0];
  return `<button class="alert-card al-${a.k}" ${a.a} role="alert"><span class="act-ic">${ICONS.alert}</span><span class="grow"><b>${esc(a.t)}</b>${a.d?`<span class="small">${esc(a.d)}</span>`:""}${al.length>1?`<span class="tiny">+ ${al.length-1} autre${al.length>2?"s":""} dans Suivi › éléments à compléter</span>`:""}</span>${ICONS.chevron}</button>`;
}
function wellbeingCard(t){
  const f=S.fatigue[t],fe=fatigueEval(t);
  if(!f||!isNum(f.score))return `<section class="card wb-cta" aria-labelledby="wbH"><div class="row between"><h3 id="wbH">Ton ressenti du jour</h3><span class="chip st-todo">${ICONS.question}À remplir</span></div>
   ${remDue()?`<p class="small" style="margin-top:6px"><b>Rappel de ${remDue().replace(":","h")}</b> : c'est le moment de remplir ton ressenti.</p>`:""}
   <p class="small muted" style="margin-top:4px">5 curseurs, moins d'une minute. Idéalement le matin, avant la séance.</p>
   <button class="btn full" style="margin-top:12px" data-act="openWellness">Remplir le questionnaire</button></section>`;
  const sc=+f.score;
  return `<section class="card" aria-labelledby="wbH"><div class="row between"><h3 id="wbH">Ton ressenti du jour</h3>${fe&&fe.high?`<span class="chip st-todo">${ICONS.alert}Fatigue élevée</span>`:`<span class="chip st-done">${ICONS.check}Rempli</span>`}</div>
   <div class="wb-sum"><div class="wb-ring" style="--p:${sc}" role="img" aria-label="Score de ressenti ${sc} sur 100"><b class="num">${sc}</b></div>
   <div class="grow"><b>${wbLabel(sc)}</b><div class="small muted">${fe&&fe.base!=null?"Ta moyenne : "+Math.round(fe.base)+"/100":"Score du jour"}</div></div>
   <button class="btn ghost small" data-act="openWellness">Modifier</button></div>
   ${fe&&fe.pain?`<p class="small" style="margin-top:8px"><b>Douleur signalée.</b> Évite les exercices qui la réveillent ; si elle persiste, demande l'avis d'un professionnel de santé.</p>`:""}</section>`;
}
function newBadgeBanner(){
  const pend=BADGES.filter(b=>S.awards[b.id]&&!(S.meta.badgeSeen||{})[b.id]);if(!pend.length)return "";
  const b=pend[0];
  return `<section class="card badge-banner"><div class="row" style="gap:12px;align-items:center;flex-wrap:nowrap"><div class="bd-medal sm">${medalSvg(b)}</div><div class="grow"><b>Nouveau badge : ${esc(b.n)}</b><div class="small muted">${esc(b.d)}</div></div></div><button class="btn full" style="margin-top:10px" data-act="seeBadge" data-bid="${b.id}">Voir mon badge</button></section>`;
}
function itemRow(s){const st=displayStatus(s);const d=D(s.date);
  return `<button class="list-item s-${st}" data-open="${s.id}"><span class="sbar"></span><span class="datebox"><b class="num">${d.getDate()}</b><small>${JOURS_C[d.getDay()]}</small></span><span class="type-ic ic-muscu" aria-hidden="true">${ICONS.train}</span><div class="grow"><b>${esc(tpl(s).name)}</b><div class="small muted">Musculation · ${durOf(s)} min · ${esc(s.timeLabel)}</div><div class="li-st">${statusChip(s)}</div></div>${ICONS.chevron}</button>`}
function clubRow(e){const d=D(e.date);
  return `<button class="list-item s-foot" data-club="${e.id}"><span class="sbar"></span><span class="datebox"><b class="num">${d.getDate()}</b><small>${JOURS_C[d.getDay()]}</small></span><span class="type-ic ic-foot" aria-hidden="true">${e.kind==="match"?ICONS.ball:ICONS.whistle}</span><div class="grow"><b>${e.kind==="match"?"Match · "+esc(e.title):"Entraînement club"}</b><div class="small muted">${esc(String(e.time).replace(":","h"))}${e.kind==="match"?"":" · "+esc(e.intensity||"")}</div><div class="li-st"><span class="chip ${e.actual?"st-done":"st-future"}">${e.cancelled?"Annulé":e.actual?ICONS.check+"Renseigné":e.kind==="match"?"Match":"Club"}</span></div></div>${ICONS.chevron}</button>`}
function otherRow(o){const d=D(o.date),p=sportOf(o);
  return `<button class="list-item s-other" data-other="${o.id}"><span class="sbar"></span><span class="datebox"><b class="num">${d.getDate()}</b><small>${JOURS_C[d.getDay()]}</small></span><span class="type-ic ic-other" aria-hidden="true">${ICONS.run}</span><div class="grow"><b>${esc(p.name)}</b><div class="small muted">Autre activité · ${o.dur} min × RPE ${o.rpe} = ${srpe(o)} UA</div></div>${ICONS.chevron}</button>`}
/* Éléments à compléter (affichés dans Suivi) */
function todoItems(t){
  const out=[],now=nowMs();
  if(!wbFilled(t))out.push({date:"9999",html:`<button class="list-item" data-act="openWellness"><span class="sbar" style="background:var(--accent)"></span><div class="grow"><b>Questionnaire du jour</b><div class="small muted">Sommeil, fraîcheur, courbatures, stress, humeur · 1 min</div></div><span class="chip st-todo">${ICONS.question}À remplir</span></button>`});
  sessions().forEach(s=>{if(s.date<PERIOD_START||s.date>t)return;const st=statusOf(s),l=S.log[s.id]||{};
    if(!st&&s.date<t&&!isOpt(s))out.push({date:s.date,html:`<button class="list-item" data-open="${s.id}"><span class="sbar"></span><div class="grow"><b>${esc(tpl(s).name)}</b><div class="small muted">${cap(fmtLong(s.date))} · statut à choisir</div></div><span class="chip st-todo">${ICONS.question}À renseigner</span></button>`});
    if((st==="done"||st==="adapted")&&l.durPending)out.push({date:s.date,html:`<button class="list-item" data-durfix="${s.id}"><span class="sbar"></span><div class="grow"><b>Durée à confirmer · ${esc(tpl(s).name)}</b><div class="small muted">Tu n'as pas appuyé sur « Terminer » : indique l'heure de fin approximative.</div></div><span class="chip st-todo">${ICONS.clock}À confirmer</span></button>`});
    if((st==="done"||st==="adapted")&&!isNum(l.rpe)){const due=l.rpeDue;out.push({date:s.date,html:`<button class="list-item" data-rpe="${s.id}"><span class="sbar"></span><div class="grow"><b>RPE · ${esc(tpl(s).name)}</b><div class="small muted">${due&&due>now?"Recommandé vers "+hhmm(due)+" (30 min après) · possible dès maintenant":"Note l'effort perçu de 0 à 10"}</div></div><span class="chip st-todo">RPE</span></button>`})}
  });
  clubEvents().forEach(e=>{if(e.cancelled||e.date<PERIOD_START||e.date>t)return;const end=clubEnd(e);
    if(!e.actual&&end<=now)out.push({date:e.date,html:`<button class="list-item s-foot" data-club="${e.id}"><span class="sbar"></span><div class="grow"><b>${e.kind==="match"?"Match":"Séance club"} · ${fmtShort(e.date)}</b><div class="small muted">Durée, RPE, FC et ressenti</div></div><span class="chip st-todo">À renseigner</span></button>`});
    else if(e.actual&&!isNum(e.actual.rpe))out.push({date:e.date,html:`<button class="list-item s-foot" data-club="${e.id}"><span class="sbar"></span><div class="grow"><b>RPE · ${e.kind==="match"?"match":"séance club"} ${fmtShort(e.date)}</b><div class="small muted">RPE manquant</div></div><span class="chip st-todo">RPE</span></button>`});
  });
  return out.sort((a,b)=>a.date<b.date?1:-1);
}

/* ---------- CALENDRIER ---------- */
const TYPE_ABBR={muscu:"M",club:"C",match:"Mt",other:"A",rest:"R"};
function viewCal(){
  const t=todayISO();
  const cb=calBounds();if(!calMonth||calMonth<cb.min||calMonth>cb.max)calMonth=t.slice(0,7);
  const [y,mo]=calMonth.split("-").map(Number);const first=new Date(y,mo-1,1,12);const startOff=(first.getDay()+6)%7;const gridStart=addDays(iso(first),-startOff);
  const all=sessions();
  let h=topBar("Calendrier",cap(MOIS[mo-1])+" "+y)+`<div class="stack">`;
  if(reorg)h+=`<div class="reorg-bar" role="status"><span>Glisse la séance sur un autre jour. Les jours en bleu sont compatibles.</span><button type="button" data-act="endReorg">Annuler</button></div>`;
  h+=`<div class="cal-nav-row"><button class="icon-btn" data-act="prevM" aria-label="Mois précédent" ${calMonth<=cb.min?"disabled":""}>${ICONS.back}</button>
   <button class="btn ghost small" data-act="todayM">Aujourd'hui</button>
   <button class="icon-btn" data-act="nextM" aria-label="Mois suivant" ${calMonth>=cb.max?"disabled":""}>${ICONS.chevron}</button></div>`;
  h+=`<div class="cal" id="cal" role="grid" aria-label="Calendrier de ${MOIS[mo-1]} ${y}">`+["L","M","M","J","V","S","D"].map(x=>`<div class="dow" aria-hidden="true">${x}</div>`).join("");
  for(let i=0;i<42;i++){const d=addDays(gridStart,i);const inM=d.slice(0,7)===calMonth;if(i>=35&&!inM&&D(d).getDay()===1)break;
    const ss=all.filter(s=>s.date===d),ft=clubOn(d),ot=otherOn(d);
    const lab=cap(fmtLong(d))+(ss.length?", "+ss.map(s=>"musculation "+tpl(s).name+" ("+STATUS_LABEL[displayStatus(s)]+")").join(", "):"")+(ft.length?", "+ft.map(e=>(e.kind==="match"?"match":"entraînement club")+(e.cancelled?" annulé":e.actual?" renseigné":"")).join(", "):"")+(ot.length?", "+ot.map(o=>"autre activité "+sportOf(o).name).join(", "):"");
    if(i%7===0)h+=(i?`</div>`:"")+`<div class="cal-row" role="row">`;
    h+=`<div class="cell ${inM?"":"out"} ${d===t?"is-today":""} ${d===selDay?"sel":""}" data-date="${d}" role="gridcell" tabindex="0" aria-label="${esc(lab)}"><span class="d num" aria-hidden="true">${D(d).getDate()}</span>`+
      ss.map(s=>{const st=displayStatus(s);return `<div class="ev sess st-${st} ${isOpt(s)?"optional":""}" data-sid="${s.id}" aria-hidden="true">${STATUS_SYM[st]?`<i>${STATUS_SYM[st]}</i>`:""}${esc(tpl(s).short)}</div>`}).join("")+
      ft.map(e=>`<div class="ev foot ${e.kind==="match"?"match":""} ${e.cancelled?"cancel":""}" aria-hidden="true">${e.kind==="match"?"Match":"Club"}</div>`).join("")+
      ot.map(o=>`<div class="ev other" aria-hidden="true">${esc(sportOf(o).name.slice(0,4))}</div>`).join("")+`</div>`}
  h+=`</div></div><div class="legend" aria-label="Légende"><span><i class="lg st-done"></i>✓ Réalisée</span><span><i class="lg st-adapted"></i>✎ Adaptée</span><span><i class="lg st-missed"></i>✕ Non réalisée</span><span><i class="lg st-todo"></i>? À renseigner</span><span><i class="lg st-future"></i>À venir</span><span><i class="lg lg-foot"></i>Club / match</span><span><i class="lg lg-other"></i>Autre activité</span></div>`;
  h+=`<p class="small muted">${reorg?"":"Touche un jour pour voir le détail. Pour déplacer une séance : garde le doigt 2 secondes dessus, puis glisse-la sans relever le doigt."}</p>`;
  const day=selDay||(t.slice(0,7)===calMonth?t:null);
  if(day){const ss=all.filter(s=>s.date===day),ft=clubOn(day),ot=otherOn(day),c=matchCtx(day);
    h+=`<section class="card" aria-labelledby="dayH"><div class="row between"><h3 id="dayH">${cap(fmtLong(day))}</h3><span class="chip st-future">${esc(c.label)}</span></div>`+
      (ss.length||ft.length||ot.length?ss.map(itemRow).join("")+ft.map(clubRow).join("")+ot.map(otherRow).join(""):`<div class="list-item" style="cursor:default"><span class="type-ic ic-rest" aria-hidden="true">${ICONS.rest}</span><div class="grow"><b>Repos ou récupération</b></div></div>`)+
      `<div class="grid2" style="margin-top:10px"><button class="btn secondary small" data-addclub="${day}" data-kind="training">+ Entraînement club</button><button class="btn secondary small" data-addclub="${day}" data-kind="match">+ Match</button></div><button class="btn secondary small full" style="margin-top:8px" data-addother="${day}">+ Autre activité</button></section>`}
  return h+`</div>`;
}

/* ---------- ENTRAÎNEMENT : Séances / Planification ---------- */
function subTabs(name,cur,list){return `<div class="seg ${list.length===3?"seg3":""}" role="tablist" aria-label="${esc(name)}">${list.map(([k,l])=>`<button role="tab" aria-selected="${cur===k}" data-sub="${name}:${k}">${l}</button>`).join("")}</div>`}
function viewTrain(){
  const a=assignmentOf(CUR_UID);const P=a&&PL.programs[a.programId];
  let h=topBar(planActive()?esc((P&&!P.engine?P.name+" · ":"")+"du "+fmtShort(PERIOD_START)+" au "+fmtShort(PERIOD_END)):"Ton programme","Entraînement")+`<div class="stack">`+subTabs("train",TRAIN_SUB,[["seances","Séances"],["plan","Planification"]]);
  if(!planActive())return h+noPlanCard()+`</div>`;
  h+=TRAIN_SUB==="plan"?trainPlan():trainSessions();
  return h+`</div>`;
}
function trainSessions(){
  const t=todayISO();const today=sessions().filter(s=>s.date===t);const next=sessions().find(s=>s.date>t);
  let h="";
  if(today.length)today.forEach(s=>{const T=tpl(s),st=displayStatus(s),closed=["done","adapted","missed"].includes(st);
    h+=`<section class="card today-sess"><div class="row between"><span class="eyebrow">Séance du jour</span>${statusChip(s)}</div><h2 style="margin-top:6px">${esc(T.name)}</h2><p class="small muted" style="margin-top:4px">${esc(T.goal)}</p>
     <div class="meta"><div><small>Durée</small><b class="num">${durOf(s)} min</b></div><div><small>Exercices</small><b class="num">${sessionItems(s).filter(e=>!e.removed).length}</b></div><div><small>Intensité</small><b>${esc(T.int)}</b></div><div><small>Contexte</small><b>${esc(matchCtx(s.date).label)}</b></div></div>
     <div class="grid2" style="margin-top:12px"><button class="btn secondary" data-open="${s.id}">Voir la séance</button>${closed?`<button class="btn secondary" data-hist="${s.id}">Récapitulatif</button>`:`<button class="btn" data-start="${s.id}">${ICONS.play}Commencer</button>`}</div></section>`});
  else h+=`<section class="card"><span class="eyebrow">Aujourd'hui</span><h3 style="margin-top:4px">Pas de musculation prévue</h3>${next?`<p class="small muted" style="margin-top:4px">Prochaine séance : ${esc(tpl(next).name)}, ${fmtLong(next.date)}.</p><button class="btn secondary full" style="margin-top:10px" data-open="${next.id}">Voir la prochaine séance</button>`:""}</section>`;
  const past=sessions().filter(s=>s.date<=t&&statusOf(s)).sort((a,b)=>a.date<b.date?1:-1).slice(0,12);
  h+=`<section class="card" aria-labelledby="pastH"><h3 id="pastH">Dernières séances</h3>`+(past.length?past.map(s=>{const l=S.log[s.id]||{},d=D(s.date);
    return `<button class="list-item s-${displayStatus(s)}" data-hist="${s.id}"><span class="sbar"></span><span class="datebox"><b class="num">${d.getDate()}</b><small>${JOURS_C[d.getDay()]}</small></span><div class="grow"><b>${esc(tpl(s).name)}</b><div class="small muted">${isNum(l.dur)?l.dur+" min":"—"}${isNum(l.rpe)?" · RPE "+l.rpe:""}${srpe(l)!=null?" · "+srpe(l)+" UA":""}</div></div>${statusChip(s)}</button>`}).join(""):`<p class="small muted" style="margin-top:6px">Aucune séance renseignée pour l'instant.</p>`)+`</section>`;
  return h;
}
/* Objectifs du bloc : programme historique (LUCAS.blockGoals) ou blocs du programme attribué */
function blockGoals(){if(legacyActive())return LUCAS.blockGoals;const a=assignmentOf(CUR_UID);if(!a)return[];
  return(a.prog.blocks||[]).map(b=>{const ws=WEEKS.filter(w=>w.block===b.name);return{from:ws.length?ws[0].s:PERIOD_START,to:ws.length?addDays(ws[ws.length-1].s,6):PERIOD_END,t:b.name+(ws.length?" ("+fmtShort(ws[0].s)+" → "+fmtShort(addDays(ws[ws.length-1].s,6))+")":""),items:[b.goal||(a.prog.goal)||"Objectif précisé par ton coach."]}})}
function trainPlan(){
  const t=todayISO();let h="";
  const BG=blockGoals();const bg=BG.find(b=>t>=b.from&&t<=b.to)||BG[0]||{t:"",items:[]};
  h+=`<section class="card"><h3>Objectifs du bloc</h3><p class="small muted" style="margin-top:2px">${esc(bg.t)}</p><ul class="clean small" style="margin-top:6px">${bg.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></section>`;
  const cw=weekOf(t)||(t<PERIOD_START?WEEKS[0]:WEEKS[WEEKS.length-1]);const idx=WEEKS.indexOf(cw);
  h+=WEEKS.slice(Math.max(0,idx)).map((w,i)=>{const end=w.type==="treve"?PERIOD_END:addDays(w.s,6);const ss=sessions().filter(s=>s.date>=w.s&&s.date<=end);const cl=clubEvents().filter(e=>e.date>=w.s&&e.date<=end&&!e.cancelled);
    const rows=[...ss.map(s=>({d:s.date,h:itemRow(s)})),...cl.map(e=>({d:e.date,h:clubRow(e)}))].sort((a,b)=>a.d<b.d?-1:1).map(x=>x.h).join("");
    return i===0?`<section class="card"><div class="row between"><h3>${w===weekOf(t)?"Cette semaine":"Semaine"} · ${esc(w.n)}</h3><span class="chip st-future">${esc(w.type==="prog"?(w.block||"Programme"):WTYPE[w.type])}</span></div><p class="small muted" style="margin-top:2px">${esc(weekLvlLabel(w))}</p>${rows}</section>`
      :`<details class="fold"><summary>${esc(w.n)} · du ${fmtShort(w.s)} · ${esc(weekLvlLabel(w))}</summary><div class="fold-body">${rows||'<p class="small muted">Aucune séance.</p>'}</div></details>`}).join("");
  const ads=Object.entries(S.adapt).filter(([,a])=>a&&a.mode&&a.mode!=="none").map(([id,a])=>({s:sessionById(id),a})).filter(x=>x.s).sort((a,b)=>a.s.date<b.s.date?1:-1);
  h+=`<section class="card"><h3>Adaptations</h3>${ads.length?ads.map(({s,a})=>`<div class="list-item" style="cursor:default;align-items:flex-start"><span class="type-ic ic-adapt" aria-hidden="true">${ICONS.pencil}</span><div class="grow"><b>${esc(tpl(s).name)} · ${fmtShort(s.date)}</b><div class="small">${esc(ADAPT_LABEL[a.mode])}${a.reasons&&a.reasons.length?" : "+esc(a.reasons[0]):""}</div></div></div>`).join(""):`<p class="small muted" style="margin-top:4px">Aucune adaptation pour l'instant. Quand ton ressenti ou ta charge le justifient, l'appli en propose une, appliquée seulement avec ton accord.</p>`}</section>`;
  if(legacyActive())h+=`<details class="fold"><summary>Révision des volumes</summary><div class="fold-body stack tight">${VOLUME_CHANGES.map(v=>`<div><b>${esc(TYPES[v.code].name)}</b><div class="small">${esc(v.what)}</div><div class="small muted">${esc(v.reason)}</div></div>`).join("")}<details class="fold"><summary>Révision précédente (22/10, matin)</summary><div class="fold-body stack tight">${VOLUME_CHANGES_V3.map(v=>`<div><b>${esc(TYPES[v.code].name)}</b><div class="small">${esc(v.what)}</div></div>`).join("")}</div></details><p class="tiny muted">Chaque changement s'appuie sur les cours de préparation physique ; ton coach peut te montrer le détail.</p></div></details>`;
  if(legacyActive())h+=`<details class="fold"><summary>Journal des modifications</summary><div class="fold-body stack log">`+CHANGES.map(c=>`<div><h3>${esc(c.t)}</h3><dl><dt>Prévu</dt><dd>${esc(c.prev)}</dd><dt>Changé</dt><dd>${esc(c.chg)}</dd><dt>Pourquoi</dt><dd>${esc(c.why)}</dd><dt>Effet</dt><dd>${esc(c.eff)}</dd><dt>Source</dt><dd>${esc(c.src)}</dd></dl></div>`).join("")+`</div></details>`;
  return h;
}
const fld=(id,l,type,val,step,extra="")=>`<div class="field"><label for="${id}">${l}</label><input id="${id}" type="${type}" ${type==="number"?'inputmode="decimal"':""} ${step?'step="'+step+'"':""} value="${esc(val??"")}" ${extra}></div>`;

