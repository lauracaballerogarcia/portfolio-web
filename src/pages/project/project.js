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

  // Lee los h2 del body generado por el Markdown
  const headings = Array.from(document.querySelectorAll('#project-body h2'));
  if (!headings.length) return;

  // Construye las secciones dinámicamente desde los h2
  const sections = headings.map(h => ({
    id:    h.closest('section')?.id ?? h.id,
    label: h.textContent,
  }));

  indexNav.innerHTML = `
    <ul class="project-index__list">
      ${sections.map(s => `
        <li class="project-index__item">
          <a href="#${s.id}" class="project-index__link">${s.label}</a>
        </li>
      `).join('')}
    </ul>
  `;

  // Scroll suave con offset del header al hacer click
  indexNav.querySelectorAll('.project-index__link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      const headerEl = document.querySelector('.site-nav');
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - rem;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Marca el enlace activo al hacer scroll
  const links = indexNav.querySelectorAll('.project-index__link');

  function updateActiveLink() {
    const headerEl = document.querySelector('.site-nav');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
    const scrollY = window.scrollY + headerHeight + 32;

    let current = null;

    headings.forEach(h => {
      const section = h.closest('section');
      const top = section
        ? section.getBoundingClientRect().top + window.scrollY
        : h.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollY) current = section?.id ?? h.id;
    });

    links.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
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
  if (hero && project.hero) {
    const img = document.createElement('img');
    img.src      = project.hero;
    img.alt      = '';
    img.loading  = 'eager';
    img.decoding = 'async';
    img.classList.add('project-hero__img');
    hero.appendChild(img);
  }

  // Sidebar — título, cliente, tags
  setText('project-title',  project.title);
  setText('project-client', project.client ?? '');

  const tagsEl = $('project-tags');
  if (tagsEl) {
    tagsEl.innerHTML = project.tags
      .map(t => `<span class="project-tag">${t}</span>`)
      .join('');
  }

  // Summary
  setText('project-summary', project.summary ?? '');

  // Metadatos
  setText('project-timeline', project.timeline ?? '');

  if (project.roles) {
    const rolesEl = $('project-role');
    if (rolesEl) {
      rolesEl.innerHTML = project.roles
        .map(r => `<li>${r}</li>`)
        .join('');
    }
  }

  if (project.tools) {
    const toolsEl = $('project-tools');
    if (toolsEl) {
      toolsEl.innerHTML = project.tools
        .map(t => `<li>${t}</li>`)
        .join('');
    }
  }

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
      body.innerHTML = html;

      // Añade IDs a los h2
      body.querySelectorAll('h2').forEach(h => {
        h.id = h.textContent.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
      });

      // Envuelve cada h2 y su contenido en una section
      const h2s = Array.from(body.querySelectorAll('h2'));

      h2s.forEach((h2, i) => {
        const section = document.createElement('section');
        section.id = h2.id;
        h2.removeAttribute('id'); // el id pasa a la section

        const next = h2s[i + 1];
        const siblings = [];
        let el = h2.nextElementSibling;

        while (el && el !== next) {
          siblings.push(el);function renderIndex() {
  const indexNav = document.querySelector('.project-index');
  if (!indexNav) return;

  // Lee los h2 del body generado por el Markdown
  const headings = Array.from(document.querySelectorAll('#project-body h2'));
  if (!headings.length) return;

  // Construye las secciones dinámicamente desde los h2
  const sections = headings.map(h => ({
    id:    h.closest('section')?.id ?? h.id,
    label: h.textContent,
  }));

  indexNav.innerHTML = `
    <ul class="project-index__list">
      ${sections.map(s => `
        <li class="project-index__item">
          <a href="#${s.id}" class="project-index__link">${s.label}</a>
        </li>
      `).join('')}
    </ul>
  `;

  // Scroll suave con offset del header al hacer click
  indexNav.querySelectorAll('.project-index__link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      const headerEl = document.querySelector('.site-nav');
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - rem;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Marca el enlace activo al hacer scroll
  const links = indexNav.querySelectorAll('.project-index__link');

  function updateActiveLink() {
    const headerEl = document.querySelector('.site-nav');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
    const scrollY = window.scrollY + headerHeight + 32;

    let current = null;

    headings.forEach(h => {
      const section = h.closest('section');
      const top = section
        ? section.getBoundingClientRect().top + window.scrollY
        : h.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollY) current = section?.id ?? h.id;
    });

    links.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}
          el = el.nextElementSibling;
        }

        h2.before(section);
        section.appendChild(h2);
        siblings.forEach(s => section.appendChild(s));
      });

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
    setText('project-nav-prev-title', prev.title ?? '');
  }
  if (next) {
    const el = $('project-nav-next');
    if (el) { el.href = `/project/${next.slug}/`; el.hidden = false; }
    setText('project-nav-next-title', next.title ?? '');
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