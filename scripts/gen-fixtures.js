// Generates data/fixtures.json FROM src/app/01-tournament-data.js (single source
// of truth — regenerate whenever the schedule changes). Pure data module, no DOM.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', 'src', 'app', '01-tournament-data.js');
const OUT = path.join(__dirname, '..', 'data', 'fixtures.json');

const code = fs.readFileSync(SRC, 'utf8');
const sandbox = { console, Object, Array, Math, JSON, String, Number, Set, Map, Date, RegExp, parseInt, parseFloat, isNaN };
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__ALL_MATCHES = (typeof ALL_MATCHES!=="undefined")?ALL_MATCHES:genMatchesScheduled();', sandbox);
const all = sandbox.__ALL_MATCHES;
if (!Array.isArray(all) || !all.length) { console.error('no fixtures generated'); process.exit(1); }
const fixtures = all.map(m => ({ id: m.id, group: m.group, home: m.home, away: m.away }));
fs.writeFileSync(OUT, JSON.stringify(fixtures));
console.log(`wrote ${fixtures.length} fixtures -> ${OUT}`);
