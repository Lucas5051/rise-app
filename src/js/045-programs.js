/* =====================================================================
   DOMAINE · PROGRAMMES (modèle générique multi-client)
   Coach → Clients → Programme attribué → Blocs → Semaines → Séances → Phases → Exercices
   - PL.programs[id]    : modèles créés par le coach (jamais modifiés par une attribution)
   - PL.assignments[id] : attribution à un client = COPIE du modèle (personnalisable sans toucher au modèle)
   - Dates relatives : la semaine 1 commence le lundi de la semaine de la date de démarrage.
   - Le programme historique de Lucas est enregistré ici (engine:"lucas-2026") ; ses séances restent calculées
     par le moteur de 20-planning-lucas.js (matchs réels, Caen), ses données ne servent à personne d'autre.
   ===================================================================== */
const PROG_STATUS={draft:"Brouillon",active:"Actif",archived:"Archivé"};
const ASG_STATUS={active:"En cours",ended:"Terminée",paused:"En pause"};
const DAYS_L=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const FAM_L={heavy:"Force (jambes)",power:"Puissance",upper:"Haut du corps",light:"Légère / récupération"};
const PROG_LEVELS=[["debutant","Débutant"],["intermediaire","Intermédiaire"],["avance","Avancé"],["competition","Compétition"]];
const DEFAULT_RULES={volume:true,power:true,micro:true,upper:true,active:true,targeted:true,move:true};
const RULE_L={volume:"Réduction du volume",power:"Retrait des sauts et lancers",micro:"Microdose",upper:"Haut du corps uniquement",active:"Récupération active",targeted:"Réduction ciblée",move:"Déplacement par l'athlète"};
const pid=p=>uid(p);
const mondayOf=d=>addDays(d,-((D(d).getDay()+6)%7));
const deep=o=>JSON.parse(JSON.stringify(o));
const lastCmj=()=>{const t=(S.tests||[]).filter(x=>isNum(x.cmj)).sort((a,b)=>a.date<b.date?-1:1).pop();return t?+t.cmj:null};

function newSession(o={}){return{id:pid("ps"),day:0,time:"Soir",name:"Nouvelle séance",short:"",goal:"",dur:60,int:"Modérée",rpe:6,fam:"heavy",optional:false,
  wu:deep(WU.lower.items),wuMin:WU.lower.min,cd:deep(COOL.lower.items),cdMin:COOL.lower.min,main:[],...o}}
function newWeek(label){return{id:pid("pw"),label:label||"",note:"",sessions:[]}}
function newBlock(name){return{id:pid("pb"),name:name||"Bloc",goal:"",weeks:[newWeek("Semaine 1")]}}
function newProgram(o={}){const t=nowISO();return{id:pid("prog"),name:"Nouveau programme",description:"",goal:"",sport:"",level:"intermediaire",
  createdAt:t,createdBy:"coach",updatedAt:t,status:"draft",version:1,rules:{...DEFAULT_RULES},blocks:[newBlock("Bloc 1")],...o}}
const progWeeks=p=>{const out=[];(p.blocks||[]).forEach((b,bi)=>(b.weeks||[]).forEach((w,wi)=>out.push({b,bi,w,wi,i:out.length})));return out};
const progSessions=p=>progWeeks(p).flatMap(x=>x.w.sessions.map(ps=>({...x,ps})));
const setsOfRows=rows=>(rows||[]).reduce((a,r)=>a+(parseInt(r.sets)||0),0);
function progStats(p){const ws=progWeeks(p),ss=progSessions(p);return{weeks:ws.length,sessions:ss.length,sets:ss.reduce((a,x)=>a+setsOfRows(x.ps.main),0)}}
const findPs=(p,psId)=>{for(const b of p.blocks||[])for(const w of b.weeks||[])for(const ps of w.sessions||[])if(ps.id===psId)return{b,w,ps};return null};
/* Duplication : nouveaux identifiants partout (aucun lien avec le modèle d'origine) */
function cloneProgram(p,over={}){const c=deep(p);c.id=pid("prog");c.createdAt=c.updatedAt=nowISO();c.version=1;c.status="draft";delete c.engine;delete c.legacy;
  c.blocks.forEach(b=>{b.id=pid("pb");b.weeks.forEach(w=>{w.id=pid("pw");w.sessions.forEach(ps=>{ps.id=pid("ps");delete ps.code})})});return Object.assign(c,over)}
