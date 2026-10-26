/* =====================================================================
   MODULE 22 · MOTIVATION : courbe ressenti / charge, badges d'assiduité,
   récompenses, félicitations de progression, bilan de la semaine.
   Principes (Saw et al. 2015 ; Ryan & Deci 2000) : retour immédiat et visible sur ses données,
   sentiment de progresser, aucun questionnaire supplémentaire.
   ===================================================================== */
const wbFilled=d=>!!(S.fatigue[d]&&isNum(S.fatigue[d].score));
const isDone=s=>{const st=statusOf(s);return st==="done"||st==="adapted"};
/* Meilleure série de questionnaires (jours consécutifs remplis) */
function qStats(){return memo("qStats",()=>{
  const t=todayISO();let best=0,cur=0,total=0;
  for(let d=PERIOD_START;d<=t;d=addDays(d,1)){if(wbFilled(d)){cur++;total++;best=Math.max(best,cur)}else if(d<t)cur=0}
  return{best,cur,total};
})}
function sStats(){return memo("sStats",()=>{
  const t=todayISO();let total=0,cur=0,best=0;
  sessions().filter(s=>s.date<=t&&!isOpt(s)).forEach(s=>{const st=statusOf(s);if(st==="done"||st==="adapted"){total++;cur++;best=Math.max(best,cur)}else if(st==="missed")cur=0});
  return{total,best};
})}
/* Semaine parfaite : toutes les séances prévues faites + au moins 6 questionnaires sur 7 (semaine terminée) */
function weekStatus(w){
  const end=w.type==="treve"?PERIOD_END:addDays(w.s,6),t=todayISO();
  const ss=sessions().filter(s=>s.date>=w.s&&s.date<=end&&!isOpt(s));const done=ss.filter(isDone).length;
  let q=0,days=0;for(let d=w.s;d<=end&&d<=t;d=addDays(d,1)){days++;if(wbFilled(d))q++}
  return{w,end,planned:ss.length,done,q,days,over:end<t,perfect:end<t&&ss.length>0&&done===ss.length&&q>=Math.min(6,days)};
}
const BADGES=[
 {id:"q3",p:()=>[qStats().best,3],g:"q",n:"Bien lancé",d:"3 ressentis d'affilée",ok:()=>qStats().best>=3},
 {id:"q7",p:()=>[qStats().best,7],g:"q",n:"Semaine à l'écoute",d:"7 ressentis d'affilée",ok:()=>qStats().best>=7},
 {id:"q14",p:()=>[qStats().best,14],g:"q",n:"Deux semaines sans trou",d:"14 ressentis d'affilée",ok:()=>qStats().best>=14},
 {id:"q30",p:()=>[qStats().best,30],g:"q",n:"Un mois à l'écoute",d:"30 ressentis d'affilée",ok:()=>qStats().best>=30},
 {id:"qt25",p:()=>[qStats().total,25],g:"q",n:"25 ressentis",d:"25 questionnaires remplis",ok:()=>qStats().total>=25},
 {id:"qt50",p:()=>[qStats().total,50],g:"q",n:"50 ressentis",d:"50 questionnaires remplis",ok:()=>qStats().total>=50},
 {id:"s1",p:()=>[sStats().total,1],g:"s",n:"C'est parti",d:"1re séance validée",ok:()=>sStats().total>=1},
 {id:"s5",p:()=>[sStats().total,5],g:"s",n:"5 séances",d:"5 séances validées",ok:()=>sStats().total>=5},
 {id:"s10",p:()=>[sStats().total,10],g:"s",n:"10 séances",d:"10 séances validées",ok:()=>sStats().total>=10},
 {id:"s20",p:()=>[sStats().total,20],g:"s",n:"20 séances",d:"20 séances validées",ok:()=>sStats().total>=20},
 {id:"s30",p:()=>[sStats().total,30],g:"s",n:"30 séances",d:"30 séances validées",ok:()=>sStats().total>=30},
 {id:"st5",p:()=>[sStats().best,5],g:"s",n:"Série de 5",d:"5 séances d'affilée sans en rater",ok:()=>sStats().best>=5},
 {id:"st10",p:()=>[sStats().best,10],g:"s",n:"Série de 10",d:"10 séances d'affilée sans en rater",ok:()=>sStats().best>=10},
 {id:"w1",p:()=>[WEEKS.filter(w=>weekStatus(w).perfect).length,1],g:"w",n:"Semaine parfaite",d:"Toutes les séances + 6 ressentis sur 7",ok:()=>WEEKS.some(w=>weekStatus(w).perfect)},
 {id:"w3",p:()=>[WEEKS.filter(w=>weekStatus(w).perfect).length,3],g:"w",n:"Triple parfait",d:"3 semaines parfaites",ok:()=>WEEKS.filter(w=>weekStatus(w).perfect).length>=3}
];
/* Récompenses à utiliser (visibles, à cocher quand utilisées) */
function earnedRewards(){
  const out=[];
  WEEKS.forEach(w=>{if(weekStatus(w).perfect)out.push({id:"meal-"+w.n,label:"Récompense au choix",why:"Semaine parfaite "+w.n})});
  const q=qStats().best;for(let k=14;k<=q;k+=14)out.push({id:"sweet-"+k,label:"Moment détente",why:k+" ressentis d'affilée"});
  return out;
}
/* ---------- File de célébrations (affichées une par une, après les autres fenêtres) ---------- */
const CELEB=[];
function celebrate(c){CELEB.push(c);if(!DLG)setTimeout(showNextCeleb,250)}
function showNextCeleb(){
  if(DLG||!CELEB.length)return;if(!CUR_UID||isCoachAccount()||inAuthFlow()){CELEB.length=0;return}const c=CELEB.shift();
  const pct=c.before&&c.after?Math.round((c.after/c.before-1)*1000)/10:null;
  const bars=c.before!=null&&c.after!=null?`<div class="cel-ba"><div><small>Avant</small><span class="cel-bar"><i style="width:${Math.round(c.before/Math.max(c.before,c.after)*100)}%"></i></span><b>${esc(c.fmt?c.fmt(c.before):fmt(c.before))}</b></div><div><small>Après</small><span class="cel-bar"><i style="width:100%"></i></span><b>${esc(c.fmt?c.fmt(c.after):fmt(c.after))}</b></div></div>`:"";
  $("#layer").innerHTML=`<div class="done-wrap" data-act="celNextBg"><div class="done-card" role="dialog" aria-modal="true" aria-labelledby="celT" aria-describedby="celD">
   <div class="done-badge" aria-hidden="true">${c.kind==="reward"?ICON_GIFT:c.kind==="badge"?ICON_MEDAL:ICON_UP}</div>
   <p class="cel-kicker">${esc(c.kicker||"")}</p><h2 id="celT">${esc(c.title)}</h2>
   ${pct!=null?`<div class="cel-pct num">+${String(pct).replace(".",",")} %</div>`:""}${bars}
   <p id="celD">${esc(c.text||"")}</p>
   ${c.bid?`<button class="btn full" data-act="seeBadge" data-bid="${c.bid}">Voir mon badge</button>`:""}
   <button class="btn ${c.bid?"secondary":""} full" data-act="celNext" ${c.bid?"":"data-autofocus"}>${CELEB.length?"Suivant":"Continuer"}</button></div></div>`;
  DLG={opener:null,sel:null,kind:"celeb"};document.body.style.overflow="hidden";const b=$("#layer [data-autofocus]");b&&b.focus({preventScroll:true});
}
const ICON_MEDAL=`<svg viewBox="0 0 64 64"><circle cx="32" cy="38" r="14" fill="none" stroke="#fff" stroke-width="5"/><path d="M22 8l10 16 10-16" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>`;
const ICON_GIFT=`<svg viewBox="0 0 64 64"><rect x="12" y="26" width="40" height="28" rx="3" fill="none" stroke="#fff" stroke-width="5"/><path d="M8 20h48v8H8zM32 20v34M32 20c-6-10-16-8-12-1M32 20c6-10 16-8 12-1" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>`;
const ICON_UP=`<svg viewBox="0 0 64 64"><path d="M12 46l14-14 9 9 17-19M38 22h14v14" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const MOTIV=["Le travail paie : continue sur cette lancée.","Chaque kilo gagné se retrouvera sur le terrain.","Régulier et patient : c'est comme ça qu'on progresse.","Belle progression. Récupère bien pour la suite.","Tu deviens plus fort semaine après semaine."];
const motiv=()=>MOTIV[Math.floor(Math.random()*MOTIV.length)];

/* Nouveaux badges et récompenses : vérifiés après chaque enregistrement */
function checkAwards(){
  const t=todayISO();let any=false;
  // Badge obtenu pendant que l'appli est ouverte : pop-up une seule fois. Obtenu « en arrière-plan » (au chargement) : bannière sur l'accueil.
  const live=STORE.live===true;S.meta.badgeSeen=S.meta.badgeSeen||{};
  BADGES.forEach(b=>{if(!S.awards[b.id]&&b.ok()){S.awards[b.id]=t;any=true;if(live){S.meta.badgeSeen[b.id]=true;celebrate({kind:"badge",kicker:"Badge débloqué",title:b.n,text:b.d+". "+motiv(),bid:b.id})}}});
  Object.values(S.rewards).forEach(r=>{if(/cheat|Repas plaisir/i.test(r.label||""))r.label="Récompense au choix";if(/Écart sucré/.test(r.label||""))r.label="Moment détente"});
  earnedRewards().forEach(r=>{if(!S.rewards[r.id]){S.rewards[r.id]={label:r.label,why:r.why,earned:t,used:null};any=true;if(live)celebrate({kind:"reward",kicker:"Récompense débloquée",title:r.label,text:r.why+" : tu l'as bien mérité. Tu la retrouves dans Suivi › Badges."})}});
  if(any)save();
}
/* Progression de charge confirmée (bouton « Réussi » dans la séance) */
function celebrateLoad(lift,before,after){
  if(!(before>0&&after>before))return;
  celebrate({kind:"up",kicker:"Charge en hausse",title:LIFT_NAME[lift],before,after,fmt:x=>fmt(x)+" kg",text:"Tu passes de "+fmt(before)+" à "+fmt(after)+" kg. "+motiv()});
}
/* Nouveau test : 1RM estimés comparés au test précédent */
function celebrateTests(prev){
  const now=oneRMs();
  [["squat","Squat"],["bench","Développé couché"],["dl","Soulevé de terre"],["pull","Tractions lestées"],["rdl","Soulevé de terre roumain"]].forEach(([k,l])=>{
    if(isNum(prev[k])&&isNum(now[k])&&now[k]>prev[k]+.4)celebrate({kind:"up",kicker:"Nouveau record (1RM estimé)",title:l,before:Math.round(prev[k]*2)/2,after:Math.round(now[k]*2)/2,fmt:x=>fmt(x)+" kg",text:"Ton 1RM estimé passe de "+fmt(Math.round(prev[k]*2)/2)+" à "+fmt(Math.round(now[k]*2)/2)+" kg. "+motiv()})});
  if(isNum(prev.cmj)&&isNum(now.cmj)&&now.cmj>prev.cmj)celebrate({kind:"up",kicker:"Nouveau record",title:"CMJ",before:prev.cmj,after:now.cmj,fmt:x=>fmt(x)+" cm",text:"Tu sautes plus haut : "+fmt(prev.cmj)+" → "+fmt(now.cmj)+" cm. "+motiv()});
}
/* Volume (tonnage) de la semaine : félicitation la 1re fois qu'il dépasse celui de la semaine précédente */
function weekTon(w){const end=w.type==="treve"?PERIOD_END:addDays(w.s,6);let t=0;sessions().filter(s=>s.date>=w.s&&s.date<=end&&isDone(s)).forEach(s=>t+=+((S.log[s.id]||{}).ton)||0);return Math.round(t)}
function celebrateVolume(date){
  const w=weekOf(date);if(!w)return;const i=WEEKS.indexOf(w);if(i<1)return;const prevW=WEEKS[i-1];
  const now=weekTon(w),prev=weekTon(prevW);S.meta.volCeleb=S.meta.volCeleb||{};
  if(prev>0&&now>prev&&!S.meta.volCeleb[w.n]){S.meta.volCeleb[w.n]=true;save();celebrate({kind:"up",kicker:"Volume en hausse",title:"Tonnage de la semaine",before:prev,after:now,fmt:x=>Math.round(x).toLocaleString("fr-FR")+" kg",text:"Tu as déjà soulevé plus que toute la semaine dernière. "+motiv()})}
}

/* ---------- Courbe : ressenti et charge sur 28 jours ---------- */
function curveSvg(end,days=28){
  const W=340,H=170,pl=30,pr=30,pt=12,pb=24,iw=W-pl-pr,ih=H-pt-pb;const pts=[];
  for(let i=days-1;i>=0;i--){const d=addDays(end,-i);if(d<PERIOD_START)continue;let ld=0;realEntries().filter(r=>r.date===d).forEach(r=>ld+=r.srpe);pts.push({d,ld,wb:wbFilled(d)?+S.fatigue[d].score:null})}
  if(!pts.length)return "";const n=pts.length,bw=iw/n,maxL=Math.max(400,...pts.map(p=>p.ld));
  const x=i=>pl+i*bw+bw/2,yL=v=>pt+ih-v/maxL*ih,yW=v=>pt+ih-v/100*ih;
  const bars=pts.map((p,i)=>p.ld?`<rect x="${(x(i)-bw*.35).toFixed(1)}" y="${yL(p.ld).toFixed(1)}" width="${(bw*.7).toFixed(1)}" height="${(pt+ih-yL(p.ld)).toFixed(1)}" rx="2" class="cv-bar"/>`:"").join("");
  let path="",seg=false;pts.forEach((p,i)=>{if(p.wb==null){seg=false;return}path+=(seg?"L":"M")+x(i).toFixed(1)+" "+yW(p.wb).toFixed(1);seg=true});
  const dots=pts.map((p,i)=>p.wb!=null?`<circle cx="${x(i).toFixed(1)}" cy="${yW(p.wb).toFixed(1)}" r="2.6" class="cv-dot"/>`:"").join("");
  const ticks=pts.map((p,i)=>(i%7===0||i===n-1)?`<text x="${x(i).toFixed(1)}" y="${H-6}" class="cv-t" text-anchor="middle">${D(p.d).getDate()}/${D(p.d).getMonth()+1}</text>`:"").join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="curve" role="img" aria-label="Charge quotidienne (barres) et ressenti (ligne) sur ${n} jours">
   <line x1="${pl}" y1="${pt+ih}" x2="${W-pr}" y2="${pt+ih}" class="cv-axis"/>
   <text x="${pl-4}" y="${pt+8}" class="cv-t" text-anchor="end">${maxL}</text><text x="${pl-4}" y="${pt+ih}" class="cv-t" text-anchor="end">0</text>
   <text x="${W-pr+4}" y="${pt+8}" class="cv-t cv-tw">100</text><text x="${W-pr+4}" y="${pt+ih}" class="cv-t cv-tw">0</text>
   ${bars}<path d="${path}" class="cv-line"/>${dots}${ticks}</svg>`;
}
/* Lecture simple de la courbe : ressenti du lendemain après une grosse journée vs les autres jours */
function curveInsight(end){
  const rs=[];for(let i=27;i>=1;i--){const d=addDays(end,-i);if(d<PERIOD_START)continue;let ld=0;realEntries().filter(r=>r.date===d).forEach(r=>ld+=r.srpe);const nx=addDays(d,1);if(wbFilled(nx))rs.push({ld,wb:+S.fatigue[nx].score})}
  if(rs.length<6)return "Remplis ton ressenti et ta charge quelques jours de plus : l'appli te montrera comment ton corps réagit après les grosses journées.";
  const m=rs.reduce((a,r)=>a+r.ld,0)/rs.length;const hi=rs.filter(r=>r.ld>m),lo=rs.filter(r=>r.ld<=m);
  if(!hi.length||!lo.length)return "";const a=Math.round(hi.reduce((s,r)=>s+r.wb,0)/hi.length),b=Math.round(lo.reduce((s,r)=>s+r.wb,0)/lo.length);
  return a<b-3?`Le lendemain de tes grosses journées, ton ressenti moyen est de ${a}/100, contre ${b}/100 les autres jours : la récupération compte.`:`Ton ressenti reste stable après tes grosses journées (${a}/100 contre ${b}/100) : tu encaisses bien la charge.`;
}
function curveCard(t){
  return `<section class="card" aria-labelledby="cvH"><div class="row between"><h3 id="cvH">Ressenti et charge</h3><span class="chip neutral">28 jours</span></div>
   ${curveSvg(t)}<div class="cv-leg small"><span><i class="lg-bar"></i>Charge du jour (UA)</span><span><i class="lg-line"></i>Ressenti (/100)</span></div>
   <p class="small" style="margin-top:6px">${esc(curveInsight(t))}</p>${perfMini()}</section>`;
}
function perfMini(){
  const ts=[...S.tests].filter(x=>x.squat3||x.bench3||x.dl3).sort((a,b)=>a.date<b.date?-1:1);if(!ts.length)return "";
  const row=(k,l)=>{const v=ts.filter(x=>isNum(x[k+"3"])).map(x=>({d:x.date,v:Math.round(brz(+x[k+"3"],3)*2)/2}));if(!v.length)return "";const a=v[0],b=v[v.length-1];
    return `<tr><td>${l}</td><td class="num">${v.map(p=>fmt(p.v)).join(" → ")} kg</td><td class="num">${v.length>1&&b.v>a.v?"+"+String(Math.round((b.v/a.v-1)*1000)/10).replace(".",",")+" %":"—"}</td></tr>`};
  return `<div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Performances (1RM estimé)</th><th></th><th>Progrès</th></tr></thead><tbody>${row("squat","Squat")}${row("bench","Couché")}${row("dl","Terre")}</tbody></table></div><p class="tiny muted">Prochain test prévu le 16/12.</p>`;
}

