/**
 * archive.js — Página de archivo
 *
 * Filtros por tag (selección múltiple), vista lista/cuadrícula
 * y preview de la hero image siguiendo al cursor en la vista lista.
 */

import { fetchProjects, getUniqueTags, hasCaseStudy } from '../../data/projects.js';
import './archive.css';

const DEFAULT_VIEW = 'list';

const state = {
  projects: [],
  activeTags: new Set(), // vacío = All
  view: DEFAULT_VIEW,
};

const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

// ─── Filtrado ─────────────────────────────────────

function getVisibleProjects() {
  if (state.activeTags.size === 0) return state.projects;
  return state.projects.filter(p =>
    p.tags.some(tag => state.activeTags.has(tag))
  );
}

// ─── Filtros ──────────────────────────────────────

function renderFilters(tags) {
  const container = document.getElementById('archive-filters');
  if (!container) return;

  container.innerHTML = [
    `<button type="button" class="button-primary archive-filters__all" data-tag="all" aria-pressed="true">All</button>`,
    ...tags.map(tag =>
      `<button type="button" class="button-primary" data-tag="${tag}" aria-pressed="false">${tag}</button>`
    ),
  ].join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.button-primary');
    if (!btn) return;

    const { tag } = btn.dataset;

    if (tag === 'all') state.activeTags.clear();
    else if (state.activeTags.has(tag)) state.activeTags.delete(tag);
    else state.activeTags.add(tag);

    syncFilterButtons();
    renderProjects();
  });
}

function syncFilterButtons() {
  document.querySelectorAll('#archive-filters .button-primary').forEach(btn => {
    const { tag } = btn.dataset;
    const pressed = tag === 'all'
      ? state.activeTags.size === 0
      : state.activeTags.has(tag);
    btn.setAttribute('aria-pressed', String(pressed));
  });
}

// ─── Cambio de vista ──────────────────────────────

function initViewToggle() {
  const buttons = document.querySelectorAll('.view-toggle');

  buttons.forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.view === state.view));

    btn.addEventListener('click', () => {
      if (state.view === btn.dataset.view) return;
      state.view = btn.dataset.view;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      hidePreview();
      renderProjects();
    });
  });
}

// ─── Render ───────────────────────────────────────

function listItem(p) {
  return `
    <li>
      <a class="archive-row" href="/project/${p.slug}/" data-hero="${p.hero}">
        <h2>${p.title}</h2>
        <p>${p.claim ?? p.summary}</p>
        <time datetime="${p.year}">${p.year}</time>
      </a>
    </li>
  `;
}

function gridItem(p) {
  const available = hasCaseStudy(p.slug);
  const chipText  = available ? 'See work' : 'Coming soon!';

  return `
    <li>
      <a class="archive-card" href="/project/${p.slug}/">
        <figure>
          <img src="${p.hero}" alt="" loading="lazy" decoding="async">
            <span class="chip${available ? '' : ' chip--coming-soon'}" aria-hidden="true">
            <span class="chip-text">${chipText}</span>
          </span>
        </figure>
        <h2>${p.title}</h2>
        <p>${p.tags.join(', ')}</p>
        ${available ? '' : '<span class="visually-hidden">Case study coming soon</span>'}
      </a>
    </li>
  `;
}

function renderProjects() {
  const list = document.getElementById('archive-projects');
  const status = document.getElementById('archive-status');
  if (!list) return;

  const visible = getVisibleProjects();
  const template = state.view === 'grid' ? gridItem : listItem;

  list.dataset.view = state.view;
  list.innerHTML = visible.length
    ? visible.map(template).join('')
    : `<li class="archive-empty">No projects match these filters.</li>`;

  if (status) {
    status.textContent = `${visible.length} ${visible.length === 1 ? 'project' : 'projects'}`;
  }
}

// ─── Preview en cursor (vista lista) ──────────────

let previewEl = null;
let previewImg = null;

function hidePreview() {
  previewEl?.classList.remove('is-visible');
}

function initCursorPreview() {
  previewEl = document.querySelector('.cursor-preview');
  previewImg = previewEl?.querySelector('img');
  const list = document.getElementById('archive-projects');
  if (!previewEl || !previewImg || !list) return;

  let x = 0;
  let y = 0;
  let frame = null;

  list.addEventListener('mouseover', (e) => {
    if (state.view !== 'list' || !canHover.matches) return;
    const row = e.target.closest('.archive-row');
    if (!row) return;

    if (previewImg.getAttribute('src') !== row.dataset.hero) {
      previewImg.src = row.dataset.hero;
    }
    previewEl.classList.add('is-visible');
  });

  list.addEventListener('mousemove', (e) => {
    if (state.view !== 'list') return;
    x = e.clientX;
    y = e.clientY;

    if (frame) return;
    frame = requestAnimationFrame(() => {
      previewEl.style.setProperty('--x', `${x}px`);
      previewEl.style.setProperty('--y', `${y}px`);
      frame = null;
    });
  });

  list.addEventListener('mouseleave', hidePreview);
}

// ─── Init ─────────────────────────────────────────

export async function initArchive() {
  try {
    const projects = await fetchProjects();
    state.projects = [...projects].sort((a, b) => Number(b.year) - Number(a.year));

    renderFilters(getUniqueTags(projects));
    initViewToggle();
    initCursorPreview();
    renderProjects();
  } catch (err) {
    console.error(err);
    const list = document.getElementById('archive-projects');
    if (list) list.innerHTML = `<li class="archive-empty" role="alert">Projects could not be loaded.</li>`;
  }
}