// Orchestration de la page France Vision.
// Adaptez les constantes ci-dessous si vos noms de table/colonnes Supabase different.
const SCHEMA = {
  tableDepartement: 'Departement',
  tableTemperature: 'temperature_prefecture',
  colCodeDepartement: 'code_departement',
  colNomDepartement: 'nom_departement',
  colNomPrefecture: 'nom_prefecture',
  colLatitude: 'latitude',
  colLongitude: 'longitude',
  colDate: 'date',
  colTemperature: 'temperature',
};

const elStatut = document.getElementById('statut');
const elCartesDom = document.getElementById('cartes-dom');
const svgMetropole = document.getElementById('svg-metropole');
const formDate = document.getElementById('form-date-analyse');
const svgEvolution = document.getElementById('svg-evolution');

let cheminsParCarte = []; // liste de { chemins: {code: <path>} } pour toutes les cartes affichees
let infosParCode = new Map(); // code_departement -> { nom_departement, nom_prefecture, latitude, longitude }
let temperatureParCode = new Map(); // code_departement -> derniere temperature chargee

// Couleurs distinctes pour les courbes d'evolution (independantes de la palette temperature).
const PALETTE_COURBES = [
  '#4363d8', '#e6194b', '#3cb44b', '#f58231', '#911eb4',
  '#46f0f0', '#f032e6', '#9a6324', '#000075', '#808000',
];
let courbesAffichees = new Map(); // code_departement -> { infos, couleur, donnees }

function obtenirTemperature(codeDepartement) {
  return temperatureParCode.has(codeDepartement) ? temperatureParCode.get(codeDepartement) : null;
}

function afficherStatut(message, estUneErreur = false) {
  elStatut.textContent = message;
  elStatut.classList.toggle('erreur', estUneErreur);
}

function estOutreMer(codeDepartement) {
  return /^(97|98)\d/.test(codeDepartement);
}

function construireLegende() {
  const liste = document.getElementById('legende-liste');
  const items = PALETTE_TEMPERATURE.map(
    (p) => `<li><span class="pastille" style="background:${p.couleur}"></span>${p.label}</li>`
  );
  items.push(
    `<li><span class="pastille" style="background:${COULEUR_TRES_CHAUD}"></span>> 35°C</li>`
  );
  items.push(
    `<li><span class="pastille" style="background:${COULEUR_SANS_DONNEE}"></span>Aucune donnée</li>`
  );
  liste.innerHTML = items.join('');
}

const formatISO = (d) => d.toISOString().slice(0, 10);

// Toutes les dates d'aujourd'hui-30 a aujourd'hui (31 jours), pour un axe fixe.
function genererPlage30Jours() {
  const fin = new Date();
  fin.setUTCHours(0, 0, 0, 0);
  const debut = new Date(fin);
  debut.setUTCDate(debut.getUTCDate() - 30);

  const dates = [];
  for (const d = new Date(debut); d <= fin; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }
  return { debut, fin, dates };
}

function couleurCourbeLibre() {
  const utilisees = new Set(Array.from(courbesAffichees.values()).map((c) => c.couleur));
  const libre = PALETTE_COURBES.find((c) => !utilisees.has(c));
  return libre || PALETTE_COURBES[courbesAffichees.size % PALETTE_COURBES.length];
}

function construireLegendeEvolution() {
  const liste = document.getElementById('legende-evolution');
  const items = Array.from(courbesAffichees.entries()).map(
    ([code, { infos, couleur }]) =>
      `<li><span class="pastille" style="background:${couleur}"></span>${code}:${infos.nom_departement} (${infos.nom_prefecture})</li>`
  );
  liste.innerHTML = items.join('');
}

function redessinerGrapheEvolution() {
  const { debut, fin } = genererPlage30Jours();
  const series = Array.from(courbesAffichees.entries()).map(([code, { infos, couleur, donnees }]) => ({
    code,
    infos,
    couleur,
    donnees,
  }));
  dessinerGrapheEvolution(svgEvolution, series, debut, fin, gererDoubleClicCourbe);
  construireLegendeEvolution();
}

function gererDoubleClicCourbe(codeDepartement) {
  const entree = courbesAffichees.get(codeDepartement);
  if (!entree) return;
  courbesAffichees.delete(codeDepartement);
  redessinerGrapheEvolution();
  afficherStatut(`Évolution masquée pour ${entree.infos.nom_departement}.`);
}

