// ═══ Per-phase points breakdown — the single source of truth for scoring. ═══
// calcTotal() is just the sum of this, so the two can never drift apart.
// A phase holds the points produced by THAT round's matches:
//   grupos : exact-score pts + group winner/2nd + the "reached R32" (32 qualifiers)
//            layer — all of which resolve during / at the end of the group stage
//   r32    : teams that won their R32 match (i.e. reached R16)   → +5 each
//   r16    : teams that won their R16 match (reached QF)         → +10 each
//   qf     : teams that won their QF match (reached SF)          → +15 each
//   sf     : teams that won their SF match (the finalists)       → +15 each
//   fin    : 3rd place +15 · champion +30 · vice +20 · top scorer +20
//   adj    : manual host adjustments (belong to no phase)
function calcBreakdown(uid,toggleOverride=null){
  const pr=allPredictions[uid]||{};
  const tgl=toggleOverride||ptsToggles;
  // ═══ Option B point values (reach-based, cumulative) ═══
  const P={gw:5,gs:5,r32:5,r16:5,qf:10,sf:15,fin:15,f3:15,champ:30,vice:20,top:20};
  // dbg records WHICH sub-layer produced the points inside each bucket. It is
  // diagnostic only and is never summed by bdTotal() — this is not a second
  // scoring path, it is the same one, instrumented, so a total can be audited
  // against an external sheet layer by layer instead of guessing.
  const bd={grupos:0,r32:0,r16:0,qf:0,sf:0,fin:0,adj:0,
    dbg:{exatos:0,gw:0,gs:0,r32reach:0,f3:0,champ:0,vice:0,top:0}};
  // Group stage match scores
  for(const m of ALL_MATCHES){
    const p=pr[m.id]||{};const a=actualScores[m.id];
    if(a&&a.home!==undefined&&a.home!==''&&p.home!==undefined&&p.home!==''){
      const pts=calcMatch(p,a);if(pts!==null){bd.grupos+=pts;bd.dbg.exatos+=pts;}
    }
  }
  // ═══ Group winner / 2nd — derived from predicted vs actual group standings ═══
  // (robust: works even for legacy predictions that never stored gw_/gs_ fields)
  const groupsComplete=ALL_MATCHES.every(m=>{const a=actualScores[m.id];return a&&a.home!==undefined&&a.home!=='';});
  if(groupsComplete){
    for(const g of Object.keys(GROUPS)){
      const as=groupStandings(g,actualScores),ps=groupStandings(g,pr);
      if(tgl.groupWinner&&as[0]&&as[0].name&&ps[0]&&ps[0].name===as[0].name){bd.grupos+=P.gw;bd.dbg.gw+=P.gw;}
      if(tgl.groupSecond&&as[1]&&as[1].name&&ps[1]&&ps[1].name===as[1].name){bd.grupos+=P.gs;bd.dbg.gs+=P.gs;}
    }
  }
  // ═══ KNOCKOUT — Option B (reach-based, cumulative; layers stack) ═══
  const bp=pr.bracket||{};
  const inter=(predArr,actArr,pts)=>{
    const A=new Set([].concat(actArr||[]).filter(Boolean));let n=0;
    new Set([].concat(predArr||[]).filter(Boolean)).forEach(t=>{if(A.has(t))n++;});
    return n*pts;
  };
  // Layer: reach R32 (only once the actual 32 are known = group stage complete)
  if(groupsComplete&&tgl.round32!==false){
    try{
      const realQ=new Set(getQualified32(actualScores).map(t=>t&&t.name).filter(Boolean));
      let n=0;new Set(getQualified32(pr).map(t=>t&&t.name).filter(Boolean)).forEach(t=>{if(realQ.has(t))n++;});
      bd.grupos+=n*P.r32;bd.dbg.r32reach+=n*P.r32;
    }catch(e){/* malformed prediction: skip R32 layer for this user */}
  }
  bd.r32+=inter(bp.r32,actualScores.ko_r32,P.r16);
  bd.r16+=inter(bp.r16,actualScores.ko_r16,P.qf);
  bd.qf +=inter(bp.qf, actualScores.ko_qf,P.sf);
  bd.sf +=inter(bp.sf, actualScores.ko_sf,P.fin);
  const f3pts=inter(bp.f3, actualScores.ko_f3,P.f3);bd.fin+=f3pts;bd.dbg.f3=f3pts;
  const finPk=bp.fin||[],finAk=actualScores.ko_fin||[];
  if(finPk[0]&&finAk[0]&&finPk[0]===finAk[0]){bd.fin+=P.champ;bd.dbg.champ=P.champ;}
  if(finPk[1]&&finAk[1]&&finPk[1]===finAk[1]){bd.fin+=P.vice;bd.dbg.vice=P.vice;}
  if(actualScores.topScorer&&pr.topScorer){
    const score=fuzzyScore(pr.topScorer,actualScores.topScorer);
    if(score===1||(score>=0.5&&(approvedTopScorers[uid]===true))){bd.fin+=P.top;bd.dbg.top=P.top;}
  }
  // Manual host adjustments (offset layer). The automatic scoring above always
  // runs; these just ride on top. Each user's adjustments is an array of
  // {delta, reason, by, ts}. Sum the deltas.
  bd.adj=adjustmentTotal(uid);
  return bd;
}
function bdTotal(bd){return bd.grupos+bd.r32+bd.r16+bd.qf+bd.sf+bd.fin+bd.adj;}
function calcTotal(uid,toggleOverride=null){return bdTotal(calcBreakdown(uid,toggleOverride));}
// Which round's matches are being played right now — drives the phase column.
function currentPhaseId(){
  const n=r=>(actualScores[`ko_${r}`]||[]).filter(Boolean).length;
  const groupsComplete=ALL_MATCHES.every(m=>{const a=actualScores[m.id];return a&&a.home!==undefined&&a.home!=='';});
  if(!groupsComplete) return 'grupos';
  if(n('r32')<16) return 'r32';
  if(n('r16')<8)  return 'r16';
  if(n('qf')<4)   return 'qf';
  if(n('sf')<2)   return 'sf';
  return 'fin';
}
const PHASE_LABELS={pt:{grupos:'GRUPOS',r32:'R32',r16:'R16',qf:'QF',sf:'MEIAS',fin:'FINAL'},
                    en:{grupos:'GROUPS',r32:'R32',r16:'R16',qf:'QF',sf:'SEMIS',fin:'FINAL'}};
