/* =====================================================================
   PLAFOND PERSONNEL (remplace les marges fixes de départ)
   - Charge habituelle (chronique) = moyenne hebdomadaire des 28 jours qui précèdent la semaine analysée (cours Planification : ACWR ;
     version découplée pour que la semaine en cours ne se compte pas elle-même).
     Avant d'avoir 28 jours dans l'appli, les jours manquants sont complétés par la charge prévue du programme.
   - Charge aiguë = 7 derniers jours (réel quand c'est renseigné, sinon prévu) avec l'activité ajoutée.
   - Zones du cours Planification : ACWR 0,8-1,2 = progression saine ; > 1,5 = risque de blessure augmenté.
     ≤ 1,2 : rien ne change · 1,2 à 1,5 : recommandation · > 1,5 : alerte + adaptation proposée.
   - Foster (1998) : monotonie = moyenne / écart-type des charges quotidiennes sur 7 jours (repos compris),
     contrainte = charge de la semaine × monotonie ; seuils d'alerte du cours : monotonie > 2, contrainte > 6000.
   - L'ACWR est un repère et non une preuve de cause à effet (Impellizzeri 2020) : jamais de modification automatique.
   ===================================================================== */
function dayExpected(date){
  let v=0;
  activeClub().filter(e=>e.date===date).forEach(e=>{const r=srpe(e.actual);v+=r!=null?r:(+e.dur||0)*(+e.plannedRPE||0)});
  sessions().filter(s=>s.date===date&&!isOpt(s)).forEach(s=>{const st=statusOf(s);if(st==="missed"||st==="fatigue")return;const r=srpe(S.log[s.id]);v+=(st==="done"||st==="adapted")&&r!=null?r:plannedLoadOfSession(s)});
  otherOn(date).forEach(o=>v+=srpe(o));
  return Math.round(v);
}
/* Avant les données de l'appli (jours avant le 12/10) : charge estimée = charge PRÉVUE moyenne des 4 premières semaines du programme
   (pas de questionnaire supplémentaire). Dès que l'appli a 4 semaines de données, seules tes séances comptent. */
function baseWeekly(){return memo("baseW",()=>{let t=0;for(let i=0;i<28;i++)t+=dayLoad(addDays(PERIOD_START,i)).planned;return Math.round(t/4)})}
function loadDay(d){return d<PERIOD_START?null:dayExpected(d)}
function chronicInfo(date){
  const bw=baseWeekly();let sum=0,real=0,est=0;
  // 28 jours AVANT la semaine analysée (ratio « découplé ») : l'activité du jour ne compte pas à la fois dans la semaine et dans l'habituel.
  for(let i=7;i<35;i++){const d=addDays(date,-i);const v=loadDay(d);if(v==null){if(bw!=null){sum+=bw/7;est++}}else{sum+=v;real++}}
  if(real+est<7)return{weekly:null,real,est,src:"aucune"};
  const weekly=sum/(real+est)*7;
  return{weekly:Math.round(weekly),real,est,src:est===0?"tes 4 semaines précédentes":real===0?"la charge prévue de ton programme":"tes "+real+" jours dans l'appli + la charge prévue de ton programme pour les "+est+" autres"};
}
function acuteInfo(date){
  const bw=baseWeekly();const days=[];
  for(let i=6;i>=0;i--){const d=addDays(date,-i);const v=loadDay(d);days.push(v==null?(bw!=null?bw/7:0):v)}
  const total=days.reduce((a,b)=>a+b,0),m=total/7,sd=Math.sqrt(days.reduce((a,b)=>a+(b-m)*(b-m),0)/7);
  const mono=sd>0?m/sd:null;return{total:Math.round(total),mono,strain:mono!=null?Math.round(total*mono):null};
}
function otherVerdict(date){
  const st=S.settings,c=matchCtx(date),ch=chronicInfo(date),ac=acuteInfo(date),acts=otherOn(date),expected=dayExpected(date);
  const zone=+st.otZone||1.2,alert=+st.otAlert||1.5;
  const ratio=ch.weekly?ac.total/ch.weekly:null;
  let tier=ratio==null?0:ratio<=zone?0:ratio<=alert?1:2;const extra=[];
  if((c.dn===0||c.dn===1)&&acts.length&&tier<1){tier=1;extra.push(c.dn===0?"jour de match":"veille de match")}
  if(ac.mono!=null&&ac.mono>(+st.monoMax||2)&&ac.strain>(+st.strainMax||6000)&&tier<1){tier=1;extra.push("monotonie et contrainte élevées")}
  const limit=ch.weekly?Math.round(ch.weekly*zone):null,room=limit!=null?limit-ac.total:null;
  return{date,ctx:c,acts,expected,ratio,tier,chronic:ch,acute:ac,limit,room,extra,noBase:!ch.weekly};
}
const OT_TIER=["Dans la zone","Un peu au-dessus","Nettement au-dessus"];
/* Prochaine séance de muscu concernée : même jour (si pas encore faite) ou dans les 2 jours suivants. */
function dayCommentSignals(date){const out={legs:false,calf:false,post:false,upper:false,tired:false,pain:false,list:[]};
  const add=sg=>{["legs","calf","post","upper","tired","pain"].forEach(k=>{if(sg[k])out[k]=true});sg.list.forEach(l=>{if(!out.list.includes(l))out.list.push(l)})};
  otherOn(date).forEach(o=>add(commentSignals(o.comment)));
  return out;
}
/* Une proposition est faite si la journée dépasse nettement le plafond, OU si ton commentaire signale une zone fatiguée / une douleur,
   OU si tu signales une fatigue générale alors que la journée est déjà un peu au-dessus. */
