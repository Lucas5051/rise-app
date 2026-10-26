/* =====================================================================
   MODULE 24 · SUIVI ATHLÈTE : Ressenti · Progrès · Badges
   ===================================================================== */
let PROG_PERIOD=28,PROG_SCOPE="total";
function viewSuivi(){
  let h=topBar("Ton suivi","Suivi")+`<div class="stack">`+subTabs("suivi",SUIVI_SUB,[["ressenti","Ressenti"],["progres","Progrès"],["badges","Badges"]]);
  h+=SUIVI_SUB==="progres"?suiviProgres():SUIVI_SUB==="badges"?badgesBody():suiviRessenti();
  return h+`</div>`;
}
function todoCard(t){const n=todoItems(t).length;
  return `<button class="todo-card" data-act="openTodo"><span class="act-ic">${ICONS.question}</span><span class="grow"><b>${n?n+" élément"+(n>1?"s":"")+" à compléter":"Tout est à jour"}</b><span class="small muted">${n?"Questionnaire, statuts de séance, RPE, durées à confirmer":"Aucune saisie en attente"}</span></span>${ICONS.chevron}</button>`}
function openTodo(){const it=todoItems(todayISO());sheetMode="todo";
  openSheet(`<div class="sheet-scroll">`+head("Suivi","Éléments à compléter")+`<div class="stack tight"><p class="small muted">Une séance passée sans réponse n'est jamais comptée comme ratée.</p>${it.map(x=>x.html).join("")||'<p class="small">Tout est à jour.</p>'}</div></div>`,"Éléments à compléter")}
/* ---------- Ressenti ---------- */
function suiviRessenti(){
  const t=todayISO();let h=todoCard(t)+wellbeingCard(t);
  const filled=Object.keys(S.fatigue).filter(d=>wbFilled(d)).sort();
  const last=filled[filled.length-1],prev=filled[filled.length-2];
  if(last){const f=S.fatigue[last],sc=+f.score,dl=prev?sc-(+S.fatigue[prev].score):null;
    h+=`<section class="card" aria-labelledby="rsH"><div class="row between"><h3 id="rsH">Score général</h3><span class="small muted">${fmtShort(last)}</span></div>
     <div class="big-score"><b class="num">${sc}</b><span>/100 · ${wbLabel(sc)}</span></div>
     <p class="small">${esc(wbInterpret(sc))}${dl!=null?` <b>${dl>0?"+":""}${dl} point${Math.abs(dl)>1?"s":""}</b> par rapport au questionnaire précédent (${fmtShort(prev)}).`:""}</p>
     <p class="small muted" style="margin-top:4px">${qStats().cur} jour${qStats().cur>1?"s":""} de suite rempli${qStats().cur>1?"s":""}.</p>
     ${f.items?`<div class="items-bars">${WB_ITEMS.map(i=>{const v=+f.items[i.k];return `<div class="ib"><span>${esc(itemShort(i))}</span><span class="ib-bar" role="img" aria-label="${esc(itemShort(i))} : ${v} sur 100"><i style="width:${v}%"></i></span><b class="num">${v}</b></div>`}).join("")}</div><p class="tiny muted">100 = meilleur état (sommeil excellent, très frais, aucune courbature, détendu, au top).</p>`:""}
     ${painLine(t)}${cmjLine()}</section>`;
  }
  h+=`<section class="card"><div class="row between"><h3>Tendance sur 28 jours</h3></div>${curveSvg(t)}<div class="cv-leg small"><span><i class="lg-bar"></i>Charge du jour (UA)</span><span><i class="lg-line"></i>Ressenti (/100)</span></div><p class="small" style="margin-top:6px">${esc(curveInsight(t))}</p></section>`;
  h+=`<section class="card"><h3>Derniers questionnaires</h3>${filled.length?filled.slice(-10).reverse().map(d=>{const sc=+S.fatigue[d].score;return `<div class="list-item" style="cursor:default"><span class="datebox"><b class="num">${D(d).getDate()}</b><small>${JOURS_C[D(d).getDay()]}</small></span><div class="grow"><b>${sc}/100 · ${wbLabel(sc)}</b>${S.fatigue[d].comment?`<div class="small muted ellip">« ${esc(S.fatigue[d].comment)} »</div>`:""}</div></div>`}).join(""):`<p class="small muted" style="margin-top:4px">Aucun questionnaire rempli pour l'instant.</p>`}</section>`;
  return h;
}
const itemShort=i=>({sommeil:"Sommeil",fraicheur:"Fatigue (fraîcheur)",courbatures:"Courbatures",stress:"Stress",humeur:"Humeur"})[i.k]||i.n;
function wbInterpret(sc){return sc>=75?"Tu es en forme : séance prévue sans réserve.":sc>=60?"État correct : la séance prévue convient.":sc>=45?"Ressenti moyen : écoute tes sensations pendant l'échauffement.":"Ressenti faible : l'appli peut te proposer d'alléger la séance."}
function painLine(t){const days=[];for(let i=0;i<7;i++){const d=addDays(t,-i);const f=S.fatigue[d];if(f&&commentSignals(f.comment).pain)days.push(d);otherOn(d).forEach(o=>{if(commentSignals(o.comment).pain)days.push(d)})}
  return `<p class="small" style="margin-top:8px"><b>Douleurs (7 jours) :</b> ${days.length?"signalées le "+[...new Set(days)].map(fmtShort).join(", "):"aucune signalée"}.</p>`}
