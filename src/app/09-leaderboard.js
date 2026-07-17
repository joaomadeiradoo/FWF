// ═══ LEADERBOARD ═══
// ═══ CLASSIFICAÇÃO ESTÁTICA (display-only) ═══
// Os cálculos são feitos à parte pelo host; esta tabela mostra os valores fixos abaixo.
// Para voltar ao cálculo automático: mudar STATIC_LEADERBOARD para false.
// Tabela escondida: a classificação oficial é publicada à parte pelo host.
// Para voltar a mostrar: mudar HIDE_LEADERBOARD para false.
const HIDE_LEADERBOARD=true;
const STATIC_LEADERBOARD=false;
const STATIC_LB_DATA=[
  ['Rodrigo Silva',61,135],['João Eira',59,135],['Rafael Gamilha',54,135],['Miguel Rodrigues Lopes',52,140],
  ['Mário Santos',50,135],['João Pinheiro',49,140],['Pedro Brandão',46,135],['João "Covilhã" Silva',45,140],
  ['Paulo Niza',43,130],['Paulo Bitoque',42,130],['Cesar Maio',39,130],['Nuno Machado',39,130],
  ['Nuno Cordas',39,135],['Rui Fernandes',37,135],['Ivo Casimiro',36,135],['Vasco Noronha',36,140],
  ['Joao do O',34,135],['Humberto Martins',32,135],['Tiago Fonseca',31,130],['Rui Pinheiro',29,135],
  ['Vicente do O',29,135],['Edson Elpimba',28,130],['Bernardo Garcia',26,130],['Francisco Cabrita',26,130],
  ['Manuel Araújo',24,125],['André Franco',24,130],['Manuel Moreira Reis',24,135],['Pedro Santos',23,135],
  ['Pedro Vaz',22,130],['António Valério',22,135],['Jorge Pino',20,135],['Duarte Castro',19,135],
  ['Joao Vargas',19,135],['Margarida Pires',18,130],['Nuno Lança',17,135],['Joao Barroso',17,140],
  ['Ivo Fartouce',16,130],['Vasco Martins',16,130],['Marcelo Xavier',15,135],['Paulo Ribeiro',14,130],
  ['Pedro Carvalheiro',13,135],['Ruben Dias',11,130],['Luís Mota',10,130],['António Valente',9,125],
  ['Júlio Pereira',9,135],['Gonçalo Mestre',7,135],['Lígia Gomes',6,135],['Nuno Madeira do O',3,135],
  ['Louis Head',2,135],['Rui Moreira',-4,130],['Diogo Lança',-4,135],['Ricardo Silva',-5,135],
  ['Raquel Ribeiro',-7,125],['Tiago Rodrigues',-7,130],['Sara Vitorino',-15,125],['Sylvain Mou',-22,125],
  ['Marco Figueiredo',-25,130],['Joao Jesus',-35,130],['Pedro Jesus',-40,130],['Manuel Nicolau',-49,125],
  ['Pedro Fonseca',-51,130],['Gonçalo Rodeia Marques',-59,130],['José Pedro Esteves',-60,120],['Marisa Calvinho',-76,130]
];
function _lbNorm(s){return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();}
function staticLbRows(){
  const myName=(allUsers[currentUser?.uid]?.name)||'';
  const myNorm=_lbNorm(myName);
  let myIdx=-1;
  if(myNorm){
    myIdx=STATIC_LB_DATA.findIndex(r=>_lbNorm(r[0])===myNorm);
    if(myIdx<0&&typeof fuzzyScore==='function'){let bs=0,bi=-1;STATIC_LB_DATA.forEach((r,i)=>{const sc=fuzzyScore(myName,r[0]);if(sc>bs){bs=sc;bi=i;}});if(bs>=0.9)myIdx=bi;}
  }
  return STATIC_LB_DATA.map((r,i)=>({name:r[0],pts:r[1],r32:r[2],sub:true,isMe:i===myIdx}));
}

