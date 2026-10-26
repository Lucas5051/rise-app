/* =====================================================================
   MODULE 19 · ENTRAÎNEMENTS À CAEN (semaines de cours, à partir du 26/10)
   Mardi soir et/ou jeudi soir au choix, vendredi soir obligatoire.
   La muscu du mardi ou du jeudi n'apparaît que les soirs sans foot.
   ===================================================================== */
let CAEN_W=null;
function openCaen(wn){CAEN_W=wn;sheetMode="caen";openSheet(sheetCaen(wn),"Entraînements à Caen")}
function sheetCaen(wn){
  const w=WEEKS.find(x=>x.n===wn);const cur=S.caen[wn]||null,eff=caenChoice(wn);
  const opt=(k,sub)=>`<button type="button" class="toggle" style="width:100%;justify-content:flex-start;text-align:left;min-height:56px" data-caenset="${k}" aria-pressed="${eff===k}"><span><b>${CAEN_LABEL[k]}</b><br><span class="small muted">${sub}</span></span></button>`;
  return `<div class="sheet-scroll">`+head("Semaine de cours · "+esc(wn)+" · du "+fmtShort(w.s)+" au "+fmtShort(addDays(w.s,6)),"Entraînements à Caen")+`<div class="stack">
   <p class="muted">Le vendredi soir est obligatoire. Choisis le ou les soirs où tu vas t'entraîner à Caen : la muscu se place sur les soirs restants.</p>
   ${opt("jeu","Recommandé · muscu lundi, mardi et mercredi soir")}${opt("mar","Muscu lundi, mercredi et jeudi soir")}${opt("both","Muscu lundi et mercredi soir")}
   ${cur?"":`<p class="tiny muted">Par défaut : jeudi. Les jambes lourdes du lundi ne tombent pas la veille d'un entraînement foot.</p>`}
  </div></div>`;
}
function setCaen(k){
  if(!CAEN_W||!CAEN_LABEL[k])return;S.caen[CAEN_W]=k;save();closeSheet(false);render();
  toast("Caen : "+CAEN_LABEL[k].toLowerCase()+" · planning mis à jour");CAEN_W=null;
}

