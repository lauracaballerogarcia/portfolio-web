import projectsData from './projects.json';
import { marked } from 'marked';

import sendaMd from 'bundle-text:./content/senda.md';
import parcCentralMd from 'bundle-text:./content/parc-central.md';
import xanaMd from 'bundle-text:./content/xana.md';


// ─── Mapa de contenidos ───────────────────────────

const contentMap = {
  'senda': sendaMd,
  'parc-central': parcCentralMd, 
  'xana': xanaMd
};

// ─── Renderer personalizado ───────────────────────

const renderer = new marked.Renderer();

renderer.heading = ({ text, depth }) => {
  const id = text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

renderer.image = ({ href, title, text }) => {
  const mod = title ?? 'default';

  // Vídeo en bucle sin barra de reproducción
  if (/\.(mp4|webm)$/i.test(href)) {
    const type = href.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
    return `
      <figure class="cs-figure cs-figure--${mod} cs-figure--video">
        <div class="cs-figure__video">
          <video autoplay muted loop playsinline aria-label="${text}">
            <source src="${href}" type="${type}">
          </video>
        </div>
      </figure>
    `;
  }

  return `
    <figure class="cs-figure cs-figure--${mod}">
      <picture>
        <source type="image/webp" srcset="${href}">
        <img
          src="${href}"
          alt="${text}"
          loading="lazy"
          decoding="async">
      </picture>
    </figure>
  `;
};

renderer.blockquote = ({ text }) => `
  <blockquote class="cs-quote">${text}</blockquote>
`;

marked.use({ renderer });

// ─── Funciones de datos ───────────────────────────

export async function fetchProjects() {
  return projectsData;
}

export async function fetchProjectContent(slug) {
  const md = contentMap[slug];
  if (!md) throw new Error(`No se encontró el contenido: ${slug}`);
  return marked.parse(md);
}

export function filterByTag(projects, tag) {
  if (tag === 'all') return projects;
  return projects.filter(p => p.tags.includes(tag));
}

export function getUniqueTags(projects) {
  const all = projects.flatMap(p => p.tags);
  return [...new Set(all)].sort();
}

export function hasCaseStudy(slug) {
  return slug in contentMap;
}