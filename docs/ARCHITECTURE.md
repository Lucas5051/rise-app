# Architecture · USCI Muscu v10

## Vue d'ensemble

```
 iPhone / ordinateur (navigateur, puis coque iPhone)          Serveur (Supabase, Paris)
 ┌──────────────────────────────────────────────┐           ┌──────────────────────────────────┐
 │ Interface (HTML/CSS/JS, un fichier compilé)  │  HTTPS    │ Auth : comptes, sessions, rôles   │
 │ Moteur sportif (calendrier, charges, règles) │ ───────►  │ PostgreSQL + RLS (30 tables)      │
 │ Copie locale + file d'envoi (IndexedDB)      │ ◄───────  │ Fonctions SQL (programmes, droits)│
 │ Session : stockage web / trousseau iPhone    │           │ Edge Functions : invite, delete   │
 └──────────────────────────────────────────────┘           │ Storage : médias privés           │
         publié sur Netlify (usci-muscu.netlify.app)        └──────────────────────────────────┘
```

Deux modes, jamais mélangés (`src/js/017-cloud.js`) :
- **production** (par défaut) : comptes, rôles, programmes et données sur le serveur ;
- **démonstration** (`?demo`) : tout sur l'appareil, bandeau permanent, aucun accès serveur.

## Modules sources (`src/js`, assemblés dans l'ordre par `build.py`)

| Domaine | Fichiers |
|---|---|
| Configuration et marque | `005-config` (nom, couleurs, e-mail de support, mentions légales, liens, coach, serveur) |
| Utilitaires | `010-utils` |
| Stockage local | `015-storage` (localStorage pour l'état non sensible), `016-idb` (IndexedDB : copie locale + file d'envoi) |
| Serveur et authentification | `017-cloud` (client Supabase, mode), `151-cloud-auth` (connexion, inscription, invitation, mot de passe, déconnexion globale) |
| Synchronisation | `022-sync` (conversion données ↔ lignes, file persistante, nouvel essai, conflits) |
| Migration | `023-migration-v9` (données locales ou fichier v9 → serveur, rapport) |
| Comptes et rôles | `020-platform-accounts`, `150-auth-glue` |
| Contrat natif iPhone | `025-native-contract` (Face ID, trousseau, widget, vibrations) |
| Planification historique de Lucas | `030-lucas-plan`, `035-adaptive-plan`, `170-caen-trainings` |
| Programmes et attributions | `045-programs`, `135-coach-programs`, `136-session-editor` |
| Séances | `040-session-content`, `120-session-player` (lecteur) |
| Moteur sportif | `060-tests-loads`, `061-prescription` (charges, tests), `065-load-quantif` (sRPE, ACWR), `070-wellness`, `075-adaptation`, `076-rules-pain` (règles du coach, douleur), `080-other-activities`, `085-personal-ceiling`, `090-move-analysis` |
| Sources | `050-sources` (cours, page, principe, interprétation) |
| Bibliothèque et médias | `055-exercise-library`, `137-media-cloud` |
| Questionnaire | `125-onboarding` |
| Suivi | `105-ui-athlete`, `110-motivation`, `140-athlete-follow`, `165-wellness-form` |
| Espace coach | `130-coach`, `131-coach-views` |
| Messagerie | `115-messaging` |
| Polar | `095-polar`, `160-polar-card` |
| Notifications et rappels | `100-rpe-reminder`, `180-reminders` |
| Export et suppression | `190-data-rgpd` |
| Composants et accessibilité | `155-dialogs`, `185-a11y`, `186-host-badge` |
| Événements et démarrage | `195-events`, `200-boot` |

Le fichier compilé fait ~870 Ko : il contient supabase-js (MIT, ~190 Ko) pour fonctionner hors ligne et sans CDN. Le découpage en sources est fait ; le passage à des modules ES chargés séparément (et à un outil de build type Vite) reste une étape possible, non nécessaire au fonctionnement.

## Données : où vit quoi

| Donnée | Serveur | Appareil |
|---|---|---|
| Compte, rôle, formule, relation coach | référence | copie en lecture |
| Programmes, attributions | référence | copie (calendrier généré localement) |
| Séances, durées, RPE, adaptations, questionnaires, douleurs, tests | référence (après envoi) | copie + file d'envoi IndexedDB |
| Séance en cours (chronomètre) | — | localStorage + IndexedDB (survit à la fermeture) |
| Jeton de session | — | stockage web (navigateur) ; trousseau iOS (appli iPhone, `Native.authStorage`) |
| Médias d'exercices | Storage privé | URL signée temporaire (1 h) |

## Calendrier générique

Programme (blocs → semaines → séances → phases → exercices) + attribution (date de départ, semaine de départ) → séances datées. La semaine 1 commence le lundi de la date de départ. Le programme historique de Lucas garde son moteur propre (matchs, Caen, alternance/cours), attribué au compte de Lucas uniquement.

## Prescription des charges (`061-prescription`)

`presc = {mode, ref, pct, round, min, max, value, target, fallback}`. Modes : charge fixe, % du 1RM, % d'un test, poids du corps, poids du corps + lest, RPE, RIR, durée, distance, répétitions seules, charge libre. Sans test compatible : « Test requis pour calculer cette charge », jamais de chiffre inventé. Estimation du 1RM affichée avec sa formule (Brzycki par défaut, Epley au choix par type de test). Une séance réalisée garde sa charge figée (`S.log[séance].loads`) : une nouvelle valeur de test ne réécrit jamais l'historique.

## Règles d'adaptation (`076-rules-pain`)

Chaque programme porte `rules` (réduction du volume, retrait des explosifs, microdose, haut du corps, récupération active, réduction ciblée, déplacement). Une proposition interdite est remplacée par l'option autorisée la plus prudente ; s'il n'y en a aucune : « Contacte ton coach ». Le coach voit la règle utilisée.
