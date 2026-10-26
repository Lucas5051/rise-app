/* =====================================================================
   MODULE 15 · FENÊTRES (dialogues accessibles : focus bloqué, Échap, retour du focus)
   ===================================================================== */
let DLG=null;
const FOCUSABLE='button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])';
function openerSelector(el){if(!el||!el.dataset)return null;for(const k of["open","club","rpe","addclub","act","tab","linkhr"])if(el.dataset[k])return "[data-"+k+'="'+el.dataset[k]+'"]';return el.id?"#"+el.id:null}
function openSheet(html,label,keepOpener){
  const prev=DLG;const opener=keepOpener&&prev?prev.opener:document.activeElement;const sel=keepOpener&&prev?prev.sel:openerSelector(opener);
  $("#layer").innerHTML=`<div class="sheet-wrap" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1"><div class="grab" aria-hidden="true"></div>${html}</div></div>`;
  DLG={opener,sel,kind:"sheet"};document.body.style.overflow="hidden";
  const box=$("#layer [role=dialog]");const f=box.querySelector("[data-autofocus]")||box.querySelector(".close")||box;f.focus({preventScroll:true});
}
function setSheet(html){const box=$("#layer .sheet");if(!box)return;const fid=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.act;const sc=box.querySelector(".sheet-scroll");const top=sc?sc.scrollTop:0;
  box.innerHTML=`<div class="grab" aria-hidden="true"></div>`+html;const sc2=box.querySelector(".sheet-scroll");if(sc2)sc2.scrollTop=top;
  const f=(fid&&box.querySelector('[data-act="'+fid+'"]'))||box.querySelector(".close");if(f)f.focus({preventScroll:true})}
function closeSheet(restore=true){
  if(!$("#layer").innerHTML)return;$("#layer").innerHTML="";document.body.style.overflow="";stopTimer();
  const d=DLG;DLG=null;if(typeof CELEB!=="undefined"&&CELEB.length)setTimeout(showNextCeleb,300);if(!restore||!d)return;
  const el=d.opener&&document.contains(d.opener)?d.opener:(d.sel&&document.querySelector(d.sel));if(el&&el.focus)el.focus({preventScroll:true});
}
document.addEventListener("keydown",ev=>{
  const box=$("#layer [role=dialog]");if(!box)return;
  if(ev.key==="Escape"){ev.preventDefault();const wasDone=DLG&&DLG.kind==="done";closeSheet();if(wasDone)offerUndo();return}
  if(ev.key==="Tab"){const f=[...box.querySelectorAll(FOCUSABLE)].filter(e=>e.offsetParent!==null||e===document.activeElement);if(!f.length){ev.preventDefault();return}
    const first=f[0],last=f[f.length-1];
    if(ev.shiftKey&&(document.activeElement===first||document.activeElement===box)){ev.preventDefault();last.focus()}
    else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}}
});
const head=(eyebrow,title,id)=>`<div class="sheet-head"><div class="grow"><div class="eyebrow">${eyebrow}</div><h2 ${id?'id="'+id+'"':""} style="font-size:21px;margin-top:4px">${title}</h2></div><button class="close" data-act="closeSheet" aria-label="Fermer">✕</button></div>`;

