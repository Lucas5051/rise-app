# Migration de la v9 vers le serveur · USCI Muscu v10

## Ce qui est migré

Le **programme historique de Lucas** (contexte `lucas-2026`) et toutes ses données : tests (dont la séance du 12/10, qui reste **réalisée** avec ses résultats ; seul le RPE peut rester à compléter), statuts, durées réelles et durées à confirmer, RPE, adaptations (raison + commentaire), déplacements, variantes, questionnaires de ressenti, activités club et matchs, autres activités, FC, ajustements de charges, badges, réglages.

**Jamais envoyé** : les clients, messages et codes d'exemple de la démonstration ; aucune donnée de Lucas n'est copiée chez un autre client (le programme historique est rattaché à son seul profil, testé).

## Deux chemins

### A. Même navigateur que la v9
À la première connexion du compte coach, si des données v9 sont présentes dans ce navigateur, l'écran « Importer tes données de la version 9 » s'ouvre tout seul.

### B. Autre adresse ou autre appareil (cas le plus probable)
La v9 était ouverte comme artefact claude.ai : ses données sont rangées dans le navigateur, à cette adresse-là. Le site https://usci-muscu.netlify.app ne peut pas les lire (sécurité des navigateurs). Donc :
1. Ouvre la **v9** là où tu l'utilisais › engrenage › **Export des données** › **Exporter tout (JSON)**.
2. Ouvre la v10, connecte-toi avec ton compte coach › Paramètres coach › Compte › **Choisir le fichier JSON de la v9**.
3. L'écran d'import s'ouvre (étapes ci-dessous).

Fichiers acceptés : l'export « Mes données » de la v9, ou la sauvegarde complète produite par l'étape 1 ci-dessous. Un autre fichier est refusé ; un fichier sans le programme historique (tests du 12/10) aussi.

## Étapes de l'import

1. **Sauvegarde JSON obligatoire** (bouton 1) : toutes les clés `usci-*` de l'appareil, sans jeton de session. L'import reste bloqué tant qu'elle n'est pas téléchargée.
2. **Import** (bouton 2) : rattachement du contexte `lucas-2026` à ton compte serveur (`claim_legacy_ctx`, coach qui s'entraîne lui-même), mise en file de toutes les données, envoi.
3. **Rapport** relu **sur le serveur** : profil rattaché, nombre de séances de tests, résultats du 12/10 identiques, séance du 12/10 réalisée, statuts, durées et RPE, déplacements, questionnaires, activités, programme historique attribué et actif. Téléchargeable.

Relancer l'import ne crée **aucun doublon** (clés naturelles côté serveur, testé). Une coupure réseau pendant l'import laisse les envois en file ; ils partent au retour de la connexion et les données locales restent intactes.

## Après la migration

- Espace coach › « Mon entraînement » : ta planification historique, identique (matchs, entraînements à Caen, semaines d'alternance et de cours).
- Sur un autre appareil, en te connectant, tout revient depuis le serveur (testé : statuts, RPE, déplacements, questionnaires, tests).
- La planification sportive n'a **pas** été modifiée en v10.

## Vérifié par les tests (copie représentative de tes données, compte coach de test)

`tests/migration.js` (19/19) et `tests/migration-file.js` (15/15) : voir `docs/TESTS.md`. Tes vraies données n'ont pas été importées par moi : elles sont dans ton navigateur, pas dans mon environnement. L'import réel se fait par toi avec le chemin B.
