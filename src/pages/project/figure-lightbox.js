/**
 * figure-lightbox.js — Lightbox para las figuras del case study
 *
 * Crea un <dialog> reutilizado por todas las figuras (.cs-figure) de la
 * página. Cada figura recibe un botón "ampliar" que abre su imagen a
 * pantalla completa. Los iconos de los botones se pintan por CSS
 * (mask-image), así que aquí no se inyecta ningún SVG.
 */

export function initFigureLightbox(root = document) {
  const figures = root.querySelectorAll('.cs-figure');
  if (!figures.length) return;

  // El <dialog> se crea una única vez y lo reutilizan todas las figuras.
  let dialog = document.getElementById('figure-lightbox');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'figure-lightbox';
    dialog.className = 'figure-lightbox';
    dialog.innerHTML = `
      <button type="button" class="figure-lightbox__close" aria-label="Close enlarged image"></button>
      <img class="figure-lightbox__img" src="" alt="">
    `;
    document.body.appendChild(dialog);
  }

  const dialogImg = dialog.querySelector('.figure-lightbox__img');
  const closeButton = dialog.querySelector('.figure-lightbox__close');
  let lastFocused = null;

  function openLightbox(img, triggerButton) {
    lastFocused = triggerButton;
    dialogImg.src = img.currentSrc || img.src;
    dialogImg.alt = img.alt;
    dialog.showModal();
  }

  function closeLightbox() {
    dialog.close();
  }

  closeButton.addEventListener('click', closeLightbox);

  // Cierra al hacer click en el backdrop (fuera de la imagen).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });

  // <dialog> ya cierra con Escape de forma nativa; aquí solo limpiamos
  // el src (para no dejar la imagen grande cargada en memoria) y
  // devolvemos el foco al botón que abrió el lightbox.
  dialog.addEventListener('close', () => {
    dialogImg.src = '';
    lastFocused?.focus();
  });

  figures.forEach((figure) => {
    const img = figure.querySelector('img');
    if (!img || figure.querySelector('.cs-figure__expand')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cs-figure__expand';
    button.setAttribute('aria-label', 'Enlarge image');

    button.addEventListener('click', () => openLightbox(img, button));

    figure.appendChild(button);
  });
}