/* ---------- Détail d'une séance de musculation ---------- */
let openId=null,showMore=false;
function openSession(id){openId=id;showMore=false;sheetMode="session";const s=sessionById(id);if(!s)return;openSheet(sheetSession(id),tpl(s).name)}
function sheetSession(id){
  const s=sessionById(id);const T=tpl(s);const st=displayStatus(s);const closed=["done","adapted","missed","fatigue"].includes(st);const st0=st;
  const items=sessionItems(s);const ad=S.adapt[id];const ctx=matchCtx(s.date);const fe=fatigueEval(s.date);
  const rec=closed?null:recommend(s);
  let h=`<div class="sheet-scroll"><div id="restTimer"></div>`+head(cap(fmtLong(s.date))+" · "+esc(s.timeLabel),esc(T.name))+`<div class="stack">
   <p>${esc(T.goal)}</p>
   <div class="meta" style="margin:0"><div><small>Durée</small><b class="num">${durOf(s)} min</b></div><div><small>Intensité</small><b>${esc(T.int)}</b></div><div><small>Contexte</small><b>${esc(ctx.label)}</b></div><div><small>Semaine</small><b>${esc(s.week)}${s.gen?(s.lvl?" · "+esc(s.lvl):""):" · "+esc(LVL[s.lvl]||"")}</b></div></div>
   <div class="row">${statusChip(s)}${s.moved?`<span class="chip warn">Déplacée (prévue le ${fmtShort(s.origDate)})</span>`:""}${s.cond?'<span class="chip">Conditionnelle</span>':""}</div>`;
  if(fe&&fe.pain)h+=`<div class="alert pain"><span class="dot"></span><div><b>Douleur inhabituelle signalée.</b> Saute les exercices qui la réveillent. Si elle persiste, demande l'avis d'un professionnel de santé. L'appli ne pose aucun diagnostic.</div></div>`;
  if(fe&&fe.high&&!closed)h+=`<div class="alert"><span class="dot"></span><div><b>Fatigue élevée.</b> ${fe.reasons.map(esc).join(" ")}<div class="grid2" style="margin-top:10px"><button class="btn ghost small" data-act="keep">Conserver</button><button class="btn secondary small" data-act="lighten">Alléger</button><button class="btn ghost small" data-act="move">Déplacer</button><button class="btn ghost small" data-act="replace">Remplacer</button><button class="btn danger small" data-act="skipFatigue" style="grid-column:1/-1">Ne pas la réaliser</button></div></div></div>`;
  if(rec)h+=recoCard(rec,s);
  if(ad&&ad.mode!=="none")h+=`<div class="lighter">Adaptation confirmée : ${esc(ADAPT_LABEL[ad.mode])}${ad.targets&&ad.targets.length?" ("+ad.targets.filter(t=>ZONE_LABEL[t]).map(t=>ZONE_LABEL[t]).join(", ")+")":""}. <button type="button" class="btn ghost small" data-act="undoAdapt" style="margin-top:6px">Revenir à la séance prévue</button></div>`;
  if(s.cond&&!closed)h+=`<details class="fold"><summary>Choisir la variante du jour</summary><div class="fold-body stack tight"><p class="small muted">Prévu par défaut : ${esc(TYPES[s.defaultCode].name)}.</p>${["PF","MICRO","HM","R"].map(c=>`<button class="date-pick" data-variant="${c}" aria-pressed="${effCode(s)===c}"><span class="dot ${effCode(s)===c?"ok":""}" style="${effCode(s)===c?"":"background:var(--line)"}"></span><span class="grow"><b>${esc(TYPES[c].name)}</b><span class="small muted"> · ${TYPES[c].dur} min</span></span></button>`).join("")}</div></details>`;
  if(s.id==="TEST-2026-10-12")h+=`<button class="btn secondary full" data-act="goTests">Voir ou modifier mes résultats de tests</button>`;
  const wu=wuOf(T);
  if(wu&&wu.items.length)h+=`<details class="fold"><summary>${esc(wu.t)} · ${wu.min} min</summary><div class="fold-body">${warmList(wu.items,"wu")}</div></details>`;
  const cdv=coolOf(T);
  const groups=[["main","Exercices principaux"],["acc","Accessoires"],["prev","Prévention et gainage"]];
  let k=0;
  groups.forEach(([cat,title])=>{const g=items.filter(e=>e.cat===cat);if(!g.length)return;
    const body=g.map(e=>{k++;return exRow(e,k,id)}).join("");
    h+=cat==="main"?`<section class="card" aria-label="${title}"><div class="block-title">${title}</div>${body}</section>`:`<details class="fold"><summary>${title} (${g.length})</summary><div class="fold-body">${body}</div></details>`;
  });
  const ton=tonnage(items);if(ton)h+=`<p class="small muted">Tonnage prévu : <b class="num">${ton} kg</b> (exercices chiffrés uniquement).</p>`;
  if(cdv.items.length)h+=`<details class="fold"><summary>${esc(cdv.t)} · ${cdv.min} min</summary><div class="fold-body">${warmList(cdv.items,"cd")}<p class="tiny muted">Récupération active, étirements doux, relâchement.</p></div></details>`;
  h+=`<details class="fold"><summary>Alléger ou arrêter la séance</summary><div class="fold-body"><ul class="clean small">${(T.stop||(T.fam==="power"?STOP_POWER:STOP_STD)).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></details>`;
  if(st==="done"||st==="adapted")h+=logCard(s)+progressCard(s,items);
  if(!closed)h+=`<button class="btn ghost full" data-act="openPain">Signaler une douleur</button>`;
  if(can("private_messaging"))h+=`<button class="btn ghost full" data-askcoach="${s.id}">Poser une question au coach sur cette séance</button>`;
  h+=`</div></div>`;
  // barre d'actions fixe
  h+=`<div class="sheet-actions">`;
  if(st==="done"||st==="adapted"||st==="missed"){h+=`<div class="row" style="flex-wrap:nowrap">${statusChip(s)}<span class="grow"></span>${st!=="missed"?`<button class="btn secondary small" data-hist="${id}">Récapitulatif</button>`:""}<button class="btn ghost small" data-act="clearStatus">Annuler le statut</button></div>`}
  else{
    h+=`<div id="morePanel" class="more-panel" ${showMore?"":"hidden"}><button class="btn secondary small" data-act="${ad&&ad.mode==="volume"?"undoAdapt":"lighten"}">${ad&&ad.mode==="volume"?"Version normale":"Alléger"}</button><button class="btn secondary small" data-act="move">Déplacer</button><button class="btn secondary small" data-act="manualDone">${ICONS.check}Marquer réalisée</button><button class="btn secondary small" data-stform="adapted">${ICONS.pencil}Réalisée avec adaptation</button>${isOpt(s)?"":`<button class="btn danger small" data-stform="missed" style="grid-column:1/-1">${ICONS.cross}Non réalisée</button>`}${s.moved?`<button class="btn ghost small" data-act="resetMove" style="grid-column:1/-1">Remettre au ${fmtShort(s.origDate)}</button>`:""}</div>
    <div class="row" style="flex-wrap:nowrap"><button class="btn grow" data-start="${id}" style="min-height:52px;font-size:16.5px">${ICONS.play}Commencer la séance</button><button class="btn secondary" data-act="toggleMore" aria-expanded="${showMore}" aria-controls="morePanel">Plus</button></div>`;
  }
  return h+`</div>`;
}
/* Liste d'échauffement / retour au calme : une ligne par exercice, touchable pour ouvrir sa fiche */
function warmList(items,ph){return `<ul class="warm-list">${items.map((x,i)=>typeof x==="string"?`<li><span class="grow">${esc(x)}</span></li>`:`<li><button type="button" class="warm-row" data-warm="${ph}:${i}" aria-label="${esc(x.n)}, ${esc(x.dose)} : ouvrir la fiche"><span class="grow"><b>${esc(x.n)}</b></span><span class="num small">${esc(x.dose)}</span>${ICONS.chevron}</button></li>`).join("")}</ul>`}
function exRow(e,k,sid){
  const fz=sid&&S.log[sid]&&S.log[sid].loads&&S.log[sid].loads[e.n];
  const L=fz?{kg:fz.text||null,note:fz.text?null:"—",help:"Charge au moment de la séance (historique figé)"+(fz.formula?" · "+fz.formula:"")}:loadInfo(e);const secs=restSecs(e.rest);
  return `<div class="ex ${e.removed?"removed":""}"><div class="tag ${e.ss?"ss":""}" aria-hidden="true">${e.ss||k}</div><div class="grow"><div class="row between" style="flex-wrap:nowrap;gap:8px"><h4>${esc(e.n)}</h4>${e.removed?"":`<button type="button" class="btn ghost small" data-mediaex="${esc(e.n)}" aria-label="Exécution de ${esc(e.n)}">Exécution</button>`}</div>
   ${e.removed?`<p class="small muted">${esc(e.removed)}</p>`:`<div class="dose num">${e.sets} × ${esc(e.reps)}${L&&L.pct?` <small>· ${esc(L.pct)}</small>`:""}</div>
   ${L?(L.kg?`<div class="kg num">${esc(L.kg)}</div>${L.adj?`<div class="tiny muted">${esc(L.adj)}</div>`:""}`:`<div class="kg pending">${esc(L.note)}</div>${L.help?`<div class="tiny muted">${esc(L.help)}</div>`:""}`):""}
   <div class="det"><span>${esc(e.rir)}</span><span>Repos ${esc(e.rest)}</span>${e.tempo?`<span>Tempo ${esc(e.tempo)}</span>`:""}${e.ss?`<span>Superset ${e.ss[0]} (enchaîne ${e.ss[0]}1 puis ${e.ss[0]}2)</span>`:""}</div>
   ${e.note?`<div class="tiny" style="color:var(--done);font-weight:650;margin-top:3px">${esc(e.note)}</div>`:""}
   <div class="cue">${esc(e.cue)}</div>${e.alt&&e.alt!=="—"?`<div class="alt">Sans le matériel : ${esc(e.alt)}</div>`:""}
   ${secs?`<button type="button" class="timer-btn" data-timer="${secs}" data-tlabel="${esc(e.n)}">⏱ Chrono de repos ${secs>=60?Math.floor(secs/60)+" min"+(secs%60?" "+secs%60:""):secs+" s"}</button>`:""}`}</div></div>`;
}
function restSecs(r){const s=String(r||"");let m=/(\d+)(?:-\d+)?\s*min/.exec(s);if(m)return +m[1]*60;m=/(\d+)\s*s/.exec(s);return m?+m[1]:0}
function recoCard(rec,s){
  const cls="lvl"+rec.level;const applied=!!S.adapt[s.id];
  return `<section class="reco ${cls}" aria-label="Proposition d'adaptation"><div class="row between"><h3>${rec.mode==="none"?"Aucune adaptation proposée":"Adaptation proposée : "+esc(rec.label)}</h3>${rec.provisional?'<span class="chip neutral">Seuils provisoires</span>':""}</div>
   <dl><dt>Données</dt><dd>${rec.trig.length?rec.trig.map(esc).join("<br>"):"Aucune donnée préoccupante dans les 72 h précédentes."}</dd>
   ${rec.mode!=="none"?`<dt>Proposé</dt><dd>${rec.changes.map(esc).join("<br>")}</dd><dt>Pourquoi</dt><dd>${rec.why.map(esc).join(" ")}</dd><dt>Effet</dt><dd>${esc(rec.effect)}</dd>`:""}</dl>
   ${rec.notes.map(n=>`<p class="small muted">${esc(n)}</p>`).join("")}
   ${rec.rule&&rec.rule.refused.length?`<p class="tiny muted">Règle du programme : ${esc(rec.rule.refused.map(RULE_LBL).join(", "))} non autorisé${rec.rule.refused.length>1?"s":""} par ton coach.</p>`:""}
   ${rec.mode==="painAsk"?`<button class="btn full" data-act="openPain">Préciser ma douleur</button>`:rec.mode==="coach"?((can("private_messaging")?`<button class="btn secondary full" data-askcoach="${s.id}">Écrire à mon coach</button>`:`<p class="small">Préviens ton coach avant de modifier la séance.</p>`)):rec.mode!=="none"&&!applied?`<div class="grid2"><button class="btn small" data-act="applyReco">Appliquer</button><button class="btn ghost small" data-act="keep">Garder la séance prévue</button></div>`:""}</section>`;
}
function logCard(s){
  const l=S.log[s.id]||{};const v=srpe(l);
  return `<section class="card stack" aria-labelledby="logH"><h3 id="logH">Séance réalisée</h3>
   <p class="small muted">Note ton RPE environ 30 min après la fin : c'est le moment recommandé par le cours (Foster). ${l.rpeDue&&l.rpeDue>nowMs()?"Rappel prévu vers "+hhmm(l.rpeDue)+".":""}</p>
   <div class="grid2">${fld("lgDur","Durée réelle (min)","number",l.dur??"","1",l.durPending?'placeholder="Durée à confirmer"':"")}${fld("lgHr","FC moyenne (facultatif)","number",l.hrAvg??"","1")}</div>
   ${rpePicker("lg",l.rpe)}
   <div class="srpe" id="lgOut">${v!=null?"Charge interne : "+l.dur+" min × RPE "+l.rpe+" = <b>"+v+" UA</b>":"Charge interne calculée dès que la durée et le RPE sont renseignés."}</div>
   <button class="btn secondary full" data-act="saveLog">Enregistrer</button></section>`;
}
function rpePicker(prefix,val){
  return `<div class="field"><span class="lbl" id="${prefix}RpeL">RPE de séance (0 à 10)</span><div class="rpe-grid" role="group" aria-labelledby="${prefix}RpeL">${RPE_LABELS.map((l,i)=>`<button type="button" data-rpev="${i}" data-rpeg="${prefix}" aria-pressed="${isNum(val)&&+val===i}" aria-label="${i} : ${l}">${i}</button>`).join("")}</div>
   <p class="rpe-label" id="${prefix}RpeTxt">${isNum(val)?val+" : "+RPE_LABELS[+val]:"0 = repos, 5 = déjà difficile, 10 = maximal."}</p><input type="hidden" id="${prefix}Rpe" value="${isNum(val)?val:""}"></div>`;
}
function progressCard(s,items){
  const lifts=[...new Set(items.filter(e=>e.lift&&!e.removed).map(e=>e.lift))].filter(l=>{const L=loadInfo(items.find(e=>e.lift===l));return L&&L.kg});
  if(!lifts.length)return "";
  return `<section class="card stack"><h3>Progression des charges</h3><p class="small muted">Si toutes les séries ont été réussies au RIR prévu avec une technique propre, une augmentation est proposée. Rien ne change sans ta confirmation.</p>`+
   lifts.map(l=>{const e=items.find(x=>x.lift===l);const L=loadInfo(e);return `<div class="stack tight" id="pg-${l}"><b>${esc(LIFT_NAME[l])} · ${esc(L.kg)}</b><div class="grid2"><button class="btn ghost small" data-prog="${l}" data-res="ok">Réussi au RIR prévu</button><button class="btn ghost small" data-prog="${l}" data-res="ko">RIR non respecté</button></div></div>`}).join("")+`</section>`;
}
function progStep(l){const lower=l==="squat"||l==="rdl";return l==="dm"?+S.settings.dbInc:lower?Math.max(2.5,+S.settings.barInc):Math.min(2.5,Math.max(1,+S.settings.barInc))}