function cmjLine(){const ts=[...S.tests].filter(x=>isNum(x.cmj)).sort((a,b)=>a.date<b.date?-1:1);if(!ts.length)return "";const l=ts[ts.length-1];
  return `<p class="small"><b>CMJ :</b> ${fmt(+l.cmj)} cm (${fmtShort(l.date)}), repère de fraîcheur.</p>`}
/* ---------- Progrès ---------- */
function suiviProgres(){
  const t=todayISO(),from=addDays(t,-(PROG_PERIOD-1));
  let h=`<div class="seg" role="tablist" aria-label="Période">${[[7,"7 jours"],[28,"28 jours"],[90,"3 mois"]].map(([k,l])=>`<button role="tab" aria-selected="${PROG_PERIOD===k}" data-period="${k}">${l}</button>`).join("")}</div>
   <div class="seg seg3" role="tablist" aria-label="Type d'activité">${[["total","Total"],["muscu","Musculation"],["club","Club et matchs"]].map(([k,l])=>`<button role="tab" aria-selected="${PROG_SCOPE===k}" data-scope="${k}">${l}</button>`).join("")}</div>`;
  const ss=sessions().filter(s=>s.date>=from&&s.date<=t&&!isOpt(s)&&(s.date<t||statusOf(s)));
  const by=k=>ss.filter(s=>statusOf(s)===k).length;
  const fat=ss.filter(s=>{const x=S.status[s.id];return x&&(x.s==="fatigue"||x.reason==="fatigue")}).length;
  const done=by("done"),ad=by("adapted"),mi=by("missed")+by("fatigue"),past=ss.length;
  const club=activeClub().filter(e=>e.date>=from&&e.date<=t&&dtMs(e.date,e.time)<nowMs());const clubDone=club.filter(e=>srpe(e.actual)!=null).length;
  const assid=PROG_SCOPE==="club"?(club.length?Math.round(clubDone/club.length*100):null):(past?Math.round((done+ad)/past*100):null);
  h+=`<section class="card"><h3>Assiduité</h3><div class="big-score"><b class="num">${assid!=null?assid+" %":"–"}</b><span>${PROG_SCOPE==="club"?"séances club et matchs renseignés":"des séances prévues réalisées"}</span></div>
   ${PROG_SCOPE!=="club"?`<div class="kpis"><div><small>Réalisées</small><b class="num">${done}</b></div><div><small>Adaptées</small><b class="num">${ad}</b></div><div><small>Non réalisées</small><b class="num">${mi}</b></div><div><small>Annulées (fatigue)</small><b class="num">${fat}</b></div></div>`:`<div class="kpis"><div><small>Renseignées</small><b class="num">${clubDone}</b></div><div><small>Prévues</small><b class="num">${club.length}</b></div></div>`}</section>`;
  // Volume hebdomadaire en durée et charge sRPE
  const weeks=[];const mon=d=>addDays(d,-((D(d).getDay()+6)%7));
  for(let w=mon(from);w<=t;w=addDays(w,7)){let dur=0,ld=0;
    realEntries().filter(r=>r.date>=w&&r.date<=addDays(w,6)&&r.date>=from&&r.date<=t&&(PROG_SCOPE==="total"||(PROG_SCOPE==="muscu"?r.kind==="muscu":(r.kind==="training"||r.kind==="match")))).forEach(r=>{dur+=+r.dur||0;ld+=r.srpe});
    weeks.push({w,dur,ld})}
  const mx=Math.max(60,...weeks.map(x=>x.dur)),ml=Math.max(300,...weeks.map(x=>x.ld));
  h+=`<section class="card"><h3>Volume par semaine</h3><p class="small muted" style="margin-top:2px">Durée réelle des séances renseignées et charge sRPE (durée × RPE).</p>
   <div class="wk-bars" role="table" aria-label="Volume par semaine">${weeks.map(x=>`<div class="wkb" role="row"><span class="wk-l" role="cell">${D(x.w).getDate()}/${D(x.w).getMonth()+1}</span><span class="wk-track" role="cell"><i class="dur" style="width:${Math.round(x.dur/mx*100)}%"></i></span><b class="num" role="cell">${Math.round(x.dur)} min</b><span class="wk-track" role="cell"><i class="ld" style="width:${Math.round(x.ld/ml*100)}%"></i></span><b class="num" role="cell">${Math.round(x.ld)} UA</b></div>`).join("")}</div>
   <div class="cv-leg small"><span><i class="lg-bar"></i>Durée</span><span><i class="lg-ld"></i>Charge sRPE</span></div></section>`;
  h+=testsSection();
  h+=weekReportsFold(t);
  return h;
}
/* Tests : cartes (dernière valeur, date, évolution, mini-graphique), historique complet au clic */
const TEST_DEFS=[
 {k:"squat",n:"Squat (1RM estimé)",u:"kg",v:x=>isNum(x.squat3)?Math.round(brz(+x.squat3,3)*10)/10:null,raw:x=>isNum(x.squat3)?x.squat3+" kg × 3":""},
 {k:"bench",n:"Développé couché (1RM estimé)",u:"kg",v:x=>isNum(x.bench3)?Math.round(brz(+x.bench3,3)*10)/10:null,raw:x=>isNum(x.bench3)?x.bench3+" kg × 3":""},
 {k:"dl",n:"Soulevé de terre (1RM estimé)",u:"kg",v:x=>isNum(x.dl3)?Math.round(brz(+x.dl3,3)*10)/10:null,raw:x=>isNum(x.dl3)?x.dl3+" kg × 3":""},
 {k:"pull",n:"Tractions (poids du corps)",u:"reps",v:x=>isNum(x.pullReps)?+x.pullReps:null,raw:x=>isNum(x.pullReps)?x.pullReps+" reps":""},
 {k:"dm",n:"Développé militaire haltères",u:"kg × 8",v:x=>isNum(x.dm8)?+x.dm8:null,raw:x=>isNum(x.dm8)?x.dm8+" kg × 8 par haltère":""},
 {k:"cmj",n:"CMJ",u:"cm",v:x=>isNum(x.cmj)?+x.cmj:null,raw:x=>isNum(x.cmj)?fmt(+x.cmj)+" cm":""},
 {k:"bw",n:"Poids de corps",u:"kg",v:x=>isNum(x.bw)?+x.bw:null,raw:x=>isNum(x.bw)?fmt(+x.bw)+" kg":""}
];
function testSeries(def){return [...S.tests].sort((a,b)=>a.date<b.date?-1:1).map(x=>({d:x.date,v:def.v(x),raw:def.raw(x)})).filter(p=>p.v!=null)}
function spark(pts){if(pts.length<2)return "";const W=90,H=28,mn=Math.min(...pts.map(p=>p.v)),mx=Math.max(...pts.map(p=>p.v)),r=mx-mn||1;
  return `<svg viewBox="0 0 ${W} ${H}" class="spark" aria-hidden="true"><polyline points="${pts.map((p,i)=>(i/(pts.length-1)*(W-4)+2).toFixed(1)+","+(H-3-(p.v-mn)/r*(H-6)).toFixed(1)).join(" ")}" /></svg>`}
