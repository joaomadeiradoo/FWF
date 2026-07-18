// ═══ UI ═══
// Make the host-panel section headers (h3) collapsible so the panel isn't one
// endless scroll. Runs when the host tab opens; idempotent (each section wrapped
// once). Inner content ids (#host-adjust, #host-score-inputs, …) stay in the DOM,
// just nested one level deeper, so every render function keeps working.
function makeHostPanelCollapsible(){
  const host=document.getElementById('tab-host');if(!host) return;
  host.querySelectorAll('div[style*="margin-bottom:18px"]').forEach(sec=>{
    if(sec.classList.contains('hp-collapsible')) return;
    const h=sec.querySelector(':scope > h3');
    if(!h) return;
    sec.classList.add('hp-collapsible');
    const body=document.createElement('div');
    body.className='hp-body';
    let n=h.nextSibling;
    while(n){const next=n.nextSibling;body.appendChild(n);n=next;}
    sec.appendChild(body);
    body.style.display='none'; // default collapsed
    h.style.cursor='pointer';h.style.userSelect='none';
    const caret=document.createElement('span');
    caret.textContent='▸ ';
    h.insertBefore(caret,h.firstChild);
    h.addEventListener('click',()=>{
      const open=body.style.display!=='none';
      body.style.display=open?'none':'';
      caret.textContent=open?'▸ ':'▾ ';
    });
  });
}
window.makeHostPanelCollapsible=makeHostPanelCollapsible;
function showTab(id){
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('#main-tabs .tab').forEach(el=>el.classList.remove('active'));
  const tc=$(id);if(tc) tc.classList.add('active');
  const tb=$(`tab-btn-${id.replace('tab-','')}`);if(tb) tb.classList.add('active');
  document.querySelectorAll('.bnav-btn').forEach(el=>el.classList.remove('active'));
  const nb=$(`bnav-${id.replace('tab-','')}`);if(nb) nb.classList.add('active');
  if(id==='tab-leaderboard'){const sb=$('lb-share-btn');if(sb&&HIDE_LEADERBOARD)sb.style.display='none';renderLeaderboard();renderPodium();renderOtherPreds();renderLive();if(typeof renderSubHostPanel==='function')renderSubHostPanel();}
  if(id==='tab-grupos') renderGruposTab();
  if(id==='tab-bracket'){renderBracket();renderBracketMobile();renderBracketSwipe();}
  if(id==='tab-historia'){renderPodium();renderHistoria();}
  if(id==='tab-rules') renderRules();
  if(id==='tab-host'){renderHostScores();renderHostMembers();renderHostAdjust();renderHostRules();renderHostPlayerChars();renderPtsToggles();renderPodiumHostSection();updateApiCounter();makeHostPanelCollapsible();}
}
function copyInvite(){navigator.clipboard.writeText(currentComp?.inviteCode||'');toast(t('copied'));}

