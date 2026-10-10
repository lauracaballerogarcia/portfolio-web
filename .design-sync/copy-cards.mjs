// copy-cards.mjs — places the generated preview cards in the bundle.
//
// package-build.mjs wipes ds-bundle/ on every build, so run this after
// resync.mjs. It copies .design-sync/.cache/cards/<Name>.html (written by
// build-css.mjs) to ds-bundle/cards/foundations/<Name>/<Name>.html: one card
// per directory, three levels deep so `../../../styles.css` resolves.
// Each card is checked the way package-validate.mjs checks converter cards:
// an @dsCard first line and <link href>s that resolve.
//
// Run from the repo root: node .design-sync/copy-cards.mjs

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = process.cwd();
const SRC = resolve(ROOT, '.design-sync/.cache/cards');
const BUNDLE = resolve(ROOT, 'ds-bundle');
const OUT = join(BUNDLE, 'cards', 'foundations');

function fail(message) {
  console.error(`copy-cards: ${message}`);
  process.exit(1);
}

if (!existsSync(join(BUNDLE, '_ds_bundle.js'))) fail('ds-bundle/ has no _ds_bundle.js — run resync.mjs first');
const names = existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)) : [];
if (!names.length) fail('no cards in .design-sync/.cache/cards — run build-css.mjs first');

rmSync(join(BUNDLE, 'cards'), { recursive: true, force: true });
for (const name of names) {
  const dest = join(OUT, name, `${name}.html`);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(SRC, `${name}.html`), dest);
  const html = readFileSync(dest, 'utf8');
  if (!/^<!--\s*@dsCard\s+group="[^"]*"[^>]*-->/.test(html.split('\n', 1)[0])) fail(`${name}: first line isn't an @dsCard comment`);
  for (const [, href] of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g)) {
    if (!existsSync(resolve(dirname(dest), href))) fail(`${name}: <link href="${href}"> doesn't resolve`);
  }
}
console.log(`cards: ${names.length} → ds-bundle/cards/foundations/ (${names.join(', ')})`);
