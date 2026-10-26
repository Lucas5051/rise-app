/* =====================================================================
   DOMAINE · ÉDITEUR DE SÉANCE EN 4 ÉTAPES
   1. Informations générales · 2. Échauffement · 3. Corps de séance · 4. Retour au calme et vérification
   Brouillon enregistré automatiquement (reprise après fermeture), annulation de la dernière modification,
   retour en arrière, duplication d'exercice, recherche et filtres dans la bibliothèque, prescription structurée
   des charges, aperçu athlète, contrôle de durée, alerte « deux séances lourdes trop proches », tests manquants.
   ===================================================================== */
const PS_STEPS=[[1,"Informations"],[2,"Échauffement"],[3,"Corps de séance"],[4,"Retour au calme et vérification"]];
const CAT_KEYS=()=>Object.keys(CAT_L);
function psSaveDraft(){if(!PSD)return;PL.psDraft={cedit:CEDIT,ps:PSD.ps,wid:PSD.wid,isNew:PSD.isNew,step:PSD.step,at:nowISO()};plSave(true)}
/* Historique d'annulation : on empile l'état AVANT chaque modification */
function psPush(st){PSD.hist=PSD.hist||[];if(st&&PSD.hist[PSD.hist.length-1]!==st){PSD.hist.push(st);if(PSD.hist.length>40)PSD.hist.shift()}}
function psSnap(){if(!PSD)return;const cur=JSON.stringify(PSD.ps);if(PSD.last&&PSD.last!==cur)psPush(PSD.last);psPush(cur);PSD.last=null}
function psTyped(){if(!PSD)return;const cur=JSON.stringify(PSD.ps);if(PSD.last&&PSD.last!==cur){psPush(PSD.last);PSD.last=cur;const u=document.querySelector('[data-pe="psUndo"]');if(u)u.disabled=false}}
function openPsEditor(psId,wid,ro){const p=editProg();let f=psId?findPs(p,psId):null;
  const d=PL.psDraft;const same=d&&d.cedit&&CEDIT&&d.cedit.id===CEDIT.id&&((psId&&d.ps.id===psId)||(!psId&&d.isNew&&d.wid===wid));
  PSD={ps:same&&!ro?deep(d.ps):(f?deep(f.ps):newSession({day:0})),wid:f?f.w.id:wid,isNew:!f,step:same&&!ro?(d.step||1):1,ro:!!ro,hist:[],restored:!!(same&&!ro)};
  PSD.ps.main=PSD.ps.main||[];PSD.ps.wu=PSD.ps.wu||[];PSD.ps.cd=PSD.ps.cd||[];
  PSD.last=JSON.stringify(PSD.ps);sheetMode="psEdit";openSheet(sheetPs(ro),"Séance du programme");if(PSD.restored)toast("Brouillon repris")}
const psRefresh=()=>{PSD.last=JSON.stringify(PSD.ps);setSheet(sheetPs(PSD&&PSD.ro));psSaveDraft()};
function prescFields(r,i,dis){const p=r.presc||{};const m=p.mode||"";const refs=[...REF_STD,...coachTT().map(t=>[t.key,t.name])];
  const sel=`<div class="field"><label for="exm${i}">Charge</label><select id="exm${i}" data-ef="presc.mode" ${dis}><option value="">Non précisée</option>${PRESC_MODES.map(([k,l])=>`<option value="${k}" ${m===k?"selected":""}>${l}</option>`).join("")}</select></div>`;
  let more="";
  if(m==="pct1rm"||m==="pctTest")more=`<div class="grid3">${fld("expp"+i,"Pourcentage","number",p.pct??"","1",'data-ef="presc.pct" min="1" max="150" '+dis)}<div class="field"><label for="exref${i}">Référence</label><select id="exref${i}" data-ef="presc.ref" ${dis}><option value="">Choisir</option>${refs.map(([k,l])=>`<option value="${esc(k)}" ${p.ref===k?"selected":""}>${esc(l)}</option>`).join("")}</select></div>${fld("exrd"+i,"Arrondi (kg)","number",p.round??"2.5","0.25",'data-ef="presc.round" '+dis)}</div>
     <div class="grid3">${fld("exmin"+i,"Charge mini (kg)","number",p.min??"","0.5",'data-ef="presc.min" '+dis)}${fld("exmax"+i,"Charge maxi (kg)","number",p.max??"","0.5",'data-ef="presc.max" '+dis)}${fld("exfb"+i,"Si test absent","text",(p.fallback||{}).target||"RIR 2",null,'data-ef="presc.fallback" '+dis)}</div>`;
  else if(m==="fixed"||m==="bwPlus")more=fld("exv"+i,m==="fixed"?"Charge (kg)":"Lest (kg)","number",p.value??"","0.5",'data-ef="presc.value" '+dis);
  else if(["rpe","rir","time","distance"].includes(m))more=fld("ext"+i,{rpe:"RPE cible",rir:"RIR cible",time:"Durée",distance:"Distance"}[m],"text",p.target||"",null,'data-ef="presc.target" '+dis);
  return sel+more}
