# src/ — the source of index.html

**`index.html` is generated. Do not edit it by hand.**

```bash
node build.js          # rebuild index.html from src/
node build.js --check  # verify index.html matches src/ (exit 1 if not)
node tests.js          # runs --check first, then the suite
```

## Why a build instead of `<script src>`

The obvious way to split a 5,000-line file is real modules. On this project that is a trap.

The app is served from **GitHub Pages, which caches hard**. The only thing keeping players off stale code is the `FWF-BUILD` marker: the banner fetches `index.html`, compares the marker to the loaded `FWF_BUILD` constant, and prompts the user to update. Split the JS into separate files and **each file gets its own independent cache entry** — `index.html` can be fresh, report the new build, and still be running last week's JS. Silent, per-file, per-user. That is the same class of failure this project has already been bitten by twice (auto-apply cross-device overwrites; the scope/export caching issues that forced inline `onclick` IIFEs).

So: **the source is split, the deployed artifact is not.** `index.html` stays one self-contained file. Hosting, the cache banner, and the deploy are all unchanged.

When **#4 (Firebase Hosting)** lands, real modules become safe and `build.js` can be retired.

## The invariant

The split was made by *cutting* the existing `index.html` at its own `═══` section markers. The first build reproduced the committed file **byte-for-byte**. That is the entire verification story — not an argument about behaviour, just identical bytes or a failed build.

Keep it that way. If a change to `src/` is meant to change behaviour, the diff in `index.html` should be exactly that change and nothing else.

## The footgun this closes

Every session before the split edited `index.html` directly. The standing risk is that one still does and the next `node build.js` silently reverts it. So **`node tests.js` runs `build.js --check` first** and refuses to run if the two disagree.

## Layout

| File | Contents |
|---|---|
| `head.html` | `<head>` up to the Firebase module script |
| `firebase-init.js` | the `<script type="module">` Firebase init |
| `style.css` | everything inside `<style>` |
| `body.html` | `</head>`, `<body>`, the FWF-BUILD marker, all app markup |
| `app/*.js` | the main `<script>`, split at its section markers |
| `tail.html` | `</body></html>` |

`app/_order.json` fixes the concatenation order. **The order is load-bearing** — this is one script scope, not modules, so the files share top-level `const`/`let` bindings and hoisting. Reordering will break things that a syntax check will not catch.

| Module | Contents |
|---|---|
| `00-boot-i18n` | anti-cache banner, translations, flag helper |
| `01-tournament-data` | groups, schedule, `ANNEX_C` third-place table |
| `02-standings` | `groupStandings` / `getQualified32` / `getBestThirds` |
| `03-state` | global state, helpers, API usage counter |
| `04-auth-comp` | auth, competition load, `mutateMember`, init |
| `05-predictions` | countdown, group matches, grupos tab, bracket |
| `06-scoring` | **`calcBreakdown` / `bdTotal` / `calcTotal` — single source of truth** |
| `07-profile-modal` | player profile (#7), info modal, adjustment badges |
| `08-daily-snapshot` | daily snapshot persistence (#1) |
| `09-leaderboard` | leaderboard render, search / find-me |
| `10-commentary` | daily commentary, roll call |
| `11-share-csv` | share image, backup CSV export |
| `12-podium-history` | wall of fame, final podium |
| `13-host-panel` | points toggles, host panel, manual adjustments |
| `14-submit` | prediction submission |
| `15-live-api` | live scores, `autoApplyScores` (**dead — never re-enable**) |
| `16-ui-bootstrap` | tabs, bootstrap, install hint, pull-to-refresh |

## Bumping the build

Two places must match, both in `src/`:

- `body.html` — `<!-- FWF-BUILD:YYYYMMDDx -->`
- `app/00-boot-i18n.js` — `const FWF_BUILD='YYYYMMDDx'`

`build.js` refuses to build if they disagree.
