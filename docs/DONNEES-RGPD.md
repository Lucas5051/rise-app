# Données personnelles et RGPD · USCI Muscu v10

> Description technique du comportement de l'appli. Elle ne remplace pas l'avis d'un juriste ou d'un délégué à la protection des données, indispensable avant toute commercialisation (données de santé).

## 1. Données traitées

| Catégorie | Exemples | Où |
|---|---|---|
| Compte | prénom, nom, e-mail, rôle, formule, coach | serveur (`profiles`, `coach_clients`) |
| Inscription | objectifs, sports (jours, horaires, durée, matchs), niveau, disponibilités, équipement, appareils, attentes | serveur (`profiles.questionnaire`) |
| Données physiques | poids, taille, âge, sexe | serveur |
| **Santé** | ressenti (sommeil, fatigue, stress, courbatures), douleurs (zone, intensité, apparition, déclencheur, repos), fréquence cardiaque | serveur (`wellness_entries`, `pain_reports`, `hr_records`) |
| Entraînement | séances, statuts, durées réelles, RPE, adaptations et raisons, charges, tests | serveur |
| Échanges | messages privés et de groupe, demandes d'appel | serveur |
| Médias | photos/vidéos d'exercices (coach), médias personnels (client) | Storage privé |
| Technique | jeton de session, file d'envoi hors ligne | appareil (trousseau iOS dans l'appli iPhone) |

Le mot de passe n'est jamais vu ni stocké par l'appli : il est géré et haché par Supabase Auth.

## 2. Consentement

À la création du compte (inscription libre ou code coach), une case **obligatoire** recueille l'accord pour l'enregistrement des données d'entraînement, de ressenti et de douleur (données de santé). Deux lignes sont créées dans `consents` (`cgu`, `donnees_sante`, version `2026-10`, date). Sans la case, le compte n'est pas créé (testé).

## 3. Isolation

Un client ne voit que ses données ; un coach ne voit que ses clients rattachés ; un client ne peut ni changer de rôle, ni changer de formule, ni lire un autre client. Appliqué par la base (RLS), prouvé par 58 tests SQL et 47 tests de bout en bout (`docs/TESTS.md`).

## 4. Droits des personnes

| Droit | Mise en œuvre |
|---|---|
| Accès / portabilité | engrenage › Export des données : JSON complet produit **par le serveur** (`export_my_data` : profil, questionnaire, formule, coach, attributions et programme, séances, durées, RPE, adaptations, tests, ressentis, douleurs, activités, FC, messages, demandes d'appel, consentements, historique) + CSV des séances et questionnaires. Exclus : mot de passe, jetons, empreintes de codes, clés, données d'autres clients (testé) |
| Rectification | Paramètres › Profil ; corrections de durée historisées ; corrections du coach tracées dans `audit_log` |
| Effacement | engrenage › Suppression des données → saisie de « SUPPRIMER » → fonction serveur `delete-account` (voir § 5) |
| Retrait du consentement | aujourd'hui : suppression du compte. Un retrait partiel (garder le compte sans données de santé) est à concevoir |

## 5. Ce que fait la suppression (serveur)

1. Vérifie l'identité avec le jeton de l'utilisateur (personne ne peut supprimer le compte d'un autre).
2. `purge_user` : messages de groupe **anonymisés** (« Message d'un ancien membre »), historique restant **anonymisé**, invitation utilisée vidée, journal de sécurité sans identifiant.
3. Supprime ses fichiers dans `user-media/<id>/` (suppression réelle du stockage).
4. Supprime le compte Auth → profil, séances, tests, questionnaires, douleurs, messages privés, copie de programme, attributions, consentements partent **en cascade**.
5. Les autres clients et les modèles du coach ne sont pas touchés (testé).
6. Un coach qui suit encore des clients ne peut pas supprimer son compte (il doit d'abord terminer les suivis).

## 6. Médias

Compartiments **privés** ; lecture par URL signée valable 1 h ; un client ne lit que les fiches **publiées** de son coach ; formats (JPEG, PNG, WebP, MP4, MOV) et tailles (photo compressée à 720 px et 10 Mo maximum, vidéo 50 Mo ; médias personnels 10 Mo) contrôlés dans l'appli et par le serveur ; la visibilité d'un média suit le statut de sa fiche (migration 008, testé) ; droits d'utilisation obligatoires avant l'envoi ; suppression réelle du fichier. Aucune image trouvée sur Internet n'est intégrée.

## 7. Hébergement et sous-traitants

| Sous-traitant | Rôle | Lieu |
|---|---|---|
| Supabase | base, comptes, fichiers, fonctions | UE (Paris, AWS eu-west-3) |
| Netlify | hébergement des fichiers de l'appli (aucune donnée personnelle) | CDN mondial |
| Service d'e-mails (à choisir) | confirmations, mots de passe | à définir |
| Apple (plus tard) | notifications, Sign in with Apple | — |

Contrats de sous-traitance (article 28) à accepter dans chaque service. Pour des données de santé traitées pour le compte de tiers en France, la question de l'hébergement certifié **HDS** doit être tranchée par un juriste avant commercialisation.

## 8. Conservation (à décider)

Rien n'est supprimé automatiquement aujourd'hui (hors invitations expirées, inutilisables). Proposition à valider : compte actif tant que le suivi dure ; suppression ou anonymisation après 24 mois d'inactivité ; journal de sécurité 12 mois.

## 9. À faire avant commercialisation

Mentions légales et politique de confidentialité (champs prévus dans `APP_CONFIG.legal`), adresse de support, analyse d'impact (AIPD), registre des traitements, décision HDS, durée de conservation, sauvegardes (offre payante), retrait partiel du consentement.
