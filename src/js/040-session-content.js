/* =====================================================================
   MODULE 5 · CONTENU DES SÉANCES
   cat : main (principal) · acc (accessoire) · prev (prévention)
   z   : zones sollicitées pour les réductions ciblées (post = chaîne postérieure, quad, calf = mollets/tendon d'Achille, plyo = impacts, add = adducteurs)
   lift: squat · bench · rdl · pull · dm (charges calculées à partir des tests)
   ===================================================================== */
/* Échauffements et retours au calme STRUCTURÉS : un objet par exercice
   {n: nom, dose: durée ou répétitions, cue: consigne courte, type, alt: alternative}.
   Sources : cours Prévention p. 32 (échauffement 10-15 min, retour au calme 5-10 min), cours Pliométrie p. 26. */
const W=(n,dose,type,cue,alt)=>({n,dose,type,cue,alt:alt||""});
const WU={
 lower:{t:"Échauffement bas du corps",min:12,items:[
  W("Vélo ou rameur progressif","5 min","cardio","Commence très facile et accélère un peu chaque minute.","Corde à sauter légère ou marche rapide"),
  W("Genou au mur (cheville)","2 × 8 / côté","mobilité","Talon au sol, le genou avance vers le mur sans que le talon décolle.","Fente basse avec poids sur le genou avant"),
  W("90/90 hanches","2 × 5 / côté","mobilité","Assis, les deux genoux à 90°, bascule d'un côté à l'autre en gardant le buste droit.",""),
  W("Fente avec rotation du buste","2 × 5 / côté","mobilité","Grande fente, tourne le buste vers la jambe avant.",""),
  W("Pont fessier","2 × 10","activation","Serre les fessiers en haut, sans cambrer.","Pont fessier unilatéral"),
  W("Gainage latéral","2 × 20 s / côté","activation","Corps aligné, hanche haute.","Gainage latéral genoux au sol"),
  W("Sauts verticaux progressifs","3 sauts (60, 80, 100 %)","spécifique","Réception souple et silencieuse.",""),
  W("Séries de montée en charge","2 à 3 séries légères","spécifique","Sur le premier exercice, non comptées dans la séance.","")]},
 upper:{t:"Échauffement haut du corps",min:8,items:[
  W("Rameur","3 min","cardio","Rythme facile, traction avec les jambes puis le dos.","Vélo ou corde à sauter"),
  W("Band pull-apart","2 × 15","activation","Bras tendus, écarte l'élastique jusqu'à la poitrine.",""),
  W("Dislocations au bâton","2 × 10","mobilité","Bras tendus, passe le bâton devant puis derrière, sans forcer.","Rotations des bras"),
  W("Rotation externe à l'élastique","2 × 12 / bras","activation","Coude collé au corps, tourne l'avant-bras vers l'extérieur.",""),
  W("Pompes lentes","10","activation","Descente en 3 secondes, gainage serré.","Pompes sur les genoux"),
  W("Séries de montée en charge","1 à 2 séries légères","spécifique","Sur le premier exercice, non comptées.","")]},
 upperRecov:{t:"Échauffement + récupération des jambes",min:15,items:[
  W("Vélo très facile","10 min","récupération","Tu dois pouvoir parler sans effort : c'est de la récupération après le match.","Marche rapide"),
  W("Mobilité hanches et chevilles","5 min","mobilité","90/90, fente basse, genou au mur, à ton rythme.",""),
  W("Band pull-apart","2 × 15","activation","Bras tendus, écarte l'élastique jusqu'à la poitrine.",""),
  W("Rotation externe à l'élastique","2 × 12 / bras","activation","Coude collé au corps.",""),
  W("Séries de montée en charge","1 à 2 séries légères","spécifique","Sur le premier exercice, non comptées.","")]},
 power:{t:"Échauffement puissance",min:12,items:[
  W("Vélo ou course légère","5 min","cardio","Allure facile puis un peu plus vive la dernière minute.","Corde à sauter"),
  W("Mobilité chevilles et hanches","3 min","mobilité","Genou au mur, 90/90, fente basse.",""),
  W("Skips","2 × 15 s","spécifique","Petits appuis rapides sur l'avant du pied.",""),
  W("Montées de genoux sur place","2 × 15 s","spécifique","Genoux à hauteur de hanche, bras actifs.",""),
  W("Sauts verticaux puis en longueur","3 + 3 progressifs","spécifique","Monte l'intensité à chaque saut, réception stable.","")]},
 act:{t:"Mobilité",min:5,items:[
  W("Hanches 90/90, fente basse, cheville au mur","3 min","mobilité","À ton rythme, sans forcer en fin d'amplitude.",""),
  W("Skips légers sur place","2 séries","spécifique","Appuis rapides et légers.","")]},
 test:{t:"Échauffement tests",min:12,items:[
  W("Vélo ou rameur progressif","5 min","cardio","Commence très facile, accélère progressivement.",""),
  W("Mobilité chevilles, hanches, épaules, thoracique","4 min","mobilité","Genou au mur, 90/90, dislocations au bâton, rotations thoraciques.",""),
  W("Ponts fessiers","2 × 10","activation","Serre les fessiers en haut.",""),
  W("Band pull-apart","2 × 10","activation","Bras tendus.",""),
  W("Squats au poids de corps avec pause","2 × 5","activation","Pause d'une seconde en bas.","")]}
};
const COOL={
 lower:{t:"Retour au calme",min:5,items:[
  W("Vélo ou marche très facile","2 min","récupération","Respiration calme.",""),
  W("Étirements doux des muscles travaillés","20 à 30 s chacun","étirement","Quadriceps, ischios, fessiers, mollets : sans douleur.",""),
  W("Automassage au rouleau","1 à 2 min","relâchement","Cuisses et fessiers, passages lents.","Sans rouleau : marche lente")]},
 upper:{t:"Retour au calme",min:5,items:[
  W("Marche ou rameur très facile","2 min","récupération","Respiration calme.",""),
  W("Étirements doux du haut du corps","20 à 30 s chacun","étirement","Pectoraux, dorsaux, épaules.",""),
  W("Respiration, épaules relâchées","1 min","respiration","Expire longuement.","")]},
 power:{t:"Retour au calme",min:5,items:[
  W("Footing ou vélo très léger","2 à 3 min","récupération","Allure de récupération.",""),
  W("Étirements statiques courts","20 s chacun","étirement","Mollets, quadriceps, fessiers.",""),
  W("Automassage mollets et cuisses","1 à 2 min","relâchement","Passages lents.","")]},
 light:{t:"Retour au calme",min:3,items:[
  W("Marche lente et respiration calme","2 min","récupération","",""),
  W("Étirements doux (facultatif)","1 min","étirement","Si tu en as envie.","")]}
};
/* Accès génériques (programmes du coach ou modèles historiques) */
const wuOf=T=>T.gen?T.wuObj:(T.wu?WU[T.wu]:null);
const cdOf=T=>T.gen?T.cdObj:(T.fam==="upper"?COOL.upper:T.fam==="power"?COOL.power:T.fam==="light"?COOL.light:COOL.lower);
const wuMin=T=>{const w=wuOf(T);return w?w.min||0:0};
const coolOf=T=>cdOf(T)||{t:"Retour au calme",min:0,items:[]};
const wuItemLabel=x=>typeof x==="string"?x:(x.n+(x.dose?" · "+x.dose:""));
const STOP_STD=["Douleur aiguë, articulaire ou inhabituelle : arrête l'exercice concerné. Si elle persiste, demande l'avis d'un professionnel de santé.","Si la 1re série au RIR visé est impossible avec la charge prévue, baisse de 5 à 10 % pour la suite.","Bien-être bas ou jambes lourdes : utilise « Alléger » (une série de moins, RIR + 1)."];
const STOP_POWER=["Arrête la série dès que la vitesse ou la hauteur baisse nettement : en puissance, la qualité passe avant le volume.",...STOP_STD];
const X=o=>({cat:"main",z:[],...o});
/* Exercices réutilisés */
const EX={
 cmj:(s=2)=>X({n:"CMJ (repère de fraîcheur)",sets:s,reps:"3",rir:"Effort max",rest:"1 min",check:true,z:["plyo"],cue:"Mains aux hanches, saut maximal. Note ta meilleure hauteur (My Jump) et compare-la à ton dernier test"+(lastCmj()?" ("+fmt(lastCmj())+" cm)":"")+".",alt:"Saut en longueur sans élan si tu n'as pas l'appli."}),
 squat:(sets,reps,pct,rir,extra={})=>X({n:"Squat arrière",sets,reps,lift:"squat",pct,rir,rest:"3 min",tempo:"2-0-X (descente 2 s, montée explosive)",z:["quad"],ecc:true,cue:"Gainage avant de descendre, cuisses au moins parallèles au sol, genoux dans l'axe des pieds.",alt:"Trap bar deadlift ou hack squat (règle la charge au RIR visé).",...extra}),
 bench:(sets,reps,pct,rir)=>X({n:"Développé couché",sets,reps,lift:"bench",pct,rir,rest:"2-3 min",cue:"Pieds ancrés, omoplates serrées, la barre touche la poitrine sans rebond.",alt:"Développé couché haltères."}),
 rdl:(sets,reps)=>X({n:"Soulevé de terre roumain",sets,reps,lift:"rdl",rir:"RIR 2",rest:"2 min",tempo:"3-0-1",z:["post"],ecc:true,cue:"Hanches vers l'arrière, dos neutre, barre au contact des cuisses. Arrête la descente quand le dos ne reste plus neutre.",alt:"Roumain aux haltères."}),
 pull:(sets,repsBW,pct,rir)=>X({n:"Tractions",sets,reps:repsBW,repsBW,lift:"pull",pct,rir,rest:"2 min",cue:"Prise pronation, bras tendus en bas, menton au-dessus de la barre, sans balancer.",alt:"Tirage vertical à la poulie."}),
 dm:(sets,reps)=>X({n:"Développé militaire haltères",sets,reps,lift:"dm",pct:.75,perHand:true,rir:"RIR 2",rest:"90 s",cue:"Gainage serré, pas de cambrure. Les haltères finissent au-dessus des oreilles.",alt:"Développé militaire assis à la machine."}),
 sled:(sets,dist)=>X({n:"Poussée de traîneau lourde",sets,reps:dist,rir:"Effort max contrôlé",rest:"2-3 min",z:["post","calf"],cue:"Charge lourde (le cours My Sprint cite 50 à 80 % du poids de corps pour un F0 faible), buste penché, poussées longues et puissantes. Vise ton point faible : la force horizontale (F0).",alt:"Sprints résistés à l'élastique tenu par un partenaire, ou départs en côte sur 10 m."}),
 hip:(sets,reps)=>X({n:"Hip thrust lourd",sets,reps,rir:"RIR 2",rest:"2 min",z:["post"],cue:"Menton rentré, pause d'une seconde en haut, sans cambrer.",alt:"Pont fessier unilatéral lesté."}),
 broad:(sets,reps,ss)=>X({n:"Sauts en longueur",sets,reps,rir:"Effort max",rest:ss?"3 min après la paire":"90 s",plyo:true,z:["plyo","calf"],ss,cue:"Réception stable et silencieuse. Pars 15 à 20 s après la série précédente si c'est un enchaînement.",alt:"Sauts sur box."}),
 bounds:(sets,reps)=>X({n:"Bonds horizontaux (triple bond pieds joints)",sets,reps,rir:"Effort max",rest:"90 s",plyo:true,z:["plyo","calf"],cue:"Contact au sol bref, cherche la distance vers l'avant.",alt:"Sauts en longueur enchaînés."}),
 medball:(sets,reps)=>X({n:"Lancers medball (poitrine + rotation)",sets,reps,rir:"Effort max",rest:"60 s",pw:true,cue:"Lance le plus fort possible, rattrape-toi et recommence.",alt:"Lancers contre un mur avec un ballon lesté."}),
 nordic:(sets,reps,note)=>X({n:"Nordic hamstring",sets,reps,rir:"Sans échec",rest:"90 s",cat:"prev",z:["post"],ecc:true,cue:(note?note+" ":"")+"Descente la plus lente possible, hanches tendues. Rattrape-toi sur les mains.",alt:"Nordic assisté à l'élastique, ou glute-ham raise."}),
 cop:(sets,reps)=>X({n:"Copenhagen plank",sets,reps,rir:"—",rest:"45 s",cat:"prev",z:["add"],cue:"Bassin aligné, la jambe du dessus porte le poids.",alt:"Version genou appuyé sur le banc (plus facile)."}),
 deadbug:(sets)=>X({n:"Dead bug",sets,reps:"10 / côté",rir:"—",rest:"45 s",cat:"prev",cue:"Bas du dos collé au sol, expire en tendant le bras et la jambe opposés.",alt:"Gainage planche 3×30 s."}),
 pallof:(sets)=>X({n:"Pallof press",sets,reps:"10 / côté",rir:"—",rest:"45 s",cat:"prev",cue:"Bras tendus, le buste ne tourne pas.",alt:"Gainage latéral 2×30 s."}),
 incline:(sets)=>X({n:"Développé incliné haltères",sets,reps:"10",rir:"RIR 2",rest:"90 s",tempo:"3-0-1 (descente en 3 s)",cue:"Omoplates serrées, coudes à environ 45° du buste.",alt:"Machine convergente ou incliné à la barre."}),
 row:(sets)=>X({n:"Rowing unilatéral haltère",sets,reps:"10 / bras",rir:"RIR 2",rest:"75 s",cue:"Tire le coude vers la hanche, dos plat, sans rotation du buste.",alt:"Rowing assis à la poulie basse."}),
 lat:(sets)=>X({n:"Élévations latérales",ss:"A1",sets,reps:"15",rir:"RIR 1-2",rest:"—",cat:"acc",cue:"Monte jusqu'à l'horizontale, coude légèrement fléchi, sans élan.",alt:"Élévations latérales à la poulie."}),
 face:(sets)=>X({n:"Face pull",ss:"A2",sets,reps:"15",rir:"RIR 2",rest:"60 s après la paire",cat:"acc",cue:"Corde vers le front, coudes hauts, pause d'une seconde.",alt:"Élastique accroché à hauteur des yeux."}),
 curl:(sets)=>X({n:"Curl incliné haltères",ss:"B1",sets,reps:"12",rir:"RIR 1-2",rest:"—",cat:"acc",cue:"Bras derrière le buste, sans ramener les coudes vers l'avant.",alt:"Curl à la poulie basse, dos à la poulie."}),
 ext:(sets)=>X({n:"Extension triceps au-dessus de la tête (poulie)",ss:"B2",sets,reps:"12",rir:"RIR 1-2",rest:"60 s après la paire",cat:"acc",cue:"Coudes fixes, descente en étirement complet.",alt:"Extension haltère à deux mains au-dessus de la tête."}),
 calf:(sets,seated=true)=>X({n:seated?"Mollets assis (soléaire)":"Mollets debout",sets,reps:seated?"15":"12",rir:"RIR 1",rest:"60 s",tempo:"2-1-2 (pause en étirement)",cat:"acc",z:["calf"],cue:"Amplitude complète, pause d'une seconde en bas.",alt:"Mollets unilatéraux sur une marche."}),
 bulg:(sets,reps)=>X({n:"Fente bulgare",sets,reps,rir:"RIR 2",rest:"90 s",cat:"acc",z:["quad"],ecc:true,cue:"Buste légèrement penché, genou avant stable.",alt:"Fente arrière aux haltères."}),
 legcurl:(sets)=>X({n:"Leg curl",sets,reps:"12",rir:"RIR 2",rest:"75 s",tempo:"2-0-3 (retour lent)",cat:"acc",z:["post"],ecc:true,cue:"Contrôle le retour.",alt:"Leg curl au swiss ball."}),
 mob:(min)=>X({n:"Mobilité hanches, chevilles, thoracique",sets:1,reps:min+" min",rir:"—",rest:"—",cat:"prev",cue:"90/90, fente basse, cheville au mur, rotations thoraciques. À ton rythme.",alt:"—"}),
 gainage:(sets)=>X({n:"Gainage planche + latéral",sets,reps:"30 s",rir:"—",rest:"30 s",cat:"prev",cue:"Respire normalement.",alt:"Dead bug 2×8."})
};
/* Volumes révisés le 22/10/2026 pour tenir dans la durée affichée (échauffement + corps de séance + retour au calme).
   Cours Planification : séance de force/puissance de 45-60 min en semaine de match ; cours Prévention : retour au calme 5-10 min ;
   cours Pliométrie : échauffement général d'environ 10 min. Détail ancien/nouveau volume : VOLUME_CHANGES ci-dessous. */