/* ---------- Saisie rapide du RPE ---------- */
function openRpe(id){openId=id;sheetMode="rpe";const s=sessionById(id);openSheet(`<div class="sheet-scroll">${head("RPE à noter",esc(tpl(s).name))}<div class="stack">${logCard(s)}</div></div>`,"RPE de la séance")}

/* ---------- Séance club / match ---------- */
let clubDraft=null;
let sheetMode=null;
function openClub(id){const e=clubEvents().find(x=>x.id===id);if(!e)return;CLUB_ID=id;sheetMode="club";clubDraft={flags:[...((e.actual&&e.actual.flags)||[])]};openSheet(sheetClub(e),e.kind==="match"?"Match":"Séance club")}
function sheetClub(e){
  const c=matchCtx(e.date),a=e.actual||{},planned=Math.round((+e.dur||0)*(+e.plannedRPE||0)),past=nowMs()>=clubEnd(e);
  const isM=e.kind==="match";
  let h=`<div class="sheet-scroll">`+head(cap(fmtLong(e.date))+" · "+esc(String(e.time).replace(":","h")),isM?"Match":"Séance club")+`<div class="stack">
   ${isM?`<p><b>${esc(e.title)}</b><br><span class="small muted">${esc(e.comp||"")}${e.venue?" · "+esc(e.venue):""}</span></p>`:""}
   <section class="card"><div class="block-title">Avant la séance</div><dl class="log" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 10px;font-size:13.5px;margin:0">
    <dt class="tiny muted">Heure</dt><dd style="margin:0">${esc(String(e.time).replace(":","h"))} · ${e.dur} min prévues</dd>
    <dt class="tiny muted">Contenu</dt><dd style="margin:0">${esc(e.content||"")}</dd>
    <dt class="tiny muted">Intensité</dt><dd style="margin:0">${esc(e.intensity||"")}</dd>
    <dt class="tiny muted">Match</dt><dd style="margin:0">${esc(c.label)}</dd>
    <dt class="tiny muted">Charge prévue</dt><dd style="margin:0">≈ ${planned} UA (${e.dur} min × RPE ${e.plannedRPE} prévu)</dd></dl></section>`;
  if(e.cancelled)h+=`<div class="alert info"><span class="dot"></span><div>Séance annulée : elle n'est pas comptée dans la charge.</div></div>`;
  else{
    h+=`<section class="card stack" aria-labelledby="afterH"><h3 id="afterH">Après la séance</h3><p class="small muted">${past?"Idéalement environ 30 min après la fin. ":"Tu pourras la renseigner après la séance. "}Le RPE est le plus fiable s'il est donné dans la demi-heure qui suit (Foster).</p>
     <div class="grid2">${fld("cDur","Durée réelle (min)","number",a.dur??e.dur,"1")}${isM?fld("cMin","Minutes jouées","number",a.minutes??90,"1"):`<div class="field"><label for="cPos">Poste occupé</label><select id="cPos">${[S.settings.pos,S.settings.pos2,"Autre"].map(p=>`<option ${(a.pos||S.settings.pos)===p?"selected":""}>${esc(p)}</option>`).join("")}</select></div>`}</div>
     ${isM?`<div class="field"><label for="cPos">Poste occupé</label><select id="cPos">${[S.settings.pos,S.settings.pos2,"Autre"].map(p=>`<option ${(a.pos||S.settings.pos)===p?"selected":""}>${esc(p)}</option>`).join("")}</select></div>`:""}
     ${rpePicker("c",a.rpe)}
     <div class="srpe" id="cOut">${srpe(a)!=null?"Charge interne : <b>"+srpe(a)+" UA</b>":"sRPE = durée × RPE, calculé automatiquement."}</div>
     <div class="grid2">${fld("cHrAvg","FC moyenne","number",a.hrAvg??"","1")}${fld("cHrMax","FC maximale","number",a.hrMax??"","1")}</div>
     <details class="fold"><summary>Temps par zone (min, si disponible)</summary><div class="fold-body grid3">${[0,1,2,3,4].map(i=>fld("cZ"+i,"Zone "+(i+1),"number",a.zones&&isNum(a.zones[i])?a.zones[i]:"","1")).join("")}</div></details>
     <div class="field"><span class="lbl">En un geste (facultatif)</span><div class="toggles" id="cFlags">${FLAGS.map(([k,l])=>`<button type="button" class="toggle ${k==="douleur"?"pain":""}" data-cflag="${k}" aria-pressed="${clubDraft.flags.includes(k)}">${l}</button>`).join("")}</div></div>
     <div class="field"><label for="cContent">Contenu réellement effectué</label><textarea id="cContent" placeholder="Ex. : jeux réduits, 2 × 4 sprints de 20 m…">${esc(a.content||"")}</textarea></div>
     <div class="field"><label for="cCom">Commentaire</label><textarea id="cCom">${esc(a.comment||"")}</textarea></div>
     ${a.src?`<p class="tiny muted">Origine : ${esc(a.src)}${a.at?" · "+esc(whenLabel(Date.parse(a.at))):""}</p>`:""}</section>`;
  }
  if(e.caen&&e.week)h+=`<button class="btn secondary full" data-caen="${e.week}">Changer mes soirs à Caen cette semaine</button>`;
  h+=`<details class="fold"><summary>Modifier la séance prévue</summary><div class="fold-body stack"><div class="grid2">${fld("eDate","Date","date",e.date)}${fld("eTime","Heure","time",e.time)}${fld("eDur","Durée prévue (min)","number",e.dur,"1")}${fld("eRpe","RPE prévu","number",e.plannedRPE,"1")}</div>
   ${isM?`<div class="field"><label for="eTitle">Match</label><input id="eTitle" value="${esc(e.title||"")}"></div>`:""}
   <div class="field"><label for="eContent">Contenu prévu</label><textarea id="eContent">${esc(e.content||"")}</textarea></div><div class="field"><label for="eInt">Intensité prévue</label><input id="eInt" value="${esc(e.intensity||"")}"></div>
   <button class="btn secondary full" data-act="savePlannedClub">Enregistrer la séance prévue</button>
   <button class="btn ${e.cancelled?"secondary":"danger"} full" data-act="toggleCancel">${e.cancelled?"Rétablir la séance":isM?"Match annulé ou reporté sans date":"Séance annulée"}</button>
   ${e.added?`<button class="btn ghost full" data-act="deleteClub">Supprimer cette séance ajoutée</button>`:""}</div></details>`;
  h+=`</div></div>`;
  if(!e.cancelled)h+=`<div class="sheet-actions"><button class="btn full" data-act="saveClub" style="min-height:52px">Enregistrer la séance</button></div>`;
  return h;
}
function openAddClub(date,kind){
  openSheet(`<div class="sheet-scroll">${head("Ajouter",kind==="match"?"Un match":"Une séance club")}<div class="stack"><div class="grid2">${fld("nDate","Date","date",date)}${fld("nTime","Heure","time",kind==="match"?"15:00":"19:30")}${fld("nDur","Durée prévue (min)","number",kind==="match"?90:105,"1")}${fld("nRpe","RPE prévu","number",kind==="match"?8:6,"1")}</div>
   ${kind==="match"?`<div class="field"><label for="nTitle">Adversaire ou intitulé</label><input id="nTitle" placeholder="Ex. : US Côte des Isles – …"></div><div class="grid2"><div class="field"><label for="nComp">Compétition</label><input id="nComp" placeholder="Régional 2, Coupe…"></div><div class="field"><label for="nVenue">Lieu</label><select id="nVenue"><option>Domicile</option><option>Extérieur</option></select></div></div>`:`<div class="field"><label for="nContent">Contenu prévu</label><textarea id="nContent" placeholder="Séance imprévue, contenu découvert sur place…"></textarea></div>`}
   <p class="small muted">${kind==="match"?"Les séances de musculation autour de cette date seront recalculées (J-3, J-2, J-1, J+1, J+2).":"La séance sera prise en compte dans l'analyse des déplacements et des adaptations."}</p></div></div>
   <div class="sheet-actions"><button class="btn full" data-act="createClub" data-kind="${kind}">Ajouter</button></div>`,kind==="match"?"Ajouter un match":"Ajouter une séance club");
}

