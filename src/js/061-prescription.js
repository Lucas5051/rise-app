/* =====================================================================
   DOMAINE · PRESCRIPTION STRUCTURÉE DES CHARGES ET TESTS PERSONNALISÉS
   Chaque exercice d'un programme peut porter un objet « presc » :
   {mode, ref, pct, round, min, max, value, target, fallback}
   Modes : fixed (charge fixe), pct1rm (% du 1RM estimé), pctTest (% de la valeur d'un test),
   bw (poids du corps), bwPlus (poids du corps + lest), rpe (RPE cible), rir (RIR cible),
   time (durée), distance, reps (répétitions seules), free (charge libre choisie par l'athlète).
   Règle absolue : sans test compatible, AUCUNE charge n'est inventée → « Test requis pour calculer cette charge ».
   Estimation du 1RM : Brzycki = charge × 36 / (37 − répétitions) (déjà utilisée en v9), ou Epley = charge × (1 + répétitions / 30).
   Ces formules viennent de la littérature (Brzycki 1993, Epley 1985), pas des cours fournis : elles sont affichées
   à chaque calcul et le coach peut choisir l'une ou l'autre par type de test.
   ===================================================================== */
const PRESC_MODES=[["fixed","Charge fixe"],["pct1rm","% du 1RM estimé"],["pctTest","% d'un test de référence"],["bw","Poids du corps"],["bwPlus","Poids du corps + lest"],
  ["rpe","RPE cible"],["rir","RIR cible"],["time","Durée"],["distance","Distance"],["reps","Répétitions uniquement"],["free","Charge libre (choisie par l'athlète)"]];
const PRESC_L=k=>(PRESC_MODES.find(x=>x[0]===k)||[k,k])[1];
const REF_STD=[["squat","Squat (3RM)"],["bench","Développé couché (3RM)"],["dl","Soulevé de terre (3RM)"],["dm","Développé militaire haltères"],["pull","Traction lestée (3RM)"],["rdl","Soulevé de terre roumain"]];
const REF_TEST_KEY={squat:"squat3",bench:"bench3",dl:"dl3",pull:"pullLoad3",dm:"dm8"};
const FORMULAS={brzycki:{l:"Brzycki : charge × 36 / (37 − reps)",f:(w,r)=>r>=37?null:w*36/(37-r)},epley:{l:"Epley : charge × (1 + reps / 30)",f:(w,r)=>w*(1+r/30)}};
/* Types de tests : standards (serveur) + types créés par le coach */
function testTypes(){const base=[{key:"bw",name:"Poids de corps",unit:"kg",kind:"bodyweight"},{key:"cmj",name:"Saut CMJ",unit:"cm",kind:"jump"},
  {key:"squat3",name:"Squat 3RM",unit:"kg",kind:"rm",estimate_1rm:true,formula:"brzycki:3"},{key:"bench3",name:"Développé couché 3RM",unit:"kg",kind:"rm",estimate_1rm:true,formula:"brzycki:3"},
  {key:"dl3",name:"Soulevé de terre 3RM",unit:"kg",kind:"rm",estimate_1rm:true,formula:"brzycki:3"},{key:"pullLoad3",name:"Traction lestée 3RM (lest)",unit:"kg",kind:"rm",estimate_1rm:true,formula:"brzycki:3+bw"},
  {key:"pullReps",name:"Tractions au poids du corps",unit:"reps",kind:"reps"},{key:"dm8",name:"Développé militaire haltères 8 reps",unit:"kg",kind:"rm",estimate_1rm:true,formula:"brzycki:8"}];
  const srv=(PL&&PL.testTypes)||[];const out=new Map(base.map(t=>[t.key,t]));srv.forEach(t=>out.set(t.key,{...out.get(t.key),...t}));return [...out.values()]}
