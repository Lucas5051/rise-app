# Journal des modifications · v9 → v10

Base : `USCI Muscu_9.html` livrée le 22/10 (le fichier « USCI Muscu_9_2.html » cité dans le cahier des charges n'était pas joint). Sauvegarde intacte : `backup/v9/` (HTML, rapport, docs, tests, projet iPhone).

## Phase 1 · Fondations

| Modification | Pourquoi | Fichiers |
|---|---|---|
| Sources restaurées depuis le HTML v9 et découpées en 51 modules ; build identique vérifié avant toute modification | Pouvoir faire évoluer sans tout réécrire | `src/`, `build.py` |
| Projet Supabase `usci-muscu` (Paris) créé ; préprod U11 mise en pause avec ton accord | Base centrale accessible depuis plusieurs appareils | — |
| Schéma normalisé de 30 tables, RLS sur toutes, rôle protégé, liste blanche coach | Isolation appliquée par le serveur, pas par l'appli | `server/migrations/001-002` |
| Fonctions serveur : programmes, attributions, invitations, droits, instantanés, export, purge | Logique sensible hors du navigateur | `003`, `server/functions/*` |
| Invitations : code serveur, empreinte SHA-256, expiration, révocation, usage unique, anti-essais, message unique | Codes utilisables sur un autre téléphone et sûrs | `003`, `functions/invite` |
| Authentification réelle (e-mail, vérification, réinitialisation, Apple/Google prêts, déconnexion globale) ; mode démo séparé avec bandeau | Vrais comptes ; impossible de confondre démo et production | `017-cloud`, `151-cloud-auth` |
| Synchronisation hors ligne : IndexedDB, file persistante, nouvel essai, « le plus récent gagne », clés naturelles | Séance utilisable sans réseau, sans perte ni doublon | `016-idb`, `022-sync` |
| Migration v9 avec sauvegarde obligatoire, rapport vérifié sur le serveur, relance sans doublon | Garder tout l'historique de Lucas | `023-migration-v9` |
| **24/10** : import de la v9 **par fichier** (export v9 ou sauvegarde) | La v10 en ligne n'a pas la même adresse que l'artefact v9 : le navigateur ne partage pas leurs données | `023-migration-v9`, `131-coach-views` |
| Corrections du coach dans les séances clients, journal synchronisé | Historique des corrections conservé | `006` |

## Phase 2 · Programme individualisé

| Modification | Pourquoi | Fichiers |
|---|---|---|
| Prescription structurée (11 modes), références de tests, arrondi au matériel, mini/maxi, solution de repli, « Test requis », charges figées à la réalisation | Fin du champ texte « Charge » ; aucune charge inventée | `061-prescription`, `136-session-editor` |
| Tests personnalisés (unité, type, formule Brzycki/Epley affichée, exercices associés, historique) | Le coach crée ses propres références | `061`, `131-coach-views` |
| Règles d'adaptation réellement respectées, repli prudent, « contacte ton coach », règle affichée au coach | Les cases cochées n'avaient pas d'effet | `076-rules-pain` |
| Droits liés aux formules (12 clés), appliqués par la base et l'interface | Les formules n'étaient que des cartes | `002`, `003`, `130-coach` |

## Phase 3 · Expérience

| Modification | Pourquoi | Fichiers |
|---|---|---|
| Espace coach : 6 rubriques (Tableau de bord, Clients, Programmes, Bibliothèque, Communication, Paramètres coach), barre latérale sur ordinateur, barre compacte sur mobile | 9 rubriques au même niveau | `130-coach`, `131-coach-views` |
| Éditeur de séance en 4 étapes, brouillon automatique, annuler, aperçu athlète, contrôles de durée, séances lourdes rapprochées, tests manquants, duplication | Éditeur trop dense | `136-session-editor` |
| Questionnaire : détails par sport (séances, jours, horaires, durée, matchs, calendrier fixe/variable), récapitulatif modifiable, usage de chaque réponse expliqué au coach | Les réponses influençaient trop peu | `125-onboarding`, `131-coach-views` |
| Douleur : suppression de « douleur = haut du corps », questionnaire de localisation, propositions prudentes, orientation vers un professionnel, aucun diagnostic | Une douleur à l'épaule ou au dos rendait la proposition inadaptée | `076-rules-pain`, `007` |
| Médias en stockage serveur privé, compression, contrôles, URL signées, suppression réelle | Plus de médias lourds dans localStorage | `137-media-cloud`, `004` |
| **24/10** : un client ne lit que les médias des fiches **publiées** | La règle de stockage laissait lire les fichiers des fiches en brouillon | `008_media_published.sql` |
| **24/10** : chargement des programmes accéléré (index, lecture vérifiée une fois) : 7,9 s → 65 ms côté base, espace coach chargé en ~1,8 s | Au-delà d'une douzaine de programmes, la synchronisation du coach échouait (délai de 8 s de l'API dépassé) | `009_program_perf.sql` |
| **24/10** : contrastes AA (jours hors du mois, statut « à renseigner », pastille du jour, vert « ok ») et structure ARIA du calendrier (lignes `role="row"`) | Audit axe-core : 90 éléments en défaut → 0 | `style.css`, `105-ui-athlete` |
| **24/10** : bouton « Mon entraînement » sur le tableau de bord mobile | Sur iPhone, il n'était accessible que dans Paramètres coach › Compte | `130-coach` |
| **24/10** : débordements corrigés (éditeur à 375 px, espace coach à 1024 px) | Défilement horizontal détecté par les tests | `style.css`, `136-session-editor` |
| **24/10** : réserve de place pour le badge imposé par Netlify | Il recouvrait des boutons en bas à droite | `186-host-badge`, `style.css` |
| **24/10** : 3 entrées « Ce qui a changé » visibles par l'athlète | Transparence sur les changements | `045-programs` |

## Phase 4 · Natif

| Modification | Pourquoi | Fichiers |
|---|---|---|
| **24/10** : `Native.authStorage()` — jeton de session dans le trousseau iOS dans l'appli iPhone | Face ID ne doit déverrouiller qu'un jeton, jamais un mot de passe | `025-native-contract`, `017-cloud` |
| Polar non avancé | Consigne : cycle coach-client et synchronisation d'abord | — |

## Hébergement

| Modification | Pourquoi |
|---|---|
| **24/10** : site Netlify `usci-muscu` créé et publié avec ton accord ; en-têtes de sécurité (CSP limitée au serveur Supabase, pas d'intégration dans un cadre, HSTS) | Une adresse fixe pour le coach et les clients |

## Planification sportive

**Aucune modification** de la planification de Lucas en v10. Les règles sportives existantes gardent leurs sources (cours de Franchequin). Ajout d'une seule règle non issue des cours, signalée comme telle : correspondances zone de douleur ↔ exercices et seuil d'intensité 7/10 (interprétation prudente de l'appli, à valider par le coach). Formules du 1RM : Brzycki (déjà en v9) et Epley, issues de la littérature et non des cours, affichées à chaque calcul.
