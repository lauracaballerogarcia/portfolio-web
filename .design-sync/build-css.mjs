// build-css.mjs — flattens the shared stylesheet layers for design-sync.
//
// Follows src/styles/main.css's @import order (the ITCSS cascade) and
// concatenates every layer (tokens.css first) EXCEPT ../pages/* - page-
// specific layout, not part of the design system. Tokens ride in this file
// because cfg.tokensGlob only reads from a separate tokens npm package.
// @font-face blocks are stripped (fonts ship via cfg.extraFonts), and
// relative url()s to SVG icons are inlined as data URIs so they survive
// flattening. Output: .design-sync/.cache/ds.css (gitignored; cfg.cssEntry).
//
// It also writes .design-sync/.cache/fonts.css (cfg.extraFonts): the
// @font-face rules of src/styles/generic.css minus FONT_EXCLUDE. Sentient's
// licence (ITF Free Font License 2.0) does not allow distributing its files
// through design tools/SaaS, so it stays on the website only.
//
// Run from the repo root: node .design-sync/build-css.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const MAIN = resolve(ROOT, 'src/styles/main.css');
const OUT = resolve(ROOT, '.design-sync/.cache/ds.css');
const SKIP = [/\/pages\//];

const imports = [...readFileSync(MAIN, 'utf8').matchAll(/^@import\s+['"]([^'"]+)['"];/gm)]
  .map((m) => m[1])
  .filter((p) => !SKIP.some((re) => re.test(p)));

const parts = imports.map((rel) => {
  const file = resolve(dirname(MAIN), rel);
  let css = readFileSync(file, 'utf8').replace(/@font-face\s*\{[^}]*\}/g, '');
  css = css.replace(/url\(\s*['"]?([^'")]+\.svg)['"]?\s*\)/g, (_, u) => {
    const svg = readFileSync(resolve(dirname(file), u), 'utf8').trim();
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  });
  return `/* ── ${rel.replace(/^\.\.?\//, '')} ── */\n${css.trim()}\n`;
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, parts.join('\n'));
console.log(`ds.css: ${imports.length} layers → ${OUT.replace(ROOT + '/', '')}`);

const FONTS_SRC = resolve(ROOT, 'src/styles/generic.css');
const FONTS_OUT = resolve(ROOT, '.design-sync/.cache/fonts.css');
const FONT_EXCLUDE = ['Sentient'];

const faces = [...readFileSync(FONTS_SRC, 'utf8').matchAll(/@font-face\s*\{[^}]*\}/g)]
  .map(([rule]) => rule)
  .filter((rule) => !FONT_EXCLUDE.includes(rule.match(/font-family\s*:\s*['"]?([^;'"]+)/)[1].trim()))
  .map((rule) => rule.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g, (_, u) =>
    `url('${relative(dirname(FONTS_OUT), resolve(dirname(FONTS_SRC), u))}')`));
writeFileSync(FONTS_OUT, faces.join('\n\n') + '\n');
console.log(`fonts.css: ${faces.length} @font-face rules → ${FONTS_OUT.replace(ROOT + '/', '')} (excluded: ${FONT_EXCLUDE.join(', ')})`);

// ── Preview cards ───────────────────────────────────────────────
// Documentation cards for the Claude Design pane, generated from
// src/styles/tokens.css so names and values never drift. Plain HTML and CSS
// (no JS): the first line is the @dsCard marker, and each card links the
// bundle's styles.css from three directories deep. Claude Design registers
// any @dsCard .html (verified 2026-10-10 with a probe under cards/), and the
// official validator only walks components/, so cards live under cards/.
// Output: .design-sync/.cache/cards/<Name>.html; copy-cards.mjs places them
// in ds-bundle/cards/foundations/<Name>/ after each build.

const TOKENS_SRC = resolve(ROOT, 'src/styles/tokens.css');
const CARDS_OUT = resolve(ROOT, '.design-sync/.cache/cards');

const tokens = new Map([...readFileSync(TOKENS_SRC, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  .matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
const resolveValue = (v) => v.replace(/var\((--[\w-]+)\)/g, (m, n) => (tokens.has(n) ? resolveValue(tokens.get(n)) : m));
const named = (re) => [...tokens.keys()].filter((n) => re.test(n));
const isAlias = (n) => tokens.get(n).startsWith('var(');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const valueText = (n) => esc(isAlias(n) ? `${tokens.get(n)} → ${resolveValue(tokens.get(n))}` : tokens.get(n));

const SAMPLE = 'The quick brown fox jumps over the lazy dog 0123456789';
const CARD_CSS = `
  .dsc { display: grid; gap: var(--spacing-8); align-content: start; padding: var(--spacing-6); }
  .dsc h1 { margin: 0; font-size: var(--font-size-2xl); }
  .dsc-lead, .dsc-note, .dsc-value { color: var(--color-text-secondary); }
  .dsc-section { display: grid; gap: var(--spacing-4); }
  .dsc-section h2 { margin: 0; font-size: var(--font-size-m); font-weight: var(--font-weight-medium); }
  .dsc-list { display: grid; gap: var(--spacing-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); }
  .dsc-list--rows { grid-template-columns: minmax(0, 1fr); }
  .dsc-item { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--spacing-1); align-content: start; }
  .dsc-name, .dsc-value { font-family: var(--font-family-mono); font-size: var(--font-size-xs); overflow-wrap: anywhere; }
  .dsc-note { font-size: var(--font-size-xs); }
  .dsc-swatch { block-size: var(--spacing-16); border: 1px solid var(--color-outline-primary); border-radius: var(--radius-2); background: var(--token); }
  .dsc-bar { block-size: var(--spacing-4); inline-size: var(--token); max-inline-size: 100%; background: var(--color-background-inverse); }
  .dsc-shape { inline-size: var(--spacing-16); block-size: var(--spacing-16); border: 1px solid var(--color-outline-primary); border-radius: var(--token); background: var(--color-background-secondary); }
  .dsc-box { inline-size: var(--token); block-size: var(--token); border: 1px solid var(--color-outline-primary); background: var(--color-background-secondary); }
  .dsc-sample { overflow-wrap: anywhere; }
  .dsc-track { position: relative; block-size: var(--size-icon-s); border-radius: var(--radius-full); background: var(--color-background-secondary); }
  .dsc-dot { position: absolute; inset-block-start: 0; inset-inline-start: 0; inline-size: var(--size-icon-s); block-size: var(--size-icon-s);
    border-radius: var(--radius-full); background: var(--color-background-inverse);
    animation: dsc-slide var(--duration) var(--easing) 6 alternate both; }
  .dsc-track:hover .dsc-dot { animation-name: dsc-slide-replay; }
  @keyframes dsc-slide { to { inset-inline-start: calc(100% - var(--size-icon-s)); } }
  @keyframes dsc-slide-replay { to { inset-inline-start: calc(100% - var(--size-icon-s)); } }
  @media (prefers-reduced-motion: reduce) {
    .dsc-dot, .dsc-track:hover .dsc-dot { animation: none; }
  }`;

const item = (n, preview) => `
      <li class="dsc-item">
        ${preview}
        <code class="dsc-name">${n}</code>
        <span class="dsc-value">${valueText(n)}</span>
      </li>`;
const section = (title, items, modifier = '') => `
    <section class="dsc-section">
      <h2>${title}</h2>
      <ul class="dsc-list${modifier}" role="list">${items.join('')}
      </ul>
    </section>`;
const note = (text) => `
    <p class="dsc-note">${text}</p>`;
const card = (name, subtitle, body) => `<!-- @dsCard group="Foundations" name="${name}" subtitle="${esc(subtitle)}" -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name} — Portfolio design tokens</title>
  <link rel="stylesheet" href="../../../styles.css">
  <style>${CARD_CSS}
  </style>
</head>
<body>
  <main class="dsc">
    <header>
      <h1>${name}</h1>
      <p class="dsc-lead">${esc(subtitle)}</p>
    </header>${body}
  </main>
</body>
</html>
`;

const preview = (cls, n) => `<div class="${cls}" style="--token: var(${n})" aria-hidden="true"></div>`;
const swatch = (n) => item(n, preview('dsc-swatch', n));
const bar = (n) => item(n, preview('dsc-bar', n));
const shape = (n) => item(n, preview('dsc-shape', n));
const box = (n) => item(n, preview('dsc-box', n));
const sample = (n, prop, extra = '') => item(n, `<p class="dsc-sample" style="${prop}: var(${n})">${SAMPLE}</p>${extra}`);
const motion = (n, duration, easing) =>
  item(n, `<div class="dsc-track" style="--duration: var(${duration}); --easing: var(${easing})" aria-hidden="true"><div class="dsc-dot"></div></div>`);

const colors = named(/^--color-/);
const families = named(/^--font-family-/), sizes = named(/^--font-size-/), weights = named(/^--font-weight-/);
const spacing = named(/^--spacing-/), radius = named(/^--radius-/), size = named(/^--size-/);
const durations = named(/^--duration-/), easings = named(/^--easing-/);
const SERIF_NOTE = '<p class="dsc-note">Sentient is not distributed with this design system. Here the token falls back to Georgia.</p>';
const lastDuration = durations[durations.length - 1];

const cards = {
  Colors: card('Colors', `${colors.length} colour tokens`,
    section('Primitives', colors.filter((n) => !isAlias(n)).map(swatch)) +
    section('Semantic', colors.filter(isAlias).map(swatch))),
  Typography: card('Typography', `${families.length + sizes.length + weights.length} typography tokens`,
    section('Families', families.map((n) => sample(n, 'font-family', n.endsWith('-serif') ? SERIF_NOTE : '')), ' dsc-list--rows') +
    section('Sizes', sizes.map((n) => sample(n, 'font-size')), ' dsc-list--rows') +
    section('Weights', weights.map((n) => sample(n, 'font-weight')), ' dsc-list--rows')),
  Spacing: card('Spacing', `${spacing.length} spacing tokens`,
    section('Primitives', spacing.filter((n) => !isAlias(n)).map(bar), ' dsc-list--rows') +
    section('Semantic', spacing.filter(isAlias).map(bar), ' dsc-list--rows')),
  Radius: card('Radius', `${radius.length} radius tokens`,
    section('Primitives', radius.filter((n) => !isAlias(n)).map(shape)) +
    section('Semantic', radius.filter(isAlias).map(shape))),
  Size: card('Size', `${size.length} size tokens`,
    section('Icons and controls', size.filter((n) => /icon/.test(n)).map(box)) +
    section('Layout', size.filter((n) => !/icon/.test(n)).map(bar), ' dsc-list--rows') +
    note('Bars are capped at the card width; the value is the real token.')),
  Motion: card('Motion', `${durations.length + easings.length} motion tokens`,
    section('Durations', durations.map((n) => motion(n, n, easings[0])), ' dsc-list--rows') +
    section('Easing', easings.map((n) => motion(n, lastDuration, n)), ' dsc-list--rows') +
    note(`Each demo plays three times on load (durations with ${easings[0]}; easing over ${lastDuration}) and replays on hover. With reduced motion enabled, nothing moves.`)),
};

// Every token in tokens.css must appear (as its own entry) on some card.
const documented = new Set(Object.values(cards).flatMap((html) =>
  [...html.matchAll(/<code class="dsc-name">(--[\w-]+)<\/code>/g)].map((m) => m[1])));
const missing = [...tokens.keys()].filter((n) => !documented.has(n));
if (missing.length) {
  console.error(`cards: ${missing.length} token(s) from tokens.css not documented on any card: ${missing.join(', ')}`);
  process.exit(1);
}

mkdirSync(CARDS_OUT, { recursive: true });
for (const [name, html] of Object.entries(cards)) writeFileSync(resolve(CARDS_OUT, `${name}.html`), html);
console.log(`cards: ${Object.keys(cards).join(', ')} → ${CARDS_OUT.replace(ROOT + '/', '')} (${documented.size}/${tokens.size} tokens)`);
