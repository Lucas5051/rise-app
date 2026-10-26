/* =====================================================================
   MODULE 7 · QUANTIFICATION DE LA CHARGE
   Charge interne sRPE = durée réelle (min) × RPE (0-10), noté environ 30 min après (Foster, cours Quantification).
   Séparé : prévue / réelle · interne (sRPE) / externe (FC, tonnage) / mécanique estimée (indicateurs manuels).
   Ne sont jamais comptées dans la charge réelle : séances non réalisées, annulées, fatigue, non renseignées.
   ===================================================================== */
const RPE_LABELS=["Repos","Très, très facile","Facile","Modéré","Un peu difficile","Difficile","Difficile +","Très difficile","Très difficile +","Presque maximal","Maximal"];
const FLAGS=[["sprints","Beaucoup de sprints courts"],["accel","Beaucoup d'accélérations"],["cod","Beaucoup de freinages ou changements de direction"],["duels","Beaucoup de duels ou contacts"],["sauts","Beaucoup de sauts"],["lourdes","Jambes lourdes"],["douleur","Douleur inhabituelle"]];
const FLAG_LABEL=Object.fromEntries(FLAGS);
const srpe=a=>a&&isNum(a.dur)&&isNum(a.rpe)?Math.round(+a.dur*+a.rpe):null;
const plannedLoadOfSession=s=>{const T=tpl(s);return T.dur*T.rpe};
function realEntries(){return memo("real",()=>{
  const out=[];
  activeClub().forEach(e=>{const a=e.actual;const v=srpe(a);if(v!=null)out.push({date:e.date,kind:e.kind,id:e.id,srpe:v,rpe:+a.rpe,dur:+a.dur,hrAvg:a.hrAvg,hrMax:a.hrMax,flags:a.flags||[],key:refKey(e),pos:a.pos,minutes:a.minutes})});
  sessions().forEach(s=>{const st=statusOf(s);if(st!=="done"&&st!=="adapted")return;const l=S.log[s.id];const v=srpe(l);if(v!=null)out.push({date:s.date,kind:"muscu",id:s.id,srpe:v,rpe:+l.rpe,dur:+l.dur,hrAvg:l.hrAvg,hrMax:l.hrMax,flags:[],key:"muscu-"+effCode(s)})});
  otherList().forEach(o=>{const v=srpe(o);if(v!=null)out.push({date:o.date,kind:"autre",id:o.id,srpe:v,rpe:+o.rpe,dur:+o.dur,flags:[],key:"autre-"+o.sport})});
  return out;
})}
function dayLoad(date){
  let planned=0,real=0;
  sessions().filter(s=>s.date===date&&!isOpt(s)).forEach(s=>planned+=plannedLoadOfSession(s));
  activeClub().filter(e=>e.date===date).forEach(e=>planned+=(+e.dur||0)*(+e.plannedRPE||0));
  realEntries().filter(r=>r.date===date).forEach(r=>real+=r.srpe);
  return{planned,real};
}
function weekLoad(w){
  const end=w.type==="treve"?PERIOD_END:addDays(w.s,6);let planned=0,real=0,done=0,total=0;const flags={};const hr=[];
  for(let d=w.s;d<=end;d=addDays(d,1)){const l=dayLoad(d);planned+=l.planned;real+=l.real}
  activeClub().filter(e=>e.date>=w.s&&e.date<=end).forEach(e=>{total++;if(srpe(e.actual)!=null)done++;(e.actual&&e.actual.flags||[]).forEach(f=>flags[f]=(flags[f]||0)+1);if(e.actual&&isNum(e.actual.hrAvg))hr.push(+e.actual.hrAvg)});
  sessions().filter(s=>s.date>=w.s&&s.date<=end&&!isOpt(s)).forEach(s=>{total++;if(srpe(S.log[s.id])!=null&&(statusOf(s)==="done"||statusOf(s)==="adapted"))done++});
  let ton=0;sessions().filter(s=>s.date>=w.s&&s.date<=end&&(statusOf(s)==="done"||statusOf(s)==="adapted")).forEach(s=>ton+=tonnage(sessionItems(s)));
  return{planned,real,done,total,flags,hrAvg:hr.length?Math.round(hr.reduce((a,b)=>a+b,0)/hr.length):null,ton};
}
/* Ratio charge aiguë / chronique : indicateur de TENDANCE uniquement (jamais un diagnostic).
   Aiguë = 7 derniers jours ; chronique = moyenne hebdomadaire des 28 derniers jours. Il faut 28 jours de données. */
