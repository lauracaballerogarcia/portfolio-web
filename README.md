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
    site-nav/         # Navegación principal (Web Component + CSS)
    site-footer/      # Pie de página (Web Component + CSS)
    skip-link/        # Enlace de salto al contenido
    button/           # .button-primary (filtros)
    icon-button/      # Botón circular con icono
    chip/             # Etiqueta flotante de las tarjetas
  data/
    projects.json     # Fuente de datos de proyectos
    projects.js       # Capa de datos — funciones puras, sin DOM
    content/*.md      # Case studies
  state/
    store.js          # Estado observable mínimo (Home)
  styles/
    main.css          # Único punto de entrada de estilos (orden ITCSS)
    tokens.css        # Design tokens (ver TOKENS.md)
    generic.css       # @font-face, reset, movimiento reducido
    elements.css      # Estilos base de etiquetas HTML
    objects.css       # .container, .container-full
    utilities.css     # .visually-hidden
  pages/
    index.html        # Documento único (SPA)
    main.js           # Router — importa main.css
    index.js/.css     # Home
    archive/ about/ project/   # Plantilla, lógica y estilos de cada página
```

## Estilos

- Todo el CSS entra por `src/styles/main.css`. El orden de los `@import` es el orden de la cascada (ITCSS): settings → generic → elements → objects → components → utilities. Para añadir una hoja nueva, impórtala ahí, en su capa; no la importes desde JS.
- Clases con BEM (`bloque__elemento--modificador`). Los selectores de etiqueta solo se usan en la base (`elements.css`) y dentro del contenido Markdown de los case studies (`.project-body`, `.cs-grid`), que no lleva clases.
- JavaScript localiza el marcado escrito a mano (plantillas HTML, Markdown) por `id` o atributos `data-*`; en los componentes que él mismo genera usa sus clases BEM. Los estados se comunican con atributos (`aria-pressed`, `aria-current`, `data-visible`, `data-state`) que el CSS lee.

## Imágenes y vídeos

```
media-src/<proyecto>/     # Originales WebP y SVG (no se publican)
public/media/<proyecto>/  # Lo que se publica en /media/<proyecto>/ — estructura plana
```

- WebP y SVG (también posters): se guardan en `media-src/<proyecto>/` y se ejecuta `npm run media`.
- MP4: directamente en `public/media/<proyecto>/`.
- Los archivos listados en `media-manifest.json` son generados: no se editan a mano.
- `npm run media:check` comprueba referencias, manifiesto y rutas sin modificar nada.
- Las referencias son explícitas y absolutas (`/media/…`) en `src/data/projects.json` (`hero`, `heroMobile` opcional, `thumbnail`) y en el Markdown:

```md
![alt](/media/p/video.mp4 "full 1440x900 poster=/media/p/video-poster.webp")
```

## Añadir un proyecto

Edita `src/data/projects.json` y añade un objeto con esta forma (el case study, si lo hay, va en `src/data/content/<slug>.md` y se registra en `src/data/projects.js`):

```json
{
  "id": "04",
  "slug": "nombre-del-proyecto",
  "title": "Título del proyecto",
  "summary": "Descripción breve.",
  "tags": ["Accesibilidad"],
  "year": "2025",
  "hero": "/media/nombre-del-proyecto/nombre-del-proyecto-01-hero.webp",
  "thumbnail": "/media/nombre-del-proyecto/nombre-del-proyecto-00-thumbnail.webp",
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
