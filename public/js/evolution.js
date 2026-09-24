// Trace l'evolution des temperatures d'une prefecture (courbe simple avec D3).
// donnees: tableau ordonne d'objets { date: Date, temperature: number|null } couvrant
//   toute la plage [dateDebut, dateFin] jour par jour (temperature=null si pas de donnee).
// dateDebut/dateFin: Date, bornes fixes de l'axe des abscisses.
function dessinerGrapheEvolution(svgElement, donnees, dateDebut, dateFin) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  const viewBox = svgElement.viewBox.baseVal;
  const largeur = viewBox && viewBox.width ? viewBox.width : svgElement.clientWidth || 600;
  const hauteur = viewBox && viewBox.height ? viewBox.height : svgElement.clientHeight || 300;
  const marge = { haut: 20, droite: 20, bas: 30, gauche: 40 };

  const donneesConnues = donnees.filter((d) => d.temperature !== null && d.temperature !== undefined);

  const x = d3.scaleUtc().domain([dateDebut, dateFin]).range([marge.gauche, largeur - marge.droite]);

  const y = d3
    .scaleLinear()
    .domain(donneesConnues.length ? d3.extent(donneesConnues, (d) => d.temperature) : [0, 1])
    .nice()
    .range([hauteur - marge.bas, marge.haut]);

  svg
    .append('g')
    .attr('transform', `translate(0,${hauteur - marge.bas})`)
    .call(d3.axisBottom(x).ticks(d3.utcDay.every(3)).tickFormat(d3.utcFormat('%d/%m')));

  svg.append('g').attr('transform', `translate(${marge.gauche},0)`).call(d3.axisLeft(y).ticks(5));

  if (!donneesConnues.length) {
    svg
      .append('text')
      .attr('class', 'graphe-message')
      .attr('x', largeur / 2)
      .attr('y', hauteur / 2)
      .attr('text-anchor', 'middle')
      .text('Aucune donnée sur cette période.');
    return;
  }

  // defined() coupe la ligne aux jours sans donnee au lieu de les interpoler.
  const ligne = d3
    .line()
    .defined((d) => d.temperature !== null && d.temperature !== undefined)
    .x((d) => x(d.date))
    .y((d) => y(d.temperature));

  svg.append('path').datum(donnees).attr('class', 'courbe-evolution').attr('d', ligne);

  svg
    .selectAll('circle.point-evolution')
    .data(donneesConnues)
    .join('circle')
    .attr('class', 'point-evolution')
    .attr('cx', (d) => x(d.date))
    .attr('cy', (d) => y(d.temperature))
    .attr('r', 3)
    .on('mouseenter mousemove', function (evenement, d) {
      afficherInfobulle(evenement, `${d3.utcFormat('%d/%m/%Y')(d.date)}<br>${d.temperature}°C`);
    })
    .on('mouseleave', cacherInfobulle);
}
