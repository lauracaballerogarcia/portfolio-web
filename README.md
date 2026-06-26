# Portfolio — Diseño de producto digital

Web construida con HTML, CSS y JavaScript vanilla + Parcel como bundler.
Sin frameworks. Sin dependencias en runtime.

## Stack

- **Bundler:** Parcel 2
- **Componentes:** Web Components nativos (Custom Elements)
- **Estado:** Store observable mínimo (sin librería)
- **Estilos:** CSS custom properties + BEM ligero
- **Hosting:** Cloudflare Pages

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:1234

## Build para producción

```bash
npm run build
```

El resultado queda en `/dist`. Despliega esa carpeta en Cloudflare Pages.

## Estructura del proyecto

```
src/
  components/
    project-card/     # Tarjeta de proyecto
    site-nav/         # Navegación principal
    site-footer/      # Pie de página
    tag-filter/       # Filtro por categoría
  data/
    projects.js       # Capa de datos — funciones puras, sin DOM
  state/
    store.js          # Estado centralizado observable
  styles/
    tokens.css        # Design tokens globales
  pages/
    index.html        # Página principal
    index.css         # Estilos de página
    main.js           # Punto de entrada — orquestación

public/
  data/
    projects.json     # Fuente de datos de proyectos
```

## Añadir un proyecto

Edita `public/data/projects.json` y añade un objeto con esta forma:

```json
{
  "id": "04",
  "slug": "nombre-del-proyecto",
  "title": "Título del proyecto",
  "summary": "Descripción breve.",
  "tags": ["Accesibilidad"],
  "year": "2025",
  "cover": "/images/proyecto-04.jpg",
  "featured": false
}
```

## Migración a framework

La arquitectura está diseñada para facilitar una futura migración:

- `/data/projects.js` — se reutiliza sin cambios en React, Vue o cualquier otro
- `/state/store.js`   — se adapta a useState/useReducer o Pinia directamente
- `/styles/tokens.css`— los custom properties son universales
- Los Web Components — se reescriben como componentes del framework elegido,
  manteniendo la misma interfaz de props/atributos
```