function testsSection(){
  let h=`<section aria-labelledby="tsH"><div class="row between"><h2 class="sec-h" id="tsH">Tests</h2><button class="btn secondary small" data-act="addTest">${ICONS.plus}Ajouter un résultat</button></div><div class="test-grid">`;
  TEST_DEFS.forEach(def=>{const pts=testSeries(def);if(!pts.length)return;const l=pts[pts.length-1],f=pts[0];const ev=pts.length>1?l.v-f.v:null;
    h+=`<button class="test-card" data-testk="${def.k}"><span class="small muted">${esc(def.n)}</span><b class="num">${fmt(l.v)} <small>${esc(def.u)}</small></b><span class="tiny muted">${fmtShort(l.d)}</span>${spark(pts)}<span class="tiny">${ev!=null?(ev>0?"+":"")+fmt(ev)+" depuis le "+fmtShort(f.d):"1 mesure"}</span></button>`});
  coachTT().forEach(t=>{const pts=testHistory(t.key);if(!pts.length)return;const l=pts[pts.length-1],f=pts[0];const ev=pts.length>1?l.value-f.value:null;
    h+=`<div class="test-card"><span class="small muted">${esc(t.name)}</span><b class="num">${fmt(l.value)} <small>${esc(t.unit)}</small></b><span class="tiny muted">${fmtShort(l.date)}</span>${spark(pts.map(p=>({v:p.value})))}<span class="tiny">${ev!=null?(ev>0?"+":"")+fmt(ev)+" depuis le "+fmtShort(f.date):"1 mesure"}</span></div>`});
  h+=`</div>`;
  if(CUR_UID===LUCAS.uid){const f=LUCAS.fv;h+=`<section class="card" style="margin-top:10px"><h3>Profil force-vitesse (${fmtShort(f.date)})</h3><div class="tablewrap" style="margin-top:6px"><table><tbody>
   <tr><td>30 m</td><td class="num"><b>${f.t30}</b></td></tr><tr><td>F0</td><td class="num"><b>${f.F0}</b> · sous 7 N/kg (classe la plus basse du cours My Sprint)</td></tr><tr><td>V0</td><td class="num"><b>${f.V0}</b></td></tr><tr><td>Pmax</td><td class="num"><b>${f.Pmax}</b></td></tr><tr><td>RF peak / DRF</td><td class="num"><b>${f.rf}</b></td></tr></tbody></table></div>
   <p class="small muted" style="margin-top:8px">Déficit de force horizontale : traîneau lourd, hip thrust, squat et bonds horizontaux sont prioritaires. Retest prévu le ${fmtLong(f.retest)}.</p></section>`}
  return h+`</section>`;
}
function openTestHistory(k){const def=TEST_DEFS.find(d=>d.k===k);const pts=testSeries(def);sheetMode="testHist";
  openSheet(`<div class="sheet-scroll">`+head("Historique",esc(def.n))+`<div class="stack"><div class="tablewrap"><table><thead><tr><th>Date</th><th>Résultat</th><th>Valeur</th></tr></thead><tbody>${pts.slice().reverse().map(p=>`<tr><td>${fmtShort(p.d)}</td><td>${esc(p.raw)}</td><td class="num"><b>${fmt(p.v)}</b> ${esc(def.u)}</td></tr>`).join("")}</tbody></table></div>
   ${k==="squat"||k==="bench"||k==="dl"?'<p class="small muted">1RM estimé par la formule de Brzycki : charge × 36 / (37 − répétitions). Ce n\'est pas un maximum mesuré.</p>':""}</div></div>`,def.n)}