function touchProgram(p,what,by="coach"){p.updatedAt=nowISO();p.version=(p.version||1)+1;PL.coachLog.unshift({at:nowISO(),by,what:what+" · « "+p.name+" »"})}

/* ---------- Attributions ---------- */
const assignmentsOf=uid=>Object.values(PL&&PL.assignments||{}).filter(a=>a.clientId===uid).sort((a,b)=>a.assignedAt<b.assignedAt?1:-1);
function assignmentOf(uid=CUR_UID){if(!uid||!PL||!PL.assignments)return null;return Object.values(PL.assignments).find(a=>a.clientId===uid&&a.status==="active")||null}
function asgWeeks(a){const ws=progWeeks(a.prog).slice(+a.startWeek||0);const mon=mondayOf(a.startDate);
  return ws.map((x,i)=>({...x,n:"S"+(i+1+(+a.startWeek||0)),s:addDays(mon,i*7)}))}
function assignProgram({clientId,programId,startDate,startWeek=0,coachId="coach",by="coach",custom=null,note=""}){
  const P=PL.programs[programId];if(!P)throw new Error("Programme introuvable");
  const t=nowISO();
  assignmentsOf(clientId).filter(a=>a.status==="active").forEach(a=>{a.status="ended";a.endDate=a.endDate&&a.endDate<startDate?a.endDate:addDays(startDate,-1);a.history.push({at:t,by,what:"Attribution terminée (nouveau programme attribué)"})});
  const id=pid("asg");const prog=custom||deep(P);
  const ws=progWeeks(prog).slice(+startWeek||0);const end=addDays(mondayOf(startDate),ws.length*7-1);
  const a={id,clientId,programId,programVersion:P.version||1,coachId,startDate,endDate:end,startWeek:+startWeek||0,status:"active",assignedAt:t,customized:!!custom,prog,
    history:[{at:t,by,what:"Programme « "+P.name+" » attribué, démarrage le "+startDate+(+startWeek?" à la semaine "+(+startWeek+1):"")+(note?" ("+note+")":"")}]};
  PL.assignments[id]=a;PL.coachLog.unshift({at:t,by,uid:clientId,what:"Programme « "+P.name+" » attribué à "+accountName(PL.accounts[clientId])});
  if(PL.accounts[clientId]){PL.accounts[clientId].programId=programId;if(!PL.accounts[clientId].coachId)PL.accounts[clientId].coachId=coachId}
  plSave();return a}
function asgLog(a,what,by="coach"){a.history.push({at:nowISO(),by,what});a.customized=true;plSave()}

/* ---------- Séances générées ---------- */
function genericSlots(){const a=assignmentOf(CUR_UID);if(!a||a.prog.engine)return[];const out=[];
  asgWeeks(a).forEach(W=>W.w.sessions.forEach(ps=>{const date=addDays(W.s,+ps.day||0);if(date<a.startDate||(a.endDate&&date>a.endDate))return;
    out.push({id:"G-"+a.id+"-"+ps.id,date,origDate:date,week:W.n,wtype:"prog",lvl:W.w.label||W.b.name,slot:"programme",defaultCode:"G:"+ps.id,timeLabel:ps.time||"",cond:false,optional:!!ps.optional,gen:true,aid:a.id,psid:ps.id})}));
  return out}
const rowToX=r=>{const lib=exLib(r.n);return X({n:r.n,sets:isNum(r.sets)?+r.sets:r.sets,reps:String(r.reps||""),rir:r.rir||"—",rest:r.rest||"90 s",cat:r.cat||"main",
  cue:r.cue||lib.cues.join(" "),alt:r.alt||lib.alt||"—",load:r.load||"",lift:r.lift||undefined,pct:isNum(r.pct)?+r.pct:undefined,ss:r.ss||undefined,tempo:r.tempo||undefined,
  z:r.z||lib.z||[],plyo:!!lib.plyo,check:!!r.check,presc:isObj(r.presc)&&r.presc.mode?r.presc:undefined})};
