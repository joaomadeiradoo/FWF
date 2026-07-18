// Server-side score application. Reads the results the fetch workflow already
// wrote to data/live.json, derives group-stage actualScores, and writes them to
// Firestore via the Admin SDK — using FIELD-PATH writes only (never a whole-map
// write), honouring the manual-entry failsafe.
//
// SAFETY MODEL — this cannot touch the live competition unless BOTH are true:
//   1. env APPLY_LIVE === 'true'   (defaults to dry-run: logs, writes nothing)
//   2. env FIREBASE_SERVICE_ACCOUNT is present (a service-account JSON key)
// Without the key it prints what it *would* do and exits 0. That means it is safe
// to merge and run in CI immediately, before João has added the secret.
//
// SCOPE: group stage only. Knockout apply is deliberately NOT wired yet — see
// the project TODO. Manual host entry remains the failsafe for everything.

const fs = require('fs');
const path = require('path');
const core = require('./lib/fd-apply-core.js');

const APPLY_LIVE = process.env.APPLY_LIVE === 'true';
const SA_RAW = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const COMP_ID = process.env.FWF_COMP_ID || '';

function readJson(p) { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', p), 'utf8')); }

(async () => {
  const live = readJson('data/live.json');
  const fixtures = readJson('data/fixtures.json');
  const matches = Array.isArray(live.matches) ? live.matches : [];

  const dryRun = !APPLY_LIVE || !SA_RAW;
  console.log(`[apply] mode=${dryRun ? 'DRY-RUN' : 'LIVE'} | matches=${matches.length} | comp=${COMP_ID || '(unset)'}`);

  // In dry-run with no key we still show the derivation, but we cannot read the
  // current actualScores (no DB), so the manual-override skip is only exercised
  // for real once the key is present.
  let existing = {};
  let db = null, ref = null;

  if (!dryRun) {
    if (!COMP_ID) { console.error('[apply] FWF_COMP_ID is required for a live write. Aborting.'); process.exit(1); }
    let admin;
    try { admin = require('firebase-admin'); }
    catch { console.error('[apply] firebase-admin not installed. Run: npm i firebase-admin'); process.exit(1); }
    let creds;
    try { creds = JSON.parse(SA_RAW); }
    catch { console.error('[apply] FIREBASE_SERVICE_ACCOUNT is not valid JSON. Aborting.'); process.exit(1); }
    admin.initializeApp({ credential: admin.credential.cert(creds) });
    db = admin.firestore();
    ref = db.collection('competitions').doc(COMP_ID);
    const snap = await ref.get();
    if (!snap.exists) { console.error(`[apply] competition ${COMP_ID} not found. Aborting.`); process.exit(1); }
    existing = (snap.data() || {}).actualScores || {};
  }

  const { updates, skipped } = core.deriveGroupUpdates(matches, fixtures, existing);
  const ids = Object.keys(updates);

  for (const s of skipped.filter(s => s.reason === 'manual-locked')) console.log(`[apply] SKIP manual-locked ${s.id} (${s.m})`);
  if (!ids.length) { console.log('[apply] nothing to write.'); return; }

  // Build field-path payload: actualScores.<id>.home etc. Never a whole-map write.
  const payload = {};
  for (const id of ids) {
    payload[`actualScores.${id}.home`] = updates[id].home;
    payload[`actualScores.${id}.away`] = updates[id].away;
    payload[`actualScores.${id}.source`] = 'api';
    console.log(`[apply] ${dryRun ? 'WOULD write' : 'WRITE'} ${id} = ${updates[id].home}-${updates[id].away}`);
  }

  if (dryRun) { console.log(`[apply] DRY-RUN: ${ids.length} update(s) not written.`); return; }
  await ref.update(payload);
  console.log(`[apply] wrote ${ids.length} update(s) to competitions/${COMP_ID}.`);
})().catch(e => { console.error('[apply] failed:', e.message); process.exit(1); });
