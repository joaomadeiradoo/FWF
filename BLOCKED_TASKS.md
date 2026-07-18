# FWF — Blocked / Open Tasks

**As of:** 18 July 2026 · build `20260717o`

What is not done, and exactly what unblocks each. Ordered by *what someone has to do*. Several items from the previous version of this file **closed this session** and are marked ✅ so they aren't re-attempted.

---

## ✅ CLOSED THIS SESSION (do not re-open)

- **B1 — verify the results API.** DONE. Measured from the live console: both WC and CL 2026/27 are in football-data.org's free tier. api-football free is 2022-2024 only. See CONFIRMED_CHANGES §8.
- **F1 — kick-off clock / live pulse.** DONE. `utcDate` flows from the feed; the app shows times, upcoming dates, and a live dot. Was blocked on "no kick-off times in the file" — the feed provides them.
- **#6 — results pipeline.** DONE (read path). Action → `data/live.json` → app. The **write** path (`autoApplyScores`) is still deliberately dead — see E1/§2.

---

## A. Needs one answer/action from João

### A1. 🔴 THE §9 GATE — highest-value open item
**Blocks:** unhiding the leaderboard for everyone, trusting the test suite's scope, closing the historical 21-player discrepancy.

At `20260716c` the app and João's Excel disagreed on **21 of 64**. Diagnosed: `downloadCSV` exported a *frozen* `gw_`/`gs_` snapshot (written once on first submit) while `calcBreakdown` derives live — so the sheet scored each player's **first draft**. Fixed in `3f04036`.

> **Ask João: did you re-download the Backup CSV on build ≥ `20260716f` and rebuild the sheet? Does it reconcile now?**

- **Reconciles** → theory confirmed; then ask whether to unhide the leaderboard.
- **Residual** → next suspect is `Apurados R32` (the CSV has no best-thirds/qualified-32 column, so the sheet can't be reading the same 32 `getQualified32()` computes). **Get the CSV. Do not guess. Do not re-run the head-to-head theory (§5, reverted).**

### A2. Revoke the GitHub PAT
A personal access token with **write** access is in plain text in old handover docs. It is NOT in the repo or any commit (verified), but the doc travels. João: revoke at `github.com/settings/tokens`, reissue, pass the new one out-of-band. Only João can do this.

### A3. #2 custom roasts — needs João's content
Personalised jokes about 64 named real people. Templates already work as fallback. Not Claude's to invent. `playerChars` is the hook.

---

## B. Needs João to physically do something

### B1. #4 — Firebase Hosting + custom domain
Needs Firebase console + a domain purchase. **Unblocks:** #5 (PWA/service worker — currently refused on GitHub Pages because a bad cached build is unrecoverable-by-user for 64 people), retiring `build.js` for real modules, and the whole GH-Pages-caching workaround culture (the FWF-BUILD banner).

### B2. Firestore security rules — 2-device test
The rules have **never been read**. Every stable-identity and transaction fix assumes any authed user can write the competition doc. Evidence is strong (writes work) but it's an inference. Needs a 2-device test only João can run.

---

## C. Executable by Claude, but timing-gated

### E1. `saveActualScores` / `saveKOResults` whole-object writes
Same bug class as the `kickUser` fix (CONFIRMED_CHANGES §4). Narrower radius (explicit button press). **Deliberately not done during the tournament** — `saveKOResults` is the button that enters the final result, and breaking it at the final is the worst timing. **After the final is entered:** convert to field-path writes via `runTransaction` (the `mutateMember` pattern). Ten minutes, closes the bug class. Ask João to confirm the final is safely recorded first.

---

## D. Chained behind #26 (the configurator) — the keystone for 2027-2030

Both its old gates (#23 tests, #24 file split) are ✅ done. #26 is a foundational refactor with real design decisions and **deserves its own session with João in the loop** — a rushed solo build is worse than none.

| # | Item | Note |
|---|---|---|
| 26 | Competition configurator | Must express a **36-team single table with no groups** (CL), not just groups+KO. |
| 8 | Wall of Fame | Ships with #26. |
| 28 | Competition selector | Cuttable while one competition is live. |
| 29 | **Champions League** | ⚠️ NOT just config: 36 clubs, one table, 8 opponents each, top-8 bye, 9-24 play-off. Different structure AND a different prediction model. |
| 30 | Format packs (Copa Ásia, CAN, Copa Ouro, Club WC) | Mostly config once #26 exists. |
| 11 | Sub-leagues | Re-rate after #26. |

**Open design question (not on the roadmap):** what do people predict in a league phase? The WC model (group winner/2nd/reach) has nothing to map onto. Leading option: predict the final table (top 8 / 9-24 cut / bottom 12), one submission at the draw, then reuse the KO bracket in February.

**Dated:** CL draw **27 Aug 2026**, MD1 **8-10 Sep 2026**. ~12-day submission window. Only urgent if CL stops being "a side thing".

---

## E. Lower priority / on request

- #3 admin dashboard v2 — needs a spec (name the 3 things that annoy João about the host panel).
- #13 animations — taste call, show João first.
- #12/#22 PDF export + share prediction — Low value; not asked.
- #10 chat/reactions — unscoped moderation surface; needs decisions.
- #25 real accounts — deliberately deferred.
- `actualScores` whole-object writes elsewhere — same class as E1, audit when E1 is done.
- Possibly-orphaned `playerChars`/`approvedTopScorers` from past uid migrations — unrecoverable without direct data access.
