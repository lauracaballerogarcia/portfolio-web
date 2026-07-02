import '../../components/site-nav/site-nav.js';
import '../../components/site-footer/site-footer.js';

import '../../styles/tokens.css';
import '../../components/site-nav/site-nav.css';
import '../../components/site-footer/site-footer.css';
import './about.css';

// ─── Toggle professional / personal ──────────────

const buttons = document.querySelectorAll('.about-toggle__btn');
const modes   = document.querySelectorAll('.about-mode');
const image   = document.getElementById('about-image');

const images = {
  professional: '/images/about-professional.jpg',
  personal:     '/images/about-personal.jpg',
};

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;

    // Actualiza botones
    buttons.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    // Actualiza texto
    modes.forEach(m => { m.hidden = true; });
    document.getElementById(`mode-${mode}`).hidden = false;

    // Actualiza imagen
    if (image) {
      image.src = images[mode];
      image.alt = `Laura Caballero — ${mode}`;
    }
  });
});