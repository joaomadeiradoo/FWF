// ═══ LIVE SCORES ═══
// ── Source: data/live.json, published by .github/workflows/results.yml ──
//
// WHY NOT CALL AN API DIRECTLY. Measured 17 Jul 2026 from the console on the
// live site, both times:
//   api-football       CORS ✅  2026 data ❌  "Free plans do not have access to
//                                             this season, try from 2022 to 2024"
//   football-data.org  CORS ❌  2026 data ✅  Access-Control-Allow-Origin is
//                                             hardcoded to 'http://localhost'
// Neither works from a browser. A GitHub Action fetches server-side (no CORS,
// token in repo secrets) and commits data/live.json. We read it from our OWN
// origin, so nothing blocks it and no key ships to the client. The old
// API_FOOTBALL_KEY and the canApi/bumpApi daily counter are now unused by this
// path — that counter measured a per-day budget that no longer exists.
//
// LATENCY, honestly: GitHub queues scheduled runs, so 5-15 min late is normal.
// Fine for results. The live dot will lag. A Cloudflare Worker would fix that.
const LIVE_WINDOW_MS=3.5*60*60*1000; // kick-off → assume over after 3h30 (90'+ET+pens+breaks)
async function fetchAll(){
  try{
    // Cache-bust: GitHub Pages' CDN caches assets hard, and a stale live.json
    // would look exactly like "nothing has happened yet".
    const r=await fetch('data/live.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok){console.warn('[live] data/live.json not published yet:',r.status);return;} // fall back to local ticker
    const d=await r.json();
    if(!d||!Array.isArray(d.matches)) return;
    const now=Date.now();
    const ko=m=>new Date(m.utcDate).getTime();
    const nm=id=>fdTeamPT(id)||null;

    // LIVE. Deliberately NOT keyed on a status string: the only in-play values
    // we have ever seen are FINISHED and TIMED, because every match in the
    // sample payload was one or the other. Guessing 'IN_PLAY' would be
    // inventing API vocabulary. Instead: not finished + kicked off + inside a
    // 3h30 window. That uses only utcDate and FINISHED, both verified.
    // (A postponed match would show as live for 3h30. Known, acceptable.)
    liveData=d.matches
      .filter(m=>m.status!==FD_DONE&&ko(m)<=now&&now-ko(m)<LIVE_WINDOW_MS)
      .map(m=>{const sc=fdMatchScore(m);return{home:nm(m.homeTeam.id)||m.homeTeam.name,away:nm(m.awayTeam.id)||m.awayTeam.name,
        hs:sc?sc.home:null,as:sc?sc.away:null,min:null,status:m.status};}); // min: no elapsed-minute field exists in this API
    if(liveData.length) console.log('[live] in-play status string is:',JSON.stringify(liveData.map(m=>m.status)));

    // UPCOMING — next 3 by kick-off, with a real time. The app has no kick-off
    // times of its own (MATCH_SCHEDULE is date-only, line ~4686 hardcodes
    // time:''), so this is the first real clock in the project. Unblocks #16/#20.
    upcomingData=d.matches
      .filter(m=>m.status!==FD_DONE&&ko(m)>now)
      .sort((a,b)=>ko(a)-ko(b)).slice(0,3)
      .map(m=>({home:nm(m.homeTeam.id)||m.homeTeam.name,away:nm(m.awayTeam.id)||m.awayTeam.name,
        time:new Date(m.utcDate).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Lisbon'}),venue:''}));

    // FINISHED — feeds autoApplyScores only; renderLive builds RECENTES from
    // actualScores, not from here. Shape kept identical to the old api-football
    // one so autoApplyScores needs no change when it is eventually re-armed.
    recentData=d.matches
      .filter(m=>m.status===FD_DONE)
      .sort((a,b)=>ko(a)-ko(b)).slice(-30)
      .map(m=>{const sc=fdMatchScore(m);if(!sc) return null;
        return{home:nm(m.homeTeam.id)||m.homeTeam.name,away:nm(m.awayTeam.id)||m.awayTeam.name,
          hs:sc.home,as:sc.away,penHome:sc.pens?sc.pens.home:null,penAway:sc.pens?sc.pens.away:null,round:FD_STAGE[m.stage]||null};})
      .filter(Boolean);

    // AUTO-APPLY DESLIGADO (2026-06-29): resultados inseridos manualmente pelo host.
    // A escrita automática reescrevia o actualScores inteiro e causava sobreposição
    // entre dispositivos ("o último a fazer refresh ganhava"). Para reativar:
    // if(isAdmin) await autoApplyScores(recentData);
    //
    // ⚠️ STILL DEAD, DELIBERATELY. Changing the data source does not fix the
    // write. Before re-arming: convert to field-path writes inside
    // runTransaction (same pattern as mutateMember). Fixing the pipe and
    // re-introducing the worst bug in the project's history in one commit
    // would be a bad day.
    updateLiveTimestamp();
    renderLive();
  }catch(e){console.warn('[live]',e);}
}
// Back-compat aliases — both now route through the single unified call.
async function fetchLive(){return fetchAll();}
async function fetchUpcoming(){return fetchAll();}
function updateLiveTimestamp(){
  const el=$('live-updated');if(!el) return;
  const now=new Date();
  const time=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  el.textContent=`· ${lang==='pt'?'atualizado':'updated'} às ${time}`;
}
function scheduleApi(){
  clearInterval(apiPollTimer);
  if(!window.API_FOOTBALL_KEY) return;
  if(!isAdmin) return;

  // MULTI-ADMIN COORDINATION + ADAPTIVE CADENCE: the timer ticks every 5 min
  // (cheap — only Firestore reads, no API call), but an actual API fetch only
  // happens when enough time has passed since the last fetch (tracked globally
  // in Firestore via lastFetchedAt, so all admins share one schedule).
  //   • A game is LIVE  → fetch every ~10 min (fresh scores during play)
  //   • Nothing live    → fetch every ~30 min (just catch kick-offs / results)
  // This keeps live updates frequent during games while staying well under the
  // 100/day budget on the idle stretches.
  const LIVE_INTERVAL_MS=9.5*60*1000;
  const IDLE_INTERVAL_MS=29*60*1000;

  async function maybeFetch(){
    // GATE 1: don't poll before the tournament has started — no games to fetch.
    if(Date.now()<TOURNAMENT_START.getTime()){return;}
    // GATE 2: only poll during the daily game window. WC 2026 kick-offs span
    // ~16:00 UTC (12pm ET) to ~04:00 UTC next day (9pm PT); latest games finish
    // ~06:30 UTC. Window 14:00–07:00 UTC covers every slot with buffer on both
    // ends. Outside it, skip. (Manual "Forçar fetch" ignores this.)
    const h=new Date().getUTCHours();
    const inGameHours=(h>=14||h<7);
    if(!inGameHours){return;}
    const usage=await getApiUsage();
    if(usage.n>=85){
      console.warn('API: daily limit reached ('+usage.n+'/100), polling suspended');
      clearInterval(apiPollTimer);
      toast('⚠️ Limite diário da API atingido — fetch pausado',true);
      return;
    }
    // Adaptive interval: faster when a game is live, slower when idle.
    const minInterval=(liveData&&liveData.length>0)?LIVE_INTERVAL_MS:IDLE_INTERVAL_MS;
    // Check when the last fetch happened (stored in competition doc)
    try{
      const{db,doc,getDoc,updateDoc}=window._fb;
      const snap=await getDoc(doc(db,'competitions',currentCompId));
      const lastFetch=snap.data()?.lastFetchedAt||0;
      const msSinceLast=Date.now()-lastFetch;
      if(msSinceLast<minInterval){
        // Last fetch (by any admin) was recent enough — skip this tick
        console.log('API: skipping fetch, last was '+(Math.round(msSinceLast/1000/60))+'min ago (need '+(Math.round(minInterval/60000))+'min)');
        return;
      }
      // Claim this fetch window immediately before fetching
      await updateDoc(doc(db,'competitions',currentCompId),{lastFetchedAt:Date.now()});
    }catch(e){console.warn('API coord check failed:',e);}
    fetchAll(); // ONE call gives upcoming + live + finished
  }

  apiPollTimer=setInterval(maybeFetch,5*60*1000); // tick every 5min; actual fetch gated by adaptive interval above
}
async function forceFetch(){
  if(!isAdmin){toast('Apenas o host/admin',true);return;}
  const usage=await getApiUsage();
  if(usage.n>=85){toast('⚠️ Limite diário quase atingido ('+usage.n+'/100)',true);return;}
  const btn=document.querySelector('[onclick="forceFetch()"]');
  if(btn){btn.disabled=true;btn.textContent='⏳ A carregar...';}
  await fetchAll(); // single unified call
  // Update coordination timestamp after manual fetch too
  try{const{db,doc,updateDoc}=window._fb;await updateDoc(doc(db,'competitions',currentCompId),{lastFetchedAt:Date.now()});}catch(e){}
  toast(lang==='pt'?'Fetch feito!':'Fetched!');
  if(btn){btn.disabled=false;btn.textContent='🔄 Forçar fetch';}
}

// ═══ AUTO-APPLY API SCORES ═══
function normalizeTeamName(name){
  // Remove flag emojis and normalize spacing
  return name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu,'').replace(/🇵🇹|🇧🇷|🇦🇷|🇫🇷|🇪🇸|🇩🇪|🇮🇹|🇬🇧|🏴󠁧󠁢󠁥󠁮󠁧󠁿|🇳🇱|🇧🇪|🇵🇹|🇲🇽|🇺🇸|🇨🇦/g,'').trim();
}
function matchTeams(match,apiHome,apiAway){
  const mh=normalizeTeamName(match.home).toLowerCase();
  const ma=normalizeTeamName(match.away).toLowerCase();
  const ah=normalizeTeamName(apiHome).toLowerCase();
  const aa=normalizeTeamName(apiAway).toLowerCase();
  return (mh===ah||mh.includes(ah)||ah.includes(mh))&&(ma===aa||ma.includes(aa)||aa.includes(ma));
}

// ═══ football-data.org (#6) — identity, vocabulary, and the fullTime trap ═══
// Verified against a real /v4/competitions/WC/matches payload (104 matches,
// 102 played) pulled 17 Jul 2026. Nothing here is written from memory.
//
// WHY IDs AND NOT NAMES: the API says "Turkey"; we say "Türkiye". It says
// "Bosnia-Herzegovina" and "Cape Verde Islands"; EN_TO_PT said "Bosnia and
// Herzegovina" and "Cape Verde" — 2 of 48 silently unresolvable. Names drift,
// numeric team ids do not. Lookup is EXACT — never substring. ("Congo" is a
// prefix of "Congo DR"; substring matching is how you merge two teams.)
const FD_TEAM_ID={
  "México":769, "África do Sul":774, "Coreia do Sul":772, "Czechia":798, // A
  "Canadá":828, "Bósnia e Herzegovina":1060, "Qatar":8030, "Suíça":788, // B
  "Brasil":764, "Marrocos":815, "Haiti":836, "Escócia":8873, // C
  "EUA":771, "Paraguai":761, "Austrália":779, "Türkiye":803, // D
  "Alemanha":759, "Curaçao":9460, "Costa do Marfim":1935, "Equador":791, // E
  "Países Baixos":8601, "Japão":766, "Suécia":792, "Tunísia":802, // F
  "Bélgica":805, "Egipto":825, "Irão":840, "Nova Zelândia":783, // G
  "Espanha":760, "Cabo Verde":1930, "Arábia Saudita":801, "Uruguai":758, // H
  "França":773, "Senegal":804, "Noruega":8872, "Iraque":8062, // I
  "Argentina":762, "Argélia":778, "Áustria":816, "Jordânia":8049, // J
  "Portugal":765, "Congo DR":1934, "Uzbequistão":8070, "Colômbia":818, // K
  "Inglaterra":770, "Croácia":799, "Gana":763, "Panamá":1836, // L
};
const FD_ID_TO_PT=Object.fromEntries(Object.entries(FD_TEAM_ID).map(([pt,id])=>[id,pt]));
const fdTeamPT=id=>FD_ID_TO_PT[id]||null; // null, never a guess

// The API's own stage vocabulary. Observed set, exhaustive for this payload:
// GROUP_STAGE(72) LAST_32(16) LAST_16(8) QUARTER_FINALS(4) SEMI_FINALS(2)
// THIRD_PLACE(1) FINAL(1). It is NOT api-football's 'Round of 32' / '3rd Place
// Final' — ROUND_MAP below is dead vocabulary from the old provider.
const FD_STAGE={GROUP_STAGE:'group',LAST_32:'r32',LAST_16:'r16',QUARTER_FINALS:'qf',SEMI_FINALS:'sf',THIRD_PLACE:'f3',FINAL:'fin'};
// Observed status set: FINISHED, TIMED. The request filter vocabulary differs
// from the response vocabulary: ?status=SCHEDULED returns status:"TIMED".
const FD_DONE='FINISHED';

// ⚠️ THE TRAP. For duration==='PENALTY_SHOOTOUT', score.fullTime is
// regularTime + extraTime + penalties — NOT the score the match finished on.
// Confirmed on all 4 shootouts in the 2026 payload:
//   GER v PAR  real 1-1 (pens 3-4)  fullTime says 4-5
//   NED v MAR  real 1-1 (pens 2-3)  fullTime says 3-4
//   AUS v EGY  real 1-1 (pens 2-4)  fullTime says 3-5
//   SUI v COL  real 0-0 (pens 4-3)  fullTime says 4-3
// Reading fullTime blindly stores 4-5 for a 1-1 draw. For EXTRA_TIME with no
// shootout, fullTime IS the honest 120' score. This is inference from 4
// matches: the arithmetic is exact on all 4, but 4 is 4. It is falsifiable —
// any shootout where fullTime !== regular+extra+pens trips the guard below.
function fdMatchScore(m){
  const s=m&&m.score; if(!s||!s.fullTime) return null;
  if(s.fullTime.home==null||s.fullTime.away==null) return null;
  const add=(k,side)=>s[k]?(s[k][side]??0):0;
  if(s.duration==='PENALTY_SHOOTOUT'){
    const home=add('regularTime','home')+add('extraTime','home');
    const away=add('regularTime','away')+add('extraTime','away');
    if(home+add('penalties','home')!==s.fullTime.home||away+add('penalties','away')!==s.fullTime.away){
      console.warn('[fd] unexpected PENALTY_SHOOTOUT shape, refusing to guess:',m.id,JSON.stringify(s));
      return null;
    }
    return {home,away,pens:{home:add('penalties','home'),away:add('penalties','away')},winner:s.winner||null};
  }
  return {home:s.fullTime.home,away:s.fullTime.away,pens:null,winner:s.winner||null};
}
async function autoApplyScores(finishedMatches){
  if(!isAdmin||!currentCompId) return;
  const{db,doc,updateDoc}=window._fb;
  let updated=false;

  // ── English→Portuguese team name mapping for API responses ──
  const EN_TO_PT={
    'Mexico':'México','South Africa':'África do Sul','South Korea':'Coreia do Sul',
    'Korea Republic':'Coreia do Sul','Czech Republic':'Czechia','Czechia':'Czechia',
    'Canada':'Canadá','Bosnia':'Bósnia e Herzegovina','Bosnia and Herzegovina':'Bósnia e Herzegovina','Bosnia-Herzegovina':'Bósnia e Herzegovina','Bosnia-H.':'Bósnia e Herzegovina',
    'Qatar':'Qatar','Switzerland':'Suíça','Brazil':'Brasil','Morocco':'Marrocos',
    'Haiti':'Haiti','Scotland':'Escócia','USA':'EUA','United States':'EUA',
    'Paraguay':'Paraguai','Australia':'Austrália','Turkey':'Türkiye','Turkiye':'Türkiye',
    'Germany':'Alemanha','Curacao':'Curaçao','Ivory Coast':'Costa do Marfim',
    "Cote d'Ivoire":'Costa do Marfim',"Côte d'Ivoire":'Costa do Marfim',
    'Ecuador':'Equador','Netherlands':'Países Baixos','Japan':'Japão',
    'Sweden':'Suécia','Tunisia':'Tunísia','Belgium':'Bélgica','Egypt':'Egipto',
    'Iran':'Irão','New Zealand':'Nova Zelândia','Spain':'Espanha',
    'Cape Verde':'Cabo Verde','Cape Verde Islands':'Cabo Verde','Saudi Arabia':'Arábia Saudita','Uruguay':'Uruguai',
    'France':'França','Senegal':'Senegal','Norway':'Noruega','Iraq':'Iraque',
    'Argentina':'Argentina','Algeria':'Argélia','Austria':'Áustria','Jordan':'Jordânia',
    'Portugal':'Portugal','DR Congo':'Congo DR','Congo DR':'Congo DR',
    'Uzbekistan':'Uzbequistão','Colombia':'Colômbia','England':'Inglaterra',
    'Croatia':'Croácia','Ghana':'Gana','Panama':'Panamá',
  };
  const toPT=name=>EN_TO_PT[name]||name;

  // ── API round name → KO round id ──
  const ROUND_MAP={
    'Round of 32':'r32','Round of 16':'r16',
    'Quarter-finals':'qf','Quarter-Finals':'qf','Quarterfinals':'qf',
    'Semi-finals':'sf','Semi-Finals':'sf','Semifinals':'sf',
    '3rd Place Final':'f3','Third Place':'f3',
    'Final':'fin',
  };

  // ── Group stage matches (exact score) ──
  // Match in EITHER orientation: the API's home/away may differ from our
  // schedule's. When swapped, swap the score too so it lands on the right team.
  const teamEq=(a,b)=>{
    const x=normalizeTeamName(a).toLowerCase(),y=normalizeTeamName(b).toLowerCase();
    return x===y||x.includes(y)||y.includes(x);
  };
  for(const apiMatch of finishedMatches){
    const ah=toPT(apiMatch.home),aa=toPT(apiMatch.away);
    let found=null,swapped=false;
    for(const m of ALL_MATCHES){
      if(teamEq(m.home,ah)&&teamEq(m.away,aa)){found=m;swapped=false;break;}
      if(teamEq(m.home,aa)&&teamEq(m.away,ah)){found=m;swapped=true;break;}
    }
    if(found){
      const hs=swapped?apiMatch.as:apiMatch.hs;
      const as=swapped?apiMatch.hs:apiMatch.as;
      const existing=actualScores[found.id];
      if(!existing||(existing.source==='api')){
        actualScores[found.id]={home:hs,away:as,source:'api'};
        updated=true;
      }
    }
  }

  // ── KO stage: determine winner and slot ──
  // Build current R32 matchups to identify slot indices
  const r32Teams=getR32Teams(currentUser?.uid);

  for(const apiMatch of finishedMatches){
    if(!apiMatch.round) continue;
    const roundId=ROUND_MAP[apiMatch.round];
    if(!roundId) continue;

    const homeTeam=toPT(apiMatch.home);
    const awayTeam=toPT(apiMatch.away);
    // Determine winner: higher score wins; if draw (AET/PEN) use penScore if available
    let winner=null;
    if(apiMatch.hs>apiMatch.as) winner=homeTeam;
    else if(apiMatch.as>apiMatch.hs) winner=awayTeam;
    else if(apiMatch.penHome!=null&&apiMatch.penAway!=null){
      winner=apiMatch.penHome>apiMatch.penAway?homeTeam:awayTeam;
    }
    if(!winner) continue;

    const ko=actualScores[`ko_${roundId}`]||[];
    let slotIdx=-1;

    if(roundId==='r32'){
      slotIdx=r32Teams.findIndex(m=>
        (m.home===homeTeam&&m.away===awayTeam)||
        (m.home===awayTeam&&m.away===homeTeam)
      );
      // Fallback: if slot not found (group results incomplete), append winner
      // to ko_r32 anyway. Scoring is Set-based so slot position doesn't matter.
      if(slotIdx===-1&&winner){
        const newKo=[...(actualScores.ko_r32||[])];
        if(!newKo.includes(winner)){newKo.push(winner);actualScores.ko_r32=newKo;updated=true;}
        continue;
      }
    }else if(roundId==='r16'){
      // R16 slot i feeds from R32 slots 2i and 2i+1
      const r32actual=actualScores.ko_r32||[];
      slotIdx=[0,1,2,3,4,5,6,7].findIndex(i=>
        [r32actual[i*2],r32actual[i*2+1]].includes(homeTeam)&&
        [r32actual[i*2],r32actual[i*2+1]].includes(awayTeam)
      );
    }else if(roundId==='qf'){
      const r16actual=actualScores.ko_r16||[];
      slotIdx=[0,1,2,3].findIndex(i=>
        [r16actual[i*2],r16actual[i*2+1]].includes(homeTeam)&&
        [r16actual[i*2],r16actual[i*2+1]].includes(awayTeam)
      );
    }else if(roundId==='sf'){
      const qfactual=actualScores.ko_qf||[];
      slotIdx=[0,1].findIndex(i=>
        [qfactual[i*2],qfactual[i*2+1]].includes(homeTeam)&&
        [qfactual[i*2],qfactual[i*2+1]].includes(awayTeam)
      );
    }else if(roundId==='f3'){
      // 3rd place match: both teams are SF losers
      slotIdx=0;
    }else if(roundId==='fin'){
      // Final: slot 0 = champion, slot 1 = runner-up
      slotIdx=0;
    }

    if(slotIdx===-1&&roundId!=='f3'&&roundId!=='fin') continue;

    const newKo=[...ko];
    newKo[roundId==='fin'?0:slotIdx]=winner;
    // For final, also set runner-up (slot 1)
    if(roundId==='fin'){
      const loser=winner===homeTeam?awayTeam:homeTeam;
      newKo[1]=loser;
    }

    const existing=actualScores[`ko_${roundId}`]||[];
    if(existing[roundId==='fin'?0:slotIdx]!==winner){
      actualScores[`ko_${roundId}`]=newKo;
      updated=true;
    }
  }

  if(updated){
    await updateDoc(doc(db,'competitions',currentCompId),{actualScores});
    renderGroupMatches();renderGruposTab();renderBracket();renderBracketMobile();renderBracketSwipe();
    renderLeaderboard();renderLive();
  }
}
function renderLive(){
  const c=$('live-content');if(!c) return;
  const uid=currentUser?.uid;const myPreds=allPredictions[uid]||{};
  function predPill(homeName,awayName){
    const m=ALL_MATCHES.find(m=>(m.home===homeName&&m.away===awayName)||(m.home===awayName&&m.away===homeName));
    if(!m) return'';const p=myPreds[m.id]||{};if(p.home===undefined||p.home==='') return'';
    const act=actualScores[m.id];let cls='';
    if(act&&act.home!==undefined&&act.home!==''){const pts=calcMatch(p,act);cls=pts>0?'correct':pts<0?'wrong':'';}
    const flip=m.home!==homeName;const ph=flip?p.away:p.home,pa=flip?p.home:p.away;
    return`<span class="pred-pill ${cls}">👤 ${ph}-${pa}</span>`;
  }
  let html='';
  // Match-day parser (schedule dates are "DD Jun"/"DD Jul" in Portugal time) plus
  // today's number, so the homepage shows only TODAY's and upcoming games — past-day
  // games drop once their day ends. Display-only; predictions/scoring untouched.
  const parseDate=d=>{if(!d) return 9999;const mth=d.includes('Jul')?700:d.includes('Jun')?600:0;return mth+(parseInt(d,10)||0);};
  const _pt=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Lisbon',month:'numeric',day:'numeric'}).formatToParts(new Date());
  const todayNum=((+_pt.find(p=>p.type==='month').value)===7?700:600)+(+_pt.find(p=>p.type==='day').value);
  // Recentes: the 3 most recently played results, built ONLY from entered results
  // (actualScores — manual now, plus any API-applied later), ordered by match date
  // (Portugal time), newest first. Independent of the live API list.
  const allRecent=ALL_MATCHES
    .filter(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';})
    .sort((a,b)=>parseDate(a.date)-parseDate(b.date))
    .slice(-3)
    .reverse()
    .map(m=>({home:m.home,away:m.away,hs:actualScores[m.id].home,as:actualScores[m.id].away}));
  if(allRecent.length){
    html+=`<div style="margin-bottom:10px"><div class="sec-lbl">🏁 ${lang==='pt'?'Recentes':'Recent'}</div>`;
    allRecent.forEach(m=>{html+=`<div class="lmc"><div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <span style="font-weight:700;font-size:.8rem;flex:1;text-align:right">${m.home}</span>
      <div style="text-align:center;min-width:70px"><div class="ls">${m.hs} - ${m.as}</div>${predPill(m.home,m.away)}</div>
      <span style="font-weight:700;font-size:.8rem;flex:1">${m.away}</span></div><div style="text-align:center;font-size:.6rem;color:var(--muted);margin-top:2px">FT</div></div>`;});
    html+='</div>';
  }
  if(liveData.length){
    html+=`<div style="margin-bottom:10px"><div class="sec-lbl" style="color:var(--red)">🔴 ${lang==='pt'?'AO VIVO':'LIVE'}</div>`;
    liveData.forEach(m=>{html+=`<div class="lmc" style="border-color:rgba(230,57,70,.35)"><div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <span style="font-weight:700;font-size:.8rem;flex:1;text-align:right">${m.home}</span>
      <div style="text-align:center;min-width:70px"><div class="ls">${m.hs??'-'} - ${m.as??'-'}</div><div class="lmin">${m.min?m.min+"'":m.status}</div>${predPill(m.home,m.away)}</div>
      <span style="font-weight:700;font-size:.8rem;flex:1">${m.away}</span></div></div>`;});
    html+='</div>';
  }
  // Fallback upcoming (when no API): only today's and future games, sorted by match day.
  const manUp=ALL_MATCHES
    .filter(m=>(!actualScores[m.id]||actualScores[m.id].home===undefined)&&parseDate(m.date)>=todayNum)
    .sort((a,b)=>parseDate(a.date)-parseDate(b.date))
    .slice(0,3)
    .map(m=>({home:m.home,away:m.away,time:'',date:m.date}));
  const allUp=[...upcomingData,...manUp].slice(0,3);
  if(allUp.length){
    html+=`<div><div class="sec-lbl">⏳ ${lang==='pt'?'Próximos':'Upcoming'}</div>`;
    allUp.forEach(m=>{html+=`<div class="lmc" style="border-color:rgba(255,215,0,.12)"><div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <span style="font-weight:700;font-size:.8rem;flex:1;text-align:right">${m.home}</span>
      <span style="font-family:var(--fh);font-size:.9rem;color:var(--gold);min-width:44px;text-align:center">${m.time||m.date||'vs'}</span>
      <span style="font-weight:700;font-size:.8rem;flex:1">${m.away}</span></div>${m.venue?`<div style="text-align:center;font-size:.6rem;color:var(--muted);margin-top:2px">${m.venue}</div>`:''}</div>`;});
    html+='</div>';
  }
  c.innerHTML=html||`<p style="color:var(--muted);font-size:.82rem">${lang==='pt'?'Sem jogos ao momento.':'No matches at this time.'}</p>`;
}

