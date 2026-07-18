// ═══ AUTH ═══
// ═══ SIMPLE AUTH (Name + PIN + Code) ═══
async function doSimpleAuth(){
  if(!window._fb){toast('A carregar...',true);return;}
  const name=$('auth-name').value.trim();
  const pin=$('auth-pin').value.trim();
  const code=$('auth-code').value.trim().toUpperCase();

  if(!name||!pin||!code){toast('Preenche todos os campos',true);return;}
  // Require a full name: at least two words, each with 2+ letters (e.g. "Paulo Silva")
  const nameParts=name.split(/\s+/).filter(p=>p.length>=2);
  if(nameParts.length<2){toast(lang==='pt'?'Escreve o nome e apelido (ex: Paulo Silva)':'Enter first and last name (e.g. Paulo Silva)',true);return;}
  if(pin.length!==4||!/^\d{4}$/.test(pin)){toast('PIN deve ter 4 dígitos',true);return;}

  const{auth,db,getDocs,collection,doc,getDoc,updateDoc,signInAnonymously}=window._fb;

  try{
    // Ensure we have a Firebase anonymous session BEFORE any Firestore call
    // (Firestore rules require request.auth != null)
    let fbUid=auth.currentUser?auth.currentUser.uid:null;
    if(!fbUid){
      const cred=await signInAnonymously(auth);
      fbUid=cred.user.uid;
    }

    // Find competition by code. A code is either the competition's global
    // inviteCode, or one of its per-sub-host codes (subHostCodes: {CODE: uid}).
    // A sub-host code resolves to the SAME competition and remembers who invited
    // this guest, so they're attributed automatically. No subHostCodes map on the
    // doc => this behaves exactly like the old global-only lookup.
    const snap=await getDocs(collection(db,'competitions'));
    let compDoc=null,joinedSubHost=null;
    snap.forEach(d=>{
      const data=d.data();
      if(data.inviteCode===code){ compDoc={id:d.id,...data}; joinedSubHost=null; }
      else if(data.subHostCodes&&data.subHostCodes[code]){ compDoc={id:d.id,...data}; joinedSubHost=data.subHostCodes[code]; }
    });

    if(!compDoc){toast('Código inválido',true);return;}

    // Check if name+PIN combo exists
    const members=compDoc.members||{};
    let existingUid=null;
    Object.keys(members).forEach(uid=>{
      if(members[uid].name===name&&members[uid].pin===pin) existingUid=uid;
    });

    // ═══ STABLE PLAYER IDENTITY — do not migrate UIDs ═══
    // Firebase Anonymous Auth issues a NEW uid per device/browser, so the same
    // person is uid X on their PC and uid Y on their phone. The old code reacted by
    // MIGRATING members+predictions onto whichever uid logged in last. That made the
    // key ping-pong on every device switch, and silently ORPHANED every other
    // uid-keyed map — adjustments, playerChars, approvedTopScorers — because the
    // migration only ever moved members and predictions. That is exactly why points
    // changed depending on which device you logged in with.
    // Fix: the anon uid authenticates only. The app identity is the uid this player
    // already owns (found by name+PIN) and it never changes again.
    let effectiveUid=existingUid||fbUid;
    if(!existingUid){
      // New user — check for similar existing names to prevent accidental duplicates.
      // fuzzyScore returns 0-1; >0.82 is very likely the same person with a typo/variant.
      const similar=Object.values(members).find(m=>m.name&&fuzzyScore(m.name,name)>0.82);
      if(similar){
        const msg=lang==='pt'
          ?`Já existe "${similar.name}" nesta competição.\n\nÉs tu? Usa o mesmo nome e PIN que usaste da primeira vez para entrar.\n\nSe és uma pessoa diferente, clica OK para continuar.`
          :`"${similar.name}" already exists in this competition.\n\nIs that you? Use the exact name and PIN you used before to log in.\n\nIf you're a different person, click OK to continue.`;
        if(!confirm(msg)) return;
      }
      // Add to competition under this device's Firebase UID. Written as a single
      // field path so a simultaneous join from another device cannot clobber it
      // (the old whole-map write would drop whichever member was written first).
      const memberRec={name,pin,role:'member',joinedAt:new Date().toISOString()};
      if(joinedSubHost) memberRec.subHost=joinedSubHost;
      await updateDoc(doc(db,'competitions',compDoc.id),{[`members.${fbUid}`]:memberRec});
    }

    currentUser={uid:effectiveUid,displayName:name};
    currentCompId=compDoc.id;
    localStorage.setItem('fwf_uid',effectiveUid);
    localStorage.setItem('fwf_name',name);
    localStorage.setItem('fwf_pin',pin);
    localStorage.setItem('fwf_comp',compDoc.id);
    await initMainApp(effectiveUid);
    if(!existingUid) toast(`Bem-vindo, ${name}!`);
  }catch(e){
    console.error(e);
    toast('Erro: '+e.message,true);
  }
}

