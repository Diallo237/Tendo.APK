# Tendo Mobile - Checklist de publication

## Deja prepare dans le depot

- Projet Capacitor Android dans `android/`
- Projet Capacitor iOS dans `ios/`
- Identifiant Android/iOS : `com.tendo.mobile`
- Version initiale : `1.0.0` / code Android `1`
- Icones Android et iOS generees depuis le logo Tendo
- Splash screens Android et iOS generes
- Scripts `cap:sync`, `cap:copy`, `cap:open:android`, `cap:open:ios`
- Verification `build:release` contre une API locale ou non HTTPS

## A faire avant soumission

1. Copier `.env.production.example` vers `.env.production`.
2. Remplacer `VITE_API_URL` par l'URL HTTPS publique reelle de l'API Tendo.
3. Configurer le backend avec le domaine de production dans CORS, CSRF et les cookies.
4. Executer `npm run build:release` puis `npm run cap:sync`.
5. Android : ouvrir `android/` dans Android Studio, configurer le keystore release et produire un fichier `.aab` signe.
6. iOS : ouvrir `ios/App/App.xcodeproj` sur macOS/Xcode, configurer le Bundle ID, la Team Apple et produire une archive signee.
7. Ajouter une URL publique de politique de confidentialite, les conditions d'utilisation et la procedure de suppression de compte.
8. Completer les fiches Google Play et App Store : description, captures, age, donnees collectees, support et icone.
9. Tester les parcours catalogue, connexion, panier, checkout, paiement, suivi, camera et deconnexion sur de vrais appareils.

## Limitation locale

La compilation Android finale necessite Java/Android Studio et la compilation iOS necessite macOS/Xcode. Les projets natifs sont prets, mais les signatures de publication doivent etre creees avec les comptes developpeur du proprietaire.