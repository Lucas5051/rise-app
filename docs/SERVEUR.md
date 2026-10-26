# Serveur · USCI Muscu v10

## 1. Choix : Supabase

| Critère | Supabase | Pourquoi c'est adapté ici |
|---|---|---|
| Base de données | PostgreSQL complet | Données relationnelles (coach → clients → programmes → séances) ; règles d'accès écrites en SQL et testables |
| Isolation | Row Level Security appliquée **par la base** | Un client qui modifie le HTML ou le stockage local n'obtient rien : chaque requête est filtrée côté serveur |
| Comptes | Supabase Auth (e-mail/mot de passe, vérification, réinitialisation, Apple, Google, déconnexion globale) | Pas de mot de passe géré par l'appli |
| Fichiers | Supabase Storage (compartiments privés, URL signées temporaires) | Médias d'exercices hors du navigateur |
| Code serveur | Edge Functions (Deno) | La clé d'administration n'existe que là |
| Hébergement | UE (Paris, eu-west-3) | Données de santé : hébergement européen |
| Coût | Offre gratuite suffisante pour démarrer | Projet en pause après 7 jours sans activité sur l'offre gratuite (voir § 10) |

Alternative écartée : un serveur Node maison (plus de code à sécuriser et à maintenir, aucun gain ici).

## 2. Projet en place

- Projet `usci-muscu`, référence `oabmnqyymksswnnwglrq`, organisation « USCI U11 », région Paris.
- Pour libérer la place (2 projets gratuits maximum), le projet `suivi-vitesse-u11-preprod` a été **mis en pause** avec ton accord du 23/10. Il se réactive depuis le tableau de bord Supabase.
- Appli publiée : https://usci-muscu.netlify.app (site Netlify `usci-muscu`, offre gratuite, en-têtes de sécurité dans `site/netlify.toml`).

## 3. Migrations (`server/migrations/`)

| Fichier | Contenu |
|---|---|
| `001_schema.sql` | 30 tables (voir § 4), contraintes, index |
| `002_security.sql` | RLS sur toutes les tables (35 règles), rôle protégé, création du profil à l'inscription, formules par défaut, déclencheur « la modification la plus récente gagne » |
| `003_functions.sql` | Fonctions : programmes (`save_program`, `program_to_json`), attributions, invitations (`create_invite`, `invite_preview`, `invite_redeem`, `revoke_invite`, `coach_invites`), droits (`my_entitlements`, `has_entitlement`), instantanés (`coach_snapshot`, `athlete_snapshot`), export (`export_my_data`), purge (`purge_user`), migration v9 (`claim_legacy_ctx`) |
| `004_storage.sql` | Compartiments privés `exercise-media` (coach) et `user-media` (client), formats et tailles autorisés, règles d'accès par dossier |
| `005_seed.sql` | Types de tests standards, adresse coach autorisée (`lucasbsnd10@gmail.com`). Aucune donnée sportive personnelle |
| `006_coach_writes.sql` | Corrections du coach dans les séances de ses clients, journal du coach synchronisé |
| `007_pain_date.sql` | Date de la séance liée à un signalement de douleur |
| `008_media_published.sql` | Un client ne lit que les médias des fiches **publiées** de son coach (la règle du stockage autorisait avant tout fichier du dossier du coach) |

