# État réel des fonctions · USCI Muscu v10 (24/10/2026)

Légende : **Opérationnel** = fonctionne avec le vrai serveur et a été testé de bout en bout · **Partiel** = fonctionne avec une limite indiquée · **Préparé** = code et écrans prêts, dépend d'un élément extérieur · **Simulé / absent**.

## Opérationnel (serveur réel, testé)

| Fonction | Preuve |
|---|---|
| Appli en ligne https://usci-muscu.netlify.app, mode production par défaut | test `cloud.js` exécuté sur le site en ligne |
| Comptes e-mail + mot de passe, sessions, déconnexion de cet appareil ou de **tous** les appareils | `cloud.js`, SQL |
| Rôle coach attribué **par le serveur** (liste blanche) ; impossible à obtenir en modifiant l'appli | SQL + `cloud.js` (« valeur locale modifiée : aucun accès ») |
| Invitation multi-appareil : code généré côté serveur, empreinte SHA-256, durée limitée, révocable, usage unique, anti-essais (5/15 min), message générique | SQL 58/58, `cloud.js` |
| Parcours invité : code → identité et programme préparés → corrections → consentement → compte créé → lié au coach → programme attribué → calendrier immédiat | `cloud.js` |
| Isolation client/client et coach/coach, programmes modèles protégés, formule non modifiable par le client | SQL 58/58, `cloud.js` |
| Droits des formules appliqués par la base (messagerie) et l'interface | SQL, `cloud.js`, `v10.js` |
| Programmes : création, duplication, attribution, personnalisation sans toucher au modèle, tables normalisées | `cycle.js`, `cloud.js`, SQL |
| Séance réalisée sur un appareil → durée réelle, statut, RPE, adaptation visibles chez le coach | `cloud.js` |
| Hors ligne : file persistante, indicateur, envoi automatique au retour, aucune perte, aucun doublon | `cloud.js` |
| Migration v9 → serveur (même navigateur ou **fichier**), rapport, relance sans doublon, séance du 12/10 réalisée | `migration.js`, `migration-file.js` |
| Export serveur complet sans secret ; suppression réelle (cascade, anonymisation, fichiers) | `cloud.js`, SQL |
| Médias d'exercices dans le stockage privé, URL signées, formats/tailles, droits obligatoires, fiches en brouillon invisibles des clients, suppression réelle | `cloud.js` |
| Charges structurées (11 modes), arrondi, mini/maxi, « Test requis », recalcul des futures charges, historique figé | `v10.js` |
| Tests personnalisés (unité, formule Brzycki/Epley affichée) | `v10.js` |
| Règles d'adaptation du coach réellement appliquées (repli prudent ou « contacte ton coach ») | `v10.js` |
| Douleur localisée (zone obligatoire, intensité, apparition, déclencheur, repos), proposition prudente, aucun diagnostic | `v10.js` |
| Espace coach en 6 rubriques, éditeur de séance en 4 étapes (brouillon, annuler, aperçu, contrôles) | `v10.js`, tours d'écran |
| Expérience athlète v9 conservée (4 onglets, lecteur, statuts, durée réelle, RPE plus tard, confettis, mouvement réduit) | `spec.js`, `cycle.js`, `data.js` |

## Partiel

| Fonction | Limite |
|---|---|
| Vérification de l'adresse e-mail, « Mot de passe oublié », inscription libre | Fonctionnent, mais le serveur d'e-mails fourni par Supabase n'envoie qu'aux membres de l'organisation : un **SMTP** est à configurer pour les clients (SERVEUR.md § 9). Les clients invités par code n'en ont pas besoin |
| Liens des e-mails | Adresse de redirection à déclarer dans Supabase (SERVEUR.md § 9) |
| Réception côté coach | À l'ouverture, au retour au premier plan, au retour du réseau ou sur « Synchroniser » ; pas de temps réel |
| Questionnaire initial | Les réponses alimentent les contrôles d'attribution (matériel, douleurs, disponibilités, matchs) et la fiche coach « usage de chaque réponse » ; il ne **génère** pas de programme automatiquement (le coach construit le programme) |
| Formules | Droits réels, aucun paiement (tarifs et prestataire non définis) |
| Accessibilité | Clavier, focus, Échap, inertie, libellés, mouvement réduit testés automatiquement ; audit WCAG 2.1 A/AA axe-core : 0 défaut sur 10 écrans × 2 largeurs ; **VoiceOver, taille de texte iOS et Safari réels non testés** |
| Offre gratuite Supabase | Pause après 7 jours sans activité, pas de sauvegarde automatique |
| Badge « Powered by Netlify » | Imposé par l'offre gratuite ; l'appli réserve sa place pour qu'il ne recouvre aucun bouton |

## Préparé (dépend d'un accès extérieur)

| Fonction | Ce qui manque |
|---|---|
| Connexion Apple / Google | Activer les fournisseurs dans Supabase (identifiants Apple Developer, client OAuth Google) |
| Jeton de session dans le trousseau iOS, Face ID + code | Appli iPhone Capacitor + plugin biométrie |
| Notifications appli fermée, widget, Apple Santé | Appli iPhone native + plugins / extension |
| Polar en direct | Compilation du plugin Swift, ceinture pour tester ; Polar Flow : fonction serveur OAuth |
| Paiement / abonnement | Choix du prestataire, tarifs, conditions |

## Simulé ou absent

| Élément | État |
|---|---|
| Mode démonstration (`?demo`) | Volontairement local, bandeau permanent |
| Polar dans le navigateur | Simulation **signalée** ou saisie manuelle |
| Logos Apple, Google, Instagram, TikTok, App Store | Non dessinés : emplacements `BRAND_ASSETS` pour les fichiers officiels ; pictogramme neutre + nom complet |
| Vidéos/photos d'exercices | Aucune fournie : à produire par le coach avec droits |
| Mentions légales, politique de confidentialité, e-mail de support | Champs prévus dans `APP_CONFIG`, contenu à rédiger |
