/**
 * project.js — Página de detalle de proyecto
 *
 * Lee el slug desde la URL, carga el JSON de proyectos,
 * carga el Markdown del case study y rellena el DOM.
 */

import { fetchProjects, fetchProjectContent } from '../../data/projects.js';
import { initFigureLightbox } from './figure-lightbox.js';


// Estilos
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

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// ─── Slug desde URL ────────────────────────────────

function getSlugFromURL() {
  const parts = window.location.pathname
    .replace(/^\/|\/$/g, '')
    .split('/');
  return parts[1] ?? null;
}

// ─── Ceja (eyebrow) que precede a cada h2 ──────────
//
// El renderer de marked (ver markdown-eyebrow-renderer.js) marca con
// class="eyebrow" cualquier párrafo en mayúsculas que preceda a un h2
// — p. ej. "Research" antes de "## We assumed the problem...". No es
// <strong>: la ceja es una etiqueta de categoría, no énfasis textual,
// así que aquí solo comprobamos la clase, nada de estructura.

function getEyebrowFor(h2) {
  const prev = h2.previousElementSibling;
  return prev?.classList.contains('eyebrow') ? prev : null;
}

// ─── Índice de navegación interna ──────────────────

function renderIndex() {
  const indexNav = document.querySelector('.project-index');
  if (!indexNav) return;

 // Overview vive fuera del case study (en .project-main, antes del
  // article), pero es la primera entrada del índice. querySelectorAll
  // devuelve los elementos en orden de documento, así que va primero.
  const sections = Array.from(
    document.querySelectorAll('#overview, #project-body > section')
  );
  if (!sections.length) return;

  // El label del índice viene de la ceja de cada sección; si por lo
  // que sea una sección no tiene ceja, cae de vuelta al texto del h2.
  const items = sections.map(section => {
    const eyebrow = section.querySelector(':scope > .project-eyebrow');
    const heading = section.querySelector(':scope > h2');
    return {
      id:    section.id,
      label: (eyebrow ?? heading)?.textContent.trim() ?? '',
    };
  });

  indexNav.innerHTML = `
    <ul class="project-index__list">
      ${items.map(s => `
        <li class="project-index__item">
          <a href="#${s.id}" class="project-index__link">${s.label}</a>
        </li>
      `).join('')}
    </ul>
  `;

  // Scroll suave con offset del header al hacer click.
  indexNav.querySelectorAll('.project-index__link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      // El destino del scroll es la ceja, no el h2 — si apuntamos al
      // h2, la ceja (que va justo encima) queda tapada por el header
      // fijo. Si la sección no tiene ceja, cae de vuelta al h2.
      const target = section?.querySelector(':scope > .project-eyebrow') ?? section?.querySelector(':scope > h2') ?? section;
      if (!target) return;
      const headerEl = document.querySelector('.site-nav');
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - rem;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Marca el enlace activo al hacer scroll (se sigue midiendo por la
  // posición del h2, ya que la ceja vive justo encima de él).
  const links    = indexNav.querySelectorAll('.project-index__link');
  const headings = sections
    .map(section => section.querySelector(':scope > h2'))
    .filter(Boolean);

  function updateActiveLink() {
    const headerEl = document.querySelector('.site-nav');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;

    // FIX: antes la línea de referencia estaba pegada justo debajo del
    // header (+32px), así que una sección no pasaba a "activa" hasta
    // que su titular casi tocaba el header — con la sección siguiente
    // ya bien visible en pantalla, el nav seguía señalando la anterior.
    // Se mueve la línea a ~35% del alto de la ventana: el cambio ocurre
    // en cuanto la nueva sección ya es la protagonista visible, no
    // cuando la anterior casi ha desaparecido del todo.
    const triggerLine = window.scrollY + headerHeight + window.innerHeight * 0.35;

    let current = null;

    headings.forEach(h => {
      const top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= triggerLine) current = h.closest('section')?.id ?? h.id;
    });

    links.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}


// ─── Carrusel de insights ──────────────────────────

function initInsightsCarousel(root = document) {
  const track = root.querySelector('.insights__track');
  const prevButton = root.querySelector('[data-scroll="prev"]');
  const nextButton = root.querySelector('[data-scroll="next"]');

  console.log('initInsightsCarousel', { track, prevButton, nextButton });

  if (!track || !prevButton || !nextButton) return;

  const getStep = () => {
    const card = track.querySelector('.insight-card');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const updateArrowState = () => {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    prevButton.disabled = scrollLeft <= 0;
    nextButton.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  };

  prevButton.addEventListener('click', () => {
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  nextButton.addEventListener('click', () => {
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateArrowState, { passive: true });
  updateArrowState();
}

// ── Related work ──────────────────────────────────────────────

const RELATED_LIMIT = 3;

function getRelatedProjects(current, projects, limit = RELATED_LIMIT) {
  const currentTags = new Set(current.tags ?? []);

  return projects
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({
      project: p,
      shared: (p.tags ?? []).filter((tag) => currentTags.has(tag)).length,
      year: parseInt(p.year, 10) || 0,
      tiebreak: Math.random(),
    }))
    .sort((a, b) =>
      b.shared - a.shared ||
      b.year - a.year ||
      a.tiebreak - b.tiebreak
    )
    .slice(0, limit)
    .map(({ project }) => project);
}

function renderRelatedWork(current, projects) {
  const section = document.querySelector('.related-work');
  if (!section) return;

  const related = getRelatedProjects(current, projects);
  if (related.length === 0) return;

  section.innerHTML = `
    <div class="related-work__aside">
      <h2 class="related-work__label" id="related-work-title">Related work</h2>
      <div class="related-work__info" aria-hidden="true">
        <p class="related-work__title">${related[0].title}</p>
        <p class="related-work__claim">${related[0].claim ?? ''}</p>
      </div>
    </div>
    <ul class="related-work__list" role="list">
      ${related.map((p, i) => `
        <li>
          <a class="related-work__link" href="/project/${p.slug}/" data-index="${i}">
            <figure class="related-work__figure">
              <img src="${p.thumbnail ?? p.hero}" alt="" loading="lazy" decoding="async">
            </figure>
            <span class="related-work__caption">
              <span class="related-work__caption-title">${p.title}</span>
              <span class="related-work__caption-claim">${p.claim ?? ''}</span>
            </span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  const title = section.querySelector('.related-work__title');
  const claim = section.querySelector('.related-work__claim');

  const showProject = (index) => {
    const p = related[index];
    title.textContent = p.title;
    claim.textContent = p.claim ?? '';
  };

  section.querySelectorAll('.related-work__link').forEach((link) => {
    const index = Number(link.dataset.index);
    link.addEventListener('pointerenter', () => showProject(index));
    link.addEventListener('focus', () => showProject(index));
  });

  section.hidden = false;
}

// ─── Vídeos en bucle ───────────────────────────────

function initLoopVideos(root = document) {
  const videos = root.querySelectorAll('.cs-figure__video video');
  if (!videos.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  videos.forEach((video) => {
    const wrapper = video.parentElement;
    if (wrapper.querySelector('.cs-figure__toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cs-figure__toggle';

    const sync = () => {
      const paused = video.paused;
      button.dataset.state = paused ? 'paused' : 'playing';
      button.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    };

    button.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);

    // Con movimiento reducido, el vídeo no arranca solo
    if (reduceMotion.matches) video.pause();

    wrapper.appendChild(button);
    sync();
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

      initInsightsCarousel(body);
      initFigureLightbox(body);
      initLoopVideos(body);

   


      // const overviewSection = document.createElement('section');
      // overviewSection.id = 'overview';

      // const overviewEyebrow = document.createElement('p');
      // overviewEyebrow.className = 'project-eyebrow visually-hidden';
      // overviewEyebrow.textContent = 'Overview';

      // overviewSection.appendChild(overviewEyebrow);
      // body.prepend(overviewSection);

      // Envuelve cada h2 (y su ceja, si tiene) junto con su contenido en
      // una <section>. El id de la sección sale de la ceja cuando existe
      // — es la etiqueta corta pensada para navegación — y si no, del
      // propio titular como respaldo.
      const h2s = Array.from(body.querySelectorAll('h2'));

      h2s.forEach((h2, i) => {
        const eyebrowEl = getEyebrowFor(h2);
        const label = (eyebrowEl ?? h2).textContent.trim();

        const section = document.createElement('section');
        section.id = slugify(label);

        // El recorrido hacia el siguiente h2 debe frenar ANTES de la
        // ceja de esa siguiente sección — si no, el bucle la arrastra
        // hacia la sección actual como si fuera un párrafo más, y
        // getEyebrowFor() ya no la encuentra cuando le toca su turno.
        const next = h2s[i + 1];
        const nextBoundary = next ? (getEyebrowFor(next) ?? next) : null;

        const siblings = [];
        let el = h2.nextElementSibling;
        while (el && el !== nextBoundary) {
          siblings.push(el);
          el = el.nextElementSibling;
        }

        const anchor = eyebrowEl ?? h2;
        anchor.before(section);

        if (eyebrowEl) {
          eyebrowEl.classList.add('project-eyebrow');
          section.appendChild(eyebrowEl);
        }
        section.appendChild(h2);
        siblings.forEach(s => section.appendChild(s));
      });

    } catch (err) {
      console.error('Error en fetchProjectContent:', err);
    }
  }



  // Índice — después de envolver las secciones
  renderIndex();

  // Related work — al final, para que un fallo aquí no afecte al Case Study
  renderRelatedWork(project, allProjects);

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

/** Exporta la función de inicialización para el router */
export function initProject() {
  init();
}