/* HR (J+1) révisée en v9 : 26 → 22 séries. Cours Planification p. 54 (J+1 = récupération active) et cours Prévention p. 33
   (en saison : volume réduit, intensité maintenue). Nordic et Copenhagen conservés à faible volume (cours Prévention p. 23 : 2 fois/semaine). */
function T_HR(s){return[
  EX.bench(3,"6",.75,"RIR 2-3"),EX.pull(3,"6-8",.75,"RIR 2-3"),EX.incline(3),EX.row(3),
  EX.lat(2),EX.face(2),
  EX.nordic(2,"3","Selon tes sensations : supprime-le si les ischios sont raides après le match."),EX.cop(2,"20 s / côté"),EX.deadbug(2)]}
function T_H(s){const c=s.lvl==="charge";return[
  EX.incline(c?4:3),EX.row(c?4:3),EX.dm(3,"8"),EX.lat(3),EX.face(3),EX.curl(2),EX.ext(2),
  EX.cop(2,"20 s / côté"),EX.deadbug(2)]}
function T_HM(){return[EX.dm(2,"8"),EX.row(2),EX.lat(2),EX.face(2),EX.mob(6),EX.cop(2,"20 s / côté"),EX.deadbug(2)]}
function T_HP(){return[EX.incline(3),EX.row(3),EX.dm(3,"8"),EX.lat(3),EX.face(3),EX.nordic(2,"4"),EX.cop(2,"20 s / côté"),EX.deadbug(2)]}
function T_F(){return[
  EX.cmj(2),EX.squat(4,"4",.85,"RIR 1-2"),EX.sled(4,"10 m"),EX.bench(3,"4",.85,"RIR 1-2"),EX.rdl(3,"6"),EX.pull(3,"5-7",.85,"RIR 2"),
  EX.nordic(2,"4"),EX.cop(2,"25 s / côté")]}
