/* =====================================================================
   MODULE 20 · AUTRE ACTIVITÉ (saisie, profil du sport, verdict immédiat)
   ===================================================================== */
let OT=null;
function openOther(date,id){
  const o=id&&S.other[id]?{...S.other[id]}:{date:date||todayISO(),sport:"padel",dur:"",rpe:null,focus:"both",label:"",comment:""};
  OT={id:id||null,...o};sheetMode="other";openSheet(sheetOther(),"Autre activité");
}
function sportCard(k){
  const p=k==="autre"?sportOf({sport:"autre",focus:OT.focus,label:OT.label}):SPORTS[k];
  return `<p class="small ot-profile" id="otProfile"><span class="chip other">${esc(p.type)}</span>${p.focus?` <span class="muted">${esc(p.focus)}</span>`:""}</p>`;
}
function sheetOther(){
  const o=OT,v=srpe(o);
  return `<div class="sheet-scroll">`+head(cap(fmtLong(o.date)),o.id?"Modifier l'activité":"Autre activité")+`<div class="stack">
   <div class="field"><span class="lbl" id="otSportL">Sport</span><div class="toggles" role="group" aria-labelledby="otSportL">${Object.entries(SPORTS).map(([k,p])=>`<button type="button" class="toggle" data-otsport="${k}" aria-pressed="${o.sport===k}">${esc(p.name)}</button>`).join("")}</div></div>
   ${o.sport==="autre"?`<div class="grid2"><div class="field"><label for="otLabel">Nom du sport</label><input id="otLabel" value="${esc(o.label||"")}" placeholder="Ex. : squash"></div><div class="field"><label for="otFocus">Zone la plus sollicitée</label><select id="otFocus">${Object.entries(OTHER_FOCUS).map(([k,f])=>`<option value="${k}" ${o.focus===k?"selected":""}>${f.l}</option>`).join("")}</select></div></div>`:""}
   ${sportCard(o.sport)}
   <div class="grid2">${fld("otDate","Date","date",o.date)}${fld("oDur","Durée (min)","number",o.dur,"1")}</div>
   ${rpePicker("o",o.rpe)}
   <p class="small" id="oOut" aria-live="polite">${v!=null?"Charge interne : "+o.dur+" min × RPE "+o.rpe+" = <b>"+v+" UA</b>":"sRPE = durée × RPE, calculé automatiquement."}</p>
   <div class="field"><label for="otCom">Commentaire</label><p class="tiny muted" style="margin:-2px 0 6px">Il est lu pour adapter ta prochaine séance (ex. : « jambes lourdes » → allègement proposé).</p><textarea id="otCom" placeholder="Ressenti : jambes lourdes, mollets, épaules, douleur…">${esc(o.comment||"")}</textarea></div>
   ${o.id?`<button class="btn ghost full" data-act="deleteOther">Supprimer cette activité</button>`:""}
  </div></div><div class="sheet-actions"><button class="btn full" data-act="saveOther" style="min-height:52px">Enregistrer et analyser</button></div>`;
}
function otherRead(){OT.date=val("otDate")||OT.date;OT.dur=num(val("oDur"),1,600);const r=num(val("oRpe"),0,10);OT.rpe=isNum(r)?r:null;OT.comment=val("otCom").slice(0,500);
  if(OT.sport==="autre"){OT.label=val("otLabel").slice(0,40);OT.focus=val("otFocus")||"both"}}