function genTpl(s){return memo("gt:"+s.id,()=>{const a=PL.assignments[s.aid];const f=a&&findPs(a.prog,s.psid);
  if(!f)return{short:"?",name:"Séance supprimée du programme",goal:"",dur:0,int:"—",rpe:0,fam:"light",gen:true,wuObj:{t:"Échauffement",min:0,items:[]},cdObj:{t:"Retour au calme",min:0,items:[]},fn:()=>[]};
  const ps=f.ps;return{short:ps.short||String(ps.name).slice(0,6),name:ps.name,goal:ps.goal||"",dur:+ps.dur||0,int:ps.int||"—",rpe:+ps.rpe||null,fam:ps.fam||"heavy",gen:true,
    wuObj:{t:"Échauffement",min:+ps.wuMin||0,items:ps.wu||[]},cdObj:{t:"Retour au calme",min:+ps.cdMin||0,items:ps.cd||[]},
    stop:ps.fam==="power"?STOP_POWER:STOP_STD,fn:()=>(ps.main||[]).map(rowToX)}})}

/* ---------- Période active du compte chargé (remplace la période fixe 12/10 → 31/12) ---------- */
function legacyActive(){return !!(S&&S.profile&&S.profile.ctx===LUCAS.ctx)}
function setPeriod(){
  if(legacyActive()){WEEKS=WEEKS_LUCAS;PERIOD_START=LUCAS.period.start;PERIOD_END=LUCAS.period.end;return}
  const a=assignmentOf(CUR_UID);
  if(a&&!a.prog.engine){const ws=asgWeeks(a);WEEKS=ws.map(W=>({n:W.n,s:W.s,type:"prog",label:W.w.label||"",block:W.b.name,wid:W.w.id}));PERIOD_START=a.startDate;PERIOD_END=a.endDate||addDays(a.startDate,6);return}
  WEEKS=[];const acc=PL&&PL.accounts&&PL.accounts[CUR_UID];PERIOD_START=acc&&acc.createdAt?acc.createdAt.slice(0,10):todayISO();PERIOD_END=addDays(todayISO(),365);
}
/* Bornes du calendrier : mois de tous les programmes attribués (passés et en cours) + mois courant */
function calBounds(){const t=todayISO();let lo=t,hi=t;
  if(legacyActive()){lo=LUCAS.period.start<lo?LUCAS.period.start:lo;hi=LUCAS.period.end>hi?LUCAS.period.end:hi}
  assignmentsOf(CUR_UID).forEach(a=>{if(a.startDate<lo)lo=a.startDate;if(a.endDate&&a.endDate>hi)hi=a.endDate});
  return{min:lo.slice(0,7),max:addDays(hi,31).slice(0,7)}}

