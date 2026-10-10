/**
 * about.js — Página About
 *
 * Todo el contenido vive en src/data/about.json: un objeto con un perfil
 * por clave (professional, personal…). Un perfil a null todavía no existe
 * y no se muestra. Si hay más de un perfil, se pinta el selector; al
 * cambiar de perfil se vuelven a pintar foto, intro, secciones e índice.
 */

import aboutData from '../../data/about.json';
import { marked } from 'marked';

// "2025-05" → "May 2025". Las mayúsculas las pone el CSS.
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// El contenido es nuestro, pero se escapa igualmente: un "<" o un "&"
// en el JSON no debe romper el marcado
function escapeHTML(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return 'Present';
  const [year, month] = value.split('-').map(Number);
  return `<time datetime="${value}">${dateFormat.format(Date.UTC(year, month - 1))}</time>`;
}

// ─── Secciones: una función por tipo ───────────────

function renderTimelineItem(item) {
  const { name, url } = item.organization ?? {};
  const organization = url
    ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)}</a>`
    : escapeHTML(name);
  const location = item.location ? ` · ${escapeHTML(item.location)}` : '';

  return `
    <li>
      <details class="about-item">
        <summary>
          <span class="about-item__role">${escapeHTML(item.role)}</span>
          <span class="about-item__dates">${formatDate(item.start)} – ${formatDate(item.end)}</span>
          <span class="about-item__icon" aria-hidden="true"></span>
        </summary>
        ${name ? `<p class="about-item__organization">${organization}${location}</p>` : ''}
        ${item.description ? `<p class="about-item__description">${escapeHTML(item.description)}</p>` : ''}
      </details>
    </li>
  `;
}

function renderListItem(item) {
  return `<li class="about-entry"><span class="about-entry__name">${escapeHTML(item)}</span></li>`;
}

function renderLanguageItem(item) {
  return `
    <li class="about-entry">
      <span class="about-entry__name">${escapeHTML(item.language)}</span>
      <span class="about-entry__level">${escapeHTML(item.level)}</span>
      ${item.note ? `<span class="about-entry__note">${escapeHTML(item.note)}</span>` : ''}
    </li>
  `;
}

const itemRenderers = {
  timeline:  renderTimelineItem,
  list:      renderListItem,
  languages: renderLanguageItem,
};

function renderSection(section) {
  const renderItem = itemRenderers[section.type];
  if (!renderItem || !section.items?.length) return '';

  // role="list": Safari deja de anunciar como lista un ul sin viñetas
  return `
    <section class="about-section" id="${escapeHTML(section.id)}" aria-labelledby="${escapeHTML(section.id)}-title">
      <h2 class="about-section__title" id="${escapeHTML(section.id)}-title">${escapeHTML(section.title)}</h2>
      <ul class="about-section__list" role="list">
        ${section.items.map(renderItem).join('')}
      </ul>
    </section>
  `;
}

// ─── Índice lateral ────────────────────────────────

// Marca el enlace de la sección visible. Mismo criterio que el índice
// del case study: la sección activa es la última cuyo título ha pasado
// una línea al ~35% del alto de la ventana. Lee el DOM en cada llamada,
// así sirve para cualquier perfil sin volver a registrar el listener.
function updateActiveLink() {
  const links   = document.querySelectorAll('#about-index .section-index__link');
  const headers = document.querySelectorAll('.about-section__title');

  const headerEl     = document.querySelector('.site-nav');
  const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
  const triggerLine  = headerHeight + window.innerHeight * 0.35;

  let current = headers[0]?.closest('section')?.id ?? null;
  headers.forEach(h => {
    if (h.getBoundingClientRect().top <= triggerLine) current = h.closest('section').id;
  });

  // Al final de la página la última sección (corta) nunca llega a la
  // línea: si ya no se puede bajar más, es la activa
  const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
  if (atEnd && headers.length) current = headers[headers.length - 1].closest('section').id;

  links.forEach(link => {
    if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function renderIndex(sections) {
  const indexNav = document.getElementById('about-index');
  if (!indexNav) return;

  // Mismas secciones que se pintan: sin items no hay sección ni enlace
  const visible = sections.filter(s => itemRenderers[s.type] && s.items?.length);

  indexNav.innerHTML = `
    <ul class="section-index__list">
      ${visible.map(s => `
        <li class="section-index__item">
          <a href="#${escapeHTML(s.id)}" class="section-index__link">${escapeHTML(s.title)}</a>
        </li>
      `).join('')}
    </ul>
  `;
  updateActiveLink();
}

// ─── Perfil ────────────────────────────────────────

function renderProfile(profile) {
  const image = document.getElementById('about-image');
  if (image) {
    image.innerHTML = profile.image?.src
      ? `<img src="${escapeHTML(profile.image.src)}" alt="${escapeHTML(profile.image.alt)}" decoding="async">`
      : '';
  }

  const intro = document.getElementById('about-intro');
  if (intro) {
    // parseInline: solo negritas, cursivas y enlaces; sin <p> extra
    intro.innerHTML = (profile.intro ?? []).map(p => `<p>${marked.parseInline(p)}</p>`).join('');
  }

  const sections = profile.sections ?? [];
  const container = document.getElementById('about-sections');
  if (container) container.innerHTML = sections.map(renderSection).join('');

  renderIndex(sections);
}

// ─── Selector de perfil ────────────────────────────

function renderSelector(profiles) {
  const group = document.getElementById('about-profiles');
  if (!group || profiles.length < 2) return;

  group.innerHTML = profiles.map(([key, profile], i) => `
    <button type="button" class="button-primary" data-profile="${escapeHTML(key)}" aria-pressed="${i === 0}">
      ${escapeHTML(profile.label)}
    </button>
  `).join('');
  group.hidden = false;

  // Los botones no se vuelven a pintar al cambiar de perfil: el foco se
  // queda en el botón pulsado y aria-pressed comunica cuál está activo
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-profile]');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return;

    group.querySelectorAll('[data-profile]').forEach(b => {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    renderProfile(aboutData[btn.dataset.profile]);
  });
}

/** Exporta la función de inicialización para el router */
export function initAbout() {
  const profiles = Object.entries(aboutData).filter(([, profile]) => profile);
  if (!profiles.length) return;

  renderSelector(profiles);
  renderProfile(profiles[0][1]);

  window.addEventListener('scroll', updateActiveLink, { passive: true });
}
