// ─── Toggle professional / personal ──────────────

function initToggle() {
  // Cada botón (data-mode) muestra el bloque de texto #mode-<modo>
  const buttons = document.querySelectorAll('button[data-mode]');
  const modes   = [...buttons].map(b => document.getElementById(`mode-${b.dataset.mode}`)).filter(Boolean);
  // Foto opcional: su ruta y su texto alternativo son contenido y se
  // declaran en about.html (data-image / data-image-alt en cada botón)
  const image   = document.getElementById('about-image');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;

      // Actualiza botones (el estado lo comunica aria-pressed)
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));

      // Actualiza texto
      modes.forEach(m => { m.hidden = true; });
      document.getElementById(`mode-${mode}`).hidden = false;

      // Actualiza imagen
      if (image && btn.dataset.image) {
        image.src = btn.dataset.image;
        image.alt = btn.dataset.imageAlt ?? '';
      }
    });
  });
}

/** Exporta la función de inicialización para el router */
export function initAbout() {
  initToggle();
}