| `009_program_perf.sql` | Performances : index sur les colonnes de liaison ; `program_to_json` vérifie une seule fois le droit de lecture puis lit sans règle ligne à ligne (12 programmes : 7,9 s → 65 ms ; avant, la synchronisation du coach dépassait le délai de 8 s de l'API) ; `_phase_rows` devient interne |

Toutes sont appliquées sur le projet (`list_migrations` : 001 → 009).

## 4. Tables

| Domaine | Tables |
|---|---|
| Comptes et rôles | `profiles` (rôle `coach`/`athlete`, jamais modifiable par l'utilisateur), `coach_allowlist`, `coach_clients` (relation + formule), `consents` |
| Offres | `formulas` (3 par coach : Programmes, Programme personnalisé, Coaching ; droits = liste fermée de 12 clés) |
| Invitations | `invites` (empreinte SHA-256 du code, jamais le code), `invite_attempts` (anti-essais répétés) |
| Programmes | `programs` (modèle ou copie client), `program_blocks`, `program_weeks`, `program_sessions`, `session_phases`, `phase_exercises` (prescription structurée en JSON), `assignments` (date et semaine de départ) |
| Bibliothèque | `exercises`, `exercise_media` (droits d'utilisation, brouillon/publié), `test_types` |
| Données athlète | `test_results`, `session_logs` (statut, durée réelle, RPE, adaptation, raison, commentaire, charges), `wellness_entries`, `pain_reports`, `other_activities`, `club_events`, `hr_records`, `athlete_state` (réglages, badges) |
| Communication | `messages` (privé ou groupe), `call_requests`, `coach_reviews` |
| Traçabilité | `audit_log` (historique des modifications), `security_log` (codes refusés, blocages, purges) |

Les calendriers ne sont pas stockés : ils sont **générés** à partir de l'attribution (programme + date de départ), sur chaque appareil, de façon identique.

## 5. Isolation (RLS)

| Qui | Peut lire | Peut modifier |
|---|---|---|
| Athlète | son profil, sa copie de programme, ses séances, tests, questionnaires, douleurs, activités, ses messages (selon formule), les fiches **publiées** de son coach | ses propres données sportives ; ses prénom/nom ; jamais son rôle, sa formule, son coach ou un programme |
| Coach | les clients **qui lui sont rattachés** (`coach_clients`) et leurs données ; ses modèles ; sa bibliothèque | ses modèles et les copies de ses clients ; les corrections de séances de ses clients (journalisées) |
| Personne | — | `invites`, `invite_attempts`, `coach_allowlist`, `security_log` : aucune règle d'accès → fermées à tous, sauf aux fonctions serveur |

Le rôle coach est attribué **uniquement** par le serveur, à l'inscription, si l'adresse figure dans `coach_allowlist`. Le déclencheur `protect_profile` refuse tout changement de rôle depuis l'appli.

Les fonctions `SECURITY DEFINER` appelables par un utilisateur connecté (signalées par l'outil d'audit de Supabase) sont voulues : chacune vérifie elle-même `auth.uid()` et ne renvoie que ce qui concerne l'appelant (`is_coach`, `my_entitlements`, `coach_invites`, `create_invite` réservé au coach, `program_to_json` qui renvoie `NULL` sans droit de lecture, `media_readable`, etc.). Les fonctions sensibles (`invite_redeem`, `purge_user`, `_invite_locked`…) sont retirées au rôle `authenticated` : seules les fonctions serveur les appellent.

## 6. Invitations

1. Le coach prépare l'identité, la formule, le programme, la date et la semaine de départ → `create_invite` génère un code `XXXX-XXXX` (alphabet sans 0/O/1/I, 8 caractères, ~1 000 milliards de combinaisons).
2. Seule l'**empreinte SHA-256** est conservée ; la liste du coach n'affiche que les 2 derniers caractères.
3. Durée de validité choisie (14 jours par défaut), révocable, **usage unique**.
4. Fonction serveur `invite` : aperçu (identité et programme préparés), puis création du compte confirmé, rattachement au coach, attribution du programme, consentements.
5. 5 essais ratés en 15 min depuis la même adresse réseau → blocage 15 min (adresse jamais stockée en clair : empreinte salée).
6. Code inconnu, expiré, révoqué ou déjà utilisé → **même message** : « Code invalide ou expiré ».

## 7. Droits liés aux formules

| Droit | Programmes | Programme personnalisé | Coaching |
|---|:-:|:-:|:-:|
| `predefined_programs` | ✔ | ✔ | ✔ |
| `individual_program`, `custom_tests`, `auto_loads`, `auto_adapt`, `weekly_follow` | | ✔ | ✔ |
| `private_messaging`, `group_messaging`, `coach_review`, `calls`, `advanced_stats`, `extended_history` | | | ✔ |

Les droits sont calculés par le serveur (`my_entitlements`). La messagerie est bloquée **par la base** pour une formule qui ne l'inclut pas ; l'interface masque ou verrouille la fonction avec une explication. Le coach peut modifier le contenu des formules (Paramètres coach › Formules). **Aucun paiement** : prix, conditions et prestataire non définis. L'architecture (formule rattachée à `coach_clients`) accepte plus tard un statut d'abonnement venant d'un prestataire (webhook vers une fonction serveur).

## 8. Synchronisation

- L'appli travaille sur sa copie locale ; chaque modification part dans une **file persistante IndexedDB** (survit à la fermeture), envoyée dès que le réseau revient (nouvel essai automatique, délai croissant, toutes les 30 s au plus tard).
- Chaque ligne a une clé naturelle (`athlete_id + slot_id`, `athlete_id + date`…) : un envoi rejoué ne crée **aucun doublon**.
- Conflit : la modification la plus **récente** (horodatage de l'appareil) gagne (`keep_newest`) ; un envoi plus ancien est ignoré.
- Le coach reçoit les nouvelles données à l'ouverture de l'appli, au retour au premier plan, au retour du réseau ou avec « Synchroniser maintenant ». Pas de mise à jour en direct (temps réel) dans cette version.
- Déconnexion avec des envois en attente : l'appli prévient et propose de rester connecté.

## 9. Réglages à faire une fois (tableau de bord Supabase)

Ils ne sont pas accessibles avec l'outil utilisé pour construire la v10.

1. **Authentication › URL Configuration** : *Site URL* = `https://usci-muscu.netlify.app` ; *Redirect URLs* : ajouter `https://usci-muscu.netlify.app/**`. Sans cela, les liens de confirmation et de réinitialisation renvoient vers `localhost`.
2. **Envoi des e-mails** : le serveur d'e-mails fourni par Supabase n'envoie qu'aux membres de l'organisation Supabase (donc à toi, pas à un client) et à faible débit. Pour l'inscription libre et « Mot de passe oublié » des clients : *Authentication › Emails › SMTP Settings* avec un service d'envoi (Brevo, Resend, Postmark…). **Les clients invités par code n'en ont pas besoin** : leur compte est créé déjà confirmé par la fonction `invite`.
3. **Compte coach** : *Authentication › Users › Add user* → `lucasbsnd10@gmail.com`, mot de passe, « Auto Confirm User ». Le rôle coach est donné automatiquement.
4. *Facultatif* : *Authentication › Providers* → Apple et Google (identifiants développeur Apple et client OAuth Google nécessaires). Les boutons de l'appli fonctionnent dès que les fournisseurs sont activés.
5. *Recommandé avant commercialisation* : protection contre les mots de passe divulgués (*Authentication › Policies*, offre payante), sauvegardes quotidiennes et restauration (offre payante).

## 10. Exploitation

- Offre gratuite : le projet se met **en pause après 7 jours sans requête** ; il se relance depuis le tableau de bord (les données sont conservées). Pour un usage commercial : offre Pro (sauvegardes, pas de pause).
- Clés : seule la clé **publishable** (`sb_publishable_…`) est dans l'appli ; elle n'ouvre rien sans les règles RLS. La clé d'administration (`service_role`) n'existe que dans l'environnement des fonctions serveur. `build.py` refuse de construire si une clé secrète apparaît dans le HTML.
- Comptes de test : `coach.test@usci-muscu.test` (coach de test autorisé) ; les comptes athlètes de test sont supprimés à la fin de chaque test.
- **Le mot de passe du coach de test est écrit dans les scripts de test.** Avant d'inviter de vrais clients ou de partager ces fichiers : supprimer ce compte (Authentication › Users) et retirer son adresse de `coach_allowlist`, ou changer son mot de passe. Il ne voit que ses propres clients de test (isolation).

## 11. Réinstaller sur un autre projet

```bash
supabase link --project-ref <ref>
for f in server/migrations/*.sql; do supabase db query < "$f"; done   # ou SQL Editor, dans l'ordre
supabase functions deploy invite && supabase functions deploy delete-account
```
Puis : `APP_CONFIG.cloud` (`src/js/005-config.js`) ← URL et clé publishable du projet, `python3 build.py`, publier `dist/USCI Muscu_10.html` comme `index.html`.

## 12. Tests de sécurité

`server/tests/security_tests.sql` : 58 vérifications dans une transaction annulée (aucune donnée ne reste). Exécutées le 24/10/2026 sur le serveur de production, après les migrations 001 → 009 : **58/58**. Détail dans `docs/TESTS.md`.