/* ---------- Déplacement ---------- */
let pendingMove=null;
function sheetMovePicker(id){
  const s=sessionById(id);const t=todayISO();const sug=suggestDate(id);
  let h=`<div class="sheet-scroll">`+head("Déplacer",esc(tpl(s).name)+" · "+fmtShort(s.date))+`<p class="small muted" style="margin-bottom:10px">Choisis une date. Pastille verte : aucun impact notable identifié · orange : vigilance recommandée · rouge : placement déconseillé. Une date occupée propose d'intervertir les deux séances.</p><div class="stack tight">`;
  for(let i=-7;i<=10;i++){const d=addDays(s.origDate,i);if(d===s.date||d<t||d<PERIOD_START||d>PERIOD_END)continue;
    const occ=sessions().find(x=>x.id!==id&&x.date===d&&!isOpt(x));const a=analyze(id,d,occ?occ.id:null);const cls=["ok","vig","bad"][a.worst];
    const ft=clubOn(d).filter(e=>!e.cancelled);
    h+=`<button class="date-pick" data-movepick="${d}" data-swap="${occ?occ.id:""}"><span class="dot ${cls}" aria-hidden="true"></span><span class="grow"><b>${cap(fmtLong(d))}</b>${d===sug?' <span class="chip done">Conseillée</span>':""}<span class="small muted"> · ${VERDICT[a.worst]}${occ?" · intervertir avec "+esc(tpl(occ).name.toLowerCase()):""}${ft.length?" · "+ft.map(e=>e.kind==="match"?"match":"club").join(", "):""}</span></span></button>`}
  return h+`</div></div>`;
}
function sheetVerdict(id,date,swapId){
  const a=analyze(id,date,swapId);const s=sessionById(id);const o=swapId?sessionById(swapId):null;
  pendingMove={id,date,swapId,force:0};const cls=["ok","vig","bad"][a.worst];const sug=a.worst===2?suggestDate(id):null;
  let h=`<div class="sheet-scroll">`+head("Analyse du déplacement",esc(tpl(s).name)+" : "+fmtShort(s.date)+" → "+fmtShort(date))+`<div class="stack">
   ${o?`<p class="small muted">Interversion : « ${esc(tpl(o).name.toLowerCase())} » passe au ${fmtShort(s.date)}.</p>`:""}
   <div class="verdict ${cls}" role="status"><h3>${a.title}</h3>${a.msgs.length?`<ul class="clean small">${a.msgs.map(m=>`<li>${esc(m.t)}</li>`).join("")}</ul>`:`<p class="small">Le placement respecte les matchs, les séances club, la récupération et tes créneaux.</p>`}</div>
   <p class="tiny muted">Ces messages signalent des points de vigilance. Ils ne prédisent pas une blessure.</p>
   ${sug?`<button class="btn secondary full" data-movepick="${sug}" data-swap="">Meilleure date : ${cap(fmtLong(sug))}</button>`:""}</div></div>
   <div class="sheet-actions">${a.worst<2?`<button class="btn full" data-act="confirmMove">Confirmer le déplacement</button>`:`<button class="btn danger full" data-act="forceMove" id="forceBtn">Forcer le déplacement</button>`}<button class="btn ghost full" data-act="cancelMove">Annuler</button></div>`;
  return h;
}
function applyMove(){const {id,date,swapId}=pendingMove;const s=sessionById(id);const from=s.date;
  const setD=(sid,d)=>{const b=baseSlots().find(x=>x.id===sid);if(b&&b.date===d)delete S.moves[sid];else S.moves[sid]=d};
  setD(id,date);if(swapId)setD(swapId,from);save();pendingMove=null;closeSheet(false);render();toast(swapId?"Séances interverties":"Séance déplacée au "+fmtShort(date))}

