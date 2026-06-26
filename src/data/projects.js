/**
 * projects.js — Capa de datos
 *
 * Parcel empaqueta el JSON como módulo ES — sin fetch, sin rutas.
 * En producción queda incluido en el bundle automáticamente.
 */

import projectsData from './projects.json';

export async function fetchProjects() {
  return projectsData;
}

export function filterByTag(projects, tag) {
  if (tag === 'all') return projects;
  return projects.filter(p => p.tags.includes(tag));
}

export function getUniqueTags(projects) {
  const all = projects.flatMap(p => p.tags);
  return [...new Set(all)].sort();
}