// ═══ BOOTSTRAP ═══
// Auto-login flow:
// 1. Wait for Firebase auth state (it persists anonymous sessions in IndexedDB)
// 2. If no Firebase user but we have stored name+PIN+code -> silently signInAnonymously
//    and re-match user via name+PIN against the competition (UID may have changed)
// 3. Update stored UID, then load main app
// This handles iOS Safari ITP, private mode, and any case where Firebase auth was lost
// while localStorage still has the stored credentials.
let _bootstrapped=false;
async function startFirebase(){
  if(!window._fb||_bootstrapped) return;
  _bootstrapped=true;

  const storedName=localStorage.getItem('fwf_name');
  const storedPin=localStorage.getItem('fwf_pin');
  const storedComp=localStorage.getItem('fwf_comp');
  const storedUid=localStorage.getItem('fwf_uid');

  // No stored credentials at all -> show auth screen
  if(!storedName||!storedPin||!storedComp){
    hide('screen-loading');hide('screen-main');show('screen-auth');
    return;
  }

  const{auth,db,doc,getDoc,updateDoc,signInAnonymously,onAuthStateChanged}=window._fb;

  // Wait for Firebase to report its auth state (it reads IndexedDB async on load)
  const fbUser=await new Promise(resolve=>{
    const unsub=onAuthStateChanged(auth,user=>{unsub();resolve(user);});
  });

  try{
    let activeUid=fbUser?fbUser.uid:null;

    // No Firebase session (iOS ITP cleared it, etc.) -> sign in anonymously
    if(!activeUid){
      const cred=await signInAnonymously(auth);
      activeUid=cred.user.uid;
    }

    // Load the specific competition the user joined (not the first one in the DB)
    const compRef=doc(db,'competitions',storedComp);
    const compSnap=await getDoc(compRef);
    if(!compSnap.exists()){
      // Competition was deleted -> force re-login
      clearStoredAuth();
      hide('screen-loading');hide('screen-main');show('screen-auth');
      toast('Competição não encontrada. Entra de novo.',true);
      return;
    }

    const compData=compSnap.data();
    const members=compData.members||{};

    // Try to match user by name+PIN (UID may have changed since last session)
    let matchedUid=null;
    Object.keys(members).forEach(uid=>{
      if(members[uid].name===storedName&&members[uid].pin===storedPin) matchedUid=uid;
    });

    if(matchedUid){
      // Found existing membership. Keep using the uid this player already owns —
      // never migrate onto this device's anon uid. See doJoinCompetition for why:
      // migrating ping-ponged the key between devices and orphaned adjustments,
      // playerChars and approvedTopScorers, which were never moved.
      localStorage.setItem('fwf_uid',matchedUid);
      currentUser={uid:matchedUid,displayName:storedName};
      currentCompId=storedComp;
      await initMainApp(matchedUid);
    }else{
      // No name+PIN match in this competition -> they were kicked or PIN was wrong
      clearStoredAuth();
      hide('screen-loading');hide('screen-main');show('screen-auth');
      toast('Conta não encontrada nesta competição. Entra de novo.',true);
    }
  }catch(e){
    console.error('Auto-login failed:',e);
    clearStoredAuth();
    hide('screen-loading');hide('screen-main');show('screen-auth');
    toast('Erro a entrar: '+e.message,true);
  }
}
function clearStoredAuth(){
  localStorage.removeItem('fwf_uid');
  localStorage.removeItem('fwf_name');
  localStorage.removeItem('fwf_pin');
  localStorage.removeItem('fwf_comp');
  currentUser=null;currentCompId=null;
}
// ═══ ADD TO HOME SCREEN (install hint) ═══
// Shown once, after the user's first prediction submit. Dismissable.
// Android/Chrome: capture beforeinstallprompt and offer a one-tap install.
// iOS Safari: no install API exists, so show manual "Share -> Add to Home Screen" steps.
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});

function isStandalone(){
  return window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone===true;
}
function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); // iPadOS
}
function a2hsAlreadyHandled(){
  // Persist the "seen" flag on the member record (survives Safari storage clearing).
  const u=currentUser&&allUsers[currentUser.uid];
  if(u&&u.a2hsSeen) return true;
  // localStorage as a secondary guard (e.g. before member record loads)
  try{ if(localStorage.getItem('fwf_a2hs_seen')==='1') return true; }catch(e){}
  return false;
}
async function markA2HSSeen(){
  try{ localStorage.setItem('fwf_a2hs_seen','1'); }catch(e){}
  // Also write to the member record so it follows the user across devices/sessions
  try{
    if(window._fb&&currentUser&&currentCompId){
      const{db,doc,updateDoc}=window._fb;
      await updateDoc(doc(db,'competitions',currentCompId),{[`members.${currentUser.uid}.a2hsSeen`]:true});
    }
  }catch(e){/* best effort */}
}
function maybeOfferA2HS(){
  // Only relevant on mobile — no point prompting desktop users
  const isMobile=/iphone|ipad|ipod|android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isMobile) return;
  if(isStandalone()||a2hsAlreadyHandled()) return;
  const card=$('a2hs');if(!card) return;
  const actions=$('a2hs-actions');const sub=$('a2hs-sub');

  if(deferredInstallPrompt){
    // Android / desktop Chrome: real one-tap install
    actions.innerHTML=`<button class="btn btn-gold" onclick="doInstallA2HS()">📲 Instalar</button>
      <button class="btn btn-ghost" onclick="dismissA2HS()">Agora não</button>`;
  }else if(isIOS()){
    // iOS Safari: manual instructions (no API available)
    sub.textContent='Abre as previsões com um toque, como uma app.';
    actions.innerHTML=`<div class="a2hs-steps">
      1. Toca em <b>Partilhar</b>
      <svg class="a2hs-share-ico" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>
      na barra do Safari<br>
      2. Escolhe <b>"Adicionar ao ecrã principal"</b></div>
      <div style="margin-top:10px"><button class="btn btn-ghost btn-full" onclick="dismissA2HS()">Entendido</button></div>`;
  }else{
    // Other browsers without the install API and not iOS: nothing useful to offer
    return;
  }

  // small delay so the "Guardado!" toast lands first
  setTimeout(()=>{card.style.display='block';requestAnimationFrame(()=>card.classList.add('show'));},900);
}
async function doInstallA2HS(){
  if(!deferredInstallPrompt){dismissA2HS();return;}
  deferredInstallPrompt.prompt();
  try{ await deferredInstallPrompt.userChoice; }catch(e){}
  deferredInstallPrompt=null;
  dismissA2HS();
}
function dismissA2HS(){
  const card=$('a2hs');if(card){card.classList.remove('show');setTimeout(()=>{card.style.display='none';},350);}
  markA2HSSeen();
}
window.doInstallA2HS=doInstallA2HS;window.dismissA2HS=dismissA2HS;

