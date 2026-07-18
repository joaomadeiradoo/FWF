# FWF — Confirmed Changes & Locked Decisions

**Current build:** `20260717o` · **Tests:** 89 passing, 2 deliberate skips · **Last updated:** 18 Jul 2026

This file is the record of what shipped and *why*, and the decisions that must not be silently revisited. Where this file and the code disagree, **the code wins** — clone and read it.

---

## THE STACK (verify, don't trust)

- Single-file `index.html`, **generated** from 17 source modules under `src/` by `build.js`. **Never hand-edit `index.html`** — `tests.js` runs `build.js --check` first and refuses if it was.
- Firebase Firestore + Anonymous Auth, project `fwf1-3b522`, doc `competitions/{currentCompId}`.
- Hosted on GitHub Pages at `joaomadeiradoo.github.io/FWF`.
- Live results: a **GitHub Action** (`.github/workflows/results.yml`) fetches football-data.org server-side every 10 min and commits `data/live.json`; the app reads that file from its own origin. Token is in repo secret `FD_TOKEN`.
- Build/test: `node build.js`, `node build.js --check`, `node tests.js`. Bump the build in TWO places (`src/body.html` FWF-BUILD comment + `src/app/00-boot-i18n.js` FWF_BUILD const); `build.js` refuses if they disagree. **Only bump when runtime behaviour changed** — a bump pushes an "update available" banner to 64 people.
- Clone fresh each session; `git config user.email/name` resets on every clone.

---

## LOCKED DECISIONS — DO NOT UNDO

1. **Option B scoring**, hardcoded as `P` in `calcBreakdown()`: `{gw:5,gs:5,r32:5,r16:5,qf:10,sf:15,fin:15,f3:15,champ:30,vice:20,top:20}`. Layers **stack** (group winner reaching QF = 5+5+5+10 = 25). `calcTotal(uid)=bdTotal(calcBreakdown(uid))`. **Single source of truth — never add a parallel scoring path.** Group 1st/2nd are derived from `groupStandings()`, never from stored `gw_`/`gs_` (which have zero readers).

2. **`autoApplyScores()` is PERMANENTLY DISABLED** (defined, never called — see the commented line in `15-live-api.js` `fetchAll`). It whole-object-wrote `actualScores` and clobbered manual entries cross-device. **Do not re-enable without first converting it to field-path writes inside `runTransaction`.** Changing the data source (done this session) does NOT fix the write.

3. **Never migrate Firebase anon UIDs.** Anon Auth gives a new uid per device; the anon uid **authenticates only**; app identity = the uid the player already owns (name+PIN). Migrating ping-pongs the key and orphans data.

4. **No whole-object writes to shared Firestore maps.** Use field paths + `runTransaction` (both on `window._fb`). `members`/`predictions`/`adjustments` are all done via `mutateMember()`. ⚠️ **`saveActualScores` / `saveKOResults` still do whole-object writes** (§ open items E1) — same bug class, narrower radius (explicit button press). Left because they were the buttons João needed during the final. Ten-minute fix after the final.

5. **Art. 13 head-to-head tiebreak: DO NOT RE-FIX.** `groupStandings()` sorts `Pts→GD→GF→GA→alphabetical`. This is wrong vs the regulations, was implemented, shipped, and **reverted** (`66e849e`) because agreement with João's sheet got worse (43/64 → 42/64). Known, deliberate, leave it. It's a configurator-era rules question.

6. **`HIDE_LEADERBOARD=true`** (`09-leaderboard.js`). The table is hidden to the 63 non-admins on purpose — official classification is published externally from João's Excel. **Hosts/admins see a live preview** (added this session) with a "Pré-visualização (hosts)" banner, so João can verify scoring without publishing. Do not unhide for everyone without João saying so — gated on the §9 reconciliation.

