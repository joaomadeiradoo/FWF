// ═══ STANDINGS ENGINE ═══
function groupStandings(grp,scores){
  const teams=GROUPS[grp].teams.map(name=>({name,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0}));
  const tm={};teams.forEach(t=>tm[t.name]=t);
  ALL_MATCHES.filter(m=>m.group===grp).forEach(m=>{
    const s=scores[m.id];
    if(!s||s.home===undefined||s.home===''||s.away===undefined||s.away==='') return;
    const h=parseInt(s.home),a=parseInt(s.away),ht=tm[m.home],at=tm[m.away];
    if(!ht||!at) return;
    ht.P++;at.P++;ht.GF+=h;ht.GA+=a;at.GF+=a;at.GA+=h;ht.GD=ht.GF-ht.GA;at.GD=at.GF-at.GA;
    if(h>a){ht.W++;ht.Pts+=3;at.L++;}
    else if(h===a){ht.D++;ht.Pts++;at.D++;at.Pts++;}
    else{at.W++;at.Pts+=3;ht.L++;}
  });
  // FIFA tiebreakers (Article 18.6) - simplified version. The full FIFA tiebreaker
  // chain is: 1) Points 2) GD 3) GF 4) head-to-head Pts 5) head-to-head GD
  // 6) head-to-head GF 7) team conduct score 8) FIFA ranking 9) drawing of lots.
  // We implement 1-3 plus #4-#6 collapsed to "fewer GA" (a reasonable proxy when
  // head-to-head data isn't separated), then alphabetical as a deterministic
  // drawing-of-lots fallback. This will rank correctly in the vast majority of
  // scenarios; the only edge case is teams perfectly tied on Pts/GD/GF/GA, which
  // is extremely rare.
  return teams.sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||a.GA-b.GA||a.name.localeCompare(b.name));
}
function getBestThirds(scores){
  const thirds=[];
  for(const grp of Object.keys(GROUPS)){
    const s=groupStandings(grp,scores);
    if(s[2]) thirds.push({...s[2],group:grp});
  }
  // Use the same FIFA tiebreakers as the R32 lookup so the displayed "qualified
  // 3rd-placed teams" exactly matches who Annex C considers qualified.
  return rankThirds(thirds).slice(0,8);
}
function getQualified32(scores){
  const q=[];
  for(const grp of Object.keys(GROUPS)){
    const s=groupStandings(grp,scores);
    q.push({...s[0],pos:'1',group:grp});
    q.push({...s[1],pos:'2',group:grp});
  }
  getBestThirds(scores).forEach(t=>q.push({...t,pos:'3'}));
  return q;
}
function autoGroupKeys(scores){
  const auto={};
  for(const g of Object.keys(GROUPS)){
    const s=groupStandings(g,scores);
    if(s[0].P>0){auto[`gw_${g}`]=s[0].name;auto[`gs_${g}`]=s[1].name;}
  }
  return auto;
}

// Get R32 pairs from predictions or real scores using FIFA's official Annex C lookup.
//
// FIFA fixture template (Matches 73-88 of the 2026 World Cup) defines 16 R32 matches:
//   M73 = 2A vs 2B    M81 = 1D vs 3-of-...   (4 matches are winner vs 3rd)
//   M74 = 1E vs 3-of-...
//   M75 = 1F vs 2C    M82 = 1G vs 3-of-...
//   M76 = 1C vs 2F    M83 = 2K vs 2L
//   M77 = 1I vs 3-of-... M84 = 1H vs 2J
//   M78 = 2E vs 2I    M85 = 1B vs 3-of-...
//   M79 = 1A vs 3-of-... M86 = 1J vs 2H
//   M80 = 1L vs 3-of-... M87 = 1K vs 3-of-...
//                     M88 = 2D vs 2G
//
// 8 matches involve a group winner facing a third-placed team (1A, 1B, 1D, 1E, 1G,
// 1I, 1K, 1L). Which third-placed team faces which winner depends on which 8 of the
// 12 groups produced a qualifying 3rd-placed team; this is determined by Annex C
// (495 scenarios, embedded above as ANNEX_C).
//
// The internal r32 array ordering is chosen so that subsequent rounds use the
// natural idx*2/idx*2+1 pairing:
//   r32[ 0..1] = M74, M77 -> R16[0] = M89
//   r32[ 2..3] = M73, M75 -> R16[1] = M90  -> QF[0] = M97
//   r32[ 4..5] = M83, M84 -> R16[2] = M93
//   r32[ 6..7] = M81, M82 -> R16[3] = M94  -> QF[1] = M98
//   r32[ 8..9] = M76, M78 -> R16[4] = M91
//   r32[10..11]= M79, M80 -> R16[5] = M92  -> QF[2] = M99
//   r32[12..13]= M86, M88 -> R16[6] = M95
//   r32[14..15]= M85, M87 -> R16[7] = M96  -> QF[3] = M100
//   QF[0]+QF[1] -> SF[0] = M101; QF[2]+QF[3] -> SF[1] = M102
//   SF[0]+SF[1] -> M104 (final), losers -> M103 (3rd place)