const testType=k=>testTypes().find(t=>t.key===k)||null;
/* Dernière valeur d'un test (historique complet conservé dans S.tests) */
function lastTest(key,before){let best=null;(S.tests||[]).forEach(t=>{if(isNum(t[key])&&(!before||t.date<=before)&&(!best||t.date>=best.date))best={date:t.date,value:+t[key]}});return best}
function testHistory(key){return (S.tests||[]).filter(t=>isNum(t[key])).map(t=>({date:t.date,value:+t[key]})).sort((a,b)=>a.date<b.date?-1:1)}
/* 1RM estimé d'une référence, avec la formule affichée */
function est1RM(ref,before){
  if(REF_TEST_KEY[ref]&&ref!=="dm"){const tk=REF_TEST_KEY[ref];const t=lastTest(tk,before);
    const r=ref==="pull"?(()=>{const bw=lastTest("bw",before);return t&&bw?{v:FORMULAS.brzycki.f(bw.value+t.value,3),src:`(${fmt(bw.value)} kg de corps + ${fmt(t.value)} kg de lest) × 3, ${FORMULAS.brzycki.l}`,date:t.date}:null})()
      :t?{v:FORMULAS.brzycki.f(t.value,3),src:`${fmt(t.value)} kg × 3 (test du ${fmtShort(t.date)}), ${FORMULAS.brzycki.l}`,date:t.date}:null;
    if(r)return r}
  if(ref==="dm"){const t=lastTest("dm8",before);if(t)return{v:FORMULAS.brzycki.f(t.value,8),src:`${fmt(t.value)} kg × 8, ${FORMULAS.brzycki.l}`,date:t.date};
    if(isNum(S.settings.dmRefW))return{v:FORMULAS.brzycki.f(+S.settings.dmRefW,Math.min(10,+S.settings.dmRefR||8)),src:`${fmt(S.settings.dmRefW)} kg × ${S.settings.dmRefR||8} (référence), ${FORMULAS.brzycki.l}`}}
  if(ref==="rdl"&&isNum((latestTests()||{}).rdlRefW)){const L=latestTests();return{v:FORMULAS.brzycki.f(+L.rdlRefW,+L.rdlRefR||5),src:`${fmt(L.rdlRefW)} kg × ${L.rdlRefR||5}, ${FORMULAS.brzycki.l}`}}
  const tt=testType(ref);if(tt){const t=lastTest(tt.key,before);if(!t)return null;
    const m=/^(brzycki|epley):(\d+)/.exec(tt.formula||"");if(tt.estimate_1rm&&m){const f=FORMULAS[m[1]];return{v:f.f(t.value,+m[2]),src:`${fmt(t.value)} ${tt.unit} × ${m[2]} (test du ${fmtShort(t.date)}), ${f.l}`,date:t.date}}
    if(tt.kind==="1rm")return{v:t.value,src:`1RM mesuré le ${fmtShort(t.date)}`,date:t.date}}
  return null}