function openTestForm(){sheetMode="testForm";const t=todayISO();const cur=editTest!=null?S.tests[editTest]:{date:t,bw:S.settings.bw};const v=k=>cur&&cur[k]!=null?cur[k]:"";
  openSheet(`<div class="sheet-scroll">`+head("Tests",editTest!=null?"Modifier le test du "+fmtShort(cur.date):"Ajouter un résultat")+`<form class="stack" id="testForm" autocomplete="off">
   <p class="small muted">Chaque champ rempli met à jour les charges de toutes les séances.</p>
   <div class="grid2">${fld("tdate","Date","date",v("date"))}${fld("tbw","Poids de corps (kg)","number",v("bw"),"0.1")}${fld("tcmj","CMJ (cm)","number",v("cmj"),"0.1")}${fld("tsquat","Squat 3RM (kg)","number",v("squat3"),"0.5")}${fld("tbench","Couché 3RM (kg)","number",v("bench3"),"0.5")}${fld("tdl","Soulevé de terre 3RM (kg)","number",v("dl3"),"0.5")}${fld("tpreps","Tractions max (reps)","number",v("pullReps"),"1")}${fld("tpload","Lest 3RM tractions (kg)","number",v("pullLoad3"),"0.5")}${fld("tdm8","Militaire haltères × 8 (kg)","number",v("dm8"),"0.5")}${fld("trdlw","Roumain : charge (kg)","number",v("rdlRefW"),"0.5")}${fld("trdlr","Roumain : reps (≤ 10)","number",v("rdlRefR"),"1")}</div>
   ${coachTT().length?`<h3>Tests de ton coach</h3><div class="grid2">${coachTT().map(t=>fld("ct_"+t.key,t.name+" ("+t.unit+")","number",v(t.key),"0.1",'data-ctest="'+esc(t.key)+'"')).join("")}</div>`:""}
   <button class="btn full" type="submit">Enregistrer et recalculer</button></form></div>`,"Résultat de test")}
function badgesBody(){const v=viewBadges();const i=v.indexOf('<div class="stack">');return i>=0?v.slice(i+19,v.lastIndexOf("</div>")):v}