// ═══ SEARCH / FIND-ME ═══
// Filtering is done by toggling row display in the DOM, NOT by re-running
// renderLeaderboard(). That is deliberate: renderLeaderboard() also writes
// prevLb, lbRows and takes the daily snapshot, so calling it on every keystroke
// would wipe the ↑/↓ trend arrows and corrupt the "Hoje" column. Ranks stay
// correct under a filter because they are baked into the cells at render time.
function lbApplyFilter(){
  const inp=$('lb-search');
  const q=_lbNorm(inp?inp.value:'');
  const trs=document.querySelectorAll('#lb-content tbody tr');
  let shown=0;
  trs.forEach(tr=>{
    const hit=!q||(tr.dataset.lbname||'').includes(q);
    tr.style.display=hit?'':'none';
    if(hit)shown++;
  });
  const nr=$('lb-noresults');
  if(nr)nr.classList.toggle('hidden',!(q&&trs.length&&shown===0));
}
function lbMyRow(){return document.querySelector('#lb-content tbody tr[data-lbme="1"]');}
function lbFindMe(){
  const inp=$('lb-search');
  if(inp&&inp.value){inp.value='';lbApplyFilter();}
  const tr=lbMyRow();
  if(!tr)return false;
  tr.scrollIntoView({behavior:'smooth',block:'center'});
  tr.classList.remove('lb-flash');void tr.offsetWidth;tr.classList.add('lb-flash');
  return true;
}
// Auto-scroll to your own row — once per session only. Doing it on every
// onSnapshot would yank the page out from under anyone reading the table.
let _lbAutoScrolled=false;
function lbAfterRender(){
  const tools=$('lb-tools'),btn=$('lb-findme-btn');
  const hasRows=!!document.querySelector('#lb-content tbody tr');
  if(tools)tools.classList.toggle('hidden',!hasRows);
  lbApplyFilter();
  const mine=lbMyRow();
  if(btn)btn.classList.toggle('hidden',!mine);
  if(!_lbAutoScrolled&&mine&&$('tab-leaderboard')?.classList.contains('active')){
    _lbAutoScrolled=true;
    const r=mine.getBoundingClientRect();
    // Already on screen? Then just flash it — no need to move the page.
    const offscreen=r.top<70||r.bottom>window.innerHeight-70;
    if(offscreen)mine.scrollIntoView({behavior:'smooth',block:'center'});
    mine.classList.remove('lb-flash');void mine.offsetWidth;mine.classList.add('lb-flash');
  }
}
function renderLeaderboard(){
  const c=$('lb-content');if(!c) return;
  if(HIDE_LEADERBOARD){
    lbRows=[];
    $('lb-tools')?.classList.add('hidden');
    $('lb-noresults')?.classList.add('hidden');
    c.innerHTML=`<div style="padding:26px 16px;text-align:center;color:var(--muted);font-size:.85rem;line-height:1.7">
      <div style="font-size:1.6rem;margin-bottom:8px">📊</div>
      <strong style="color:var(--gold);display:block;margin-bottom:6px">Classificação temporariamente indisponível</strong>
      A classificação oficial está a ser publicada à parte pelo Professor Karamba.<br>Volta em breve.
    </div>`;
    return;
  }
  if(STATIC_LEADERBOARD){
    const rows=staticLbRows();lbRows=rows;
    let h=`<table class="leaderboard"><thead><tr><th>#</th><th>${t('player')}</th><th style="font-size:.72rem">R32</th><th>${t('totalPts')}</th></tr></thead><tbody>`;
    rows.forEach((r,i)=>{
      const rank=i+1;const rc=rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
      const rankCell=rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank;
      const ptsCls=r.pts>=0?'pts-pos':'pts-neg';const ptsStr=`${r.pts>=0?'+':''}${r.pts}`;
      h+=`<tr data-lbname="${attrEsc(_lbNorm(r.name))}"${r.isMe?' data-lbme="1"':''}><td class="${rc}" style="white-space:nowrap">${rankCell}</td><td>${r.name}${r.isMe?' 👈':''}</td><td class="pts-today-zero">${r.r32}</td><td class="${ptsCls}">${ptsStr}</td></tr>`;
    });
    h+='</tbody></table>';c.innerHTML=h;lbAfterRender();return;
  }
  const members=Object.entries(allUsers);
  if(!members.length){c.innerHTML='<p style="color:var(--muted)">Sem participantes</p>';lbAfterRender();return;}
  // Tiebreakers (computed once per user, stored in row)
  // Only meaningful after SF results published — used in sort always, shown only then
  function calcTiebreakers(uid){
    const pr=allPredictions[uid]||{};
    const bp=pr.bracket||{};
    const ak=actualScores;
    // 1. Acertou campeão
    const t1=(bp.fin&&bp.fin[0]&&ak.ko_fin&&bp.fin[0]===ak.ko_fin[0])?1:0;
    // 2. Acertou melhor marcador
    const scorer=pr.topScorer||'';const actScorer=ak.topScorer||'';
    const t2=(scorer&&actScorer&&(fuzzyScore(scorer,actScorer)>=0.5||approvedTopScorers[uid]===true))?1:0;
    // 3-6. Equipas certas por ronda (Set-based)
    const kSet=r=>new Set((ak[`ko_${r}`]||[]).filter(Boolean));
    const sfSet=kSet('sf'),qfSet=kSet('qf'),r16Set=kSet('r16'),r32Set=kSet('r32');
    const t3=[...new Set((bp.sf||[]).filter(Boolean))].filter(t=>sfSet.has(t)).length;
    const t4=[...new Set((bp.qf||[]).filter(Boolean))].filter(t=>qfSet.has(t)).length;
    const t5=[...new Set((bp.r16||[]).filter(Boolean))].filter(t=>r16Set.has(t)).length;
    const t6=[...new Set((bp.r32||[]).filter(Boolean))].filter(t=>r32Set.has(t)).length;
    // 7. Resultados exactos fase de grupos
    let t7=0;
    for(const m of ALL_MATCHES){
      const p=pr[m.id]||{};const a=ak[m.id];
      if(a&&a.home!==undefined&&p.home!==undefined&&p.home!==''&&
         parseInt(p.home)===parseInt(a.home)&&parseInt(p.away)===parseInt(a.away))t7++;
    }
    return[t1,t2,t3,t4,t5,t6,t7];
  }

  const TB_LABELS=['Acertou o campeão','Acertou o melhor marcador','Equipas certas nas meias','Equipas certas nos quartos','Equipas certas no R16','Equipas certas no R32','Resultados exactos nos grupos','Moeda ao ar'];

  const phaseId=currentPhaseId();
  const rows=members.map(([uid,u])=>{
    const pr=allPredictions[uid]||{};
    const hasSome=Object.keys(pr).length>0;
    const groupsFull=hasSome&&ALL_MATCHES.every(m=>{const p=pr[m.id]||{};return p.home!==undefined&&p.home!==''&&p.away!==undefined&&p.away!=='';});
    const bp=(pr.bracket)||{};
    const r32picks=(bp.r32||[]).filter(t=>t&&t!=='TBD').length;
    const bracketFull=r32picks>=16&&(bp.r16||[]).filter(Boolean).length>=8&&(bp.qf||[]).filter(Boolean).length>=4&&(bp.sf||[]).filter(Boolean).length>=2&&(bp.fin||[]).filter(Boolean).length>=2&&(bp.f3||[]).filter(Boolean).length>=1;
    const topScorer=!!(pr.topScorer&&pr.topScorer.trim());
    const sub=hasSome;
    const complete=groupsFull&&bracketFull&&topScorer;
    const partial=sub&&!complete;
    const tb=calcTiebreakers(uid);
    const bd=calcBreakdown(uid);
    return{uid,name:u.name,pts:bdTotal(bd),phasePts:bd[phaseId]||0,sub,partial,complete,tb};
  }).sort((a,b)=>{
    if(a.sub!==b.sub) return a.sub?-1:1;
    if(b.pts!==a.pts) return b.pts-a.pts;
    // Apply tiebreakers in order
    for(let i=0;i<a.tb.length;i++){if(b.tb[i]!==a.tb[i])return b.tb[i]-a.tb[i];}
    return a.name.localeCompare(b.name,'pt');
  });

  // Tiebreaker explanation is only worth the space in the FINAL standings, where
  // it decides prizes. Mid-tournament it's noise under every tied name.
  const compFinished=(actualScores.ko_fin||[]).filter(Boolean).length>=2;
  // The ✓ tick matters only while predictions are still being submitted. Once the
  // competition is underway it tells you nothing, so drop it and reclaim the space.
  // Keep the column only if someone still has gaps worth flagging.
  const compStarted=ALL_MATCHES.some(m=>{const a=actualScores[m.id];return a&&a.home!==undefined&&a.home!=='';});
  const anyIncomplete=rows.some(r=>!r.complete);
  const showBadgeCol=!compStarted||anyIncomplete;
  const phaseLabel=(PHASE_LABELS[lang]||PHASE_LABELS.pt)[phaseId];
  lbRows=rows; // expose the exact ordered rows so the WhatsApp share image matches the site

  // Take snapshot at start of day
  takeDailySnapshot(rows);

  let html=`<table class="leaderboard"><thead><tr>
    <th>#</th><th>${t('player')}</th>
    <th style="font-size:.72rem">${t('today')}</th>
    <th style="font-size:.72rem">${phaseLabel}</th>
    <th>${t('totalPts')}</th>${showBadgeCol?'<th></th>':''}
  </tr></thead><tbody>`;
  rows.forEach((r,i)=>{
    const rank=i+1;const prev=prevLb.findIndex(p=>p.uid===r.uid);
    let trend='';
    if(prev>=0&&prevLb.length===rows.length){const d=prev-i;if(d>0)trend=`<span class="tup">↑${d}</span>`;else if(d<0)trend=`<span class="tdn">↓${Math.abs(d)}</span>`;else trend=`<span class="tnc">-</span>`;}
    const rc=rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
    const startPts=dailySnapshot[r.uid]!==undefined?dailySnapshot[r.uid]:r.pts;
    const todayDiff=r.pts-startPts;
    const todayCls=todayDiff>0?'pts-today-pos':todayDiff<0?'pts-today-neg':'pts-today-zero';
    const todayStr=!r.sub?'<span style="color:var(--muted)">—</span>':(todayDiff>0?`+${todayDiff}`:todayDiff<0?`${todayDiff}`:'0');
    const ptsStr=!r.sub?'<span style="color:var(--muted)">—</span>':`${r.pts>=0?'+':''}${r.pts}`;
    const ptsCls=!r.sub?'':(r.pts>=0?'pts-pos':'pts-neg');
    const rankCell=rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank;
    // Tiebreaker note — only when SF published and this user is tied in pts with adjacent user
    const phaseStr=!r.sub?'<span style="color:var(--muted)">—</span>':(r.phasePts>0?`+${r.phasePts}`:r.phasePts<0?`${r.phasePts}`:'0');
    const phaseCls=r.phasePts>0?'pts-today-pos':r.phasePts<0?'pts-today-neg':'pts-today-zero';
    let badge='';
    if(!compStarted&&r.complete) badge='<span class="badge badge-open">✓</span>';
    else if(r.partial) badge=`<span class="badge" style="background:rgba(255,200,0,.15);color:#ffd000;border:1px solid rgba(255,200,0,.3);cursor:pointer" onclick="showPredGaps('${attrEsc(r.uid)}')" title="${lang==='pt'?'Ver dados em falta':'See missing data'}">⚠</span>`;
    else if(!r.sub) badge=`<span class="badge badge-locked" style="cursor:pointer" onclick="showPredGaps('${attrEsc(r.uid)}')" title="${lang==='pt'?'Ver dados em falta':'See missing data'}">?</span>`;
    let tbNote='';
    if(compFinished&&r.sub){
      const prevRow=rows[i-1],nextRow=rows[i+1];
      const isTied=(prevRow&&prevRow.pts===r.pts&&prevRow.sub)||(nextRow&&nextRow.pts===r.pts&&nextRow.sub);
      if(isTied){
        // Find which criterion separates this user from at least one tied neighbour
        let criterionIdx=TB_LABELS.length-1; // default: moeda ao ar
        for(const neighbour of [prevRow,nextRow].filter(Boolean)){
          if(neighbour.pts!==r.pts||!neighbour.sub) continue;
          for(let ci=0;ci<r.tb.length;ci++){
            if(r.tb[ci]!==neighbour.tb[ci]){criterionIdx=Math.min(criterionIdx,ci);break;}
          }
        }
        tbNote=`<div style="font-size:.58rem;color:#8899aa;margin-top:1px">↕ ${TB_LABELS[criterionIdx]}</div>`;
      }
    }
    html+=`<tr data-lbname="${attrEsc(_lbNorm(r.name))}"${r.uid===currentUser?.uid?' data-lbme="1"':''}>
      <td class="${rc}" style="white-space:nowrap">${rankCell}${trend?` ${trend}`:''}</td>
      <td><span class="lb-name" onclick="showPlayerProfile('${attrEsc(r.uid)}')" title="${lang==='pt'?'Ver perfil':'View profile'}">${r.name}</span>${r.uid===currentUser?.uid?' 👈':''}${adjBadge(r.uid)}${allUsers[r.uid]?.unpaidAnnounced?`<span class="unpaid-badge" title="Pagamento em falta — fala com o host">€</span>`:''}${tbNote}</td>
      <td class="${todayCls}">${todayStr}</td>
      <td class="${phaseCls}">${phaseStr}</td>
      <td class="${ptsCls}">${ptsStr}</td>${showBadgeCol?`<td>${badge}</td>`:''}
    </tr>`;
  });
  html+='</tbody></table>';c.innerHTML=html;
  lbAfterRender();
  renderDailySummary(rows);prevLb=[...rows];
}

