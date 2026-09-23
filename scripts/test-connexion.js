// Verifie que .env.local contient des identifiants Supabase valides et que les
// tables Departement / temperature_prefecture sont accessibles avec les noms de
// colonnes attendus. N'affiche jamais la cle anonyme.
//
// Usage: node scripts/test-connexion.js

const path = require('path');
const { lireIdentifiantsSupabase } = require('./lib/env');

const ENV_PATH = path.join(__dirname, '..', '.env.local');
const SCHEMA = {
  tableDepartement: 'Departement',
  tableTemperature: 'temperature_prefecture',
  colCodeDepartement: 'code_departement',
  colNomDepartement: 'nom_departement',
  colDate: 'date',
  colTemperature: 'temperature',
};

async function requeteSupabase(url, anonKey, table, select) {
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(
    select
  )}&limit=3`;
  const reponse = await fetch(endpoint, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const corps = await reponse.text();
  return { statut: reponse.status, ok: reponse.ok, corps };
}

async function main() {
  const { url, anonKey } = lireIdentifiantsSupabase(ENV_PATH);
  if (!url || !anonKey) {
    console.error('Identifiants Supabase introuvables dans .env.local.');
    process.exit(1);
  }
  console.log(`URL Supabase detectee: ${url}`);
  console.log('Cle anonyme detectee: (masquee)');

  console.log(`\nTest table "${SCHEMA.tableDepartement}"...`);
  const resDep = await requeteSupabase(
    url,
    anonKey,
    SCHEMA.tableDepartement,
    `${SCHEMA.colCodeDepartement},${SCHEMA.colNomDepartement}`
  );
  console.log(`  HTTP ${resDep.statut}`);
  console.log(`  Reponse: ${resDep.corps.slice(0, 300)}`);

  console.log(`\nTest table "${SCHEMA.tableTemperature}"...`);
  const resTemp = await requeteSupabase(
    url,
    anonKey,
    SCHEMA.tableTemperature,
    `${SCHEMA.colCodeDepartement},${SCHEMA.colDate},${SCHEMA.colTemperature}`
  );
  console.log(`  HTTP ${resTemp.statut}`);
  console.log(`  Reponse: ${resTemp.corps.slice(0, 300)}`);

  if (!resDep.ok || !resTemp.ok) {
    console.error(
      '\nEchec: verifiez les noms de table/colonnes dans public/js/app.js (objet SCHEMA)' +
        ' et les policies RLS Supabase (SELECT doit etre autorise pour le role anon).'
    );
    process.exit(1);
  }
  console.log('\nOK: les deux tables sont accessibles avec les colonnes attendues.');
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