async function gererDoubleClicDepartement(codeDepartement) {
  const infos = infosParCode.get(codeDepartement);
  if (!infos) return;

  if (courbesAffichees.has(codeDepartement)) {
    afficherStatut(`${infos.nom_departement} est déjà affiché sur le graphe.`);
    return;
  }

  const { debut, fin, dates } = genererPlage30Jours();

  afficherStatut(`Chargement de l'évolution des températures pour ${infos.nom_departement}...`);

  try {
    const lignes = await supabaseSelect(SCHEMA.tableTemperature, {
      select: `${SCHEMA.colDate},${SCHEMA.colTemperature}`,
      filtres: {
        [SCHEMA.colCodeDepartement]: `eq.${codeDepartement}`,
        [SCHEMA.colDate]: [`gte.${formatISO(debut)}`, `lte.${formatISO(fin)}`],
      },
    });

    const temperatureParDate = new Map(
      lignes.map((l) => [String(l[SCHEMA.colDate]), Number(l[SCHEMA.colTemperature])])
    );

    // Une entree par jour de la plage, temperature=null si pas encore de donnee ce jour-la.
    const donnees = dates.map((date) => ({
      date,
      temperature: temperatureParDate.has(formatISO(date)) ? temperatureParDate.get(formatISO(date)) : null,
    }));

    courbesAffichees.set(codeDepartement, { infos, couleur: couleurCourbeLibre(), donnees });
    redessinerGrapheEvolution();
    afficherStatut(`Évolution affichée pour ${infos.nom_departement} (30 derniers jours).`);
  } catch (erreur) {
    console.error(erreur);
    afficherStatut(erreur.message, true);
  }
}

function creerCadreDom(codeDepartement, nomDepartement) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'carte-cadre';
  fieldset.innerHTML = `
    <legend>${nomDepartement}</legend>
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" data-code="${codeDepartement}"></svg>
  `;
  elCartesDom.appendChild(fieldset);
  return fieldset.querySelector('svg');
}

async function initialiser() {
  afficherStatut('Chargement de la carte...');

  const [geojson, departements] = await Promise.all([
    fetch('data/departements.geojson').then((r) => {
      if (!r.ok) throw new Error('Impossible de charger public/data/departements.geojson.');
      return r.json();
    }),
    supabaseSelect(SCHEMA.tableDepartement, {
      select: `${SCHEMA.colCodeDepartement},${SCHEMA.colNomDepartement},${SCHEMA.colNomPrefecture},${SCHEMA.colLatitude},${SCHEMA.colLongitude}`,
    }),
  ]);

  const featuresParCode = new Map(
    geojson.features.map((f) => [String(f.properties.code), f])
  );

  infosParCode = new Map(
    departements.map((dep) => [
      String(dep[SCHEMA.colCodeDepartement]),
      {
        nom_departement: dep[SCHEMA.colNomDepartement],
        nom_prefecture: dep[SCHEMA.colNomPrefecture],
        latitude: dep[SCHEMA.colLatitude],
        longitude: dep[SCHEMA.colLongitude],
      },
    ])
  );

  const departementsMetropole = [];
  const departementsDom = [];
  for (const dep of departements) {
    const code = String(dep[SCHEMA.colCodeDepartement]);
    if (estOutreMer(code)) {
      departementsDom.push(dep);
    } else {
      departementsMetropole.push(dep);
    }
  }

  // Carte de la France metropolitaine
  const featuresMetropole = departementsMetropole
    .map((dep) => featuresParCode.get(String(dep[SCHEMA.colCodeDepartement])))
    .filter(Boolean);
  cheminsParCarte.push(
    dessinerCarte(svgMetropole, featuresMetropole, infosParCode, obtenirTemperature, gererDoubleClicDepartement)
  );

  // Une carte par departement d'outre-mer present dans la table Departement
  departementsDom.sort((a, b) =>
    String(a[SCHEMA.colCodeDepartement]).localeCompare(String(b[SCHEMA.colCodeDepartement]))
  );
  for (const dep of departementsDom) {
    const code = String(dep[SCHEMA.colCodeDepartement]);
    const feature = featuresParCode.get(code);
    if (!feature) {
      console.warn(`Aucun contour geographique trouve pour le departement ${code}, ignore.`);
      continue;
    }
    const svg = creerCadreDom(code, dep[SCHEMA.colNomDepartement]);
    cheminsParCarte.push(
      dessinerCarte(svg, [feature], infosParCode, obtenirTemperature, gererDoubleClicDepartement)
    );
  }

  construireLegende();
  afficherStatut('Choisissez une date puis validez pour colorer la carte.');
}

async function appliquerTemperatures(dateAnalyse) {
  afficherStatut('Chargement des températures...');

  const lignes = await supabaseSelect(SCHEMA.tableTemperature, {
    select: `${SCHEMA.colCodeDepartement},${SCHEMA.colTemperature}`,
    filtres: { [SCHEMA.colDate]: `eq.${dateAnalyse}` },
  });

  temperatureParCode = new Map(
    lignes.map((l) => [String(l[SCHEMA.colCodeDepartement]), l[SCHEMA.colTemperature]])
  );

  for (const chemins of cheminsParCarte) {
    for (const [code, elementPath] of Object.entries(chemins)) {
      const temperature = temperatureParCode.has(code)
        ? Number(temperatureParCode.get(code))
        : null;
      elementPath.style.fill = couleurPourTemperature(temperature);
    }
  }

  afficherStatut(`Températures affichées pour le ${dateAnalyse}.`);
}

formDate.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  const dateAnalyse = document.getElementById('date-analyse').value;
  if (!dateAnalyse) return;
  try {
    await appliquerTemperatures(dateAnalyse);
  } catch (erreur) {
    console.error(erreur);
    afficherStatut(erreur.message, true);
  }
});

initialiser().catch((erreur) => {
  console.error(erreur);
  afficherStatut(erreur.message, true);
});