/* ---------- Validation : animation ---------- */
const PHRASES=["Bien joué. La régularité fait la différence.","Une séance de plus vers ton objectif.","Séance validée. Pense maintenant à bien récupérer.","Excellent travail. Chaque séance compte."];
let finishing=false;
/* Animation de validation : fond blanc, grand cercle bleu, coche blanche, confettis bleus/blancs/indigo venant des côtés (≈ 1,5 s).
   Version sans confettis si « réduire les animations » est activé. */
function showDone(s,adapted,saved,sel,prev,rpeGiven){
  const n=streak();const ph=donePhrase(s,adapted,n);
  const sync=!saved?"Attention : l'enregistrement sur cet appareil a échoué.":STORE.mode==="claude"?"Enregistrée sur cet appareil · copie en ligne en attente":"Enregistrée sur cet appareil";
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const conf=reduce?"":Array.from({length:26},(_,i)=>{const left=i%2===0;const c=["#2563EB","#4F46E5","#FFFFFF","#93C5FD"][i%4];return `<i style="--x:${left?-1:1};--d:${(i*37)%360}deg;--y:${20+((i*29)%60)}%;--t:${(i%7)*60}ms;background:${c};${left?"left":"right"}:-8px"></i>`}).join("");
  $("#layer").innerHTML=`<div class="done-wrap" data-act="closeDoneBg"><div class="confetti" aria-hidden="true">${conf}</div><div class="done-card" role="dialog" aria-modal="true" aria-labelledby="doneT" aria-describedby="doneD">
   <div class="done-badge" aria-hidden="true"><svg viewBox="0 0 64 64"><path class="tick" d="M17 33 L28 44 L48 22"/></svg></div>
   <h2 id="doneT">Séance terminée !</h2><p id="doneD">${adapted?"Séance adaptée enregistrée. ":""}${esc(ph)}</p>
   <div class="done-streak"><b class="num">${n}</b> séance${n>1?"s":""} consécutive${n>1?"s":""} réalisée${n>1?"s":""}</div>
   <p class="done-sync">${esc(sync)}</p>
   ${rpeGiven?`<p class="done-q">RPE enregistré. Charge de la séance : ${srpe(S.log[s.id]||{})!=null?srpe(S.log[s.id])+" UA":"calculée dès que la durée sera confirmée"}.</p><button class="btn full" data-act="closeSheet" data-autofocus>Continuer</button>`:`<p class="done-q"><b>Ton RPE</b> : note l'effort ressenti maintenant, ou reçois un rappel dans 30 min.</p>
   <button class="btn full" data-act="rpeNow" data-sid="${s.id}" data-autofocus>Noter mon RPE maintenant</button>
   <button class="btn secondary full" data-act="rpeLater" data-sid="${s.id}">Me le rappeler dans 30 min</button>`}</div></div>`;
  DLG={opener:null,sel:sel||'[data-open="'+s.id+'"]',kind:"done"};document.body.style.overflow="hidden";
  $("#layer [data-autofocus]").focus({preventScroll:true});
  UNDO={id:s.id,prev};
}
function donePhrase(s,adapted,n){
  const T=tpl(s);
  if(adapted)return "Adapter, c'est s'entraîner intelligemment. Bien joué d'avoir écouté ton corps.";
  if(n>=5)return n+" séances d'affilée : ta régularité fait la différence.";
  if(T.fam==="heavy")return "Grosse séance de force bouclée. Récupère bien : sommeil et repas complet.";
  if(T.fam==="power")return "Puissance travaillée, jambes fraîches pour le terrain. Bien joué.";
  if(T.fam==="upper")return "Haut du corps validé. Une séance de plus vers ton objectif.";
  return "Séance validée. Chaque séance compte.";
}
let UNDO=null;

