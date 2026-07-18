// Tests for the competition engine. Pure, no network. Run: node competitions/test-engine.js
const { TEMPLATES } = require('./templates.js');
const E = require('./engine.js');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) pass++; else { fail++; console.error('  ✗ ' + name); } }
function eq(name, a, b) { ok(name + ` (got ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b)); }
const tpl = id => TEMPLATES.find(t => t.id === id);

// ── Slot generation: every template produces the right number of team slots ──────
const expectedSlots = {
  'world-cup-2026': 48, 'world-cup-2030': 48, 'euro-2028': 24, 'asian-cup-2027': 24,
  'afcon-2027': 24, 'gold-cup-2027': 16, 'copa-america-2028': 16, 'club-wc-2029': 32,
  'champions-league': 36,
};
for (const [id, n] of Object.entries(expectedSlots)) {
  const slots = E.generateSlots(tpl(id));
  eq(`${id}: ${n} slots`, slots.length, n);
  ok(`${id}: slot ids unique`, new Set(slots.map(s => s.id)).size === slots.length);
}

// ── 'tbd' templates refuse to instance ──────────────────────────────────────────
ok('copa-america-2028 refuses (tbd)', (() => { try { E.assertInstanceable(tpl('copa-america-2028')); return false; } catch { return true; } })());
ok('euro-2028 instanceable', E.assertInstanceable(tpl('euro-2028')));

// ── Group standings + best-thirds qualification on a small synthetic tournament ──
// Build a 2-group / 4-team GROUPS_KO with perGroup:1 + bestThirds:1 and hand-known scores.
const mini = { formatType: 'GROUPS_KO', formatStatus: 'confirmed',
  format: { groups: 2, teamsPerGroup: 4, advance: { perGroup: 1, bestThirds: 1 }, knockout: ['SF','FINAL'] } };
const miniSlots = E.generateSlots(mini); // A1..A4, B1..B4
// A: A1 beats everyone; A3 collects enough to be a strong third. Round-robin subset.
const scores = {
  'A1_A2': { home: 3, away: 0 }, 'A1_A3': { home: 1, away: 0 }, 'A1_A4': { home: 2, away: 0 },
  'A3_A2': { home: 2, away: 0 }, 'A3_A4': { home: 2, away: 0 }, 'A2_A4': { home: 1, away: 1 },
  'B1_B2': { home: 1, away: 0 }, 'B1_B3': { home: 0, away: 0 }, 'B1_B4': { home: 1, away: 1 },
  'B2_B3': { home: 0, away: 0 }, 'B2_B4': { home: 0, away: 0 }, 'B3_B4': { home: 0, away: 0 },
};
const st = E.groupStandings(mini, miniSlots, scores);
eq('group A winner is A1', st.A[0].id, 'A1');
eq('group A runner-up is A3', st.A[1].id, 'A3');
eq('group A third-placed is A4', st.A[2].id, 'A4');
const q = E.qualifyGroups(mini, st);
eq('direct winners are the two group leaders', q.direct.sort(), ['A1', 'B1']);
eq('best third is A3 (strongest third across groups)', q.bestThirds, ['A3']);
ok('exactly 3 qualify (2 direct + 1 third)', q.qualified.length === 3);

// ── Champions League: league standings + bands ──────────────────────────────────
const cl = tpl('champions-league');
const clSlots = E.generateSlots(cl); // t01..t36
// Give t01 the most points, descending, so the final order is deterministic:
// each team i plays one match beating a lower-ranked team => wins = 36-i.
const results = [];
for (let i = 1; i <= 36; i++)
  for (let j = i + 1; j <= 36; j++)
    results.push({ home: 't' + String(i).padStart(2,'0'), away: 't' + String(j).padStart(2,'0'), homeGoals: 1, awayGoals: 0 });
const table = E.leagueStandings(cl, clSlots, results);
eq('CL leader is t01', table[0].id, 't01');
eq('CL table has 36 rows', table.length, 36);
const bands = E.leagueBands(cl, table);
eq('CL direct band = top 8', bands.direct.length, 8);
eq('CL playoff band = 16 teams (9-24)', bands.playoff.length, 16);
eq('CL out band = bottom 12 (25-36)', bands.out.length, 12);
eq('CL top seed t01 is in direct band', bands.direct[0], 't01');

// ── WC 2026 regression oracle: engine reproduces the known structure ─────────────
const wc = tpl('world-cup-2026');
const wcSlots = E.generateSlots(wc);
eq('WC2026: 12 groups x 4 = 48 slots', wcSlots.length, 48);
eq('WC2026: group labels A..L', [...new Set(wcSlots.map(s => s.group))].join(''), 'ABCDEFGHIJKL');
// 24 direct (2 per group) + 8 best thirds = 32 qualifiers — the known WC 2026 count.
const wcEmptyStandings = E.groupStandings(wc, wcSlots, {});
const wcQ = E.qualifyGroups(wc, wcEmptyStandings);
eq('WC2026: 24 direct qualifiers', wcQ.direct.length, 24);
eq('WC2026: 8 best-third qualifiers', wcQ.bestThirds.length, 8);
eq('WC2026: 32 total qualifiers to R32', wcQ.qualified.length, 32);

console.log(`\nengine: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
