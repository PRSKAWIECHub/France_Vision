// Petite infobulle de survol, partagee par toutes les cartes.
const elInfobulle = document.getElementById('infobulle');
const DECALAGE_INFOBULLE = 14;

function afficherInfobulle(evenement, html) {
  elInfobulle.innerHTML = html;
  elInfobulle.hidden = false;
  deplacerInfobulle(evenement);
}

function deplacerInfobulle(evenement) {
  elInfobulle.style.left = `${evenement.clientX + DECALAGE_INFOBULLE}px`;
  elInfobulle.style.top = `${evenement.clientY + DECALAGE_INFOBULLE}px`;
}

function cacherInfobulle() {
  elInfobulle.hidden = true;
}