/* FC (bloc de charge, semaine sans match) révisée en v9 : hip thrust retiré (chaîne postérieure déjà travaillée par le roumain,
   le traîneau et le Nordic). 28 → 25 séries. Cours Prévention p. 33 (qualité plutôt que quantité en saison) ; le volume reste
   supérieur aux semaines de match (cours Planification p. 45, bloc d'accumulation). */
function T_FC(){return[
  EX.cmj(2),EX.squat(4,"6",.75,"RIR 2"),EX.sled(4,"15 m"),EX.bench(4,"6",.75,"RIR 2"),EX.rdl(3,"8"),EX.pull(3,"6-8",.77,"RIR 2"),
  EX.nordic(3,"5"),EX.cop(2,"25 s / côté")]}
function T_PF(){return[
  EX.cmj(2),EX.squat(3,"3",.80,"RIR 2-3",{ss:"A1",rest:"—"}),EX.broad(3,"2","A2"),EX.hip(3,"5"),EX.bounds(3,"2"),EX.medball(3,"4"),
  EX.nordic(2,"4"),EX.pallof(2)]}
function T_PFC(){return[
  EX.cmj(2),EX.squat(4,"5",.80,"RIR 2",{ss:"A1",rest:"—"}),EX.broad(4,"2","A2"),EX.hip(3,"6"),EX.bench(3,"5",.80,"RIR 2"),EX.pull(3,"6-8",.80,"RIR 2"),EX.bounds(3,"3"),
  EX.nordic(2,"4"),EX.cop(2,"25 s / côté")]}