/* ---------- Salle des badges (onglet) : floutés tant qu'ils ne sont pas obtenus, en couleur ensuite ---------- */
const BADGE_GRP={q:{l:"Assiduité au questionnaire",c1:"#18B57A",c2:"#0B7A55",ico:'<path d="M14 33h9l4-9 6 18 4-9h9" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'},
 s:{l:"Assiduité aux séances",c1:"#5B6CFF",c2:"#2F3BB8",ico:'<path d="M16 32h32M20 25v14M44 25v14M14 28v8M50 28v8" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>'},
 w:{l:"Semaines parfaites",c1:"#F5B82E",c2:"#C47A06",ico:'<path d="M32 19l4 8.5 9.3 1.2-6.8 6.4 1.7 9.2L32 39.8 23.8 44.3l1.7-9.2-6.8-6.4 9.3-1.2z" fill="#fff"/>'}};
function medalSvg(b){const g=BADGE_GRP[b.g];return `<svg viewBox="0 0 64 72" aria-hidden="true"><defs><linearGradient id="mg-${b.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.c1}"/><stop offset="1" stop-color="${g.c2}"/></linearGradient></defs>
  <path d="M20 2h10l6 14H26zM34 2h10l-6 14h-10z" fill="${g.c2}" opacity=".85"/><circle cx="32" cy="40" r="25" fill="url(#mg-${b.id})"/><circle cx="32" cy="40" r="20" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/><g transform="translate(0,8)">${g.ico}</g></svg>`}
