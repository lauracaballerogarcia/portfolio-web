/**
 * project.js — Página de detalle de proyecto
 *
 * Lee el slug desde la URL, carga el JSON de proyectos,
 * encuentra el proyecto correspondiente y rellena el DOM.
 * Sin framework. La lógica de datos viene de /data/projects.js.
 */

import { fetchProjects } from '../../data/projects.js';

import '../../components/site-nav/site-nav.js';
import '../../components/site-footer/site-footer.js';

import '../../styles/tokens.css';
import '../../components/site-nav/site-nav.css';
import '../../components/site-footer/site-footer.css';
import './project.css';

// ─── Utilidades DOM ──────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function setText(id, value) {
  const el = $(id);
  if (el && value) el.textContent = value;
}

function show(id) { const el = $(id); if (el) el.hidden = false; }
function hide(id) { const el = $(id); if (el) el.hidden = true;  }

// ─── Leer slug desde la URL ──────────────────────────────────

function getSlugFromURL() {
  const parts = window.location.pathname
    .replace(/^\/|\/$/g, '')
    .split('/');
  return parts[1] ?? null;
}

// ─── Índice de navegación interna ────────────────────────────

function renderIndex() {
  const indexNav = document.querySelector('.project-index');
  if (!indexNav) return;

  const sections = [
    { id: 'overview',   label: 'Overview'          },
    { id: 'problem',    label: 'Problem'            },
    { id: 'solution',   label: 'Solution'           },
    { id: 'process',    label: 'Research / Process' },
    { id: 'outcome',    label: 'Outcome'            },
    { id: 'reflection', label: 'Reflection'         },
  ];

  indexNav.innerHTML = `
    <ol class="project-index__list">
      ${sections.map(s => `
        <li class="project-index__item">
          <a href="#${s.id}" class="project-index__link">${s.label}</a>
        </li>
      `).join('')}
    </ol>
  `;

  // Marca el enlace activo al hacer scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = indexNav.querySelector(`a[href="#${entry.target.id}"]`);
      if (link) link.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
}

// ─── Renderizado ─────────────────────────────────────────────

function renderProject(project, allProjects) {
  // Meta del documento
  document.title = `${project.title} — Portfolio`;
  document.querySelector('meta[name="description"]')
    ?.setAttribute('content', project.summary);
  document.querySelector('meta[property="og:title"]')
    ?.setAttribute('content', project.title);
  document.querySelector('meta[property="og:description"]')
    ?.setAttribute('content', project.summary);

  // Imagen hero — fondo de pantalla completa
  const hero = document.querySelector('.project-hero');
  if (hero && project.cover) {
    const img = document.createElement('img');
    img.src      = project.cover;
    img.alt      = '';
    img.loading  = 'eager';
    img.decoding = 'async';
    img.classList.add('project-hero__img');
    hero.appendChild(img);
  }

  // Título y metadatos
  setText('project-title',   project.title);
  setText('project-summary', project.summary);
  setText('project-year',    project.year);

  // Tags
  const tagsEl = $('project-tags');
  if (tagsEl) {
    tagsEl.innerHTML = project.tags
      .map(t => `<span class="project-tag">${t}</span>`)
      .join('');
  }

  // Cuerpo — campos opcionales del JSON
  setText('project-context',    project.context    ?? '');
  setText('project-problem',    project.problem    ?? '');
  setText('project-solution',   project.solution   ?? '');
  setText('project-process',    project.process    ?? '');
  setText('project-outcome',    project.outcome    ?? '');
  setText('project-reflection', project.reflection ?? '');

  // Sidebar de metadatos
  setText('meta-year', project.year);
  setText('meta-tags', project.tags.join(', '));

  if (project.role) {
    setText('meta-role', project.role);
    show('meta-role-item');
  }
  if (project.client) {
    setText('meta-client', project.client);
    show('meta-client-item');
  }

  // Índice de navegación
  renderIndex();

  // Navegación prev / next
  const currentIndex = allProjects.findIndex(p => p.slug === project.slug);
  const prev = allProjects[currentIndex - 1];
  const next = allProjects[currentIndex + 1];

  if (prev) {
    const el = $('project-nav-prev');
    if (el) { el.href = `/project/${prev.slug}/`; el.hidden = false; }
    setText('project-nav-prev-title', prev.title);
  }
  if (next) {
    const el = $('project-nav-next');
    if (el) { el.href = `/project/${next.slug}/`; el.hidden = false; }
    setText('project-nav-next-title', next.title);
  }

  // Mostrar contenido, ocultar loading
  hide('project-loading');
  show('project-content');
}

function renderError() {
  hide('project-loading');
  show('project-error');
}

// ─── Bootstrap ───────────────────────────────────────────────

async function init() {
  const slug = getSlugFromURL();

  if (!slug) { renderError(); return; }

  try {
    const projects = await fetchProjects();
    const project  = projects.find(p => p.slug === slug);

    if (!project) { renderError(); return; }

    renderProject(project, projects);
  } catch (err) {
    console.error('Error cargando el proyecto:', err);
    renderError();
  }
}

init();