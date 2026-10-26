/* =====================================================================
   MODULE 18 · QUESTIONNAIRE DE BIEN-ÊTRE QUOTIDIEN
   Curseurs tactiles (appui ou glissé), clavier (flèches, Origine/Fin), lecteur d'écran (role="slider").
   ===================================================================== */
let WB=null;
function wbText(it,v){if(!isNum(v))return "Pas encore répondu";return v+" sur 100, "+(v<50?"plus proche de « "+it.lo+" »":v>50?"plus proche de « "+it.hi+" »":"au milieu")}
function openWellness(date){
  date=date||todayISO();const f=S.fatigue[date]||{};
  WB={date,items:{...(f.items||{})}};
  sheetMode="wellness";
  openSheet(sheetWellness(f),"Questionnaire de bien-être");
}
function wbTrack(it){const v=WB.items[it.k];const set=isNum(v);
  return `<div class="wb-item"><span class="wb-q" id="wbq-${it.k}">${esc(it.n)}</span>
   <div class="wb-track ${set?"is-set":""}" role="slider" tabindex="0" data-wb="${it.k}" aria-labelledby="wbq-${it.k}" aria-valuemin="0" aria-valuemax="100" ${set?`aria-valuenow="${v}"`:""} aria-valuetext="${esc(wbText(it,v))}"><span class="wb-rail"><span class="wb-fill" style="width:${set?v:0}%"></span></span><span class="wb-thumb" style="left:calc(19px + (100% - 38px) * ${(set?v:50)/100})"></span></div>
   <div class="wb-ends" aria-hidden="true"><span>${esc(it.lo)}</span><span>${esc(it.hi)}</span></div></div>`}
function wbCount(){return WB_ITEMS.filter(i=>isNum(WB.items[i.k])).length}
function sheetWellness(f){
  const n=wbCount();
  return `<div class="sheet-scroll wb-sheet"><div class="row between" style="margin-bottom:10px"><button class="btn ghost small" data-act="closeSheet">‹ Retour</button><span class="eyebrow">${cap(fmtLong(WB.date))}</span></div>
   <section class="card" style="margin-bottom:6px"><h2 style="font-size:22px">Bien-être quotidien</h2><p class="muted" style="margin-top:6px">Place le curseur là où tu te sens, entre les deux extrêmes. Réponds spontanément.</p></section>
   ${WB_ITEMS.map(wbTrack).join("")}
   <div class="field" style="margin-top:6px"><label for="wbWeight" class="wb-q">Poids (kg)</label><input id="wbWeight" type="number" inputmode="decimal" step="0.1" value="${esc(f.weight??"")}"></div>
   <div class="field" style="margin-top:14px"><label for="wbCom" class="wb-q">Commentaire</label><textarea id="wbCom" placeholder="Si tu veux préciser quelque chose…">${esc(f.comment||"")}</textarea></div>
  </div>
  <div class="sheet-actions"><p class="tiny muted" id="wbCount" style="text-align:center">${n<5?n+" / 5 réponses":"Toutes les réponses sont données"}</p><button class="btn full" data-act="saveWellness" id="wbSave" ${n<5?"disabled":""} style="min-height:52px">Enregistrer mon ressenti</button></div>`;
}
function wbSet(track,v){
  const k=track.dataset.wb,it=WB_ITEMS.find(i=>i.k===k);v=Math.max(0,Math.min(100,Math.round(v)));WB.items[k]=v;
  track.classList.add("is-set");track.setAttribute("aria-valuenow",v);track.setAttribute("aria-valuetext",wbText(it,v));
  track.querySelector(".wb-fill").style.width=v+"%";track.querySelector(".wb-thumb").style.left="calc(19px + (100% - 38px) * "+(v/100)+")";
  const n=wbCount();const c=document.getElementById("wbCount");if(c)c.textContent=n<5?n+" / 5 réponses":"Toutes les réponses sont données";
  const b=document.getElementById("wbSave");if(b)b.disabled=n<5;
}
function wbFromX(track,x){const r=track.getBoundingClientRect();const pad=19;return (x-r.left-pad)/(r.width-2*pad)*100}
let wbDrag=null;
document.addEventListener("pointerdown",ev=>{const tr=ev.target.closest(".wb-track");if(!tr||!WB)return;wbDrag={tr,x:ev.clientX,y:ev.clientY,id:ev.pointerId,moved:false};wbSet(tr,wbFromX(tr,ev.clientX))});
document.addEventListener("pointermove",ev=>{if(!wbDrag||ev.pointerId!==wbDrag.id)return;if(Math.abs(ev.clientX-wbDrag.x)>4)wbDrag.moved=true;if(wbDrag.moved)wbSet(wbDrag.tr,wbFromX(wbDrag.tr,ev.clientX))});
document.addEventListener("pointerup",()=>{wbDrag=null});
document.addEventListener("pointercancel",()=>{wbDrag=null});
document.addEventListener("keydown",ev=>{const tr=ev.target.closest&&ev.target.closest(".wb-track");if(!tr||!WB)return;const cur=isNum(WB.items[tr.dataset.wb])?+WB.items[tr.dataset.wb]:50;
  const map={ArrowRight:5,ArrowUp:5,ArrowLeft:-5,ArrowDown:-5,PageUp:10,PageDown:-10};
  if(ev.key in map){ev.preventDefault();wbSet(tr,cur+map[ev.key])}else if(ev.key==="Home"){ev.preventDefault();wbSet(tr,0)}else if(ev.key==="End"){ev.preventDefault();wbSet(tr,100)}});
function saveWellness(){
  if(wbCount()<5)return;const c=wbCompute(WB.items);const {cmj,pain,factors,...prev}=S.fatigue[WB.date]||{};
  S.fatigue[WB.date]={...prev,items:{...WB.items},score:c.score,hooper:c.hooper,weight:num(val("wbWeight"),35,200),comment:val("wbCom").slice(0,500),at:nowISO(),src:"questionnaire de l'appli"};
  save();closeSheet(false);WB=null;render();toast("Ressenti enregistré · "+c.score+"/100 ("+wbLabel(c.score)+")");
}

