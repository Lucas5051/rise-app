/* =====================================================================
   MODULE 7 bis · AUTRES ACTIVITÉS (padel, tennis, vélo…)
   Charge = durée × RPE (sRPE, Foster, cours Quantification), comme le foot et la muscu.
   Le profil de chaque sport (intermittent / aérobie, jambes / haut du corps) vient de 2 articles PubMed
   par sport. Il ne modifie PAS le nombre d'UA (aucun coefficient inventé) : il sert à savoir
   quelles séances de muscu sont concernées et quelles zones alléger.
   ===================================================================== */
const SPORTS={
 football:{name:"Football",type:"Intermittent, endurance + actions explosives",focus:"Jambes (sprints, accélérations, sauts, duels)",legs:2,upper:0,targets:["post","sprint","calf","quad"],
  facts:["En 90 min, environ 10 km à une intensité proche du seuil anaérobie (80-90 % de la FC max), avec de nombreuses actions explosives : sauts, frappes, tacles, changements de direction, sprints.","Plus de 70 % du match à faible intensité, mais 150 à 250 actions intenses ; VO2 moyenne d'environ 70 % de la VO2max."],
  refs:[{a:"Stølen T, Chamari K, Castagna C, Wisløff U",y:2005,t:"Physiology of soccer: an update",j:"Sports Med",pmid:"15974635"},
        {a:"Bangsbo J, Mohr M, Krustrup P",y:2006,t:"Physical and metabolic demands of training and match-play in the elite football player",j:"J Sports Sci",pmid:"16766496"}]},
 handball:{name:"Handball",type:"Intermittent, actions intenses répétées",focus:"Jambes (sauts, sprints, changements de direction) et haut du corps (tirs, contacts)",legs:2,upper:1,targets:["plyo","quad","calf"],
  facts:["Jusqu'à 70 % du temps à faible intensité, mais de nombreuses actions intenses répétées (sauts, sprints, changements de direction, duels, contacts) ; les contacts augmentent probablement la charge neuromusculaire pendant et après le match.","En match élite, la performance en sprint baisse d'environ 4 % après une période intense et la performance intermittente est diminuée en fin de match."],
  refs:[{a:"Karcher C, Buchheit M",y:2014,t:"On-court demands of elite handball, with special reference to playing positions",j:"Sports Med",pmid:"24682948"},
        {a:"Póvoas SC, Ascensão AA, Magalhães J, et al.",y:2014,t:"Analysis of fatigue development during elite male handball matches",j:"J Strength Cond Res",pmid:"24552799"}]},
 padel:{name:"Padel",type:"Intermittent, intensité modérée",focus:"Jambes (déplacements courts, freinages) et épaule (volées, smashs)",legs:1,upper:1,targets:["quad","calf"],
  facts:["60 min de padel : charge proche du tennis en double et plus faible que le tennis en simple ; lactate sanguin bas (1-2 mmol/L).","Après 60 min de jeu, les performances en squat jump, CMJ et sauts répétés baissent, comme après le tennis.","Parmi les sports de raquette, le badminton présente les FC et lactates les plus élevés."],
  refs:[{a:"Armstrong C, Reid M, Beale C, Girard O",y:2023,t:"A Comparison of Match Load Between Padel and Singles and Doubles Tennis",j:"Int J Sports Physiol Perform",pmid:"36965486"},
        {a:"Cádiz Gallardo MP, Pradas de la Fuente F, Moreno-Azze A, Carrasco Páez L",y:2023,t:"Physiological demands of racket sports: a systematic review",j:"Front Psychol",pmid:"37063547"}]},
 tennis:{name:"Tennis",type:"Intermittent, haute intensité, multidirectionnel",focus:"Jambes (déplacements, freinages) et épaule (service, coups droits)",legs:1,upper:1,targets:["quad","calf"],
  facts:["Échanges d'environ 5-6 s, 4 frappes et environ 10 m courus par point ; temps de jeu effectif autour de 20 % (méta-analyse).","Rapport effort/repos de 1:3 à 1:5 ; le tennis combine vitesse, agilité et puissance avec une forte capacité aérobie.","En simple, la charge cardio et physique est plus élevée qu'en double ou au padel (Armstrong 2023)."],
  refs:[{a:"Pluim BM, Jansen MGT, Williamson S, et al.",y:2023,t:"Physical Demands of Tennis Across the Different Court Surfaces, Performance Levels and Sexes: A Systematic Review with Meta-analysis",j:"Sports Med",pmid:"36752978"},
        {a:"Kovacs MS",y:2007,t:"Tennis physiology: training the competitive athlete",j:"Sports Med",pmid:"17326695"}]},
 badminton:{name:"Badminton",type:"Intermittent, haute intensité",focus:"Jambes (fentes, sauts) et épaule",legs:2,upper:1,targets:["quad","calf","plyo"],
  facts:["Échanges d'environ 7 s pour 15 s de repos ; FC moyenne au-dessus de 90 % de la FC max chez les joueurs de haut niveau ; environ 60-70 % aérobie et 30 % anaérobie.","Gestes spécifiques : fentes et sauts répétés.","En loisir, 30 min de simple représentent environ 76 % de la VO2max : intensité vigoureuse."],
  refs:[{a:"Phomsoupha M, Laffaye G",y:2015,t:"The science of badminton: game characteristics, anthropometry, physiology, visual fitness and biomechanics",j:"Sports Med",pmid:"25549780"},
        {a:"Deka P, Berg K, Harder J, Batelaan H, McGrath M",y:2017,t:"Oxygen cost and physiological responses of recreational badminton match play",j:"J Sports Med Phys Fitness",pmid:"27054352"}]},
 foot5:{name:"Foot à 5 / futsal",type:"Intermittent, sprints répétés",focus:"Jambes (sprints, accélérations, changements de direction)",legs:2,upper:0,targets:["post","sprint","calf","quad"],
  facts:["Futsal : intensité moyenne de 85 % de la FC max ou plus et environ 80 % de la VO2max ; la fonction neuromusculaire reste diminuée jusqu'à 24 h après le match.","Petits jeux chez des pratiquants non entraînés : FC de 80 % de la FC max ou plus et lactate au-dessus de 5 mmol/L dès une séance."],
  refs:[{a:"Spyrou K, Freitas TT, Marín-Cascales E, Alcaraz PE",y:2020,t:"Physical and Physiological Match-Play Demands and Player Characteristics in Futsal: A Systematic Review",j:"Front Psychol",pmid:"33240157"},
        {a:"Zouhal H, Hammami A, Tijani JM, et al.",y:2020,t:"Effects of Small-Sided Soccer Games on Physical Fitness, Physiological Responses, and Health Indices in Untrained Individuals and Clinical Populations: A Systematic Review",j:"Sports Med",pmid:"31989457"}]},
 basket:{name:"Basket",type:"Intermittent, sauts et accélérations",focus:"Jambes (sauts, réceptions, changements de direction)",legs:2,upper:0,targets:["plyo","quad","calf"],
  facts:["En match (U19 élite) : FC moyenne de 171 bpm, lactate d'environ 5,5 mmol/L ; 5,3 % du temps de jeu en sprint et 2,1 % en sauts.","Saut vertical, vitesse et agilité distinguent les meilleurs joueurs (revue de 51 études)."],
  refs:[{a:"Ben Abdelkrim N, El Fazaa S, El Ati J",y:2007,t:"Time-motion analysis and physiological data of elite under-19-year-old basketball players during competition",j:"Br J Sports Med",pmid:"17138630"},
        {a:"Ziv G, Lidor R",y:2009,t:"Physical attributes, physiological characteristics, on-court performances and nutritional strategies of female and male basketball players",j:"Sports Med",pmid:"19530751"}]},
 course:{name:"Course à pied",type:"Aérobie, continue",focus:"Jambes (impacts, travail excentrique surtout en descente)",legs:1,upper:0,targets:["calf","quad"],
  facts:["Après un effort prolongé, la fatigue centrale et la baisse de force maximale sont plus importantes en course qu'à vélo.","La course en descente provoque d'importants dommages musculaires aux membres inférieurs (contractions excentriques)."],
  refs:[{a:"Millet GP, Vleck VE, Bentley DJ",y:2009,t:"Physiological differences between cycling and running: lessons from triathletes",j:"Sports Med",pmid:"19290675"},
        {a:"Giandolini M, Vernillo G, Samozino P, et al.",y:2016,t:"Fatigue associated with prolonged graded running",j:"Eur J Appl Physiol",pmid:"27456477"}]},
 velo:{name:"Vélo",type:"Aérobie, continue",focus:"Jambes (quadriceps), sans impact ni travail excentrique",legs:1,upper:0,targets:[],
  facts:["Le pédalage ne comporte que des contractions concentriques, contrairement à la course.","Après un exercice excentrique, le vélo à intensité modérée semble plus favorable à la récupération que la course."],
  refs:[{a:"Bijker KE, de Groot G, Hollander AP",y:2002,t:"Differences in leg muscle activity during running and cycling in humans",j:"Eur J Appl Physiol",pmid:"12355196"},
        {a:"de Azevedo Franke R, Rodrigues R, Geremia JM, et al.",y:2021,t:"Moderate intensity cycling is better than running on recovery of eccentric exercise-induced muscle damage",j:"Phys Ther Sport",pmid:"33932873"}]},
 natation:{name:"Natation",type:"Aérobie, sans impact",focus:"Haut du corps surtout (bras et épaules), jambes en complément",legs:0,upper:2,targets:[],
  facts:["En crawl, les bras apportent environ 56-63 % des contributions (vitesse et force) et les jambes environ 37-44 %.","Le battement de jambes ajoute environ 10 % de vitesse maximale sur 25 m, surtout en améliorant l'action des bras."],
  refs:[{a:"Keller S, Olstad BH, Wahl P",y:2024,t:"Lower and upper extremity contributions to propulsion and resistance during semi-tethered load-velocity profiling in front crawl swimming",j:"J Sports Sci",pmid:"38449095"},
        {a:"Deschodt VJ, Arsac LM, Rouard AH",y:1999,t:"Relative contribution of arms and legs in humans to propulsion in 25-m sprint front-crawl swimming",j:"Eur J Appl Physiol Occup Physiol",pmid:"10453920"}]},
 autre:{name:"Autre activité",type:"Profil choisi par toi",focus:"",legs:1,upper:1,targets:[],facts:["Pas d'analyse d'études pour ce sport : choisis la zone la plus sollicitée."],refs:[]}
};
const OTHER_FOCUS={legs:{legs:2,upper:0,l:"Surtout les jambes"},upper:{legs:0,upper:2,l:"Surtout le haut du corps"},both:{legs:1,upper:1,l:"Tout le corps"}};
const sportOf=o=>{const b=SPORTS[o.sport]||SPORTS.autre;if(o.sport!=="autre")return b;const f=OTHER_FOCUS[o.focus]||OTHER_FOCUS.both;return{...b,name:o.label||b.name,legs:f.legs,upper:f.upper,focus:f.l}};
const otherList=()=>Object.entries(S.other||{}).map(([id,o])=>({id,...o})).filter(o=>o.date&&isNum(o.dur)&&isNum(o.rpe)).sort((a,b)=>a.date<b.date?-1:1);
const otherOn=d=>otherList().filter(o=>o.date===d);

