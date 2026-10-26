# Tests · USCI Muscu v10 (exécutés le 24/10/2026)

Navigateur : Chromium (Playwright), appareils simulés. **Non testé : Safari iOS / macOS réels, VoiceOver, un vrai iPhone.**

## Synthèse

| Suite | Contre | Résultat |
|---|---|---|
| `server/tests/security_tests.sql` — isolation, rôles, invitations, formules, export, suppression | **serveur de production** (transaction annulée) | **58/58** |
| `tests/cloud.js` — 2 navigateurs isolés (coach ordinateur 1280 px + athlète iPhone 390 px), cycle complet | serveur de production, appli locale | **47/47** |
| `tests/cloud.js` (même suite) | **site en ligne** https://usci-muscu.netlify.app | **47/47** |
| `tests/migration.js` — migration v9 depuis le même navigateur | serveur de production | **19/19** |
| `tests/migration-file.js` — migration v9 depuis un fichier (autre adresse) | serveur de production (local et en ligne) | **15/15** |
| `tests/spec.js` — exigences v9 conservées | mode démo | **30/30** |
| `tests/cycle.js` — cycle coach → client complet | mode démo | **37/37** |
| `tests/data.js` — données, export, suppression, accessibilité clavier | mode démo | **26/26** |
| `tests/v10.js` — charges, tests, règles, douleur, formules, coach, éditeur | mode démo | **39/39** |
| `tests/tour9.js` + `tests/tour10.js` — tous les écrans (athlète, lecteur, coach, éditeur, bibliothèque, invitations, paramètres, inscription) | 375, 390, 430, 768, 1024, 1440 px | **0** erreur JS, **0** débordement horizontal, **0** cible < 44 px, **0** contrôle sans nom, barre d'onglets ne masquant rien |
| `tests/a11y.js` — audit WCAG 2.0/2.1 A et AA (axe-core 4.10) sur 10 écrans | 390 et 1280 px | **0** défaut (90 avant corrections) |
| `tests/host-badge.js` — le badge Netlify ne recouvre aucun bouton | site en ligne, 375/390/430 px | **9/9** |
| Vérification syntaxique `node --check` des 51 modules | — | OK |
| `build.py` — refus de toute clé secrète dans le HTML | — | OK |

Total automatisé : **327 vérifications** réussies, 0 échec, aucune erreur JavaScript pendant les parcours.

## Critères d'acceptation du cahier des charges

| Critère | Test | |
|---|---|---|
| Coach crée un programme sur ordinateur, génère une invitation | `cloud.js` | ✔ |
| Le client saisit le code sur un autre appareil, code reconnu, vérifie son profil, crée son compte | `cloud.js` | ✔ |
| Programme attribué, calendrier visible, séance réalisée | `cloud.js` | ✔ |
| Le coach voit séance, durée, statut, RPE après synchronisation | `cloud.js` | ✔ |
| Hors ligne : séance poursuivie, données gardées, envoyées au retour, aucun doublon | `cloud.js` | ✔ (coupure simulée par le navigateur) |
| Client ne lit pas un autre client, ne devient pas coach, ne modifie pas un modèle | SQL + `cloud.js` | ✔ |
| Code utilisé / expiré / révoqué refusé, message générique | SQL + `cloud.js` | ✔ |
| Aucun secret dans le code client | `cloud.js`, `build.py` | ✔ |
| Charge fixe, % 1RM calculé et arrondi, test absent sans charge inventée, nouveau test → charges futures recalculées, séances réalisées figées | `v10.js` | ✔ |
| Adaptation interdite jamais proposée ; personnalisation client sans modifier le modèle | `v10.js`, `cycle.js`, SQL | ✔ |
| Douleur épaule ≠ séance haut du corps automatique ; zone demandée ; proposition prudente expliquée ; aucun diagnostic | `v10.js` | ✔ |
| Formule « Programmes » sans suivi coach ; « Personnalisé » avec ses fonctions ; « Coaching » avec messagerie ; restrictions côté serveur | `v10.js`, SQL, `cloud.js` | ✔ |
| Export complet sans secret ; suppression des données prévues, autres clients intacts, journal anonymisé, médias supprimés | SQL, `cloud.js`, `data.js` | ✔ |
| Aucune erreur console, aucun débordement, clavier, focus des fenêtres, mouvement réduit, syntaxe | tours, `data.js`, `spec.js` | ✔ |

## Défauts trouvés et corrigés pendant ces tests (24/10)

1. **Synchronisation du coach en échec** au-delà d'une douzaine de programmes (7,9 s, délai de 8 s de l'API dépassé) → migration 009 (65 ms) + test de durée < 3 s ajouté (mesuré : ~1,8 s).
2. **Médias de fiches en brouillon lisibles** par les clients via le stockage → migration 008 + test.
3. Débordements à 375 px (éditeur) et 1024 px (espace coach).
4. Contrastes insuffisants et structure ARIA du calendrier (axe-core).
5. Badge Netlify recouvrant des boutons.
6. « Mon entraînement » inaccessible depuis le tableau de bord mobile.
7. Course de rendu dans `cycle.js` (test fragile, pas un défaut de l'appli) → attente ajoutée.

## Lancer les tests

```bash
cd dist && python3 -m http.server 8765 &
node tests/spec.js; node tests/cycle.js; node tests/data.js; node tests/v10.js; node tests/a11y.js
for w in 375 390 430 768 1024 1440; do node tests/tour9.js $w; node tests/tour10.js $w; done
node tests/cloud.js; node tests/migration-file.js
# migration.js : remettre d'abord le compte coach de test dans l'état « non migré » (server/tests/reset_test_coach.sql)
BASE=https://usci-muscu.netlify.app/ node tests/cloud.js; node tests/host-badge.js
```

Comptes utilisés : `coach.test@usci-muscu.test` (coach de test) ; chaque test crée puis **supprime** son athlète de test par la vraie procédure de suppression. Les programmes « Test serveur … » créés par `cloud.js` restent sur le coach de test.

Résultats bruts : `report/tests/`.
