/* =====================================================================
   MODULE 27 · ESPACE COACH (interface séparée, réservée au compte coach)
   PROTOTYPE : l'accès est filtré sur l'appareil (rôle du compte connecté). En production, chaque route et chaque
   donnée coach doivent être protégées par le serveur (politiques par rôle) : voir docs/SERVEUR.md.
   ===================================================================== */
let CTAB="dash",CATH=null,CATH_SUB="plan";
/* Navigation coach : 6 rubriques (latérale sur ordinateur, barre compacte en bas sur mobile) ; sous-rubriques en onglets */
const CNAV=[["dash","Tableau de bord","Accueil"],["clients","Clients","Clients"],["programs","Programmes","Programmes"],["library","Bibliothèque","Biblio."],["comm","Communication","Échanges"],["csettings","Paramètres coach","Réglages"]];
const CSUB={library:[["library","Exercices"],["tests","Tests"]],comm:[["msgs","Messages privés"],["group","Groupe"],["invites","Invitations"],["calls","Demandes d'appel"]],
  csettings:[["formulas","Formules"],["rules","Règles d'adaptation"],["brand","Identité de marque"],["log","Journal"],["privacy","Confidentialité"],["cexport","Export"],["account","Compte"]]};
const cGroupOf=t=>t==="athlete"?"clients":(Object.keys(CSUB).find(g=>CSUB[g].some(x=>x[0]===t))||t);
const cFirst=g=>CSUB[g]?CSUB[g][0][0]:g;
const CICON={dash:ICONS.home,clients:svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.6 3.5 5.4"/>'),msgs:ICONS.msg,programs:ICONS.cal,library:svg('<path d="M4 4h6v16H4zM10 4h6v16h-6zM16 6l4-1 3 15-4 1z"/>'),invites:svg('<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 9l9 6 9-6"/>'),formulas:svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),rules:ICONS.gear,log:ICONS.clock};
Object.assign(CICON,{comm:ICONS.msg,csettings:ICONS.gear});
function viewCoachShell(){
  if(!isCoachAccount())return viewDenied();
  if(CTAB==="group")COACH_TH="group";
  const V={dash:coachDash,clients:coachClients,msgs:coachMsgs,group:coachMsgs,programs:coachPrograms,library:coachLibrary,tests:coachTests,invites:coachInvites,calls:coachCalls,
    formulas:coachFormulas,rules:coachRules,brand:coachBrand,log:coachLog,privacy:coachPrivacy,cexport:coachExport,account:coachAccount};
  const body=CTAB==="athlete"&&CATH?coachAthlete():(V[CTAB]||coachDash)();const g=cGroupOf(CTAB);
  const sub=CSUB[g]?`<nav class="ctabs" aria-label="${esc((CNAV.find(x=>x[0]===g)||[])[1]||"")}">${CSUB[g].map(([k,l])=>`<button data-ctab="${k}" ${CTAB===k?'aria-current="page"':""}>${esc(l)}${k==="msgs"||k==="group"?unreadBadge(k):""}</button>`).join("")}</nav>`:"";
  return `<div class="coach-shell"><nav class="coach-nav" aria-label="Espace coach"><div class="coach-brand">${esc(APP_CONFIG.coachBrand)}</div>${CNAV.map(([k,l,sl])=>`<button data-ctab="${cFirst(k)}" ${g===k?'aria-current="page"':""} aria-label="${esc(l)}">${CICON[k]}<span class="lg">${esc(l)}</span><span class="sm" aria-hidden="true">${esc(sl)}</span></button>`).join("")}${coachIsAlsoAthlete()?`<button data-act="goMyTraining" class="coach-out">${ICONS.home}<span>Mon entraînement</span></button>`:""}<button data-act="logout" class="coach-out coach-out2">${ICONS.back}<span>Se déconnecter</span></button></nav>
   <div class="coach-main">${Cloud.isCloud()?`<div class="coach-sync">${syncChip()}</div>`:`<div class="demo-banner mode-banner" role="note"><b>Mode démonstration.</b> Comptes, rôles et codes sont simulés sur cet appareil.</div>`}${sub}${body}</div></div>`;
}
const unreadBadge=k=>{const n=k==="group"?unreadFor("coach","group"):unreadFor("coach")-unreadFor("coach","group");return n?` <span class="dot-n static">${n}</span>`:""};
function afterCoachRender(){}
const ch=(title,eyebrow,extra="")=>`<header class="top"><div class="grow"><div class="eyebrow">${esc(eyebrow||"Espace coach")}</div><h1>${esc(title)}</h1></div>${extra}</header>`;
/* Clients : comptes athlètes de cet appareil (données réelles) + clients fictifs de démonstration */
function coachRoster(){
  const real=athletes().map(a=>{const st=withAthlete(a.id,()=>({score:wbFilled(todayISO())?+S.fatigue[todayISO()].score:null,reg:(()=>{let n=0,q=0;for(let i=0;i<7;i++){const d=addDays(todayISO(),-i);if(d<PERIOD_START)continue;n++;if(wbFilled(d))q++}return n?Math.round(q/n*100):null})(),alerts:liveAlerts(),todo:todoItems(todayISO()).length,plan:planActive(),progName:(assignmentOf(a.id)?((PL.programs[assignmentOf(a.id).programId]||{}).name||"Programme"):""),pos:S.settings.pos||"",pend:Object.values(S.log).filter(l=>l&&l.durPending).length}));return{id:a.id,name:accountName(a),demo:false,...st}});
  const fake=demoFake().map(c=>({...c,demo:true,todo:0,pend:0}));
  return [...real,...fake];
}
function coachDash(){
  const r=coachRoster();const realR=r.filter(x=>!x.demo);const t=todayISO();
  const filled=realR.filter(x=>x.score!=null).length,al=realR.reduce((a,x)=>a+x.alerts.length,0),todo=realR.reduce((a,x)=>a+x.todo,0),pend=realR.reduce((a,x)=>a+x.pend,0),un=unreadFor("coach");
  let h=ch("Tableau de bord","Espace coach · "+cap(fmtLong(t)),coachIsAlsoAthlete()?`<button class="btn secondary small dash-mytrain" data-act="goMyTraining">${ICONS.home}<span>Mon entraînement</span></button>`:"")+`<div class="stack">`;
  h+=`<div class="kpis coach-kpis"><div><small>Clients</small><b class="num">${realR.length}</b></div><div><small>Ressentis du jour</small><b class="num">${filled}/${realR.length}</b></div><div><small>Alertes</small><b class="num">${al}</b></div><div><small>À renseigner</small><b class="num">${todo}</b></div><div><small>Durées à confirmer</small><b class="num">${pend}</b></div><div><small>Messages non lus</small><b class="num">${un}</b></div></div>`;
  const alerts=realR.flatMap(x=>x.alerts.map(a=>({x,a})));
  h+=`<section class="card"><h3>Alertes</h3>${alerts.length?alerts.map(({x,a})=>`<button class="list-item al-item al-${a.k==="adapt"?"info":a.k==="pain"?"pain":"warn"}" data-cath="${x.id}"><span class="sbar"></span><div class="grow"><b>${esc(x.name)} · ${esc(ALERT_L[a.k])}</b><div class="small muted">${esc(a.t)}</div></div>${ICONS.chevron}</button>`).join(""):`<p class="small muted" style="margin-top:4px">Aucune alerte sur les comptes réels.</p>`}</section>`;
  h+=`<section class="card"><h3>Clients</h3>${r.map(rosterRow).join("")}</section>`;
  return h+`</div>`;
}
function rosterRow(x){const col=v=>v==null?"":v>=75?"ok":v>=45?"mid":"low";
  return `<button class="list-item roster" ${x.demo?`data-coachth="${x.id}"`:`data-cath="${x.id}"`}><span class="avatar" aria-hidden="true">${esc(x.name.split(" ").map(y=>y[0]).join(""))}</span><div class="grow"><b>${esc(x.name)}</b>${x.demo?' <span class="demo-tag">Démo</span>':""}<div class="small muted">${x.demo?"Client fictif (démonstration)":x.plan?esc(x.progName||"Programme actif"):"Programme à préparer"}${x.alerts.length?" · "+x.alerts.length+" alerte"+(x.alerts.length>1?"s":""):""}</div></div><span class="rs ${col(x.score)}" aria-label="Ressenti du jour ${x.score??"non rempli"}">${x.score??"–"}</span><span class="small muted">${x.reg!=null?x.reg+" %":""}</span></button>`}
function coachClients(){const r=coachRoster();
  return ch("Clients")+`<div class="stack"><section class="card">${r.map(rosterRow).join("")}</section><button class="btn secondary full" data-ctab="invites">${ICONS.plus}Inviter un nouveau client</button></div>`}
/* ---------- Fiche individuelle ---------- */
const CATH_SUBS=[["plan","Planification"],["cal","Calendrier"],["ressentis","Ressentis"],["seances","Séances"],["tests","Tests"],["charges","RPE et charges"],["alertes","Alertes et douleurs"],["profil","Profil et questionnaire"],["histo","Historique"]];
function coachAthlete(){
  const a=PL.accounts[CATH];if(!a||a.role!=="athlete"){CTAB="clients";return coachClients()}
  return withAthlete(a.id,()=>{
    let h=ch(accountName(a),"Fiche athlète",`<button class="btn ghost small" data-ctab="clients">${ICONS.back}Clients</button>`)+`<div class="stack">`;
    h+=`<section class="card"><div class="small muted">${esc(a.email||"e-mail non renseigné")} · formule : ${esc(a.formula&&PL.formulas[a.formula]?PL.formulas[a.formula].name:a.formulaRequest&&PL.formulas[a.formulaRequest.k]?PL.formulas[a.formulaRequest.k].name+" (choisie à l'inscription)":"—")} · ${planActive()?"programme actif":"aucun programme actif"}</div>
     <div class="row" style="margin-top:8px"><button class="btn secondary small" data-coachth="${a.id}">${ICONS.msg}Messages privés</button></div></section>`;
    h+=`<div class="seg seg-scroll" role="tablist" aria-label="Fiche">${CATH_SUBS.map(([k,l])=>`<button role="tab" aria-selected="${CATH_SUB===k}" data-cathsub="${k}">${l}</button>`).join("")}</div>`;
    h+=({plan:caPlan,cal:caCal,ressentis:caRessentis,seances:caSeances,tests:caTests,charges:caCharges,alertes:caAlertes,profil:caProfil,histo:caHisto}[CATH_SUB]||caPlan)(a);
    return h+`</div>`;
  });
}
function caPlan(a){const asg=assignmentOf(a.id),hist=assignmentsOf(a.id).filter(x=>x!==asg);let h="";
  if(!asg)h+=`<section class="card stack"><h3>Aucun programme attribué</h3><p class="small">Choisis un programme et une date de démarrage : son calendrier est généré immédiatement.</p>${Object.values(PL.programs).filter(p=>!p.engine&&p.status!=="archived").length?`<div class="stack tight">${Object.values(PL.programs).filter(p=>!p.engine&&p.status!=="archived").map(p=>`<button class="date-pick" data-pe="assign" data-id="${p.id}" data-client="${a.id}"><span class="grow"><b>${esc(p.name)}</b><span class="small muted"> · ${progStats(p).weeks} sem. · ${progStats(p).sessions} séances</span></span>${ICONS.chevron}</button>`).join("")}</div>`:`<button class="btn" data-ctab="programs">Créer un programme</button>`}</section>`;
  else{const P=PL.programs[asg.programId]||{};
    h+=`<section class="card stack"><div class="row between"><h3>${esc(P.name||"Programme")}</h3><span class="chip st-done">${ICONS.check}${esc(ASG_STATUS[asg.status])}</span></div>
     <p class="small">Du ${fmtLong(asg.startDate)} au ${asg.endDate?fmtLong(asg.endDate):"—"}${+asg.startWeek?" · départ semaine "+(+asg.startWeek+1):""}${asg.customized?" · <b>personnalisé</b>":""}</p>
     ${asg.prog.engine?`<p class="small muted">Programme historique : séances recalculées par le moteur selon les matchs réels.</p>`:""}
     <div class="row">${asg.prog.engine?"":`<button class="btn secondary small" data-pe="customize" data-asg="${asg.id}">${ICONS.pencil}Personnaliser son programme</button><button class="btn ghost small" data-pe="calendar" data-asg="${asg.id}">${ICONS.cal}Calendrier généré</button>`}${Object.values(PL.programs).some(p=>!p.engine&&p.status!=="archived")?`<button class="btn ghost small" data-pe="pickProg" data-client="${a.id}">Changer de programme</button>`:""}${asg.prog.engine?"":`<button class="btn ghost small" data-pe="endAsg" data-asg="${asg.id}">Terminer</button>`}</div>
     <details class="fold"><summary>Historique de l'attribution (${asg.history.length})</summary><div class="fold-body"><ul class="clean tiny">${asg.history.slice().reverse().map(x=>`<li>${esc(String(x.at).slice(0,16).replace("T"," "))} · ${esc(x.by)} · ${esc(x.what)}</li>`).join("")}</ul></div></details></section>`;
    h+=WEEKS.map(w=>{const end=w.type==="treve"?PERIOD_END:addDays(w.s,6);const ss=sessions().filter(s=>s.date>=w.s&&s.date<=end);const m=matchList().filter(x=>x.date>=w.s&&x.date<=end);
      return `<details class="fold" ${w===weekOf(todayISO())?"open":""}><summary>${esc(w.n)} · ${fmtShort(w.s)} · ${esc(weekLvlLabel(w))}</summary><div class="fold-body small">${m.length?"Match : "+m.map(x=>fmtShort(x.date)+" "+String(x.time).replace(":","h")).join(", ")+"<br>":""}${ss.map(s=>`${fmtShort(s.date)} : ${esc(tpl(s).name)} — ${esc(STATUS_LABEL[displayStatus(s)])}`).join("<br>")||"Aucune séance"}</div></details>`}).join("")}
  if(hist.length)h+=`<details class="fold"><summary>Programmes précédents (${hist.length})</summary><div class="fold-body"><ul class="clean small">${hist.map(x=>`<li>${esc((PL.programs[x.programId]||{}).name||"Programme")} · ${x.startDate} → ${x.endDate||"—"} · ${esc(ASG_STATUS[x.status]||x.status)}</li>`).join("")}</ul></div></details>`;
  const o=(S.profile||{}).onboarding,iv=(S.profile||{}).interview;
  if(o)h+=`<details class="fold"><summary>Réponses d'inscription</summary><div class="fold-body small">${onboardSummary(o)}</div></details>`;
  if(iv)h+=`<details class="fold"><summary>Informations de l'entretien</summary><div class="fold-body small">${esc([iv.sport,iv.goal,iv.notes].filter(Boolean).join(" · ")||"—")}</div></details>`;
  return h}
function caCal(){const t=todayISO();const from=addDays(t,-14),to=addDays(t,14);const rows=[];
  for(let d=from;d<=to;d=addDays(d,1)){const ss=sessions().filter(s=>s.date===d),cl=clubOn(d).filter(e=>!e.cancelled),ot=otherOn(d);if(!ss.length&&!cl.length&&!ot.length)continue;
    rows.push(`<div class="list-item" style="cursor:default"><span class="datebox"><b class="num">${D(d).getDate()}</b><small>${JOURS_C[D(d).getDay()]}</small></span><div class="grow small">${[...ss.map(s=>"Muscu : "+esc(tpl(s).name)+" ("+esc(STATUS_LABEL[displayStatus(s)])+")"),...cl.map(e=>e.kind==="match"?"Match":"Entraînement club"),...ot.map(o=>"Autre : "+esc(sportOf(o).name))].join("<br>")}</div></div>`)}
  return `<section class="card"><h3>Du ${fmtShort(from)} au ${fmtShort(to)}</h3>${rows.join("")||'<p class="small muted">Rien de prévu.</p>'}</section>`}
function caRessentis(){const ds=Object.keys(S.fatigue).filter(wbFilled).sort().reverse().slice(0,21);
  return `<section class="card"><h3>Questionnaires de ressenti</h3>${ds.length?`<div class="tablewrap"><table><thead><tr><th>Date</th><th>Score</th><th>Sommeil</th><th>Fraîch.</th><th>Courb.</th><th>Stress</th><th>Humeur</th><th>Commentaire</th></tr></thead><tbody>${ds.map(d=>{const f=S.fatigue[d],it=f.items||{};return `<tr><td>${fmtShort(d)}</td><td class="num"><b>${f.score}</b></td>${["sommeil","fraicheur","courbatures","stress","humeur"].map(k=>`<td class="num">${it[k]??"—"}</td>`).join("")}<td>${esc(f.comment||"")}</td></tr>`}).join("")}</tbody></table></div>`:'<p class="small muted">Aucun questionnaire.</p>'}</section>`}
function caSeances(a){const ss=sessions().filter(s=>s.date<=todayISO()).sort((x,y)=>x.date<y.date?1:-1);
  return `<section class="card"><h3>Séances réalisées ou non</h3>${ss.map(s=>{const l=S.log[s.id]||{},st=S.status[s.id]||{};return `<div class="list-item" style="cursor:default;align-items:flex-start"><span class="datebox"><b class="num">${D(s.date).getDate()}</b><small>${JOURS_C[D(s.date).getDay()]}</small></span><div class="grow"><b>${esc(tpl(s).name)}</b> ${statusChip(s)}
    <div class="small muted">${isNum(l.dur)?l.dur+" min":l.durPending?"Durée à confirmer":"—"}${isNum(l.rpe)?" · RPE "+l.rpe:""}${srpe(l)!=null?" · "+srpe(l)+" UA":""}</div>
    ${st.reason?`<div class="small">Raison : ${esc(reasonLabel(st.reason))}${st.reasonOther?" ("+esc(st.reasonOther)+")":""}${st.comment?" · « "+esc(st.comment)+" »":""}</div>`:""}
    ${S.adapt[s.id]&&S.adapt[s.id].mode!=="none"?`<div class="small">Adaptation : ${esc(ADAPT_LABEL[S.adapt[s.id].mode])}${S.adapt[s.id].painZone?" ("+esc(PAIN_ZL(S.adapt[s.id].painZone))+")":""}</div>${S.adapt[s.id].rule?`<div class="tiny muted">${esc(ruleTxt(S.adapt[s.id]))}</div>`:""}<details class="fold mini-fold"><summary>Justification</summary><div class="fold-body">${adaptJustif(S.adapt[s.id])}</div></details>`:""}
    ${(st.s==="done"||st.s==="adapted")?`<button class="btn ghost small" data-cdur="${s.id}" style="margin-top:6px">${ICONS.clock}Corriger la durée</button>`:""}</div></div>`}).join("")||'<p class="small muted">Aucune séance passée.</p>'}</section>`}
function caCharges(){const ws=WEEKS.map(w=>({w,L:weekLoad(w)}));
  return `<section class="card"><h3>RPE et charges par semaine</h3><div class="tablewrap"><table><thead><tr><th>Sem.</th><th>Prévue (UA)</th><th>Réelle (UA)</th><th>Renseignées</th><th>Tonnage</th></tr></thead><tbody>${ws.map(({w,L})=>`<tr><td>${w.n}</td><td class="num">${Math.round(L.planned)}</td><td class="num">${L.real?Math.round(L.real):"—"}</td><td class="num">${L.done}/${L.total}</td><td class="num">${L.ton?L.ton+" kg":"—"}</td></tr>`).join("")}</tbody></table></div>
   <p class="small muted" style="margin-top:8px">Charge sRPE = durée × RPE (cours Quantification, Foster). Ratio aigu/chronique : repère de tendance uniquement.</p></section>`}
function caAlertes(){const al=liveAlerts();const pn=Object.values(S.pain||{}).sort((a,b)=>a.at<b.at?1:-1);
  return `<section class="card"><h3>Alertes (3 derniers jours)</h3>${al.length?al.map(x=>`<p class="small cl-al al-${x.k}"><b>${esc(ALERT_L[x.k])}</b> · ${esc(x.t)}</p>`).join(""):'<p class="small muted">Aucune alerte.</p>'}</section>
  <section class="card"><h3>Douleurs signalées</h3>${pn.length?pn.map(p=>`<p class="small"><b>${fmtShort(p.date)} · ${esc(PAIN_ZL(p.zone))}${p.side&&p.side!=="nr"?" ("+esc(p.side)+")":""}</b> · ${isNum(p.intensity)?p.intensity+"/10":"—"} · ${p.onset==="habituelle"?"habituelle":p.onset==="recente"?"récente":"apparition non précisée"}${p.atRest?" · au repos":""}${p.trigger?" · déclencheur : "+esc(p.trigger):""}${p.comment?" · « "+esc(p.comment)+" »":""}</p>`).join(""):'<p class="small muted">Aucune douleur signalée.</p>'}<p class="tiny muted">Aucun diagnostic n'est posé par l'appli.</p></section>`}
function caHisto(a){const items=[];
  Object.entries(S.log).forEach(([id,l])=>(l&&l.durHist||[]).forEach(x=>items.push({at:x.at,t:"Durée de "+(sessionById(id)?tpl(sessionById(id)).name:id)+" : "+(x.old??"—")+" → "+x.nw+" min ("+x.by+(x.reason?", "+x.reason:"")+")"})));
  Object.entries(S.adapt).forEach(([id,x])=>{if(x&&x.at)items.push({at:x.at,t:"Adaptation acceptée : "+ADAPT_LABEL[x.mode]+" · "+(sessionById(id)?tpl(sessionById(id)).name:id)})});
  Object.entries(S.moves).forEach(([id,d])=>items.push({at:d,t:"Séance déplacée au "+fmtShort(d)+" · "+(sessionById(id)?tpl(sessionById(id)).name:id)}));
  PL.coachLog.filter(x=>x.uid===a.id).forEach(x=>items.push({at:x.at,t:x.what}));
  items.sort((x,y)=>String(x.at)<String(y.at)?1:-1);
  return `<section class="card"><h3>Historique des modifications</h3>${items.length?`<ul class="clean small">${items.map(x=>`<li>${esc(String(x.at).slice(0,10))} · ${esc(x.t)}</li>`).join("")}</ul>`:'<p class="small muted">Aucune modification.</p>'}</section>
   <details class="fold"><summary>Journal des modifications du programme</summary><div class="fold-body stack log">${CHANGES.map(c=>`<div><h3>${esc(c.t)}</h3><p class="small">${esc(c.chg)}</p><p class="tiny muted">${esc(c.src)}</p></div>`).join("")}</div></details>`}
/* Correction de durée par le coach : historique complet + notification à l'athlète */
function openCoachDur(sid){const a=CATH;openId=sid;sheetMode="cdur";
  const info=withAthlete(a,()=>{const s=sessionById(sid),l=S.log[sid]||{};return{name:tpl(s).name,date:s.date,dur:l.dur}});
  openSheet(`<div class="sheet-scroll">`+head(esc(info.name)+" · "+fmtShort(info.date),"Corriger la durée")+`<div class="stack">
   <p class="small">Durée actuelle : <b>${info.dur!=null?info.dur+" min":"à confirmer"}</b></p>${fld("cdNew","Nouvelle durée (min)","number","","1")}
   <div class="field"><label for="cdWhy">Motif (obligatoire)</label><input id="cdWhy" placeholder="Ex. : oubli de terminer, séance de 55 min selon l'athlète"></div>
   <p class="tiny muted">La correction est historisée (ancienne et nouvelle durée, date, coach, motif) et un message est envoyé à l'athlète.</p></div></div>
   <div class="sheet-actions"><button class="btn full" data-act="coachDurSave">Enregistrer la correction</button></div>`,"Corriger la durée")}
function coachDurSave(){const nw=num(val("cdNew"),1,300),why=val("cdWhy").trim();if(nw===""||!why){toast("Indique la nouvelle durée et le motif");return}
  const uid=CATH,sid=openId;let name="";
  writeAthlete(uid,S=>{const l=S.log[sid]||{};name=tpl(sessionById(sid)).name;S.log[sid]={...l,dur:nw,durPending:false,durHist:[...(l.durHist||[]),{old:l.dur??null,nw,at:nowISO(),by:"coach ("+accountName(me())+")",reason:why,notified:true}]}});
  demoSeed();PL.msgs.list.push({id:"m"+Date.now().toString(36),th:uid,from:"coach",text:"J'ai corrigé la durée de ta séance « "+name+" » : "+nw+" min. Motif : "+why+".",at:nowISO(),read:false,auto:true});
  PL.coachLog.unshift({at:nowISO(),by:"coach",uid,what:"Durée corrigée ("+name+") : "+nw+" min · "+why});plSave();closeSheet(false);render();toast("Durée corrigée et athlète prévenu")}
/* ---------- Messagerie coach ---------- */
function coachMsgs(){
  demoSeed();
  if(COACH_TH==="group"){threadOf("group").forEach(m=>m.rk=true);plSave();
    return ch("Groupe","Tous les clients",`<button class="btn ghost small" data-act="coachBack">${ICONS.back}Conversations</button>`)+`<div class="stack">${demoBanner()}<p class="small muted">Un message ici est vu par tous tes clients.</p><section class="card">${bubbles(threadOf("group"),"coach",true)}</section>${composer("Écrire à tous tes clients…",true)}</div>`}
  if(COACH_TH){const nm=nameOf(COACH_TH);threadOf(COACH_TH).forEach(m=>{if(m.from==="client")m.read=true});plSave();
    return ch(nm,"Conversation privée",`<button class="btn ghost small" data-act="coachBack">${ICONS.back}Conversations</button>`)+`<div class="stack">${demoBanner()}<section class="card">${bubbles(threadOf(COACH_TH),"coach")}</section>${composer("Répondre à "+nm.split(" ")[0]+" (privé)…",true)}</div>`}
  const ids=[...athletes().map(a=>a.id),...demoFake().map(c=>c.id)];
  const rows=ids.map(id=>{const th=threadOf(id);const last=th[th.length-1];const un=th.filter(m=>!m.read&&m.from==="client").length;return{id,last,un}}).sort((a,b)=>(b.un-a.un)||((b.last?b.last.at:"")>(a.last?a.last.at:"")?1:-1));
  const gl=threadOf("group"),gLast=gl[gl.length-1],gUn=unreadFor("coach","group");
  return ch("Messagerie")+`<div class="stack">${demoBanner()}<section class="card"><button class="list-item" data-coachth="group"><span class="avatar grp" aria-hidden="true">Gr</span><div class="grow" style="min-width:0"><b>Groupe · tous les clients</b><div class="small muted ellip">${gLast?esc(nameOf(authorOf(gLast)).split(" ")[0])+" : "+esc(gLast.text||"média"):"Aucun message"}</div></div>${gUn?`<span class="dot-n static">${gUn}</span>`:""}</button></section>
   <h2 class="sec-h">Conversations privées</h2><section class="card">${rows.map(({id,last,un})=>`<button class="list-item" data-coachth="${id}"><span class="avatar" aria-hidden="true">${esc(nameOf(id).split(" ").map(x=>x[0]).join(""))}</span><div class="grow" style="min-width:0"><b>${esc(nameOf(id))}</b>${DEMO_FAKE.some(c=>c.id===id)?' <span class="demo-tag">Démo</span>':""}<div class="small muted ellip">${last?(last.from==="coach"?"Toi : ":"")+esc(last.text||"média"):"Aucun message"}</div></div>${un?`<span class="dot-n static">${un}</span>`:""}</button>`).join("")}</section></div>`;
}
/* ---------- Codes d'invitation ---------- */
function coachInvites(){
  const st=i=>i.revokedAt?"révoqué":i.usedAt?"utilisé":i.expiresAt<nowMs()?"expiré":"actif";
  return ch("Invitations")+`<div class="stack"><form class="card stack" id="inviteForm" autocomplete="off"><h3>Préparer un client</h3><p class="small muted">Renseigne ce que tu as vu pendant l'entretien. Le client recevra un code personnel : il vérifiera ces informations, créera son compte et arrivera directement sur son programme, sans questionnaire ni offres.</p>
    <div class="grid2">${fld("ivFirst","Prénom","text","")}${fld("ivLast","Nom","text","")}</div>${fld("ivEmail","E-mail (facultatif)","email","")}
    <div class="grid2">${fld("ivSport","Sport et niveau","text","")}${fld("ivGoal","Objectif principal","text","")}</div>
    <div class="grid2"><div class="field"><label for="ivFormula">Formule</label><select id="ivFormula">${Object.entries(PL.formulas).map(([k,f])=>`<option value="${k}">${esc(f.name)}</option>`).join("")}</select></div><div class="field"><label for="ivDays">Validité du code</label><select id="ivDays"><option value="7">7 jours</option><option value="14" selected>14 jours</option><option value="30">30 jours</option></select></div></div>
    <div class="field"><label for="ivProg">Programme attribué</label><select id="ivProg"><option value="">Aucun pour l'instant (à attribuer plus tard)</option>${Object.values(PL.programs).filter(p=>!p.engine&&p.status!=="archived").map(p=>`<option value="${p.id}">${esc(p.name)} · ${progStats(p).weeks} sem.</option>`).join("")}</select></div>
    <div class="grid2">${fld("ivStart","Date de démarrage","date",addDays(todayISO(),1))}<div class="field"><label for="ivWeek">Bloc ou semaine de départ</label><select id="ivWeek"><option value="0">Semaine 1</option></select></div></div>
    <div class="field"><label for="ivNotes">Notes de l'entretien</label><textarea id="ivNotes"></textarea></div>
    <p class="small" id="ivMsg" role="alert"></p><button class="btn full" type="submit">Générer le code</button></form>
   ${Cloud.isCloud()?srvInviteList():`<section class="card"><h3>Codes</h3>${PL.invites.length?PL.invites.map(i=>`<div class="list-item" style="cursor:default"><div class="grow"><b class="num code">${esc(i.code)}</b><div class="small muted">${esc(((i.draft.first||"")+" "+(i.draft.last||"")).trim()||"—")}${i.draft.programId&&PL.programs[i.draft.programId]?" · "+esc(PL.programs[i.draft.programId].name)+" dès le "+fmtShort(i.draft.startDate):""} · ${st(i)}${st(i)==="actif"?" jusqu'au "+fmtShort(iso(new Date(i.expiresAt))):""}</div></div>${st(i)==="actif"?`<button class="btn ghost small" data-copycode="${esc(i.code)}">Copier</button><button class="btn danger small" data-revoke="${esc(i.code)}">Révoquer</button>`:""}</div>`).join(""):'<p class="small muted">Aucun code.</p>'}</section>`}
   <p class="small muted">Codes uniques (8 caractères), personnels, valables 7 à 30 jours, révocables, utilisables une seule fois ; 5 essais ratés bloquent la saisie 15 min et le même message est affiché quelle que soit l'erreur. En production, ces règles sont appliquées par le serveur.</p></div>`}
/* ---------- Formules ---------- */
function coachFormulas(){
  return ch("Formules")+`<div class="stack"><p class="small muted">Ces informations s'affichent sur la page d'offres. Laisse le prix vide tant qu'il n'est pas fixé : l'appli affichera « Tarif communiqué par le coach ».</p>${Object.entries(PL.formulas).map(([k,f])=>`<section class="card stack"><h3>${esc(f.name)}</h3><div class="grid2">${fld("fp_"+k,"Prix","text",f.price||"")}${fld("fe_"+k,"Engagement","text",f.engagement||"")}</div>
   <label class="row" style="gap:8px"><input type="checkbox" id="fr_${k}" ${f.recommended?"checked":""}> Formule recommandée</label>
   ${k==="coaching"?`<label class="row" style="gap:8px;align-items:flex-start"><input type="checkbox" id="fl_${k}" ${f.placesLimited?"checked":""}> <span>Afficher « places limitées » <span class="small muted">(à cocher seulement si c'est vrai)</span></span></label>${fld("fc_"+k,"Appels ou visios inclus","text",f.callsNote||"")}`:""}</section>`).join("")}<button class="btn full" data-act="saveFormulas">Enregistrer</button></div>`}
/* ---------- Règles d'adaptation (visibles seulement par le coach) ---------- */
let RULE_UID=null;
function coachRules(){
  const ath=athletes();const uid=ath.some(a=>a.id===RULE_UID)?RULE_UID:(ath[0]||{}).id;if(!uid)return ch("Règles d'adaptation")+`<p class="small">Aucun athlète.</p>`+rulesSources();
  return withAthlete(uid,()=>ch("Règles d'adaptation","Seuils appliqués à "+accountName(PL.accounts[uid]))+`<div class="stack"><div class="field"><label for="ruleUid">Athlète</label><select id="ruleUid">${ath.map(a=>`<option value="${a.id}" ${a.id===uid?"selected":""}>${esc(accountName(a))}</option>`).join("")}</select></div><section class="card"><ul class="clean small">
   <li>Questionnaire quotidien : 5 curseurs de 0 à 100 (sommeil, fraîcheur, courbatures, stress, humeur), items du cours Planification. Score = moyenne. Les 4 premiers sont aussi convertis en indice de Hooper (cours Quantification).</li>
   <li>Alerte : après 5 questionnaires, score ≥ ${S.settings.fatDrop} points sous la moyenne des 14 derniers jours ; avant, seuil provisoire de ${S.settings.fatAbs}/100 (hypothèse de départ). Deux items très bas déclenchent aussi l'alerte.</li>
   <li>Courbatures marquées 3 jours de suite (> 72 h) : signe de fatigue (cours Pliométrie). Plusieurs signes : réduction forte du volume ou récupération active proposée (Bompa et Haff, cités dans le cours).</li>
   <li>Séance club « chargée » : au-dessus de la moyenne personnelle + 1 écart-type (n ≥ ${REF_MIN}) ; avant, seuil provisoire RPE ≥ 7.</li>
   <li>FC élevée : moyenne ≥ 85 % de la FC max mesurée ; sans FC max, la FC n'est pas interprétée.</li>
   <li>Indicateurs mécaniques (cours Quantification) : sprints → ischios ; accélérations → fessiers, ischios, mollets, tendon d'Achille ; freinages → quadriceps ; duels et sauts → impacts.</li>
   <li>Autre activité : charge = durée × RPE ; plafond personnel par le ratio 7 jours / habituel : ≤ ${String(S.settings.otZone).replace(".",",")} rien, ≤ ${String(S.settings.otAlert).replace(".",",")} recommandation, au-delà alerte + adaptation proposée (zones ACWR du cours Planification). Monotonie > ${String(S.settings.monoMax).replace(".",",")} et contrainte > ${S.settings.strainMax} : recommandation (Foster).</li>
   <li>Le ratio aigu/chronique est un repère, pas une preuve de cause à effet (Impellizzeri 2020). Aucune séance n'est modifiée sans l'accord de l'athlète.</li></ul></section>
   <section class="card stack"><h3>Seuils</h3><div class="grid2">${fld("sfa","Seuil provisoire (score)","number",S.settings.fatAbs,"1")}${fld("sfd","Baisse vs moyenne (points)","number",S.settings.fatDrop,"1")}${fld("soz","Zone : ratio jusqu'à","number",S.settings.otZone,"0.05")}${fld("soa","Alerte : ratio au-delà de","number",S.settings.otAlert,"0.05")}${fld("smo","Monotonie max","number",S.settings.monoMax,"0.1")}${fld("sst","Contrainte max (UA)","number",S.settings.strainMax,"100")}</div><button class="btn secondary full" data-act="saveFat" data-uid="${uid}">Enregistrer les seuils</button></section>${rulesSources()}</div>`)}
/* Sources des règles et des révisions de volume (détail scientifique réservé au coach) */
function rulesSources(){return `<details class="fold"><summary>Sources des règles du moteur</summary><div class="fold-body stack tight">${Object.keys(RULES).map(ruleJustif).join("")}</div></details>
  <details class="fold"><summary>Revue des volumes v9 : justification détaillée</summary><div class="fold-body stack">${VOLUME_CHANGES.map(v=>`<div><b>${esc(TYPES[v.code].name)}</b><dl class="vc"><dt>Avant</dt><dd>${esc(v.old)}</dd><dt>Après</dt><dd>${esc(v.nw)}</dd><dt>Raison</dt><dd>${esc(v.reason)}</dd><dt>Cours</dt><dd>${v.src.map(id=>esc(srcLabel(id))).join("<br>")}</dd><dt>Règle</dt><dd>${esc(v.rule)}</dd><dt>Interprétation</dt><dd>${esc(v.interp)}</dd><dt>Impact attendu</dt><dd>${esc(v.impact)}</dd></dl></div>`).join("")}</div></details>`}
const ADAPT_RULE={volume:["inSeasonVolume","fatigueRemove"],power:["fatigueRemove"],micro:["condJ2"],upper:["legsJ1"],active:["activeRecovery"],targeted:["fatigueRemove","otherSportsLoad"],rest:["fatigueRemove"]};
function adaptJustif(ad){return `${(ad.reasons||[]).length?`<p class="small"><b>Explication donnée à l'athlète :</b> ${esc(ad.reasons.join(" "))}</p>`:""}${(ad.trig||[]).length?`<p class="tiny">Données : ${esc(ad.trig.join(" · "))}</p>`:""}${(ADAPT_RULE[ad.mode]||[]).map(ruleJustif).join("")}`}
function coachLog(){return ch("Journal")+`<div class="stack"><section class="card">${PL.coachLog.length?`<ul class="clean small">${PL.coachLog.map(x=>`<li>${esc(String(x.at).slice(0,16).replace("T"," "))} · ${esc(x.what)}</li>`).join("")}</ul>`:'<p class="small muted">Aucune action enregistrée.</p>'}</section>
  <section class="card"><h3>Migrations</h3><ul class="clean small">${(PL.meta.migrations||[]).map(m=>`<li>${esc(String(m.from))} → ${esc(String(m.to))} (${esc(String(m.at).slice(0,10))}) : ${esc((m.notes||[]).join(" ; "))}</li>`).join("")||"<li>Aucune</li>"}</ul></section></div>`}

