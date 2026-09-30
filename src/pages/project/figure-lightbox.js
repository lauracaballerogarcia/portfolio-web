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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // El <dialog> se crea una única vez y lo reutilizan todas las figuras.
  let dialog = document.getElementById('figure-lightbox');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'figure-lightbox';
    dialog.className = 'figure-lightbox';
    dialog.innerHTML = `
      <button type="button" class="figure-lightbox__close" aria-label="Close enlarged view"></button>
      <img class="figure-lightbox__img" src="" alt="" hidden>
      <video class="figure-lightbox__video" controls loop muted playsinline hidden></video>
    `;
    document.body.appendChild(dialog);
  }

  const dialogImg = dialog.querySelector('.figure-lightbox__img');
  const dialogVideo = dialog.querySelector('.figure-lightbox__video');
  const closeButton = dialog.querySelector('.figure-lightbox__close');

  let lastFocused = null;
  let sourceVideo = null;   // vídeo de la página que abrió el lightbox
  let resumeSource = false; // si estaba reproduciéndose al abrirlo

  function openImage(img, triggerButton) {
    lastFocused = triggerButton;
    dialogVideo.hidden = true;
    dialogImg.hidden = false;
    dialogImg.src = img.currentSrc || img.src;
    dialogImg.alt = img.alt;
    dialog.showModal();
  }

  function openVideo(video, triggerButton) {
    lastFocused = triggerButton;
    sourceVideo = video;
    resumeSource = !video.paused;
    video.pause(); // evita dos reproducciones a la vez

    dialogImg.hidden = true;
    dialogVideo.hidden = false;
    dialogVideo.src = video.currentSrc;
    dialogVideo.setAttribute('aria-label', video.getAttribute('aria-label') ?? '');
    dialog.showModal();

    if (!reduceMotion.matches) dialogVideo.play().catch(() => {});
  }

  function closeLightbox() {
    dialog.close();
  }

  closeButton.addEventListener('click', closeLightbox);

  // Cierra al hacer click en el backdrop (fuera del contenido).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });

  // <dialog> ya cierra con Escape de forma nativa; aquí limpiamos los
  // recursos, reanudamos el vídeo original si estaba en marcha y
  // devolvemos el foco al botón que abrió el lightbox.
  dialog.addEventListener('close', () => {
    dialogImg.src = '';
    dialogVideo.pause();
    dialogVideo.removeAttribute('src');
    dialogVideo.load();

    if (sourceVideo && resumeSource) sourceVideo.play().catch(() => {});
    sourceVideo = null;

    lastFocused?.focus();
  });

  figures.forEach((figure) => {
    if (figure.querySelector('.cs-figure__expand')) return;

    const video = figure.querySelector('video');
    const img = figure.querySelector('img');
    if (!video && !img) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cs-figure__expand';
    button.setAttribute('aria-label', video ? 'Enlarge video' : 'Enlarge image');

    if (video) {
      button.addEventListener('click', () => openVideo(video, button));
      // Dentro del contenedor del vídeo, para anclarlo al vídeo
      figure.querySelector('.cs-figure__video').appendChild(button);
    } else {
      button.addEventListener('click', () => openImage(img, button));
      figure.appendChild(button);
    }
  });
}