/* =====================================================================
   DOMAINE · PLANIFICATION HISTORIQUE DE LUCAS (programme « lucas-2026 »)
   Cas particulier migré : ses séances restent calculées par ce moteur (matchs réels, entraînements à Caen,
   semaines d'alternance / de cours). Toutes les valeurs propres à Lucas sont regroupées dans LUCAS ci-dessous :
   elles ne servent JAMAIS de valeurs par défaut pour un autre compte.
   ===================================================================== */
const LUCAS=Object.freeze({
  uid:"lucas",ctx:"lucas-2026",programId:"prog-lucas-2026",assignmentId:"asg-lucas-2026",
  identity:{first:"Lucas",last:"Besnard"},
  profile:{pos:"Défenseur central",pos2:"Latéral gauche",sex:"homme",sports:[{k:"football",level:"amateur",perWeek:3}],club:"US Côte des Isles"},
  settings:{bw:80,dmRefW:22,dmRefR:8,pos:"Défenseur central",pos2:"Latéral gauche"},
  period:{start:"2026-10-12",end:"2026-12-31"},
  tests1210:{date:"2026-10-12",bw:80,cmj:33.9,squat3:95,bench3:70,dl3:80,pullReps:11,src:"Saisis à partir des résultats transmis"},
  fv:{date:"2026-09-01",t30:"4,73 s",F0:"6,93 N/kg",V0:"8,71 m/s",Pmax:"15,1 W/kg",rf:"49 % / −0,074",retest:"2026-12-16"},
  blockGoals:[
   {from:"2026-10-12",to:"2026-12-20",t:"Bloc en saison (12/10 → 20/12)",items:["Développer la force maximale et la force horizontale (F0 6,93 N/kg, sous 7 N/kg) : squat, traîneau lourd, hip thrust, bonds horizontaux.","Garder la fraîcheur pour les matchs : planification ondulante selon le jour du match (cours Planification, p. 54).","Travail préventif des ischios et des adducteurs : Nordic et Copenhagen deux fois par semaine quand le calendrier le permet (cours Prévention, p. 23). Il contribue à réduire certains facteurs de risque, sans garantie."]},
   {from:"2026-12-21",to:"2026-12-31",t:"Trêve (21/12 → 31/12)",items:["Récupération active à 50-60 % de la FC max, 3 séances optionnelles (cours Planification, p. 49)."]}]
});
const LUCAS_CTX=LUCAS.ctx;
const WEEKS_LUCAS=[
 {n:"S1",s:"2026-10-12",type:"alt"},{n:"S2",s:"2026-10-19",type:"cours"},{n:"S3",s:"2026-10-26",type:"alt"},
 {n:"S4",s:"2026-11-02",type:"cours"},{n:"S5",s:"2026-11-09",type:"alt"},{n:"S6",s:"2026-11-16",type:"alt"},
 {n:"S7",s:"2026-11-23",type:"cours"},{n:"S8",s:"2026-11-30",type:"alt"},{n:"S9",s:"2026-12-07",type:"alt"},
 {n:"S10",s:"2026-12-14",type:"cours"},{n:"Trêve",s:"2026-12-21",type:"treve"}
];
let WEEKS=WEEKS_LUCAS; // remplacé par les semaines du programme attribué (setPeriod) pour les autres comptes
const WTYPE={alt:"Alternance",cours:"Semaine de cours",treve:"Trêve",prog:"Programme"};
const LVL={moyenne:"Semaine moyenne",haute:"Semaine haute",basse:"Semaine basse · 2 matchs rapprochés",charge:"Bloc de charge · pas de match",recup:"Trêve · récupération active"};
function weekOf(date){if(date<PERIOD_START||date>PERIOD_END)return null;for(let i=WEEKS.length-1;i>=0;i--)if(diff(WEEKS[i].s,date)>=0)return WEEKS[i];return null}
/* Matchs : dates et horaires exacts du calendrier officiel */
const BASE_MATCHES=[
 ["2026-10-11","15:00","US Côte des Isles – Agneaux FC","Régional 2","Domicile"],
 ["2026-10-18","15:00","FC des Étangs – US Côte des Isles","Régional 2","Extérieur"],
 ["2026-10-25","14:30","US Côte des Isles – AS PTT Caen 2","Régional 2","Domicile"],
 ["2026-10-31","18:30","ES Coutances 2 – US Côte des Isles","Régional 2","Extérieur"],
 ["2026-11-08","14:30","US Côte des Isles – AS Jullouville Sartilly","Régional 2","Domicile"],
 ["2026-11-15","14:30","US Côte des Isles – Agneaux FC","Coupe de Normandie","Domicile"],
 ["2026-11-21","18:00","CS Carentan – US Côte des Isles","Régional 2","Extérieur"],
 ["2026-11-29","15:00","FC St-Lô Manche 2 – US Côte des Isles","Régional 2","Extérieur"],
 ["2026-12-06","14:30","US Côte des Isles – US Ducey Isigny","Régional 2","Domicile"]
];
/* Séances club récurrentes (préremplies, modifiables). getDay : 2 mardi, 3 mercredi, 5 vendredi.
   RPE prévus = hypothèses de départ, remplacées par tes références personnelles dès qu'elles existent. */
