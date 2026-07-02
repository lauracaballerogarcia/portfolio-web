/**
 * project.js — Página de detalle de proyecto
 *
 * Lee el slug desde la URL, carga el JSON de proyectos,
 * carga el Markdown del case study y rellena el DOM.
 */

import { fetchProjects, fetchProjectContent } from '../../data/projects.js';

import '../../components/site-nav/site-nav.js';
import '../../components/site-footer/site-footer.js';

import '../../styles/tokens.css';
import '../../components/site-nav/site-nav.css';
import '../../components/site-footer/site-footer.css';
import './project.css';

// ─── Utilidades DOM ────────────────────────────────

function $(id) { return document.getElementById(id); }

function setText(id, value) {
  const el = $(id);
  if (el && value) el.textContent = value;
}

function show(id) { const el = $(id); if (el) el.hidden = false; }
function hide(id) { const el = $(id); if (el) el.hidden = true;  }

// ─── Slug desde URL ────────────────────────────────

function getSlugFromURL() {
  const parts = window.location.pathname
    .replace(/^\/|\/$/g, '')
    .split('/');
  return parts[1] ?? null;
}

// ─── Índice de navegación interna ──────────────────

function renderIndex() {
  const indexNav = document.querySelector('.project-index');
  if (!indexNav) return;

  const sections = [
    { id: 'overview',   label: 'Overview'   },
    { id: 'problem',    label: 'Problem'    },
    { id: 'solution',   label: 'Solution'   },
    { id: 'research',   label: 'Research'   },
    { id: 'outcome',    label: 'Outcome'    },
    { id: 'reflection', label: 'Reflection' },
  ];

  indexNav.innerHTML = `
    <ul class="project-index__list">
      ${sections.map(s => `
        <li class="project-index__item">
          <a href="#${s.id}" class="project-index__link">${s.label}</a>
        </li>
      `).join('')}
    </ul>
  `;

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

// ─── Renderizado ───────────────────────────────────

async function renderProject(project, allProjects) {
  // Meta del documento
  document.title = `${project.title} — Portfolio`;
  document.querySelector('meta[name="description"]')
    ?.setAttribute('content', project.summary ?? '');
  document.querySelector('meta[property="og:title"]')
    ?.setAttribute('content', project.title);
  document.querySelector('meta[property="og:description"]')
    ?.setAttribute('content', project.summary ?? '');

  // Hero
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

  // Sidebar — título, cliente, tags
  setText('project-title',  project.title);
  setText('project-client', project.client ?? project.role ?? '');

  const tagsEl = $('project-tags');
  if (tagsEl) {
    tagsEl.innerHTML = project.tags
      .map(t => `<span class="project-tag">${t}</span>`)
      .join('');
  }

  // Summary
  setText('project-summary', project.claim ?? project.summary ?? '');

  // Metadatos
  setText('project-timeline', project.timeline ?? '');
  setText('project-role',     project.role ?? '');

  if (project.team) {
    const teamEl = $('project-team');
    if (teamEl) {
      teamEl.innerHTML = project.team
        .map(m => `<li>${m}</li>`)
        .join('');
    }
  }

  // Contenido del case study (Markdown)
const body = $('project-body');
if (body) {
  try {
    const html = await fetchProjectContent(project.slug);
    console.log('HTML generado:', html);
    body.innerHTML = html;
  } catch (err) {
    console.error('Error en fetchProjectContent:', err);
  }
}

// Índice — después de asignar los IDs
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

  hide('project-loading');
  show('project-content');
}

function renderError() {
  hide('project-loading');
  show('project-error');
}

// ─── Bootstrap ──────────────────────────────────────

async function init() {
  const slug = getSlugFromURL();

  if (!slug) { renderError(); return; }

  try {
    const projects = await fetchProjects();
    const project  = projects.find(p => p.slug === slug);

    if (!project) { renderError(); return; }

    await renderProject(project, projects);
  } catch (err) {
    console.error('Error cargando el proyecto:', err);
    renderError();
  }
}

init();