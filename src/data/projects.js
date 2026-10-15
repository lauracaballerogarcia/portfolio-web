import projectsData from './projects.json';
import { marked } from 'marked';

import sendaMd from 'bundle-text:./content/senda.md';
import parcCentralMd from 'bundle-text:./content/parc-central.md';
import xanaMd from 'bundle-text:./content/xana.md';
import blinkMd from 'bundle-text:./content/blink.md';


// ─── Mapa de contenidos ───────────────────────────

const contentMap = {
  'senda': sendaMd,
  'parc-central': parcCentralMd, 
  'xana': xanaMd,
  'blink': blinkMd
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

// El título de la imagen en Markdown lleva el layout y las dimensiones
// intrínsecas del archivo: ![alt](ruta "full 1440x960"). Con width y
// height el navegador reserva el espacio antes de que cargue el archivo,
// así el texto no salta al hacer scroll. En vídeos se puede añadir
// poster=/media/<proyecto>/<video>-poster.webp: ![alt](ruta "full 1440x900 poster=…").
function parseImageTitle(title) {
  const parts  = (title ?? '').trim().split(/\s+/).filter(Boolean);
  const size   = parts.find(p => /^\d+x\d+$/.test(p));
  const poster = parts.find(p => p.startsWith('poster='))?.slice('poster='.length);
  const mod    = parts.find(p => p !== size && !p.startsWith('poster=')) ?? 'default';
  const [width, height] = size ? size.split('x') : [];
  return { mod, poster, dims: size ? ` width="${width}" height="${height}"` : '' };
}

renderer.image = ({ href, title, text }) => {
  const { mod, dims, poster } = parseImageTitle(title);

  // Vídeo en bucle sin barra de reproducción. No descarga nada, ni el poster
  // (va en data-poster), hasta que initLoopVideos() (project.js) lo acerca al
  // área visible. El fragmento #t=0.001 hace que Safari/iOS pinten el primer
  // fotograma cuando solo se cargan los metadatos (movimiento reducido).
  if (/\.(mp4|webm)$/i.test(href)) {
    const type = href.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
    return `
      <figure class="cs-figure cs-figure--${mod} cs-figure--video">
        <div class="cs-figure__video">
          <video muted loop playsinline preload="none"${dims}${poster ? ` data-poster="${poster}"` : ''} aria-label="${text}">
            <source src="${href}#t=0.001" type="${type}">
          </video>
        </div>
      </figure>
    `;
  }

  return `
    <figure class="cs-figure cs-figure--${mod}">
      <picture class="cs-figure__media">
        <img
          class="cs-figure__image"
          src="${href}"
          alt="${text}"${dims}
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

export function getUniqueTags(projects) {
  const all = projects.flatMap(p => p.tags);
  return [...new Set(all)].sort();
}

export function hasCaseStudy(slug) {
  return slug in contentMap;
}

export function getThumbnail(project) {
  return project.thumbnail ?? project.hero;
}

// Cuándo usar heroMobile (recorte vertical) en lugar del hero o la miniatura:
// pantallas estrechas en vertical, donde la caja de la imagen también es
// vertical. En tablets en vertical (p. ej. 768×1024) la caja es casi
// cuadrada y el hero horizontal da más resolución, así que se queda.
export const HERO_MOBILE_MEDIA = '(max-width: 768px) and (max-aspect-ratio: 2/3)';