const TRAINING_TPL={
 alt:{
  2:{content:"Séance plutôt détendue avec beaucoup de jeu. Les jeux peuvent quand même produire beaucoup d'accélérations, de freinages et de changements de direction.",intensity:"Modérée (prévue)",rpe:5},
  3:{content:"Partie physique, jeu de position, phases arrêtées, jeu en fin de séance. Souvent la séance la plus chargée de la semaine.",intensity:"Élevée (prévue)",rpe:7},
  5:{content:"Partie vitesse, jeu de position à objectif tactique, partie jouée. Séance proche du match.",intensity:"Modérée à élevée, avec vitesse",rpe:6,speed:true}},
 cours_avant:{ // semaine de cours S2 (déjà passée en grande partie) : ancien rythme mercredi + vendredi
  3:{content:"Contenu découvert sur place.",intensity:"Inconnue avant la séance",rpe:6},
  5:{content:"Contenu découvert sur place, avec une partie vitesse.",intensity:"Inconnue avant la séance",rpe:6,speed:true}},
 cours:{ // à partir du 26/10 : Caen le mardi et/ou le jeudi soir (au choix chaque semaine), vendredi soir obligatoire
  2:{content:"Entraînement à Caen. Contenu découvert sur place.",intensity:"Inconnue avant la séance",rpe:6,caen:"mar"},
  4:{content:"Entraînement à Caen. Contenu découvert sur place.",intensity:"Inconnue avant la séance",rpe:6,caen:"jeu"},
  5:{content:"Séance obligatoire. Contenu découvert sur place, avec une partie vitesse.",intensity:"Inconnue avant la séance",rpe:6,speed:true}}
};
const CAEN_FROM="2026-10-26";
const CAEN_LABEL={mar:"Mardi soir",jeu:"Jeudi soir",both:"Mardi et jeudi soir"};
const CAEN_DEFAULT="jeu"; // choix recommandé : Caen le jeudi, muscu lundi + mardi + mercredi
const caenChoice=w=>S.caen[w]||CAEN_DEFAULT;
const caenWeeks=()=>WEEKS_LUCAS.filter(w=>w.type==="cours"&&w.s>=CAEN_FROM);
function baseClub(){
  const out=[];
  BASE_MATCHES.forEach(m=>out.push({id:"m-"+m[0],kind:"match",date:m[0],time:m[1],dur:90,title:m[2],comp:m[3],venue:m[4],content:m[3]+" · "+m[4].toLowerCase(),intensity:"Maximale",plannedRPE:8}));
  WEEKS_LUCAS.forEach(w=>{
    if(w.type==="treve")return;const T=TRAINING_TPL[w.type==="cours"&&w.s<CAEN_FROM?"cours_avant":w.type];
    for(let o=0;o<7;o++){const d=addDays(w.s,o);const t=T[D(d).getDay()];
      if(t)out.push({id:"c-"+d,kind:"training",date:d,time:"19:30",dur:105,title:"Séance club",content:t.content,intensity:t.intensity,plannedRPE:t.rpe,speed:!!t.speed,...(t.caen?{caen:t.caen,week:w.n}:{})})}
  });
  return out.sort(byDT);
}
const byDT=(a,b)=>(a.date+(a.time||""))<(b.date+(b.time||""))?-1:(a.date+(a.time||""))>(b.date+(b.time||""))?1:0;
const BASE_CLUB=baseClub();
function clubEvents(){return memo("club",()=>{
  // Club et matchs de base : uniquement pour le profil historique de Lucas. Tout compte peut ajouter ses propres séances club et matchs.
  const out=(legacyActive()?BASE_CLUB:[]).filter(b=>{if(!b.caen)return true;const c=caenChoice(b.week);return c==="both"||c===b.caen})
   .map(b=>{const o=S.club[b.id];return o?{...b,...o,id:b.id,base:true}:{...b,base:true}});
  Object.entries(S.club).forEach(([id,o])=>{if(isObj(o)&&o.added&&o.date)out.push({dur:o.kind==="match"?90:105,time:"19:30",plannedRPE:o.kind==="match"?8:6,...o,id,added:true})});
  return out.sort(byDT);
})}
const activeClub=()=>memo("active",()=>clubEvents().filter(e=>!e.cancelled));
const matchList=()=>memo("matches",()=>activeClub().filter(e=>e.kind==="match"));
const clubOn=d=>clubEvents().filter(e=>e.date===d);
const clubEnd=e=>dtMs(e.date,e.time)+(+e.dur||90)*60000;

/* Contexte du match : J-3, J-2, J-1, J, J+1, J+2 calculés à partir des dates exactes */
function ctxFrom(ms,date){
  let next=null,prev=null;
  for(const m of ms){if(m.date<date)prev=m;else if(!next)next=m}
  const dn=next?diff(date,next.date):null,dp=prev?diff(prev.date,date):null;
  const parts=[];
  if(dn===0)parts.push("Jour de match");
  else{if(dp!=null&&dp<=2)parts.push("J+"+dp);if(dn!=null&&dn<=5)parts.push("J-"+dn)}
  return{dn,dp,next,prev,label:parts.join(" · ")||"Pas de match proche"};
}
const matchCtx=date=>ctxFrom(matchList(),date);

