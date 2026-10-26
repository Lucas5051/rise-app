/* =====================================================================
   MODULE 9 · ADAPTATION DE LA MUSCULATION
   Analyse les 72 h précédentes (club, matchs, muscu) + bien-être + séances à venir.
   Ne modifie jamais rien sans confirmation : renvoie une proposition expliquée.
   ===================================================================== */
function recommendRaw(s){
  const T=tpl(s),date=s.date,ctx=matchCtx(date);
  const trig=[],targets=new Set(),notes=[];let phys=false,mech=false,pain=false,fat=false,provisional=false,highLoads=0;
  const lowerSession=T.fam==="heavy"||T.fam==="power";
  const recent=activeClub().filter(e=>{const g=diff(e.date,date);return g>=1&&g<=3});
  recent.forEach(e=>{
    const a=e.actual,lbl=(e.kind==="match"?"Match":"Club")+" "+fmtShort(e.date);
    if(!a||srpe(a)==null){if(diff(e.date,date)===1&&e.kind==="training")notes.push("La séance club de la veille ("+fmtShort(e.date)+") n'est pas renseignée : la proposition se base sur le plan seulement.");return}
    const cl=classifyLoad(e),hr=classifyHR(a);if(cl.provisional)provisional=true;
    const fl=a.flags||[];
    trig.push(lbl+" : "+cl.text+(isNum(a.hrAvg)?" · "+hr.text:"")+(fl.length?" · "+fl.filter(f=>f!=="douleur").map(f=>FLAG_LABEL[f].toLowerCase()).join(", "):""));
    if(cl.high){highLoads++;if(hr.level==="high")phys=true;else mech=true}
    if(fl.includes("sprints")){targets.add("post");targets.add("sprint")}
    if(fl.includes("accel")){targets.add("post");targets.add("calf")}
    if(fl.includes("cod"))targets.add("quad");
    if(fl.includes("duels")||fl.includes("sauts"))targets.add("plyo");
    if(fl.includes("lourdes"))targets.add("legs");
    if(fl.includes("douleur"))pain=true;
  });
  // Autres activités (padel, vélo…) le jour même ou dans les 2 jours avant : charge du jour + lecture du commentaire
  let otherLeg=false,otherUp=false;const otDays=new Set();
  otherList().forEach(o=>{const g=diff(o.date,date);if(g>=0&&g<=2)otDays.add(o.date)});
  [...otDays].sort().forEach(d=>{const v=otherVerdict(d),sg=dayCommentSignals(d);const names=v.acts.map(o=>sportOf(o).name.toLowerCase()+" "+o.dur+" min × RPE "+o.rpe).join(", ");
    if(otherNeedsProposal(v,sg)){
      trig.push("Autre activité "+fmtShort(d)+" : "+names+(v.ratio!=null?" · 7 jours à "+v.acute.total+" UA pour une charge habituelle de "+v.chronic.weekly+" UA/sem. (ratio "+v.ratio.toFixed(2).replace(".",",")+")":"")+(sg.list.length?" · commentaire : "+sg.list.join(", "):""));
      if(sg.pain)pain=true;
      if(sg.legs){otherLeg=true;targets.add("legs")}
      if(sg.calf){otherLeg=true;targets.add("calf")}
      if(sg.post){otherLeg=true;targets.add("post")}
      if(sg.upper)otherUp=true;
      v.acts.forEach(o=>{const p=sportOf(o);
        if(v.tier===2||sg.tired){if(p.legs>=1){otherLeg=true;if(p.legs>=2)(p.targets||[]).forEach(t=>targets.add(t))}if(p.upper>=1)otherUp=true}});
    }else if(v.tier===1)notes.push("Autre activité "+fmtShort(d)+" ("+names+") : "+(v.ratio!=null&&v.ratio>(+S.settings.otZone||1.2)?"semaine un peu au-dessus de ta charge habituelle (ratio "+v.ratio.toFixed(2).replace(".",",")+")":v.extra.join(", "))+". Recommandation seulement : récupère bien, la séance reste identique.")});
  // Commentaire du questionnaire du jour : douleur ou jambes lourdes signalées
  const sgW=commentSignals((S.fatigue[date]||{}).comment);
  if(sgW.any){if(sgW.pain)pain=true;if(sgW.legs||sgW.calf||sgW.post){otherLeg=true;if(sgW.legs)targets.add("legs");if(sgW.calf)targets.add("calf");if(sgW.post)targets.add("post")}if(sgW.upper)otherUp=true;
    if(sgW.pain||sgW.legs||sgW.calf||sgW.post||sgW.upper)trig.push("Commentaire du questionnaire : "+sgW.list.join(", "))}
  const fe=fatigueEval(date);
  if(fe){if(fe.high){fat=true;fe.reasons.forEach(r=>trig.push("Bien-être : "+r))}if(fe.pain)pain=true}
  if(ctx.label!=="Pas de match proche")trig.push("Contexte : "+ctx.label);
  // Choix de la proposition
  let mode="none",why=[],effect="";
  if(pain){mode="pain";why.push("Une douleur inhabituelle est signalée. L'appli ne pose aucun diagnostic : elle propose d'éviter de charger la zone et de demander l'avis d'un professionnel si la douleur persiste.");effect="Éviter d'ajouter une contrainte sur une zone douloureuse."}
  else if(phys&&fat&&lowerSession){mode=T.fam==="heavy"?"active":"micro";why.push("RPE élevé avec FC élevée (fatigue physiologique importante) et bien-être en baisse.");effect="Favoriser la récupération pour retrouver de la fraîcheur avant les prochaines séances club."}
  else if(phys&&lowerSession){mode="volume";why.push("RPE et FC élevés sur la séance récente : fatigue physiologique importante.");effect="Garder l'intensité mais réduire le volume, comme en affûtage (cours Planification)."}
  else if(fat&&fe.multi&&lowerSession){mode=T.fam==="heavy"?"active":"micro";why.push("Plusieurs signes de fatigue en même temps dans ton questionnaire ou ton CMJ. Le cours Pliométrie (Bompa et Haff) recommande alors de réduire fortement le volume (environ 50 %) ou de passer en récupération active.");effect="Laisser le temps à l'organisme de récupérer avant de recharger."}
  else if(otherLeg&&lowerSession){mode=targets.size?"targeted":"volume";why.push("Ton autre activité ou ton commentaire indiquent que les jambes ont déjà été bien sollicitées (charge de la journée au-dessus du plafond ou fatigue signalée).");effect=targets.size?"Réduire les exercices qui sollicitent les mêmes zones, garder le reste.":"Réduire le volume sans changer l'intensité."}
  else if(otherUp&&T.fam==="upper"){mode="volume";why.push("Ton autre activité ou ton commentaire indiquent que le haut du corps a déjà été bien sollicité.");effect="Réduire le volume du haut du corps sans changer l'intensité."}
  else if(targets.size&&lowerSession){mode="targeted";why.push("Les indicateurs mécaniques de la séance récente montrent des zones déjà sollicitées (correspondances du cours Quantification : sprints → ischios ; accélérations → fessiers, ischios, mollets, tendon d'Achille ; freinages → quadriceps).");if(mech)why.push("RPE élevé alors que la FC reste modérée ou n'est pas mesurée : la charge peut être surtout mécanique ou générale. La séance n'est pas considérée comme légère.");effect="Réduire les exercices qui sollicitent les mêmes zones, garder le reste."}
  else if(mech&&lowerSession){mode="volume";why.push("RPE élevé alors que la FC reste modérée ou n'est pas mesurée : fatigue générale ou charge mécanique possible. La séance n'est pas considérée comme légère.");effect="Réduire le volume sans changer l'intensité."}
  else if(fat){mode=lowerSession?"volume":"none";why.push("Ton bien-être du jour indique une fatigue élevée.");effect=lowerSession?"Réduire le volume de la séance.":"Séance déjà légère : garde-la ou passe en repos selon tes sensations."}
  if(s.cond&&highLoads>=2&&lowerSession&&mode!=="upper"){mode="micro";why.push("Plusieurs séances chargées dans les 72 h avant cette séance conditionnelle.");effect="Garder un stimulus de puissance minimal sans ajouter de fatigue."}
  const changes={none:["Séance conservée telle qu'elle est prévue."],volume:["1 série de moins par exercice","RIR + 1 sur les exercices de force"],power:["Sauts, sprints et lancers supprimés","Exercices de force conservés"],micro:["Séance remplacée par une microdose de 20 min : sauts, lancers, gainage"],upper:["Séance remplacée par haut du corps + mobilité + prévention légère"],active:["Séance remplacée par 30-40 min de vélo ou natation à 50-60 % FC max + mobilité"],targeted:[...targets].filter(t=>t!=="sprint").map(t=>"1 série de moins sur : "+ZONE_LABEL[t]).concat(targets.has("sprint")?["Sprints supplémentaires supprimés"]:[]).concat(targets.has("plyo")?["Sauts supprimés"]:[])};
  const level=mode==="none"?0:(pain||mode==="active"||mode==="micro"||mode==="upper")?2:1;
  return{mode,label:ADAPT_LABEL[mode],trig,why,changes:changes[mode]||[],effect:effect||"Aucun effet attendu : la séance reste identique.",targets:[...targets],notes,level,provisional,pain};
}

