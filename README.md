# France Vision

Site statique qui affiche la carte de France (métropole + DOM) et colore chaque
département selon sa température du jour choisi, à partir de données Supabase.

## Structure

```
France_Vision/
├── .env.local              # identifiants Supabase (non fourni ici, déjà en place)
├── scripts/
│   ├── generate-config.js  # lit .env.local -> génère public/js/config.js
│   ├── fetch-geodata.js    # télécharge les contours des départements
│   ├── test-connexion.js   # vérifie que Supabase répond avec le bon schéma
│   └── lib/env.js          # utilitaire partagé de lecture de .env.local
└── public/                 # le site à héberger/servir
    ├── index.html
    ├── css/style.css
    ├── js/
    │   ├── config.js        # généré, ne pas committer (contient la clé anonyme)
    │   ├── config.example.js
    │   ├── couleurs.js       # règles de coloration par température
    │   ├── supabase-rest.js  # petit client REST Supabase (fetch natif)
    │   ├── carte.js          # dessin des cartes avec D3 (geoMercator + fitSize)
    │   └── app.js            # orchestration (chargement, formulaire, coloration)
    └── data/departements.geojson  # contours téléchargés
```

## Mise en route

1. Générer les fichiers nécessaires (config Supabase + contours géographiques) :

   ```bash
   npm run build
   ```

   Cela exécute `scripts/generate-config.js` (lit `.env.local`, écrit
   `public/js/config.js`) puis `scripts/fetch-geodata.js` (télécharge
   `public/data/departements.geojson` depuis le jeu de données ouvert
   [france-geojson](https://github.com/gregoiredavid/france-geojson)).

2. (Optionnel mais recommandé) Vérifier que Supabase répond correctement :

   ```bash
   npm run test-connexion
   ```

3. Lancer un serveur local (nécessaire car le site charge des fichiers via
   `fetch()`, ce qui ne fonctionne pas en ouvrant `index.html` directement) :

   ```bash
   npm start
   ```

   puis ouvrir l'URL affichée (par défaut `http://localhost:3000`).

## Utilisation

- La carte de France métropolitaine s'affiche dans le cadre "France".
- Un cadre séparé s'affiche pour chaque département d'outre-mer présent dans
  la table `Departement` (déduit du code : `97x`/`98x`), avec son nom en titre.
- Choisir une date dans le champ "Date d'analyse" puis cliquer sur "Afficher" :
  chaque département est colorié selon la température trouvée dans
  `temperature_prefecture` pour cette date (blanc si aucune donnée).

## Schéma de données attendu

- `Departement(code_departement, nom_departement, ...)`
- `temperature_prefecture(code_departement, date, temperature, ...)`

Ces noms sont centralisés en haut de `public/js/app.js` (objet `SCHEMA`) : à
adapter à cet unique endroit si le schéma Supabase change.

## Sécurité

`public/js/config.js` contient l'URL Supabase et la clé **anonyme** (publique
par nature avec Supabase - la protection des données doit venir des règles RLS
côté Supabase, pas du secret de cette clé). Ce fichier est généré localement et
exclu de git via `.gitignore` ; ne committez jamais `.env.local` non plus.