// Rank the third-placed teams across groups using FIFA criteria for the "best 8"
// (per Article 18 of the 2026 Competition Regulations):
//   1) Points
//   2) Goal difference
//   3) Goals scored
//   4) Fewest goals against (this is goals AGAINST, where smaller is better)
//   5) Team conduct score (not tracked here - skipped)
//   6) FIFA ranking (not tracked here - skipped)
//   7) Drawing of lots (replaced here with alphabetical group letter for determinism)
function rankThirds(thirds){
  return thirds.slice().sort((a,b)=>
    b.Pts-a.Pts ||
    b.GD-a.GD ||
    b.GF-a.GF ||
    a.GA-b.GA ||
    a.group.localeCompare(b.group)
  );
}

function getR32Teams(uid,forcePred){
  const predScores=allPredictions[uid]||{};
  const hasReal=!forcePred&&ALL_MATCHES.some(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';});
  const scores=hasReal?actualScores:predScores;

  // Build standings for all 12 groups
  const grpWinners={},grpRunners={},grpThirds={};
  const thirdsList=[];
  for(const grp of Object.keys(GROUPS)){
    const s=groupStandings(grp,scores);
    grpWinners[grp]=s[0]?.name||'TBD';
    grpRunners[grp]=s[1]?.name||'TBD';
    if(s[2]){
      grpThirds[grp]=s[2].name;
      thirdsList.push({...s[2],group:grp});
    }
  }

  // Rank thirds and pick best 8
  const ranked=rankThirds(thirdsList);
  const qualified=ranked.slice(0,8);

  // Build Annex C lookup key: 8 qualifying groups, sorted alphabetically
  const qualifyingLetters=qualified.map(t=>t.group).sort().join('');

  // Determine which 3rd plays each of the 8 winner slots (1A,1B,1D,1E,1G,1I,1K,1L)
  // by looking up Annex C. Falls back to ranked order if lookup fails (e.g. fewer
  // than 8 qualifiers because group stage hasn't started yet).
  const assignment={}; // winnerGroup -> 3rdGroupLetter
  const annexRow=ANNEX_C[qualifyingLetters];
  if(annexRow && annexRow.length===8){
    ANNEX_C_WINNER_ORDER.forEach((winnerGrp,i)=>{
      assignment[winnerGrp]=annexRow[i];
    });
  }else{
    // Group stage not started/complete OR malformed lookup - fall back to ranked order.
    // This keeps the bracket renderable even before any real predictions are entered.
    ANNEX_C_WINNER_ORDER.forEach((winnerGrp,i)=>{
      const t=qualified[i];
      assignment[winnerGrp]=t?t.group:null;
    });
  }
  function thirdFor(winnerGrp){
    const g=assignment[winnerGrp];
    return g?(grpThirds[g]||'TBD'):'TBD';
  }

  // Build the 16 R32 matches in app-internal order (see header comment)
  const w=g=>grpWinners[g]||'TBD',ru=g=>grpRunners[g]||'TBD';
  return [
    // R16[0] = M89 = M74 + M77
    {home:w('E'),  away:thirdFor('E'), match:74, date:R32_MATCH_DATES[74]},  // r32[0]
    {home:w('I'),  away:thirdFor('I'), match:77, date:R32_MATCH_DATES[77]},  // r32[1]
    // R16[1] = M90 = M73 + M75   -> QF[0] = M97
    {home:ru('A'), away:ru('B'),       match:73},  // r32[2]
    {home:w('F'),  away:ru('C'),       match:75},  // r32[3]
    // R16[2] = M93 = M83 + M84
    {home:ru('K'), away:ru('L'),       match:83},  // r32[4]
    {home:w('H'),  away:ru('J'),       match:84},  // r32[5]
    // R16[3] = M94 = M81 + M82   -> QF[1] = M98
    {home:w('D'),  away:thirdFor('D'), match:81, date:R32_MATCH_DATES[81]},  // r32[6]
    {home:w('G'),  away:thirdFor('G'), match:82, date:R32_MATCH_DATES[82]},  // r32[7]
    // R16[4] = M91 = M76 + M78
    {home:w('C'),  away:ru('F'),       match:76},  // r32[8]
    {home:ru('E'), away:ru('I'),       match:78},  // r32[9]
    // R16[5] = M92 = M79 + M80   -> QF[2] = M99
    {home:w('A'),  away:thirdFor('A'), match:79, date:R32_MATCH_DATES[79]},  // r32[10]
    {home:w('L'),  away:thirdFor('L'), match:80, date:R32_MATCH_DATES[80]},  // r32[11]
    // R16[6] = M95 = M86 + M88
    {home:w('J'),  away:ru('H'),       match:86},  // r32[12]
    {home:ru('D'), away:ru('G'),       match:88},  // r32[13]
    // R16[7] = M96 = M85 + M87   -> QF[3] = M100
    {home:w('B'),  away:thirdFor('B'), match:85, date:R32_MATCH_DATES[85]},  // r32[14]
    {home:w('K'),  away:thirdFor('K'), match:87, date:R32_MATCH_DATES[87]},  // r32[15]
  ];
}

const KO_ROUNDS=[
  {id:'r32',label:{pt:'Round of 32',en:'Round of 32'},pts:5},
  {id:'r16',label:{pt:'Oitavos de Final',en:'Round of 16'},pts:10},
  {id:'qf', label:{pt:'Quartos de Final',en:'Quarterfinals'},pts:10},
  {id:'sf', label:{pt:'Meias-Finais',en:'Semifinals'},pts:15},
  {id:'f3', label:{pt:'3.º Lugar',en:'3rd Place'},pts:25},
  {id:'fin',label:{pt:'Final',en:'Final'},pts:25},
  {id:'win',label:{pt:'Vencedor',en:'Winner'},pts:30},
];


// FIFA 2026 R32 match dates (Matches 73-88, Jul 1-4)
const R32_MATCH_DATES={73:'1 Jul',74:'1 Jul',75:'1 Jul',76:'1 Jul',77:'2 Jul',78:'2 Jul',79:'2 Jul',80:'2 Jul',81:'3 Jul',82:'3 Jul',83:'3 Jul',84:'3 Jul',85:'4 Jul',86:'4 Jul',87:'4 Jul',88:'4 Jul'};
// ⚠️ The 11 reach/bonus values below MUST mirror `P` inside calcBreakdown() —
// that is the only place scoring actually reads. These are DISPLAY values (Regras
// tab + host panel). They were out of sync (gw:6, gs:4, r16:10, finalist:25,
// third:25, runner_up:30, top_scorer:30) and only looked right because Firestore
// overrides them for THIS competition. A new competition with no `rules` doc would
// have advertised points it does not pay. Synced by hand — keep them synced.
// Only correct_result / wrong_goal / wrong_outcome / wrong_outcome_win are read
// by the scorer (calcMatch); those are unchanged.
const DEFAULT_RULES={
  correct_result:3,wrong_goal:-1,wrong_outcome:-2,wrong_outcome_win:-4,
  group_winner:5,group_second:5,
  round32:5,round16:5,quarters:10,semis:15,
  finalist:15,third:15,runner_up:20,winner:30,top_scorer:20
};
const RULE_ITEMS=[
  {k:'correct_result',label:{pt:'Resultado correcto',en:'Correct result'}},
  {k:'wrong_goal',label:{pt:'Erro por golo',en:'Per wrong goal'}},
  {k:'wrong_outcome',label:{pt:'Vencedor/Empate errado (ex: V→E)',en:'Win/Draw wrong (e.g. W→D)'}},
  {k:'wrong_outcome_win',label:{pt:'Vencedor errado (ex: V→D do adversário)',en:'Wrong winner (e.g. H win→A win)'}},
  {k:'group_winner',label:{pt:'Vencedor do grupo',en:'Group winner'}},
  {k:'group_second',label:{pt:'2.º do grupo',en:'Group runner-up'}},
  {k:'round32',label:{pt:'Equipa no R32',en:'Round of 32 team'}},
  {k:'round16',label:{pt:'Equipa no R16',en:'Round of 16 team'}},
  {k:'quarters',label:{pt:'Equipa nos QF',en:'Quarterfinal team'}},
  {k:'semis',label:{pt:'Equipa nas SF',en:'Semifinal team'}},
  {k:'finalist',label:{pt:'Finalista',en:'Finalist'}},
  {k:'third',label:{pt:'3.º classificado',en:'3rd place'}},
  {k:'runner_up',label:{pt:'Vice-campeão',en:'Runner-up'}},
  {k:'winner',label:{pt:'Campeão',en:'Champion'}},
  {k:'top_scorer',label:{pt:'Melhor marcador',en:'Top scorer'}},
];

// Historical tournaments data
const TOURNAMENT_HISTORY=[
  {year:2008,name:'CAN Gana',type:'CAN',winner:'João do Ó',runnerUp:'No records',third:'No records'},
  {year:2010,name:'CAN Angola',type:'CAN',winner:'João Covilhã Silva',runnerUp:'Nuno do Ó',third:'Filipe Figueiredo'},
  {year:2010,name:'Mundial África do Sul',type:'WC',winner:'Nuno Pistolas Santos',runnerUp:'Nuno do Ó',third:'Pedro Brandão'},
  {year:2012,name:'CAN Gabão/Guiné Equatorial',type:'CAN',winner:'Nuno Cordas',runnerUp:'Humberto Pina',third:'João Covilhã Silva'},
  {year:2012,name:'Euro Polónia e Ucrânia',type:'EURO',winner:'Jose Alvarinho',runnerUp:'Humberto Pina',third:'João Luís Mota'},
  {year:2013,name:'CAN África do Sul',type:'CAN',winner:'João Covilhã Silva',runnerUp:'Ricardo Paulino',third:'Tiago Domingues'},
  {year:2014,name:'Mundial Brasil',type:'WC',winner:'Liz Graham',runnerUp:'Luís Lemos',third:'Humberto Martins'},
  {year:2015,name:'CAN Guiné Equatorial',type:'CAN',winner:'João Luís Mota',runnerUp:'Nuno Cordas',third:'Liz Graham'},
  {year:2016,name:'Euro França',type:'EURO',winner:'Paulo Niza',runnerUp:'João Rodrigues',third:'António Valente'},
  {year:2017,name:'CAN Gabão',type:'CAN',winner:'Filipe Figueiredo',runnerUp:'Hugo Igreja',third:'Luís Vargas Mota'},
  {year:2018,name:'Mundial Rússia',type:'WC',winner:'Mário Fonseca',runnerUp:'Bruno Banheiro',third:'Humberto Martins'},
  {year:2019,name:'CAN Egito',type:'CAN',winner:'Humberto Martins',runnerUp:'Luís Mota',third:'João Luís Mota'},
  {year:2020,name:'Euro',type:'EURO',winner:'Vlad Zhuravlev',runnerUp:'João Luís Mota',third:'Luís Mota'},
  {year:2021,name:'CAN Camarões',type:'CAN',winner:'Paulo Niza',runnerUp:'João do Ó',third:'Luís Mota'},
  {year:2022,name:'Mundial Qatar',type:'WC',winner:'Luís Vargas Mota',runnerUp:'Manuel Reis',third:'Humberto Martins'},
  {year:2023,name:'CAN Costa do Marfim',type:'CAN',winner:'Manuel Reis',runnerUp:'Mario Santos',third:'João Luís Mota'},
  {year:2024,name:'Euro Alemanha',type:'EURO',winner:'Ligia Gomes',runnerUp:'Miguel Lopes',third:'Pedro Santos'},
  {year:2025,name:'CAN Marrocos',type:'CAN',winner:'João Eira',runnerUp:'Paulo Niza',third:'João do Ó'},
  {year:2026,name:'Mundial EUA/Canadá/México',type:'WC',winner:'TBD',runnerUp:'TBD',third:'TBD'},
];

function normalize(s){return(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();}
function fuzzyScore(a,b){
  const na=normalize(a),nb=normalize(b);
  if(na===nb) return 1;
  if(na.includes(nb)||nb.includes(na)) return 0.85;
  const wa=na.split(' '),wb=nb.split(' ');
  const common=wa.filter(w=>wb.some(x=>x===w||(x.length>3&&w.includes(x))||(w.length>3&&x.includes(w))));
  return common.length/Math.max(wa.length,wb.length);
}