7. **Roasts (#2) are data-driven, not personalised.** 258 PT templates roasting predictions and public league record — never the person. Rule: **no fact, no joke** (every fact returns null when unknown). `ROAST_MODE='chars'` reverts to the old character bank.

8. **The results API is football-data.org, not api-football.** MEASURED from the live-site console 17 Jul: api-football (CORS ok, but free plan is 2022-2024 only, no 2026); football-data.org (has 2026, but `Access-Control-Allow-Origin` hardcoded to `http://localhost` — browsers blocked). Neither works direct from a browser → the GitHub Action middleman is the architecture. Both WC and CL 2026/27 are confirmed in the free tier.

---

## WHAT SHIPPED THIS SESSION (build g → o)

**#6 results pipeline (the big one).** GitHub Action → `data/live.json` → app. Team identity is by **numeric team id** (`FD_TEAM_ID`, 48 PT names → football-data ids), NOT by name (names drift: API says "Turkey", app says "Türkiye"). Stage vocabulary `FD_STAGE` (GROUP_STAGE/LAST_32/.../FINAL — not api-football's wording). **The shootout trap:** for `PENALTY_SHOOTOUT`, `score.fullTime` = regularTime+extraTime+penalties, NOT the real score. `fdMatchScore()` returns the true 120' score and **refuses (returns null) rather than guessing** if the arithmetic stops holding. Verified on all 4 real shootouts.

**#6 polling opened up.** `scheduleApi()` used to gate `fetchAll` behind six api-football budget rules — including `if(!isAdmin) return`, which meant 63 of 64 never fetched. All six removed; now fetches on login + every 60s. Removed `window.API_FOOTBALL_KEY` from `firebase-init.js` (dead credential on a public page). The old per-day counter (`getApiUsage`/`bumpApi`/`canApi`) is gone; the host-panel widget now shows live-file freshness ("Atualizado há N min").

**F1 clock — CLOSED.** `utcDate` now flows from the feed; the app shows kick-off times for the first time. Upcoming fixtures show the date when not today (`fdKickoffLabel`, Lisbon calendar days).

**RECENTES shows real latest results incl. knockouts.** Was built only from `ALL_MATCHES` (72 group games — KO rounds were never in this tournament's fixtures), so it froze on the last group game. Now prefers the live feed's finished matches (with round labels + shootout notes), falls back to `actualScores` if the feed isn't loaded.

**Anti-copy gate extended.** Tapping a player showed their Champion/Vice/3rd/Top-scorer picks to anyone — the profile modal and #21 head-to-head never inherited the "submit yours first" rule. Extracted the rule to one place (`canSeeOthersPreds()` = reveal-time passed AND own-submission) used by all three paths. Own profile always visible; admins exempt (audit).

**#21 head-to-head.** Two players side by side, ◄ marks who leads each row. Pure view over `profileStats`; no new scoring.

**Name prettifier (display only).** ALL-CAPS / all-lower names shown title-cased; mixed-case (McGinn, van Dijk, João do Ó) left byte-for-byte. Never near a comparator — login/matching keys unchanged.

**Admin powers.** Co-hosts (`role:'admin'`) get housekeeping (paid/unpaid toggles, R32 audit, commentary regen) — most of the host panel was already `isAdmin`. **Kept host-only:** `toggleAdmin` (promote/demote — the lever that decides who holds power), the join code/invites, and PIN display.

**Action hygiene.** checkout/setup-node v4→v5 (Node 20 deprecation).

---

## THE ANTI-DRIFT LESSONS (this is the most useful section)

- **Measure, don't reason.** Every wrong conclusion this project has shipped came from building on an inherited claim instead of checking. This session alone: the handover said "no team-name map exists / autoApplyScores could never match" — false, a 56-key map existed and the finding measured dead code (`matchTeams`). It said "the tournament is over" — the final was 2 days out. **Check before you build.**
- **You cannot read Firestore.** You have the code, never the live data. Never state a player's total or what the app renders at runtime. Ask for a screenshot/CSV or say you don't know.
- **A signature that fits is not proof.** A hypothesis once explained every property of a 21-player discrepancy and was still wrong (reverted `66e849e`). State the prediction a fix makes; prefer a test that can *disprove* it.
- **Anchor edits on exact bytes.** `str_replace` caught a from-memory retype this session. Read the real bytes first.
- **Your own tests are suspect too.** When a test fails, check the test's premise before "fixing" the code.
- **Substring/fuzzy name matching is dangerous here.** `fuzzyScore('João Luís Mota','Luís Mota')=0.85` > the 0.82 merge threshold — but they are BROTHERS. Also João do Ó / Nuno do Ó, and Luís Vargas Mota (third distinct Mota). `historyFor()` uses exact normalised match only, guarded by a test.
- **Date arithmetic bites.** `year+month+day` is not a day counter (jumps backwards at month boundaries). Check any date maths.