/* ---------- Toast (avec annulation éventuelle) ---------- */
let toastTimer=null;
function toast(t,action){
  document.querySelectorAll(".toast").forEach(e=>e.remove());clearTimeout(toastTimer);
  const e=document.createElement("div");e.className="toast";e.setAttribute("role","status");
  const sp=document.createElement("span");sp.textContent=t;e.appendChild(sp);
  if(action){const b=document.createElement("button");b.type="button";b.textContent=action.label;b.addEventListener("click",()=>{action.fn();e.remove()});e.appendChild(b)}
  document.body.appendChild(e);toastTimer=setTimeout(()=>e.remove(),action?8000:2600);
}

/* ---------- Chrono de repos (facultatif) ---------- */
let TIMER=null;
function startTimer(sec,label){stopTimer();TIMER={end:nowMs()+sec*1000,label,iv:setInterval(drawTimer,250)};drawTimer()}
function stopTimer(){if(TIMER){clearInterval(TIMER.iv);TIMER=null}const el=document.getElementById("restTimer");if(el)el.innerHTML=""}
function drawTimer(){const el=document.getElementById("restTimer");if(!TIMER)return;if(!el){stopTimer();return}
  const left=Math.max(0,Math.round((TIMER.end-nowMs())/1000));
  el.innerHTML=`<div class="timer" role="timer" aria-live="off"><span class="grow"><span class="tiny">Repos · ${esc(TIMER.label)}</span><br><b class="num">${left?Math.floor(left/60)+":"+pad(left%60):"Terminé"}</b></span><button type="button" data-act="timerPlus">+15 s</button><button type="button" data-act="timerStop">Arrêter</button></div>`;
  if(!left){clearInterval(TIMER.iv);try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
}