function exEdRow(r,i,n,dis,ro){
  return `<div class="ex-ed" data-i="${i}"><div class="row between" style="flex-wrap:nowrap"><b class="small">Exercice ${i+1}</b>${ro?"":`<span class="row" style="gap:4px;flex-wrap:nowrap"><button type="button" class="icon-btn" data-pe="exUp" data-i="${i}" aria-label="Monter l'exercice ${i+1}" ${i?"":"disabled"}>↑</button><button type="button" class="icon-btn" data-pe="exDown" data-i="${i}" aria-label="Descendre l'exercice ${i+1}" ${i<n-1?"":"disabled"}>↓</button><button type="button" class="btn ghost small" data-pe="exDup" data-i="${i}" aria-label="Dupliquer l'exercice ${i+1}">Dupliquer</button><button type="button" class="btn ghost small" data-pe="exDel" data-i="${i}" aria-label="Retirer l'exercice ${i+1}">Retirer</button></span>`}</div>
    <div class="field"><label for="exn${i}">Nom</label><input id="exn${i}" list="exNames" data-ef="n" value="${esc(r.n)}" ${dis}></div>
    <div class="grid3">${fld("exs"+i,"Séries","number",r.sets,"1",'data-ef="sets" '+dis)}${fld("exr"+i,"Répétitions ou durée","text",r.reps,null,'data-ef="reps" '+dis)}${fld("exp"+i,"Repos","text",r.rest,null,'data-ef="rest" '+dis)}</div>
    <div class="grid3">${fld("exi"+i,"Intensité (RIR…)","text",r.rir,null,'data-ef="rir" '+dis)}<div class="field"><label for="exc${i}">Type</label><select id="exc${i}" data-ef="cat" ${dis}>${Object.entries(CAT_L).map(([k,l])=>`<option value="${k}" ${r.cat===k?"selected":""}>${l}</option>`).join("")}</select></div>${fld("exl"+i,"Note de charge (facultatif)","text",r.load||"",null,'data-ef="load" '+dis)}</div>
    ${prescFields(r,i,dis)}</div>`}