/* ---------- Programme historique de Lucas : enregistrement dans la nouvelle structure ---------- */
const exRowFromX=e=>({n:e.n,sets:e.sets,reps:e.reps,rir:e.rir,rest:e.rest,cat:e.cat,cue:e.cue,alt:e.alt,lift:e.lift,pct:e.pct,ss:e.ss,tempo:e.tempo,z:e.z,check:!!e.check});
function legacyProgramSnapshot(){
  const slots=baseSlotsFor(BASE_CLUB);
  const mkSess=x=>{const T=TYPES[x.defaultCode];const wu=T.wu?WU[T.wu]:null;const cd=cdOf(T);
      return{id:"ls-"+x.id,code:x.defaultCode,day:(diff(mondayOf(x.date),x.date)),time:x.timeLabel,name:T.name,short:T.short,goal:T.goal,dur:T.dur,int:T.int,rpe:T.rpe,fam:T.fam,optional:!!x.optional,
        wu:wu?deep(wu.items):[],wuMin:wu?wu.min:0,cd:deep(cd.items),cdMin:cd.min,main:T.fn({lvl:x.lvl,date:x.date}).map(exRowFromX)}};
  /* Une semaine de programme = 7 jours ; la trêve (11 jours) occupe donc deux semaines */
  const mkWeek=w=>{const lab=WTYPE[w.type]+" · "+LVL[weekLevelFrom(BASE_CLUB.filter(e=>e.kind==="match"),w)];const own=slots.filter(x=>x.week===w.n);
    const mons=[...new Set(own.map(x=>mondayOf(x.date)))].sort();if(!mons.length)mons.push(w.s);
    return mons.map((m,i)=>({id:"lw-"+w.n+(i?"-"+i:""),label:lab+(i?" (suite)":""),note:"",sessions:own.filter(x=>mondayOf(x.date)===m).map(mkSess)}))};
  return{id:LUCAS.programId,name:"Programme historique · Lucas (oct.–déc. 2026)",description:"Programme personnel migré de la version précédente. Ses séances sont recalculées par le moteur historique selon les matchs réels, les entraînements à Caen et les semaines d'alternance ou de cours.",
    goal:"Force maximale et force horizontale en saison, fraîcheur pour les matchs",sport:"football",level:"competition",createdAt:"2026-10-12T00:00:00.000Z",createdBy:"coach",updatedAt:nowISO(),status:"active",version:1,
    rules:{...DEFAULT_RULES},engine:LUCAS.ctx,legacy:true,
    blocks:[{id:"lb-saison",name:"Bloc en saison",goal:"Force et force horizontale, fraîcheur pour les matchs",weeks:WEEKS_LUCAS.filter(w=>w.type!=="treve").flatMap(mkWeek)},
            {id:"lb-treve",name:"Trêve",goal:"Récupération active",weeks:WEEKS_LUCAS.filter(w=>w.type==="treve").flatMap(mkWeek)}]}}
function ensureLucasProgram(){
  if(!PL.accounts[LUCAS.uid])return false;let ch=false;
  if(!PL.programs[LUCAS.programId]){PL.programs[LUCAS.programId]=legacyProgramSnapshot();ch=true}
  if(!PL.assignments[LUCAS.assignmentId]){const P=PL.programs[LUCAS.programId];
    PL.assignments[LUCAS.assignmentId]={id:LUCAS.assignmentId,clientId:LUCAS.uid,programId:P.id,programVersion:1,coachId:"coach",startDate:LUCAS.period.start,endDate:LUCAS.period.end,startWeek:0,status:"active",
      assignedAt:nowISO(),customized:false,prog:{engine:P.engine,legacy:true,name:P.name,blocks:[]},history:[{at:nowISO(),by:"migration",what:"Programme historique attribué automatiquement (migration vers la structure multi-client)"}]};ch=true}
  if(ch){PL.meta.migrations.push({from:3,to:4,at:nowISO(),notes:["Programme historique de Lucas enregistré comme programme ("+LUCAS.programId+") et attribué à son compte."]});plSave()}
  return ch}

/* ---------- Estimation de durée (temps d'exécution + repos + transitions) ----------
   Utilisée dans l'éditeur du coach et pour la revue des volumes. Hypothèses affichées : ≈ 3,5 s par répétition
   (5 s avec tempo lent, 2 s pour les sauts), 45 s de transition entre exercices. */
function estimateMain(rows){let t=0;rows.forEach(e=>{const sets=parseInt(e.sets)||1;const r=String(e.reps||"");
  let work;let m=r.match(/(\d+)\s*min/);if(m)work=+m[1]*60;else if((m=r.match(/(\d+)\s*s\b/)))work=+m[1]*(/côté|jambe|bras/.test(r)?2:1);else if(/\d+\s*m\b/.test(r))work=12;
  else{m=r.match(/(\d+)(?:-(\d+))?/);const n=m?(m[2]?(+m[1]+ +m[2])/2:+m[1]):5;work=n*(e.plyo||e.check?2:e.tempo?5:3.5)*(/côté|jambe|bras/.test(r)?2:1)}
  const rest=restSecs(e.rest)||(String(e.rest||"").trim().startsWith("—")?0:60);t+=sets*work+Math.max(0,sets-1)*rest+(e.ss&&/1$/.test(e.ss)?0:45)});return Math.round(t/60)}
function estimatePs(ps){return(+ps.wuMin||0)+estimateMain((ps.main||[]).map(r=>({...r,plyo:exLib(r.n).plyo})))+(+ps.cdMin||0)}

