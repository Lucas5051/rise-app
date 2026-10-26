/* =====================================================================
   MODULE 10 · ANALYSE D'UN DÉPLACEMENT
   Messages : « Aucun impact important détecté » · « Vigilance accrue » / « Récupération probablement réduite » · « Enchaînement déconseillé ».
   Un risque n'est jamais présenté comme une certitude.
   ===================================================================== */
const VERDICT=["Aucun impact important détecté","Vigilance accrue","Enchaînement déconseillé"];
function zonesOf(s){const z=new Set();sessionItems(s).forEach(e=>{if(e.removed)return;(e.z||[]).forEach(k=>z.add(k));if(e.plyo)z.add("plyo");if(e.sprint)z.add("sprint")});return z}
function slotOk(date,T){
  const w=weekOf(date);if(!w)return{ok:false,msg:"Cette date est en dehors du programme."};
  const wd=D(date).getDay();
  if(w.type==="treve")return{ok:true};
  if(w.type==="alt"){
    if(wd===5)return T.fam==="light"?{ok:true}:{ok:false,msg:"Le vendredi matin doit rester libre ou très léger : partie vitesse avec le club le soir."};
    if(wd===1||wd===4)return{ok:true};
    return{ok:false,msg:"Ce jour n'est pas dans tes créneaux d'alternance (lundi toute la journée, jeudi matin, vendredi matin)."};
  }
  if(wd===1||wd===2||wd===4)return{ok:true};
  return{ok:false,msg:"Ce jour n'est pas dans tes créneaux de semaine de cours (lundi, mardi ou jeudi soir)."};
}
function analyze(id,newDate,swapId){
  const plan=sessions().map(s=>({...s}));
  const me=plan.find(s=>s.id===id);const other=swapId?plan.find(s=>s.id===swapId):null;
  const from=me.date;me.date=newDate;if(other)other.date=from;
  const msgs=[];let worst=0;const add=(l,t)=>{msgs.push({l,t});worst=Math.max(worst,l)};
  const ms=matchList(),club=activeClub();
  const check=s=>{
    const T=tpl(s),d=s.date,nm=T.name.toLowerCase(),heavy=T.fam==="heavy",z=zonesOf(s),power=T.fam==="power"||z.has("plyo")||z.has("sprint");
    if(d<PERIOD_START||d>PERIOD_END){add(2,"Cette date est en dehors du programme.");return}
    if(!isOpt(s)&&plan.some(x=>x.id!==s.id&&x.date===d&&!isOpt(x)))add(2,"Deux séances de musculation le même jour ("+fmtShort(d)+").");
    const c=ctxFrom(ms,d);
    if(c.dn===0)add(heavy||power?2:1,"La séance « "+nm+" » tombe le jour d'un match.");
    if(heavy){
      if(c.dn===1)add(2,"Séance lourde pour les jambes la veille du match (J-1) : moins de 48 heures de récupération avant le match.");
      else if(c.dn===2)add(1,"Séance lourde pour les jambes à J-2 : à la limite des 48 heures avant le match.");
      if(c.dp===1)add(2,"Lendemain de match (J+1) : jour de récupération, pas de séance lourde pour les jambes.");
      else if(c.dp===2)add(1,"J+2 : vérifie ton bien-être et la charge du match avant une séance lourde.");
    }else if(power){
      if(c.dn===1)add(2,"Sauts ou sprints la veille du match : garde plutôt une activation courte.");
      if(c.dp===1)add(1,"Sauts ou sprints le lendemain du match.");
    }
    club.filter(e=>e.kind==="training").forEach(e=>{
      const g=diff(d,e.date);
      if(g===0&&(heavy||power))add(e.speed&&power?2:1,"Même jour qu'une séance club ("+String(e.time).replace(":","h")+")"+(e.speed?" avec partie vitesse":"")+" : fais-la le plus loin possible de l'entraînement.");
      if(g===1&&e.speed&&power)add(1,"Partie vitesse au club le lendemain ("+fmtShort(e.date)+") : évite d'ajouter une deuxième grosse séance de vitesse.");
      if(g===-1&&(heavy||power)){
        const a=e.actual;if(!a)return;const fl=a.flags||[];
        if(fl.includes("sprints")&&z.has("post"))add(1,"La séance club de la veille a compté beaucoup de sprints : ischios et chaîne postérieure déjà sollicités.");
        if(fl.includes("accel")&&(z.has("post")||z.has("calf")))add(1,"Beaucoup d'accélérations la veille : fessiers, ischios et mollets déjà sollicités.");
        if(fl.includes("cod")&&z.has("quad"))add(1,"Beaucoup de freinages la veille : quadriceps déjà sollicités en excentrique.");
        if((fl.includes("duels")||fl.includes("sauts"))&&z.has("plyo"))add(1,"Beaucoup de duels ou de sauts la veille : limite les sauts supplémentaires.");
        if(fl.includes("lourdes"))add(1,"Jambes lourdes signalées la veille.");
        if(fl.includes("douleur"))add(1,"Douleur inhabituelle signalée la veille : demande l'avis d'un professionnel si elle persiste.");
        const cl=classifyLoad(e);if(cl&&cl.high){const hr=classifyHR(a);add(1,"Séance club de la veille chargée ("+cl.text+(hr.level?" · "+hr.text:"")+").")}
      }
    });
    plan.filter(x=>x.id!==s.id&&!isOpt(x)).forEach(x=>{
      const X=tpl(x),g=Math.abs(diff(x.date,d)),xh=X.fam==="heavy",xp=X.fam==="power";
      if(heavy&&xh&&g<=1)add(2,"Récupération insuffisante entre deux séances lourdes (« "+X.name.toLowerCase()+" » le "+fmtShort(x.date)+") : il faut au moins 48 heures.");
      else if(((heavy&&xp)||(power&&xh))&&g===0)add(2,"Séance lourde et séance de vitesse le même jour.");
      else if(((heavy&&xp)||(power&&xh))&&g===1)add(1,"Séance de vitesse à 24 heures d'une séance lourde (le "+fmtShort(x.date)+").");
    });
    if(!isOpt(s)){const so=slotOk(d,T);if(!so.ok)add(so.msg.startsWith("Le vendredi")&&heavy?2:1,so.msg)}
    const fe=fatigueEval(d);if(fe&&fe.high&&!isOpt(s))add(1,"Ton bien-être de ce jour indique une fatigue élevée.");
    const r=acwr(d,"real");if(r.ratio!=null&&r.ratio>1.5)add(1,"Indicateur de tendance : charge réelle des 7 derniers jours nettement au-dessus de ta moyenne des 4 semaines (ratio "+fmt(r.ratio,2)+", seuil de 1,5 cité dans le cours). Ce n'est pas une prédiction de blessure.");
  };
  check(me);if(other)check(other);
  const seen=new Set();const uniq=msgs.filter(m=>seen.has(m.t)?false:(seen.add(m.t),true)).sort((a,b)=>b.l-a.l);
  const recov=worst===1&&uniq.some(m=>/récupération|48 ?h|lendemain|veille/i.test(typeof m==="string"?m:(m.t||m.txt||"")));
  return{worst,msgs:uniq,title:recov?"Récupération probablement réduite":VERDICT[worst]};
}
function suggestDate(id){
  const s=sessionById(id);const t=todayISO();const c=[];
  for(let i=-6;i<=8;i++){const d=addDays(s.origDate,i);if(d===s.date||d<t||d<PERIOD_START||d>PERIOD_END)continue;
    if(sessions().some(x=>x.id!==id&&x.date===d&&!isOpt(x)))continue;
    const a=analyze(id,d);if(a.worst<2)c.push({d,score:a.worst*20+a.msgs.length*3+Math.abs(i)})}
  c.sort((a,b)=>a.score-b.score);return c[0]?c[0].d:null;
}

