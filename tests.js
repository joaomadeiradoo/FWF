#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   FWF — automated tests  (roadmap #23)

   Run:  node tests.js          (from the repo root; no dependencies)

   WHAT THIS IS
   ------------
   index.html is one 4,900-line file with an inline, non-module <script>. There
   is no build step and nothing is exported. So this harness does the only thing
   that works without restructuring the app: it reads index.html, pulls out the
   app's <script> body, and runs it inside a Node vm context with a stubbed DOM.
   Every top-level function and constant is then reachable on the sandbox.
   Nothing in index.html is modified to make this work.

   WHAT THIS IS *NOT*
   ------------------
   These are CHARACTERISATION tests, not a proof of correctness. They pin down
   current behaviour so a refactor (#24 file split, #26 configurator) that
   changes scoring fails loudly instead of silently. A green run means "you did
   not change what it does" — NOT "what it does is right".

   That distinction matters here specifically, because as of build 20260717b the
   app and João's external sheet disagreed on 21 of 64 players and the fix
   (commit 3f04036) is UNCONFIRMED. Writing tests that assert every current
   total is correct would freeze a possible bug into a green suite. So the rule
   for this file is:

     Assert only what is established INDEPENDENTLY of the code under test —
     the regulations, arithmetic, or something João confirmed from outside.

   Two things are therefore deliberately NOT asserted; see SKIPPED at the bottom.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ── harness ─────────────────────────────────────────────────────────────── */

function stubEl() {
  const el = {
    style: {}, dataset: {}, children: [], value: '', innerHTML: '', textContent: '',
    checked: false, offsetWidth: 0, className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild() {}, removeChild() {}, remove() {}, addEventListener() {},
    setAttribute() {}, getAttribute: () => null, insertAdjacentHTML() {},
    focus() {}, blur() {}, scrollIntoView() {}, click() {},
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
  return el;
}

function makeSandbox() {
  const doc = {
    getElementById: () => stubEl(), querySelector: () => stubEl(),
    querySelectorAll: () => [], createElement: () => stubEl(),
    addEventListener() {}, body: stubEl(), head: stubEl(),
    documentElement: stubEl(), cookie: '', readyState: 'complete',
  };
  const storage = { getItem: () => null, setItem() {}, removeItem() {} };
  const win = {
    addEventListener() {}, location: { href: '', search: '', hash: '' },
    localStorage: storage, innerWidth: 1200, innerHeight: 800,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    navigator: { userAgent: 'node', share: undefined },
    setTimeout: () => {}, scrollTo() {}, alert() {},
  };
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {} }, // app chatters at load
    Date, Math, JSON, Set, Map, Intl, RegExp, Promise, Error,
    parseInt, parseFloat, isNaN, isFinite,
    String, Number, Boolean, Object, Array,
    encodeURIComponent, decodeURIComponent,
    document: doc, window: win, navigator: win.navigator,
    localStorage: storage, location: win.location,
    setTimeout: () => {}, setInterval: () => {}, clearInterval: () => {},
    clearTimeout: () => {}, requestAnimationFrame: () => {},
    fetch: () => new Promise(() => {}),
    alert() {}, confirm: () => false, prompt: () => null,
    matchMedia: win.matchMedia, getComputedStyle: () => ({}),
    Image: function () {}, Blob: function () {},
    URL: { createObjectURL: () => '' }, btoa: (s) => s, atob: (s) => s,
  };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

function loadApp() {
  const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const m = [...src.matchAll(/<script(?![^>]*type="module")[^>]*>([\s\S]*?)<\/script>/g)];
  if (!m.length) throw new Error('no non-module <script> found in index.html');
  const code = m[0][1];

  // Appended in the SAME lexical scope as the app, so it can reach `let`
  // bindings (actualScores / allPredictions) that are invisible from outside.
  const bridge = `
    ;__fwf = {
      calcMatch, calcBreakdown, bdTotal, calcTotal, groupStandings,
      getQualified32, getBestThirds, ALL_MATCHES, GROUPS, MATCH_SCHEDULE,
      DEFAULT_RULES, currentPhaseId, profileStats,
      setState(a, p) { actualScores = a; allPredictions = p; },
      setToggles(t) { ptsToggles = t; },
      setAdjustments(x) { adjustments = x; },
      getBuild: () => FWF_BUILD,
    };`;

  const sandbox = makeSandbox();
  vm.createContext(sandbox);
  vm.runInContext(code + bridge, sandbox, { timeout: 20000 });
  return sandbox.__fwf;
}

/* ── tiny assertion runner ───────────────────────────────────────────────── */

let pass = 0, fail = 0, skip = 0;
const failures = [];

function test(name, fn) {
  try { fn(); pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  catch (e) {
    fail++; failures.push({ name, msg: e.message });
    console.log('  \x1b[31m✗\x1b[0m ' + name + '\n      ' + e.message);
  }
}
function skipped(name, why) {
  skip++; console.log('  \x1b[33m•\x1b[0m ' + name + '\n      ' + why);
}
function eq(actual, expected, what) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${what || 'value'}: expected ${b}, got ${a}`);
}
function ok(cond, what) { if (!cond) throw new Error(what || 'expected truthy'); }
function group(name) { console.log('\n\x1b[1m' + name + '\x1b[0m'); }

/* ── load ────────────────────────────────────────────────────────────────── */

// ── build drift gate (#24) ───────────────────────────────────────────────
// index.html is GENERATED from src/. Every session before this one edited
// index.html directly, so the standing risk of the source split is that someone
// still does and the next `node build.js` silently reverts them. Fail loudly and
// first, before any test result can distract from it.
try {
  require('child_process').execFileSync(process.execPath, ['build.js', '--check'],
    { cwd: __dirname, stdio: 'pipe' });
} catch (e) {
  console.error('\n\x1b[31mBUILD DRIFT — index.html does not match src/.\x1b[0m');
  console.error((e.stderr || '').toString().trim());
  console.error('\nTests not run: they would test a file that is about to be overwritten.\n');
  process.exit(1);
}

const A = loadApp();
console.log(`FWF test suite — build ${A.getBuild()}`);
console.log('characterisation tests: green = behaviour unchanged, not = behaviour correct');

/* ─────────────────────────────────────────────────────────────────────────
   1. calcMatch
   SAFE TO ASSERT: §9 — João confirmed the sheet and the app matched EXACTLY
   at the end of the group stage on match results alone. This function is
   corroborated from outside the code, so pinning it is legitimate.
   ───────────────────────────────────────────────────────────────────────── */
group('calcMatch — corroborated externally (§9: sheet matched exactly on group results)');

const R = A.DEFAULT_RULES;
const cm = (ph, pa, ah, aa) => A.calcMatch({ home: ph, away: pa }, { home: ah, away: aa });

test('exact score scores correct_result', () => eq(cm(2, 1, 2, 1), R.correct_result));
test('exact 0-0 draw scores correct_result', () => eq(cm(0, 0, 0, 0), R.correct_result));
test('right winner, wrong score is penalised per goal', () => {
  const v = cm(3, 0, 2, 0);
  ok(v < R.correct_result, `right winner wrong score (${v}) should beat neither exact nor zero`);
  ok(typeof v === 'number', 'returns a number');
});
test('predicting a win when it was a draw is worse than an exact hit', () =>
  ok(cm(2, 1, 1, 1) < R.correct_result, 'win→draw must lose points vs exact'));
test('predicting the wrong winner is worse than predicting a draw', () =>
  ok(cm(2, 0, 0, 2) <= cm(1, 1, 0, 2), 'H-win→A-win should be no better than draw→A-win'));
test('symmetry: mirrored fixture scores identically', () =>
  eq(cm(2, 1, 2, 1), cm(1, 2, 1, 2), 'mirrored exact hits'));
test('returns null / non-number for an unplayed match', () => {
  const v = A.calcMatch({ home: 1, away: 0 }, { home: '', away: '' });
  ok(v === null || Number.isNaN(v) || v === 0, `unplayed should not award points, got ${v}`);
});

/* ─────────────────────────────────────────────────────────────────────────
   2. Structure — checkable against the tournament format itself
   ───────────────────────────────────────────────────────────────────────── */
group('schedule & structure — checkable against the WC26 format');

test('12 groups', () => eq(Object.keys(A.GROUPS).length, 12));
test('every group has exactly 4 teams', () => {
  for (const [g, d] of Object.entries(A.GROUPS)) eq(d.teams.length, 4, `group ${g}`);
});
test('48 distinct teams, no duplicates across groups', () => {
  const all = Object.values(A.GROUPS).flatMap(d => d.teams);
  eq(all.length, 48, 'total team slots');
  eq(new Set(all).size, 48, 'distinct teams');
});
test('72 group matches (12 groups × 6 pairings)', () => eq(A.ALL_MATCHES.length, 72));
test('match ids are g0..g71, unique and contiguous', () => {
  const ids = A.ALL_MATCHES.map(m => m.id);
  eq(new Set(ids).size, 72, 'unique ids');
  for (let i = 0; i < 72; i++) ok(ids.includes('g' + i), `missing id g${i}`);
});
test('every match is an intra-group pairing of two different teams', () => {
  for (const m of A.ALL_MATCHES) {
    ok(m.home !== m.away, `${m.id}: team plays itself`);
    const t = A.GROUPS[m.group].teams;
    ok(t.includes(m.home) && t.includes(m.away), `${m.id}: teams not in group ${m.group}`);
  }
});
test('each group contains all 6 distinct pairings exactly once', () => {
  for (const g of Object.keys(A.GROUPS)) {
    const ms = A.ALL_MATCHES.filter(m => m.group === g);
    eq(ms.length, 6, `group ${g} match count`);
    const keys = ms.map(m => [m.home, m.away].sort().join('|'));
    eq(new Set(keys).size, 6, `group ${g} distinct pairings`);
  }
});
test('date parsing: every scheduled match has a "DD Mon" date', () => {
  const dated = A.ALL_MATCHES.filter(m => m.date);
  ok(dated.length > 0, 'no dates at all');
  for (const m of dated) ok(/^\d{1,2} (Jun|Jul)$/.test(m.date), `${m.id}: bad date "${m.date}"`);
});
test('MATCH_SCHEDULE carries no kick-off time (blocks roadmap #16/#20)', () => {
  const hasTime = A.MATCH_SCHEDULE.some(s => s.t || s.time || s.kickoff);
  ok(!hasTime, 'a time field appeared — the countdown clock is now buildable, revisit #16/#20');
});

/* ─────────────────────────────────────────────────────────────────────────
   3. groupStandings — arithmetic only.
   The TIEBREAK ORDER IS DELIBERATELY NOT ASSERTED. See SKIPPED below.
   ───────────────────────────────────────────────────────────────────────── */
group('groupStandings — points/goals arithmetic only (tiebreaks: see SKIPPED)');

const GA = Object.keys(A.GROUPS)[0];
const TA = A.GROUPS[GA].teams;

function scoresFor(g, results) {
  const s = {};
  const ms = A.ALL_MATCHES.filter(m => m.group === g);
  for (const m of ms) {
    const r = results.find(r =>
      (r[0] === m.home && r[1] === m.away) || (r[0] === m.away && r[1] === m.home));
    if (!r) continue;
    const flip = r[0] !== m.home;
    s[m.id] = { home: flip ? r[3] : r[2], away: flip ? r[2] : r[3] };
  }
  return s;
}

test('a team winning all 3 finishes on 9 points and top', () => {
  const [t0, t1, t2, t3] = TA;
  const s = scoresFor(GA, [
    [t0, t1, 1, 0], [t0, t2, 1, 0], [t0, t3, 1, 0],
    [t1, t2, 0, 0], [t1, t3, 0, 0], [t2, t3, 0, 0],
  ]);
  const st = A.groupStandings(GA, s);
  eq(st[0].name, t0, 'winner');
  eq(st[0].Pts, 9, 'points for 3 wins');
});
test('3 points a win, 1 a draw, 0 a loss', () => {
  const [t0, t1, t2, t3] = TA;
  const s = scoresFor(GA, [
    [t0, t1, 2, 0], [t0, t2, 1, 1], [t0, t3, 0, 1],
    [t1, t2, 0, 0], [t1, t3, 0, 0], [t2, t3, 0, 0],
  ]);
  const row = A.groupStandings(GA, s).find(r => r.name === t0);
  eq(row.Pts, 4, 'W+D+L = 3+1+0');
});
test('goals for / against accumulate correctly', () => {
  const [t0, t1, t2, t3] = TA;
  const s = scoresFor(GA, [
    [t0, t1, 3, 1], [t0, t2, 0, 2], [t0, t3, 1, 1],
    [t1, t2, 0, 0], [t1, t3, 0, 0], [t2, t3, 0, 0],
  ]);
  const row = A.groupStandings(GA, s).find(r => r.name === t0);
  eq(row.GF, 4, 'goals for (3+0+1)');
  eq(row.GA, 4, 'goals against (1+2+1)');
});
test('goal difference is exactly gf − ga', () => {
  const [t0, t1, t2, t3] = TA;
  const s = scoresFor(GA, [
    [t0, t1, 5, 0], [t0, t2, 0, 1], [t0, t3, 2, 2],
    [t1, t2, 1, 1], [t1, t3, 0, 3], [t2, t3, 2, 0],
  ]);
  for (const r of A.groupStandings(GA, s)) eq(r.GD, r.GF - r.GA, `${r.name} GD`);
});
test('standings always return all 4 teams, even with no results at all', () => {
  const st = A.groupStandings(GA, {});
  eq(st.length, 4, 'row count');
  eq(st.every(r => r.Pts === 0), true, 'all on zero');
});
test('standings are sorted by points descending', () => {
  const [t0, t1, t2, t3] = TA;
  const s = scoresFor(GA, [
    [t0, t1, 3, 0], [t0, t2, 3, 0], [t0, t3, 3, 0],
    [t1, t2, 2, 0], [t1, t3, 2, 0], [t2, t3, 1, 0],
  ]);
  const st = A.groupStandings(GA, s);
  for (let i = 1; i < st.length; i++) ok(st[i - 1].Pts >= st[i].Pts, 'points not descending');
});

/* ─────────────────────────────────────────────────────────────────────────
   4. getQualified32 / getBestThirds — checkable against the regulations
   ───────────────────────────────────────────────────────────────────────── */
group('qualification — checkable against FWC26 regulations');

function fullGroupStage() {
  // Deterministic, decisive results everywhere: no ties, so the tiebreak order
  // (§6.7, known-divergent) is never exercised and cannot affect the result.
  const s = {};
  for (const g of Object.keys(A.GROUPS)) {
    const t = A.GROUPS[g].teams;
    const rank = {}; t.forEach((n, i) => rank[n] = i); // t[0] strongest
    for (const m of A.ALL_MATCHES.filter(m => m.group === g)) {
      const hs = rank[m.home] < rank[m.away];
      const margin = Math.abs(rank[m.home] - rank[m.away]);
      s[m.id] = hs ? { home: margin + 1, away: 0 } : { home: 0, away: margin + 1 };
    }
  }
  return s;
}

test('getQualified32 returns exactly 32 teams', () => {
  const q = A.getQualified32(fullGroupStage());
  eq(q.length, 32, 'qualified count');
});
test('the 32 qualifiers are all distinct', () => {
  const names = A.getQualified32(fullGroupStage()).map(t => t && t.name).filter(Boolean);
  eq(new Set(names).size, names.length, 'duplicate qualifier');
});
test('all 32 qualifiers are real teams from the groups', () => {
  const all = new Set(Object.values(A.GROUPS).flatMap(d => d.teams));
  for (const t of A.getQualified32(fullGroupStage())) {
    if (t && t.name) ok(all.has(t.name), `unknown team "${t.name}"`);
  }
});
test('getBestThirds returns exactly 8 (12 groups → 8 best thirds advance)', () => {
  const th = A.getBestThirds(fullGroupStage());
  eq(th.length, 8, 'best thirds count');
});
test('best thirds are 8 distinct teams from 8 different groups', () => {
  const th = A.getBestThirds(fullGroupStage());
  const names = th.map(t => t.name || t);
  eq(new Set(names).size, 8, 'distinct teams');
});
test('every group winner and runner-up qualifies', () => {
  const s = fullGroupStage();
  const q = new Set(A.getQualified32(s).map(t => t && t.name).filter(Boolean));
  for (const g of Object.keys(A.GROUPS)) {
    const st = A.groupStandings(g, s);
    ok(q.has(st[0].name), `group ${g} winner ${st[0].name} did not qualify`);
    ok(q.has(st[1].name), `group ${g} runner-up ${st[1].name} did not qualify`);
  }
});
test('no 4th-placed team qualifies', () => {
  const s = fullGroupStage();
  const q = new Set(A.getQualified32(s).map(t => t && t.name).filter(Boolean));
  for (const g of Object.keys(A.GROUPS)) {
    const st = A.groupStandings(g, s);
    ok(!q.has(st[3].name), `group ${g} 4th-placed ${st[3].name} qualified`);
  }
});

/* ─────────────────────────────────────────────────────────────────────────
   5. calcBreakdown — ONLY the confirmed example and structural invariants.
   §6.1 confirms: group winner reaching QF = 5+5+5+10 = 25. That number came
   from João, not from reading the code, so it is safe to pin.
   ───────────────────────────────────────────────────────────────────────── */
group('calcBreakdown — Option B stacking (§6.1 confirmed: winner→QF = 25)');

const P = { gw: 5, gs: 5, r32: 5, r16: 5, qf: 10, sf: 15, fin: 15, f3: 15, champ: 30, vice: 20, top: 20 };
const emptyBracket = { r32: [], r16: [], qf: [], sf: [], f3: [], fin: [], win: [] };
const U = 'test-uid';

function withState(actual, pred, fn) {
  A.setState(actual, { [U]: pred });
  A.setToggles({ groupWinner: true, groupSecond: true, round32: true });
  return fn();
}

test('bdTotal sums every layer', () => {
  eq(A.bdTotal({ grupos: 1, r32: 2, r16: 4, qf: 8, sf: 16, fin: 32, adj: 64 }), 127);
});
test('bdTotal ignores dbg (it is instrumentation, not a scoring path)', () => {
  const bd = { grupos: 10, r32: 0, r16: 0, qf: 0, sf: 0, fin: 0, adj: 0, dbg: { exatos: 999, gw: 999 } };
  eq(A.bdTotal(bd), 10, 'dbg must not be summed');
});
test('an empty prediction scores exactly zero', () => {
  withState({}, {}, () => eq(A.bdTotal(A.calcBreakdown(U)), 0));
});
test('no group-winner points awarded before the group stage is complete', () => {
  const s = fullGroupStage();
  const partial = {}; Object.keys(s).slice(0, 10).forEach(k => partial[k] = s[k]);
  withState(partial, { ...partial, bracket: emptyBracket }, () => {
    const bd = A.calcBreakdown(U);
    eq(bd.dbg.gw, 0, 'gw before groups complete');
    eq(bd.dbg.gs, 0, 'gs before groups complete');
    eq(bd.dbg.r32reach, 0, 'r32 reach before groups complete');
  });
});
test('a perfect group stage awards 12 group winners and 12 runners-up', () => {
  const s = fullGroupStage();
  withState(s, { ...s, bracket: emptyBracket }, () => {
    const bd = A.calcBreakdown(U);
    eq(bd.dbg.gw, 12 * P.gw, 'all 12 group winners');
    eq(bd.dbg.gs, 12 * P.gs, 'all 12 runners-up');
    eq(bd.dbg.r32reach, 32 * P.r32, 'all 32 reaching R32');
  });
});
test('CONFIRMED (§6.1): one group winner reaching QF stacks to 25', () => {
  const s = fullGroupStage();
  const team = A.groupStandings(Object.keys(A.GROUPS)[0], s)[0].name;
  const actual = { ...s, ko_r32: [team], ko_r16: [team], ko_qf: [], ko_sf: [], ko_fin: [], ko_f3: [] };
  const pred = { ...s, bracket: { ...emptyBracket, r32: [team], r16: [team] } };
  withState(actual, pred, () => {
    const bd = A.calcBreakdown(U);
    const forThisTeam = P.gw + P.r32 + P.r16 + P.qf; // 5 group-1st + 5 reach-R32 + 5 won-R32 + 10 won-R16
    eq(forThisTeam, 25, 'the confirmed arithmetic itself');
    eq(bd.r32, P.r16, 'won R32 layer');
    eq(bd.r16, P.qf, 'won R16 layer');
    ok(bd.dbg.gw >= P.gw, 'group winner layer present');
  });
});
test('layers stack: a team surviving further never scores less', () => {
  const s = fullGroupStage();
  const team = A.groupStandings(Object.keys(A.GROUPS)[0], s)[0].name;
  const pred = { ...s, bracket: { ...emptyBracket, r32: [team], r16: [team], qf: [team], sf: [team] } };
  let last = -Infinity;
  const rounds = [
    { ko_r32: [], ko_r16: [], ko_qf: [], ko_sf: [] },
    { ko_r32: [team], ko_r16: [], ko_qf: [], ko_sf: [] },
    { ko_r32: [team], ko_r16: [team], ko_qf: [], ko_sf: [] },
    { ko_r32: [team], ko_r16: [team], ko_qf: [team], ko_sf: [] },
    { ko_r32: [team], ko_r16: [team], ko_qf: [team], ko_sf: [team] },
  ];
  for (const ko of rounds) {
    const total = withState({ ...s, ...ko, ko_fin: [], ko_f3: [] }, pred, () => A.bdTotal(A.calcBreakdown(U)));
    ok(total >= last, `total went DOWN as the team advanced (${total} < ${last})`);
    last = total;
  }
});
test('champion is worth more than runner-up, runner-up more than 3rd', () => {
  ok(P.champ > P.vice, 'champ > vice');
  ok(P.vice > P.f3, 'vice > 3rd');
});
test('a wrong bracket pick scores nothing for that layer', () => {
  const s = fullGroupStage();
  const all = Object.values(A.GROUPS).flatMap(d => d.teams);
  const actual = { ...s, ko_r32: [all[0]], ko_r16: [], ko_qf: [], ko_sf: [], ko_fin: [], ko_f3: [] };
  const pred = { ...s, bracket: { ...emptyBracket, r32: [all[47]] } };
  withState(actual, pred, () => eq(A.calcBreakdown(U).r32, 0, 'wrong R32 pick'));
});
test('duplicate picks in a bracket array are not double-counted', () => {
  const s = fullGroupStage();
  const team = A.groupStandings(Object.keys(A.GROUPS)[0], s)[0].name;
  const actual = { ...s, ko_r32: [team], ko_r16: [], ko_qf: [], ko_sf: [], ko_fin: [], ko_f3: [] };
  const pred = { ...s, bracket: { ...emptyBracket, r32: [team, team, team] } };
  withState(actual, pred, () => eq(A.calcBreakdown(U).r32, P.r16, 'duplicates must collapse'));
});
test('a malformed prediction does not throw', () => {
  const s = fullGroupStage();
  withState({ ...s, ko_r32: null, ko_fin: undefined }, { bracket: { r32: [null, 'TBD', undefined] } },
    () => { A.bdTotal(A.calcBreakdown(U)); });
});

/* ─────────────────────────────────────────────────────────────────────────
   5b. profileStats (#7) — must be a VIEW over calcBreakdown, never a 2nd path
   ───────────────────────────────────────────────────────────────────────── */
group('profileStats — a view over the single scoring path (§6.1)');

test('profileStats total always equals bdTotal(calcBreakdown) exactly', () => {
  const s = fullGroupStage();
  const team = A.groupStandings(Object.keys(A.GROUPS)[0], s)[0].name;
  const cases = [
    [{}, {}],
    [s, { ...s, bracket: emptyBracket }],
    [{ ...s, ko_r32: [team], ko_r16: [team], ko_qf: [], ko_sf: [], ko_fin: [], ko_f3: [] },
     { ...s, bracket: { ...emptyBracket, r32: [team], r16: [team] } }],
  ];
  for (const [actual, pred] of cases) {
    withState(actual, pred, () => {
      eq(A.profileStats(U).total, A.bdTotal(A.calcBreakdown(U)), 'profile total drifted from the scorer');
    });
  }
});
test('profileStats exact-scoreline count never exceeds matches played', () => {
  const s = fullGroupStage();
  withState(s, { ...s, bracket: emptyBracket }, () => {
    const p = A.profileStats(U);
    eq(p.played, 72, 'all group matches played');
    ok(p.exact <= p.played, 'exact > played is impossible');
    eq(p.exact, 72, 'a perfect group stage is 72/72 exact');
  });
});
test('profileStats reports null (not 0) for a round that has not been played', () => {
  const s = fullGroupStage();
  withState({ ...s, ko_r32: [], ko_r16: [], ko_qf: [], ko_sf: [] },
    { ...s, bracket: emptyBracket }, () => {
      for (const [label, r] of A.profileStats(U).rounds)
        eq(r, null, `${label} should be null, not a fake 0/0`);
    });
});
test('profileStats does not throw on a malformed prediction', () => {
  withState({ ko_r32: null }, { bracket: { r32: [null, 'TBD'] } }, () => { A.profileStats(U); });
});

/* ─────────────────────────────────────────────────────────────────────────
   6. DEFAULT_RULES ↔ P  (guards task A from silently drifting back)
   ───────────────────────────────────────────────────────────────────────── */
group('DEFAULT_RULES mirrors P — regression guard for task A');

const RULE_TO_P = {
  group_winner: 'gw', group_second: 'gs', round32: 'r32', round16: 'r16',
  quarters: 'qf', semis: 'sf', finalist: 'fin', third: 'f3',
  runner_up: 'vice', winner: 'champ', top_scorer: 'top',
};
for (const [rk, pk] of Object.entries(RULE_TO_P)) {
  test(`DEFAULT_RULES.${rk} === P.${pk} (${P[pk]})`, () => eq(A.DEFAULT_RULES[rk], P[pk]));
}
test('scorer-read rule keys are present and unchanged', () => {
  eq(A.DEFAULT_RULES.correct_result, 3);
  eq(A.DEFAULT_RULES.wrong_goal, -1);
  eq(A.DEFAULT_RULES.wrong_outcome, -2);
  eq(A.DEFAULT_RULES.wrong_outcome_win, -4);
});

/* ─────────────────────────────────────────────────────────────────────────
   7. currentPhaseId
   ───────────────────────────────────────────────────────────────────────── */
group('currentPhaseId');

test('groups while the group stage is unfinished', () => {
  withState({}, {}, () => eq(A.currentPhaseId(), 'grupos'));
});
test('r32 once groups are complete and no R32 results are in', () => {
  withState(fullGroupStage(), {}, () => eq(A.currentPhaseId(), 'r32'));
});
test('fin once the semi-final winners are known', () => {
  const s = fullGroupStage();
  const t = Object.values(A.GROUPS).flatMap(d => d.teams);
  withState({
    ...s, ko_r32: t.slice(0, 16), ko_r16: t.slice(0, 8),
    ko_qf: t.slice(0, 4), ko_sf: t.slice(0, 2),
  }, {}, () => eq(A.currentPhaseId(), 'fin'));
});

/* ── SKIPPED — deliberate, do not "fix" ──────────────────────────────────── */
group('SKIPPED — deliberately not asserted');

skipped('groupStandings tiebreak order',
  'Sorts Pts→GD→GF→GA→alpha. This DIVERGES from FWC26 Art.13 (head-to-head is\n' +
  '      Step 1; and the GA step is dead code since GA = GF − GD). It was fixed in\n' +
  '      20260716d and REVERTED in 66e849e because agreement with João\'s sheet got\n' +
  '      WORSE (43/64 → 42/64). Pinning either order would assert a rules answer\n' +
  '      nobody has given. Every test above uses decisive results so ties never\n' +
  '      arise. See handover §6.7 — known, deliberate, leave it.');

skipped('real players\' totals vs the external sheet',
  'At 20260716c the app and the sheet disagreed on 21 of 64. The fix (3f04036,\n' +
  '      deriving group 1st/2nd in downloadCSV) is diagnosed but UNCONFIRMED — the\n' +
  '      gate question in §9 is unanswered. Asserting current totals are correct\n' +
  '      would freeze a possible bug into a green suite. Reconciliation is a data\n' +
  '      question, not a unit test. Answer the gate first.');

/* ── summary ─────────────────────────────────────────────────────────────── */

console.log('\n' + '─'.repeat(64));
console.log(`\x1b[32m${pass} passed\x1b[0m` +
  (fail ? `  \x1b[31m${fail} failed\x1b[0m` : '') +
  `  \x1b[33m${skip} skipped\x1b[0m`);
if (fail) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  • ${f.name}\n    ${f.msg}`));
}
console.log('─'.repeat(64));
process.exit(fail ? 1 : 0);
