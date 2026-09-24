// Dessine un ensemble de features GeoJSON dans un <svg>, en ajustant automatiquement
// la projection pour que ces features remplissent le cadre (via d3.geoMercator + fitSize).
//
// infosParCode: Map(code_departement -> { nom_departement, nom_prefecture, latitude, longitude })
//   utilisee pour l'infobulle au survol et pour placer le point de la prefecture.
// obtenirTemperature: fonction (code) -> temperature actuelle (ou null/undefined si inconnue),
//   appelee au moment du survol pour toujours afficher la valeur la plus recente.
// onDoubleClicDepartement: fonction (code) optionnelle, appelee lors d'un double-clic
//   sur un departement (affichage de l'evolution des temperatures).
//
// Retourne un objet { code_departement -> element <path> } pour permettre la recoloration.
function dessinerCarte(svgElement, features, infosParCode, obtenirTemperature, onDoubleClicDepartement) {
  const viewBox = svgElement.viewBox.baseVal;
  const largeur = viewBox && viewBox.width ? viewBox.width : svgElement.clientWidth || 600;
  const hauteur = viewBox && viewBox.height ? viewBox.height : svgElement.clientHeight || 600;

  const projection = d3.geoMercator().fitSize(
    [largeur, hauteur],
    { type: 'FeatureCollection', features }
  );
  const generateurChemin = d3.geoPath().projection(projection);

  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  const groupes = svg
    .selectAll('g.departement-groupe')
    .data(features)
    .join('g')
    .attr('class', 'departement-groupe');

  // Halo clair dessine sous le trait fonce: garde les limites des departements visibles
  // quelle que soit la couleur de remplissage (un simple trait gris se confondait avec
  // les teintes foncees comme le vert fonce).
  groupes.append('path').attr('class', 'departement-halo').attr('d', generateurChemin);

  const chemins = {};
  groupes
    .append('path')
    .attr('class', 'departement')
    .attr('d', generateurChemin)
    .attr('data-code', (f) => f.properties.code)
    .each(function (f) {
      chemins[f.properties.code] = this;
    })
    .on('mouseenter mousemove', function (evenement, f) {
      const infos = infosParCode.get(f.properties.code);
      if (!infos) return;
      const temperature = obtenirTemperature ? obtenirTemperature(f.properties.code) : null;
      const suffixeTemperature =
        temperature === null || temperature === undefined ? '' : ` (${temperature}°C)`;
      afficherInfobulle(
        evenement,
        `<strong>${infos.nom_departement}</strong><br>${infos.nom_prefecture}${suffixeTemperature}`
      );
    })
    .on('mouseleave', cacherInfobulle)
    .on('dblclick', function (evenement, f) {
      if (onDoubleClicDepartement) onDoubleClicDepartement(f.properties.code);
    });

  // Point noir a l'emplacement reel de la prefecture (latitude/longitude de la table Departement)
  groupes
    .filter((f) => {
      const infos = infosParCode.get(f.properties.code);
      return Boolean(infos && infos.latitude != null && infos.longitude != null);
    })
    .append('circle')
    .attr('class', 'point-prefecture')
    .attr('r', 2.2)
    .attr('cx', (f) => {
      const infos = infosParCode.get(f.properties.code);
      return projection([infos.longitude, infos.latitude])[0];
    })
    .attr('cy', (f) => {
      const infos = infosParCode.get(f.properties.code);
      return projection([infos.longitude, infos.latitude])[1];
    });

  return chemins;
}
