// ═══ STATE ═══
let currentUser=null,currentComp=null,currentCompId=null;
let isHost=false,isAdmin=false;
let userPredictions={},allPredictions={},allUsers={},actualScores={},approvedTopScorers={};
// True when the user has typed something in the predictions form but not yet
// submitted. While true, onSnapshot will NOT overwrite userPredictions from
// Firestore, so concurrent updates from other users / the API can't wipe
// what the current user is in the middle of entering.
let hasUnsavedEdits=false;
function markUnsaved(){hasUnsavedEdits=true;}
let rules={...DEFAULT_RULES},predictionsLocked=false,countdownInterval=null,prevLb=[],lbRows=[];
let liveData=[],upcomingData=[],recentData=[];
let apiPollTimer=null;
let dailyComment='',dailyCommentDate='';
// Points toggles state (loaded from Firebase)
let ptsToggles={groupWinner:true,groupSecond:true,round32:true};
// Daily snapshot for "points today" column
let dailySnapshot={};let dailySnapshotDate='';

// ═══ HELPERS ═══
const $=id=>document.getElementById(id);
function show(id){const e=$(id);if(e)e.classList.remove('hidden');}
function hide(id){const e=$(id);if(e)e.classList.add('hidden');}
function toast(msg,err=false){
  const e=$('toast');e.textContent=msg;e.classList.toggle('error',err);
  e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3200);
}
function genCode(){return Math.random().toString(36).substr(2,6).toUpperCase();}
// Escape a string for safe use inside an HTML attribute value enclosed in
// double quotes (e.g. onclick="foo('${attrEsc(name)}')"). This handles:
// - HTML special chars (&, <, >, ", ')
// - characters that would break out of the attribute or the JS string literal
function attrEsc(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
    .replace(/\\/g,'\\\\');
}
function canEdit(uid){
  const u=allUsers[uid||currentUser?.uid];if(!u) return false;
  const now=new Date();
  if(now<DEADLINE) return true;
  if(u.unlockedEdit){
    const extDeadline=new Date(DEADLINE.getTime()+(23.5*60*60*1000));
    return now<extDeadline;
  }
  return false;
}

// ═══ API / LIVE-FILE STATUS ═══
// The old per-day request counter (getApiUsage/bumpApi/canApi) is gone: it
// tracked api-football's 100/day budget, which no longer exists now that scores
// come from data/live.json via the GitHub Action (#6, build 20260717h). What
// the host still wants to see is whether the file is fresh, so this now reports
// the timestamp published inside live.json.
function updateApiCounter(){
  const lbl=$('api-count-lbl');const bar=$('api-bar-fill');const log=$('api-log');
  if(!lbl) return;
  const ts=window._liveFetchedAt;
  if(!ts){lbl.textContent=lang==='pt'?'à espera de dados…':'waiting for data…';if(bar)bar.style.width='0%';return;}
  const mins=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/60000));
  lbl.textContent=(lang==='pt'?'Atualizado há ':'Updated ')+
    (mins<1?(lang==='pt'?'menos de 1 min':'<1 min ago'):`${mins} min${lang==='pt'?'':' ago'}`);
  if(bar){const stale=mins>15;bar.style.width='100%';bar.style.background=stale?'var(--gold)':'var(--green)';}
  if(log)log.innerHTML='';
}

