# FWF multi-competition configurator — design & status

Goal: the host picks a competition from a dropdown and it runs virtually on its own.
This directory is the competition-agnostic core that makes that possible. It is
**new and isolated** — it does not yet touch the live app (see "Integration path").

## The model: Template → Instance

- **Template** (`templates.js`): static description of a competition — format, scoring
  rule, and which data source (if any) can score it autonomously. No real teams, no
  drawn fixtures. This is what the dropdown lists.
- **Instance** (created when the host runs an edition): a template + a filled roster
  (placeholder slot names replaced with real teams) + drawn fixtures + dates. One
  template can spawn many instances (e.g. a new Champions League instance each season).

Everything keys on **stable slot ids** (`A1`…`L4` for groups, `t01`…`t36` for the CL
league). Renaming a slot from `Apurado A1` to `Portugal` never touches prediction or
score data — this is what makes "placeholders now, real teams before opening" safe.

## Two format families

- `GROUPS_KO` — N groups of 4 → knockout. Covers every tournament here except the CL.
  Qualification = top-N per group + best-M third-placed (generic; reproduces WC 2026's
  "24 direct + 8 best thirds = 32").
- `LEAGUE_KO` — the Champions League 36-team single league phase → knockout. Standings
  are one big table; the top-8 / 9–24 / 25–36 **bands** drive qualification.

## Placeholder → real-team workflow (the question you raised)

Ship the template with placeholder slots. Before predictions open, the host fills the
roster. Two fill paths:
1. **Autonomous competitions (CL / Euro / WC):** after the draw, fetch
   `/competitions/{CODE}/teams` and `/matches` from football-data — this returns the
   real teams *with their ids* and the real fixtures, so the roster, the fixture list,
   and the team-id map are all bootstrapped from the API. No hand-mapping of 48 ids.
2. **Manual competitions:** the host types the roster in. (Or we add a second provider.)

Predictions are **fixture-independent** for both families — you predict team outcomes
(who tops the group / which band / how far they go), not the 144 individual CL matches
— so predictions can open as soon as the field is known, before fixtures are scheduled.

## Autonomy map (verified, not guessed)

football-data.org free tier = 12 competitions. Of yours, it covers **only** CL, Euro
(`EC`) and World Cup (`WC`). Those three run autonomously (delayed free scores are fine
— we score on full-time results). The other five (Asian Cup, AFCON, Gold Cup, Copa
América, Club WC) have **no free source** → they run in **manual mode** until a paid or
alternate provider (e.g. api-football) is wired. The template's `dataSource.provider`
says which, and the app surfaces it honestly (no fake "live" for manual competitions).

## What's BUILT and tested (this directory, 37/37)

- `templates.js` — all 8 competitions you listed + Champions League + WC 2026 (oracle).
  Honest flags: `formatStatus` (confirmed/provisional/tbd), `dataSource.verified`.
  Copa América 2028 is `tbd` (host+format unconfirmed) and the engine refuses to
  instance it until you confirm the structure.
- `engine.js` — slot generation, group standings, top-N + best-thirds qualification,
  CL league standings, CL bands. Pure and competition-agnostic.
- `test-engine.js` — includes the **WC 2026 regression oracle**: the engine reproduces
  the known 48/12/32 structure, so it's trustworthy before any real edition uses it.

## What's STAGED (needs the repo token to ship + a browser to test)

These are designed but not built, because they touch the live 17-module app and can't
be verified without pushing/running it:

1. **Host dropdown + instance creation UI** — pick template, name the edition, fill roster.
2. **API bootstrap importer** — the "Import teams & fixtures from football-data" button.
3. **Generalised prediction rendering** — group predictions vs CL band+reach predictions.
4. **Reach-based scoring generalisation** — extend the locked Option-B `calcBreakdown`
   so the CL league phase is the entry layer (bands) and knockout reach stacks on top.
5. **CL knockout bracket derivation** (playoff seeding: 9–24 two-legged, etc.).
6. **App migration** — the WC-hardcoded globals (`GROUPS`, `MATCH_SCHEDULE`, `FD_TEAM_ID`)
   read from the active instance, one module at a time, each step regression-tested
   against the WC oracle. Measure, don't reason: migrate → test → repeat.

## Priority order (real deadline first)

Champions League 2026/27 is the only near-term one (draw ~27 Aug, MD1 ~8–10 Sep). It's
also fully autonomous (`CL` verified) and its format is confirmed. So CL is both the
most urgent and the safest to build first. Euro 2028 and WC 2030 reuse the same
`GROUPS_KO` path the WC app already proves. The five manual competitions need a data
provider decision from you before they can be autonomous.