// What a player still hasn't filled in — powers the clickable ⚠ badge.
function predictionGaps(uid){
  const pr=allPredictions[uid]||{};const bp=pr.bracket||{};const gaps=[];
  if(!Object.keys(pr).length){gaps.push(lang==='pt'?'Nenhuma previsão submetida.':'No predictions submitted.');return gaps;}
  const missGroups=ALL_MATCHES.filter(m=>{const p=pr[m.id]||{};return p.home===undefined||p.home===''||p.away===undefined||p.away==='';}).length;
  if(missGroups) gaps.push(lang==='pt'?`Fase de grupos: ${missGroups} jogo(s) por preencher`:`Group stage: ${missGroups} match(es) missing`);
  const need=[['r32',16,'R32'],['r16',8,'R16'],['qf',4,lang==='pt'?'Quartos':'Quarters'],
              ['sf',2,lang==='pt'?'Meias':'Semis'],['fin',2,'Final'],['f3',1,lang==='pt'?'3.º Lugar':'3rd Place']];
  for(const [k,n,label] of need){
    const have=(bp[k]||[]).filter(t=>t&&t!=='TBD').length;
    if(have<n) gaps.push(`${label}: ${have}/${n}`);
  }
  if(!(pr.topScorer&&pr.topScorer.trim())) gaps.push(lang==='pt'?'Melhor marcador em falta':'Top scorer missing');
  return gaps;
}
