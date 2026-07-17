#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   FWF — results fetcher (roadmap #6)

   WHY THIS EXISTS
   ---------------
   Measured 17 Jul 2026, both from the browser console on the live site:

     api-football       CORS ✅   2026 data ❌  ("Free plans do not have access
                                                  to this season, try 2022-2024")
     football-data.org  CORS ❌   2026 data ✅  (Access-Control-Allow-Origin is
                                                  hardcoded to http://localhost)

   Neither works alone from a browser. This script is the middleman: it runs on
   GitHub Actions (a server — no CORS, and the token stays in repo secrets),
   fetches football-data.org, and writes data/live.json into the repo. The app
   then reads that file from its OWN origin, so nothing blocks it and no key
   ships to the client.

   DELIBERATELY DUMB
   -----------------
   This does not interpret anything. It trims fields and writes them out.
   All parsing — the stage vocabulary, the PENALTY_SHOOTOUT fullTime trap, the
   team-id map — lives in src/app/15-live-api.js where it is unit-tested. Two
   copies of that logic would drift, and the shootout trap is exactly the kind
   of thing that would drift silently.

   Run: FD_TOKEN=xxx node scripts/fetch-results.js
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.FD_TOKEN;
const URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const OUT = path.join(__dirname, '..', 'data', 'live.json');

if (!TOKEN) {
  console.error('FD_TOKEN not set. Add it under Settings > Secrets and variables > Actions.');
  process.exit(1);
}

(async () => {
  const res = await fetch(URL, { headers: { 'X-Auth-Token': TOKEN } });

  // Surface the throttle headers Daniel's email asked us to watch. On a 10/min
  // free tier a schedule that quietly drifts into a 429 would look identical to
  // "no new results", so log them every run rather than discover it later.
  const avail = res.headers.get('X-Requests-Available-Minute');
  const reset = res.headers.get('X-RequestCounter-Reset');
  console.log(`HTTP ${res.status} | requests available this minute: ${avail ?? '?'} | counter resets in: ${reset ?? '?'}s`);

  if (res.status === 429) { console.error('Rate limited. Leaving the previous file untouched.'); process.exit(1); }
  if (!res.ok) { console.error(`Upstream ${res.status}. Leaving the previous file untouched.`); process.exit(1); }

  const d = await res.json();
  if (!Array.isArray(d.matches)) { console.error('No matches array — refusing to overwrite with junk.'); process.exit(1); }

  // Trim: the full payload is ~100KB, this is ~23KB. It gets committed every
  // run, so size is a real cost. Keep only what the app reads.
  const out = {
    fetchedAt: new Date().toISOString(),
    season: d.matches[0]?.season?.id ?? null,
    matches: d.matches.map(m => ({
      id: m.id,
      utcDate: m.utcDate,
      status: m.status,
      stage: m.stage,
      group: m.group,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      score: m.score,
    })),
  };

  // Sanity gate. A 200 with a truncated body would otherwise blank the ticker
  // for everyone. 104 is the WC 2026 fixture count; refuse anything less.
  if (out.matches.length < 104) {
    console.error(`Only ${out.matches.length} matches (expected 104). Refusing to overwrite.`);
    process.exit(1);
  }

  const live = out.matches.filter(m => m.status !== 'FINISHED' && m.status !== 'TIMED' && m.status !== 'SCHEDULED');
  if (live.length) console.log('LIVE-ISH STATUS SEEN:', JSON.stringify(live.map(m => ({ status: m.status, t: m.homeTeam.name + ' v ' + m.awayTeam.name }))));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`wrote ${OUT} — ${out.matches.length} matches, ${out.matches.filter(m => m.status === 'FINISHED').length} finished, ${JSON.stringify(out).length} bytes`);
})().catch(e => { console.error('fetch failed:', e.message); process.exit(1); });
