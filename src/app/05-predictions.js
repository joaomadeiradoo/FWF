// ═══ COUNTDOWN ═══
function renderCountdown(){
  clearInterval(countdownInterval);
  function tick(){
    const uid=currentUser?.uid;
    if((allUsers[uid]||{}).unlockedEdit){predictionsLocked=false;updateBanner();return;}
    const diff=DEADLINE-new Date();
    if(diff<=0){
      predictionsLocked=true;
      ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id=>{const e=$(id);if(e)e.textContent='0';});
      const dn=$('deadline-note');if(dn)dn.textContent=t('deadlineClosed');
      updateBanner();return;
    }
    predictionsLocked=false;
    if($('cd-days'))$('cd-days').textContent=Math.floor(diff/86400000);
    if($('cd-hours'))$('cd-hours').textContent=Math.floor((diff%86400000)/3600000);
    if($('cd-mins'))$('cd-mins').textContent=Math.floor((diff%3600000)/60000);
    if($('cd-secs'))$('cd-secs').textContent=Math.floor((diff%60000)/1000);
    const dn=$('deadline-note');if(dn)dn.textContent=t('deadlineOpen');
  }
  tick();countdownInterval=setInterval(tick,1000);
}
function updateBanner(){
  const b=$('pred-banner');if(!b) return;
  const uid=currentUser?.uid;const u=allUsers[uid]||{};
  const sub=!!(allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0);
  const past=new Date()>DEADLINE;
  let msg='',cls='badge-open';
  if(u.unlockedEdit){msg=t('predOpen');}
  else if(sub&&past){msg=t('predSubmittedLocked');cls='badge-locked';}
  else if(sub){msg=t('predOpen');}
  else if(past){msg=t('predLocked');cls='badge-locked';}
  else{msg=t('predNone');cls='badge-locked';}
  b.innerHTML=msg?`<span class="badge ${cls}" style="font-size:.8rem;padding:5px 12px">${msg}</span>`:'';
  const editable=canEdit(uid);
  const bs=$('btn-submit');if(bs)bs.disabled=!editable;
  const bb=$('btn-submit-bracket');if(bb)bb.disabled=!editable;
}