function acwr(date,kind){
  const first=kind==="real"?(realEntries().map(r=>r.date).sort()[0]||null):PERIOD_START;
  if(!first||diff(first,date)<27)return{ratio:null,days:first?Math.max(0,diff(first,date)+1):0};
  let a=0,c=0;for(let i=0;i<7;i++)a+=dayLoad(addDays(date,-i))[kind];
  for(let i=0;i<28;i++)c+=dayLoad(addDays(date,-i))[kind];c=c/4;
  return{ratio:c>0?a/c:null,days:28,acute:a,chronic:c};
}
/* Références personnelles : même type de séance, même jour (ex. tes mercredis entre eux), matchs entre eux */
const REF_MIN=4;
function refKey(e){if(e.kind==="match")return "match";return "club-"+JOURS_C[D(e.date).getDay()]}
const REF_NAME=k=>k==="match"?"Matchs":k.startsWith("autre-")?"Autre · "+((SPORTS[k.slice(6)]||SPORTS.autre).name):k.startsWith("club-")?"Club · "+cap({lun:"lundis",mar:"mardis",mer:"mercredis",jeu:"jeudis",ven:"vendredis",sam:"samedis",dim:"dimanches"}[k.slice(5)]):"Muscu · "+(TYPES[k.slice(6)]?TYPES[k.slice(6)].name:k);
function refStats(excludeId){
  const g={};realEntries().forEach(r=>{if(r.id===excludeId)return;(g[r.key]=g[r.key]||[]).push(r)});
  const out={};Object.entries(g).forEach(([k,arr])=>{const v=arr.map(r=>r.srpe);const m=v.reduce((a,b)=>a+b,0)/v.length;const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/Math.max(1,v.length-1));const hrs=arr.filter(r=>isNum(r.hrAvg)).map(r=>+r.hrAvg);out[k]={n:arr.length,mean:m,sd,hr:hrs.length?hrs.reduce((a,b)=>a+b,0)/hrs.length:null,rpe:arr.reduce((a,r)=>a+r.rpe,0)/arr.length}});
  return out;
}
/* Classement d'une séance réelle : référence personnelle si au moins 4 séances comparables, sinon seuil provisoire (RPE ≥ 7) */
function classifyLoad(e){
  const a=e.actual;const v=srpe(a);if(v==null)return null;
  const st=refStats(e.id)[refKey(e)];
  if(st&&st.n>=REF_MIN){const lim=st.mean+Math.max(st.sd,.1*st.mean);return{high:v>lim,provisional:false,text:"RPE "+a.rpe+" · "+v+" UA, ta moyenne de "+REF_NAME(refKey(e)).toLowerCase()+" : "+Math.round(st.mean)+" UA (n = "+st.n+")"}}
  return{high:+a.rpe>=7,provisional:true,text:"RPE "+a.rpe+" · "+v+" UA (seuil provisoire : RPE 7 ou plus)"};
}
/* FC : interprétable seulement avec une FC max mesurée. Seuil « élevée » : moyenne ≥ 85 % FC max
   (le cours Méthodes cardiovasculaires situe SV1 vers 80-85 % FC max). Pour un défenseur central, une FC moyenne modérée ne signifie pas une charge faible. */
function classifyHR(a){
  const hm=+S.settings.hrMax;if(!a||!isNum(a.hrAvg))return{level:null,text:"FC non renseignée"};
  if(!hm)return{level:null,text:"FC moy "+a.hrAvg+" bpm (non interprétée : FC max non renseignée)"};
  const p=a.hrAvg/hm;return{level:p>=.85?"high":p>=.8?"mid":"mod",pct:p,text:"FC moy "+a.hrAvg+" bpm ("+Math.round(p*100)+" % de ta FC max)"};
}
/* Zones par défaut de Polar (% FC max) : convention du fabricant, pas une règle du cours. Modifiables plus tard. */
const ZONES=[[.5,.6],[.6,.7],[.7,.8],[.8,.9],[.9,1.01]];
const zoneOf=(hr,hm)=>{if(!hm)return null;const p=hr/hm;for(let i=ZONES.length-1;i>=0;i--)if(p>=ZONES[i][0])return i;return -1};

