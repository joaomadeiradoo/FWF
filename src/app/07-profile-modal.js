// ═══ PLAYER PROFILE (#7) ═══
// WHICH STATS: decided here, not asked. The rule was "only show what the app can
// already prove". calcBreakdown() already computes a full per-layer breakdown AND
// fills bd.dbg with per-sub-layer diagnostics — that instrumentation exists for
// the CSV audit and is exactly a profile. So the profile is a VIEW over the single
// scoring path (§6.1), never a second computation. Nothing here re-derives a total.
//
// Deliberately absent: "best day"/"worst day" and any history-over-time. The app
// keeps no points history — only today's opening snapshot (see takeDailySnapshot).
// Inventing a trend from one data point would be fiction.
//
// Shaped for #21 (head-to-head): profileStats(uid) returns rows, render is separate.
// #21 is then two columns of the same rows, not new logic.
function profileStats(uid){
  const bd=calcBreakdown(uid);
  const d=bd.dbg||{};
  const pr=allPredictions[uid]||{};
  const bp=pr.bracket||{};
  const hit=(pred,act)=>{
    const A=new Set([].concat(act||[]).filter(Boolean));
    if(!A.size) return null; // round not played yet — don't imply a zero
    let n=0;new Set([].concat(pred||[]).filter(Boolean)).forEach(t=>{if(A.has(t))n++;});
    return{n,of:A.size};
  };
  const pt=lang==='pt';
  const rounds=[
    ['R32',hit(bp.r32,actualScores.ko_r32)],
    ['R16',hit(bp.r16,actualScores.ko_r16)],
    [pt?'Quartos':'Quarters',hit(bp.qf,actualScores.ko_qf)],
    [pt?'Meias':'Semis',hit(bp.sf,actualScores.ko_sf)],
  ];
  // Exact group scorelines called — counted, not scored (scoring is calcBreakdown's job)
  let exact=0,played=0;
  for(const m of ALL_MATCHES){
    const p=pr[m.id]||{},a=actualScores[m.id];
    if(!(a&&a.home!==undefined&&a.home!=='')) continue;
    played++;
    if(p.home!==undefined&&p.home!==''&&parseInt(p.home)===parseInt(a.home)&&parseInt(p.away)===parseInt(a.away))exact++;
  }
  return{bd,d,bp,pr,rounds,exact,played,total:bdTotal(bd)};
}
function showPlayerProfile(uid){
  const u=allUsers[uid]||{};
  if(!u.name){showInfoModal('—',lang==='pt'?'Participante não encontrado.':'Player not found.');return;}
  const pt=lang==='pt';
  if(!Object.keys(allPredictions[uid]||{}).length){
    showInfoModal(`👤 ${u.name}`,`<span style="color:var(--muted)">${pt?'Este jogador não submeteu previsões.':'This player has not submitted predictions.'}</span>`);
    return;
  }
  const s=profileStats(uid);
  const sign=n=>`${n>0?'+':''}${n}`;
  const cls=n=>n>0?'pts-pos':n<0?'pts-neg':'';
  const row=(label,val,sub)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)">
    <span style="color:${sub?'var(--muted)':'var(--text)'};${sub?'padding-left:12px;font-size:.72rem':''}">${label}</span>
    <span class="${sub?'':cls(val)}" style="white-space:nowrap;${sub?'color:var(--muted);font-size:.72rem':'font-weight:700'}">${typeof val==='number'?sign(val):val}</span></div>`;

  let h=`<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
    <span style="color:var(--muted);font-size:.72rem">${pt?'Total':'Total'}</span>
    <span class="${cls(s.total)}" style="font-family:var(--fh);font-size:1.6rem">${sign(s.total)}</span></div>`;

  h+=`<div style="color:var(--gold);font-size:.68rem;letter-spacing:1px;font-family:var(--fh);margin:10px 0 4px">${pt?'POR FASE':'BY PHASE'}</div>`;
  h+=row(pt?'Grupos':'Groups',s.bd.grupos);
  h+=row(pt?'· resultados exactos':'· exact scores',s.d.exatos||0,true);
  h+=row(pt?'· 1.ºs de grupo':'· group winners',s.d.gw||0,true);
  h+=row(pt?'· 2.ºs de grupo':'· group runners-up',s.d.gs||0,true);
  h+=row(pt?'· equipas no R32':'· teams reaching R32',s.d.r32reach||0,true);
  h+=row('R32',s.bd.r32);
  h+=row('R16',s.bd.r16);
  h+=row(pt?'Quartos':'Quarters',s.bd.qf);
  h+=row(pt?'Meias':'Semis',s.bd.sf);
  h+=row('Final',s.bd.fin);
  if(s.d.f3)h+=row(pt?'· 3.º lugar':'· 3rd place',s.d.f3,true);
  if(s.d.champ)h+=row(pt?'· campeão':'· champion',s.d.champ,true);
  if(s.d.vice)h+=row(pt?'· vice':'· runner-up',s.d.vice,true);
  if(s.d.top)h+=row(pt?'· melhor marcador':'· top scorer',s.d.top,true);
  if(s.bd.adj)h+=row(pt?'Ajustes do host':'Host adjustments',s.bd.adj);

  h+=`<div style="color:var(--gold);font-size:.68rem;letter-spacing:1px;font-family:var(--fh);margin:12px 0 4px">${pt?'PRECISÃO':'ACCURACY'}</div>`;
  h+=row(pt?'Resultados exactos':'Exact scorelines',s.played?`${s.exact}/${s.played}`:'—');
  for(const [label,r] of s.rounds) h+=row(pt?`Equipas certas · ${label}`:`Teams right · ${label}`,r?`${r.n}/${r.of}`:'—');

  const fin=s.bp.fin||[];
  h+=`<div style="color:var(--gold);font-size:.68rem;letter-spacing:1px;font-family:var(--fh);margin:12px 0 4px">${pt?'APOSTAS':'PICKS'}</div>`;
  h+=row(pt?'Campeão':'Champion',fin[0]||'—');
  h+=row(pt?'Vice':'Runner-up',fin[1]||'—');
  h+=row(pt?'3.º lugar':'3rd place',(s.bp.f3||[])[0]||'—');
  h+=row(pt?'Melhor marcador':'Top scorer',s.pr.topScorer||'—');
  h+=`<div style="margin-top:10px;color:var(--muted);font-size:.66rem;line-height:1.5">${pt
    ?'Números calculados pela app (calcBreakdown). A classificação oficial é publicada à parte pelo host e pode diferir.'
    :'Figures computed by the app (calcBreakdown). The official classification is published separately by the host and may differ.'}</div>`;

  showInfoModal(`👤 ${u.name}`,h);
}
window.showPlayerProfile=showPlayerProfile;
function showInfoModal(title,bodyHtml){
  let el=$('info-modal');
  if(!el){
    el=document.createElement('div');el.id='info-modal';
    el.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;padding:20px';
    el.addEventListener('click',e=>{if(e.target===el)el.style.display='none';});
    document.body.appendChild(el);
  }
  el.innerHTML=`<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.6)">
    <div style="font-family:var(--fh);color:var(--gold);font-size:.85rem;letter-spacing:1px;margin-bottom:10px">${title}</div>
    <div style="font-size:.78rem;color:var(--text);line-height:1.65">${bodyHtml}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:14px;width:100%" onclick="document.getElementById('info-modal').style.display='none'">${lang==='pt'?'Fechar':'Close'}</button>
  </div>`;
  el.style.display='flex';
}
function showPredGaps(uid){
  const u=allUsers[uid]||{};const gaps=predictionGaps(uid);
  const body=gaps.length
    ?`<ul style="margin:0;padding-left:18px">${gaps.map(g=>`<li style="margin-bottom:4px">${g}</li>`).join('')}</ul>`
    :`<span style="color:var(--green)">${lang==='pt'?'Tudo preenchido.':'Everything filled in.'}</span>`;
  showInfoModal(`⚠ ${u.name||''} — ${lang==='pt'?'dados em falta':'missing data'}`,body);
}
window.showPredGaps=showPredGaps;
// Sum of all manual point adjustments for a user (0 if none)
function adjustmentTotal(uid){
  const adj=(currentComp&&currentComp.adjustments&&currentComp.adjustments[uid])||[];
  if(!Array.isArray(adj)) return 0;
  return adj.reduce((s,a)=>s+(Number(a.delta)||0),0);
}
// Small transparency badge shown on the leaderboard next to anyone whose total
// includes a manual host adjustment. Tap to see the reasons.
function adjBadge(uid){
  const total=adjustmentTotal(uid);
  if(!total) return '';
  const sign=total>0?'+':'';
  const color=total>0?'var(--green)':'var(--red)';
  return ` <span class="adj-badge" style="color:${color}" onclick="showAdjReasons('${attrEsc(uid)}')" title="Ajuste manual do host">⚙${sign}${total}</span>`;
}
function showAdjReasons(uid){
  const adj=(currentComp&&currentComp.adjustments&&currentComp.adjustments[uid])||[];
  const u=allUsers[uid];
  if(!adj.length){toast('Sem ajustes',false);return;}
  const lines=adj.map(a=>{
    const sign=a.delta>0?'+':'';
    const when=a.ts?new Date(a.ts).toLocaleDateString('pt-PT',{day:'2-digit',month:'short'}):'';
    return `${sign}${a.delta} — ${a.reason||'(sem motivo)'}${a.by?` · ${a.by}`:''}${when?` · ${when}`:''}`;
  }).join('\n');
  alert(`Ajustes de pontos — ${u?u.name:''}\n\n${lines}\n\nTotal: ${adjustmentTotal(uid)>0?'+':''}${adjustmentTotal(uid)}`);
}

