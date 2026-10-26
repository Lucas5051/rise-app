/* =====================================================================
   DOMAINE · SOURCES SPORTIVES (traçabilité)
   Chaque règle du moteur peut citer un sourceId. Pages = numéro de diapositive du support de cours (PDF converti).
   Les athlètes voient une explication simple ; le détail (cours, page, principe) n'est affiché que dans l'espace coach.
   Si une règle n'a pas de source dans les cours fournis, elle est marquée « source:null » et le signale.
   ===================================================================== */
const SRC_AUTHOR="Johann Franchequin";
const SOURCES={
 PLANIF_P44:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Périodisation traditionnelle · phase de compétition",page:44,
  principe:"En phase de compétition : maintien des acquis, intensité maximale, volume minimal, gestion de la fraîcheur.",application:"En saison, le volume des séances de musculation reste limité ; l'intensité des exercices principaux est conservée."},
 PLANIF_P45:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Périodisation par blocs",page:45,
  principe:"Bloc d'accumulation : volume élevé, intensité modérée ; bloc d'intensification : moins de volume, plus d'intensité.",application:"Les semaines sans match (« bloc de charge ») acceptent plus de volume que les semaines de match."},
 PLANIF_P46:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Périodisation ondulante (DUP)",page:46,
  principe:"Force maximale 3-5 séries × 3-5 répétitions à 85-90 % 1RM, repos 3-5 min ; hypertrophie 3-4 × 8-12 à 70-80 %, repos 60-90 s ; puissance 3-5 × 3-5 à 50-70 %, repos 2-3 min. Adaptée aux sports intermittents.",application:"Nombre de séries et de répétitions des exercices principaux ; variation de l'objectif d'une séance à l'autre."},
 PLANIF_P48:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Principe de surcompensation",page:48,
  principe:"Après un stress d'entraînement, la phase de récupération dure généralement 24 à 72 h selon l'intensité et le type d'entraînement.",application:"Espacement des séances lourdes pour les jambes."},
 PLANIF_P49:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Gestion de la fatigue et de la récupération",page:49,
  principe:"Récupération active : exercices à faible intensité (50-60 % FCmax), natation ou vélo léger.",application:"Séances de récupération active (trêve, remplacement en cas de fatigue)."},
 PLANIF_P50:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Techniques de contrôle de la charge",page:50,
  principe:"sRPE = RPE × durée de la séance (min). ACWR optimal 0,8-1,2 ; au-delà de 1,5 risque accru. Monotonie > 2 : manque de variation. Strain > 6000 : attention à la récupération.",application:"Calcul de la charge interne, seuils d'alerte du moteur d'adaptation."},
 PLANIF_P54:{titre:"La planification de l'entraînement en préparation physique",auteur:SRC_AUTHOR,chapitre:"Exemple de planification en football · microcycle type",page:54,
  principe:"J+1 : récupération active (décrassage léger 20-30 min) ; J+2 : repos ou séance de développement individuelle ; J-4 : séance de force/puissance (45-60 min) ; J-2 : puissance-vitesse modérée ; J-1 : activation courte. Périodes de congestion : réduction drastique du volume.",application:"Placement et durée des séances selon le jour du match ; séance du lendemain de match allégée."},
 DEVQ_P30:{titre:"Développement des qualités physiques dans le sport de haut niveau",auteur:SRC_AUTHOR,chapitre:"Importance de la phase du microcycle",page:30,
  principe:"J+1/J+2 : récupération active ; J-4/J-3 : développement des qualités physiques ; J-2/J-1 : affûtage et activation.",application:"Choix du type de séance selon la distance au match."},
 QUANT_P9:{titre:"La quantification de la charge de travail",auteur:SRC_AUTHOR,chapitre:"La charge interne · le RPE",page:9,
  principe:"Le RPE de séance (échelle CR10 de Foster) est donné par l'athlète dans les 30 min qui suivent la séance.",application:"Demande du RPE à la fin de la séance ou rappel 30 min après."},
 QUANT_P10:{titre:"La quantification de la charge de travail",auteur:SRC_AUTHOR,chapitre:"La charge interne · le RPE",page:10,
  principe:"Foster utilise le RPE de séance et le temps total de la séance pour calculer la charge d'entraînement.",application:"Durée utilisée pour la sRPE : temps total de la séance, récupérations entre séries comprises."},
 PREV_P23:{titre:"Optimisation de la prévention des blessures en sport de haut niveau",auteur:SRC_AUTHOR,chapitre:"Le Nordic Hamstring Exercise",page:23,
  principe:"Effet dose-dépendant : au moins 2 séances par semaine ; l'observance conditionne l'efficacité, à poursuivre toute la saison.",application:"Nordic conservé deux fois par semaine quand le calendrier le permet (travail préventif, sans garantie d'éviter une blessure)."},
 PREV_P32:{titre:"Optimisation de la prévention des blessures en sport de haut niveau",auteur:SRC_AUTHOR,chapitre:"Architecture type d'une séance préventive",page:32,
  principe:"Échauffement neuromusculaire 10-15 min ; retour au calme 5-10 min (récupération active, étirements doux, relâchement).",application:"Durées d'échauffement et de retour au calme."},
 PREV_P33:{titre:"Optimisation de la prévention des blessures en sport de haut niveau",auteur:SRC_AUTHOR,chapitre:"Périodisation du programme préventif annuel",page:33,
  principe:"En saison : maintien des acquis, volume réduit, intensité maintenue, qualité plutôt que quantité, prévention de la fatigue cumulée.",application:"Réduction du nombre de séries en saison sans baisser l'intensité des exercices principaux."},
 PLIO_P25:{titre:"La pliométrie dans l'entraînement",auteur:SRC_AUTHOR,chapitre:"Intégration dans la périodisation annuelle",page:25,
  principe:"Période compétitive : 50-80 contacts par séance, intensité maintenue, 1-2 fois par semaine, à au moins 72 h des compétitions importantes.",application:"Volume de sauts des séances de puissance."},
 PLIO_P26:{titre:"La pliométrie dans l'entraînement",auteur:SRC_AUTHOR,chapitre:"Exemple de séance",page:26,
  principe:"Échauffement général 10 min ; retour au calme 7 min (footing léger, étirements statiques courts, automassages).",application:"Structure échauffement / retour au calme des séances de puissance."},
 PLIO_P34:{titre:"La pliométrie dans l'entraînement",auteur:SRC_AUTHOR,chapitre:"Précautions et contre-indications",page:34,
  principe:"Contre-indication relative : période post-compétition immédiate (< 48 h), fatigue chronique.",application:"Pas de sauts intensifs au lendemain d'un match ; retrait de la pliométrie en cas de fatigue."},
 FORCE_P18:{titre:"Travail de force sur terrain en préparation physique",auteur:SRC_AUTHOR,chapitre:"Intégration du travail de force avec d'autres qualités",page:18,
  principe:"Qualités antagonistes (force/endurance) sur des jours séparés ; récupération minimale de 48 h après un travail de force maximale.",application:"Pas de séance lourde pour les jambes à moins de 48 h d'une autre sollicitation lourde."},
 MYSPRINT_P7:{titre:"Analyse des profils force-vitesse avec My Sprint",auteur:SRC_AUTHOR,chapitre:"Cas pratique · profil vitesse dominante",page:7,
  principe:"F0 insuffisant : musculation orientée force maximale (squat, hip thrust, RDL), sprints résistés (traîneau 50-80 % du poids de corps), renforcement de la chaîne postérieure.",application:"Choix du traîneau lourd et des exercices de la chaîne postérieure."}
};
/* Règles internes du moteur → sources. source:null = aucune source trouvée dans les cours fournis (signalé, pas inventé). */
const RULES={
 legsJ1:{l:"Pas de séance lourde pour les jambes à J+1 ni à J-1",src:["PLANIF_P54","FORCE_P18","DEVQ_P30"]},
 condJ2:{l:"J-2 : microdose de puissance",src:["PLANIF_P54","DEVQ_P30"]},
 condJ3:{l:"J-3 : puissance à faible volume + quelques séries de force",src:["DEVQ_P30","PLIO_P25"]},
 chargeBlock:{l:"Semaine sans match : plus de volume (bloc de charge)",src:["PLANIF_P45"]},
 acwr:{l:"Seuils ACWR 0,8-1,2 / 1,5",src:["PLANIF_P50"]},
 monotony:{l:"Monotonie > 2, strain > 6000",src:["PLANIF_P50"]},
 srpe:{l:"sRPE = RPE × durée totale de la séance",src:["PLANIF_P50","QUANT_P10"]},
 rpe30:{l:"RPE demandé dans les 30 min",src:["QUANT_P9"]},
 wellness:{l:"Questionnaire de bien-être quotidien",src:["PLANIF_P50"]},
 fatigueRemove:{l:"Fatigue : retrait des sauts, réduction du volume",src:["PLIO_P34","PREV_P33"]},
 wuCd:{l:"Échauffement 10-15 min, retour au calme 5-10 min",src:["PREV_P32","PLIO_P26"]},
 nordic2:{l:"Nordic 2 fois par semaine",src:["PREV_P23"]},
 inSeasonVolume:{l:"En saison : volume réduit, intensité maintenue",src:["PREV_P33","PLANIF_P44"]},
 activeRecovery:{l:"Récupération active à 50-60 % FCmax",src:["PLANIF_P49"]},
 commentSignals:{l:"Lecture des mots-clés du commentaire (douleur, jambes lourdes…)",src:null,note:"Règle interne de l'appli : aucun cours fourni ne décrit cette lecture automatique ; elle propose seulement, jamais n'applique."},
 otherSportsLoad:{l:"Charge des autres sports (padel, tennis…) intégrée au plafond personnel",src:["PLANIF_P50"],note:"Le principe (sRPE, ACWR) vient du cours ; les caractéristiques de chaque sport viennent d'articles PubMed cités dans le code, pas des cours."}
};
const srcLabel=id=>{const s=SOURCES[id];return s?`${s.titre} (${s.auteur}), « ${s.chapitre} », p. ${s.page}`:id};
/* Justification détaillée d'une règle (espace coach uniquement) */
function ruleJustif(key){const r=RULES[key];if(!r)return "";
  if(!r.src)return `<p class="small"><b>${esc(r.l)}</b> — <span class="chip st-todo">Sans source dans les cours fournis</span></p><p class="tiny muted">${esc(r.note||"")}</p>`;
  return `<p class="small"><b>${esc(r.l)}</b></p><ul class="clean tiny">${r.src.map(id=>{const s=SOURCES[id];return `<li><b>${esc(s.titre)}</b>, ${esc(s.chapitre)}, p. ${s.page} : ${esc(s.principe)} <i>Application :</i> ${esc(s.application)}</li>`}).join("")}</ul>${r.note?`<p class="tiny muted">${esc(r.note)}</p>`:""}`}

