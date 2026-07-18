// ═══ SHARE / CSV ═══
async function shareLeaderboard(){
  // The share image is drawn from lbRows, which is empty while the table is
  // hidden — it would produce a blank board. Nothing to share.
  if(HIDE_LEADERBOARD) return;
  const canvas=$('lb-canvas');const wrap=$('lb-canvas-wrap');
  // Use the EXACT rows the leaderboard computed (same order, tiebreakers, submitted handling)
  if(!lbRows.length) renderLeaderboard();
  const rows=lbRows;
  const W=600,RH=46,HEAD=84,COLH=24,FOOT=38,H=HEAD+COLH+rows.length*RH+FOOT;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0D1B2A';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#FFD700';ctx.font='bold 22px Georgia,serif';ctx.textAlign='center';ctx.fillText('PREVISÕES DO PROFESSOR KARAMBA',W/2,34);
  ctx.fillStyle='#7a94b0';ctx.font='12px Georgia,serif';ctx.fillText(new Date().toLocaleDateString(),W/2,54);
  ctx.fillStyle='#7a94b0';ctx.font='11px Georgia,serif';ctx.fillText('Classificação',W/2,72);
  // Column layout
  const X_RANK=16, X_NAME=92, X_TODAY=430, X_TOTAL=W-16;
  // Column headers
  const cy=HEAD+16;
  ctx.fillStyle='#5a7290';ctx.font='bold 11px Georgia,serif';
  ctx.textAlign='left';ctx.fillText('#',X_RANK,cy);ctx.fillText('JOGADOR',X_NAME,cy);
  ctx.textAlign='right';ctx.fillText(STATIC_LEADERBOARD?'R32':'HOJE',X_TODAY,cy);ctx.fillText('TOTAL',X_TOTAL,cy);
  // Day-over-day rank movement: rank at start of day (from dailySnapshot points)
  // vs current rank. More meaningful and stable than the ephemeral last-refresh trend.
  const startRank={};
  [...rows].map(r=>({uid:r.uid,sp:dailySnapshot[r.uid]!==undefined?dailySnapshot[r.uid]:r.pts,sub:r.sub}))
    .sort((a,b)=>{if(a.sub!==b.sub)return a.sub?-1:1;return b.sp-a.sp;})
    .forEach((r,idx)=>{startRank[r.uid]=idx;});
  rows.forEach((r,i)=>{
    const y=HEAD+COLH+i*RH;
    ctx.fillStyle=i%2?'#0D1B2A':'#162232';ctx.fillRect(0,y,W,RH);
    const rank=i+1;
    // trend = start-of-day rank minus current rank
    let trend='',trendDir=0;
    if(!STATIC_LEADERBOARD&&r.sub&&startRank[r.uid]!==undefined){const d=startRank[r.uid]-i;if(d>0){trend=`↑${d}`;trendDir=1;}else if(d<0){trend=`↓${Math.abs(d)}`;trendDir=-1;}}
    const medals=['🥇','🥈','🥉'];const rankStr=i<3?medals[i]:`${rank}`;
    // rank
    ctx.textAlign='left';ctx.fillStyle='#EEF2FF';ctx.font='bold 14px Georgia,serif';ctx.fillText(rankStr,X_RANK,y+29);
    // trend (green up / red down) right after rank
    if(trend){
      const rkW=ctx.measureText(rankStr).width;
      ctx.fillStyle=trendDir>0?'#2DC653':'#E63946';ctx.font='bold 13px Georgia,serif';
      ctx.fillText(' '+trend,X_RANK+rkW,y+29);
    }
    // name (+ "você" arrow)
    let nm=r.name;
    if(r.isMe||r.uid===currentUser?.uid) nm+=' 👈';
    ctx.fillStyle='#EEF2FF';ctx.font='bold 15px Georgia,serif';ctx.fillText(nm,X_NAME,y+29);
    // today / R32
    ctx.textAlign='right';
    if(STATIC_LEADERBOARD){ctx.fillStyle='#7a94b0';ctx.font='bold 14px Georgia,serif';ctx.fillText(`${r.r32}`,X_TODAY,y+29);}
    else{
      const startPts=dailySnapshot[r.uid]!==undefined?dailySnapshot[r.uid]:r.pts;
      const todayDiff=r.pts-startPts;
      if(!r.sub){ctx.fillStyle='#5a7290';ctx.font='14px Georgia,serif';ctx.fillText('—',X_TODAY,y+29);}
      else{ctx.fillStyle=todayDiff>0?'#2DC653':todayDiff<0?'#E63946':'#7a94b0';ctx.font='bold 14px Georgia,serif';ctx.fillText(todayDiff>0?`+${todayDiff}`:`${todayDiff}`,X_TODAY,y+29);}
    }
    // total
    if(!r.sub){ctx.fillStyle='#5a7290';ctx.font='16px Georgia,serif';ctx.fillText('—',X_TOTAL,y+29);}
    else{ctx.fillStyle=r.pts>=0?'#2DC653':'#E63946';ctx.font='bold 16px Georgia,serif';ctx.fillText(`${r.pts>=0?'+':''}${r.pts}`,X_TOTAL,y+29);}
  });
  ctx.fillStyle='#253a52';ctx.fillRect(0,H-FOOT,W,FOOT);ctx.fillStyle='#7a94b0';ctx.font='11px Georgia,serif';ctx.textAlign='center';ctx.fillText('joaomadeiradoo.github.io/FWF',W/2,H-14);
  wrap.style.display='block';
  // Share immediately on the user gesture. iOS Safari rejects navigator.share
  // calls that happen after an async boundary (like canvas.toBlob's callback),
  // so we convert via synchronous toDataURL -> Blob inside the same tick.
  try{
    if(navigator.share){
      const dataUrl=canvas.toDataURL('image/png');
      const bin=atob(dataUrl.split(',')[1]);
      const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
      const blob=new Blob([arr],{type:'image/png'});
      const f=new File([blob],'classificacao.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){
        navigator.share({files:[f],title:'Classificação FWF'}).catch(()=>{});
      }else{
        navigator.share({title:'Classificação FWF',text:'Classificação FWF'}).catch(()=>{});
      }
    }
  }catch(e){console.warn('share failed:',e);}
}
function downloadLb(){const a=document.createElement('a');a.href=$('lb-canvas').toDataURL();a.download='classificacao.png';a.click();}
function downloadCSV(){
  const groupKeys=Object.keys(GROUPS);
  // Headers: identity, score, group picks, KO picks (meaningful names), all 72 match scores
  const groupH=[
    ...groupKeys.map(g=>`Vencedor Grupo ${g}`),
    ...groupKeys.map(g=>`2º Grupo ${g}`)
  ];
  const koH=[
    ...Array.from({length:16},(_,i)=>`R32 Pick ${i+1}`),
    ...Array.from({length:8},(_,i)=>`R16 Pick ${i+1}`),
    ...Array.from({length:4},(_,i)=>`QF Pick ${i+1}`),
    ...Array.from({length:2},(_,i)=>`SF Pick ${i+1}`),
    '3º Lugar (vencedor)','Campeão (previsto)','Vice-Campeão (previsto)',
  ];
  const mH=ALL_MATCHES.map(m=>`${m.home} vs ${m.away}`);
  const auditH=['Exatos','1os Grupo','2os Grupo','Apurados R32','R32 (chegou R16)','R16 (chegou QF)','QF (chegou Meias)','Apurados Final','3o Lugar','Campeao','Vice','Top Scorer pts','Ajustes'];
  const headers=['Nome','Pts Total',...auditH,'Top Scorer',...groupH,...koH,...mH];
  const rows=Object.entries(allUsers).sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt')).map(([uid,u])=>{
    const pr=allPredictions[uid]||{};
    const bp=pr.bracket||{};
    const pad=(arr,n)=>{const a=Array.isArray(arr)?arr.slice(0,n):[];while(a.length<n)a.push('');return a;};
    // Derive the group 1st/2nd from the player's CURRENT predicted scores, using
    // the same groupStandings() the scorer uses. Previously this exported the
    // stored gw_/gs_ fields — which are a WRITE-ONCE SNAPSHOT: autoGroupKeys()
    // fills them on first submit behind an `if(!userPredictions[k])` guard, so
    // they are never refreshed when a player edits their group scores afterwards.
    // calcBreakdown() derives live from the current scores, so any player who
    // edited after their first submit had a CSV that disagreed with their own
    // score — and any sheet built from that CSV inherited the disagreement.
    // Exporting the derived value makes the CSV and the scorer agree by
    // construction. gw_/gs_ now have no readers anywhere in the app.
    const st=groupKeys.map(g=>groupStandings(g,pr));
    const gw=st.map(x=>(x[0]&&x[0].P>0&&x[0].name)||'');
    const gs=st.map(x=>(x[1]&&x[1].P>0&&x[1].name)||'');
    const koCols=[
      ...pad(bp.r32,16),
      ...pad(bp.r16,8),
      ...pad(bp.qf,4),
      ...pad(bp.sf,2),
      (bp.f3||[])[0]||'',
      ...pad(bp.fin,2),
    ];
    const mp=ALL_MATCHES.map(m=>{const p=pr[m.id]||{};return p.home!==undefined&&p.home!==''?`${p.home}-${p.away}`:''});
    const bd=calcBreakdown(uid),g=bd.dbg;
    const audit=[g.exatos,g.gw,g.gs,g.r32reach,bd.r32,bd.r16,bd.qf,bd.sf,g.f3,g.champ,g.vice,g.top,bd.adj];
    return[u.name,bdTotal(bd),...audit,pr.topScorer||'',...gw,...gs,...koCols,...mp];
  });
  const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='previsoes_karamba.csv';a.click();
}
// ═══ ANTI-COPY GATE (single source of truth) ═══
// A player may see ANYONE ELSE's predictions only after BOTH hold:
//   1) the reveal time has passed (10 min before the first match), AND
//   2) they have submitted their own predictions.
// This is the copying rule. It MUST gate every path that exposes another
// player's picks — the others-predictions table AND the profile modal — or the
// hole reopens on whichever path forgets. Own profile is always visible.
function othersPredsRevealTime(){
  const firstGameTime=new Date('2026-06-11T19:00:00Z'); // first match kickoff (20h Portugal)
  return new Date(firstGameTime.getTime()-10*60*1000);
}
function iHaveSubmitted(){
  return !!(allPredictions[currentUser?.uid]&&Object.keys(allPredictions[currentUser?.uid]).length>0);
}
function canSeeOthersPreds(){
  return new Date()>=othersPredsRevealTime() && iHaveSubmitted();
}
function othersPredsBlockReason(){
  if(new Date()<othersPredsRevealTime())
    return 'Disponível 10 min antes do primeiro jogo para que o Niza não copie pelo Nuno Cordas como costume.';
  return lang==='pt'?'Submete primeiro as tuas previsões para ver as dos outros.':'Submit your predictions first.';
}
function renderOtherPreds(){
  const c=$('op-content');if(!c) return;
  if(!canSeeOthersPreds()){
    const reason=othersPredsBlockReason();
    c.innerHTML=`<p style="color:var(--muted);font-size:.82rem">${reason}</p>`;
    return;
  }
  // All members with predictions, sorted alphabetically
  const members=Object.entries(allUsers)
    .filter(([uid])=>allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0)
    .sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt'));
  if(!members.length){c.innerHTML=`<p style="color:var(--muted);font-size:.82rem">Sem previsões ainda.</p>`;return;}

  // Helper: render one table where cols=matches, rows=players
  function matchTable(matches, getColHeader, getCell, getActual){
    let h=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.68rem">`;
    h+=`<thead><tr><th style="text-align:left;padding:3px 5px;color:var(--muted);white-space:nowrap;min-width:70px">${lang==='pt'?'Jogador':'Player'}</th>`;
    matches.forEach(m=>{h+=`<th style="padding:3px 5px;text-align:center;color:var(--muted);white-space:nowrap;max-width:80px;font-size:.62rem">${getColHeader(m)}</th>`;});
    h+=`<tr></thead><tbody>`;
    members.forEach(([uid,u])=>{
      h+=`<tr style="border-top:1px solid #1e3a5f">`;
      h+=`<td style="padding:3px 5px;white-space:nowrap;font-size:.68rem;font-weight:700">${u.name}</td>`;
      matches.forEach(m=>{
        const {text,style}=getCell(uid,m);
        h+=`<td style="padding:3px 5px;text-align:center;white-space:nowrap;${style}">${text}</td>`;
      });
      h+='</tr>';
    });
    // Real results row
    h+=`<tr style="border-top:2px solid #FFD700">`;
    h+=`<td style="padding:3px 5px;font-size:.62rem;color:#FFD700;font-weight:800">Real</td>`;
    matches.forEach(m=>{const r=getActual(m);h+=`<td style="padding:3px 5px;text-align:center;color:#FFD700;font-weight:800">${r}</td>`;});
    h+='</tr></tbody></table></div>';
    return h;
  }

  let html='';

  // ── GROUP STAGE: one table per day ──
  const parseDate=d=>{if(!d) return 9999;const mth=d.includes('Jul')?700:d.includes('Jun')?600:0;return mth+(parseInt(d,10)||0);};
  const _pt=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Lisbon',month:'numeric',day:'numeric'}).formatToParts(new Date());
  const todayNum=((+_pt.find(p=>p.type==='month').value)===7?700:600)+(+_pt.find(p=>p.type==='day').value);
  const matchDates=[...new Set(ALL_MATCHES.map(m=>m.date).filter(Boolean))].sort((a,b)=>parseDate(a)-parseDate(b));
  function dayDone(d){return ALL_MATCHES.filter(m=>m.date===d).every(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';});}
  // Show today and the next match day only. matchDates is chronological, so the
  // first two dates that are today-or-later are today + the following day. Past
  // days are hidden; nothing beyond the next day is shown.
  const visibleDates=matchDates.filter(d=>parseDate(d)>=todayNum).slice(0,2);
  for(const date of visibleDates){
    const dayMs=ALL_MATCHES.filter(m=>m.date===date);
    html+=`<div style="margin-bottom:18px"><div style="font-size:.75rem;font-weight:800;color:var(--gold);margin-bottom:6px">📅 ${date}</div>`;
    html+=matchTable(dayMs,
      m=>`${m.home.split(' ')[0]}<br>${m.away.split(' ')[0]}`,
      (uid,m)=>{
        const p=(allPredictions[uid]||{})[m.id]||{};
        const pick=p.home!==undefined&&p.home!==''?`${p.home}-${p.away}`:'';
        const act=actualScores[m.id];
        let style='color:#ccd6e0';
        if(pick&&act&&act.home!==undefined){const pts=calcMatch(p,act);style=pts>0?'color:#2dc653':pts<0?'color:#e63946':'color:#8899aa';}
        return{text:pick||'-',style};
      },
      m=>{const a=actualScores[m.id];return a&&a.home!==undefined?`${a.home}-${a.away}`:'-';}
    );
    html+='</div>';
  }

  // ── KO rounds: match-centric, prediction-based colouring ──
  const hasKO=Object.keys(actualScores).some(k=>k.startsWith('ko_r'));
  if(hasKO||matchDates.every(d=>dayDone(d))){
    const abbr=t=>t?(fi(t,14)+t.split(' ')[0]):'?';

    // koTable. reachedFn(uid)->Set of teams the player predicted to REACH this round.
    //   green = predicted to advance (in bp[roundId])
    //   red   = predicted to reach this round but be eliminated here
    //   (team predicted out in an earlier round is NOT shown)
    //   —     = player predicted neither team to reach this round
    function koTable(label, matches, roundId, reachedFn, winnerSet, chunkSize){
      const known=matches.filter(m=>m.home&&m.home!=='?'&&m.away&&m.away!=='?');
      if(!known.length) return '';
      let out=`<div style="margin-bottom:18px"><div style="font-size:.75rem;font-weight:800;color:var(--gold);margin-bottom:6px">📋 ${label}</div>`;
      for(let c0=0;c0<known.length;c0+=chunkSize){
        const chunk=known.slice(c0,c0+chunkSize);
        out+=`<div style="overflow-x:auto;margin-bottom:8px"><table style="width:100%;border-collapse:collapse;font-size:.64rem">`;
        out+=`<thead><tr><th style="text-align:left;padding:3px 4px;color:var(--muted);font-size:.58rem">Jogador</th>`;
        chunk.forEach(m=>{out+=`<th style="padding:3px 4px;color:var(--muted);font-size:.56rem;text-align:center;white-space:nowrap">${abbr(m.home)}<br>${abbr(m.away)}</th>`;});
        out+=`</tr></thead><tbody>`;
        members.forEach(([uid,u])=>{
          const bp=(allPredictions[uid]||{}).bracket||{};
          const advSet=new Set((bp[roundId]||[]).filter(Boolean));
          const reached=reachedFn(uid);
          out+=`<tr style="border-top:1px solid #1e3a5f"><td style="padding:3px 4px;font-weight:700;white-space:nowrap;font-size:.64rem">${u.name}</td>`;
          chunk.forEach(m=>{
            const parts=[];
            [m.home,m.away].forEach(t=>{
              if(advSet.has(t)) parts.push(`<span style="display:block;line-height:1.35;color:#2dc653">${abbr(t)}</span>`);
              else if(reached.has(t)) parts.push(`<span style="display:block;line-height:1.35;color:#e63946">${abbr(t)}</span>`);
              // predicted eliminated earlier — not shown
            });
            const cell=parts.length?parts.join(''):`<span style="color:#4a5a6a">—</span>`;
            out+=`<td style="padding:3px 4px;text-align:center;font-weight:700">${cell}</td>`;
          });
          out+=`</tr>`;
        });
        out+=`<tr style="border-top:2px solid rgba(255,215,0,.4)"><td style="padding:3px 4px;font-size:.56rem;color:#FFD700;font-weight:800">PASSOU</td>`;
        chunk.forEach(m=>{
          const w=winnerSet.has(m.home)?m.home:winnerSet.has(m.away)?m.away:null;
          out+=`<td style="padding:3px 4px;text-align:center;color:#FFD700;font-weight:800">${w?abbr(w):'-'}</td>`;
        });
        out+=`</tr></tbody></table></div>`;
      }
      out+='</div>';
      return out;
    }
    // reached-this-round sets per player
    const reachedR32=uid=>{const t=getR32Teams(uid,true);const s=new Set();t.forEach(m=>{if(m.home&&m.home!=='TBD')s.add(m.home);if(m.away&&m.away!=='TBD')s.add(m.away);});return s;};
    const reachedArr=arr=>uid=>new Set((((allPredictions[uid]||{}).bracket||{})[arr]||[]).filter(Boolean));
    const reachedR16=reachedArr('r32');
    const reachedQF=reachedArr('r16');
    const reachedSF=reachedArr('qf');
    const reachedF3=uid=>{const bp=(allPredictions[uid]||{}).bracket||{};const sf=new Set((bp.sf||[]).filter(Boolean));const r=new Set();(bp.qf||[]).filter(Boolean).forEach(t=>{if(!sf.has(t))r.add(t);});return r;};

    // R32 — matchups from group standings (getR32Teams).
    // Dates assigned per TEAM from the official Portugal-time R32 schedule,
    // then revealed only for today + next match day (same rule as group stage).
    const r32teams=getR32Teams(currentUser?.uid);
    const r32Set=new Set((actualScores.ko_r32||[]).filter(Boolean));
    const R32_TEAM_DATE={
      'África do Sul':'28 Jun','Canadá':'28 Jun',
      'Brasil':'29 Jun','Japão':'29 Jun','Alemanha':'29 Jun','Paraguai':'29 Jun',
      'Países Baixos':'30 Jun','Marrocos':'30 Jun','Costa do Marfim':'30 Jun','Noruega':'30 Jun','França':'30 Jun','Suécia':'30 Jun',
      'México':'1 Jul','Equador':'1 Jul','Inglaterra':'1 Jul','Congo DR':'1 Jul','Bélgica':'1 Jul','Senegal':'1 Jul',
      'EUA':'2 Jul','Bósnia e Herzegovina':'2 Jul','Espanha':'2 Jul','Áustria':'2 Jul','Portugal':'3 Jul','Croácia':'3 Jul',
      'Suíça':'3 Jul','Argélia':'3 Jul','Austrália':'3 Jul','Egipto':'3 Jul','Argentina':'3 Jul','Cabo Verde':'3 Jul',
      'Colômbia':'4 Jul','Gana':'4 Jul'
    };
    const r32dated=r32teams.map(m=>({...m,date:R32_TEAM_DATE[m.home]||R32_TEAM_DATE[m.away]||null}));
    const r32Dates=[...new Set(r32dated.map(m=>m.date).filter(Boolean))]
      .filter(d=>parseDate(d)>=todayNum).sort((a,b)=>parseDate(a)-parseDate(b)).slice(0,2);
    for(const date of r32Dates){
      const dayMs=r32dated.filter(m=>m.date===date);
      html+=koTable(`R32 · ${date}`,dayMs,'r32',reachedR32,r32Set,4);
    }

    // Hide a KO round from the homepage once it's fully finished — only the round
    // currently in play stays visible (plus the endgame block below). Same
    // "current, not past" logic as the group-stage day tables.
    const r16Done=(actualScores.ko_r16||[]).filter(Boolean).length>=8;
    const qfDone=(actualScores.ko_qf||[]).filter(Boolean).length>=4;
    const sfDone=(actualScores.ko_sf||[]).filter(Boolean).length>=2;

    // R16 — winners of R32 pairs
    const r32a=actualScores.ko_r32||[];
    const r16m=Array.from({length:8},(_,i)=>({home:r32a[i*2],away:r32a[i*2+1]}));
    if(!r16Done) html+=koTable('R16 — Oitavos',r16m,'r16',reachedR16,new Set((actualScores.ko_r16||[]).filter(Boolean)),4);

    // QF — winners of R16 pairs
    const r16a=actualScores.ko_r16||[];
    const qfm=Array.from({length:4},(_,i)=>({home:r16a[i*2],away:r16a[i*2+1]}));
    if(!qfDone) html+=koTable('Quartos de Final',qfm,'qf',reachedQF,new Set((actualScores.ko_qf||[]).filter(Boolean)),4);

    // SF — winners of QF pairs
    const qfa=actualScores.ko_qf||[];
    const sfm=Array.from({length:2},(_,i)=>({home:qfa[i*2],away:qfa[i*2+1]}));
    if(!sfDone) html+=koTable('Meias-Finais',sfm,'sf',reachedSF,new Set((actualScores.ko_sf||[]).filter(Boolean)),4);

    // ═══ SEMIS-STAGE ENDGAME REVEAL ═══
    // Once we reach the semis (all QF winners known, or any SF result in), lock in
    // the homepage reveal of 3rd-place, Final and Top-scorer PREDICTIONS — even
    // before those games are played. Earlier rounds keep their existing reveal above.
    const sfa=actualScores.ko_sf||[];
    const atSemis=(actualScores.ko_qf||[]).filter(Boolean).length>=4||sfa.filter(Boolean).length>0;

    // 3rd place — each player's predicted 3rd-place finisher. The real contestants
    // (the SF losers) aren't known until the semis are played, so we show the
    // predictions now and fill the real 3rd place once ko_f3 is entered.
    if(atSemis){
      const realF3=(actualScores.ko_f3||[]).filter(Boolean)[0]||'';
      html+=`<div style="margin-bottom:18px"><div style="font-size:.75rem;font-weight:800;color:var(--gold);margin-bottom:6px">📋 3.º Lugar (previsões)</div>`;
      html+=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.68rem">`;
      html+=`<thead><tr><th style="text-align:left;padding:3px 6px;color:var(--muted)">Jogador</th><th style="padding:3px 6px;text-align:center;color:var(--muted)">3.º Lugar</th></tr></thead><tbody>`;
      members.forEach(([uid,u])=>{
        const bp=(allPredictions[uid]||{}).bracket||{};
        const pick=(bp.f3||[]).filter(Boolean)[0]||'';
        const correct=realF3&&pick&&pick===realF3;
        html+=`<tr style="border-top:1px solid #1e3a5f"><td style="padding:3px 6px;font-weight:700;white-space:nowrap">${u.name}</td>`;
        html+=`<td style="padding:3px 6px;text-align:center;font-weight:700;${correct?'color:#2dc653':'color:#ccd6e0'}">${pick?abbr(pick):'-'}</td></tr>`;
      });
      html+=`<tr style="border-top:2px solid #FFD700"><td style="padding:3px 6px;font-size:.62rem;color:#FFD700;font-weight:800">Real</td>`;
      html+=`<td style="padding:3px 6px;text-align:center;color:#FFD700;font-weight:800">${realF3?abbr(realF3):'-'}</td></tr></tbody></table></div></div>`;
    }

    // Final — finalists + champion colouring + Melhor Marcador. Revealed at semis.
    const finAk=actualScores.ko_fin||[];
    const anyFin=members.some(([uid])=>{const bp=(allPredictions[uid]||{}).bracket||{};return(bp.fin||[]).some(Boolean);});
    if(anyFin&&atSemis){
      const actualScorer=actualScores.topScorer||'';
      const finalists=new Set(sfa.filter(Boolean));
      const finKnown=finalists.size>=2;
      const finDone=finAk.filter(Boolean).length>=2;
      // Role is carried by structure (🏆 / 2º), correctness by colour. Keeping them on
      // separate channels means a greyed-out pick can't be confused with a role colour,
      // and both signals survive without hue.
      const finLine=(team,slot)=>{
        if(!team) return '';
        const tag=slot===0?'🏆':'<span style="opacity:.75;font-size:.85em">2º</span>';
        let st='color:#ccd6e0';
        if(finDone){
          if(team===finAk[slot]) st='color:#2dc653';
          else if(team===finAk[0]||team===finAk[1]) st='color:#ffd000';
          else st='color:#7a8a99;opacity:.6;text-decoration:line-through';
        } else if(finKnown){
          // Final not played: nothing is correct yet, so no green. White = still
          // standing, grey = eliminated. Green only ever means a played result.
          if(!finalists.has(team)) st='color:#7a8a99;opacity:.6;text-decoration:line-through';
        }
        return `<span style="display:block;line-height:1.4;white-space:nowrap;${st}">${tag} ${abbr(team)}</span>`;
      };
      const legend=!finKnown
        ? 'Os finalistas ainda não são conhecidos.'
        : (finDone
          ? '<span style="color:#2dc653">verde</span> = acertou · <span style="color:#ffd000">amarelo</span> = na final, posição trocada · <span style="color:#7a8a99;text-decoration:line-through">cinza</span> = fora'
          : '<span style="color:#ccd6e0">branco</span> = ainda na final · <span style="color:#7a8a99;text-decoration:line-through">cinza</span> = eliminado');
      html+=`<div style="margin-bottom:18px"><div style="font-size:.75rem;font-weight:800;color:var(--gold);margin-bottom:4px">📋 Final</div>`;
      html+=`<div style="font-size:.58rem;color:var(--muted);margin-bottom:7px;line-height:1.6">🏆 campeão · 2º vice — ${legend}</div>`;
      html+=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.68rem">`;
      html+=`<thead><tr><th style="text-align:left;padding:3px 6px;color:var(--muted)">Jogador</th><th style="padding:3px 6px;text-align:center;color:var(--muted)">Final</th><th style="padding:3px 6px;text-align:center;color:var(--muted)">Melhor Marcador</th></tr></thead><tbody>`;
      members.forEach(([uid,u])=>{
        const bp=(allPredictions[uid]||{}).bracket||{};
        const finPick=(bp.fin||[]).filter(Boolean);
        const finText=finPick.length?finPick.map((t,i)=>finLine(t,i)).join(''):'-';
        const scorer=(allPredictions[uid]||{}).topScorer||'-';
        const scorerCorrect=actualScorer&&scorer&&scorer.toLowerCase()===actualScorer.toLowerCase();
        html+=`<tr style="border-top:1px solid #1e3a5f"><td style="padding:3px 6px;font-weight:700;white-space:nowrap">${u.name}</td>`;
        html+=`<td style="padding:3px 6px;text-align:center;font-weight:700">${finText}</td>`;
        html+=`<td style="padding:3px 6px;text-align:center;font-weight:700;${scorerCorrect?'color:#2dc653':'color:#ccd6e0'}">${scorer}</td></tr>`;
      });
      html+=`<tr style="border-top:2px solid #FFD700"><td style="padding:3px 6px;font-size:.62rem;color:#FFD700;font-weight:800">Real</td>`;
      const realFin=finDone
        ? finAk.filter(Boolean).map((t,i)=>`<span style="display:block;line-height:1.4;white-space:nowrap;color:#FFD700">${i===0?'🏆':'<span style="opacity:.75;font-size:.85em">2º</span>'} ${abbr(t)}</span>`).join('')
        : (finKnown?[...finalists].map(t=>`<span style="display:block;line-height:1.4;white-space:nowrap;color:#FFD700">${abbr(t)}</span>`).join(''):'-');
      html+=`<td style="padding:3px 6px;text-align:center;color:#FFD700;font-weight:800">${realFin}</td>`;
      html+=`<td style="padding:3px 6px;text-align:center;color:#FFD700;font-weight:800">${actualScorer||'-'}</td></tr></tbody></table></div></div>`;
    }
  }
  c.innerHTML=html||`<p style="color:var(--muted);font-size:.82rem">Sem dados ainda.</p>`;
}

function renderRules(){
  const c=$('rules-content');if(!c) return;
  c.innerHTML=`<div class="rules-grid">${RULE_ITEMS.map(it=>`<div class="rule-item"><span class="rule-label">${it.label[lang]}</span><span class="rule-val" style="color:${rules[it.k]<0?'var(--red)':'var(--gold)'}"> ${rules[it.k]>0?'+':''}${rules[it.k]}</span></div>`).join('')}</div>`;
}