function otherNeedsProposal(v,sg){return v.tier===2||sg.legs||sg.calf||sg.post||sg.upper||sg.pain||(sg.tired&&v.tier>=1)}
function nextSessionAfter(date){return sessions().find(s=>s.date>=date&&diff(date,s.date)<=2&&!isOpt(s)&&!statusOf(s))||null}
function otherAdvice(v){
  const legs=v.acts.some(o=>sportOf(o).legs>=1),up=v.acts.some(o=>sportOf(o).upper>=1);const sg=dayCommentSignals(v.date);
  if(sg.pain)return "Ton commentaire signale une douleur. L'appli ne pose aucun diagnostic : une adaptation de ta prochaine séance est proposée pour ne pas charger la zone. Si la douleur persiste, demande l'avis d'un professionnel de santé.";
  if(otherNeedsProposal(v,sg)&&v.tier<2)return "Ta charge reste "+(v.tier===0?"dans ta zone":"un peu au-dessus")+", mais ton commentaire signale : "+sg.list.join(", ")+". Une adaptation de ta prochaine séance est proposée : elle ne s'applique qu'avec ton accord.";
  if(v.noBase)return "Pas encore assez de données pour calculer ta charge habituelle.";
  if(v.tier===0)return "Ta semaine reste dans ta zone habituelle : rien ne change.";
  if(v.tier===1&&v.extra.length&&v.ratio!=null&&v.ratio<=(+S.settings.otZone||1.2))return "Ta charge de la semaine reste dans ta zone, mais attention : "+v.extra.join(", ")+". Recommandation : garde cette activité légère et récupère bien. Ta prochaine séance reste telle quelle.";
  if(v.tier===1)return "Ta semaine passe un peu au-dessus de ta charge habituelle. Recommandation : récupère bien ce soir (sommeil, hydratation, repas complet) et remplis le questionnaire demain matin. Ta prochaine séance reste telle quelle"+(legs?" ; si tes jambes sont lourdes, utilise « Alléger ».":".");
  return "Ta semaine dépasse nettement ta charge habituelle"+(legs?" et sollicite les jambes":up?" et sollicite surtout le haut du corps":"")+". Une adaptation de ta prochaine séance est proposée : elle ne s'applique qu'avec ton accord.";
}

/* Lecture du commentaire : mots-clés simples (pas d'IA). Sert uniquement à PROPOSER une adaptation, jamais à l'appliquer. */
const noAcc=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function commentSignals(txt){
  const t=noAcc(txt);if(!t.trim())return{any:false,list:[]};
  const neg=/pas (de |les |des )?(jambes? )?(lourd|fatigu|courbatur|douleur|mal)/.test(t)||/aucune? (douleur|courbature|fatigue)/.test(t);
  const sig={
   legs:/jambes?.{0,25}(lourd|fatigu|cuit|mort|dur|coton|plomb|vid)|(lourd|fatigu).{0,15}jambes?|cuisses?|quadri|courbatur.{0,25}(jambe|cuisse)/.test(t),
   calf:/mollet|achille/.test(t),
   post:/ischio|arriere (de la |des )?cuisse/.test(t),
   upper:/epaule|bras|dos|pecto|coude|poignet|trapeze/.test(t)&&/(lourd|fatigu|courbatur|douleur|mal|tir|cuit|dur)/.test(t),
   tired:/fatigu|creve|epuise|cuit|crame|vidé|vide|a fond|tres dur|intense|lessive/.test(t),
   pain:/douleur|douloureu|bless|\bmal (a|au|aux|a la)\b|j.ai mal/.test(t)&&!/pas mal/.test(t)
  };
  if(neg&&!/mais/.test(t)){sig.legs=false;sig.tired=false;sig.pain=false}
  const L={legs:"jambes lourdes ou fatiguées",calf:"mollets / tendon d'Achille",post:"ischios",upper:"haut du corps",tired:"fatigue générale",pain:"douleur"};
  const list=Object.keys(L).filter(k=>sig[k]).map(k=>L[k]);
  return{...sig,any:list.length>0,list};
}

