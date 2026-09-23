// Regles de couleur en fonction de la temperature (voir CLAUDE.md).
// Bornes: bleu fonce < 0 ; bleu moyen [0;5] ; bleu clair ]5;10] ; vert clair ]10;15] ;
// vert moyen ]15;20] ; vert fonce ]20;25] ; rouge clair ]25;30] ; rouge moyen ]30;35] ;
// rouge fonce > 35 ; blanc si aucune donnee.

const PALETTE_TEMPERATURE = [
  { max: 0, inclusive: false, couleur: '#08306b', label: '< 0°C' },
  { max: 5, inclusive: true, couleur: '#4292c6', label: '0 à 5°C' },
  { max: 10, inclusive: true, couleur: '#9ecae1', label: '5 à 10°C' },
  { max: 15, inclusive: true, couleur: '#c7e9c0', label: '10 à 15°C' },
  { max: 20, inclusive: true, couleur: '#74c476', label: '15 à 20°C' },
  { max: 25, inclusive: true, couleur: '#006d2c', label: '20 à 25°C' },
  { max: 30, inclusive: true, couleur: '#fcbba1', label: '25 à 30°C' },
  { max: 35, inclusive: true, couleur: '#fb6a4a', label: '30 à 35°C' },
];
const COULEUR_TRES_CHAUD = '#a50f15';
const COULEUR_SANS_DONNEE = '#ffffff';

function couleurPourTemperature(temperature) {
  if (temperature === null || temperature === undefined || Number.isNaN(temperature)) {
    return COULEUR_SANS_DONNEE;
  }
  for (const palier of PALETTE_TEMPERATURE) {
    if (palier.inclusive ? temperature <= palier.max : temperature < palier.max) {
      return palier.couleur;
    }
  }
  return COULEUR_TRES_CHAUD;
}
