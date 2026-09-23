// Lit .env.local a la racine du projet et genere public/js/config.js
// Ce fichier permet au site statique (public/) de connaitre l'URL Supabase
// et la cle anonyme sans jamais committer ces informations dans le code source.
//
// Usage: node scripts/generate-config.js

const fs = require('fs');
const path = require('path');
const { lireIdentifiantsSupabase } = require('./lib/env');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const OUTPUT_PATH = path.join(ROOT, 'public', 'js', 'config.js');

if (!fs.existsSync(ENV_PATH)) {
  console.error(`Fichier introuvable: ${ENV_PATH}`);
  process.exit(1);
}

const { env, url, anonKey } = lireIdentifiantsSupabase(ENV_PATH);

if (!url || !anonKey) {
  console.error('Impossible de trouver les variables Supabase dans .env.local.');
  console.error('Variables detectees:', Object.keys(env).join(', ') || '(aucune)');
  console.error('Attendu: une variable contenant "SUPABASE" + "URL", et une variable');
  console.error('contenant "SUPABASE" + "ANON"/"PUBLIC" + "KEY" (jamais la cle service_role).');
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

const fileContent = `// Fichier genere automatiquement par scripts/generate-config.js
// NE PAS MODIFIER A LA MAIN - NE PAS COMMITTER (voir .gitignore)
window.SUPABASE_CONFIG = {
  url: ${JSON.stringify(url)},
  anonKey: ${JSON.stringify(anonKey)}
};
`;

fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf8');
console.log(`Config Supabase generee: ${OUTPUT_PATH}`);
