---
name: rise-design-system
description: RISE — Design System & Product Experience. À utiliser pour toute création, modification, amélioration ou analyse de l'application RISE (espace athlète, espace coach, inscription, écrans mobiles et web, composants, animations, textes d'interface, audits UI/UX, prototypes et futurs écrans de la marque RISE ou de l'ancienne appli USCI Muscu).
---

# RISE — Design System & Product Experience

Source prioritaire pour toute décision de marque, d'interface et de texte sur RISE.
Version 1.0 (26/10/2026). Les valeurs marquées **[proposé]** sont des valeurs de départ à valider avec Lucas ; tout le reste est validé.

## 1. Ordre de travail obligatoire

Avant toute modification :
1. Analyser l'écran existant (capture à 390 px, mode jour et mode nuit).
2. Lister les fonctions et données à préserver (voir § 13).
3. Repérer les écarts avec ce skill.
4. Proposer les changements utiles, sans reconstruire ce qui fonctionne.
5. Appliquer ce design system de façon cohérente.
6. Vérifier mode jour et mode nuit, iPhone 320 / 375 / 390 / 430 px, tablette 768 px, ordinateur 1280 px.
7. Contrôler l'accessibilité (§ 10).
8. Expliquer les changements et signaler ce qui reste à finaliser.

Priorité des outils : ce skill (identité) > Frontend Design (qualité visuelle) > Playwright (parcours, affichage mobile) > Code Review (qualité du code) > GitHub (dépôt `Lucas5051/rise-app`, source de vérité) > Figma (référence visuelle seulement, si un fichier RISE est fourni). Ne pas combiner d'autres skills de design sur la même tâche.

Technologie : conserver la technologie actuelle (HTML/CSS/JS assemblé par `build.py`). Ne jamais migrer vers React ou un autre framework sans demande explicite ou justification validée. Toute modification importante de structure doit d'abord être expliquée.

## 2. Marque

- Nom : **RISE**, toujours en majuscules comme logotype ou signature.
- Signature : **Built to perform.**
- Positionnement : « RISE transforme la préparation physique individualisée en une expérience simple, motivante et accessible, pour aider chaque sportif à progresser vers son meilleur niveau. »
- Promesse : « La préparation physique qui s'adapte à toi pour t'aider à progresser. »
- Idée directrice : « L'effort qui élève. » Chaque séance construit la personne et l'athlète. Conviction : « Grâce au travail, chacun peut accomplir ses objectifs. »
- Évoque : progression, élévation, régularité, persévérance, performance, confiance, individualisation, méthode scientifique sérieuse, simplicité.
- Personnalité : ambitieuse, exigeante, motivante, humaine, professionnelle, moderne, premium, crédible, accessible, dynamique, universelle, non genrée.
- Jamais : militaire, agressive, élitiste, froide, médicale, infantile, artificielle, générique, surchargée, « faite par une IA ».

Public : débutants en musculation, sportifs amateurs, régionaux, nationaux, professionnels, recherche de bien-être, perte de poids ou renforcement, clients suivis par un préparateur. Une personne sans connaissance scientifique doit tout comprendre. **La science guide le programme, elle ne complique jamais l'interface.**

## 3. Logo

Composition : symbole construit sur le R, forme dynamique bleue (élévation, mouvement), mot RISE, accent corail sur le « I ». Référence : `references/images/logo-rise-officiel.png`.

Variantes à prévoir : symbole seul · symbole + RISE · horizontale · verticale · claire · sombre · monochrome · icône d'application.

Interdits : déformer, étirer, changer les proportions, ajouter ombre, 3D, texture ou dégradé, changer les couleurs, réduire la zone de protection (au moins la largeur de la barre verticale du R autour du logo **[proposé]**), mettre « Built to perform » dans les petites versions. Lisibilité vérifiée à 24, 32, 64 et 180 px.

Le fichier fourni est une image (PNG) : son bleu mesuré est #2748F2, pas exactement le Bleu RISE #3158F5. Utiliser un fichier vectoriel (SVG) officiel dès qu'il existe ; ne jamais redessiner le logo à la main.

## 4. Couleurs

