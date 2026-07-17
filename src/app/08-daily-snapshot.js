// ═══ DAILY SNAPSHOT for "points today" column ═══
// ═══ DAILY SNAPSHOT ═══
// The "Hoje" column is (points now − points at the start of today). The snapshot
// used to live only in memory, so every page load re-snapshotted the CURRENT
// totals as "the start of the day" and Hoje read 0 for everybody. Refreshing the
// page silently erased the column. It is now persisted on the competition doc.
//
// SCHEMA (decision made here, not asked): a single dedicated field
//   dailySnapshot: { date:'YYYY-MM-DD', pts:{ uid:number } }
// NOT a per-uid map merged by field path. §6.4's "no whole-object writes to
// shared maps" exists because members/predictions/adjustments are written
// concurrently by different users about themselves; a race there loses data.
// This field is different in kind: it is one doc-scoped value, written at most
// once per day, and the transaction below makes it first-writer-wins — a loser
// aborts without writing. Whole-object is the correct shape for it.
//
// Day boundary is Europe/Lisbon, not UTC. toISOString() would have rolled the
// day over at 01:00 Lisbon in summer, mid-evening for nobody's benefit.
function lisbonToday(){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return p; // en-CA gives YYYY-MM-DD
}
let _snapWriteInFlight=false;
async function persistDailySnapshot(rows){
  if(_snapWriteInFlight||!window._fb||!currentCompId)return;
  _snapWriteInFlight=true;
  try{
    const{db,doc,runTransaction}=window._fb;
    const ref=doc(db,'competitions',currentCompId);
    const today=lisbonToday();
    const pts={};rows.forEach(r=>{if(r.sub)pts[r.uid]=r.pts;});
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists())return;
      const cur=snap.data().dailySnapshot;
      if(cur&&cur.date===today)return; // someone already opened the day — theirs wins
      tx.update(ref,{dailySnapshot:{date:today,pts}});
    });
  }catch(e){
    // Non-fatal by design. Firestore rules for this doc have never been read
    // (§9 open item) — if the write is denied we keep the old in-memory
    // behaviour rather than breaking the leaderboard.
    console.warn('[dailySnapshot] persist failed, falling back to in-memory:',e&&e.message);
  }finally{_snapWriteInFlight=false;}
}
function takeDailySnapshot(rows){
  const today=lisbonToday();
  const stored=currentComp&&currentComp.dailySnapshot;
  if(stored&&stored.date===today){
    // Authoritative: today's opening totals, shared by every device.
    dailySnapshotDate=today;
    dailySnapshot=stored.pts||{};
    return;
  }
  // First load of a new day (on this device). Seed locally so the column renders
  // as 0 rather than garbage, then try to make it the shared truth.
  if(dailySnapshotDate!==today){
    dailySnapshotDate=today;
    dailySnapshot={};
    rows.forEach(r=>{dailySnapshot[r.uid]=r.pts;});
  }
  persistDailySnapshot(rows);
}