// ═══ PULL-TO-REFRESH ═══
// iOS standalone mode suppresses the native pull-to-refresh gesture entirely.
// Android Chrome has a working native PTR even in standalone mode, so we only
// install our custom implementation on iOS to avoid a double-reload conflict.
(function initPTR(){
  const onIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!onIOS) return;

  const THRESHOLD=60;
  let startY=0,pulling=false,triggered=false;
  const ptr=document.getElementById('ptr');
  if(!ptr) return;

  function isAtTop(){
    // In iOS standalone the scrolling element can be document.scrollingElement,
    // document.documentElement, document.body, or a child — check all.
    if((document.scrollingElement||document.documentElement).scrollTop>2) return false;
    if(window.scrollY>2) return false;
    if(document.body.scrollTop>2) return false;
    return true;
  }

  document.addEventListener('touchstart',e=>{
    if(!isAtTop()) return;
    startY=e.touches[0].clientY;
    pulling=true;triggered=false;
  },{passive:true});

  document.addEventListener('touchmove',e=>{
    if(!pulling) return;
    const dy=e.touches[0].clientY-startY;
    if(dy<=0){pulling=false;ptr.style.height='0';ptr.classList.remove('visible');return;}
    const progress=Math.min(dy/THRESHOLD,1);
    ptr.style.height=`${Math.round(progress*52)}px`;
    if(dy>=THRESHOLD&&!triggered){
      triggered=true;
      ptr.classList.add('visible','spinning');
    }
  },{passive:true});

  document.addEventListener('touchend',()=>{
    if(!pulling) return;
    pulling=false;
    if(triggered){
      ptr.classList.add('visible','spinning');
      setTimeout(()=>location.reload(),400);
    }else{
      ptr.style.height='0';
      ptr.classList.remove('visible','spinning');
    }
  },{passive:true});
})();

window.addEventListener('firebase-ready',startFirebase);
if(window._fb) startFirebase();

window.setLang=setLang;window.doSimpleAuth=doSimpleAuth;window.doCreateCompetition=doCreateCompetition;window.markUnsaved=markUnsaved;
window.showHostCreate=showHostCreate;window.showAuth=showAuth;window.promptAdminCreate=promptAdminCreate;window.doSignOut=doSignOut;
window.createComp=createComp;window.initMainApp=initMainApp;
window.showTab=showTab;window.submitPredictions=submitPredictions;window.saveActualScores=saveActualScores;
window.toggleUnlock=toggleUnlock;window.copyInvite=copyInvite;window.regenerateCode=regenerateCode;
window.addAdjustment=addAdjustment;window.removeAdjustment=removeAdjustment;window.showAdjReasons=showAdjReasons;
window.toggleAdmin=toggleAdmin;window.kickUser=kickUser;window.togglePaid=togglePaid;window.toggleUnpaidAnnounce=toggleUnpaidAnnounce;window.shareLeaderboard=shareLeaderboard;window.downloadLb=downloadLb;
window.downloadCSV=downloadCSV;window.saveRules=saveRules;window.savePlayerChars=savePlayerChars;
window.reviewTopScorer=reviewTopScorer;window.approveTopScorer=approveTopScorer;window.forceFetch=forceFetch;
window.pickWinner=pickWinner;window.setPtsToggle=setPtsToggle;window.launchPtsToggle=launchPtsToggle;
window.promoteToSubHost=promoteToSubHost;window.demoteSubHost=demoteSubHost;window.reassignMember=reassignMember;
applyJoinCodeFromURL();
