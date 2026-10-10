/**
 * main.js — Router principal
 *
 * Detecta la URL actual y carga el módulo correspondiente.
 * Punto de entrada único para toda la aplicación.
 */

// Todos los estilos entran por un único archivo, en orden ITCSS
import '../styles/main.css';

import '../components/site-nav/site-nav.js';
import '../components/site-footer/site-footer.js';

import { initHome }    from './index.js';
import { initProject } from './project/project.js';
import { initAbout }   from './about/about.js';

import { initArchive } from './archive/archive.js';
import archiveHTML     from 'bundle-text:./archive/archive.html';

import projectHTML from 'bundle-text:./project/project.html';
import aboutHTML   from 'bundle-text:./about/about.html';

const path = window.location.pathname;
const main = document.querySelector('main');

// ─── Carga el HTML de la página y ejecuta su módulo ──────────

function loadPage(html, initFn) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  main.innerHTML = doc.querySelector('main').innerHTML;
  initFn();
}

// ─── Router ───────────────────────────────────────────────────

if (path.startsWith('/project/')) {
  // La página de proyecto gestiona su propio ancho internamente
  main.classList.remove('container');
  loadPage(projectHTML, initProject);

} else if (path.startsWith('/archive')) {
  document.title = 'Archive — Laura Caballero García';
  main.classList.add('container');
  loadPage(archiveHTML, initArchive);

} else if (path.startsWith('/about')) {
  document.title = 'About — Laura Caballero García';
  main.classList.add('container');
  loadPage(aboutHTML, initAbout);

} else {
  // Página de inicio
  main.classList.add('container');
  initHome();
}