const roundLoad=(x,inc)=>{inc=+inc>0?+inc:2.5;return Math.round(x/inc)*inc};
/* Calcule l'affichage d'une prescription. Ne renvoie jamais de charge inventée. */
function prescLoad(pr,opts={}){
  if(!isObj(pr)||!pr.mode)return null;const inc=+pr.round||+S.settings.barInc||2.5;const before=opts.before;
  const clamp=v=>{let x=v;if(isNum(pr.min))x=Math.max(x,+pr.min);if(isNum(pr.max))x=Math.min(x,+pr.max);return x};
  const missing=why=>{const fb=pr.fallback;return{kg:null,text:"Test requis pour calculer cette charge",missing:true,why,fallback:fb?prescLoad({mode:fb.mode||"rir",target:fb.target,value:fb.value},opts):null}};
  switch(pr.mode){
    case "fixed":return isNum(pr.value)?{kg:+pr.value,text:fmt(+pr.value)+" kg",formula:"Charge fixe choisie par le coach"}:{kg:null,text:"Charge à préciser par le coach",missing:true};
    case "pct1rm":case "pctTest":{
      if(!can("auto_loads"))return{kg:null,text:"Charge au ressenti"+(pr.fallback&&pr.fallback.target?" ("+pr.fallback.target+")":""),locked:"auto_loads"};
      if(!isNum(pr.pct)||!pr.ref)return missing("Pourcentage ou référence non renseignés");
      let base=null,src="";
      if(pr.mode==="pct1rm"){const e=est1RM(pr.ref,before);if(!e)return missing("Aucun test pour « "+refLabel(pr.ref)+" »");base=e.v;src="1RM estimé "+fmt(e.v)+" kg = "+e.src}
      else{const t=lastTest(REF_TEST_KEY[pr.ref]||pr.ref,before);if(!t)return missing("Aucun résultat pour le test « "+refLabel(pr.ref)+" »");base=t.value;src=refLabel(pr.ref)+" : "+fmt(t.value)+" (test du "+fmtShort(t.date)+")"}
      const kg=clamp(roundLoad(base*(+pr.pct)/100,inc));
      return{kg,text:fmt(kg)+" kg",pct:+pr.pct,formula:`${pr.pct} % × ${src} → ${fmt(base*(+pr.pct)/100)} kg, arrondi à ${fmt(inc)} kg${isNum(pr.min)||isNum(pr.max)?" (bornes "+(isNum(pr.min)?fmt(pr.min):"—")+" / "+(isNum(pr.max)?fmt(pr.max):"—")+" kg)":""}`}}
    case "bw":return{kg:null,text:"Poids du corps",formula:"Sans charge additionnelle"};
    case "bwPlus":return isNum(pr.value)?{kg:+pr.value,text:"Poids du corps + "+fmt(+pr.value)+" kg",formula:"Lest fixe"}:{kg:null,text:"Poids du corps + lest à préciser",missing:true};
    case "rpe":return{kg:null,text:"RPE cible "+(pr.target||"—"),formula:"Charge choisie pour atteindre le RPE indiqué"};
    case "rir":return{kg:null,text:(String(pr.target||"").match(/^RIR/i)?pr.target:"RIR "+(pr.target||"—")),formula:"Charge choisie pour garder ces répétitions en réserve"};
    case "time":return{kg:null,text:"Durée : "+(pr.target||"—")};
    case "distance":return{kg:null,text:"Distance : "+(pr.target||"—")};
    case "reps":return{kg:null,text:"Répétitions uniquement"};
    case "free":return{kg:null,text:"Charge libre : choisis-la et note-la"};
  }return null}
const refLabel=k=>(REF_STD.find(x=>x[0]===k)||[k,(testType(k)||{}).name||k])[1];
/* Texte de charge unifié pour une ligne d'exercice (programme générique ou historique) */
function loadView(e,s){
  const frozen=s&&S.log[s.id]&&S.log[s.id].loads&&S.log[s.id].loads[e.n];
  if(frozen)return{...frozen,frozen:true};
  if(e.presc)return prescLoad(e.presc,{before:s&&s.date<=todayISO()?s.date:undefined});
  return null}
/* Charges figées à la réalisation : une nouvelle valeur de test ne réécrit jamais l'historique */
function freezeLoads(){let ch=false;
  Object.entries(S.status||{}).forEach(([id,st])=>{if(!st||!["done","adapted"].includes(st.s))return;const l=S.log[id]=S.log[id]||{};if(l.loads)return;
    const s=typeof sessionById==="function"?sessionById(id):null;if(!s)return;let items=[];try{items=sessionItems(s)}catch(e){return}
    const out={};items.forEach(e=>{if(e.removed)return;let L=null;try{L=e.presc?prescLoad(e.presc,{before:s.date}):(e.lift?loadInfo(e):null)}catch(_){}
      if(L&&(L.kg!=null||L.text||L.kgNum!=null))out[e.n]={text:L.text||L.kg&&String(L.kg)||"",kg:L.kg??L.kgNum??null,formula:L.formula||L.pct||"",at:nowISO()}});
    l.loads=out;ch=true});
  return ch}
/* Contrôles de l'éditeur : tests manquants pour un client */
function missingTestsFor(prog,clientId){const need=new Set();progSessions(prog).forEach(x=>(x.ps.main||[]).forEach(r=>{if(r.presc&&["pct1rm","pctTest"].includes(r.presc.mode)&&r.presc.ref)need.add(r.presc.ref)}));
  if(!clientId)return [...need];return withAthlete(clientId,()=>[...need].filter(ref=>!(est1RM(ref)||lastTest(REF_TEST_KEY[ref]||ref))))}
