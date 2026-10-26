---
title: "USCI Muscu · Version 10 (serveur et multi-appareil)"
subtitle: "Compte rendu · 24 octobre 2026"
lang: fr
---

# En bref

La v10 fonctionne **entre deux appareils** grâce à un vrai serveur : le coach crée un programme et une invitation sur son ordinateur ; le client saisit le code sur son téléphone, crée son compte et voit son calendrier tout de suite ; après sa séance, le coach reçoit la durée réelle, le statut, le RPE et l'adaptation. Ce cycle a été testé de bout en bout sur l'appli **en ligne** (https://usci-muscu.netlify.app) avec le serveur de production (Supabase, Paris).

| | |
|---|---|
| Appli en ligne | https://usci-muscu.netlify.app (démonstration locale : `?demo`) |
| Serveur | Supabase `usci-muscu`, Paris, 30 tables, isolation par la base (RLS), 9 migrations, 2 fonctions serveur |
| Tests | **327 vérifications automatisées réussies**, 0 échec ; 0 erreur, 0 débordement et 0 défaut d'accessibilité automatique sur 6 largeurs |
| Planification de Lucas | **inchangée** ; données v9 migrables (même navigateur ou fichier), séance du 12/10 toujours réalisée |
| Pas encore commercialisable | e-mails clients (SMTP), mentions légales, décision HDS, appli iPhone native, paiement (voir § 9) |

Base de travail : « USCI Muscu_9_2.html » n'était pas joint ; la v9 livrée le 22/10 a servi de base et reste sauvegardée intacte.

# 1. Ce qui a été modifié, et pourquoi

## Phase 1 · Fondations (priorité P0)

| Modification | Pourquoi |
|---|---|
| **Serveur Supabase** (Paris) : comptes, rôles, relations coach-client, invitations, programmes (blocs, semaines, séances, phases, exercices), attributions, tests, séances, ressentis, douleurs, activités, FC, messages, appels, formules, consentements, historique, journal de sécurité | Les données étaient enfermées dans un navigateur : un code créé chez le coach était inutilisable sur l'iPhone d'un client |
| **Isolation par la base** (RLS sur les 30 tables) ; rôle coach donné uniquement par le serveur (liste blanche) | Modifier le HTML ou le stockage local ne donne plus aucun accès |
| **Invitations** : code généré par le serveur, seule l'empreinte SHA-256 conservée, durée limitée, révocable, usage unique, 5 essais / 15 min, même message pour tout refus | Codes sûrs et utilisables depuis un autre appareil |
| **Authentification** : e-mail + mot de passe, vérification, réinitialisation, déconnexion de tous les appareils, Apple/Google prêts | Vrais comptes, aucun mot de passe vu par l'appli |
| **Hors ligne** : copie locale + file d'envoi IndexedDB, indicateur, nouvel essai automatique, « la modification la plus récente gagne », aucun doublon | Une séance doit pouvoir se faire sans réseau |
| **Mode démonstration séparé** (`?demo`, bandeau permanent, jamais relié au serveur) | Impossible de confondre démo et production |
| **Migration v9** avec sauvegarde obligatoire et rapport vérifié sur le serveur ; **import par fichier** | La v10 en ligne n'a pas la même adresse que l'artefact v9 : le navigateur ne partage pas leurs données |
| **Hébergement Netlify** (avec ton accord) + en-têtes de sécurité | Une adresse fixe pour le coach et les clients |

## Phase 2 · Programme individualisé (P0)

| Modification | Pourquoi |
|---|---|
| **Charges structurées** : fixe, % du 1RM, % d'un test, poids du corps, lesté, RPE, RIR, durée, distance, répétitions, libre ; arrondi au matériel, mini/maxi, repli | Le champ texte « Charge » ne permettait aucun calcul |
| Sans test : « **Test requis pour calculer cette charge** » ; nouvelle valeur de test → charges futures recalculées ; séances réalisées figées | Ne jamais inventer de charge ni réécrire l'historique |
| **Tests personnalisés** (unité, type, formule Brzycki ou Epley affichée, exercices associés) | Le coach crée ses propres références |
| **Règles d'adaptation réellement appliquées** : adaptation interdite jamais proposée, repli vers l'option autorisée la plus prudente, sinon « contacte ton coach » ; règle affichée au coach | Les cases cochées n'avaient pas d'effet |
| **Droits des formules** (12 droits) appliqués par la base et l'interface ; aucun paiement | Les formules n'étaient que des cartes visuelles |

## Phase 3 · Expérience (P1)

| Modification | Pourquoi |
|---|---|
| Espace coach en **6 rubriques** (Tableau de bord, Clients, Programmes, Bibliothèque, Communication, Paramètres coach), barre latérale sur ordinateur, barre compacte sur mobile | 9 rubriques au même niveau |
| **Éditeur de séance en 4 étapes** : brouillon automatique, annuler, retour, duplication, aperçu athlète, contrôle de durée, séances lourdes rapprochées, tests manquants | Éditeur trop dense |
| **Questionnaire** : détails par sport (séances, jours, horaires, durée, matchs, calendrier fixe ou variable), récapitulatif modifiable, usage réel de chaque réponse expliqué au coach | Les réponses influençaient trop peu |
| **Douleur** : fin de « douleur = haut du corps » ; zone, intensité, apparition, déclencheur, gêne au repos ; proposition prudente à confirmer ; arrêt et avis d'un professionnel si douleur importante, au repos ou persistante ; aucun diagnostic | Une douleur à l'épaule ou au dos rendait la proposition inadaptée |
| **Médias** dans un stockage serveur privé (compression, formats, tailles, droits obligatoires, URL temporaires, suppression réelle) | Plus de fichiers lourds dans le navigateur |
| **Accessibilité** : contrastes AA et structure du calendrier corrigés (audit axe-core : 90 éléments → 0) | Exigence du cahier des charges |

## Phase 4 · Natif

Jeton de session rangé dans le **trousseau iOS** dans la future appli iPhone (`Native.authStorage`), Face ID ne déverrouillant que ce jeton. Polar volontairement non avancé : cycle coach-client et synchronisation d'abord.

## Défauts trouvés et corrigés pendant les tests du 24/10

1. **Synchronisation du coach en échec** à partir d'une douzaine de programmes (7,9 s, délai de 8 s du serveur dépassé) → index et lecture vérifiée une fois : 65 ms côté base, espace coach chargé en ~1,8 s, test de durée ajouté.
2. **Photos de fiches en brouillon lisibles par les clients** via le stockage → règle corrigée et testée.
3. Débordements (375 px, 1024 px), badge Netlify recouvrant des boutons, contrastes, « Mon entraînement » absent du tableau de bord mobile.

# 2. Méthodologie sportive

- **Aucune modification** de ta planification en v10 ; les règles existantes gardent leurs sources (cours de Franchequin : titre, chapitre, page, principe, interprétation, impact).
- Précautions conservées : ratio aigu/chronique = indicateur de tendance, pas une prédiction de blessure ; RPE × durée active = charge interne ; aucune adaptation sans accord ; aucun diagnostic.
- **Ajouts qui ne viennent pas des cours**, signalés comme tels dans l'appli : correspondances zone de douleur ↔ exercices et seuil d'intensité 7/10 (interprétation prudente, à valider par toi) ; formules du 1RM de Brzycki (déjà en v9) et d'Epley (littérature), affichées à chaque calcul et modifiables par type de test. Les cours fournis ne traitent pas la localisation de la douleur : si tu as une source, je l'intègre.

# 3. Fichiers créés

| Fichier | Contenu |
|---|---|
| `USCI Muscu_10.html` | Appli compilée (identique au site en ligne) |
| `src/` (51 modules), `build.py` | Sources organisées par domaine |
| `server/migrations/001 → 009` | Schéma, sécurité, fonctions, stockage, données de référence, correctifs |
| `server/functions/invite`, `delete-account` | Fonctions serveur (seul endroit où existe la clé d'administration) |
| `server/tests/security_tests.sql` | 58 tests d'isolation |
| `site/netlify.toml` | Publication et en-têtes de sécurité |
| `.env.example` | Variables, sans aucune valeur secrète |
| `README.md`, `docs/SERVEUR.md`, `IPHONE.md`, `DONNEES-RGPD.md`, `ARCHITECTURE.md`, `TESTS.md`, `MIGRATION-V9.md`, `JOURNAL-MODIFICATIONS.md`, `ETAT-DES-FONCTIONS.md` | Documentation |
| `tests/` + `report/tests/` | 12 scripts de test et leurs résultats bruts |
| `backup/v9/` | Version 9 complète, intacte |

# 4. Tests exécutés et résultats

| Suite | Contre | Résultat |
|---|---|---|
| Sécurité SQL (isolation, rôles, invitations, formules, export, suppression) | serveur de production | 58/58 |
| Cycle complet sur 2 navigateurs isolés (coach 1280 px + iPhone 390 px), hors ligne, sécurité, médias, export, suppression | serveur + **site en ligne** | 47/47 (et 47/47 en local) |
| Migration v9 (même navigateur / fichier) | serveur | 19/19 · 15/15 |
| Exigences v9, cycle démo, données, fonctions v10 | mode démo | 30/30 · 37/37 · 26/26 · 39/39 |
| Tous les écrans à 375, 390, 430, 768, 1024, 1440 px | — | 0 erreur, 0 débordement, 0 cible < 44 px, 0 contrôle sans nom |
| Audit WCAG 2.1 A/AA (axe-core), 10 écrans × 2 largeurs | — | 0 défaut |
| Badge de l'hébergeur | site en ligne | 9/9 |

**Non testé** : Safari iOS et macOS réels, VoiceOver, taille de texte iOS maximale, un vrai iPhone, une vraie coupure réseau (simulée par le navigateur).

# 5. Données de Lucas vérifiées après migration

Vérifié sur le serveur par le rapport de migration, avec une **copie représentative** de tes données v9 (structure réelle de l'appli) sur un compte coach de test :

- profil rattaché au programme historique `lucas-2026` ; programme historique attribué et actif ;
- séance de tests du **12/10 réalisée**, résultats identiques (squat, développé couché, soulevé de terre, CMJ, tractions, poids, développé militaire 22 kg × 8), 1RM estimés identiques (squat ≈ 100,6 kg) ;
- statuts, durées, RPE, déplacements, questionnaires, activités conservés ; relance sans doublon ;
- restauration complète sur un autre appareil ; aucune donnée de Lucas chez un autre client.

**Tes vraies données n'ont pas encore été importées** : elles sont dans ton navigateur, pas dans mon environnement. L'import se fait en 2 minutes (`docs/MIGRATION-V9.md`).

# 6. Fonctions réellement utilisables

Comptes et rôles serveur · invitations multi-appareil · isolation · programmes (création, duplication, attribution, personnalisation) · calendrier généré · lecteur de séance et durée réelle · RPE immédiat ou plus tard · statuts et adaptations avec raison et commentaire · hors ligne et synchronisation · remontée chez le coach · charges structurées et tests personnalisés · règles d'adaptation du coach · douleur localisée · droits des formules · bibliothèque et médias privés · export et suppression réels · migration v9 · mode démonstration séparé.

# 7. Fonctions encore simulées ou dépendantes d'un accès extérieur

| Fonction | État |
|---|---|
| E-mails aux clients (vérification d'une inscription libre, mot de passe oublié) | SMTP à configurer ; les clients invités par code n'en ont pas besoin |
| Connexion Apple / Google | boutons prêts, fournisseurs à activer (comptes développeur) |
| Face ID, trousseau, notifications appli fermée, widget, Apple Santé | appli iPhone native à construire (non compilée) |
| Polar | simulation signalée ou saisie manuelle ; plugin Swift jamais compilé |
| Paiement | aucun (tarifs et prestataire non définis) |
| Mise à jour en direct chez le coach | à l'ouverture, au retour au premier plan, au retour du réseau ou sur « Synchroniser » |
| Logos de marques | non dessinés : fichiers officiels à fournir |

# 8. Ce dont j'ai encore besoin de toi

1. **5 minutes dans Supabase** : créer ton compte coach (Users › Add user › lucasbsnd10@gmail.com, « Auto Confirm ») ; *URL Configuration* : `https://usci-muscu.netlify.app` et `https://usci-muscu.netlify.app/**`. Je ne peux pas le faire avec l'outil disponible.
2. Le **fichier JSON exporté de ta v9** pour l'import (tu peux le faire toi-même depuis la v10).
3. Un **service d'e-mails** (Brevo, Resend…) avant d'ouvrir l'inscription libre.
4. Mentions légales, politique de confidentialité, e-mail de support, tarifs des formules.
5. Pour l'iPhone natif : un Mac avec Xcode et un compte Apple Developer.
6. Une source pour les règles de douleur, si tu veux remplacer mon interprétation prudente.

# 9. Risques restants avant commercialisation

| Risque | Niveau | Action |
|---|---|---|
| Données de santé : statut juridique (HDS, AIPD, registre, conservation) non tranché | élevé | avis d'un juriste avant tout client payant |
| Offre gratuite Supabase : pause après 7 jours d'inactivité, pas de sauvegarde restaurable | élevé | offre Pro dès les premiers clients |
| E-mails non délivrés aux clients sans SMTP | moyen | configurer un SMTP |
| Pas testé sur un vrai iPhone ni avec VoiceOver | moyen | session de test sur ton téléphone |
| Compte **coach de test** (mot de passe dans les scripts de test) actif sur le serveur | moyen | le supprimer ou changer son mot de passe avant d'inviter de vrais clients |
| Badge Netlify gratuit visible | faible | offre payante ou domaine propre |
| Protection contre les mots de passe divulgués désactivée (offre gratuite) | faible | offre Pro |
| Mise à jour non instantanée chez le coach | faible | temps réel Supabase plus tard |

# 10. Prochaines priorités recommandées

1. Les réglages Supabase (§ 8) puis **import de tes données v9** et test sur ton iPhone avec un premier client réel invité par code.
2. **Cadre légal** (mentions, confidentialité, consentement, HDS) et offre Pro Supabase.
3. **SMTP** pour les e-mails clients.
4. **Appli iPhone** (Capacitor) : trousseau, Face ID, notifications, puis widget.
5. Mise à jour en direct chez le coach, puis paiement des formules, puis Polar.
