#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   FWF — build  (roadmap #24, "split the file")

   Usage:
     node build.js           rebuild index.html from src/
     node build.js --check   verify index.html matches src/ (exit 1 if not)

   WHY A BUILD AND NOT <script src>
   --------------------------------
   The obvious way to split a 5,000-line index.html is real modules loaded with
   <script src>. On this project that is a trap. The app is served from GitHub
   Pages, which caches aggressively, and the ONLY thing keeping 64 players off
   stale code is the FWF-BUILD marker inside index.html: the banner fetches
   index.html, compares the marker to the loaded FWF_BUILD, and prompts. Split
   the JS into separate files and each one gets its own independent cache entry
   — index.html can be fresh, report the new build, and still be running last
   week's JS. That is a silent, per-file, per-user failure and it is exactly the
   class of bug this project has been bitten by twice already (§6.2, §11).

   So: the SOURCE is split, the DEPLOYED ARTIFACT is not. index.html stays one
   self-contained file, byte-for-byte what it was. Nothing about hosting, the
   cache banner, or the deploy changes. When #4 (Firebase Hosting) lands, real
   modules become safe and this script can be retired.

   THE INVARIANT
   -------------
   This split was made by CUTTING the existing index.html at its own ═══ section
   markers, so the first build reproduces the committed file byte-for-byte. That
   is the whole verification story: no behaviour argument, no reasoning about
   what might have changed — the bytes are identical or the build fails.

   THE FOOTGUN THIS CLOSES
   -----------------------
   The real risk of a source split is drift: a future session edits index.html
   directly (as every session before this one did), the next build silently
   reverts it. So `node tests.js` runs `--check` first and fails loudly if
   index.html and src/ disagree. Edit src/, run node build.js. Never edit
   index.html by hand.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'index.html');

function read(p) { return fs.readFileSync(path.join(SRC, p), 'utf8'); }
function stripTrailingNewline(s) { return s.endsWith('\n') ? s.slice(0, -1) : s; }

function build() {
  const order = JSON.parse(read('app/_order.json'));
  const app = order
    .map(name => stripTrailingNewline(read(path.join('app', name + '.js'))))
    .join('\n');

  return [
    stripTrailingNewline(read('head.html')),
    '<script type="module">',
    stripTrailingNewline(read('firebase-init.js')),
    '</script>',
    '<style>',
    stripTrailingNewline(read('style.css')),
    '</style>',
    stripTrailingNewline(read('body.html')),
    '<script>',
    app,
    '</script>',
    read('tail.html'),
  ].join('\n');
}

function buildVersionOf(html) {
  const a = html.match(/<!--\s*FWF-BUILD:([0-9A-Za-z.\-]+)\s*-->/);
  const b = html.match(/const FWF_BUILD\s*=\s*'([0-9A-Za-z.\-]+)'/);
  return { marker: a && a[1], constant: b && b[1] };
}

const out = build();

// The two build markers must agree, or the anti-cache banner either never fires
// or fires forever. Cheap to check here, miserable to debug in the field.
const v = buildVersionOf(out);
if (!v.marker || !v.constant) {
  console.error('BUILD FAIL: FWF-BUILD marker or FWF_BUILD constant missing');
  process.exit(1);
}
if (v.marker !== v.constant) {
  console.error(`BUILD FAIL: build markers disagree — comment says ${v.marker}, constant says ${v.constant}`);
  process.exit(1);
}

if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== out) {
    console.error('DRIFT: index.html does not match src/. Someone edited index.html by hand.');
    console.error('       Edit src/ and run `node build.js`. Never edit index.html directly.');
    process.exit(1);
  }
  console.log(`build check OK — index.html matches src/ (build ${v.marker})`);
  process.exit(0);
}

fs.writeFileSync(OUT, out);
console.log(`built index.html from src/ (build ${v.marker}, ${out.split('\n').length} lines)`);
