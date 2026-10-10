#!/usr/bin/env node
/**
 * Media pipeline: media-src/<project>/  →  public/media/<project>/
 *
 *   npm run media          optimise new or changed sources, write media-manifest.json
 *   npm run media:check    read-only: verify references, manifest, outputs and paths
 *
 * What it handles
 *   .webp  re-encoded with sharp (quality/width per role, see media.config.json).
 *          Published only if ≥ minSaving smaller and visually within maxMeanError;
 *          otherwise the source is copied byte for byte.
 *   .svg   optimised with SVGO (conservative settings) unless it embeds raster
 *          images (data:image/…), which are copied untouched. The optimised file
 *          is published only if structure and a pixel comparison match the source.
 *   other  (mp4, archived sources) are left in media-src and never published.
 *
 * Files that live directly in public/media and are not in the manifest are
 * manual files (MP4, posters, GIF, JPG). The script never overwrites or removes
 * them. It never writes into media-src.
 *
 * Options
 *   --check        read-only verification, exit code 1 on errors
 *   --root <dir>   project root (default: current directory)
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { optimize, VERSION as SVGO_VERSION } from 'svgo';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const rootArg = args.indexOf('--root');
const ROOT = path.resolve(rootArg >= 0 ? args[rootArg + 1] : process.cwd());

const config = JSON.parse(await fs.readFile(path.join(ROOT, 'media.config.json'), 'utf8'));
const SRC_DIR = path.join(ROOT, config.sourceDir);
const OUT_DIR = path.join(ROOT, config.outputDir);
const PUBLIC_DIR = path.dirname(OUT_DIR); // /media/… is served from public/media/…
const MANIFEST_PATH = path.join(ROOT, config.manifest);

const TOOLS = { sharp: sharp.versions.sharp, libwebp: sharp.versions.webp, librsvg: sharp.versions.rsvg, svgo: SVGO_VERSION };

/* SVGO: preset-default minus every plugin that can drop ids, hidden or
   "default" content, metadata or merge paths. High numeric precision. */
const SVGO_CONFIG = {
  multipass: true,
  floatPrecision: 6,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          removeUnknownsAndDefaults: false,
          removeHiddenElems: false,
          removeDesc: false,
          removeMetadata: false,
          mergePaths: false,
          convertTransform: { transformPrecision: 8 },
        },
      },
    },
  ],
};

/* ---------- helpers ---------- */

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const stableJson = (value) => JSON.stringify(sortKeys(value), null, 2) + '\n';
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function assertInside(dir, target) {
  const r = path.relative(dir, target);
  if (r.startsWith('..') || path.isAbsolute(r)) throw new Error(`Refusing to touch ${target}: outside ${dir}`);
}

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}

async function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return { files: {} };
  return JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
}

function roleOf(name) {
  if (/-hero-mobile\.[a-z0-9]+$/i.test(name)) return 'heroMobile';
  if (/-hero\.[a-z0-9]+$/i.test(name)) return 'hero';
  if (/-thumbnail\.[a-z0-9]+$/i.test(name)) return 'thumbnail';
  return 'content';
}

function settingsFor(srcRel) {
  const ext = path.extname(srcRel).toLowerCase();
  const project = srcRel.split('/')[1];
  if (ext === '.webp') {
    const role = roleOf(srcRel);
    const w = config.webp;
    return {
      kind: 'webp',
      role,
      quality: w.qualityByProject?.[project] ?? w.quality,
      effort: w.effort,
      maxWidth: w.maxWidth[role] ?? null,
      maxMeanError: w.maxMeanError,
      metric: 'premultiplied-rgba',
      minSaving: config.minSaving,
      tools: { sharp: TOOLS.sharp, libwebp: TOOLS.libwebp },
    };
  }
  if (ext === '.svg') {
    return { kind: 'svg', svgo: SVGO_CONFIG, compare: config.svg, metric: 'premultiplied-rgba', minSaving: config.minSaving, tools: { sharp: TOOLS.sharp, librsvg: TOOLS.librsvg, svgo: TOOLS.svgo } };
  }
  return null;
}

