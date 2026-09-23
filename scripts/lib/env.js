// Utilitaires partages pour lire .env.local et en extraire les identifiants Supabase.
const fs = require('fs');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function findUrl(env) {
  for (const [key, value] of Object.entries(env)) {
    if (/SUPABASE/i.test(key) && /URL/i.test(key)) return value;
  }
  return null;
}

function findAnonKey(env) {
  for (const [key, value] of Object.entries(env)) {
    if (!/SUPABASE/i.test(key)) continue;
    if (/SERVICE|SECRET|ROLE/i.test(key)) continue; // ne jamais exposer une cle privilegiee
    if (/ANON|PUBLIC/i.test(key) && /KEY/i.test(key)) return value;
  }
  for (const [key, value] of Object.entries(env)) {
    if (/^SUPABASE_KEY$/i.test(key)) return value;
  }
  return null;
}

function lireIdentifiantsSupabase(envPath) {
  const env = parseEnvFile(envPath);
  const url = findUrl(env);
  const anonKey = findAnonKey(env);
  return { env, url, anonKey };
}

module.exports = { parseEnvFile, findUrl, findAnonKey, lireIdentifiantsSupabase };
