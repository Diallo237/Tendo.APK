# Tendo Mobile

Application mobile client Tendo sous forme de PWA installable Android et iOS.

## Fonctionnalites

- Catalogue partage avec le site Tendo
- Recherche, categories et details produits
- Panier et commande
- Connexion client, favoris et historique des commandes
- Suivi de commande
- Installation sur l'ecran d'accueil
- Synchronisation automatique du catalogue avec l'API Tendo

## Demarrage local

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

Ouvrir ensuite `http://localhost:5173`.

Pour tester depuis un telephone connecte au meme reseau Wi-Fi, utiliser l'adresse IP du PC avec le port `5173`.

## Configuration API

La variable `VITE_API_URL` definit l'URL de l'API. En developpement, le proxy Vite cible Django sur `http://localhost:8000` via `VITE_API_PROXY_TARGET`.

## Production

```powershell
npm run build
npm run preview
```

La PWA doit etre servie en HTTPS pour etre installable sur un telephone.