const warmRowsEd=(key,list,dis,ro)=>(list||[]).map((x,i)=>`<div class="warm-ed" data-wk="${key}" data-i="${i}"><div class="grid2">${fld(key+"n"+i,"Exercice","text",x.n,null,'list="exNames" data-wf="n" '+dis)}${fld(key+"d"+i,"Durée ou répétitions","text",x.dose,null,'data-wf="dose" '+dis)}</div>${fld(key+"c"+i,"Consigne courte","text",x.cue||"",null,'data-wf="cue" '+dis)}${ro?"":`<button type="button" class="btn ghost small" data-pe="warmDel" data-wk="${key}" data-i="${i}">Retirer</button>`}</div>`).join("");
function psChecks(ps){const out=[];const est=estimatePs(ps);const dur=+ps.dur||0;
  if(dur&&Math.abs(est-dur)>Math.max(10,dur*.2))out.push({k:"warn",t:`Durée annoncée ${dur} min, estimation ${est} min : l'écart dépasse ${Math.max(10,Math.round(dur*.2))} min. Ajuste la durée annoncée ou le contenu.`});
  if(!(ps.main||[]).filter(r=>r.n).length)out.push({k:"err",t:"Aucun exercice dans le corps de séance."});
  const p=editProg();if(p&&(ps.fam==="heavy"||ps.fam==="power")){const L=progWeeks(p);const wi=L.findIndex(x=>x.w.id===PSD.wid||x.w.sessions.some(s=>s.id===ps.id));
    const abs=(w,d)=>w*7+(+d);const me_=abs(wi,ps.day);
    L.forEach((x,i)=>x.w.sessions.forEach(o=>{if(o.id===ps.id||!(o.fam==="heavy"||o.fam==="power"))return;const g=Math.abs(abs(i,o.day)-me_);
      if(g<2)out.push({k:"warn",t:`« ${o.name} » (${FAM_L[o.fam].toLowerCase()}) est ${g===0?"le même jour":"la veille ou le lendemain"} : deux séances lourdes à moins de 48 h. Repère du cours : ${srcLabel("FORCE_P18")}.`})}))}
  const refs=[...new Set((ps.main||[]).filter(r=>r.presc&&["pct1rm","pctTest"].includes(r.presc.mode)).map(r=>r.presc.ref).filter(Boolean))];
  const bad=(ps.main||[]).filter(r=>r.presc&&["pct1rm","pctTest"].includes(r.presc.mode)&&(!r.presc.ref||!isNum(r.presc.pct)));
  bad.forEach(r=>out.push({k:"err",t:`« ${r.n||"Exercice"} » : pourcentage ou référence manquant.`}));
  const asg=editAsg();if(asg&&refs.length){const miss=withAthlete(asg.clientId,()=>refs.filter(ref=>!(est1RM(ref)||lastTest(REF_TEST_KEY[ref]||ref))));
    if(miss.length)out.push({k:"warn",t:`Tests manquants pour ${accountName(PL.accounts[asg.clientId])} : ${miss.map(refLabel).join(", ")}. L'athlète verra « Test requis pour calculer cette charge ».`})}
  else if(refs.length)out.push({k:"info",t:"Tests nécessaires pour calculer les charges : "+refs.map(refLabel).join(", ")+"."});
  return out}
function psPreview(ps){const asg=editAsg();const view=r=>{const pr=r.presc;if(!pr||!pr.mode)return r.load?esc(r.load):"";
    const L=asg?withAthlete(asg.clientId,()=>prescLoad(pr)):(["pct1rm","pctTest"].includes(pr.mode)?{text:pr.pct+" % · "+refLabel(pr.ref)+" (calculé pour chaque client)"}:prescLoad(pr));return L?esc(L.text):""};
  return `<section class="card preview-ath" aria-label="Aperçu athlète"><div class="eyebrow">Aperçu athlète${asg?" · "+esc(accountName(PL.accounts[asg.clientId])):""}</div><h3>${esc(ps.name||"Séance")}</h3><p class="small muted">${esc(ps.goal||"")}${ps.goal?" · ":""}${+ps.dur||"—"} min · ${esc(ps.int||"")}</p>
   ${(ps.wu||[]).length?`<p class="small"><b>Échauffement · ${ps.wuMin||0} min :</b> ${ps.wu.map(x=>esc(x.n)).join(", ")}</p>`:""}
   <ol class="prev-ex">${(ps.main||[]).filter(r=>r.n).map(r=>`<li><b>${esc(r.n)}</b> <span class="num">${esc(String(r.sets))} × ${esc(r.reps)}</span>${view(r)?` · <span class="small">${view(r)}</span>`:""}<span class="small muted"> · repos ${esc(r.rest||"—")}${r.rir?" · "+esc(r.rir):""}</span></li>`).join("")}</ol>
   ${(ps.cd||[]).length?`<p class="small"><b>Retour au calme · ${ps.cdMin||0} min :</b> ${ps.cd.map(x=>esc(x.n)).join(", ")}</p>`:""}</section>`}