/* Journal des modifications (visible dans Entraînement › Planification et dans l'espace coach) */
const LIFT_NAME={squat:"Squat",bench:"Développé couché",rdl:"Roumain",pull:"Tractions",dm:"Militaire haltères"};
const CHANGES=[
 {t:"Serveur et synchronisation (version 10)",prev:"Comptes, codes d'invitation et données rangés sur un seul appareil.",chg:"Comptes, rôles, programmes, invitations et séances sont sur le serveur (Supabase, Paris). Tes données v9 sont importées sur ton compte ; l'appli fonctionne hors ligne et envoie tout au retour du réseau.",why:"Un client doit pouvoir utiliser son propre téléphone et le coach recevoir ses séances.",eff:"Ta planification, tes tests du 12/10 et tes statuts ne changent pas.",src:"Cahier des charges v10 (24/10)."},
 {t:"Douleur : plus de séance « haut du corps » automatique",prev:"Une douleur signalée proposait une séance haut du corps.",chg:"L'appli demande la zone, l'intensité, l'apparition, le mouvement qui déclenche et la gêne au repos, puis propose une option prudente (retrait ciblé, volume réduit, récupération, repos) à confirmer. Douleur importante, au repos ou qui dure : arrêt des exercices concernés et avis d'un professionnel de santé.",why:"Une douleur à l'épaule ou au dos rend une séance haut du corps inadaptée.",eff:"Aucun diagnostic ; rien n'est appliqué sans ton accord. Les correspondances zone ↔ exercices sont une interprétation prudente de l'appli : les cours fournis ne traitent pas ce point.",src:"Cahier des charges v10 (24/10)."},
 {t:"Charges calculées et règles du coach respectées",prev:"Charge en texte libre dans l'éditeur ; adaptations interdites par le coach parfois proposées.",chg:"Charge fixe, % du 1RM, % d'un test, poids du corps, RPE, RIR, durée, distance… avec arrondi au matériel. Sans test, aucune charge n'est inventée (« Test requis »). Une adaptation interdite n'est jamais proposée : l'appli prend l'option autorisée la plus prudente ou te demande de contacter ton coach.",why:"Des charges vérifiables et un coach qui garde la main.",eff:"Les séances déjà réalisées gardent leur charge d'origine.",src:"Cahier des charges v10 (24/10). Formule du 1RM : Brzycki (déjà utilisée en v9), affichée à chaque calcul."},
 {t:"Revue des volumes v9 (22/10, soir)",prev:"Force bloc de charge 28 séries ; Principale haut du corps et récupération 26 séries ; Puissance + force bloc de charge 26 séries.",chg:"Force bloc de charge : hip thrust retiré (25 séries, 70 min). Haut du corps et récupération : couché et tractions 4 → 3, élévations et face pull 3 → 2 (22 séries, 60 min). Puissance + force bloc de charge : inchangée.",why:"Lendemain de match = récupération active ; en saison, volume réduit et intensité maintenue ; la séance de puissance respecte déjà les fourchettes du cours.",eff:"Moins de fatigue au lendemain du match et avant les entraînements club, même intensité sur les exercices principaux.",src:"Cours Planification p. 45, 46, 54 ; Prévention p. 23, 33 ; Pliométrie p. 25 ; Développement des qualités physiques p. 30."},
 {t:"Durée réelle des séances",prev:"« Marquer réalisée » enregistrait la durée prévue comme durée réelle.",chg:"Une fenêtre demande la durée, ou les heures de début et de fin, ou « Je ne sais plus » (durée à confirmer). Le RPE est demandé tout de suite ou plus tard. Une séance adaptée exige toujours une raison et un commentaire.",why:"La charge sRPE = RPE × durée n'a de sens qu'avec la durée réelle.",eff:"Plus aucune durée inventée dans le suivi.",src:"Cours Quantification de la charge p. 9-10 (Foster) ; cours Planification p. 50."},
 {t:"Plateforme multi-client (version 9)",prev:"Seul ton profil avait un programme ; période fixe du 12/10 au 31/12/2026.",chg:"Ton programme est enregistré comme « Programme historique » et t'est attribué ; le coach peut créer, dupliquer, attribuer et personnaliser des programmes pour d'autres clients, avec des dates de démarrage libres.",why:"Passer d'une appli personnelle à une plateforme coach + athlètes.",eff:"Aucun changement sur tes séances, tes tests, tes statuts ou ton historique.",src:"Cahier des charges du 22/10."},
 {t:"Plateforme athlète + coach (version 3)",prev:"Appli personnelle à 5 onglets, maquette coach dans l'appli athlète.",chg:"Comptes (inscription guidée, code coach), 4 onglets athlète (Accueil, Calendrier, Entraînement, Suivi) + paramètres derrière l'engrenage, lecteur de séance en 3 phases chronométrées, statuts avec raisons, espace coach séparé. Plus aucune dépendance à une appli externe : la plateforme gère ses propres données.",why:"Proposer l'application à des clients, avec un espace coach réservé.",eff:"Toutes tes données existantes sont conservées (copie de sauvegarde avant migration).",src:"Cahier des charges du 22/10/2026."},
 {t:"Volumes des séances révisés",prev:"Plusieurs séances dépassaient leur durée annoncée (jusqu'à 99 min estimées pour 70 min).",chg:"Volumes réduits ou durées réalignées, échauffement et retour au calme inclus : détail séance par séance dans « Révision des volumes ».",why:"Des séances réalisables dans la durée affichée.",eff:"Moins d'exercices redondants, même intention par séance.",src:"Cours Planification (séance force/puissance 45-60 min) ; cours Prévention (retour au calme 5-10 min) ; cours Pliométrie (échauffement ≈ 10 min)."},
 {t:"Cloche des alertes",prev:"Compteur « série » en haut de l'accueil.",chg:"Cloche avec le nombre d'alertes : adaptation proposée, fatigue, douleur, autre activité au-dessus de ta zone, RPE à noter, questionnaire à remplir, messages du coach.",why:"Voir ses alertes d'un coup d'œil.",eff:"Toucher une alerte ouvre l'écran concerné.",src:"Ta demande du 22/10."},
 {t:"Chat de groupe + messages privés (maquette)",prev:"Messagerie privée coach ↔ client seulement.",chg:"Chat de groupe (tous les clients + le coach) avec photos et vidéos, et conversation privée séparée. Le coach écrit à tout le monde en un seul message.",why:"Créer de l'entraide entre clients et répondre à tous d'un coup.",eff:"Maquette : rien n'est réellement envoyé ; les vidéos ne sont pas conservées après rechargement.",src:"Ta demande du 22/10."},
 {t:"Messagerie et interface coach (maquette)",prev:"Pas de lien entre client et coach dans l'appli.",chg:"Côté client : bouton Messages, conversation avec le coach, question liée à une séance. Côté coach : tableau de bord des clients (ressenti, régularité, alertes), boîte de réception, réponses, alertes automatiques (douleur, ressenti bas, allègement accepté).",why:"Préparer l'interface clients / coach.",eff:"Maquette : données fictives sur cet appareil, aucun message réellement envoyé.",src:"Ta demande du 22/10."},
 {t:"Motivation : courbe, badges, récompenses, bilans",prev:"Série de séances seulement.",chg:"Courbe ressenti / charge sur 28 jours, badges d'assiduité (questionnaire, séances, semaines parfaites), récompenses (repas plaisir, écart sucré), félicitations avant/après quand une charge, le volume ou un 1RM progresse, bilan de la semaine (dimanche et lundi). Questionnaire de charge habituelle supprimé : la charge prévue du programme le remplace.",why:"Donner envie de revenir dans l'appli sans ajouter de questionnaire.",eff:"Retour visible sur tes données et sur ta progression.",src:"Saw et al. 2015 (retour sur les données, faible contrainte) ; Ryan et Deci 2000 (compétence)."},
 {t:"Rappels du questionnaire du jour",prev:"Aucun rappel.",chg:"Rappels à l'heure de ton choix (jusqu'à 3 heures, jours au choix) : calendrier de l'iPhone (.ics avec alerte), bandeau dans l'appli ouverte, notifications locales dans l'appli iOS.",why:"Ne pas oublier le questionnaire du matin.",eff:"Le rappel s'affiche seulement si le questionnaire n'est pas encore rempli (dans l'appli).",src:"Ta demande du 22/10."},
 {t:"Autres activités (padel, tennis, vélo…)",prev:"Seuls le foot et la muscu comptaient dans la charge.",chg:"Saisie d'une autre activité (10 sports + « autre »), commentaire lu pour adapter la séance ; plafond personnel calculé sur ta charge habituelle (ACWR du cours, monotonie et contrainte de Foster), durée × RPE ajoutée à la journée, plafond d'UA du jour selon le contexte du match, 3 niveaux de réponse.",why:"Ne pas ignorer la charge d'un sport pratiqué en plus.",eff:"Dans le plafond : rien. Un peu au-dessus : recommandation. Nettement au-dessus : alerte et adaptation proposée (avec ton accord).",src:"Charge sRPE : cours Quantification (Foster). Profils des sports : 2 articles PubMed par sport (références dans le code de l'appli). Plafond : zones ACWR et seuils de monotonie/contrainte du cours Planification ; Foster 1998 (seuils individuels)."},
 {t:"Semaines de cours : entraînements à Caen",prev:"Club le mercredi et le vendredi soir ; muscu lundi, mardi et jeudi soir.",chg:"À partir du 26/10 : mercredi libre, entraînement à Caen le jeudi soir par défaut (modifiable chaque semaine : mardi, jeudi ou les deux), vendredi soir obligatoire. Muscu lundi, mardi et mercredi soir.",why:"Nouveau rythme d'entraînement à Caen ; 3 séances de muscu possibles en semaine de cours. Jeudi plutôt que mardi : les jambes lourdes du lundi ne tombent pas la veille d'un entraînement foot.",eff:"Lundi force, mardi haut du corps, mercredi puissance. Pas de muscu un soir où tu as foot.",src:"Ton message du 21/10."},
 {t:"Tests réalisés le lundi 12 octobre",prev:"PDF : tests le jeudi 15/10 au matin.",chg:"Tests le lundi 12/10 (date réelle). Le jeudi 15 devient haut du corps + prévention (Nordic, Copenhagen).",why:"Les tests ont eu lieu le 12. Ils étaient à J+1 du match du 11/10 : la fatigue a pu sous-estimer légèrement les 3RM.",eff:"Charges calculées à partir des tests du 12/10. Un retest les recalcule automatiquement.",src:"Cours Planification : J+1 = récupération, surcompensation en 24 à 72 h."},
 {t:"Séances recalculées selon le jour du match",prev:"PDF : alternance = H le lundi + FP le jeudi, quel que soit le match.",chg:"Lundi après un match le dimanche (J+1) : principale haut du corps, gainage, mobilité, récupération des jambes. Après un match le samedi (J+2) ou sans match : principale de force. Ajouter, reporter ou annuler un match recalcule les séances.",why:"Ta demande, et la règle des 48 h avant/après une sollicitation lourde des jambes.",eff:"La force lourde des jambes se fait surtout en semaine de cours, en J+2 ou loin du match.",src:"Cours Force sur terrain (48 h après la force maximale) ; cours Planification (microcycle J+1 à J-1)."},
 {t:"Jeudi conditionnel",prev:"PDF : séance force + puissance complète le jeudi matin.",chg:"Jeudi = séance conditionnelle : J-3 → puissance faible volume + quelques séries de force ; J-2 → microdose ; veille ou lendemain de match → haut du corps + mobilité. L'appli propose de l'alléger selon la charge réelle de mardi et mercredi.",why:"Le mercredi est souvent la séance club la plus chargée et le vendredi contient de la vitesse.",eff:"Moins de risque d'arriver fatigué au vendredi et au match.",src:"Cours Planification (affûtage en saison : réduire le volume, garder l'intensité) ; cours Pliométrie (récupération nerveuse plus longue)."},
 {t:"Sprints retirés du jeudi, traîneau lourd ajouté",prev:"PDF : départs arrêtés et sprints résistés le jeudi.",chg:"Pas de sprints le jeudi. La force horizontale est travaillée par la poussée de traîneau lourde dans la séance de force, plus hip thrust et bonds horizontaux.",why:"Le vendredi club comporte déjà une partie vitesse. Ton F0 (6,93 N/kg) est sous 7 N/kg.",eff:"Pas de deuxième grosse séance de vitesse dans la semaine ; travail du F0 conservé.",src:"Cours Analyse des profils F-V avec My Sprint (F0 faible : force maximale, traîneau lourd 50-80 % du poids de corps, pliométrie horizontale)."},
 {t:"Séances du dimanche supprimées",prev:"Plan v3 : hypertrophie du bas du corps le dimanche 13 et le 20/12.",chg:"Supprimées. Le volume du bloc de charge est intégré au lundi 14/12 (force · bloc de charge) et au jeudi 10/12.",why:"Tes disponibilités confirmées ne comprennent pas le dimanche.",eff:"Bloc de charge un peu moins volumineux. À confirmer si tu es disponible ces dimanches.",src:"Tes contraintes de disponibilité (décision à confirmer)."},
 {t:"Roumain et tractions sans calcul arbitraire",prev:"Appli précédente : charges calculées pour le roumain et lest calculé à partir de reps au poids du corps.",chg:"Roumain : « charge à ajuster au RIR 2 » tant qu'aucune référence au roumain n'existe. Tractions : poids du corps, plage de reps et RIR.",why:"Ton test est un soulevé de terre classique, et 11 reps au poids du corps ne permettent pas un calcul de lest fiable.",eff:"Prescriptions plus prudentes, recalculées dès que tu ajoutes une référence.",src:"Ta demande ; formule de Brzycki réservée aux tests à faibles répétitions."},
 {t:"Statuts et série",prev:"Appli précédente : séance passée non validée = non réalisée.",chg:"Séance passée sans réponse = « À renseigner » (neutre). Rouge et gris seulement après ton choix.",why:"Ta demande.",eff:"La série n'est cassée que par une séance marquée « Non réalisée ».",src:"Ta demande."},
 {t:"Charge réelle séparée de la charge prévue",prev:"Appli précédente : charge estimée à partir du plan.",chg:"sRPE = durée réelle × RPE noté environ 30 min après. Les séances non réalisées, annulées ou non renseignées ne comptent pas.",why:"Le cours définit la charge interne par le sRPE de Foster.",eff:"Les références personnelles se construisent à partir de tes vraies séances.",src:"Cours Quantification de la charge de travail (Foster, échelle CR10, 5 = difficile)."},
 {t:"Questionnaire de bien-être intégré à l'appli",prev:"Score reporté à la main depuis une autre appli, avec des cases à cocher.",chg:"Questionnaire quotidien dans l'appli : 5 curseurs (sommeil, fraîcheur, courbatures, stress, humeur), poids et commentaire (CMJ et douleur retirés le 21/10 à ta demande : la douleur va dans le commentaire). Score sur 100 + indice de Hooper sur 28.",why:"Gérer ses propres données ; calibrer le questionnaire sur les cours.",eff:"Alertes basées sur ta moyenne personnelle, sur les items très bas, et sur les courbatures de plus de 72 h.",src:"Cours Planification (sommeil, fatigue, douleurs, humeur, stress) ; cours Quantification (Hooper, 4 critères de 1 à 7, score sur 28 ; POMS pour l'humeur) ; cours Pliométrie (courbatures > 72 h, Bompa et Haff)."},
 {t:"Trêve",prev:"PDF : 7 à 10 jours de repos actif, non détaillés.",chg:"Trois séances optionnelles de récupération active (23, 26 et 29/12) : 30-40 min à 50-60 % FC max + mobilité.",why:"Récupérer du bloc de charge sans arrêt complet.",eff:"Reprise de janvier dans de meilleures conditions.",src:"Cours Planification (trêve hivernale, récupération active à 50-60 % FC max)."},
 {t:"Point de vigilance : Nordic",prev:"Objectif : 2 Nordic par semaine.",chg:"2 par semaine la plupart du temps (lundi léger selon les sensations + séance de force ou puissance). 1 seul en semaine à deux matchs.",why:"Pas de Nordic à J-2 : risque de courbatures le jour du match.",eff:"Dose légèrement sous l'objectif certaines semaines.",src:"Cours Prévention des blessures (van Dyk 2019 : au moins 2 séances par semaine pendant 10 semaines)."}
];

