/**
 * main.js — Punto de entrada principal
 *
 * Orquesta la carga de datos, el estado y el renderizado.
 * Esta es la única capa que conecta datos con DOM.
 */

import store from '../state/store.js';
import { fetchProjects, filterByTag, getUniqueTags } from '../data/projects.js';

// Componentes
import '../components/site-nav/site-nav.js';
import '../components/site-footer/site-footer.js';
import '../components/project-card/project-card.js';
import '../components/tag-filter/tag-filter.js';

// Estilos
import '../styles/tokens.css';
import '../components/site-nav/site-nav.css';
import '../components/site-footer/site-footer.css';
import '../components/project-card/project-card.css';
import '../components/tag-filter/tag-filter.css';
import './index.css';

/** Renderiza la cuadrícula de proyectos según el estado actual */
function renderProjects(state) {
  const grid = document.querySelector('#project-grid');
  if (!grid) return;

  const visible = filterByTag(state.projects, state.activeTag);

  if (state.loading) {
    grid.innerHTML = `<p class="projects-loading">Cargando proyectos…</p>`;
    return;
  }

  if (state.error) {
    grid.innerHTML = `<p class="projects-error" role="alert">
      No se pudieron cargar los proyectos. Inténtalo de nuevo.
    </p>`;
    return;
  }

  if (visible.length === 0) {
    grid.innerHTML = `<p class="projects-empty">
      No hay proyectos con este filtro.
    </p>`;
    return;
  }

  grid.innerHTML = visible.map(project => `
    <project-card
      title="${project.title}"
      summary="${project.summary}"
      tags="${project.tags.join(',')}"
      year="${project.year}"
      slug="${project.slug}"
      cover="${project.cover ?? ''}"
    ></project-card>
  `).join('');
}

/** Inicializa el filtro de tags */
function initTagFilter(projects) {
  const filter = document.querySelector('tag-filter');
  if (!filter) return;
  const tags = getUniqueTags(projects);
  filter.setAttribute('tags', JSON.stringify(tags));
}

/** Bootstrap */
async function init() {
  store.subscribe(renderProjects);

  store.setState({ loading: true });

  try {
    const projects = await fetchProjects();
    store.setState({ projects, loading: false });
    initTagFilter(projects);
  } catch (err) {
    console.error(err);
    store.setState({ loading: false, error: err.message });
  }
}

init();
