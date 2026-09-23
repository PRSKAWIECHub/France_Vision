// Petit client REST pour Supabase (PostgREST), sans dependance externe.
// Utilise window.SUPABASE_CONFIG rempli par js/config.js (genere par
// scripts/generate-config.js a partir de .env.local).

async function supabaseSelect(table, { select = '*', filtres = {} } = {}) {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.url || !config.anonKey) {
    throw new Error(
      "Configuration Supabase manquante. Lancez 'node scripts/generate-config.js' " +
        'puis rechargez la page.'
    );
  }

  const url = new URL(`${config.url}/rest/v1/${encodeURIComponent(table)}`);
  url.searchParams.set('select', select);
  for (const [colonne, valeur] of Object.entries(filtres)) {
    url.searchParams.set(colonne, valeur);
  }

  const reponse = await fetch(url.toString(), {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    throw new Error(
      `Erreur Supabase sur la table "${table}" (HTTP ${reponse.status}). ${detail}`
    );
  }

  return reponse.json();
}
