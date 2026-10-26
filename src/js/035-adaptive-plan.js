/* =====================================================================
   MODULE 4 · PLANIFICATION ADAPTATIVE
   Les modèles de séance sont recalculés à partir des matchs réels :
   ajouter, reporter ou annuler un match recalcule les propositions.
   ===================================================================== */
function weekLevelFrom(ms,w){
  if(w.type==="treve")return "recup";
  const end=addDays(w.s,6);const inW=ms.filter(m=>m.date>=w.s&&m.date<=end);
  if(!inW.length)return "charge";
  const prev=ms.filter(m=>m.date<inW[0].date).pop();
  if(inW.length>=2||(prev&&diff(prev.date,inW[0].date)<=6))return "basse";
  return w.type==="cours"?"haute":"moyenne";
}
/* Jambes lourdes autorisées : au moins J+2 après le match précédent et au moins J-3 avant le suivant
   (règle des 48 h après une séance de force maximale + microcycle du cours Planification). */
const legsOk=c=>(c.dp==null||c.dp>=2)&&(c.dn==null||c.dn>=3);
function condDefault(date,c,lvl){
  if(c.dp===1||c.dn===1)return "HM";       // lendemain ou veille de match : haut du corps, mobilité, prévention
  if(c.dn===2)return "MICRO";               // J-2 (match le samedi) : microdose de puissance
  if(date==="2026-12-17")return "PR";       // retest du profil force-vitesse prévu
  if(c.dn===3)return "PF";                  // J-3 : puissance faible volume + quelques séries de force
  return lvl==="charge"?"PFC":"PF";         // pas de match proche
}
function baseSlotsFor(clubList){
  const ms=clubList.filter(e=>!e.cancelled&&e.kind==="match").sort(byDT);
  const out=[];
  WEEKS_LUCAS.forEach(w=>{
    const lvl=weekLevelFrom(ms,w);
    const mk=(off,slot,code,label,extra={})=>{const date=addDays(w.s,off);out.push({id:extra.id||"M-"+date,date,origDate:date,week:w.n,wtype:w.type,lvl,slot,defaultCode:code,timeLabel:label,cond:!!extra.cond,optional:!!extra.optional})};
    if(w.n==="S1"){mk(0,"fixe","TEST","Journée",{id:"TEST-2026-10-12"});mk(3,"fixe","HP","Matin",{id:"HP-2026-10-15"});return}
    if(w.type==="treve"){[2,5,8].forEach(o=>mk(o,"treve","R","Quand tu veux",{optional:true}));return}
    const c0=ctxFrom(ms,w.s),c1=ctxFrom(ms,addDays(w.s,1)),c3=ctxFrom(ms,addDays(w.s,3));
    if(w.type==="alt"){
      // Lundi = séance principale. Après un match le dimanche (J+1) : principale orientée haut du corps et récupération.
      if(c0.dn!==0)mk(0,"principale",legsOk(c0)?(lvl==="charge"?"FC":"F"):(c0.dn!=null&&c0.dn<=1?"HM":"HR"),"Journée");
      if(c3.dn!==0)mk(3,"conditionnelle",condDefault(addDays(w.s,3),c3,lvl),"Matin",{cond:true});
    }else{
      // Semaine de cours (à partir du 26/10) : mercredi libre. Muscu le lundi, le mercredi, et le mardi ou le jeudi
      // si tu n'as pas entraînement à Caen ce soir-là. Par défaut : Caen le jeudi (voir CAEN_DEFAULT).
      const foot=d=>clubList.some(e=>e.kind==="training"&&!e.cancelled&&e.date===d);
      const cx=[c0,c1,ctxFrom(ms,addDays(w.s,2)),c3];
      let mon=null;
      if(c0.dn!==0){mon=legsOk(c0)?(lvl==="charge"?"FC":"F"):"H";mk(0,"lundi",mon,"Soir")}
      const free=[1,2,3].filter(o=>cx[o].dn!==0&&!foot(addDays(w.s,o))&&(o!==2||w.s>=CAEN_FROM));
      const last=free.filter(o=>o>=2).pop();
      const SLOT=["lundi","mardi","mercredi","conditionnelle"];
      free.forEach(o=>{const d=addDays(w.s,o),c=cx[o];
        if(o===last)mk(o,o===3?"conditionnelle":SLOT[o],condDefault(d,c,lvl),"Soir",{cond:true});
        else mk(o,SLOT[o],(mon==="F"||mon==="FC")?"H":(legsOk(c)?(lvl==="charge"?"FC":"F"):"HM"),"Soir")});
      // Retest force-vitesse prévu le jeudi 17/12 : si ce soir-là est pris par le foot, il passe sur la dernière séance de la semaine.
      const wk=out.filter(x=>x.week===w.n);
      if(w.s<="2026-12-17"&&addDays(w.s,6)>="2026-12-17"&&wk.length&&!wk.some(x=>x.defaultCode==="PR"))wk[wk.length-1].defaultCode="PR";
    }
  });
  return out;
}
const baseSlots=()=>memo("slots",()=>legacyActive()?baseSlotsFor(clubEvents()):genericSlots());
function sessions(){return memo("sess",()=>baseSlots().map(b=>({...b,date:S.moves[b.id]||b.date,moved:!!S.moves[b.id]})).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0))}
const sessionById=id=>sessions().find(s=>s.id===id);
function effCode(s){
  const a=S.adapt[s.id];
  if(a&&a.mode==="upper")return "HM";
  if(a&&a.mode==="micro")return "MICRO";
  if(a&&a.mode==="active")return "R";
  if(s.cond&&S.cond[s.id]&&TYPES[S.cond[s.id]])return S.cond[s.id];
  return s.defaultCode;
}
const tpl=s=>{const c=effCode(s);return String(c).startsWith("G:")?genTpl(s):TYPES[c]};
const isOpt=s=>!!s.optional;
const isAdapted=s=>{const a=S.adapt[s.id];return !!(a&&a.mode&&a.mode!=="none")||!!(s.cond&&S.cond[s.id]&&S.cond[s.id]!==s.defaultCode)};
const statusOf=s=>{const st=S.status[s.id];return st?st.s:null};
/* Statut affiché : done | adapted | missed | fatigue (choisis) · todo (passée, à renseigner) · today · future */
function displayStatus(s,t=todayISO()){const st=statusOf(s);if(st)return st;if(s.date<t&&!isOpt(s))return "todo";if(s.date===t)return "today";return "future"}
const STATUS_LABEL={done:"Réalisée",adapted:"Réalisée avec adaptation",missed:"Non réalisée",fatigue:"Non réalisée",todo:"À renseigner",today:"Aujourd'hui",future:"À venir"};
const STATUS_SYM={done:"✓",adapted:"✎",missed:"✕",fatigue:"✕",todo:"?",today:"",future:""};
const STATUS_CHIP={done:"st-done",adapted:"st-adapted",missed:"st-missed",fatigue:"st-missed",todo:"st-todo",today:"st-today",future:"st-future"};
/* Raisons proposées quand une séance n'est pas réalisée ou est adaptée */
const MISS_REASONS=[["fatigue","Fatigue"],["douleur","Douleur ou blessure"],["boulot","Boulot"],["temps","Manque de temps"],["oubli","Oubli"],["materiel","Matériel indisponible"],["lourd","Charge trop lourde"],["coach","Décision du coach"],["autre","Autre"]];
const ADAPT_REASONS=[["reco","Adaptation proposée par l'appli"],["fatigue","Fatigue"],["douleur","Douleur ou gêne"],["temps","Manque de temps"],["materiel","Matériel indisponible"],["lourd","Charge trop lourde"],["coach","Décision du coach"],["autre","Autre"]];
const reasonLabel=k=>(MISS_REASONS.concat(ADAPT_REASONS).find(r=>r[0]===k)||[k,k])[1];
/* Série : réalisée ou adaptée +1 · non réalisée (choix volontaire) remet à zéro · fatigue et « à renseigner » ne changent rien */
function streak(){
  const t=todayISO();let n=0;
  sessions().filter(s=>s.date<=t).forEach(s=>{const st=statusOf(s);if(st==="done"||st==="adapted")n++;else if(st==="missed")n=0});
  return n;
}
function weekLevelOf(w){return w.type==="prog"?"prog":weekLevelFrom(matchList(),w)}
const weekLvlLabel=w=>w.type==="prog"?(w.label||w.block||"Semaine "+w.n):LVL[weekLevelOf(w)];

