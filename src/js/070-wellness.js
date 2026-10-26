/* =====================================================================
   MODULE 8 · FATIGUE (questionnaire de ressenti)
   ===================================================================== */
/* Questionnaire de bien-être quotidien (à remplir le matin, avant la séance).
   5 items du cours Planification « questionnaires de bien-être : sommeil, fatigue, douleurs, humeur, stress ».
   Curseur 0-100 (100 = meilleur état). Les 4 items de l'indice de Hooper (sommeil, fatigue, stress, douleurs musculaires,
   cours Quantification de la charge) sont aussi convertis en 1-7 (7 = pire) pour un indice sur 28. L'humeur (inspirée du POMS) n'entre pas dans Hooper. */
const WB_ITEMS=[
 {k:"sommeil",n:"Qualité du sommeil",lo:"Très mauvaise",hi:"Excellente",hooper:true},
 {k:"fraicheur",n:"Fraîcheur / fatigue",lo:"Épuisé",hi:"Très frais",hooper:true},
 {k:"courbatures",n:"Courbatures",lo:"Très fortes",hi:"Aucune",hooper:true},
 {k:"stress",n:"Stress",lo:"Très stressé",hi:"Détendu",hooper:true},
 {k:"humeur",n:"Humeur / motivation",lo:"Au plus bas",hi:"Au top",hooper:false}];
const hooperItem=v=>1+Math.round((100-v)/100*6);
function wbCompute(items){
  const vals=WB_ITEMS.map(i=>items[i.k]).filter(isNum);
  if(vals.length<WB_ITEMS.length)return null;
  return{score:Math.round(vals.reduce((a,b)=>a+(+b),0)/vals.length),hooper:WB_ITEMS.filter(i=>i.hooper).reduce((a,i)=>a+hooperItem(+items[i.k]),0)};
}
const wbLabel=sc=>sc>=75?"Bien":sc>=60?"Correct":sc>=45?"Moyen":"Faible";
const WB_LOW=25; // item « signalé » : curseur dans le quart le plus bas (≈ 6 ou 7 sur l'échelle de Hooper)
function fatigueEval(date){
  const f=S.fatigue[date];if(!f)return null;
  const prev=Object.keys(S.fatigue).filter(d=>d<date&&diff(d,date)<=14&&isNum(S.fatigue[d].score)).map(d=>+S.fatigue[d].score);
  const base=prev.length>=5?prev.reduce((a,b)=>a+b,0)/prev.length:null;
  const reasons=[],signs=[];let high=false;
  if(isNum(f.score)){const sc=+f.score;
    if(base!=null&&sc<=base-S.settings.fatDrop){high=true;signs.push("score");reasons.push("Score de bien-être "+sc+"/100, soit "+Math.round(base-sc)+" points sous ta moyenne des 14 derniers jours ("+Math.round(base)+").")}
    else if(base==null&&sc<S.settings.fatAbs){high=true;signs.push("score");reasons.push("Score de bien-être "+sc+"/100, sous le seuil provisoire de "+S.settings.fatAbs+" (ta moyenne personnelle sera utilisée après 5 questionnaires).")}}
  const items=f.items||{};const low=WB_ITEMS.filter(i=>isNum(items[i.k])&&+items[i.k]<=WB_LOW);
  if(low.length){signs.push(...low.map(i=>i.k));reasons.push("Item(s) très bas : "+low.map(i=>i.n.toLowerCase()).join(", ")+".")}
  // Courbatures basses 3 jours de suite = « courbatures > 72 h » (signe de surmenage du cours Pliométrie)
  const sore=d=>{const x=S.fatigue[d];return x&&x.items&&isNum(x.items.courbatures)&&+x.items.courbatures<=40};
  if(sore(date)&&sore(addDays(date,-1))&&sore(addDays(date,-2))){high=true;signs.push("courbatures72");reasons.push("Courbatures marquées depuis au moins 3 jours (plus de 72 h).")}
  const r=oneRMs();
  if(isNum(f.cmj)&&r.cmj&&+f.cmj<r.cmj*.95){high=true;signs.push("cmj");reasons.push("CMJ du jour "+fmt(+f.cmj)+" cm, soit "+Math.round((1-f.cmj/r.cmj)*100)+" % sous ton test ("+fmt(r.cmj)+" cm). Le cours Pliométrie cite une baisse de plus de 5 % comme signe de fatigue.")}
  const fl=f.factors||[];const names={sommeil:"sommeil",stress:"stress",fatigue:"fatigue générale",courbatures:"courbatures"};
  const flagged=fl.filter(x=>names[x]).map(x=>names[x]);
  if(flagged.length)reasons.push("Facteur signalé : "+flagged.join(", ")+".");
  if(low.length>=2)high=true;
  const multi=new Set(signs).size>=2;
  return{high,reasons,pain:fl.includes("douleur")||!!f.pain,score:f.score,hooper:f.hooper,flagged:[...flagged,...low.map(i=>i.n.toLowerCase())],multi,src:f.src||"manuel",at:f.at,base};
}

