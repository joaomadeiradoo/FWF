// COMPETITION ENGINE — pure, config-driven. No DOM, no network, no Firestore.
// Everything here is unit-tested in test-engine.js and is competition-agnostic:
// it reads a template's `format` and produces slots, standings, qualification and
// CL bands. This is the reusable core the WC-hardcoded app functions will migrate
// onto (see README.md "Integration path").

// ── Slot generation ─────────────────────────────────────────────────────────────
// Stable slot ids that predictions/actualScores key on. Renaming a slot's display
// name (placeholder -> real team) never changes the id, so prediction data is safe.
function generateSlots(template) {
  const f = template.format;
  if (template.formatType === 'GROUPS_KO') {
    const slots = [];
    const letters = 'ABCDEFGHIJKL'.slice(0, f.groups).split('');
    for (const g of letters)
      for (let i = 1; i <= f.teamsPerGroup; i++)
        slots.push({ id: `${g}${i}`, group: g, name: `Apurado ${g}${i}` });
    return slots;
  }
  if (template.formatType === 'LEAGUE_KO') {
    const slots = [];
    for (let i = 1; i <= f.leagueSize; i++) {
      const id = 't' + String(i).padStart(2, '0');
      slots.push({ id, name: `Equipa ${i}` });
    }
    return slots;
  }
  throw new Error('unknown formatType ' + template.formatType);
}

// Refuse to instance an unconfirmed competition — never silently run a guessed format.
function assertInstanceable(template) {
  if (template.formatStatus === 'tbd')
    throw new Error(`${template.id}: format is 'tbd' — confirm structure before instancing`);
  return true;
}

// ── Group standings ─────────────────────────────────────────────────────────────
// scores: { "<homeSlot>_<awaySlot>": {home, away}, ... } keyed by slot pair.
// Returns, per group, teams sorted by pts, then GD, then GF (tiebreakers are a
// documented default; head-to-head is intentionally NOT applied — matches the
// locked WC decision to keep tiebreaks simple/stable).
function groupStandings(template, slots, scores) {
  const rows = {};
  for (const s of slots) if (s.group) rows[s.id] = { id: s.id, group: s.group, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  for (const [key, sc] of Object.entries(scores || {})) {
    if (!sc || sc.home == null || sc.away == null) continue;
    const [h, a] = key.split('_');
    if (!rows[h] || !rows[a] || rows[h].group !== rows[a].group) continue; // group matches only
    apply(rows[h], sc.home, sc.away);
    apply(rows[a], sc.away, sc.home);
  }
  const byGroup = {};
  for (const r of Object.values(rows)) (byGroup[r.group] ||= []).push(r);
  for (const g of Object.keys(byGroup)) byGroup[g].sort(cmpTable);
  return byGroup;
}
function apply(row, gf, ga) {
  row.P++; row.GF += gf; row.GA += ga; row.GD = row.GF - row.GA;
  if (gf > ga) { row.W++; row.Pts += 3; } else if (gf === ga) { row.D++; row.Pts += 1; } else row.L++;
}
function cmpTable(a, b) { return b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.id.localeCompare(b.id); }

// ── Group qualification: top-N per group + best-N third-placed ──────────────────
// Returns ordered slot ids that advance. Best-thirds ranked across groups by the
// same table comparator. Mirrors the WC 2026 "best 8 thirds" logic generically.
function qualifyGroups(template, byGroup) {
  const adv = template.format.advance;
  const direct = [], thirds = [];
  for (const g of Object.keys(byGroup).sort()) {
    const table = byGroup[g];
    table.forEach((row, idx) => {
      if (idx < adv.perGroup) direct.push(row);
      else if (idx === adv.perGroup && adv.bestThirds > 0) thirds.push(row);
    });
  }
  thirds.sort(cmpTable);
  const qualifiedThirds = thirds.slice(0, adv.bestThirds);
  return { direct: direct.map(r => r.id), bestThirds: qualifiedThirds.map(r => r.id),
           qualified: [...direct, ...qualifiedThirds].map(r => r.id) };
}

// ── League (Champions League) standings & bands ─────────────────────────────────
// results: array of { home, away, homeGoals, awayGoals } by slot id.
function leagueStandings(template, slots, results) {
  const pts = template.format.points;
  const rows = {};
  for (const s of slots) rows[s.id] = { id: s.id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  for (const m of results || []) {
    if (!rows[m.home] || !rows[m.away] || m.homeGoals == null || m.awayGoals == null) continue;
    leagueApply(rows[m.home], m.homeGoals, m.awayGoals, pts);
    leagueApply(rows[m.away], m.awayGoals, m.homeGoals, pts);
  }
  return Object.values(rows).sort(cmpTable);
}
function leagueApply(row, gf, ga, pts) {
  row.P++; row.GF += gf; row.GA += ga; row.GD = row.GF - row.GA;
  if (gf > ga) { row.W++; row.Pts += pts.win; } else if (gf === ga) { row.D++; row.Pts += pts.draw; } else { row.L++; row.Pts += pts.loss; }
}
// Map a sorted league table to bands (direct/playoff/out) per the template config.
function leagueBands(template, sortedTable) {
  const out = {};
  template.format.bands.forEach(b => { out[b.id] = []; });
  sortedTable.forEach((row, idx) => {
    const pos = idx + 1;
    const band = template.format.bands.find(b => pos >= b.range[0] && pos <= b.range[1]);
    if (band) out[band.id].push(row.id);
  });
  return out;
}

module.exports = {
  generateSlots, assertInstanceable,
  groupStandings, qualifyGroups, cmpTable,
  leagueStandings, leagueBands,
};
