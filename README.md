# USCI Muscu · version 10

Plateforme de coaching sportif : un **espace coach** (programmes, clients, invitations, suivi) et un **espace athlète** (calendrier, lecteur de séance, ressenti, progrès), reliés par un **serveur central** (Supabase, région Paris).

- **Appli en ligne** : https://usci-muscu.netlify.app (production, connectée au serveur)
- **Mode démonstration** : https://usci-muscu.netlify.app/?demo (tout reste sur l'appareil, bandeau permanent, ne lit jamais le serveur)
- **Serveur** : projet Supabase `usci-muscu` (`oabmnqyymksswnnwglrq`, eu-west-3 Paris), offre gratuite

## Démarrer

| Qui | Quoi faire |
|---|---|
| Lucas (coach) | Créer le compte une fois dans Supabase : Authentication › Users › « Add user » › **lucasbsnd10@gmail.com** + mot de passe, case « Auto Confirm User » cochée. Le serveur lui donne le rôle coach (seule adresse autorisée). Se connecter dans l'appli avec « J'ai déjà un compte ». Puis Paramètres coach › Compte › « Choisir le fichier JSON de la v9 » pour importer ton historique (`docs/MIGRATION-V9.md`). |
| Un client | Le coach crée une invitation (Communication › Invitations). Le client ouvre l'appli sur son téléphone › « J'ai un code coach » › vérifie ses informations › crée son mot de passe. Son calendrier apparaît aussitôt. |

**Deux réglages à faire une fois dans Supabase** (impossibles depuis l'outil utilisé) : voir `docs/SERVEUR.md` § 9 (adresses de redirection, envoi des e-mails).

## Contenu du dossier

| Chemin | Rôle |
|---|---|
| `src/` | Sources de l'appli : `head.html`, `body.html`, `style.css`, `js/*.js` (51 modules, un domaine par fichier) |
| `build.py` | Assemble `dist/USCI Muscu_10.html` (fichier unique, bibliothèque supabase-js intégrée, refuse toute clé secrète) |
| `dist/USCI Muscu_10.html` | Appli compilée (même fichier que le site en ligne) |
| `site/` | Ce qui est publié sur Netlify (`index.html` + `netlify.toml` avec les en-têtes de sécurité) |
| `server/migrations/` | Schéma de base de données, règles d'isolation (RLS), fonctions, stockage, données de référence |
| `server/functions/` | Fonctions serveur `invite` (codes) et `delete-account` (suppression réelle) |
| `server/tests/` | Tests de sécurité SQL (58 vérifications) |
| `tests/` | Tests automatisés de l'appli (Playwright) |
| `docs/` | SERVEUR, IPHONE, DONNEES-RGPD, ARCHITECTURE, TESTS, MIGRATION-V9, JOURNAL, ÉTAT DES FONCTIONS |
| `.env.example` | Variables nécessaires, sans aucune valeur secrète |

## Construire et tester

```bash
npm install                      # supabase-js + playwright
python3 build.py                 # → dist/USCI Muscu_10.html
cd dist && python3 -m http.server 8765 &
node tests/spec.js && node tests/cycle.js && node tests/data.js && node tests/v10.js     # mode démonstration
node tests/cloud.js && node tests/migration.js && node tests/migration-file.js          # vrai serveur
BASE=https://usci-muscu.netlify.app/ node tests/cloud.js                                # site en ligne
```

Résultats détaillés : `docs/TESTS.md` et `report/tests/`.

## Ce qui reste simulé

Face ID, notifications appli fermée, widget, Apple Santé et Polar en direct demandent l'appli iPhone native (non compilée). Connexion Apple et Google : boutons prêts, fournisseurs non activés sur le serveur. Paiement : aucun. Détail : `docs/ETAT-DES-FONCTIONS.md`.
