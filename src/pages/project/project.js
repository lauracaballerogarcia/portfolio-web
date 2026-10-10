/**
 * project.js — Página de detalle de proyecto
 *
 * Lee el slug desde la URL, carga el JSON de proyectos,
 * carga el Markdown del case study y rellena el DOM.
 */

import { fetchProjects, fetchProjectContent, hasCaseStudy, getThumbnail, HERO_MOBILE_MEDIA } from '../../data/projects.js';
import { initFigureLightbox } from './figure-lightbox.js';


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
// En el Markdown, la ceja es un <p class="eyebrow"> escrito justo antes
// de un h2 — p. ej. "Research" antes de "## We assumed the problem...". No es
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

  // Los enlaces son anclas nativas: el navegador mueve el foco a la
  // sección, actualiza la URL y respeta prefers-reduced-motion. El
  // offset del header fijo lo aplica scroll-margin-top (project.css).

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
      if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
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
    .filter((p) => p.slug !== current.slug && hasCaseStudy(p.slug))
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
              <img src="${getThumbnail(p)}" alt="" loading="lazy" decoding="async">
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

  // El poster (data-poster) se asigna al acercarse, igual que el vídeo, para
  // no descargar todos al entrar. Mientras no hay poster ni fotograma se ve
  // el fondo de .cs-figure__video, con el tamaño ya reservado.
  const showPoster = (video) => {
    if (video.dataset.poster && !video.getAttribute('poster')) video.poster = video.dataset.poster;
  };

  // Carga el vídeo la primera vez que se acerca a la pantalla. Con
  // movimiento reducido solo pide los metadatos: el navegador muestra el
  // primer fotograma como imagen fija y se reproduce solo a demanda. Si hay
  // poster, con movimiento reducido basta con él: el vídeo espera al botón.
  const approach = (video) => {
    showPoster(video);
    if (!(reduceMotion.matches && video.dataset.poster)) load(video);
  };

  const load = (video) => {
    if (video.dataset.loaded) return;
    video.dataset.loaded = 'true';
    video.preload = reduceMotion.matches ? 'metadata' : 'auto';
    video.load();
  };

  const autoplay = (video) => {
    if (reduceMotion.matches || video.dataset.userPaused === 'true') return;
    video.play().catch(() => {});
  };

  // Dos observadores: uno anticipa la descarga (300px antes de entrar) y
  // otro reproduce solo mientras el vídeo es visible y pausa al salir.
  const supportsIO = 'IntersectionObserver' in window;
  const loadObserver = supportsIO && new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { approach(target); loadObserver.unobserve(target); }
    });
  }, { rootMargin: '300px 0px' });

  const playObserver = supportsIO && new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) autoplay(target);
      else if (!target.paused) target.pause();
    });
  });

  videos.forEach((video) => {
    const wrapper = video.parentElement;
    if (wrapper.querySelector('.cs-figure__toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button cs-figure__toggle';

    const sync = () => {
      const paused = video.paused;
      button.dataset.state = paused ? 'paused' : 'playing';
      button.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    };

    // El botón manda: si la usuaria pausa, el vídeo no se reanuda solo
    button.addEventListener('click', () => {
      if (video.paused) {
        video.dataset.userPaused = 'false';
        showPoster(video);
        load(video);
        video.play().catch(() => {});
      } else {
        video.dataset.userPaused = 'true';
        video.pause();
      }
    });

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);

    wrapper.appendChild(button);
    sync();

    if (supportsIO) {
      loadObserver.observe(video);
      playObserver.observe(video);
    } else {
      // Navegadores sin IntersectionObserver: comportamiento anterior
      approach(video);
      autoplay(video);
    }
  });
}

// ─── Volver arriba (solo < 1024px, ver project.css) ──
// Aparece cuando el índice del case study ya ha salido por arriba (antes
// taparía la primera etiqueta) y se oculta al llegar a Related work y al
// footer, que tiene su propio enlace "Up" en la misma esquina.
// Se calcula en scroll (una vez por frame) y no con IntersectionObserver:
// un salto de scroll (enlace del índice, recarga a media página) puede pasar
// el índice sin que llegue a cortar el viewport, y el observador no avisaría.

let stopBackToTop = () => {};

function initBackToTop() {
  stopBackToTop();

  const button = document.querySelector('.back-to-top');
  const index  = document.querySelector('.project-index');
  if (!button || !index) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    if (!button.isConnected) return stopBackToTop(); // se salió de la página (SPA)
    const pastIndex = index.getBoundingClientRect().bottom < 0;
    const atEnd = [...document.querySelectorAll('.related-work:not([hidden]), site-footer')]
      .some(el => el.getBoundingClientRect().top < window.innerHeight);
    button.dataset.visible = String(pastIndex && !atEnd);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();

  stopBackToTop = () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    cancelAnimationFrame(frame);
  };
}

// ─── Renderizado ───────────────────────────────────

async function renderProject(project, allProjects) {
  // Meta del documento
  document.title = `${project.title} — Laura Caballero García`;
  document.querySelector('meta[name="description"]')
    ?.setAttribute('content', project.summary ?? '');
  document.querySelector('meta[property="og:title"]')
    ?.setAttribute('content', project.title);
  document.querySelector('meta[property="og:description"]')
    ?.setAttribute('content', project.summary ?? '');

  // Hero. Si el proyecto declara heroMobile (recorte vertical), <picture>
  // lo sirve en móvil en vertical; si no, todas las pantallas usan el hero.
  const hero = document.querySelector('.project-hero');
  if (hero && project.hero) {
    const picture = document.createElement('picture');
    if (project.heroMobile) {
      const source = document.createElement('source');
      source.media  = HERO_MOBILE_MEDIA;
      source.srcset = project.heroMobile;
      picture.appendChild(source);
    }
    const img = document.createElement('img');
    img.src      = project.hero;
    img.alt      = '';
    img.loading  = 'eager';
    img.fetchPriority = 'high';
    img.decoding = 'async';
    img.classList.add('project-hero__img');
    picture.appendChild(img);
    hero.appendChild(picture);
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
  initBackToTop();

  // Related work — al final, para que un fallo aquí no afecte al Case Study
  renderRelatedWork(project, allProjects);

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