| Rôle | Jour | Nuit |
|---|---|---|
| Arrière-plan | #F7F2EC | #080D18 |
| Surface principale | #FFFAF6 | #121B2C |
| Surface secondaire | #EFE8E1 | #19253B |
| Texte principal | #0B1220 | #F7F8FC |
| Texte secondaire | #746C67 | #98A4B8 |
| Bordures | #E7DCD2 | #28354B |
| Action principale | Corail #FF7359 | Bleu électrique #4165FF |
| Action secondaire / accent | Bleu nuit #0B1220 | Corail #FF7359 |

Couleurs de marque : Corail RISE #FF7359 (action, état actif, progression, énergie, célébration) · Bleu RISE #3158F5 (données de performance, informations sportives) · Bleu électrique #4165FF (mode nuit : surfaces mises en avant, graphiques actifs) · Bleu nuit #0B1220 (textes forts, boutons sombres, fond nuit).

Mode jour : chaleureux et énergisant, jamais de blanc clinique en fond. Mode nuit : performance premium, jamais trop sombre ni illisible.

**Règles de contraste (calculées, WCAG AA) — obligatoires :**
- Texte sur fond corail : toujours **bleu nuit** (7,0:1). Blanc sur corail = 2,7:1 → interdit pour du texte.
- Corail comme **couleur de texte** sur fond jour : interdit (2,4:1). Sur fond nuit : autorisé (7,3:1).
- Texte blanc sur Bleu RISE (5,5:1) ou Bleu électrique (4,6:1) : autorisé.
- Bleu électrique comme couleur de texte sur fond nuit : seulement ≥ 18 px ou gras ≥ 14 px (4,2:1 et 3,7:1 sur surface).
- Texte secondaire jour #746C67 : autorisé sur arrière-plan et surface principale (4,6 et 5,0:1), **pas sur la surface secondaire #EFE8E1** (4,2:1) ; y utiliser le texte principal.
- Bordures (1,2:1 et 1,6:1) : décoratives uniquement ; un champ de saisie ou un état doit aussi se distinguer autrement (contour plus foncé au focus, libellé).

Hiérarchie : un seul accent dominant par écran. Pas de bleu et de corail partout ; jamais plus de 3 couleurs vives visibles en même temps **[proposé]**.

