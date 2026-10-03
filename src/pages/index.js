/**
 * index.js — Punto de entrada principal
 *
 * Orquesta la carga de datos, el estado y el renderizado.
 * Esta es la única capa que conecta datos con DOM.
 */

import store from '../state/store.js';
import { fetchProjects, filterByTag, getUniqueTags, hasCaseStudy, getThumbnail } from '../data/projects.js';

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
  const list = document.querySelector('#featured-projects');
  if (!list) return;

  const visible = filterByTag(state.projects, state.activeTag);

  list.setAttribute('aria-busy', state.loading ? 'true' : 'false');

  if (state.loading) {
    list.innerHTML = `<li class="projects-status">Cargando proyectos…</li>`;
    return;
  }

  if (state.error) {
    list.innerHTML = `<li class="projects-status" role="alert">No se pudieron cargar los proyectos.</li>`;
    return;
  }

  if (visible.length === 0) {
    list.innerHTML = `<li class="projects-status">No hay proyectos.</li>`;
    return;
  }

  list.innerHTML = visible.map((project, i) => {
    const isFeatured = i === 0;
    const available = hasCaseStudy(project.slug);
    const thumb = getThumbnail(project);
    const chipText  = !available ? 'Coming soon!'
                    : isFeatured ? 'See case study'
                    : 'See work';
    const sizes      = isFeatured
      ? 'calc(100vw - 2rem)'
      : '(max-width: 768px) calc(100vw - 2rem), calc(50vw - 1.5rem)';

    return `
        <li class="${isFeatured ? 'card--1col' : 'card--2col'}${available ? '' : ' card--coming-soon'}">
        <a href="/project/${project.slug}/" aria-label="View ${project.title} project: ${project.claim ?? project.summary}${available ? '' : ' (case study coming soon)'}">
          <figure>
                        <picture>
              <source
                type="image/webp"
                srcset="${thumb}?width=400 400w,
                        ${thumb}?width=768 768w,
                        ${thumb}?width=1024 1024w,
                        ${thumb}?width=1440 1440w"
                sizes="${sizes}">
              <img
                src="${thumb}"
                srcset="${thumb}?width=400 400w,
                        ${thumb}?width=768 768w,
                        ${thumb}?width=1024 1024w,
                        ${thumb}?width=1440 1440w"
                sizes="${sizes}"
                width="2880"
                height="1800"
                ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
                decoding="async"
                alt="">
            </picture>
            <div class="chip${available ? '' : ' chip--coming-soon'}" aria-hidden="true">              
            <span class="chip-text">${chipText}</span>
            </div>
          </figure>
          <div class="card-info">
            <h2>${project.title}</h2>
            <p>${project.claim ?? project.summary}</p>
          </div>
        </a>
      </li>
    `;
  }).join('');
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
    const featured = projects.filter(p => p.featured === true);

    store.setState({ projects: featured, loading: false });
    initTagFilter(featured);
  } catch (err) {
    console.error(err);
    store.setState({ loading: false, error: err.message });
  }
}

/** Exporta la función de inicialización para el router */
export function initHome() {
  init();
}