function T_MICRO(){return[EX.broad(3,"2"),EX.cmj(2),EX.medball(2,"4"),EX.gainage(2)]}
function T_PR(){return[
  X({n:"Retest du profil force-vitesse (My Sprint)",sets:3,reps:"30 m",rir:"Effort max",rest:"3 min",sprint:true,z:["post","calf"],cue:"Départ arrêté, filmé de profil avec des repères tous les 5 m. Garde le meilleur sprint et compare F0, V0 et Pmax à ton profil précédent"+(CUR_UID===LUCAS.uid?" (01/09 : F0 "+LUCAS.fv.F0+")":"")+".",alt:"Sans appli : chronomètre le 10 m et le 30 m."}),
  EX.bounds(3,"3"),EX.hip(3,"5"),EX.medball(3,"4"),EX.nordic(2,"4"),EX.pallof(2)]}
function T_R(){return[
  X({n:"Vélo, natation ou marche rapide",sets:1,reps:"30 min",rir:"50-60 % FC max",rest:"—",cat:"main",cue:"Tu peux tenir une conversation pendant tout l'effort (récupération active, cours Planification).",alt:"Footing très lent sur terrain plat."}),EX.mob(5)]}
function T_TEST(){return[
  X({n:"CMJ (My Jump)",sets:3,reps:"1 essai",rir:"Effort max",rest:"1 min",cue:"Mains aux hanches. Garde le meilleur des 3 essais.",alt:"—"}),
  X({n:"Squat arrière : 3RM",sets:"3-4",reps:"3",rir:"RIR 0 propre",rest:"3-4 min",cue:"Montée : 10 reps à ~45 %, 5 à ~60 %, 3 à ~75 %, 1 à ~85 %, puis tentatives de 3 reps en ajoutant 2,5 à 5 kg. Avec pareur ou sécurités.",alt:"Trap bar deadlift 3RM si pas de cage."}),
  X({n:"Développé couché : 3RM",sets:"3-4",reps:"3",rir:"RIR 0 propre",rest:"3-4 min",cue:"Même montée en charge. La barre touche la poitrine, sans rebond. Pareur obligatoire.",alt:"Développé haltères 3RM."}),
  X({n:"Tractions max",sets:1,reps:"max",rir:"Effort max",rest:"5 min",cue:"Prise pronation, bras tendus en bas, menton au-dessus de la barre.",alt:"—"}),
  X({n:"Soulevé de terre (test du 12/10 : classique)",sets:"2-3",reps:"3",rir:"RIR 0 propre",rest:"3 min",cue:"Le test réalisé est un soulevé de terre classique. Il ne sert pas de référence pour le roumain.",alt:"—"})]}
