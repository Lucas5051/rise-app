/* =====================================================================
   MODULE 21 · RAPPELS DU QUESTIONNAIRE DU JOUR
   Une page web ne peut pas envoyer de notification quand elle est fermée sur iPhone (pas de serveur de push ici).
   3 voies, sans rien simuler :
   1. Calendrier (.ics) : événement quotidien avec alerte, géré par l'iPhone lui-même → fonctionne tout de suite.
   2. Appli iOS (pont Capacitor, LocalNotifications) : notifications locales répétées, actives quand l'appli native existe.
   3. Appli ouverte : bandeau de rappel + notification du navigateur si elle est autorisée.
   ===================================================================== */
const REM_DAYS=[[1,"L","MO"],[2,"M","TU"],[3,"M","WE"],[4,"J","TH"],[5,"V","FR"],[6,"S","SA"],[0,"D","SU"]];
const remCfg=()=>{const r=S.settings.wbRem;return isObj(r)?{on:!!r.on,times:Array.isArray(r.times)&&r.times.length?r.times.filter(x=>/^\d{2}:\d{2}$/.test(x)).slice(0,3):["08:00"],days:Array.isArray(r.days)?r.days.filter(d=>d>=0&&d<=6):[0,1,2,3,4,5,6]}:{on:false,times:["08:00"],days:[0,1,2,3,4,5,6]}};
let REMD=null;
function openReminders(){REMD=remCfg();sheetMode="rem";openSheet(sheetReminders(),"Rappels du questionnaire")}
function sheetReminders(){
  const r=REMD,nat=Notify.native();
  return `<div class="sheet-scroll">`+head("Questionnaire du jour","Rappels")+`<div class="stack">
   <label class="row between card" style="cursor:pointer;flex-wrap:nowrap;gap:12px"><span><b>Activer les rappels</b><br><span class="small muted">Seulement les jours où le questionnaire n'est pas encore rempli quand l'appli est ouverte.</span></span><input type="checkbox" id="remOn" ${r.on?"checked":""} style="width:26px;height:26px;flex:none"></label>
   <div class="field"><span class="lbl">Heures (3 maximum)</span>
    ${r.times.map((t,i)=>`<div class="row" style="gap:8px;margin-bottom:8px"><input type="time" id="remT${i}" value="${t}" aria-label="Heure du rappel ${i+1}" style="flex:1">${r.times.length>1?`<button type="button" class="btn ghost small" data-remdel="${i}" aria-label="Supprimer ce rappel">Retirer</button>`:""}</div>`).join("")}
    ${r.times.length<3?`<button type="button" class="btn secondary small" data-act="remAdd">+ Ajouter une heure</button>`:""}</div>
   <div class="field"><span class="lbl" id="remDL">Jours</span><div class="toggles" role="group" aria-labelledby="remDL">${REM_DAYS.map(([d,l])=>`<button type="button" class="toggle" data-remday="${d}" aria-pressed="${r.days.includes(d)}" aria-label="${JOURS_C[d]}">${l}</button>`).join("")}</div></div>
   <section class="card"><h3>Comment tu seras prévenu</h3><ul class="clean small" style="margin-top:6px">
    <li><b>Calendrier de ton iPhone (recommandé)</b> : un rappel quotidien avec alerte, même appli fermée. Après avoir enregistré, touche « Ajouter à mon calendrier » et ouvre le fichier.</li>
    <li><b>Appli ouverte</b> : bandeau de rappel à l'heure choisie${"Notification" in window?", et notification du navigateur si tu l'autorises":""}.</li>
    <li><b>Appli iOS</b> : ${nat?"notifications programmées sur ton iPhone.":"notifications automatiques quand l'appli native sera installée (pas encore le cas)."}</li></ul>
    <p class="tiny muted" style="margin-top:6px">Sur iPhone, une page web ne peut pas envoyer de notification quand elle est fermée : c'est pour ça que le calendrier est la solution la plus fiable.</p></section>
  </div></div><div class="sheet-actions"><button class="btn full" data-act="remSave" style="min-height:52px">Enregistrer</button>${remCfg().on?`<button class="btn secondary full" data-act="remIcs">Ajouter à mon calendrier</button>`:""}</div>`;
}
function remRead(){REMD.on=!!(document.getElementById("remOn")||{}).checked;REMD.times=REMD.times.map((t,i)=>{const v=val("remT"+i);return /^\d{2}:\d{2}$/.test(v)?v:t})}
function remRefresh(){setSheet(sheetReminders())}
async function remSave(){
  remRead();if(!REMD.days.length){toast("Choisis au moins un jour");return}
  REMD.times=[...new Set(REMD.times)].sort();S.settings.wbRem={...REMD};save();
  await Notify.scheduleDaily(REMD);
  if(REMD.on&&"Notification" in window&&Notification.permission==="default"){try{await Notification.requestPermission()}catch(e){}}
  render();remRefresh();toast(REMD.on?"Rappels enregistrés : "+REMD.times.map(t=>t.replace(":","h")).join(", "):"Rappels désactivés");
}
function remIcs(){
  const r=remCfg();if(!r.on||!r.days.length)return;
  const start=todayISO()<PERIOD_START?PERIOD_START:todayISO(),d0=start.replace(/-/g,""),until=addDays(todayISO(),365).replace(/-/g,"")+"T235959";
  const byday=REM_DAYS.filter(([d])=>r.days.includes(d)).map(x=>x[2]).join(",");
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const ev=r.times.map((t,i)=>{const hm=t.replace(":","");return ["BEGIN:VEVENT","UID:usci-muscu-questionnaire-"+hm+"@usci-muscu","DTSTAMP:"+stamp,"DTSTART:"+d0+"T"+hm+"00","DURATION:PT5M",
    "RRULE:FREQ=WEEKLY;BYDAY="+byday+";UNTIL="+until,"SUMMARY:Questionnaire bien-être ("+APP_CONFIG.name+")","DESCRIPTION:Ouvre "+APP_CONFIG.name+" et remplis ton ressenti du jour (1 min).",
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Questionnaire bien-être","TRIGGER:PT0M","END:VALARM","END:VEVENT"].join("\r\n")}).join("\r\n");
  const ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//"+APP_CONFIG.name+"//FR\r\nCALSCALE:GREGORIAN\r\n"+ev+"\r\nEND:VCALENDAR\r\n";
  saveFile("rappel-questionnaire-usci-muscu.ics",ics,"text/calendar");
}
async function saveFile(name,data,type){
  try{if(window.claude&&window.claude.use){const dl=await window.claude.use("downloads");if(dl){await dl.save({filename:name,data});toast("Fichier proposé au téléchargement : ouvre-le pour l'ajouter au calendrier");return}}}catch(e){if(e&&e.code==="declined"){toast("Téléchargement annulé");return}}
  try{const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast("Fichier téléchargé : ouvre-le pour l'ajouter au calendrier")}catch(e){toast("Téléchargement impossible ici")}
}
/* Rappel quand l'appli est ouverte : vérifié chaque minute. */
function remDue(){const r=remCfg(),t=todayISO();if(!r.on||!r.days.includes(new Date().getDay()))return null;
  if(S.fatigue[t]&&isNum(S.fatigue[t].score))return null;const now=new Date(),hm=pad(now.getHours())+":"+pad(now.getMinutes());
  const past=r.times.filter(x=>x<=hm);return past.length?past[past.length-1]:null}
let remShown={};
setInterval(()=>{const due=remDue();if(!due)return;const k=todayISO()+due;if(remShown[k])return;remShown[k]=true;
  if(TAB==="home"&&!DLG)render();
  if(document.visibilityState!=="visible"&&"Notification" in window&&Notification.permission==="granted"){try{new Notification("Questionnaire bien-être",{body:"Remplis ton ressenti du jour (1 min)."})}catch(e){}}
},60000);

/* ---------- Historique d'une séance (déroulé, prévu vs réalisé) ---------- */
function openHistory(id){openId=id;sheetMode="hist";const s=sessionById(id);if(!s)return;openSheet(sheetHistory(id),"Récapitulatif de séance")}
function sheetHistory(id){
  const s=sessionById(id),T=tpl(s),l=S.log[id]||{},st=S.status[id]||{},items=sessionItems(s),ad=S.adapt[id];const ph=l.phases;
  const v=srpe(l);const mm=x=>isNum(x)?Math.floor(x/60)+" min "+pad(Math.round(x%60))+" s":"—";
  let h=`<div class="sheet-scroll">`+head(cap(fmtLong(s.date)),esc(T.name))+`<div class="stack">
   <div class="row">${statusChip(s)}${s.moved?`<span class="chip st-future">Déplacée (prévue le ${fmtShort(s.origDate)})</span>`:""}</div>
   ${st.reason?`<p class="small"><b>Raison :</b> ${esc(reasonLabel(st.reason))}${st.reasonOther?" ("+esc(st.reasonOther)+")":""}${st.comment?` · « ${esc(st.comment)} »`:""}</p>`:""}
   ${l.durPending?`<button class="alert-card al-warn" data-durfix="${id}"><span class="act-ic">${ICONS.clock}</span><span class="grow"><b>Durée à confirmer</b><span class="small">Tu n'as pas appuyé sur « Terminer » : indique l'heure de fin.</span></span>${ICONS.chevron}</button>`:""}
   <div class="kpis"><div><small>Durée réelle</small><b class="num">${isNum(l.dur)?l.dur+" min":"—"}</b></div><div><small>Exercices</small><b class="num">${items.filter(e=>!e.removed).length}</b></div><div><small>RPE</small><b class="num">${isNum(l.rpe)?l.rpe:"—"}</b></div><div><small>Charge sRPE</small><b class="num">${v!=null?v+" UA":"—"}</b></div></div>
   ${ph?`<div class="kpis"><div><small>Échauffement</small><b class="num">${mm(ph.wu)}</b></div><div><small>Corps</small><b class="num">${mm(ph.main)}</b></div><div><small>Retour au calme</small><b class="num">${mm(ph.cd)}</b></div><div><small>Pauses</small><b class="num">${mm(ph.pause)}</b></div></div>`:""}
   ${ad&&ad.mode!=="none"?`<p class="small"><b>Adaptation :</b> ${esc(ADAPT_LABEL[ad.mode])}${ad.reasons&&ad.reasons[0]?" · "+esc(ad.reasons[0]):""}</p>`:""}
   ${l.ton?`<p class="small"><b>Tonnage :</b> ${l.ton} kg</p>`:""}${l.devices&&l.devices.length?`<p class="small"><b>Appareils :</b> ${esc(l.devices.join(", "))}${isNum(l.hrAvg)?" · FC moy "+l.hrAvg:""}</p>`:""}
   <section class="card"><h3>Déroulé</h3>`;
  const wu=T.wu?WU[T.wu]:null;if(wu)h+=`<p class="small" style="margin-top:6px"><b>${esc(wu.t)}</b></p>`;
  let pc=-1;
  items.forEach((e,i)=>{const L=loadInfo(e);if(!e.removed)pc++;const ei=e.removed?-1:pc;const rows=[];const n=typeof e.sets==="number"?e.sets:(parseInt(e.sets)||1);
    for(let k=1;k<=n;k++){const d=l.sets&&ei>=0&&l.sets[ei+"-"+k];rows.push(`<tr><td>${k}</td><td>${esc(e.reps)}${L&&L.kgNum?" · "+fmt(L.kgNum)+" kg":""}</td><td>${d?(d.skipped?"non faite":(isNum(d.reps)?d.reps+" reps":"faite")+(isNum(d.kg)?" · "+fmt(d.kg)+" kg":"")):"—"}</td></tr>`)}
    const ax=l.adaptEx&&ei>=0&&l.adaptEx[ei];
    h+=`<div class="hist-ex ${e.removed?"removed":""}"><b>${i+1}. ${esc(e.n)}</b>${e.removed?` <span class="small muted">${esc(e.removed)}</span>`:""}${ax?`<div class="small pl-adapt">${ICONS.pencil} ${esc(ax.label)}</div>`:""}
     <div class="small muted">${esc(e.rir)} · repos ${esc(e.rest)}${e.tempo?" · tempo "+esc(e.tempo):""}</div>
     ${e.removed?"":`<div class="tablewrap"><table class="mini"><thead><tr><th>Série</th><th>Prévu</th><th>Réalisé</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`}</div>`});
  h+=`<p class="small" style="margin-top:6px"><b>${esc(coolOf(T).t)}</b></p></section>`;
  if(l.durHist&&l.durHist.length)h+=`<section class="card"><h3>Corrections de durée</h3><ul class="clean small">${l.durHist.map(x=>`<li>${esc((x.at||"").slice(0,10))} · ${esc(x.by)} : ${x.old??"—"} → ${x.nw} min${x.reason?" ("+esc(x.reason)+")":""}</li>`).join("")}</ul></section>`;
  h+=logCard(s)+progressCard(s,items);
  return h+`</div></div>`;
}

