/**
 * main.js — Router principal
 *
 * Detecta la URL actual y carga el módulo correspondiente.
 * Punto de entrada único para toda la aplicación.
 */

import '../styles/tokens.css';
import '../components/site-nav/site-nav.js';
import '../components/site-footer/site-footer.js';
import '../components/site-nav/site-nav.css';
import '../components/site-footer/site-footer.css';

import { initHome }    from './index.js';
import { initProject } from './project/project.js';
import { initAbout }   from './about/about.js';

const path = window.location.pathname;
const main = document.querySelector('main');

// ─── Carga el HTML de la página y ejecuta su módulo ──────────

async function loadPage(htmlPath, initFn) {
  const res = await fetch(htmlPath);
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  main.innerHTML = doc.querySelector('main').innerHTML;
  initFn();
}

// ─── Router ───────────────────────────────────────────────────

if (path.startsWith('/project/')) {
  // La página de proyecto gestiona su propio ancho internamente
  main.classList.remove('container');
  loadPage('/project/project.html', initProject);

} else if (path.startsWith('/about')) {
  main.classList.add('container');
  loadPage('/about/about.html', initAbout);

} else {
  // Página de inicio
  main.classList.add('container');
  initHome();
}