/* fam : heavy (lourd pour les jambes) · power (sauts, sprints) · upper · light */
const TYPES={
 TEST:{short:"Tests",name:"Tests de force",goal:"Mesurer tes 3RM et ton CMJ pour calculer les charges du programme.",dur:75,int:"Maximale",rpe:9,fam:"heavy",wu:"test",fn:T_TEST,stop:["Si une tentative se dégrade techniquement, ton résultat est la tentative précédente. Maximum 4 tentatives par exercice.","Sans pareur ni sécurités : pas de 3RM au développé couché.","Douleur inhabituelle : arrête le test concerné."]},
 HP:{short:"Haut",name:"Haut du corps + prévention",goal:"Haut du corps, plus Nordic et Copenhagen pour les ischios et les adducteurs.",dur:50,int:"Modérée",rpe:6,fam:"upper",wu:"upper",fn:T_HP},
 HR:{short:"Haut",name:"Principale · haut du corps et récupération",goal:"Séance principale du lundi au lendemain du match (J+1) : haut du corps à volume réduit, sans charge pour les jambes, et récupération active des jambes.",dur:60,int:"Modérée",rpe:5,fam:"upper",wu:"upperRecov",fn:T_HR},
 H:{short:"Haut",name:"Haut du corps",goal:"Hypertrophie du haut du corps et gainage, sans fatiguer les jambes.",dur:50,int:"Modérée",rpe:5,fam:"upper",wu:"upper",fn:T_H},
 HM:{short:"Haut",name:"Haut du corps + mobilité",goal:"Séance légère : haut du corps, mobilité et prévention, sans charge pour les jambes.",dur:40,int:"Légère",rpe:4,fam:"upper",wu:"upper",fn:T_HM},
 F:{short:"Force",name:"Principale · force",goal:"Développer la force maximale et la force horizontale (traîneau lourd), loin des matchs.",dur:65,int:"Élevée",rpe:8,fam:"heavy",wu:"lower",fn:T_F},
 FC:{short:"Force",name:"Force · bloc de charge",goal:"Semaine sans match : plus de volume pour développer la force et la masse musculaire.",dur:70,int:"Élevée (volume)",rpe:8,fam:"heavy",wu:"lower",fn:T_FC},
 PF:{short:"P+F",name:"Puissance + quelques séries de force",goal:"Puissance à faible volume, orientée vers l'avant (F0), avec quelques séries de squat. Pas de sprints : le club travaille la vitesse le vendredi.",dur:45,int:"Moyenne",rpe:6,fam:"heavy",wu:"power",fn:T_PF,stop:STOP_POWER},
 PFC:{short:"P+F",name:"Puissance + force · bloc de charge",goal:"Semaine sans match : puissance horizontale et force avec plus de séries.",dur:60,int:"Élevée",rpe:7,fam:"heavy",wu:"power",fn:T_PFC,stop:STOP_POWER},
 MICRO:{short:"Micro",name:"Microdose de puissance",goal:"Rester vif sans fatigue : quelques sauts et lancers, puis du gainage.",dur:20,int:"Très légère",rpe:3,fam:"light",wu:"act",fn:T_MICRO,stop:STOP_POWER},
 PR:{short:"Test",name:"Puissance + retest force-vitesse",goal:"Refaire ton profil force-vitesse (My Sprint) pour mesurer l'évolution du F0, puis un peu de puissance horizontale.",dur:45,int:"Élevée (vitesse)",rpe:7,fam:"power",wu:"power",fn:T_PR,stop:STOP_POWER},
 R:{short:"Récup",name:"Récupération active",goal:"Bouger sans fatigue pendant la trêve pour récupérer du bloc de charge.",dur:40,int:"Très légère",rpe:2,fam:"light",wu:null,fn:T_R,stop:["Si tu te sens fatigué, une marche de 30 min suffit.","Douleur inhabituelle : repos complet et avis d'un professionnel de santé si elle persiste."]}
};
/* Journal de la révision des volumes (affiché dans le journal des modifications et le rapport) */
/* Journal des révisions de volume. v3 (22/10, matin) : séances alignées sur leur durée annoncée.
   v9 (22/10, soir) : revue séance par séance demandée (Force bloc de charge, Puissance + force bloc de charge, Haut du corps et récupération),
   chaque changement relié à un cours (SOURCES). Ne pas réduire sans justification : une séance peut rester inchangée. */