// ═══ GROUP MATCHES (Previsões) ═══
function updateAdvanceBtn(){
  const btn=$('btn-go-bracket');if(!btn) return;
  const allFilled=ALL_MATCHES.every(m=>{
    const p=userPredictions[m.id]||{};
    return p.home!==''&&p.home!==undefined&&p.away!==''&&p.away!==undefined;
  });
  btn.style.display=allFilled?'inline-block':'none';
}
function renderGroupMatches(){
  const c=$('group-matches');if(!c) return;
  const uid=currentUser?.uid;const editable=canEdit(uid);
  // Sort matches by group first, then by original order within group
  const sortedMatches=[...ALL_MATCHES].sort((a,b)=>a.group.localeCompare(b.group)||parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
  let html='';let cg='';let groupMatchCount=0;
  for(const m of sortedMatches){
    if(m.group!==cg){
      if(cg) html+='</div></div>';
      cg=m.group;groupMatchCount=0;
      html+=`<div class="card" style="margin-bottom:10px"><h2 style="font-size:1.1rem">${lang==='pt'?'Grupo':'Group'} ${m.group}</h2><div>`;
    }
    groupMatchCount++;
    const pred=userPredictions[m.id]||{home:'',away:''};
    const act=actualScores[m.id]||null;
    const pts=(act&&act.home!==undefined&&act.home!==''&&pred.home!=='')?calcMatch(pred,act):null;
    const ptsH=pts!==null?`<span class="pp ${pts>0?'pp-pos':pts<0?'pp-neg':'pp-z'}">${pts>0?'+':''}${pts}pts</span>`:'';
    const dateLbl=m.date?`<span style="font-size:.58rem;color:var(--muted)">${m.date}</span>`:'';
    html+=`<div class="match-card">
      <div class="match-team home"><div>${fi(m.home,30)}</div><div class="team-name">${m.home}</div></div>
      <div class="match-center">
        ${dateLbl}<div class="grp-lbl">Jogo ${groupMatchCount}/6</div>
        <div class="match-score-row">
          <input class="score-input mp" type="number" min="0" max="20" placeholder="-" data-mid="${m.id}" data-side="home" value="${pred.home}" ${!editable?'disabled':''}>
          <span class="score-sep">:</span>
          <input class="score-input mp" type="number" min="0" max="20" placeholder="-" data-mid="${m.id}" data-side="away" value="${pred.away}" ${!editable?'disabled':''}>
        </div>
        ${act&&act.home!==undefined&&act.home!==''?`<span class="actual-badge">✅ ${act.home}-${act.away}</span>`:''}
        ${ptsH}
      </div>
      <div class="match-team away"><div>${fi(m.away,30)}</div><div class="team-name">${m.away}</div></div>
    </div>`;
  }
  if(cg) html+='</div></div>';
  c.innerHTML=html;
  if(editable){
    c.querySelectorAll('.mp').forEach(inp=>{
      // Ensure mobile keyboards show integer-only keypads
      inp.setAttribute('inputmode','numeric');
      inp.setAttribute('pattern','[0-9]*');
    });
    c.querySelectorAll('.mp').forEach(inp=>inp.addEventListener('input',e=>{
      const mid=e.target.dataset.mid,side=e.target.dataset.side;
      // Strip ANYTHING that isn't a digit: minus signs, decimals, letters, etc.
      // This handles values like "0.5", "-3", ".", "1e2" - all become digits-only
      // or empty. We sanitise the displayed text first, then clamp 0-20.
      let raw=String(e.target.value||'').replace(/[^0-9]/g,'');
      if(raw!==''){
        let n=parseInt(raw,10);
        if(isNaN(n)||n<0) n=0;
        if(n>20) n=20;
        raw=String(n);
      }
      if(raw!==e.target.value) e.target.value=raw;
      if(!userPredictions[mid]) userPredictions[mid]={home:'',away:''};
      userPredictions[mid][side]=raw;
      hasUnsavedEdits=true;
      updateAdvanceBtn();
    }));
    // Block keys that produce non-digit values (decimals, signs, exponent, etc.)
    c.querySelectorAll('.mp').forEach(inp=>inp.addEventListener('keydown',e=>{
      if(['-','+','.',',','e','E','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
    }));
    // Also strip on paste (someone pasting "0.5" or "1,5")
    c.querySelectorAll('.mp').forEach(inp=>inp.addEventListener('paste',e=>{
      e.preventDefault();
      const text=(e.clipboardData||window.clipboardData).getData('text');
      const clean=String(text||'').replace(/[^0-9]/g,'').slice(0,2);
      let n=parseInt(clean,10);
      if(isNaN(n)) return;
      if(n<0)n=0;if(n>20)n=20;
      inp.value=String(n);
      inp.dispatchEvent(new Event('input',{bubbles:true}));
    }));
  }
}

// ═══ GRUPOS TAB ═══
function renderGruposTab(){
  const c=$('grupos-content');if(!c) return;
  const uid=currentUser?.uid;
  const predScores=allPredictions[uid]||{};
  const note=$('grupos-note');
  if(note) note.textContent=lang==='pt'?
    'Esquerda: as tuas previsões. Direita: resultados reais (zeros enquanto não há resultados).':
    'Left: your predictions. Right: real results (zeros until results are available).';

  function buildTable(scores,grp,cssClass){
    const s=groupStandings(grp,scores);
    const titleCls=cssClass==='pred'?'gt-pred':'gt-real';
    const titleTxt=cssClass==='pred'?t('predTable'):t('realTable');
    return`<div class="grupos-table-wrap">
      <span class="grupos-table-title ${titleCls}">${titleTxt}</span>
      <table class="gct"><thead><tr>
        <th style="text-align:left">${lang==='pt'?'Equipa':'Team'}</th>
        <th>P</th><th class="gct-hm">V</th><th class="gct-hm">E</th><th class="gct-hm">D</th>
        <th class="gct-hm">GM</th><th class="gct-hm">GS</th><th>DG</th><th>Pts</th>
      </tr></thead><tbody>
      ${s.map((tm,i)=>`<tr>
        <td><span class="${i<2?'qb':i===2?'qb3':''}"></span>${fi(tm.name,16)} ${tm.name}</td>
        <td>${tm.P}</td>
        <td class="gct-hm">${tm.W}</td><td class="gct-hm">${tm.D}</td><td class="gct-hm">${tm.L}</td>
        <td class="gct-hm">${tm.GF}</td><td class="gct-hm">${tm.GA}</td>
        <td style="color:${tm.GD>0?'var(--green)':tm.GD<0?'var(--red)':'inherit'}">${tm.GD>0?'+':''}${tm.GD}</td>
        <td style="font-weight:800">${tm.Pts}</td>
      </tr>`).join('')}
      </tbody></table>
    </div>`;
  }
  let html='';
  for(const grp of Object.keys(GROUPS)){
    html+=`<div style="margin-bottom:20px">
      <div style="font-family:var(--fh);font-size:1rem;color:var(--gold);letter-spacing:1px;margin-bottom:8px">${lang==='pt'?'Grupo':'Group'} ${grp}</div>
      <div class="grupos-pair">
        ${buildTable(predScores,grp,'pred')}
        ${buildTable(actualScores,grp,'real')}
      </div>
    </div>`;
  }
  const predThirds=getBestThirds(predScores);
  const realThirds=getBestThirds(actualScores);
  function thirdsBox(thirds,cssClass){
    const titleCls=cssClass==='pred'?'gt-pred':'gt-real';
    const titleTxt=cssClass==='pred'?t('predTable'):t('realTable');
    return`<div class="thirds-box">
      <span class="thirds-title ${titleCls}" style="font-size:.63rem;letter-spacing:1px;text-transform:uppercase;font-weight:700;padding:2px 5px;border-radius:3px;">${titleTxt}</span>
      ${thirds.map((tm,i)=>`<div class="third-team">
        <span style="color:var(--gold);font-family:var(--fh);font-size:.8rem;min-width:16px">${i+1}</span>
        ${fi(tm.name,16)} ${tm.name}
        <span style="color:var(--muted);font-size:.68rem;margin-left:auto">${tm.Pts}pts DG:${tm.GD>0?'+':''}${tm.GD}</span>
      </div>`).join('')}
    </div>`;
  }
  html+=`<div style="margin-bottom:10px">
    <div style="font-family:var(--fh);font-size:.85rem;color:var(--gold);letter-spacing:1px;margin-bottom:7px">${t('bestThirds')}</div>
    <div class="thirds-pair">${thirdsBox(predThirds,'pred')}${thirdsBox(realThirds,'real')}</div>
  </div>`;
  c.innerHTML=html;
}

// ═══ BRACKET - Road to Final (NEW: cascading, empty until clicked) ═══
function getBP(){return userPredictions.bracket||{r32:[],r16:[],qf:[],sf:[],f3:[],fin:[],win:[]};}
function setBP(bp){userPredictions.bracket=bp;}

function pickWinner(round,matchIdx,team){
  if(!canEdit(currentUser?.uid)) return;
  const bp={...getBP()};
  if(!bp[round]) bp[round]=[];
  const r32=getR32Teams(currentUser?.uid);

  // Resolve the two teams that should be in this match RIGHT NOW
  function pairFor(r,idx){
    if(r==='r32') return [r32[idx]?.home,r32[idx]?.away];
    if(r==='r16') return [getWinner('r32',idx*2),getWinner('r32',idx*2+1)];
    if(r==='qf')  return [getWinner('r16',idx*2),getWinner('r16',idx*2+1)];
    if(r==='sf')  return [getWinner('qf',idx*2),getWinner('qf',idx*2+1)];
    if(r==='fin') return [getWinner('sf',0),getWinner('sf',1)];
    if(r==='f3')  return getThirdPlaceTeams();
    return [null,null];
  }
  const [tA,tB]=pairFor(round,matchIdx);
  // Refuse to set a winner that isn't in this match (prevents stale picks
  // from re-appearing as if valid)
  if(team!==tA&&team!==tB) return;

  // If the user is changing a previously-set pick, clear everything that
  // depended on the old pick so we don't carry forward an impossible team
  const prev=bp[round]&&bp[round][matchIdx];
  if(prev&&prev!==team){
    clearDownstreamPicks(bp,round,matchIdx);
  }

  bp[round][matchIdx]=team;

  // Compute loser for special cases (f3 derived from SF, runner-up = final loser)
  const loser=team===tA?tB:tA;

  if(round==='fin'){
    if(!bp.fin) bp.fin=[];
    bp.fin[1]=loser;
  }

  setBP(bp);
  hasUnsavedEdits=true;
  renderBracket();renderBracketMobile();renderBracketSwipe();
}
function getActualWinner(round,matchIdx){
  const ak=actualScores[`ko_${round}`];
  return ak&&ak[matchIdx]?ak[matchIdx]:null;
}

// Build a single bracket match node
function bNode(predA,predB,realA,realB,round,matchIdx,editable){
  // predA/predB = teams in this slot per the USER'S bracket (always shown).
  // realA/realB = teams really occupying this slot (shown in gold when known).
  if(!predA||predA==='') predA='TBD';
  if(!predB||predB==='') predB='TBD';
  const bp=getBP();
  const pick=bp[round]&&bp[round][matchIdx]; // user's winner pick — always shown, never filtered
  const isEmpty=(predA==='TBD'&&predB==='TBD');
  const pts=KO_ROUNDS.find(r=>r.id===round)?.pts||0;

  // Green = the user's predicted winner for this slot.
  function teamCls(team){ if(!team||team==='TBD') return ''; return pick===team?'correct':''; }
  // Gold tag = the real team in that position (only when known)
  function goldTag(realTeam){ if(!realTeam||realTeam==='TBD') return ''; return `<span class="b-gold-tag">${fi(realTeam,12)}${realTeam.split(' ')[0]}</span>`; }

  const clickable=editable&&!isEmpty;
  const clkA=clickable&&predA!=='TBD'?`onclick="pickWinner('${round}',${matchIdx},'${attrEsc(predA)}')"`:'';
  const clkB=clickable&&predB!=='TBD'?`onclick="pickWinner('${round}',${matchIdx},'${attrEsc(predB)}')"`:'';

  return`<div class="b-match${clickable?' clickable':''}${isEmpty?' empty':''}">
    <div class="b-team ${teamCls(predA)}${clickable?' clickable':''}" ${clkA}>
      ${predA!=='TBD'?fi(predA,15):''}<span class="b-team-name">${predA==='TBD'?'–':predA}</span>${goldTag(realA)}
    </div>
    <div class="b-team ${teamCls(predB)}${clickable?' clickable':''}" ${clkB}>
      ${predB!=='TBD'?fi(predB,15):''}<span class="b-team-name">${predB==='TBD'?'–':predB}</span>${goldTag(realB)}
    </div>
  </div>`;
}

// Get the winner of a match (user pick or actual)
function getWinner(round,idx){
  const bp=getBP();const actual=getActualWinner(round,idx);
  if(actual) return actual;
  return bp[round]&&bp[round][idx]?bp[round][idx]:null;
}

// Derive the two teams that meet in the 3rd-place playoff: the losers of the
// two semifinals. This is computed live from the current SF picks so it never
// goes stale when the user changes their bracket upstream.
function getThirdPlaceTeams(){
  function loser(sfIdx){
    const a=getWinner('qf',sfIdx*2);
    const b=getWinner('qf',sfIdx*2+1);
    if(!a||!b) return null;
    const winner=getWinner('sf',sfIdx);
    if(!winner) return null;
    if(winner!==a&&winner!==b) return null; // stale pick, ignore
    return winner===a?b:a;
  }
  return [loser(0),loser(1)];
}

// Clear picks in later rounds when an earlier-round winner changes. Without
// this, picks for r16/qf/sf/etc. can reference a team that's no longer
// progressing through that path, leading to weird states like the same team
// appearing in both 3rd-place slots.
function clearDownstreamPicks(bp,round,matchIdx){
  const order=['r32','r16','qf','sf','fin'];
  const i=order.indexOf(round);
  if(i<0) return;
  // For each later round, the affected slot index halves each time we go up.
  let affected=matchIdx;
  for(let j=i+1;j<order.length;j++){
    affected=Math.floor(affected/2);
    const r=order[j];
    if(bp[r]&&bp[r][affected]!==undefined) bp[r][affected]=undefined;
  }
  // f3 and win are derived from sf/fin; clear them too
  bp.f3=[];
  if(bp.win)bp.win=[];
  if(bp.fin&&bp.fin[1]!==undefined) bp.fin[1]=undefined;
}

function renderBracket(){
  const c=$('bracket-content');if(!c) return;
  const uid=currentUser?.uid;
  const sub=!!(allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0);
  const editable=canEdit(uid);
  if(!sub&&!isAdmin){c.innerHTML=`<div style="text-align:center;padding:28px;color:var(--muted)">${t('brLocked')}</div>`;return;}
  const r32pred=getR32Teams(uid,true);          // user's predicted R32 matchups
  const realGroups=ALL_MATCHES.some(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';});
  const r32real=realGroups?getR32Teams(uid,false):null; // real R32 matchups (null until groups done)
  const bp=getBP();
  const koR=r=>actualScores[`ko_${r}`]||[];
  // predicted team in (prevRound winners) feeding a slot, and the real team there
  const predFeed=(prev,idx)=>bp[prev]?.[idx]||null;
  const realFeed=(prev,idx)=>koR(prev)[idx]||null;

  function r16Teams(i){return{pa:predFeed('r32',i*2),pb:predFeed('r32',i*2+1),ra:realFeed('r32',i*2),rb:realFeed('r32',i*2+1)};}
  function qfTeams(i){return{pa:predFeed('r16',i*2),pb:predFeed('r16',i*2+1),ra:realFeed('r16',i*2),rb:realFeed('r16',i*2+1)};}
  function sfTeams(i){return{pa:predFeed('qf',i*2),pb:predFeed('qf',i*2+1),ra:realFeed('qf',i*2),rb:realFeed('qf',i*2+1)};}
  const finPA=predFeed('sf',0),finPB=predFeed('sf',1),finRA=realFeed('sf',0),finRB=realFeed('sf',1);
  const [f3A,f3B]=getThirdPlaceTeams();
  // real 3rd-place teams = real semifinal losers (real QF winners not in real SF winners)
  const realSfWinners=new Set(koR('sf').filter(Boolean));
  const realSfLosers=koR('qf').filter(t=>t&&!realSfWinners.has(t));
  const f3RA=realSfLosers[0]||null,f3RB=realSfLosers[1]||null;
  const champion=getWinner('fin',0)||null;
  const runnerUp=getBP().fin?.[1]||null;
  const third=getWinner('f3',0)||null;

  const MH=62;const GAP=2;

  function r32Col(startIdx,hdr){
    const nodes=Array.from({length:8},(_,i)=>{
      const p=r32pred[startIdx+i]||{},r=r32real?(r32real[startIdx+i]||{}):{};
      return bNode(p.home||'TBD',p.away||'TBD',r.home||null,r.away||null,'r32',startIdx+i,editable);
    });
    return`<div class="b-col"><div class="b-col-hdr">${hdr}</div>${nodes.join('')}</div>`;
  }
  function r16Col(startIdx){
    const spacerTop=`<div style="height:${MH/2+GAP}px"></div>`;
    const spacerBetween=`<div style="height:${MH+GAP*2}px"></div>`;
    let html=`<div class="b-col"><div class="b-col-hdr">R16</div>${spacerTop}`;
    for(let i=0;i<4;i++){
      const{pa,pb,ra,rb}=r16Teams(startIdx+i);
      html+=bNode(pa,pb,ra,rb,'r16',startIdx+i,editable);
      if(i<3) html+=spacerBetween;
    }
    return html+`</div>`;
  }
  function qfCol(startIdx){
    const spacerTop=`<div style="height:${MH*1.5+GAP*3}px"></div>`;
    const spacerBetween=`<div style="height:${MH*3+GAP*6}px"></div>`;
    let html=`<div class="b-col"><div class="b-col-hdr">QF</div>${spacerTop}`;
    for(let i=0;i<2;i++){
      const{pa,pb,ra,rb}=qfTeams(startIdx+i);
      html+=bNode(pa,pb,ra,rb,'qf',startIdx+i,editable);
      if(i<1) html+=spacerBetween;
    }
    return html+`</div>`;
  }
  function sfSingle(sfIdx,tm){
    const spacer=`<div style="height:${MH*3.5+GAP*7}px"></div>`;
    return`<div class="b-col"><div class="b-col-hdr">SF</div>${spacer}${bNode(tm.pa,tm.pb,tm.ra,tm.rb,'sf',sfIdx,editable)}</div>`;
  }

  function resultSlot(medal,name,label){
    if(!name) return`<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(255,255,255,.04);border-radius:6px;opacity:.4"><span>${medal}</span><span style="font-size:.7rem;color:var(--muted)">–</span></div>`;
    return`<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(255,255,255,.06);border-radius:6px">
      <span style="font-size:.9rem">${medal}</span>
      ${fi(name,16)}
      <span style="font-size:.72rem;font-weight:700;flex:1">${name}</span>
      <span style="font-size:.6rem;color:var(--muted)">${label}</span>
    </div>`;
  }

  const sf0t=sfTeams(0);const sf1t=sfTeams(1);

  const centreHtml=`<div class="b-centre">
    <div class="b-col-hdr" style="width:100%;text-align:center">🏆 FINAL</div>
    <div class="b-trophy">🏆</div>
    ${bNode(finPA,finPB,finRA,finRB,'fin',0,editable)}
    <div style="margin-top:8px;width:100%">
      <div class="b-bronze-lbl" style="margin-bottom:4px">🥉 ${lang==='pt'?'3.º LUGAR':'3RD PLACE'}</div>
      ${bNode(f3A,f3B,f3RA,f3RB,'f3',0,editable)}
    </div>
    <div style="margin-top:10px;width:100%;border-top:1px solid var(--border);padding-top:8px;display:flex;flex-direction:column;gap:4px">
      <div style="font-family:var(--fh);font-size:.6rem;color:var(--gold);letter-spacing:1px;text-align:center;margin-bottom:3px">${lang==='pt'?'RESULTADOS FINAIS':'FINAL RESULTS'}</div>
      ${resultSlot('🥇',champion,lang==='pt'?'Campeão':'Champion')}
      ${resultSlot('🥈',runnerUp,lang==='pt'?'Vice-campeão':'Runner-up')}
      ${resultSlot('🥉',third,lang==='pt'?'3.º lugar':'3rd place')}
    </div>
  </div>`;

  const html=`<div class="bracket-grid">
    ${r32Col(0,'R32 · '+t('pathway1'))}
    ${r16Col(0)}
    ${qfCol(0)}
    ${sfSingle(0,sf0t)}
    ${centreHtml}
    ${sfSingle(1,sf1t)}
    ${qfCol(2)}
    ${r16Col(4)}
    ${r32Col(8,'R32 · '+t('pathway2'))}
  </div>`;
  c.innerHTML=html;
  const ts=$('topscorer-input');if(ts) ts.value=userPredictions.topScorer||'';
}
function renderBracketMobile(){
  const c=$('bracket-mobile');if(!c) return;
  const uid=currentUser?.uid;
  const sub=!!(allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0);
  const editable=canEdit(uid);
  if(!sub&&!isAdmin){c.innerHTML=`<div style="text-align:center;padding:24px;color:var(--muted)">${t('brLocked')}</div>`;return;}
  const r32=getR32Teams(uid);

  function mTeam(team,round,matchIdx,pairOther){
    if(!team||team==='TBD') return`<div class="bm-team" style="opacity:.35;cursor:default"><span style="flex:1;color:var(--muted)">–</span></div>`;
    const bp=getBP();let pick=bp[round]&&bp[round][matchIdx];
    // Ignore stale picks that don't belong to either current team
    if(pick&&pick!==team&&pick!==pairOther) pick=null;
    const actual=getActualWinner(round,matchIdx);
    let cls='';
    if(actual){cls=actual===team?(pick===team?'correct':''):'loser';}
    else if(pick===team) cls='selected';
    const pts=KO_ROUNDS.find(r=>r.id===round)?.pts||0;
    const ptsStr=actual&&pick===team&&actual===team?`+${pts}pts`:'';
    return`<div class="bm-team ${cls}" onclick="pickWinner('${round}',${matchIdx},'${attrEsc(team)}')">
      ${fi(team,22)}<span style="flex:1">${team}</span>
      ${ptsStr?`<span style="color:var(--gold);font-size:.72rem">${ptsStr}</span>`:''}
    </div>`;
  }
  function mMatch(tA,tB,round,idx,empty=false){
    if(!tA) tA='';if(!tB) tB='';
    return`<div class="bm-match${empty?' empty':''}">
      ${mTeam(tA,round,idx,tB)}${mTeam(tB,round,idx,tA)}
    </div>`;
  }

  function getWinnerM(round,idx){return getWinner(round,idx)||null;}

  let html=`<div class="bracket-instruction" style="margin-bottom:12px">
    <strong>👆 ${t('clickWinner')}</strong> ${lang==='pt'?'para avançar para a próxima ronda.':'to advance to the next round.'}
  </div>`;

  // R32
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>R32 – ${t('pathway1')}</span><span style="font-size:.7rem;color:var(--muted)">+5pts</span></div>
  ${Array.from({length:8},(_,i)=>mMatch(r32[i]?.home,r32[i]?.away,'r32',i)).join('')}</div>`;
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>R32 – ${t('pathway2')}</span><span style="font-size:.7rem;color:var(--muted)">+5pts</span></div>
  ${Array.from({length:8},(_,i)=>mMatch(r32[8+i]?.home,r32[8+i]?.away,'r32',8+i)).join('')}</div>`;

  // R16 - only show if R32 picks exist
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>${lang==='pt'?'Oitavos de Final':'Round of 16'}</span><span style="font-size:.7rem;color:var(--muted)">+10pts</span></div>
  ${Array.from({length:8},(_,i)=>{const a=getWinnerM('r32',i*2),b=getWinnerM('r32',i*2+1);return mMatch(a,b,'r16',i,!a&&!b);}).join('')}</div>`;

  // QF
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>${lang==='pt'?'Quartos de Final':'Quarterfinals'}</span><span style="font-size:.7rem;color:var(--muted)">+10pts</span></div>
  ${Array.from({length:4},(_,i)=>{const a=getWinnerM('r16',i*2),b=getWinnerM('r16',i*2+1);return mMatch(a,b,'qf',i,!a&&!b);}).join('')}</div>`;

  // SF
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>${lang==='pt'?'Meias-Finais':'Semifinals'}</span><span style="font-size:.7rem;color:var(--muted)">+15pts</span></div>
${[0,1].map(i=>{const a=getWinnerM('qf',i*2),b=getWinnerM('qf',i*2+1);return mMatch(a,b,'sf',i,!a&&!b);}).join('')}</div>`;
  // Final & 3rd place
 const finA=getWinnerM('sf',0),finB=getWinnerM('sf',1);
  const [f3A,f3B]=getThirdPlaceTeams();
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>${lang==='pt'?'Final':'Final'}</span><span style="font-size:.7rem;color:var(--muted)">+25pts</span></div>
  ${mMatch(finA,finB,'fin',0,!finA&&!finB)}</div>`;
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>🥉 ${lang==='pt'?'3.º Lugar':'3rd Place'}</span><span style="font-size:.7rem;color:var(--muted)">+25pts</span></div>
  ${mMatch(f3A,f3B,'f3',0,!f3A&&!f3B)}</div>`;

  // Champion (auto-derived from Final pick - not clickable)
  const finWin=getWinnerM('fin',0);
  const actualChamp=getActualWinner('fin',0);
  let champCls='';
  if(actualChamp){champCls=finWin===actualChamp?'correct':'wrong';}
  html+=`<div class="bm-round"><div class="bm-rnd-hdr"><span>🏆 ${lang==='pt'?'Campeão':'Champion'}</span><span style="font-size:.7rem;color:var(--muted)">${lang==='pt'?'auto':'auto'}</span></div>
  <div class="bm-match${!finWin?' empty':''}">
    ${finWin?`<div class="bm-team ${champCls}" style="cursor:default">${fi(finWin,22)}<span style="flex:1">${finWin}</span></div>`:`<div class="bm-team" style="opacity:.35;cursor:default"><span style="flex:1;color:var(--muted)">${lang==='pt'?'Aguardar final':'Awaiting final'}</span></div>`}
  </div></div>`;

  c.innerHTML=html;
  const ts=$('topscorer-input');if(ts) ts.value=userPredictions.topScorer||'';
}

function renderBracketSwipe(){
  const c=$('bracket-swipe-inner');if(!c) return;
  const nav=$('bracket-swipe-nav');
  const uid=currentUser?.uid;
  const sub=!!(allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0);
  if(!sub&&!isAdmin){c.innerHTML=`<div style="text-align:center;padding:24px;color:var(--muted);min-width:90vw">${t('brLocked')}</div>`;if(nav)nav.innerHTML='';return;}
  const r32pred=getR32Teams(uid,true);
  const realGroups=ALL_MATCHES.some(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';});
  const r32real=realGroups?getR32Teams(uid,false):null;
  const bp2=getBP();
  const koR=r=>actualScores[`ko_${r}`]||[];

  // team = predicted team in this slot; realTeam = real team there (gold)
  function mTeam(team,realTeam,round,matchIdx){
    if(!team||team==='TBD'){
      const gold=realTeam&&realTeam!=='TBD'?`<span class="bm-gold-tag">${fi(realTeam,18)}${realTeam.split(' ')[0]}</span>`:'';
      return`<div class="bm-team" style="opacity:${gold?'.9':'.35'};cursor:default"><span style="flex:1;color:var(--muted)">–</span>${gold}</div>`;
    }
    const pick=bp2[round]&&bp2[round][matchIdx];
    const cls=pick===team?'correct':'';
    const gold=realTeam&&realTeam!=='TBD'?`<span class="bm-gold-tag">${fi(realTeam,18)}${realTeam.split(' ')[0]}</span>`:'';
    return`<div class="bm-team ${cls}" onclick="pickWinner('${round}',${matchIdx},'${attrEsc(team)}')">
      ${fi(team,22)}<span style="flex:1">${team}</span>${gold}
    </div>`;
  }
  function mMatch(pA,pB,rA,rB,round,idx,empty=false){
    if(!pA) pA='';if(!pB) pB='';
    return`<div class="bm-match${empty?' empty':''}">
      ${mTeam(pA,rA,round,idx)}${mTeam(pB,rB,round,idx)}
    </div>`;
  }
  const predFeed=(prev,idx)=>bp2[prev]?.[idx]||null;
  const realFeed=(prev,idx)=>koR(prev)[idx]||null;
  const realSfWinners=new Set(koR('sf').filter(Boolean));
  const realSfLosers=koR('qf').filter(t=>t&&!realSfWinners.has(t));

  const rounds=[
    {id:'r32a',title:`R32 – ${t('pathway1')}`,pts:5,content:()=>Array.from({length:8},(_,i)=>{const p=r32pred[i]||{},r=r32real?(r32real[i]||{}):{};return mMatch(p.home,p.away,r.home,r.away,'r32',i);}).join('')},
    {id:'r32b',title:`R32 – ${t('pathway2')}`,pts:5,content:()=>Array.from({length:8},(_,i)=>{const p=r32pred[8+i]||{},r=r32real?(r32real[8+i]||{}):{};return mMatch(p.home,p.away,r.home,r.away,'r32',8+i);}).join('')},
    {id:'r16',title:lang==='pt'?'Oitavos':'R16',pts:10,content:()=>Array.from({length:8},(_,i)=>{const pa=predFeed('r32',i*2),pb=predFeed('r32',i*2+1),ra=realFeed('r32',i*2),rb=realFeed('r32',i*2+1);return mMatch(pa,pb,ra,rb,'r16',i,!pa&&!pb&&!ra&&!rb);}).join('')},
    {id:'qf',title:lang==='pt'?'Quartos':'Quarterfinals',pts:10,content:()=>Array.from({length:4},(_,i)=>{const pa=predFeed('r16',i*2),pb=predFeed('r16',i*2+1),ra=realFeed('r16',i*2),rb=realFeed('r16',i*2+1);return mMatch(pa,pb,ra,rb,'qf',i,!pa&&!pb&&!ra&&!rb);}).join('')},
    {id:'sf',title:lang==='pt'?'Meias-Finais':'Semifinals',pts:15,content:()=>[0,1].map(i=>{const pa=predFeed('qf',i*2),pb=predFeed('qf',i*2+1),ra=realFeed('qf',i*2),rb=realFeed('qf',i*2+1);return mMatch(pa,pb,ra,rb,'sf',i,!pa&&!pb&&!ra&&!rb);}).join('')},
    {id:'fin',title:lang==='pt'?'Final':'Final',pts:25,content:()=>{const pa=predFeed('sf',0),pb=predFeed('sf',1),ra=realFeed('sf',0),rb=realFeed('sf',1);return mMatch(pa,pb,ra,rb,'fin',0,!pa&&!pb&&!ra&&!rb);}},
    {id:'f3',title:'🥉 '+(lang==='pt'?'3.º Lugar':'3rd Place'),pts:25,content:()=>{const [pa,pb]=getThirdPlaceTeams();return mMatch(pa,pb,realSfLosers[0]||null,realSfLosers[1]||null,'f3',0,!pa&&!pb&&!realSfLosers.length);}},
    {id:'podium',title:'🏆 '+(lang==='pt'?'Pódio Final':'Final Podium'),pts:30,content:()=>{
      const champion=getWinner('fin',0)||null;
      const runnerUp=getBP().fin?.[1]||null;
      const third=getWinner('f3',0)||null;
      function row(medal,name,label,colorVar){
        if(!name){
          return`<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:8px;opacity:.4">
            <span style="font-size:1.4rem">${medal}</span>
            <div style="flex:1"><div style="font-size:.65rem;color:var(--muted);letter-spacing:1px">${label}</div><div style="font-size:.85rem;color:var(--muted)">–</div></div>
          </div>`;
        }
        return`<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,255,255,.06);border-radius:10px;margin-bottom:8px;border-left:3px solid ${colorVar}">
          <span style="font-size:1.4rem">${medal}</span>
          ${fi(name,28)}
          <div style="flex:1"><div style="font-size:.62rem;color:var(--muted);letter-spacing:1px">${label}</div><div style="font-size:.95rem;font-weight:700">${name}</div></div>
        </div>`;
      }
      return`<div style="margin-top:4px">
        ${row('🥇',champion,lang==='pt'?'CAMPEÃO':'CHAMPION','var(--gold)')}
        ${row('🥈',runnerUp,lang==='pt'?'VICE-CAMPEÃO':'RUNNER-UP','#C0C0C0')}
        ${row('🥉',third,lang==='pt'?'3.º LUGAR':'3RD PLACE','#cd7f32')}
      </div>`;
    }},
  ];
  
  // Preserve scroll position across re-renders. iOS Safari (and some other
  // browsers) reset scrollLeft to 0 when innerHTML is replaced - which would
  // snap the user back to the first slide after they tap a winner.
  const swipeContainer=$('bracket-swipe');
  const savedScroll=swipeContainer?swipeContainer.scrollLeft:0;

  c.innerHTML=rounds.map((r,i)=>`<div class="bracket-swipe-round" data-round="${i}">
    <div class="bm-rnd-hdr"><span>${r.title}</span><span style="font-size:.7rem;color:var(--muted)">+${r.pts}pts</span></div>
    <div style="margin-top:8px">${r.content()}</div>
  </div>`).join('');

  // Restore scroll position. Use both a sync and an rAF restore: the sync one
  // covers most browsers; the rAF one catches iOS Safari which occasionally
  // resets scrollLeft AFTER the synchronous innerHTML assignment completes.
  if(swipeContainer){
    swipeContainer.scrollLeft=savedScroll;
    requestAnimationFrame(()=>{swipeContainer.scrollLeft=savedScroll;});
  }

  if(nav){
    nav.innerHTML=rounds.map((_,i)=>`<div class="bracket-nav-dot ${i===0?'active':''}" data-idx="${i}"></div>`).join('');
    const container=$('bracket-swipe');
    const updateDots=()=>{
      const scrollLeft=container.scrollLeft;
      const itemWidth=container.scrollWidth/rounds.length;
      const activeIdx=Math.round(scrollLeft/itemWidth);
      nav.querySelectorAll('.bracket-nav-dot').forEach((d,i)=>d.classList.toggle('active',i===activeIdx));
    };
    // Only attach the scroll listener once - otherwise every re-render piles
    // on a new listener, leaking memory and firing updateDots N times per scroll
    if(!container._dotsListenerAttached){
      container.addEventListener('scroll',()=>{
        // Read fresh nav each time since renderBracketSwipe re-builds the dots
        const n=$('bracket-swipe-nav');if(!n) return;
        const scrollLeft=container.scrollLeft;
        const itemWidth=container.scrollWidth/(n.children.length||1);
        const activeIdx=Math.round(scrollLeft/itemWidth);
        n.querySelectorAll('.bracket-nav-dot').forEach((d,i)=>d.classList.toggle('active',i===activeIdx));
      });
      container._dotsListenerAttached=true;
    }
    updateDots(); // initial sync so the right dot lights up after restore
    nav.querySelectorAll('.bracket-nav-dot').forEach(d=>d.addEventListener('click',()=>{
      const idx=parseInt(d.dataset.idx);
      const itemWidth=container.scrollWidth/rounds.length;
      container.scrollTo({left:idx*itemWidth,behavior:'smooth'});
    }));
  }
  const ts=$('topscorer-input');if(ts) ts.value=userPredictions.topScorer||'';
}

function calcMatch(pred,act){
  if(!pred||!act) return null;
  if(pred.home===''||pred.home===undefined||pred.home===null) return null;
  if(pred.away===''||pred.away===undefined||pred.away===null) return null;
  if(act.home===undefined||act.home===''||act.home===null) return null;
  if(act.away===undefined||act.away===''||act.away===null) return null;
  // Clamp to a sane range. Legacy/corrupt data could contain negative values
  // (e.g. a "-2" entered before input hardening), which would otherwise inflate
  // the goal-difference penalty wildly (a predicted 2-3 vs an actual -2-4 would
  // wrongly score -5 instead of -1). Scores can only be 0..20.
  const cl=v=>{let n=parseInt(v,10);if(isNaN(n))return NaN;return Math.max(0,Math.min(20,n));};
  const ph=cl(pred.home),pa=cl(pred.away),ah=cl(act.home),aa=cl(act.away);
  if(isNaN(ph)||isNaN(pa)||isNaN(ah)||isNaN(aa)) return null;
  if(ph===ah&&pa===aa) return rules.correct_result;
  const po=ph>pa?'H':ph<pa?'A':'D',ao=ah>aa?'H':ah<aa?'A':'D';
  let p=0;
  if(po!==ao){
    // -4 if predicted the opposite winner (H→A or A→H), -2 if one side is a draw
    const oppositeWinner=(po==='H'&&ao==='A')||(po==='A'&&ao==='H');
    p+=oppositeWinner?(rules.wrong_outcome_win??-4):(rules.wrong_outcome??-2);
  }
  p+=(Math.abs(ph-ah)+Math.abs(pa-aa))*rules.wrong_goal;
  return p;
}