function libResults(q,cat){q=(q||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  return allExerciseNames().map(n=>({n,f:exLib(n)})).filter(x=>(!cat||x.f.cat===cat)&&(!q||x.n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").includes(q)||(x.f.muscles||"").toLowerCase().includes(q))).slice(0,12)
    .map(x=>`<button type="button" class="list-item lib-pick" data-pe="libAdd" data-n="${esc(x.n)}"><div class="grow"><b class="small">${esc(x.n)}</b><div class="tiny muted">${esc(EX_CATS[x.f.cat]||"")}${x.f.equip?" · "+esc(x.f.equip):""}</div></div>${ICONS.plus}</button>`).join("")||'<p class="small muted">Aucun exercice trouvé.</p>'}
function sheetPs(ro){const {ps}=PSD;const step=ro?4:(PSD.step||1);const dis=ro?"disabled":"";const n=(ps.main||[]).length;
  const bar=`<nav class="ps-steps" aria-label="Étapes de l'éditeur">${PS_STEPS.map(([k,l])=>`<button type="button" data-pe="psGo" data-step="${k}" ${k===step?'aria-current="step"':""} ${ro&&k!==4?"disabled":""}><span class="num">${k}</span><span class="ps-l">${esc(l)}</span></button>`).join("")}</nav>`;
  let body="";
  if(step===1)body=`<div class="grid2">${fld("psName","Nom de la séance","text",ps.name,null,dis)}${fld("psShort","Abréviation calendrier","text",ps.short||"",null,'maxlength="6" '+dis)}</div>
   <div class="grid3"><div class="field"><label for="psDay">Jour</label><select id="psDay" ${dis}>${DAYS_L.map((d,i)=>`<option value="${i}" ${+ps.day===i?"selected":""}>${d}</option>`).join("")}</select></div>${fld("psTime","Moment","text",ps.time||"",null,'placeholder="Soir, 18h…" '+dis)}${fld("psDur","Durée annoncée (min)","number",ps.dur,"1",dis)}</div>
   <div class="grid3"><div class="field"><label for="psInt">Intensité</label><select id="psInt" ${dis}>${INT_L.map(x=>`<option ${ps.int===x?"selected":""}>${x}</option>`).join("")}</select></div>${fld("psRpe","RPE prévu","number",ps.rpe,"1",'min="0" max="10" '+dis)}<div class="field"><label for="psFam">Type</label><select id="psFam" ${dis}>${Object.entries(FAM_L).map(([k,l])=>`<option value="${k}" ${ps.fam===k?"selected":""}>${l}</option>`).join("")}</select></div></div>
   ${fld("psGoal","Objectif (affiché à l'athlète)","text",ps.goal||"",null,dis)}
   <label class="row" style="gap:8px"><input type="checkbox" id="psOpt" ${ps.optional?"checked":""} ${dis}> Séance optionnelle</label>`;
  if(step===2)body=`${fld("psWuMin","Durée de l'échauffement (min)","number",ps.wuMin,"1",dis)}<p class="tiny muted">Repère : 10 à 15 min (${esc(srcLabel("PREV_P32"))}).</p>${warmRowsEd("wu",ps.wu,dis,ro)||'<p class="small muted">Aucun exercice d\'échauffement.</p>'}${ro?"":`<button type="button" class="btn ghost small" data-pe="warmAdd" data-wk="wu">${ICONS.plus}Ajouter un exercice d'échauffement</button>`}`;
  if(step===3)body=`<section class="stack tight">${(ps.main||[]).map((r,i)=>exEdRow(r,i,n,dis,ro)).join("")||'<p class="small muted">Aucun exercice.</p>'}${ro?"":`<button type="button" class="btn secondary small" data-pe="exAdd">${ICONS.plus}Ajouter un exercice vide</button>`}</section>
   ${ro?"":`<details class="fold" id="psLibFold" ${n&&!PSD.libOpen?"":"open"}><summary>Ajouter depuis la bibliothèque</summary><div class="fold-body stack tight"><div class="grid2"><div class="field"><label for="psLibQ">Rechercher</label><input id="psLibQ" type="search" placeholder="Nom ou muscle" value="${esc(PSD.libQ||"")}"></div><div class="field"><label for="psLibCat">Catégorie</label><select id="psLibCat"><option value="">Toutes</option>${Object.entries(EX_CATS).map(([k,l])=>`<option value="${k}" ${PSD.libCat===k?"selected":""}>${l}</option>`).join("")}</select></div></div><div id="psLibRes" class="stack tight">${libResults(PSD.libQ||"",PSD.libCat||"")}</div></div></details>`}`;
  if(step===4){const C=psChecks(ps);
    body=`${fld("psCdMin","Durée du retour au calme (min)","number",ps.cdMin,"1",dis)}<p class="tiny muted">Repère : 5 à 10 min (${esc(srcLabel("PLIO_P26"))}).</p>${warmRowsEd("cd",ps.cd,dis,ro)||'<p class="small muted">Aucun exercice de retour au calme.</p>'}${ro?"":`<button type="button" class="btn ghost small" data-pe="warmAdd" data-wk="cd">${ICONS.plus}Ajouter un exercice de retour au calme</button>`}
     <section class="card stack tight"><h3>Vérification</h3>${C.length?C.map(c=>`<p class="small ${c.k==="err"?"err-txt":c.k==="warn"?"warn-txt":""}">${c.k==="err"?"⛔ ":c.k==="warn"?"⚠️ ":"ℹ️ "}<span class="sr-only">${c.k==="err"?"Bloquant : ":c.k==="warn"?"Attention : ":"Information : "}</span>${esc(c.t)}</p>`).join(""):'<p class="small">Aucun problème détecté.</p>'}</section>${psPreview(ps)}`}
  return `<div class="sheet-scroll">`+head(ro?"Consultation":"Séance · étape "+step+"/4",esc(ps.name||"Nouvelle séance"))+bar+`<form id="psForm" class="stack" onsubmit="return false">
   ${body}<p class="small est" id="psEst" aria-live="polite">Estimation : ${estimatePs(ps)} min (échauffement + exercices, repos et transitions + retour au calme)${+ps.dur?" · annoncée : "+ps.dur+" min":""}.</p>
   <datalist id="exNames">${allExerciseNames().map(x=>`<option value="${esc(x)}">`).join("")}</datalist><p class="small" id="psMsg" role="alert"></p></form></div>
   ${ro?"":`<div class="sheet-actions"><div class="row" style="flex-wrap:wrap;gap:8px">${step>1?`<button type="button" class="btn ghost" data-pe="psGo" data-step="${step-1}">${ICONS.back}Retour</button>`:""}<button type="button" class="btn ghost" data-pe="psUndo" aria-label="Annuler la dernière modification" ${PSD.hist&&PSD.hist.length?"":"disabled"}>Annuler</button><span class="grow"></span>${step<4?`<button type="button" class="btn secondary" data-pe="psGo" data-step="${step+1}">Suivant</button>`:""}</div>
     <div class="row" style="flex-wrap:nowrap;gap:8px"><button class="btn grow" data-pe="saveSession">Enregistrer la séance</button><button type="button" class="btn ghost" data-pe="psCancel">Abandonner</button></div></div>`}`}
function psRead(){const f=document.getElementById("psForm");if(!f||!PSD||PSD.ro)return;const ps=PSD.ps;const has=id=>!!document.getElementById(id);
  if(has("psName")){ps.name=val("psName").trim()||"Séance";ps.short=val("psShort").trim();ps.day=+val("psDay");ps.time=val("psTime").trim();ps.dur=num(val("psDur"),5,300)||ps.dur;ps.int=val("psInt");ps.rpe=num(val("psRpe"),0,10);ps.fam=val("psFam");ps.goal=val("psGoal").trim();ps.optional=!!document.getElementById("psOpt").checked}
  if(has("psWuMin"))ps.wuMin=num(val("psWuMin"),0,60)||0;if(has("psCdMin"))ps.cdMin=num(val("psCdMin"),0,60)||0;
  f.querySelectorAll(".ex-ed").forEach(row=>{const r=ps.main[+row.dataset.i];if(!r)return;row.querySelectorAll("[data-ef]").forEach(inp=>{const k=inp.dataset.ef;let v=inp.value;
    if(k.startsWith("presc.")){const pk=k.slice(6);r.presc=r.presc||{};if(pk==="mode"){if(!v){delete r.presc;return}r.presc.mode=v;return}
      if(pk==="fallback"){r.presc.fallback=v.trim()?{mode:/^RPE/i.test(v)?"rpe":"rir",target:v.trim()}:null;return}
      if(pk==="ref"){r.presc.ref=v;return}r.presc[pk]=v===""?undefined:+String(v).replace(",",".");return}
    if(k==="sets")v=num(v,1,20)||1;r[k]=typeof v==="string"?v.trim():v})});
  f.querySelectorAll(".warm-ed").forEach(row=>{const L=ps[row.dataset.wk];const x=L[+row.dataset.i];if(!x)return;row.querySelectorAll("[data-wf]").forEach(inp=>x[inp.dataset.wf]=inp.value.trim())})}
function savePs(){psRead();const p=editProg();const ps=PSD.ps;const msg=document.getElementById("psMsg");
  ps.main=(ps.main||[]).filter(r=>r.n&&r.n.trim());if(!ps.name.trim()){msg.textContent="Donne un nom à la séance.";return}
  const bad=ps.main.find(r=>!r.reps);if(bad){msg.textContent="Indique les répétitions (ou la durée) de « "+bad.n+" ».";return}
  const err=psChecks(ps).find(c=>c.k==="err"&&!/Aucun exercice/.test(c.t));if(err){msg.textContent=err.t;return}
  if(PSD.isNew){const w=progWeeks(p).find(x=>x.w.id===PSD.wid).w;w.sessions.push(ps)}else{const f=findPs(p,ps.id);Object.assign(f.ps,ps)}
  delete PL.psDraft;progChanged((PSD.isNew?"Séance ajoutée : ":"Séance modifiée : ")+ps.name);PSD=null;closeSheet(false);render();toast("Séance enregistrée")}
/* Actions propres à l'éditeur en étapes */
document.addEventListener("click",ev=>{const el=ev.target.closest("[data-pe]");if(!el||!PSD||!isCoachAccount())return;const a=el.dataset.pe;
  const S_=()=>{psRead();psSnap()};
  if(a==="psGo"){psRead();PSD.step=+el.dataset.step;psRefresh();const h=document.querySelector("#layer h2, .sheet h2");h&&h.focus&&h.focus();ev.stopImmediatePropagation();return}
  if(a==="psUndo"){psRead();psTyped();const s=PSD.hist.pop();if(s){PSD.ps=JSON.parse(s);psRefresh();toast("Dernière modification annulée")}ev.stopImmediatePropagation();return}
  if(a==="psCancel"){delete PL.psDraft;plSave(true);PSD=null;closeSheet(false);render();toast("Modifications abandonnées");ev.stopImmediatePropagation();return}
  if(a==="exDup"){S_();const i=+el.dataset.i;PSD.ps.main.splice(i+1,0,deep(PSD.ps.main[i]));psRefresh();toast("Exercice dupliqué");ev.stopImmediatePropagation();return}
  if(a==="libAdd"){S_();PSD.libOpen=true;const nm=el.dataset.n;const f=exLib(nm);PSD.ps.main.push({n:nm,sets:3,reps:"8",rest:"90 s",rir:"RIR 2",load:"",cat:f.cat==="prevention"?"prev":f.cat==="gainage"?"prev":"main",alt:f.alt||""});psRefresh();toast("« "+nm+" » ajouté");ev.stopImmediatePropagation();return}
  if(["exAdd","exDel","exUp","exDown","warmAdd","warmDel"].includes(a)){psRead();psSnap()}
},true);
document.addEventListener("change",ev=>{const t=ev.target;if(!PSD||!t.closest||!t.closest("#psForm"))return;
  if(t.dataset.ef==="presc.mode"){psRead();psSnap();psRefresh()}});
document.addEventListener("input",ev=>{const t=ev.target;if(!PSD)return;
  if(t.id==="psLibQ"||t.id==="psLibCat"){PSD.libQ=val("psLibQ");PSD.libCat=val("psLibCat");const r=document.getElementById("psLibRes");if(r)r.innerHTML=libResults(val("psLibQ"),val("psLibCat"));return}
  if(t.closest&&t.closest("#psForm")){clearTimeout(PSD.snapT);PSD.snapT=setTimeout(()=>{if(!PSD)return;psRead();psTyped();psSaveDraft()},500)}});
document.addEventListener("change",ev=>{if(ev.target.id==="psLibCat"&&PSD){PSD.libCat=val("psLibCat");const r=document.getElementById("psLibRes");if(r)r.innerHTML=libResults(val("psLibQ"),val("psLibCat"))}});
