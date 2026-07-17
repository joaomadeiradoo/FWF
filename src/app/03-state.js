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

// ═══ API USAGE ═══
async function getApiUsage(){
  const{db,doc,getDoc}=window._fb;
  const today=new Date().toISOString().split('T')[0];
  try{const d=await getDoc(doc(db,'apiUsage','counter'));const data=d.exists()?d.data():{date:'',n:0,log:[]};return data.date===today?data:{date:today,n:0,log:[]};}
  catch(e){return{date:new Date().toISOString().split('T')[0],n:0,log:[]};}
}
async function bumpApi(reason=''){
  const{db,doc,setDoc}=window._fb;
  const u=await getApiUsage();u.n++;u.date=new Date().toISOString().split('T')[0];
  u.log=[`${new Date().toLocaleTimeString()} - ${reason}`,...(u.log||[])].slice(0,25);
  try{await setDoc(doc(db,'apiUsage','counter'),u);}catch(e){}
  updateApiCounter(u);return u.n;
}
async function canApi(max=85){
  const u=await getApiUsage();return u.n<max;
}
function updateApiCounter(u){
  const lbl=$('api-count-lbl');const bar=$('api-bar-fill');const log=$('api-log');
  if(!u||!lbl) return;
  const pct=Math.min(Math.round((u.n/100)*100),100);
  lbl.textContent=`${u.n} / 100 chamadas hoje (${Math.max(0,100-u.n)} restantes)`;
  if(bar){bar.style.width=pct+'%';bar.style.background=pct>80?'var(--red)':pct>60?'var(--gold)':'var(--green)';}
  if(log&&u.log) log.innerHTML=u.log.map(l=>`<div>${l}</div>`).join('');
}

