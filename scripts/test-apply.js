// Tests for the server-side group-apply logic. Pure, no network/Firestore.
// Run: node scripts/test-apply.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const core = require('./lib/fd-apply-core.js');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + name); } }
function eq(name, a, b) { ok(name, JSON.stringify(a) === JSON.stringify(b)); }

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fixtures.json'), 'utf8'));

// --- DRIFT GUARD: FD_TEAM_ID here must match src/app/15-live-api.js exactly.
(() => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', '15-live-api.js'), 'utf8');
  const block = src.match(/const FD_TEAM_ID=\{[\s\S]*?\};/);
  ok('drift: FD_TEAM_ID block found in source', !!block);
  if (block) {
    const sandbox = {}; vm.createContext(sandbox);
    vm.runInContext(block[0] + '\n;globalThis.__M=FD_TEAM_ID;', sandbox);
    eq('drift: ported FD_TEAM_ID equals source', sandbox.__M, core.FD_TEAM_ID);
  }
})();

// --- fdMatchScore: normal group match
eq('normal score', core.fdMatchScore({ score: { fullTime: { home: 2, away: 1 }, duration: 'REGULAR' } }), { home: 2, away: 1, pens: null, winner: null });
// --- fdMatchScore: shootout returns true 120' score, not fullTime sum
eq('shootout true score', core.fdMatchScore({ score: {
  duration: 'PENALTY_SHOOTOUT',
  fullTime: { home: 4, away: 2 }, regularTime: { home: 1, away: 1 }, extraTime: { home: 0, away: 0 }, penalties: { home: 3, away: 1 }, winner: 'HOME_TEAM'
} }), { home: 1, away: 1, pens: { home: 3, away: 1 }, winner: 'HOME_TEAM' });
// --- fdMatchScore: misshapen shootout refuses
ok('shootout refuses when arithmetic breaks', core.fdMatchScore({ score: {
  duration: 'PENALTY_SHOOTOUT', fullTime: { home: 5, away: 2 }, regularTime: { home: 1, away: 1 }, penalties: { home: 3, away: 1 }
} }) === null);
// --- fdMatchScore: incomplete
ok('null score refused', core.fdMatchScore({ score: { fullTime: { home: null, away: null } } }) === null);

// --- deriveGroupUpdates: applies a finished group match, oriented to the fixture
const g0 = fixtures.find(f => f.id === 'g0'); // México(769) v África do Sul(774)
const liveG0 = { stage: 'GROUP_STAGE', status: 'FINISHED', homeTeam: { id: 769, name: 'México' }, awayTeam: { id: 774, name: 'África do Sul' }, score: { fullTime: { home: 3, away: 0 }, duration: 'REGULAR' } };
{
  const { updates } = core.deriveGroupUpdates([liveG0], fixtures, {});
  eq('applies g0', updates['g0'], { home: 3, away: 0, source: 'api' });
}
// --- orientation: API sends the pair reversed; score must flip to fixture order
{
  const rev = { stage: 'GROUP_STAGE', status: 'FINISHED', homeTeam: { id: 774, name: 'África do Sul' }, awayTeam: { id: 769, name: 'México' }, score: { fullTime: { home: 0, away: 3 }, duration: 'REGULAR' } };
  const { updates } = core.deriveGroupUpdates([rev], fixtures, {});
  eq('reversed pair oriented to fixture', updates['g0'], { home: 3, away: 0, source: 'api' });
}
// --- manual override: never touch a manual score
{
  const { updates, skipped } = core.deriveGroupUpdates([liveG0], fixtures, { g0: { home: 1, away: 1, source: 'manual' } });
  ok('manual score not overwritten', !('g0' in updates) && skipped.some(s => s.reason === 'manual-locked'));
}
// --- idempotent: identical api score produces no write
{
  const { updates } = core.deriveGroupUpdates([liveG0], fixtures, { g0: { home: 3, away: 0, source: 'api' } });
  ok('no rewrite when unchanged', !('g0' in updates));
}
// --- api correction: differing api score IS updated
{
  const { updates } = core.deriveGroupUpdates([liveG0], fixtures, { g0: { home: 2, away: 0, source: 'api' } });
  eq('api score corrected', updates['g0'], { home: 3, away: 0, source: 'api' });
}
// --- knockout match ignored
{
  const ko = { stage: 'LAST_16', status: 'FINISHED', homeTeam: { id: 769 }, awayTeam: { id: 774 }, score: { fullTime: { home: 1, away: 0 }, duration: 'REGULAR' } };
  const { updates } = core.deriveGroupUpdates([ko], fixtures, {});
  ok('knockout not applied (group-only)', Object.keys(updates).length === 0);
}
// --- unfinished ignored
{
  const timed = { ...liveG0, status: 'TIMED' };
  const { updates } = core.deriveGroupUpdates([timed], fixtures, {});
  ok('unfinished not applied', Object.keys(updates).length === 0);
}

console.log(`\napply-core: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
