# Appli iPhone · USCI Muscu v10

> **État : non compilée, jamais testée sur un iPhone.** La v10 fonctionne dans Safari iOS à l'adresse https://usci-muscu.netlify.app (et peut être ajoutée à l'écran d'accueil). La coque native (Capacitor) et ses plugins restent à construire sur un Mac avec Xcode et un compte Apple Developer.

## 1. Utiliser la v10 sur iPhone dès aujourd'hui

Safari › https://usci-muscu.netlify.app › bouton Partager › « Sur l'écran d'accueil ». L'appli s'ouvre en plein écran, garde sa session, fonctionne hors ligne une fois ouverte (copie locale + file d'envoi IndexedDB) et renvoie les données au retour du réseau.

Limites de Safari (pas de contournement possible côté web) : pas de Face ID, pas de notification quand l'appli est fermée, pas de widget, pas d'Apple Santé, pas de Bluetooth (Polar). Safari peut effacer les données d'un site non ouvert pendant 7 jours : sans conséquence ici, puisque tout ce qui a été synchronisé est sur le serveur (seuls des envois encore en attente seraient perdus).

## 2. Architecture retenue : Capacitor

Le HTML compilé (`dist/USCI Muscu_10.html`) devient `www/index.html` d'une appli Capacitor. Tout accès natif passe par l'objet `Native` (`src/js/025-native-contract.js`) ; dans le navigateur, `Native.has(...)` renvoie `false` et l'appli le dit clairement (aucune simulation présentée comme réelle).

```bash
npm i @capacitor/core @capacitor/ios @capacitor/local-notifications @capacitor/haptics @capacitor/network
npm i capacitor-native-biometric      # nom et compatibilité à vérifier au moment de l'intégration
npx cap add ios && npx cap sync ios
```

## 3. Session, trousseau et Face ID (préparé en v10)

| Étape | Comportement |
|---|---|
| Connexion (e-mail/mot de passe, code coach, Apple, Google) | Supabase Auth renvoie une session. Dans l'appli iPhone, `Native.authStorage()` fournit à supabase-js un stockage **dans le trousseau iOS** : le jeton n'est jamais écrit dans `localStorage`. Le mot de passe n'est jamais conservé |
| Activation de Face ID | écran d'explication → `Native.verify()` ; rien d'autre n'est stocké |
| Ouvertures suivantes | écran verrouillé → Face ID, avec **code de l'iPhone** en secours (`useFallback:true`, géré par iOS) → le jeton du trousseau déverrouille la session |
| Session expirée ou révoquée (« Se déconnecter de tous mes appareils ») | connexion classique |
| Déconnexion | jeton supprimé du trousseau |

`Info.plist` : `NSFaceIDUsageDescription` = « Déverrouiller l'application avec Face ID ».

## 4. Notifications locales

| Rappel | Fonction | Déclenchement |
|---|---|---|
| Questionnaire du jour | `Notify.scheduleDaily` | jours et heures choisis par l'athlète |
| RPE | `Notify.scheduleRpe` | 30 min après la fin de la séance (cours Quantification de la charge, p. 9) |
| Séance non terminée | `Notify.scheduleForgot` | fin estimée + 30 min puis + 90 min ; **aucune durée n'est jamais inventée** : la question est posée à l'ouverture |

Dans le navigateur : rappels uniquement quand l'appli est ouverte.

## 5. Widget (à développer)

Extension WidgetKit + App Group ; plugin `UsciWidget.update({json})` ; données `widgetPayload()` (prochaine séance, régularité, grille 4 semaines). Aperçu seulement dans le HTML.

## 6. Apple Santé (à développer)

Plugin `UsciHealth` en lecture seule (FC, entraînements, sommeil), autorisation au moment où l'athlète connecte Apple Santé. `NSHealthShareUsageDescription`.

## 7. Polar

- En direct (Bluetooth) : `PolarBlePlugin.swift` (dossier `ios-polar-bridge`), écrit en v3, **jamais compilé**. Dans le navigateur : saisie manuelle ou simulation **signalée comme telle**.
- Polar Flow (AccessLink) : OAuth2 via une future fonction serveur (secret jamais dans l'appli).
- Conformément au cahier des charges, Polar n'a pas été avancé en v10 : priorité au cycle coach-client et à la synchronisation.

## 8. Hors ligne dans l'appli

IndexedDB fonctionne dans WKWebView : la file d'envoi et la copie locale sont les mêmes que dans Safari. `@capacitor/network` permettra de relancer l'envoi au retour du réseau même en arrière-plan court.

## 9. Ce qui fonctionne, ce qui est préparé, ce qui reste à faire

| | Safari iOS (v10) | Préparé dans le code | Natif à développer | Testé sur iPhone |
|---|---|---|---|---|
| Comptes, synchro, hors ligne | ✔ | — | — | non (Chromium mobile simulé) |
| Jeton dans le trousseau | non (stockage web) | `Native.authStorage` | plugin | non |
| Face ID + code | non | écrans, `Native.verify` | plugin | non |
| Notifications appli fermée | non | `Notify.*` | plugin officiel | non |
| Widget | aperçu | contrat JSON | extension + plugin | non |
| Apple Santé | non | — | plugin | non |
| Polar en direct | saisie / simulation signalée | Swift écrit | compilation | non |
| Vibrations | non (absent de Safari) | `Native.haptic` | plugin officiel | non |

## 10. Tests à faire sur un vrai iPhone

1. Safari : ouverture, ajout à l'écran d'accueil, connexion, code coach, séance complète, mode avion en pleine séance puis retour du réseau.
2. Zones sûres (encoche, barre d'accueil), badge Netlify en bas à droite : aucun bouton recouvert (vérifié en simulation à 375/390/430 px).
3. VoiceOver : 4 onglets, lecteur de séance, fiche d'exécution, fenêtre de validation, éditeur coach.
4. Taille de texte iOS au maximum (Réglages › Accessibilité).
5. Appli native : Face ID accepté/refusé/code, jeton absent de `localStorage`, notifications appli fermée, widget, Polar H10.