function setOtherSport(k){if(!SPORTS[k])return;otherRead();OT.sport=k;setSheet(sheetOther())}
function saveOther(){
  otherRead();
  if(!isNum(OT.dur)||!isNum(OT.rpe)){toast("Indique la durée et le RPE");return}
  if(OT.date>todayISO()){toast("Indique une activité déjà faite (date passée ou aujourd'hui)");return}
  const id=OT.id||("o-"+OT.date+"-"+Date.now().toString(36));
  S.other[id]={date:OT.date,sport:OT.sport,label:OT.sport==="autre"?OT.label:"",focus:OT.sport==="autre"?OT.focus:"",dur:OT.dur,rpe:OT.rpe,comment:OT.comment,at:nowISO()};
  save();const d=OT.date;OT=null;render();sheetMode="otherVerdict";setSheet(sheetOtherVerdict(d));
}
function deleteOther(){if(!OT||!OT.id)return;delete S.other[OT.id];save();OT=null;closeSheet(false);render();toast("Activité supprimée")}
function sheetOtherVerdict(date){
  const v=otherVerdict(date),sg=dayCommentSignals(date),need=otherNeedsProposal(v,sg),cls=["ok","vig","bad"][Math.max(v.tier,need?1:0)];const nx=need?nextSessionAfter(date):null;const ttl=(v.noBase&&!need?"Plafond personnel à calculer":OT_TIER[v.tier])+(need&&v.tier<2?" · ressenti signalé":"");const rec=nx?recommend(nx):null;
  const f=x=>String(x).replace(".",","),st=S.settings;
  const bar=v.ratio!=null?(()=>{const max=Math.max(+st.otAlert+.3,v.ratio+.1);const pc=x=>Math.min(100,x/max*100);
    return `<div class="ot-gauge" role="img" aria-label="Ratio ${f(v.ratio.toFixed(2))} : zone jusqu'à ${f(st.otZone)}, alerte au-delà de ${f(st.otAlert)}"><span class="z0" style="width:${pc(st.otZone)}%"></span><span class="z1" style="width:${pc(st.otAlert)-pc(st.otZone)}%"></span><span class="z2" style="width:${100-pc(st.otAlert)}%"></span><i style="left:${pc(v.ratio)}%"></i></div>
     <div class="ot-gauge-l tiny muted"><span>Dans ta zone</span><span>Recommandation</span><span>Alerte</span></div>`})():"";
  return `<div class="sheet-scroll">`+head("Analyse de ta charge · "+fmtShort(date),ttl)+`<div class="stack">
   <div class="verdict ${cls}" role="status"><h3>${ttl}</h3><p class="small">${esc(otherAdvice(v))}</p></div>
   ${bar}
   <div class="tablewrap"><table><tbody>
    ${v.acts.map(o=>`<tr><td>${esc(sportOf(o).name)} · ${o.dur} min × RPE ${o.rpe}</td><td class="num">${srpe(o)} UA</td></tr>`).join("")}
    <tr><td>Total de la journée (foot + muscu + activité)</td><td class="num">${v.expected} UA</td></tr>
    <tr><td><b>Charge des 7 derniers jours</b></td><td class="num"><b>${v.acute.total} UA</b></td></tr>
    <tr><td>Ta charge habituelle (par semaine)</td><td class="num">${v.chronic.weekly!=null?v.chronic.weekly+" UA":"—"}</td></tr>
    ${v.ratio!=null?`<tr><td>Ratio 7 jours / habituel</td><td class="num"><b>${f(v.ratio.toFixed(2))}</b></td></tr><tr><td>Ta limite de zone (× ${f(st.otZone)})</td><td class="num">${v.limit} UA</td></tr>`:""}
    ${v.acute.mono!=null?`<tr><td>Monotonie · contrainte (7 jours)</td><td class="num">${f(v.acute.mono.toFixed(1))} · ${v.acute.strain}</td></tr>`:""}
   </tbody></table></div>
   ${v.chronic.weekly!=null?`<p class="tiny muted">Charge habituelle calculée sur ${esc(v.chronic.src)}.</p>`:""}
   ${nx&&rec&&rec.mode!=="none"?`<div class="alert"><span class="dot"></span><div><b>Proposition pour ${esc(tpl(nx).name.toLowerCase())} (${fmtShort(nx.date)}) : ${esc(rec.label)}.</b> ${esc(rec.effect)} <span class="muted">Rien n'est modifié sans ton accord.</span></div></div><button class="btn full" data-open="${nx.id}">Voir et confirmer la proposition</button>`:""}
   ${sg.list.length?`<p class="small"><b>Lu dans ton commentaire :</b> ${esc(sg.list.join(", "))}</p>`:""}
   ${need&&!nx?`<p class="small muted">Pas de séance de muscu dans les 2 prochains jours : rien à alléger. Récupère bien.</p>`:""}
  </div></div><div class="sheet-actions"><button class="btn ${(nx&&rec&&rec.mode!=="none")||v.noBase?"ghost":""} full" data-act="closeSheet">Fermer</button></div>`;
}

