/**
 * detalle.js — Página de detalle de proyecto
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
import './detalle.css';

// ─── Utilidades DOM ──────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function setText(id, value) {
  const el = $(id);
  if (el && value) el.textContent = value;
}

function show(id)   { const el = $(id); if (el) el.hidden = false; }
function hide(id)   { const el = $(id); if (el) el.hidden = true;  }

// ─── Leer slug desde la URL ──────────────────────────────────
//
// URL esperada: /proyecto/nombre-del-proyecto/
// window.location.pathname → "/proyecto/nombre-del-proyecto/"

function getSlugFromURL() {
  const parts = window.location.pathname
    .replace(/^\/|\/$/g, '')   // quita slashes del inicio y fin
    .split('/');               // ["proyecto", "nombre-del-proyecto"]
  return parts[1] ?? null;
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

  // Cabecera
  setText('project-breadcrumb-title', project.title);
  setText('project-title',   project.title);
  setText('project-summary', project.summary);
  setText('project-year',    project.year);

  // Tags en cabecera
  const tagsEl = $('project-tags');
  if (tagsEl) {
    tagsEl.innerHTML = project.tags
      .map(t => `<span class="project-tag">${t}</span>`)
      .join('');
  }

  // Imagen de portada — creada dinámicamente para evitar src vacío en el HTML
  const figure = $('project-cover-figure');
  if (figure && project.cover) {
    const img = document.createElement('img');
    img.src     = project.cover;
    img.alt     = `Imagen de portada: ${project.title}`;
    img.loading = 'eager';
    img.decoding = 'async';
    figure.appendChild(img);
  } else {
    hide('project-cover');
  }

  // Cuerpo — campos opcionales del JSON
  setText('project-context', project.context ?? '');
  setText('project-process', project.process ?? '');
  setText('project-outcome', project.outcome ?? '');

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

  // Navegación prev / next
  const index = allProjects.findIndex(p => p.slug === project.slug);
  const prev  = allProjects[index - 1];
  const next  = allProjects[index + 1];

  if (prev) {
    const el = $('project-nav-prev');
    if (el) { el.href = `/proyecto/${prev.slug}/`; el.hidden = false; }
    setText('project-nav-prev-title', prev.title);
  }
  if (next) {
    const el = $('project-nav-next');
    if (el) { el.href = `/proyecto/${next.slug}/`; el.hidden = false; }
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