function viewBadges(){
  const got=BADGES.filter(b=>S.awards[b.id]).length;const rw=Object.entries(S.rewards).map(([id,r])=>({id,...r}));
  let h=`<header class="top"><div><div class="eyebrow">Ta régularité récompensée</div><h1>Salle des badges</h1></div><div class="streak"><b class="num">${got}</b><span>/ ${BADGES.length}</span></div></header><div class="stack">`;
  h+=`<section class="card"><div class="bd-prog" role="img" aria-label="${got} badges sur ${BADGES.length}"><i style="width:${Math.round(got/BADGES.length*100)}%"></i></div>
   <p class="small" style="margin-top:8px">Série en cours : <b>${qStats().cur}</b> ressenti${qStats().cur>1?"s":""} d'affilée · <b>${sStats().total}</b> séance${sStats().total>1?"s":""} validée${sStats().total>1?"s":""}.</p></section>`;
  h+=`<section class="card" aria-labelledby="rwH"><h3 id="rwH">Récompenses</h3>${rw.length?`<div class="stack tight" style="margin-top:8px">${rw.map(r=>`<div class="reward ${r.used?"used":""}"><span class="grow"><b>${esc(r.label)}</b><br><span class="tiny muted">${esc(r.why)}${r.used?" · utilisée le "+fmtShort(r.used):""}</span></span>${r.used?`<span class="chip done">✓ Utilisée</span>`:`<button class="btn small" data-rewarduse="${r.id}">Utiliser</button>`}</div>`).join("")}</div>`:""}
   <p class="small ${rw.length?"muted":""}" style="margin-top:8px"><b>Une récompense au choix</b> pour chaque semaine parfaite (toutes tes séances + 6 ressentis sur 7) : récupération, activité plaisir, nouvel équipement, moment détente ou petit plaisir gourmand, sucré ou salé. <b>Un moment détente</b> tous les 14 ressentis d'affilée.</p></section>`;
  Object.entries(BADGE_GRP).forEach(([g,G])=>{
    h+=`<section aria-labelledby="bg-${g}"><h2 class="bd-h" id="bg-${g}">${G.l}</h2><div class="bd-grid">`+BADGES.filter(b=>b.g===g).map(b=>{const on=!!S.awards[b.id];const [c,tg]=b.p();const pc=Math.min(100,Math.round(c/tg*100));
      return `<div class="bd ${on?"on":"off"}" role="img" aria-label="${esc(b.n)} : ${esc(b.d)}. ${on?"Obtenu le "+fmtShort(S.awards[b.id]):"Pas encore obtenu, "+Math.min(c,tg)+" sur "+tg}"><div class="bd-medal">${medalSvg(b)}</div>
       <b class="bd-n">${esc(b.n)}</b><small>${esc(b.d)}</small>${on?`<span class="bd-date">Obtenu le ${fmtShort(S.awards[b.id])}</span>`:`<span class="bd-bar"><i style="width:${pc}%"></i></span><span class="bd-date">${Math.min(c,tg)} / ${tg}</span>`}</div>`}).join("")+`</div></section>`});
  return h+`</div>`;
}
/* ---------- Bilan de la semaine ---------- */
function weekReport(w){
  const ws=weekStatus(w),end=ws.end,t=todayISO();
  let real=0,foot=0,footN=0,oth=0;realEntries().filter(r=>r.date>=w.s&&r.date<=end).forEach(r=>{real+=r.srpe;if(r.kind==="training"||r.kind==="match"){foot+=r.srpe;footN++}if(r.kind==="autre")oth++});
  const wbs=[];for(let d=w.s;d<=end&&d<=t;d=addDays(d,1))if(wbFilled(d))wbs.push(+S.fatigue[d].score);
  const avg=wbs.length?Math.round(wbs.reduce((a,b)=>a+b,0)/wbs.length):null;
  const ton=weekTon(w),i=WEEKS.indexOf(w),pton=i>0?weekTon(WEEKS[i-1]):0;
  const ch=chronicInfo(addDays(end,1));const ratio=ch.weekly?real/ch.weekly:null;
  const newB=BADGES.filter(b=>S.awards[b.id]&&S.awards[b.id]>=w.s&&S.awards[b.id]<=end);
  const adapted=sessions().filter(s=>s.date>=w.s&&s.date<=end&&statusOf(s)==="adapted").length;
  const msg=ws.perfect?"Semaine parfaite : tu as tout fait. Profite de ta récompense.":ws.done===ws.planned&&ws.planned?"Toutes tes séances sont faites. Pense au ressenti chaque matin pour une semaine parfaite.":ws.done?"Chaque séance compte. Garde le rythme la semaine prochaine.":"Nouvelle semaine, nouveau départ : une séance à la fois.";
  return `<div class="stack tight">
   <div class="wr-grid">
    <div><small>Séances</small><b class="num">${ws.done}/${ws.planned}</b>${adapted?`<span class="tiny muted">dont ${adapted} adaptée${adapted>1?"s":""}</span>`:""}</div>
    <div><small>Ressentis</small><b class="num">${ws.q}/${ws.days}</b>${avg!=null?`<span class="tiny muted">moyenne ${avg}/100</span>`:""}</div>
    <div><small>Charge</small><b class="num">${Math.round(real)} UA</b>${ratio!=null?`<span class="tiny muted">${Math.round(ratio*100)} % de l'habituel</span>`:""}</div>
    <div><small>Volume muscu</small><b class="num">${ton.toLocaleString("fr-FR")} kg</b>${pton?`<span class="tiny muted">${ton>=pton?"+":""}${Math.round((ton/pton-1)*100)} % vs sem. préc.</span>`:""}</div>
   </div>
   <p class="small">${footN} séance${footN>1?"s":""} de foot renseignée${footN>1?"s":""} (${Math.round(foot)} UA)${oth?` · ${oth} autre${oth>1?"s":""} activité${oth>1?"s":""}`:""}${newB.length?` · badge${newB.length>1?"s":""} : ${newB.map(b=>b.n).join(", ")}`:""}.</p>
   <p class="small"><b>${esc(msg)}</b></p></div>`;
}
function weekReportCard(t){
  const w=weekOf(t);if(!w)return "";const dow=D(t).getDay();
  // Dimanche : bilan de la semaine en cours ; lundi : bilan de la semaine qui vient de finir
  let target=null;if(dow===0)target=w;else if(dow===1){const i=WEEKS.indexOf(w);if(i>0)target=WEEKS[i-1]}
  if(!target)return "";
  return `<section class="card wr" aria-labelledby="wrH"><div class="row between"><h3 id="wrH">Bilan de ta semaine</h3><span class="chip">${esc(target.n)}</span></div>${weekReport(target)}</section>`;
}
function weekReportsFold(t){
  const ws=WEEKS.filter(w=>w.s<=t).reverse();if(!ws.length)return "";
  return `<details class="fold" open><summary>Bilans des semaines</summary><div class="fold-body stack">${ws.slice(0,4).map(w=>`<section><h3 style="font-size:15px">${esc(w.n)} · du ${fmtShort(w.s)} au ${fmtShort(w.type==="treve"?PERIOD_END:addDays(w.s,6))}</h3>${weekReport(w)}</section>`).join("")}</div></details>`;
}

/* ---------- Aperçu en pastilles (accueil, sous le ressenti) ---------- */
function ringTile(o){
  const R=26,C=2*Math.PI*R,v=o.pct==null?0:Math.max(0,Math.min(100,o.pct));
  return `<button type="button" class="gl-tile" ${o.attr} aria-label="${esc(o.label)} : ${esc(o.aria)}">
   <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" class="gl-bg" style="stroke:${o.soft}"/>${o.pct!=null?`<circle cx="32" cy="32" r="${R}" class="gl-fg" style="stroke:${o.color};stroke-dasharray:${(C*v/100).toFixed(1)} ${C.toFixed(1)}"/>`:""}</svg>
   <b class="num">${esc(o.value)}</b><span>${esc(o.label)}</span>${o.sub?`<small class="gl-sub">${esc(o.sub)}</small>`:""}</button>`;
}
function glanceTiles(t){
  const f=S.fatigue[t],sc=f&&isNum(f.score)?+f.score:null;
  // Régularité : questionnaires remplis sur les 7 derniers jours (dans le programme)
  let n=0,q=0;for(let i=0;i<7;i++){const d=addDays(t,-i);if(d<PERIOD_START)continue;n++;if(wbFilled(d))q++}
  const reg=n?Math.round(q/n*100):null;
  // Tendance : moyenne du ressenti sur 7 jours, comparée aux 7 jours d'avant
  const avg=(a,b)=>{const v=[];for(let i=a;i<b;i++){const d=addDays(t,-i);if(wbFilled(d))v.push(+S.fatigue[d].score)}return v.length?Math.round(v.reduce((x,y)=>x+y,0)/v.length):null};
  const m7=avg(0,7),m14=avg(7,14);const tr=m7!=null&&m14!=null?m7-m14:null;
  const col=v=>v==null?"var(--muted)":v>=75?"var(--done)":v>=60?"var(--accent)":v>=45?"var(--warn)":"var(--missed)";
  const nb=nextBadge(t);
  return `<section class="gl-row" aria-label="Ton ressenti en un coup d'œil">
   ${ringTile({label:"Ressenti",value:sc!=null?String(sc):"–",pct:sc,color:col(sc),soft:"var(--accent-soft)",attr:sc!=null?'data-goto="suivi:ressenti"':'data-act="openWellness"',aria:sc!=null?sc+" sur 100 aujourd'hui, "+wbLabel(sc):"pas encore rempli aujourd'hui"})}
   ${ringTile({label:"Régularité",value:reg!=null?reg+"%":"–",pct:reg,color:"var(--done)",soft:"var(--done-soft)",attr:'data-goto="suivi:progres"',aria:reg!=null?q+" questionnaires sur "+n+" jours":"pas encore de données"})}
   ${ringTile({label:"Moy. 7 j",value:m7!=null?String(m7)+(tr!=null&&tr!==0?(tr>0?" ↑":" ↓"):""):"–",pct:m7,color:col(m7),soft:"var(--missed-soft)",attr:'data-goto="suivi:progres"',aria:m7!=null?m7+" sur 100 en moyenne sur 7 jours"+(tr!=null?(tr>0?", en hausse de ":tr<0?", en baisse de ":", stable")+(tr?Math.abs(tr)+" points":""):""):"pas encore de données"})}
   ${ringTile({label:"Prochain badge",sub:nb?nb.b.n:"",value:nb?(nb.days<=0?"Auj.":nb.days===1?"Demain":nb.days+" j"):"✓",pct:nb?nb.pct:100,color:"#F5B82E",soft:"#FBEFD2",attr:'data-goto="suivi:badges"',aria:nb?"« "+nb.b.n+" » "+(nb.days<=0?"aujourd'hui":nb.days===1?"demain":"dans "+nb.days+" jours")+" si tu restes régulier, le "+fmtShort(nb.date):"tous les badges sont obtenus"})}
  </section>`;
}

/* Prochain badge : celui qui sera atteint le plus tôt si l'athlète reste régulier (ressenti chaque jour, séances prévues faites) */
function nextBadge(t){
  const up=sessions().filter(s=>s.date>=t&&!isOpt(s)&&!isDone(s)&&statusOf(s)!=="missed");
  const todayQ=wbFilled(t)?1:0;
  const byDays=rem=>addDays(t,Math.max(0,rem-1+todayQ));        // 1 questionnaire par jour, aujourd'hui compris s'il n'est pas rempli
  const bySess=rem=>up[rem-1]?up[rem-1].date:null;               // n-ième séance à venir
  const curStreak=(()=>{let n=0;sessions().filter(s=>s.date<=t&&!isOpt(s)).forEach(s=>{const st=statusOf(s);if(st==="done"||st==="adapted")n++;else if(st==="missed")n=0});return n})();
  const cand=[];
  BADGES.forEach(b=>{if(S.awards[b.id])return;const [c,tg]=b.p();let date=null;
    if(b.id.startsWith("qt"))date=byDays(tg-qStats().total);
    else if(b.g==="q")date=byDays(tg-qStats().cur);
    else if(b.id.startsWith("st"))date=bySess(tg-curStreak);
    else if(b.g==="s")date=bySess(tg-sStats().total);
    else if(b.g==="w"){const w=weekOf(t);if(w){const i=WEEKS.indexOf(w);const rem=tg-c;const wk=WEEKS[i+rem-1];if(wk){const ws=weekStatus(w);const possible=ws.done+up.filter(s=>s.date<=ws.end).length>=ws.planned;if(possible||rem>1)date=addDays(wk.type==="treve"?PERIOD_END:addDays(wk.s,6),1)}}}
    if(date&&date<=addDays(PERIOD_END,1))cand.push({b,date,days:diff(t,date),pct:Math.round(Math.min(c,tg)/tg*100)})});
  cand.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:b.pct-a.pct);
  return cand[0]||null;
}

