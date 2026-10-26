/* =====================================================================
   MODULE 6 · TESTS ET CHARGES
   1RM estimé (Brzycki) = charge × 36 / (37 − répétitions)
   ===================================================================== */
const brz=(w,r)=>w*36/(37-r);
const roundTo=(x,inc)=>Math.round(x/inc)*inc;
function latestTests(){const o={};[...S.tests].sort((a,b)=>a.date<b.date?-1:1).forEach(t=>Object.keys(t).forEach(k=>{if(t[k]!==""&&t[k]!=null)o[k]=t[k]}));return o}
function oneRMs(){
  const t=latestTests(),bw=+(t.bw||S.settings.bw);const r={bw,src:{}};
  if(isNum(t.squat3)){r.squat=brz(+t.squat3,3);r.src.squat=t.squat3+" kg × 3"}
  if(isNum(t.bench3)){r.bench=brz(+t.bench3,3);r.src.bench=t.bench3+" kg × 3"}
  if(isNum(t.dl3)){r.dl=brz(+t.dl3,3);r.src.dl=t.dl3+" kg × 3"}
  if(isNum(t.rdlRefW)&&isNum(t.rdlRefR)&&+t.rdlRefR<=10){r.rdl=brz(+t.rdlRefW,+t.rdlRefR);r.src.rdl=t.rdlRefW+" kg × "+t.rdlRefR}
  if(isNum(t.pullLoad3)&&+t.pullLoad3>0){r.pull=brz(bw+(+t.pullLoad3),3);r.src.pull="+"+t.pullLoad3+" kg × 3"}
  if(isNum(t.pullReps))r.pullReps=+t.pullReps;
  if(isNum(S.settings.dmRefW))r.dm=brz(+S.settings.dmRefW,Math.min(10,+S.settings.dmRefR||8));
  if(isNum(t.cmj))r.cmj=+t.cmj;
  return r;
}
/* Texte de charge d'un exercice : pourcentage + kilogrammes, ou consigne au RIR quand aucune référence fiable n'existe */
function loadInfo(e){
  if(e.presc){const P=prescLoad(e.presc);if(!P)return null;
    return{pct:P.pct?P.pct+" % du 1RM estimé":null,kg:P.kg!=null?P.text:null,kgNum:P.kg,note:P.kg==null?P.text:null,formula:P.formula,missing:!!P.missing,
      help:P.missing?(P.why||"")+(P.fallback?" · En attendant : "+P.fallback.text+".":"")+" Ton coach peut te faire passer le test.":P.locked?"Calcul automatique des charges non inclus dans ta formule.":(P.formula||""),adj:""}}
  if(!e.lift)return null;
  if(!can("auto_loads"))return{pct:null,kg:null,note:"Charge au ressenti ("+(e.rir||"RIR 2")+")",help:"Calcul automatique des charges non inclus dans ta formule."};
  const r=oneRMs(),adj=+(S.loadAdj[e.lift]||0),adjTxt=adj?" (progression "+(adj>0?"+":"")+fmt(adj)+" kg)":"";
  const pct=e.pct?Math.round(e.pct*100)+" % du 1RM estimé":null;
  if(e.lift==="rdl"){
    if(!r.rdl)return{pct:null,kg:null,note:"Charge à ajuster au RIR 2",help:"Pas encore de référence au roumain : ton test du 12/10 est un soulevé de terre classique. Ajoute une référence dans Programme › Tests."};
    const p={5:.78,6:.75,8:.68}[parseInt(e.reps,10)]||.72;const kgN=roundTo(r.rdl*p+adj,S.settings.barInc);
    return{pct:Math.round(p*100)+" % du 1RM estimé au roumain",kg:fmt(kgN)+" kg",kgNum:kgN,note:null,adj:adjTxt};
  }
  if(e.lift==="pull"){
    if(!r.pull)return{pct:null,kg:null,note:"Poids du corps · "+e.repsBW+" reps",help:(r.pullReps?"Base : "+r.pullReps+" reps au poids du corps le 12/10. ":"")+"Sans 3RM lesté, aucun lest n'est calculé : un calcul à partir de "+(r.pullReps||"11")+" reps ne serait pas fiable."};
    const lest=roundTo(e.pct*r.pull-r.bw+adj,S.settings.barInc);
    return{pct,kg:lest>0?"+ "+fmt(lest)+" kg de lest":"Poids du corps",note:null,adj:adjTxt};
  }
  if(!r[e.lift])return{pct,kg:null,note:"Charge à calculer",help:"Saisis le test correspondant dans Programme › Tests."};
  const inc=e.perHand?S.settings.dbInc:S.settings.barInc;
  return{pct,kg:fmt(roundTo(e.pct*r[e.lift]+adj,inc))+" kg"+(e.perHand?" par haltère":""),kgNum:roundTo(e.pct*r[e.lift]+adj,inc),note:null,adj:adjTxt};
}
/* Tonnage prévu (charge externe) : séries × répétitions × kg, seulement pour les exercices chiffrés */
function tonnage(items){let t=0;items.forEach(e=>{if(e.removed||e.lift==="pull")return;const L=loadInfo(e);if(!L||L.kgNum==null)return;const reps=parseInt(e.reps,10);if(typeof e.sets==="number"&&reps)t+=e.sets*reps*L.kgNum*(e.perHand?2:1)});return Math.round(t)}

