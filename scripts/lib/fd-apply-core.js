// Pure logic for server-side score application. No I/O, no Firestore, no network
// — everything here is unit-tested in scripts/test-apply.js. The runner
// (scripts/apply-scores.js) supplies live matches + fixtures + current scores and
// writes the result via the Admin SDK.
//
// SCOPE: group stage only, on purpose. Knockout advancement depends on
// bracket-slot logic that must be ported and watched on a live match before it
// can write to a 64-player competition. That is TODO, not done here.

// Ported verbatim from src/app/15-live-api.js. A drift test in test-apply.js
// re-extracts this from source and fails if the two ever diverge.
const FD_TEAM_ID = {
  "México":769, "África do Sul":774, "Coreia do Sul":772, "Czechia":798,
  "Canadá":828, "Bósnia e Herzegovina":1060, "Qatar":8030, "Suíça":788,
  "Brasil":764, "Marrocos":815, "Haiti":836, "Escócia":8873,
  "EUA":771, "Paraguai":761, "Austrália":779, "Türkiye":803,
  "Alemanha":759, "Curaçao":9460, "Costa do Marfim":1935, "Equador":791,
  "Países Baixos":8601, "Japão":766, "Suécia":792, "Tunísia":802,
  "Bélgica":805, "Egipto":825, "Irão":840, "Nova Zelândia":783,
  "Espanha":760, "Cabo Verde":1930, "Arábia Saudita":801, "Uruguai":758,
  "França":773, "Senegal":804, "Noruega":8872, "Iraque":8062,
  "Argentina":762, "Argélia":778, "Áustria":816, "Jordânia":8049,
  "Portugal":765, "Congo DR":1934, "Uzbequistão":8070, "Colômbia":818,
  "Inglaterra":770, "Croácia":799, "Gana":763, "Panamá":1836,
};
const FD_ID_TO_PT = Object.fromEntries(Object.entries(FD_TEAM_ID).map(([pt, id]) => [id, pt]));

// Ported verbatim from src/app/15-live-api.js. Returns the true 120-minute score,
// refusing (null) rather than guessing when a shootout payload is misshapen.
function fdMatchScore(m) {
  const s = m && m.score;
  if (!s || !s.fullTime) return null;
  if (s.fullTime.home == null || s.fullTime.away == null) return null;
  const add = (k, side) => (s[k] ? (s[k][side] ?? 0) : 0);
  if (s.duration === 'PENALTY_SHOOTOUT') {
    const home = add('regularTime', 'home') + add('extraTime', 'home');
    const away = add('regularTime', 'away') + add('extraTime', 'away');
    if (home + add('penalties', 'home') !== s.fullTime.home || away + add('penalties', 'away') !== s.fullTime.away) {
      return null; // refuse to guess
    }
    return { home, away, pens: { home: add('penalties', 'home'), away: add('penalties', 'away') }, winner: s.winner || null };
  }
  return { home: s.fullTime.home, away: s.fullTime.away, pens: null, winner: s.winner || null };
}

// Build an unordered team-pair -> fixture id index from fixtures.json.
function buildPairIndex(fixtures) {
  const idx = {};
  for (const f of fixtures) {
    const hi = FD_TEAM_ID[f.home], ai = FD_TEAM_ID[f.away];
    if (hi == null || ai == null) continue; // unmapped team name — skip, never guess
    idx[pairKey(hi, ai)] = { id: f.id, home: f.home, away: f.away };
  }
  return idx;
}
function pairKey(a, b) { return a < b ? `${a}_${b}` : `${b}_${a}`; }

// Derive the set of group-stage actualScores updates from live matches.
// Returns { updates: { <matchId>: {home,away,source:'api'} }, skipped: [...] }.
// Honours the failsafe: never overwrites a score whose source is 'manual'.
function deriveGroupUpdates(liveMatches, fixtures, existingActualScores) {
  const idx = buildPairIndex(fixtures);
  const existing = existingActualScores || {};
  const updates = {};
  const skipped = [];

  for (const m of liveMatches) {
    if (m.stage !== 'GROUP_STAGE') continue;          // group stage only
    if (m.status !== 'FINISHED') continue;             // only completed matches
    const hi = m.homeTeam && m.homeTeam.id;
    const ai = m.awayTeam && m.awayTeam.id;
    const fx = hi != null && ai != null ? idx[pairKey(hi, ai)] : null;
    if (!fx) { skipped.push({ reason: 'no-fixture', m: label(m) }); continue; }

    const sc = fdMatchScore(m);
    if (!sc) { skipped.push({ reason: 'score-refused', m: label(m) }); continue; }

    // Orient the score to the fixture's home/away, not the API's.
    const fxHomeId = FD_TEAM_ID[fx.home];
    const oriented = (hi === fxHomeId)
      ? { home: sc.home, away: sc.away }
      : { home: sc.away, away: sc.home };

    const prev = existing[fx.id];
    if (prev && prev.source === 'manual') { skipped.push({ reason: 'manual-locked', m: label(m), id: fx.id }); continue; }
    // No-op if identical to what's already stored (avoids needless writes).
    if (prev && prev.home === oriented.home && prev.away === oriented.away && prev.source === 'api') continue;

    updates[fx.id] = { home: oriented.home, away: oriented.away, source: 'api' };
  }
  return { updates, skipped };
}

function label(m) {
  const h = (m.homeTeam && (m.homeTeam.name)) || (m.homeTeam && FD_ID_TO_PT[m.homeTeam.id]) || '?';
  const a = (m.awayTeam && (m.awayTeam.name)) || (m.awayTeam && FD_ID_TO_PT[m.awayTeam.id]) || '?';
  return `${h} v ${a}`;
}

module.exports = { FD_TEAM_ID, FD_ID_TO_PT, fdMatchScore, buildPairIndex, pairKey, deriveGroupUpdates };
