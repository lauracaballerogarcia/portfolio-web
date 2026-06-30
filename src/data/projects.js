import projectsData from './projects.json';
import { marked } from 'marked';
import sendaMd from 'bundle-text:./content/senda.md';

// ─── Mapa de contenidos ───────────────────────────

const contentMap = {
  'senda': sendaMd,
};

// ─── Renderer personalizado ───────────────────────

const renderer = new marked.Renderer();

renderer.image = (href, title, alt) => {
  const mod = title ?? 'default';
  return `
    <figure class="cs-figure cs-figure--${mod}">
      <picture>
        <source type="image/webp" srcset="${href}">
        <img src="${href}" alt="${alt}" loading="lazy" decoding="async">
      </picture>
    </figure>
  `;
};

renderer.blockquote = (quote) => `
  <blockquote class="cs-quote">${quote}</blockquote>
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