const VOLUME_CHANGES_V3=[
 {code:"F",old:"10 exercices · 32 séries (≈ 79 min estimées pour 60 min annoncées)",nw:"8 exercices · 23 séries · durée annoncée 65 min (≈ 63 min estimées)",what:"Fente bulgare et hip thrust retirés (mêmes zones que le squat et le roumain) ; couché et tractions 4 → 3 séries ; Nordic et Copenhagen 3 → 2 séries."},
 {code:"FC",old:"12 exercices · 40 séries (≈ 99 min pour 70 min)",nw:"9 exercices · 28 séries · 75 min (≈ 76 min estimées)",what:"Leg curl (doublon du Nordic et du roumain), fente bulgare et mollets retirés ; roumain, tractions et hip thrust 4 → 3 séries ; Copenhagen 3 → 2."},
 {code:"H",old:"10 exercices · 29 séries (≈ 56 min pour 45 min)",nw:"9 exercices · 23 séries · 50 min (≈ 50 min estimées)",what:"Mollets retirés ; curl et triceps 3 → 2 séries ; dead bug 3 → 2."},
 {code:"HP",old:"11 exercices · 32 séries (≈ 59 min pour 50 min)",nw:"8 exercices · 21 séries · 50 min (≈ 49 min estimées)",what:"Curl, triceps et mollets retirés ; dead bug 3 → 2."},
 {code:"HR",old:"13 exercices · 39 séries (≈ 79 min pour 65 min)",nw:"9 exercices · 26 séries · 70 min (≈ 68 min estimées)",what:"Développé militaire (doublon du couché et de l'incliné), curl, triceps et Pallof retirés ; dead bug 3 → 2."},
 {code:"HM",old:"8 exercices · 18 séries + 8 min de mobilité (≈ 44 min pour 35 min)",nw:"7 exercices · 12 séries + 6 min de mobilité · 40 min (≈ 39 min estimées)",what:"Pallof retiré (gainage déjà couvert par dead bug et Copenhagen) ; militaire et rowing 3 → 2 séries (séance légère) ; mobilité 8 → 6 min."},
 {code:"PFC",old:"10 exercices · 32 séries (≈ 64 min pour 55 min)",nw:"9 exercices · 26 séries · 60 min (≈ 59 min estimées)",what:"Roumain retiré (déjà présent dans les séances de force de la semaine) ; hip thrust 4 → 3 ; Nordic 3 → 2."},
 {code:"R",old:"30-40 min d'activité + 10 min de mobilité (≈ 52 min pour 40 min)",nw:"30 min d'activité + 5 min de mobilité",what:"Durée alignée sur les 40 min annoncées."},
 {code:"PF",old:"40 min annoncées (≈ 46 min estimées avec le retour au calme)",nw:"Contenu inchangé · durée annoncée 45 min",what:"Séance déjà au volume minimal ; c'est la durée affichée qui était sous-estimée (cours Planification : 45-60 min)."}
];
const VOLUME_CHANGES=[
 {code:"FC",rev:"v9",old:"9 exercices · 28 séries (≈ 76 min estimées) : CMJ 2, squat 4×6, traîneau 4×15 m, couché 4×6, roumain 3×8, tractions 3, hip thrust 3×8, Nordic 3×5, Copenhagen 2",
  nw:"8 exercices · 25 séries · 70 min annoncées : hip thrust retiré, le reste inchangé",
  what:"Hip thrust retiré.",reason:"La chaîne postérieure est déjà sollicitée par le roumain (3 séries), le traîneau lourd (4) et le Nordic (3) dans la même séance ; la séance est le lundi d'une semaine qui garde 2 à 3 entraînements club.",
  src:["PREV_P33","PLANIF_P45","PLANIF_P46"],rule:"En saison : volume réduit, intensité maintenue, qualité plutôt que quantité (Prévention p. 33). Bloc d'accumulation : plus de volume que les semaines de match (Planification p. 45). Exercices principaux dans les fourchettes DUP (Planification p. 46).",
  interp:"Le bloc de charge justifie un volume supérieur aux semaines de match, mais pas un doublon de la chaîne postérieure. On garde l'intensité et les exercices principaux.",impact:"≈ 6 min de moins, moins de fatigue des ischios avant l'entraînement club du mercredi ; stimulus de force inchangé."},
 {code:"HR",rev:"v9",old:"9 exercices · 26 séries (≈ 68 min) : couché 4×6, tractions 4, incliné 3, rowing 3, élévations 3, face pull 3, Nordic 2, Copenhagen 2, dead bug 2",
  nw:"9 exercices · 22 séries · 60 min annoncées : couché 3×6, tractions 3, élévations 2, face pull 2 ; le reste inchangé",
  what:"Couché et tractions 4 → 3 séries ; élévations latérales et face pull 3 → 2.",reason:"Séance placée à J+1 (lendemain de match). Le cours décrit J+1 comme une journée de récupération active ; on conserve une séance haut du corps (contrainte d'emploi du temps : séance principale du lundi) mais avec moins de volume.",
  src:["PLANIF_P54","DEVQ_P30","PREV_P33","PREV_P23"],rule:"J+1 : récupération active (Planification p. 54 ; Développement des qualités p. 30). En saison : volume réduit, intensité maintenue (Prévention p. 33). Nordic : 2 fois par semaine pour l'effet dose-dépendant (Prévention p. 23).",
  interp:"Le haut du corps ne charge pas les jambes, mais la fatigue globale du lendemain de match justifie de baisser le volume, pas l'intensité (RIR 2-3 conservé). Nordic et Copenhagen restent à faible volume pour tenir la fréquence de 2 fois par semaine ; le Nordic peut être retiré selon les sensations.",impact:"≈ 9 min de moins ; même intensité sur les exercices principaux ; travail préventif maintenu."},
 {code:"PFC",rev:"v9",old:"9 exercices · 26 séries (≈ 59 min)",nw:"Inchangée",what:"Aucun changement.",
  reason:"Volume de sauts ≈ 41 contacts (CMJ 6, sauts en longueur 8, triples bonds 27), sous la fourchette de 50-80 contacts de la période compétitive ; pas de match dans la semaine (règle des 72 h respectée) ; exercices de force dans les fourchettes DUP.",
  src:["PLIO_P25","PLANIF_P46","PLANIF_P45"],rule:"Période compétitive : 50-80 contacts, à 72 h des compétitions (Pliométrie p. 25) ; puissance 3-5 × 3-5 (Planification p. 46) ; bloc d'accumulation (p. 45).",
  interp:"Aucune règle des cours fournis ne justifie une réduction : la séance est conservée telle quelle.",impact:"Aucun."}
];
const ADAPT_LABEL={painTargeted:"Retrait ciblé (douleur)",painAsk:"Précise ta douleur",coach:"Avis du coach",none:"Aucun changement",volume:"Réduction du volume",power:"Réduction de la puissance",micro:"Microdose",upper:"Haut du corps uniquement",active:"Récupération active",targeted:"Réduction ciblée",move:"Déplacement",rest:"Repos"};
const ZONE_LABEL={post:"chaîne postérieure (ischios, fessiers)",quad:"quadriceps et travail excentrique",calf:"mollets et tendon d'Achille",plyo:"sauts et impacts",legs:"membres inférieurs"};
function setsDown(e){return typeof e.sets==="number"?{...e,sets:Math.max(1,e.sets-1),changed:true}:e}
function rirUp(r){return String(r).replace(/RIR (\d)(?:-(\d))?/,(m,a,b)=>"RIR "+(+a+1)+(b?"-"+(+b+1):""))}
/* Exercices réellement prescrits après adaptation confirmée */
function sessionItems(s){
  const T=tpl(s);let items=T.fn(s);const a=S.adapt[s.id];
  if(!a||!a.mode||a.mode==="none")return items;
  if(a.mode==="volume")return items.map(e=>({...setsDown(e),rir:rirUp(e.rir)}));
  if(a.mode==="painTargeted")return items.map(e=>painHits(e,a.painZone)?{...e,removed:"retiré (douleur signalée : "+PAIN_ZL(a.painZone).toLowerCase()+")"}:e);
  if(a.mode==="rest")return items.map(e=>({...e,removed:"repos conseillé (douleur)"}));
  if(a.mode==="power")return items.map(e=>(e.plyo||e.sprint||e.pw)&&!e.check?{...e,removed:"supprimé (réduction de la puissance)"}:e);
  if(a.mode==="targeted"){
    const tg=new Set(a.targets||[]);
    return items.map(e=>{
      if(e.check)return e;
      const z=new Set(e.z||[]);
      if(tg.has("plyo")&&(e.plyo||z.has("plyo")))return{...e,removed:"supprimé (impacts déjà élevés)"};
      if(tg.has("sprint")&&e.sprint)return{...e,removed:"supprimé (sprints déjà nombreux)"};
      if(tg.has("legs")&&(z.has("post")||z.has("quad")||z.has("calf")||z.has("plyo")))return{...setsDown(e),note:"1 série de moins (jambes lourdes)"};
      const hit=[...z].filter(k=>tg.has(k));
      if(hit.length){const r={...setsDown(e),note:"1 série de moins ("+hit.map(k=>ZONE_LABEL[k]).join(", ")+")"};if(tg.has("quad")&&e.ecc&&e.tempo)r.tempo="sans phase excentrique ralentie";return r}
      return e;
    });
  }
  return items;
}

