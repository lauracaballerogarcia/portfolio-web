# design-sync notes: portfolio-web

## What this sync is

- **Styles only.** The site is native HTML/CSS/JS with Custom Elements; it has no React components.
- **Empty entry.** `.design-sync/entry.js` (`cfg.entry`) is an empty module, so the converter finds 0 components and ships only:
  - tokens and shared CSS, in `_ds_bundle.css`;
  - fonts (Geist and Geist Mono; Sentient is excluded, see "Fonts" below), in `fonts/`;
  - the README.
- **Agent guidance.** `conventions.md` (`cfg.readmeHeader`) is prepended to the generated README. Its "Precedence" block overrides the React boilerplate in the generated body. No config option replaces that body.

## Auxiliary tooling (not part of the website)

- **`.ds-sync/`** (gitignored) holds the converter scripts and their own dependencies: esbuild, ts-morph, @types/react, react@18.3.1, react-dom@18.3.1 and playwright.
  - React exists only because the converter copies it into `_vendor/`.
  - Playwright exists only to run the render check.
  - None of these are in the site's `package.json`.
- **To recreate `.ds-sync/`** (`<skill-base-dir>` is the design-sync skill folder):

      mkdir -p .ds-sync && cp -r <skill-base-dir>/{package-build.mjs,package-validate.mjs,package-capture.mjs,resync.mjs,lib,storybook} .ds-sync/
      echo '{"name":"ds-sync-deps","private":true}' > .ds-sync/package.json
      (cd .ds-sync && npm i esbuild ts-morph @types/react react@18.3.1 react-dom@18.3.1)
      (cd .ds-sync && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright)

- **Browser.** No Playwright browser is installed. Validation uses the system Google Chrome, located through `DS_CHROMIUM_PATH`.
- **node_modules.** Always pass `--node-modules ./.ds-sync/node_modules`, because the repo's own `node_modules` has no React.

## Regenerate and validate (from the repo root)

    node .design-sync/build-css.mjs
    DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
      node .ds-sync/resync.mjs --config .design-sync/config.json \
      --node-modules ./.ds-sync/node_modules --out ./ds-bundle
    node .design-sync/copy-cards.mjs

- **First command:** `build-css.mjs` is `cfg.buildCmd`. It writes `.design-sync/.cache/ds.css`, `fonts.css` and the six preview cards in `.cache/cards/`. It fails if any token in `tokens.css` is not documented on a card.
- **Last command:** `copy-cards.mjs` must run after every `resync.mjs`, because the build wipes `ds-bundle/`. It copies the cards to `ds-bundle/cards/foundations/<Name>/<Name>.html` and checks their `@dsCard` line and stylesheet links.
- **Re-syncs:** add `--remote .design-sync/.cache/remote-sync.json` (the project's `_ds_sync.json`).
- **Verdict:** printed on screen and saved to `ds-bundle/.resync-verdict.json`. It must be `"ok": true`.
- **Expected bundle contents:**
  - `fonts/`: 4 `.woff2` files (Geist and Geist Mono, normal and italic) and `fonts.css`;
  - 73 tokens defined;
  - `readmeHeader: stitching …`;
  - `cards/foundations/`: Colors, Typography, Spacing, Radius, Size and Motion (72/72 tokens).

## Expected warnings (not problems)

- `[ZERO_MATCH] no component exports — treating as tokens-only DS`: by design.
- `[DTS_REACT] @types/react not found…`: irrelevant with 0 components.
- `capture skipped — no capturable changed or added components` and `render check: 0/0`: there are no preview cards.
- `[FONT_MISSING] "Sentient" (--font-family-serif)`: expected, because Sentient is excluded on purpose and designs fall back to Georgia. The Claude Design pane may show a missing-font notice for the same reason.
- Known render warns: none.

## Known issues

- **Tokens:** `cfg.tokensGlob` only reads from a separate tokens npm package. `build-css.mjs` therefore folds `src/styles/tokens.css` into `ds.css`, so there is no `tokens/` folder.
- **Flattened CSS:** `cfg.cssEntry` is copied verbatim, so `build-css.mjs` does three things:
  - flattens `main.css`'s `@import`s, skipping `../pages/*`;
  - strips `@font-face` rules, because the fonts come from `cfg.extraFonts`;
  - inlines `.svg` `url()`s as data URIs.

  It does not follow nested `@import`s or inline non-SVG assets.
- **`npm ci` failures (2026-10-10):** `npm ci` failed twice with `ENOTEMPTY` while removing `node_modules`. It succeeded after `rm -rf node_modules` followed by `npm ci`. The cause was not determined.
- **Blocked install scripts:** npm blocks install scripts for some native dependencies (for example sharp and Parcel's watcher). The sync does not need them.

- **Preview cards (verified 2026-10-10).** Claude Design registers any `.html` whose first line is `<!-- @dsCard group="…" name="…" subtitle="…" -->`, under `cards/` as well as `components/`; a probe of each was listed in `_ds_manifest.json` `cards`. The cards live under `cards/` because the official validator only walks `components/` and fails with `count mismatch` when it finds previews but 0 components. The sync anchor (`_ds_sync.json`) and the diff do not track the cards: list their paths explicitly in every upload plan, and delete a removed card by hand.

## Pending before uploading

- **Fonts.** Sentient (ITF Free Font License 2.0) may not be distributed through design tools or SaaS, so `build-css.mjs` writes `.design-sync/.cache/fonts.css` (`cfg.extraFonts`) from `generic.css` minus `FONT_EXCLUDE`. The website keeps Sentient unchanged. Before each upload, check that `ds-bundle/fonts/` has no Sentient file. Geist and Geist Mono embed SIL OFL 1.1 metadata.
- **Remote project.** `10bb168b-3403-49fa-968d-36d021d71489` was empty on 2026-10-10. Confirm with `list_files` and, if it is still empty, use `deletes: []`.

## Re-sync risks

- **CSS layer list:** `build-css.mjs` mirrors `main.css`'s `@import` list. A nested `@import`, or a non-SVG `url()`, in shared CSS would break silently.
- **Unused React copy:** `_vendor/react.js` (about 1.2 MB, development build) ships because the tool requires it, but nothing uses it.
- **No visual check:** the styles have never been checked visually in Claude Design. Review the project after the first upload.