Carte « Ressenti du jour » (seul dégradé autorisé dans l'interface) :
- Jour : corail vers bleu marine. Le texte posé sur la zone corail est **bleu nuit** ; le texte blanc n'est autorisé que sur la partie marine. (La maquette de référence jour met du blanc sur le corail : à corriger.)
- Nuit : fond bleu nuit, diffusion de bleu clair sur les côtés, texte #F7F8FC.
- Le dégradé ne réduit jamais la lisibilité.

## 5. Typographie

- Principale : **Inter** (esprit sportif, moderne, lisible, légèrement étroit, moins massif que Nike). Graisses : 400 textes, 500 informations importantes, 600 titres et boutons. 700/800 seulement exceptionnellement.
- Secondaire : **IBM Plex Mono**, uniquement pour chronomètres, temps de travail et de repos, données sportives, scores, étiquettes techniques, valeurs numériques courtes. Jamais pour des paragraphes ni pour tous les titres.
- Échelle **[proposé]** : 12 (étiquettes) · 14 (texte secondaire) · 16 (texte) · 18 · 22 · 28 (titre d'écran) · 34 (titre d'accueil) · 48 Plex Mono (chronomètre). Interlignage 1,4 à 1,5 pour le texte, 1,15 pour les titres.
- Aucune information utile sous 14 px. Exception **[proposé]** : libellés de la barre d'onglets et petites étiquettes, 12 px minimum en 600 (« Entraînement » ne tient pas en 14 px dans 4 onglets à 320 px).
- Titres courts, hiérarchie claire, pas de phrase longue en majuscules (les sur-titres courts en capitales espacées restent possibles).
- Doit fonctionner avec la taille de texte agrandie d'iOS.

## 6. Espacements, rayons, bordures, ombres — « Équilibre RISE »

- Grille de 4 px **[proposé]** : 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64. Marges latérales mobiles : 16 px (20 px dès 390 px).
- Rayons **[proposé]** : 8 (petits éléments) · 14 (boutons, champs, tuiles) · 22 (cartes) · arrondi complet (pastilles, onglet actif). Toujours ces valeurs, aucune autre.
- Bordures légères 1 px aux couleurs du § 4 ; préférer les différences de surface aux ombres.
- Ombres : une seule ombre douce pour les éléments flottants (barre d'onglets, fenêtres) ; aucune ombre sur les cartes ordinaires.

## 7. Composants et écrans

Principes :
- Un seul objectif principal par écran ; une action principale visible immédiatement.
- Informations secondaires discrètes ; espace vide pour clarifier ; pas d'accumulation de cartes.
- Formes structurées pour les données, angles légèrement arrondis, cartes confortables, boutons évidents.
- Cibles tactiles ≥ 44 × 44 px ; utilisable à une main (actions principales dans la moitié basse).

Composants autorisés **[proposé]** : bouton principal, bouton secondaire, bouton discret, bouton icône · carte (standard, mise en avant) · tuile de donnée (valeur + libellé) · pastille d'état · barre d'onglets · en-tête d'écran · champ, sélecteur, curseur · fenêtre et feuille du bas · liste · minuteur · carte de séance · bande de la semaine · graphique simple · bannière d'information. Tout nouveau composant doit d'abord être ajouté ici.

États à prévoir pour chaque écran : vide, chargement, erreur, hors connexion, mode jour, mode nuit.

Navigation athlète : Accueil · Calendrier · Entraînement · Suivi. Paramètres via l'engrenage en haut à droite, jamais en 5e onglet. Espace coach : navigation latérale sur ordinateur, barre compacte sur mobile.

## 8. Icônes — « Signal sportif »

Simples, modernes, épaisseur de trait identique (2 px à 24 px **[proposé]**), légèrement sportives, bien distinctes. Inactif : neutre ou bleu nuit atténué ; actif : corail. Barre de navigation sur fond clair (jour) ou surface bleu nuit (nuit), jamais entièrement noire en mode jour. Libellé quand il aide à comprendre. Jamais d'emoji comme icône de navigation. Ne pas dessiner les logos d'autres marques : fichiers officiels ou pictogramme neutre + nom complet.

## 9. Animations — « Énergie festive »

Durées : micro-interactions 150–250 ms · changement d'écran 250–400 ms · célébration 800–1 500 ms maximum. Rapides, fluides, gratifiantes, jamais bloquantes.

Fin de séance : animation de validation en blanc, Bleu RISE et corail ; quelques confettis sur les côtés ; phrase motivante ; nombre de séances consécutives ; fermeture facile.

Éviter : lenteur, rebonds excessifs, confettis envahissants, transitions qui empêchent de continuer, effets décoratifs répétés. Respect obligatoire de « Réduire les animations » (aucun mouvement, information conservée).

## 10. Accessibilité

Contrastes AA (§ 4) · cibles ≥ 44 px · focus visible · navigation au clavier · fenêtres avec focus bloqué, Échap et retour du focus · arrière-plan inerte sous une fenêtre · libellés accessibles · états compréhensibles sans la couleur (icône ou texte en plus) · taille de texte iOS agrandie · VoiceOver · annonces raisonnables pendant les chronomètres · aucune information transmise seulement par une animation.

## 11. Ton de voix — « coach juste »

Simple, direct, humain, encourageant, précis, positif, accessible, jamais culpabilisant, jamais trop scientifique face à l'athlète. L'athlète doit comprendre : quoi faire, pourquoi c'est utile, comment bien le faire, combien de temps, et la suite. La science reste dans la logique de l'appli et les explications destinées au coach. Tutoiement.

Exemples justes : « Voici ta séance du jour. » · « Tu es prêt. On commence ? » · « Prends le temps de bien réaliser chaque mouvement. » · « Ton programme a été adapté à ton état du jour. » · « Échauffement terminé. Tu peux passer à la suite. » · « Encore une étape de franchie. » · « Belle séance. Ta régularité fait la différence. » · « Une séance non réalisée ? Indique simplement la raison. » · « Ton niveau de fatigue est élevé. Une adaptation est recommandée. »

À éviter : longues explications physiologiques, formulations anxiogènes, injonctions agressives, promesses irréalistes, culpabilisation, jargon, phrases génériques creuses (« Libère ton potentiel », « Dépasse tes limites », « Ton parcours commence ici »).

## 12. Photographie — « L'effort qui élève »

70 % « Vrai effort » : sportifs réellement en action, concentration, effort, transpiration, mouvements crédibles, morphologies variées, femmes et hommes, tous niveaux, plusieurs disciplines, vrais lieux d'entraînement.
30 % « Élan premium » : cadrages graphiques, lumière travaillée, mouvement, angles dynamiques, compositions qui évoquent l'élévation.
Éviter : banques d'images artificielles, poses irréalistes, corps uniquement ultra-musclés, photos sombres illisibles, clichés fitness, images qui réduisent RISE à la musculation. Aucune image sans droits d'utilisation ; aucune image d'une personne réelle sans accord.

Illustrations **[proposé]** : formes géométriques simples issues du symbole (diagonale montante, accent corail), aplats, jamais de personnages dessinés ni d'illustrations génériques.

## 13. À préserver absolument

Données existantes, logique métier, comptes, séances, tests, questionnaires, résultats, calendriers, statuts, fonctions opérationnelles, planification historique de Lucas (séance de tests du 12/10 réalisée), règles sportives sourcées (cours de Franchequin). Ne jamais inventer de donnée sportive ni afficher une valeur fictive comme réelle ; ne jamais modifier une règle métier sans l'expliquer ; ne jamais supprimer une fonction sans autorisation.

## 14. Références (s'inspirer, ne jamais copier)

| Appli | Retenir | Éviter |
|---|---|---|
| Nike / Nike Training Club | visuels forts, messages courts, action, confiance, images immersives | titres toujours très épais, ton publicitaire dans les écrans fonctionnels, agressivité |
| Strava | typographie sportive fine, lecture simple, données claires, hiérarchie, progression | trop de statistiques à la fois, mécanismes sociaux inutiles |
| WHOOP | état du sportif lu d'un coup d'œil, récupération et charge claires, données → recommandations, bon mode sombre | jargon, écrans trop chargés, copie de ses indicateurs |
| Apple Fitness | simplicité, accessibilité, animations de progression, cohérence, encouragement | copier les anneaux ou l'identité Apple |
| Freeletics | séance guidée, accompagnement, explication des exercices, adaptation | ton trop intense, injonctions, aspect militaire, promesses excessives |

Références visuelles RISE validées : `references/images/accueil-reference-jour.png`, `references/images/accueil-reference-nuit.png` (direction générale ; corriger le texte blanc sur corail de la carte jour).

## 15. Interdits

Inventer des données · changer une règle métier sans l'expliquer · supprimer une fonction sans accord · valeur fictive présentée comme réelle · multiplier les dégradés · trop de cartes · bleu et corail partout sans hiérarchie · écrans surchargés · copier une autre appli · tableau de bord générique · jargon face à l'athlète · science plus visible que l'expérience · typographie épaisse partout · décor qui complique la navigation.

## 16. Anti « fait par une IA »

Pas de dégradés violets ou arc-en-ciel, pas de verre dépoli décoratif, pas d'emoji dans l'interface, pas de grilles de cartes identiques, pas d'icônes génériques sans rapport, pas de textes de remplissage, pas de chiffres inventés pour « faire joli », pas de titres creux. Chaque élément doit avoir une raison d'être liée à l'action du jour.

## 17. Un écran est terminé quand

- On comprend en moins de 5 secondes ce qu'il montre et quelle est l'action principale.
- Ce qui est secondaire est masqué, déplacé ou discret.
- Il fonctionne à 320, 375, 390, 430, 768 et 1280 px, en mode jour et nuit, sans débordement.
- Contrastes AA, cibles ≥ 44 px, clavier et lecteur d'écran vérifiés automatiquement.
- États vide, chargement, erreur et hors connexion présents.
- Utilisable à une main sur iPhone.
- Aucune régression : tous les tests existants réussissent ; captures avant/après et rapport fournis ; Code Review passé.

## 18. Mise à jour

Une règle nouvelle remplace l'ancienne (pas d'ajout contradictoire). Les valeurs [proposé] deviennent définitives après validation de Lucas. Journal : 1.0 (26/10/2026) création.