async function doCreateCompetition(){
  if(!window._fb){toast('A carregar...',true);return;}
  const name=$('host-name').value.trim();
  const pin=$('host-pin').value.trim();
  const compName=$('host-comp-name').value.trim();
  
  if(!name||!pin){toast('Preenche nome e PIN',true);return;}
  const hostNameParts=name.split(/\s+/).filter(p=>p.length>=2);
  if(hostNameParts.length<2){toast(lang==='pt'?'Escreve o nome e apelido (ex: Paulo Silva)':'Enter first and last name (e.g. Paulo Silva)',true);return;}
  if(pin.length!==4||!/^\d{4}$/.test(pin)){toast('PIN deve ter 4 dígitos',true);return;}
  
  const{signInAnonymously}=window._fb;
  
  try{
    // Create anonymous account
    const cred=await signInAnonymously(window._fb.auth);
    const uid=cred.user.uid;
    
    // Create competition
    const result=await createComp(uid,name,compName||'Previsões do Professor Karamba',pin);
    
    currentUser={uid,displayName:name};
    currentCompId=result.id;
    localStorage.setItem('fwf_uid',uid);
    localStorage.setItem('fwf_name',name);
    localStorage.setItem('fwf_pin',pin);
    localStorage.setItem('fwf_comp',result.id);
    
    await initMainApp(uid);
    toast(`Competição criada! Código: ${result.code}`);
  }catch(e){
    console.error(e);
    toast('Erro: '+e.message,true);
  }
}

function showHostCreate(){hide('screen-auth');show('screen-host-create');}
function showAuth(){hide('screen-host-create');show('screen-auth');}

// ADMIN VERIFICATION - Only authorized users can create competitions
const ADMIN_PIN='2026'; // Secret PIN - only you know this
function promptAdminCreate(){
  const pin=prompt('PIN de Administrador / Admin PIN:');
  if(pin===ADMIN_PIN){
    hide('screen-auth');
    show('screen-host-create');
  }else if(pin!==null){ // null means cancelled
    toast('PIN incorreto. Apenas administradores podem criar competições.',true);
  }
}

async function doSignOut(){
  clearInterval(countdownInterval);clearInterval(apiPollTimer);
  clearStoredAuth();
  try{if(window._fb&&window._fb.signOut)await window._fb.signOut(window._fb.auth);}catch(e){}
  location.reload();
}