/* ---------- image comparison ---------- */

async function rawRGBA(input, { width, height, density }) {
  return sharp(input, density ? { density } : {})
    .resize({ width, height, fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

function diff(a, b, tolerance = 0) {
  if (a.length !== b.length) return { mean: Infinity, differing: 1 };
  let sum = 0, differing = 0;
  // Colour is compared premultiplied by alpha: fully transparent pixels can hold
  // any RGB value without changing what is drawn, so they must not count as error.
  for (let i = 0; i < a.length; i += 4) {
    const aa = a[i + 3], ba = b[i + 3];
    let over = false;
    for (let c = 0; c < 4; c++) {
      const d = c === 3 ? Math.abs(aa - ba) : Math.abs((a[i + c] * aa - b[i + c] * ba) / 255);
      sum += d;
      if (d > tolerance) over = true;
    }
    if (over) differing++;
  }
  return { mean: sum / a.length, differing: differing / (a.length / 4) };
}

/* ---------- processors: return { buffer, action, reason } ---------- */

async function processWebp(srcBuf, s) {
  const meta = await sharp(srcBuf).metadata();
  const resize = s.maxWidth && meta.width > s.maxWidth;
  let pipeline = sharp(srcBuf);
  if (resize) pipeline = pipeline.resize({ width: s.maxWidth, withoutEnlargement: true });
  const out = await pipeline.webp({ quality: s.quality, effort: s.effort }).toBuffer();

  const saving = 1 - out.length / srcBuf.length;
  if (saving < s.minSaving) return { buffer: srcBuf, action: 'copied', reason: `saving ${(saving * 100).toFixed(1)}% < ${s.minSaving * 100}%` };

  // Compare against the source scaled to the same size, so only encoding loss is measured.
  const outMeta = await sharp(out).metadata();
  const a = await rawRGBA(srcBuf, { width: outMeta.width, height: outMeta.height });
  const b = await rawRGBA(out, { width: outMeta.width, height: outMeta.height });
  const { mean } = diff(a.data, b.data);
  if (mean > s.maxMeanError) return { buffer: srcBuf, action: 'copied', reason: `mean error ${mean.toFixed(2)} > ${s.maxMeanError}` };

  const note = resize ? `resized ${meta.width}→${s.maxWidth}px, ` : '';
  return { buffer: out, action: 'optimized', reason: `${note}q${s.quality}, saving ${(saving * 100).toFixed(1)}%, mean error ${mean.toFixed(2)}` };
}

const SVG_COUNTED = ['mask', 'filter', 'linearGradient', 'radialGradient', 'clipPath', 'pattern', 'text', 'tspan', 'title', 'image', 'symbol', 'use'];

function svgFacts(svg) {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const attr = (n) => root.match(new RegExp(`\\s${n}="([^"]*)"`))?.[1]?.trim().split(/[\s,]+/).map(Number).join(' ') ?? null;
  const counts = Object.fromEntries(SVG_COUNTED.map((t) => [t, (svg.match(new RegExp(`<${t}[\\s>/]`, 'g')) ?? []).length]));
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const refs = new Set([...svg.matchAll(/url\(\s*['"]?#([^'")\s]+)/g), ...svg.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]));
  return { viewBox: attr('viewBox'), width: attr('width'), height: attr('height'), counts, ids, refs };
}

async function processSvg(srcBuf, s) {
  const src = srcBuf.toString('utf8');
  if (/data:image\//i.test(src)) return { buffer: srcBuf, action: 'copied', reason: 'embeds raster image (data:image/), excluded from SVGO' };

  const out = optimize(src, s.svgo).data;
  const outBuf = Buffer.from(out, 'utf8');
  const saving = 1 - outBuf.length / srcBuf.length;
  if (saving < s.minSaving) return { buffer: srcBuf, action: 'copied', reason: `saving ${(saving * 100).toFixed(1)}% < ${s.minSaving * 100}%` };

  const before = svgFacts(src), after = svgFacts(out);
  for (const k of ['viewBox', 'width', 'height']) {
    if (before[k] !== after[k]) return { buffer: srcBuf, action: 'copied', reason: `structure check failed: ${k} changed` };
  }
  for (const t of SVG_COUNTED) {
    // SVGO may legitimately inline single-use <use>; every other element type must survive.
    if (t === 'use') continue;
    if (before.counts[t] !== after.counts[t]) return { buffer: srcBuf, action: 'copied', reason: `structure check failed: <${t}> ${before.counts[t]}→${after.counts[t]}` };
  }
  const dangling = [...after.refs].filter((id) => !after.ids.has(id));
  if (dangling.length) return { buffer: srcBuf, action: 'copied', reason: `structure check failed: missing ids ${dangling.join(', ')}` };

  const { renderWidth, pixelTolerance, maxDifferentPixels, maxMeanError } = s.compare;
  const vbWidth = Number((before.viewBox ?? before.width ?? '').split(' ')[2] ?? before.width) || renderWidth;
  const density = Math.min(2400, Math.max(1, (72 * renderWidth) / vbWidth));
  const a = await rawRGBA(srcBuf, { width: renderWidth, density });
  const b = await rawRGBA(outBuf, { width: renderWidth, height: a.info.height, density });
  const { mean, differing } = diff(a.data, b.data, pixelTolerance);
  if (mean > maxMeanError || differing > maxDifferentPixels) {
    return { buffer: srcBuf, action: 'copied', reason: `render check failed: mean ${mean.toFixed(3)}, differing ${(differing * 100).toFixed(3)}%` };
  }
  return { buffer: outBuf, action: 'optimized', reason: `SVGO ${TOOLS.svgo}, saving ${(saving * 100).toFixed(1)}%, render mean ${mean.toFixed(3)}, differing ${(differing * 100).toFixed(3)}%` };
}

/* ---------- content references ---------- */

async function collectRefs() {
  const refs = []; // { ref, where }
  for (const entry of config.content) {
    const full = path.join(ROOT, entry);
    const files = (await fs.stat(full)).isDirectory() ? await walk(full) : [full];
    for (const file of files) {
      const text = await fs.readFile(file, 'utf8');
      const where = rel(file);
      if (file.endsWith('.json')) {
        const data = JSON.parse(text);
        for (const p of Array.isArray(data) ? data : Object.values(data)) {
          for (const key of ['hero', 'heroMobile', 'thumbnail']) {
            if (typeof p?.[key] === 'string' && p[key]) refs.push({ ref: p[key], where: `${where} (${p.slug ?? '?'}.${key})` });
          }
        }
      } else if (file.endsWith('.md')) {
        for (const m of text.matchAll(/!\[[^\]]*\]\(\s*(\S+)(?:\s+"([^"]*)")?\s*\)/g)) {
          refs.push({ ref: m[1], where });
          for (const p of (m[2] ?? '').matchAll(/(?:^|\s)poster=(\S+)/g)) refs.push({ ref: p[1], where: `${where} (poster)` });
        }
        for (const m of text.matchAll(/\s(?:src|poster|data-poster)="([^"]+)"/g)) refs.push({ ref: m[1], where });
      }
    }
  }
  return refs;
}

/* ---------- check (read-only) ---------- */

async function check() {
  const errors = [], warnings = [];
  if (!existsSync(SRC_DIR)) errors.push(`${config.sourceDir}/ not found at the project root: sources can't be verified`);
  const manifest = await readManifest();
  const prefix = config.publicPrefix.replace(/\/$/, '') + '/';

  // 1. Content references
  const refs = await collectRefs();
  const referenced = new Set();
  for (const { ref, where } of refs) {
    if (/^(https?:)?\/\//.test(ref)) continue;
    const clean = ref.replace(/[#?].*$/, '');
    if (!clean.startsWith(prefix)) { errors.push(`${where}: "${ref}" does not start with ${prefix}`); continue; }
    const file = path.join(PUBLIC_DIR, clean);
    referenced.add(path.relative(OUT_DIR, file).split(path.sep).join('/'));
    if (!existsSync(file)) errors.push(`${where}: "${ref}" → ${rel(file)} does not exist`);
  }

  // 2. Manifest outputs and sources
  for (const [outRel, e] of Object.entries(manifest.files)) {
    const out = path.join(OUT_DIR, outRel), src = path.join(ROOT, e.source);
    if (!existsSync(out)) errors.push(`manifest: output ${rel(out)} is missing (run npm run media)`);
    else if (sha256(await fs.readFile(out)) !== e.outputHash) errors.push(`manifest: ${rel(out)} was modified by hand (generated file)`);
    if (!existsSync(src)) errors.push(`manifest: source ${e.source} was removed (run npm run media to clean up)`);
    else {
      if (sha256(await fs.readFile(src)) !== e.sourceHash) errors.push(`stale: ${e.source} changed since last run (run npm run media)`);
      const s = settingsFor(e.source);
      if (s && sha256(stableJson(s)) !== e.settingsHash) errors.push(`stale: settings/tools changed for ${e.source} (run npm run media)`);
    }
  }

  // 3. Sources not yet processed
  const bySource = new Set(Object.values(manifest.files).map((e) => e.source));
  for (const src of await walk(SRC_DIR)) {
    const r = rel(src);
    if (!settingsFor(r)) continue;
    if (!bySource.has(r)) errors.push(`pending: ${r} has not been processed (run npm run media)`);
  }

  // 4. Files in public/media that nobody references
  for (const out of await walk(OUT_DIR)) {
    const r = path.relative(OUT_DIR, out).split(path.sep).join('/');
    if (!referenced.has(r)) warnings.push(`unreferenced: ${rel(out)}${manifest.files[r] ? ' (generated)' : ' (manual)'}`);
  }

  warnings.forEach((w) => console.log(`warn  ${w}`));
  errors.forEach((e) => console.log(`ERROR ${e}`));
  console.log(`\nmedia:check — ${refs.length} references, ${Object.keys(manifest.files).length} generated files, ${errors.length} errors, ${warnings.length} warnings`);
  process.exitCode = errors.length ? 1 : 0;
}

/* ---------- run ---------- */

async function saveManifest(files) {
  const next = stableJson({ files });
  const current = existsSync(MANIFEST_PATH) ? await fs.readFile(MANIFEST_PATH, 'utf8') : null;
  if (next === current) return false;
  await fs.writeFile(MANIFEST_PATH, next);
  return true;
}

async function run() {
  const rSrc = path.relative(SRC_DIR, OUT_DIR), rOut = path.relative(OUT_DIR, SRC_DIR);
  if (!rSrc.startsWith('..') || !rOut.startsWith('..')) throw new Error('sourceDir and outputDir must not contain each other');

  if (!existsSync(SRC_DIR)) {
    throw new Error(`${config.sourceDir}/ not found at the project root (${ROOT}). Nothing was written.`);
  }
  const manifest = await readManifest();
  const files = { ...manifest.files };
  const stats = { optimized: 0, copied: 0, unchanged: 0, skipped: 0, removed: 0, bytesIn: 0, bytesOut: 0 };
  const sources = await walk(SRC_DIR);
  const liveSources = new Set();

  // Pass 1: plan everything and stop before writing if any output would
  // overwrite a manual or hand-edited file.
  const jobs = [], conflicts = [];
  for (const src of sources) {
    const srcRel = rel(src);
    const s = settingsFor(srcRel);
    if (!s) { console.log(`skip      ${srcRel} (not published: kept as source only)`); stats.skipped++; continue; }
    liveSources.add(srcRel);

    const outRel = path.relative(SRC_DIR, src).split(path.sep).join('/');
    const out = path.join(OUT_DIR, outRel);
    assertInside(OUT_DIR, out);

    const srcBuf = await fs.readFile(src);
    const sourceHash = sha256(srcBuf);
    const settingsHash = sha256(stableJson(s));
    const prev = files[outRel];
    const outBuf = existsSync(out) ? await fs.readFile(out) : null;
    const outHash = outBuf && sha256(outBuf);

    if (outBuf && !prev) { conflicts.push(`${rel(out)} exists but was not generated by this script (manual file)`); continue; }
    if (outBuf && prev.outputHash !== outHash) { conflicts.push(`${rel(out)} was modified by hand`); continue; }

    if (prev && outBuf && prev.sourceHash === sourceHash && prev.settingsHash === settingsHash) {
      stats.unchanged++; stats.bytesIn += prev.bytesIn; stats.bytesOut += prev.bytesOut;
      continue;
    }
    jobs.push({ s, srcRel, srcBuf, sourceHash, settingsHash, outRel, out });
  }
  if (conflicts.length) {
    throw new Error(`Nothing was written. Resolve first (rename the source, or move/restore the file):\n  - ${conflicts.join('\n  - ')}`);
  }

  let wrote = false;

  // Pass 2: process. The manifest is saved even if a file fails halfway,
  // so every output already written stays recorded as generated.
  try {
    for (const { s, srcRel, srcBuf, sourceHash, settingsHash, outRel, out } of jobs) {
      const result = s.kind === 'webp' ? await processWebp(srcBuf, s) : await processSvg(srcBuf, s);
      await fs.mkdir(path.dirname(out), { recursive: true });
      const tmp = `${out}.tmp-${process.pid}`;
      await fs.writeFile(tmp, result.buffer);
      await fs.rename(tmp, out);

      files[outRel] = {
        action: result.action,
        bytesIn: srcBuf.length,
        bytesOut: result.buffer.length,
        outputHash: sha256(result.buffer),
        reason: result.reason,
        settingsHash,
        source: srcRel,
        sourceHash,
      };
      stats[result.action]++; stats.bytesIn += srcBuf.length; stats.bytesOut += result.buffer.length;
      console.log(`${result.action.padEnd(10)}${srcRel}  ${kb(srcBuf.length)} → ${kb(result.buffer.length)}  (${result.reason})`);
    }
  } finally {
    wrote = await saveManifest(files);
  }

  // Remove generated outputs whose source is gone (only if untouched since generation).
  for (const [outRel, e] of Object.entries(files)) {
    if (liveSources.has(e.source) && existsSync(path.join(ROOT, e.source))) continue;
    const out = path.join(OUT_DIR, outRel);
    assertInside(OUT_DIR, out);
    if (existsSync(out)) {
      if (sha256(await fs.readFile(out)) !== e.outputHash) { console.log(`keep      ${rel(out)} (source gone but file was edited by hand)`); continue; }
      await fs.unlink(out);
    }
    delete files[outRel];
    stats.removed++;
    console.log(`removed   ${rel(out)} (source ${e.source} no longer exists)`);
  }

  const changed = (await saveManifest(files)) || wrote;

  console.log(`\nmedia — optimized ${stats.optimized}, copied ${stats.copied}, unchanged ${stats.unchanged}, removed ${stats.removed}, skipped ${stats.skipped}`);
  console.log(`        generated set: ${kb(stats.bytesIn)} → ${kb(stats.bytesOut)}${changed ? '' : ' (manifest unchanged)'}`);
}

try {
  await (CHECK ? check() : run());
} catch (err) {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
}
