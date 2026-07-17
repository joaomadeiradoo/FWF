// ═══ SUBMIT ═══
async function submitPredictions(mode){
  const uid=currentUser?.uid;if(!uid) return;
  if(!canEdit(uid)){toast(t('predLocked'),true);return;}
  if(mode==='group'){
    // Read directly from the DOM. userPredictions in memory may be stale because
    // onSnapshot can re-hydrate it from Firestore at any time (e.g. when another
    // user saves, the API applies scores, or auto-login migrates a UID).
    // The DOM is the source of truth for what the user just typed.
    const inputs=document.querySelectorAll('#group-matches .mp');
    const collected={};
    inputs.forEach(inp=>{
      const mid=inp.dataset.mid,side=inp.dataset.side;
      if(!collected[mid]) collected[mid]={home:'',away:''};
      // Safety net: strip ALL non-digits (handles "0.5", ".", etc.) then clamp 0-20
      let v=String(inp.value||'').replace(/[^0-9]/g,'');
      if(v!==''){let n=parseInt(v,10);if(isNaN(n)||n<0)n=0;if(n>20)n=20;v=String(n);}
      collected[mid][side]=v;
    });
    // Merge into userPredictions so we don't lose any keys that aren't currently
    // rendered (e.g. autoGroupKeys output stored previously).
    Object.keys(collected).forEach(mid=>{
      userPredictions[mid]={...(userPredictions[mid]||{}),...collected[mid]};
    });
    const allFilled=ALL_MATCHES.every(m=>{
      const p=userPredictions[m.id]||{};
      return p.home!==''&&p.home!==undefined&&p.home!==null
          && p.away!==''&&p.away!==undefined&&p.away!==null;
    });
    if(!allFilled){
      // Help the user find which match is missing
      const missing=ALL_MATCHES.find(m=>{const p=userPredictions[m.id]||{};return p.home===''||p.home===undefined||p.home===null||p.away===''||p.away===undefined||p.away===null;});
      console.warn('Missing prediction for match:',missing?.id,missing?.home,'vs',missing?.away,userPredictions[missing?.id]);
      toast(t('submitAll'),true);return;
    }
    const auto=autoGroupKeys(userPredictions);for(const[k,v] of Object.entries(auto)) if(!userPredictions[k]) userPredictions[k]=v;
  }
  if(mode==='bracket'){const ts=$('topscorer-input');if(ts) userPredictions.topScorer=ts.value||'';}
  const{db,doc,updateDoc}=window._fb;
  // Firestore rejects any undefined value anywhere in the object. Strip them
  // (recursively) so a stray undefined from earlier interactions can't block
  // the entire save. JSON round-trip drops undefined keys cleanly.
  const clean=JSON.parse(JSON.stringify(userPredictions,(k,v)=>v===undefined?null:v));
  // Remove any null values that the replacer introduced for top-level optional fields
  Object.keys(clean).forEach(k=>{if(clean[k]===null) delete clean[k];});
  try{
    await updateDoc(doc(db,'competitions',currentCompId),{[`predictions.${uid}`]:clean});
  }catch(e){
    console.error('Failed to save predictions:',e);
    toast('Erro a guardar: '+e.message,true);
    return; // keep hasUnsavedEdits=true so user can retry
  }
  userPredictions=clean;
  allPredictions[uid]={...userPredictions};
  hasUnsavedEdits=false;
  toast(t('saved'));updateBanner();renderLeaderboard();renderOtherPreds();renderGruposTab();renderBracket();renderBracketMobile();renderBracketSwipe();
  updateAdvanceBtn();
  maybeOfferA2HS();
}