// ═══ COMPETITION ═══
async function createComp(uid,name,compName='Previsões do Professor Karamba',pin='0000'){
  const{db,doc,setDoc}=window._fb;
  const code=genCode(),id=`comp_${Date.now()}`;
  await setDoc(doc(db,'competitions',id),{
    name:compName,inviteCode:code,hostUid:uid,
    rules:{...DEFAULT_RULES},members:{[uid]:{name,pin,joinedAt:Date.now(),role:'host'}},
    actualScores:{},predictions:{},playerChars:{},approvedTopScorers:{},adjustments:{},
    ptsToggles:{groupWinner:true,groupSecond:true,round32:true},
    createdAt:Date.now()
  });
  return{id,code};
}
async function regenerateCode(){
  if(!isHost) return;
  if(!confirm(lang==='pt'?'Gerar novo código? O código antigo deixará de funcionar.':'Generate new code? The old code will stop working.')) return;
  const{db,doc,updateDoc}=window._fb;const code=genCode();
  await updateDoc(doc(db,'competitions',currentCompId),{inviteCode:code});
  $('host-invite-code').textContent=code;toast(t('copied'));
}
// ═══ MEMBER MUTATION — field paths + transaction (§6.4) ═══
// Every mutator below used to do `const members={...allUsers}; updateDoc({members})`
// — a whole-object write of a shared, per-uid map, built from a local snapshot.
// Two admins acting at once, or one stale onSnapshot, and the loser's change is
// silently reverted. kickUser was worse: it also wrote back the ENTIRE predictions
// map, so kicking one player while allPredictions was stale reverted someone
// else's submission. Same failure mode that made autoApplyScores() a permanent
// no-go (§6.2).
//
// mutateMember reads the member INSIDE a transaction and writes ONE field path.
// Concurrent edits to different players can no longer touch each other; a
// concurrent edit to the same player retries against fresh data.
// Behaviour is unchanged — only the write mechanism.
async function mutateMember(uid,mutator){
  const{db,doc,runTransaction}=window._fb;
  const ref=doc(db,'competitions',currentCompId);
  await runTransaction(db,async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists()) throw new Error(lang==='pt'?'Competição não encontrada':'Competition not found');
    const cur=((snap.data().members)||{})[uid];
    if(!cur) throw new Error(lang==='pt'?'Participante não encontrado':'Member not found');
    tx.update(ref,{[`members.${uid}`]:mutator({...cur})});
  });
}
async function toggleAdmin(uid){
  if(!isHost) return;
  if(!allUsers[uid]) return;
  try{ await mutateMember(uid,m=>({...m,role:m.role==='admin'?'member':'admin'})); toast(t('saved')); }
  catch(e){ toast(e.message||'Erro',true); }
}
async function kickUser(uid,name){
  if(!isAdmin) return;
  // Defensive: never allow kicking the host even if the UI somehow exposed the button
  if(allUsers[uid]?.role==='host'||currentComp?.hostUid===uid){
    toast(lang==='pt'?'Não podes expulsar o host':'Cannot kick the host',true);return;
  }
  if(!confirm(lang==='pt'?`Expulsar ${name}? Esta ação remove o utilizador permanentemente da competição.`:`Kick ${name}? This permanently removes the user from the competition.`)) return;
  // Two field-path deletes in ONE transaction. The old version rebuilt the whole
  // members AND predictions maps from local state and wrote them back wholesale —
  // one stale snapshot and kicking A silently reverted B's predictions.
  const{db,doc,runTransaction,deleteField}=window._fb;
  const ref=doc(db,'competitions',currentCompId);
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists()) throw new Error(lang==='pt'?'Competição não encontrada':'Competition not found');
      const d=snap.data();
      // Re-check the host guard against FRESH data, not the local copy.
      if(((d.members||{})[uid]||{}).role==='host'||d.hostUid===uid)
        throw new Error(lang==='pt'?'Não podes expulsar o host':'Cannot kick the host');
      tx.update(ref,{[`members.${uid}`]:deleteField(),[`predictions.${uid}`]:deleteField()});
    });
  }catch(e){ toast(e.message||'Erro',true); return; }
  toast(lang==='pt'?'Utilizador expulso':'User kicked');
}

