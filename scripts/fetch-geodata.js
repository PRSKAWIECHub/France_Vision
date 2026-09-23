// Telecharge le contour geographique des departements francais (metropole + DOM)
// depuis le jeu de donnees ouvert "france-geojson" (gregoiredavid/france-geojson,
// reference courante pour ce type de carte en France) et l'enregistre localement
// dans public/data/departements.geojson pour que le site fonctionne hors-ligne.
//
// Usage: node scripts/fetch-geodata.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const SOURCE_URL =
  'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-avec-outre-mer.geojson';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'departements.geojson');

function download(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          resolve(download(res.headers.location, redirectsLeft - 1));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Echec du telechargement (HTTP ${res.statusCode}): ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function main() {
  console.log(`Telechargement du contour des departements depuis:\n  ${SOURCE_URL}`);
  const data = await download(SOURCE_URL);

  // verification minimale: le fichier doit etre un GeoJSON valide avec des features
  const geojson = JSON.parse(data.toString('utf8'));
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('Le fichier telecharge ne ressemble pas a un GeoJSON de departements valide.');
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(geojson), 'utf8');
  console.log(`OK: ${geojson.features.length} departements enregistres dans ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Erreur lors du telechargement des donnees geographiques:', err.message);
  console.error(
    'Si vous etes derriere un proxy/pare-feu, telechargez manuellement le fichier depuis:\n' +
      `  ${SOURCE_URL}\n` +
      `et enregistrez-le sous: ${OUTPUT_PATH}`
  );
  process.exit(1);
});
