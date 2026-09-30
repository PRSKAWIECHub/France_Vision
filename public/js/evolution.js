// Trace l'evolution des temperatures de plusieurs prefectures (une courbe par
// departement, chacune dans sa propre couleur, avec D3).
// series: tableau de { code, infos: { nom_departement, nom_prefecture, ... },
//   couleur, donnees } ou donnees est un tableau ordonne d'objets
//   { date: Date, temperature: number|null } couvrant toute la plage
//   [dateDebut, dateFin] jour par jour (temperature=null si pas de donnee).
// dateDebut/dateFin: Date, bornes fixes de l'axe des abscisses.
// onDoubleClicCourbe: fonction (code) optionnelle, appelee lors d'un double-clic
//   sur une courbe (retrait de cette courbe).
function dessinerGrapheEvolution(svgElement, series, dateDebut, dateFin, onDoubleClicCourbe) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  const viewBox = svgElement.viewBox.baseVal;
  const largeur = viewBox && viewBox.width ? viewBox.width : svgElement.clientWidth || 600;
  const hauteur = viewBox && viewBox.height ? viewBox.height : svgElement.clientHeight || 300;
  const marge = { haut: 20, droite: 20, bas: 30, gauche: 40 };

  const x = d3.scaleUtc().domain([dateDebut, dateFin]).range([marge.gauche, largeur - marge.droite]);

  const toutesDonneesConnues = series.flatMap((s) =>
    s.donnees.filter((d) => d.temperature !== null && d.temperature !== undefined)
  );

  const y = d3
    .scaleLinear()
    .domain(toutesDonneesConnues.length ? d3.extent(toutesDonneesConnues, (d) => d.temperature) : [0, 1])
    .nice()
    .range([hauteur - marge.bas, marge.haut]);

  svg
    .append('g')
    .attr('transform', `translate(0,${hauteur - marge.bas})`)
    .call(d3.axisBottom(x).ticks(d3.utcDay.every(3)).tickFormat(d3.utcFormat('%d/%m')));

  svg.append('g').attr('transform', `translate(${marge.gauche},0)`).call(d3.axisLeft(y).ticks(5));

  if (!series.length || !toutesDonneesConnues.length) {
    svg
      .append('text')
      .attr('class', 'graphe-message')
      .attr('x', largeur / 2)
      .attr('y', hauteur / 2)
      .attr('text-anchor', 'middle')
      .text(
        series.length
          ? 'Aucune donnée sur cette période.'
          : 'Double-cliquez sur un département pour afficher son évolution.'
      );
    return;
  }

  // defined() coupe la ligne aux jours sans donnee au lieu de les interpoler.
  const ligne = d3
    .line()
    .defined((d) => d.temperature !== null && d.temperature !== undefined)
    .x((d) => x(d.date))
    .y((d) => y(d.temperature));

  for (const s of series) {
    const donneesConnues = s.donnees.filter((d) => d.temperature !== null && d.temperature !== undefined);
    if (!donneesConnues.length) continue;

    // Trait large invisible sous la courbe: elargit la zone cliquable pour
    // permettre le double-clic de retrait meme si la courbe visible est fine.
    svg
      .append('path')
      .datum(s.donnees)
      .attr('class', 'courbe-evolution-zone-clic')
      .attr('d', ligne)
      .on('dblclick', () => {
        if (onDoubleClicCourbe) onDoubleClicCourbe(s.code);
      });

    svg
      .append('path')
      .datum(s.donnees)
      .attr('class', 'courbe-evolution')
      .style('stroke', s.couleur)
      .attr('d', ligne);

    svg
      .selectAll(null)
      .data(donneesConnues)
      .join('circle')
      .attr('class', 'point-evolution')
      .style('fill', s.couleur)
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.temperature))
      .attr('r', 3)
      .on('mouseenter mousemove', function (evenement, d) {
        afficherInfobulle(
          evenement,
          `<strong>${s.infos.nom_departement}</strong><br>${d3.utcFormat('%d/%m/%Y')(d.date)}<br>${d.temperature}°C`
        );
      })
      .on('mouseleave', cacherInfobulle);
  }
}