// ═══ INIT ═══
async function initMainApp(uid){
  const{db,getDocs,collection,onSnapshot,doc,getDoc}=window._fb;
  // Load the specific competition the user joined. currentCompId should be set
  // by the auth flow (doSimpleAuth, doCreateCompetition, or startFirebase).
  // Fallback: if currentCompId isn't set, find the first competition this user is a member of.
  let compSnap=null;
  if(currentCompId){
    compSnap=await getDoc(doc(db,'competitions',currentCompId));
    if(!compSnap.exists()) compSnap=null;
  }
  if(!compSnap){
    const all=await getDocs(collection(db,'competitions'));
    if(all.empty){toast('Nenhuma competição encontrada',true);return;}
    // Find a competition where this UID is a member
    let found=null;
    all.forEach(d=>{const data=d.data();if(!found&&data.members&&data.members[uid]) found={id:d.id,snap:d};});
    if(!found){
      // No competition contains this user -> shouldn't happen post-auth, but bail safely
      toast('Não estás em nenhuma competição',true);
      throw new Error('user not in any competition');
    }
    currentCompId=found.id;
    currentComp={id:found.id,...found.snap.data()};
  }else{
    currentComp={id:currentCompId,...compSnap.data()};
  }
  isHost=currentComp.hostUid===uid;
  const member=currentComp.members?.[uid];
  isAdmin=isHost||(member?.role==='admin');
  isSubHost=(member?.role==='subhost');
  rules={...DEFAULT_RULES,...(currentComp.rules||{})};
  actualScores=currentComp.actualScores||{};
  allPredictions=currentComp.predictions||{};
  allUsers=currentComp.members||{};
  approvedTopScorers=currentComp.approvedTopScorers||{};
  ptsToggles={groupWinner:true,groupSecond:true,round32:true,...(currentComp.ptsToggles||{})};
  userPredictions=allPredictions[uid]||{};

  const nm=(currentUser&&currentUser.displayName)||'-';
  $('user-name-display').textContent=nm;$('user-avatar').textContent=nm.charAt(0).toUpperCase();
  if(currentComp){
    $('user-comp-display').textContent=`${currentComp.name} · ${currentComp.inviteCode}`;
  }
  $('host-badge').classList.toggle('hidden',!isHost);
  $('admin-badge').classList.toggle('hidden',isHost||!isAdmin);
  $('tab-btn-host').classList.toggle('hidden',!isAdmin);
  const bnh=$('bnav-host');if(bnh) bnh.classList.toggle('hidden',!isAdmin);
  if(isHost){show('invite-section');}
  if(isAdmin){show('rules-edit-section');}
  const hic=$('host-invite-code');if(hic&&currentComp) hic.textContent=currentComp.inviteCode;

  onSnapshot(doc(db,'competitions',currentCompId),sn=>{
    if(!sn.exists()) return;const d=sn.data();
    currentComp={id:currentCompId,...d};
    rules={...DEFAULT_RULES,...(d.rules||{})};
    actualScores=d.actualScores||{};allPredictions=d.predictions||{};
    allUsers=d.members||{};approvedTopScorers=d.approvedTopScorers||{};
    ptsToggles={groupWinner:true,groupSecond:true,round32:true,...(d.ptsToggles||{})};
    // Only overwrite local userPredictions from Firestore if the user is NOT
    // currently editing. Otherwise we'd wipe whatever they just typed but
    // haven't yet submitted.
    if(!hasUnsavedEdits){
      userPredictions=allPredictions[uid]||{};
      renderGroupMatches();
    }
    renderGruposTab();renderBracket();renderBracketMobile();renderBracketSwipe();
    renderLeaderboard();renderPodium();renderOtherPreds();renderLive();
    if(isAdmin){renderHostScores();renderHostMembers();renderHostAdjust();renderHostRules();renderHostPlayerChars();renderPtsToggles();renderPodiumHostSection();}
  });

  renderGroupMatches();renderGruposTab();renderBracket();renderBracketMobile();renderBracketSwipe();
  renderRules();renderLeaderboard();renderPodium();renderOtherPreds();renderLive();
  renderCountdown();updateBanner();
  if(isAdmin){renderHostScores();renderHostMembers();renderHostAdjust();renderHostRules();renderHostPlayerChars();renderPtsToggles();renderPodiumHostSection();updateApiCounter();makeHostPanelCollapsible();}
  hide('screen-loading');hide('screen-auth');show('screen-main');
  scheduleApi();
}

