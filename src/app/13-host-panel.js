// ═══ POINTS TOGGLES ═══
function renderPtsToggles(){
  if(!isAdmin) return;const c=$('pts-toggles-content');if(!c) return;
  const toggleDefs=[
    {key:'groupWinner',label:{pt:`Vencedor do grupo (+${rules.group_winner}pts)`,en:`Group winner (+${rules.group_winner}pts)`},desc:{pt:'Quando ON, os pontos por acertar o vencedor do grupo aplicam-se automaticamente. Quando OFF, esses pontos não contam até carregares em "Lançar".',en:'When ON, group winner points apply automatically. When OFF, they don\'t count until you press Launch.'}},
    {key:'groupSecond',label:{pt:`2.º classificado do grupo (+${rules.group_second}pts)`,en:`Group runner-up (+${rules.group_second}pts)`},desc:{pt:'Controla quando os pontos por acertar o 2.º classificado são atribuídos.',en:'Controls when group runner-up points are awarded.'}},
    {key:'round32',label:{pt:`Equipa no R32 (+${rules.round32}pts)`,en:`Round of 32 team (+${rules.round32}pts)`},desc:{pt:'Controla quando os pontos por acertar as equipas no R32 são atribuídos.',en:'Controls when Round of 32 qualification points are awarded.'}},
  ];
  c.innerHTML=toggleDefs.map(td=>{
    const isOn=ptsToggles[td.key]!==false;
    const isLocked=ptsToggles[`${td.key}_locked`]===true;
    return`<div class="pts-toggle-item${isLocked?' pts-toggle-locked':''}">
      <div class="pts-toggle-row">
        <div style="flex:1">
          <div style="font-weight:700;font-size:.84rem;margin-bottom:2px">${td.label[lang]}</div>
          <div style="font-size:.72rem;color:var(--muted)">${td.desc[lang]}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${isLocked
            ? `<span class="badge badge-open">✅ ${lang==='pt'?'Activo':'Active'}</span>`
            : `<label class="toggle-switch">
                <input type="checkbox" ${isOn?'checked':''} onchange="setPtsToggle('${td.key}',this.checked)">
                <span class="toggle-slider"></span>
              </label>
              <span style="font-size:.75rem;color:${isOn?'var(--green)':'var(--muted)'}">${isOn?(lang==='pt'?'ON':'ON'):(lang==='pt'?'OFF':'OFF')}</span>
              ${!isOn?`<button class="btn btn-gold btn-sm" onclick="launchPtsToggle('${td.key}')">${lang==='pt'?'🚀 Lançar':'🚀 Launch'}</button>`:''}`
          }
        </div>
      </div>
      ${isLocked?`<div style="font-size:.7rem;color:var(--green);margin-top:5px">✅ ${lang==='pt'?'Pontos lançados permanentemente — não pode ser revertido.':'Points launched permanently — cannot be reversed.'}</div>`:''}
    </div>`;
  }).join('');
}
async function setPtsToggle(key,val){
  if(!isAdmin) return;
  const{db,doc,updateDoc}=window._fb;
  const newToggles={...ptsToggles,[key]:val};
  await updateDoc(doc(db,'competitions',currentCompId),{ptsToggles:newToggles});
  toast(t('saved'));
}
async function launchPtsToggle(key){
  if(!isAdmin) return;
  if(!confirm(lang==='pt'?`Lançar "${key}" permanentemente? Isto não pode ser revertido.`:`Launch "${key}" permanently? This cannot be reversed.`)) return;
  const{db,doc,updateDoc}=window._fb;
  const newToggles={...ptsToggles,[key]:true,[`${key}_locked`]:true};
  await updateDoc(doc(db,'competitions',currentCompId),{ptsToggles:newToggles});
  toast('🚀 '+(lang==='pt'?'Lançado!':'Launched!'));
}

// ═══ HOST PANEL ═══
function renderHostScores(){
  if(!isAdmin) return;const c=$('host-score-inputs');if(!c) return;
  const sorted=[...ALL_MATCHES];
  c.innerHTML=sorted.map(m=>{const a=actualScores[m.id]||{};return`<div class="match-card" style="margin-bottom:5px">
    <div class="match-team home"><div>${fi(m.home,22)}</div><span style="font-size:.68rem;font-weight:600">${m.home}</span></div>
    <div class="match-center">
      ${m.date?`<span style="font-size:.56rem;color:var(--gold)">${m.date}</span>`:''}
      <div class="match-score-row">
        <input class="score-input ha" type="number" min="0" max="20" data-mid="${m.id}" data-side="home" value="${a.home!==undefined?a.home:''}" placeholder="-">
        <span class="score-sep">:</span>
        <input class="score-input ha" type="number" min="0" max="20" data-mid="${m.id}" data-side="away" value="${a.away!==undefined?a.away:''}" placeholder="-">
      </div>
    </div>
    <div class="match-team away"><div>${fi(m.away,22)}</div><span style="font-size:.68rem;font-weight:600">${m.away}</span></div>
  </div>`}).join('');
  const ts=$('host-topscorer');if(ts) ts.value=actualScores.topScorer||'';
  renderHostKO();
}
function renderHostKO(){
  if(!isAdmin) return;
  const c=$('host-ko-inputs');if(!c) return;
  const saveBtn=$('host-ko-save-btn');
  const hasGroupResults=ALL_MATCHES.some(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';});
  if(!hasGroupResults){c.innerHTML=`<p style="color:var(--muted);font-size:.75rem">Disponível após início da fase de grupos.</p>`;if(saveBtn)saveBtn.style.display='none';return;}
  if(saveBtn)saveBtn.style.display='block';
  const r32=getR32Teams(currentUser?.uid);
  const rounds=[
    {id:'r32',label:'R32',matches:r32.map((m,i)=>({idx:i,home:m.home,away:m.away}))},
    {id:'r16',label:'R16',matches:Array.from({length:8},(_,i)=>{const a=actualScores.ko_r32||[];return{idx:i,home:a[i*2]||'?',away:a[i*2+1]||'?'};})},
    {id:'qf',label:'Quartos',matches:Array.from({length:4},(_,i)=>{const a=actualScores.ko_r16||[];return{idx:i,home:a[i*2]||'?',away:a[i*2+1]||'?'};})},
    {id:'sf',label:'Meias',matches:Array.from({length:2},(_,i)=>{const a=actualScores.ko_qf||[];return{idx:i,home:a[i*2]||'?',away:a[i*2+1]||'?'};})},
    {id:'f3',label:'3.º Lugar',matches:[{idx:0,home:'',away:'',sf:true}]},
    {id:'fin',label:'Final',matches:[{idx:0,home:(actualScores.ko_sf||[])[0]||'?',away:(actualScores.ko_sf||[])[1]||'?'},{idx:1,home:'',away:'',runnerUp:true}]},
  ];
  let html='';
  for(const round of rounds){
    const koArr=actualScores[`ko_${round.id}`]||[];
    html+=`<div style="margin-bottom:12px"><div style="font-size:.72rem;font-weight:700;color:var(--gold);margin-bottom:5px">${round.label}</div>`;
    for(const m of round.matches){
      if(m.sf){
        // 3rd place is contested by the two SF LOSERS = QF winners minus SF winners.
        // (ko_sf holds the SF WINNERS — i.e. the finalists — never the 3rd-place pair.
        // The old code diffed against ko_fin, which is empty until the final is played,
        // so it wrongly showed the two finalists here.)
        const qfW=(actualScores.ko_qf||[]).filter(Boolean);
        const sfW=new Set((actualScores.ko_sf||[]).filter(Boolean));
        const losers=qfW.filter(t=>!sfW.has(t));
        if(qfW.length<4||sfW.size<2||losers.length<2) continue; // semis unresolved
        m.home=losers[0];m.away=losers[1];
      }
      if(m.runnerUp) continue; // runner-up auto-derived from fin winner select
      if(m.home==='?'&&m.away==='?') continue;
      const winner=koArr[m.idx]||'';
      const opts=[m.home,m.away].filter(t=>t&&t!=='?');
      html+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;background:#0D1B2A;border-radius:8px;padding:5px 8px">
        <span style="font-size:.7rem;flex:1;text-align:right;${winner===m.home?'color:var(--green);font-weight:700':''}">${m.home}</span>
        <span style="color:var(--muted);font-size:.6rem">vs</span>
        <span style="font-size:.7rem;flex:1;${winner===m.away?'color:var(--green);font-weight:700':''}">${m.away}</span>
        <select data-round="${round.id}" data-idx="${m.idx}" style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:3px 5px;color:var(--text);font-size:.68rem;max-width:110px">
          <option value="">— vencedor —</option>
          ${opts.map(t=>`<option value="${attrEsc(t)}" ${winner===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>`;
    }
    html+='</div>';
  }
  c.innerHTML=html;
}
async function saveKOResults(){
  if(!isAdmin)return;
  const{db,doc,updateDoc}=window._fb;
  const c=$('host-ko-inputs');if(!c)return;
  const newScores={...actualScores};
  c.querySelectorAll('select[data-round]').forEach(sel=>{
    const round=sel.dataset.round,idx=parseInt(sel.dataset.idx);
    const val=sel.value;if(!val)return;
    if(!newScores[`ko_${round}`])newScores[`ko_${round}`]=[];
    newScores[`ko_${round}`][idx]=val;
    if(round==='fin'){
      const opts=[...sel.options].filter(o=>o.value&&o.value!==val).map(o=>o.value);
      if(opts[0])newScores.ko_fin[1]=opts[0];
    }
  });
  try{
    await updateDoc(doc(db,'competitions',currentCompId),{actualScores:newScores});
    toast(lang==='pt'?'Fase a eliminar guardada':'KO results saved');
  }catch(e){toast('Erro: '+e.message,true);}
}
window.saveKOResults=saveKOResults;

function renderR32Hits(){
  if(!isHost)return;
  const box=document.getElementById('r32-hits-box');
  if(!box)return;
  const collect=(uid,fp)=>{const s=new Set();(getR32Teams(uid,fp)||[]).forEach(m=>{[m.home,m.away].forEach(t=>{if(t&&t!=='TBD'&&t!=='?')s.add(t);});});return s;};
  const real=collect(currentUser?.uid,false);
  if(real.size<32){
    box.innerHTML=`<p style="color:#ff8040;font-size:.75rem">Apuramento real ainda incompleto (${real.size}/32 equipas conhecidas). Confirma que todos os resultados de grupo estão lançados.</p>`;
    return;
  }
  const rows=Object.entries(allUsers).map(([uid,u])=>{
    const pred=collect(uid,true);let hit=0;pred.forEach(t=>{if(real.has(t))hit++;});
    return {name:u.name||'—',hit};
  }).sort((a,b)=>b.hit-a.hit||a.name.localeCompare(b.name,'pt'));
  let h=`<table style="width:100%;border-collapse:collapse;font-size:.78rem;margin-top:8px"><thead><tr><th style="text-align:left;padding:4px 6px;color:var(--muted)">Jogador</th><th style="text-align:right;padding:4px 6px;color:var(--muted)">Acertos</th></tr></thead><tbody>`;
  rows.forEach((r,i)=>{h+=`<tr style="border-top:1px solid #1e3a5f"><td style="padding:4px 6px;font-weight:700">${i+1}. ${r.name}</td><td style="padding:4px 6px;text-align:right;font-weight:800;color:var(--gold)">${r.hit} / 32</td></tr>`;});
  h+=`</tbody></table>`;
  box.innerHTML=h;
}
window.renderR32Hits=renderR32Hits;

function renderHostMembers(){
  if(!isAdmin) return;const c=$('host-members');if(!c) return;
  const members=Object.entries(allUsers).sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt'));
  if(!members.length){c.innerHTML='<p style="color:var(--muted)">Nenhum participante</p>';return;}
  c.innerHTML=`<table class="leaderboard" style="margin-bottom:0;font-size:.78rem"><thead><tr><th>Nome</th><th>Role</th><th>Pts</th><th style="min-width:200px"></th></tr></thead><tbody>
  ${members.map(([uid,u])=>{const role=u.role||'member';const paid=!!u.paid;const unpaid=!!u.unpaidAnnounced;return`<tr>
    <td><span class="lb-name" onclick="showPlayerProfile('${attrEsc(uid)}')" title="Ver perfil">${u.name}</span>${uid===currentUser.uid?' ⭐':''}</td>
    <td><span class="badge ${role==='host'?'badge-host':role==='admin'?'badge-admin':'badge-locked'}" style="font-size:.65rem">${role.toUpperCase()}</span>${isHost?`<div style="font-size:.62rem;color:var(--muted);margin-top:2px">PIN: ${u.pin||'—'}</div>`:''}</td>
    <td class="${calcTotal(uid)>=0?'pts-pos':'pts-neg'}" style="font-size:.78rem">${calcTotal(uid)>=0?'+':''}${calcTotal(uid)}</td>
    <td style="display:flex;gap:3px;flex-wrap:nowrap;align-items:center">
      ${isHost?`<button class="btn btn-sm" style="padding:4px 7px;font-size:.7rem;background:${paid?'var(--green)':'rgba(45,198,83,.15)'};color:${paid?'#0D1B2A':'var(--green)'};border:1px solid var(--green)" onclick="togglePaid('${attrEsc(uid)}')">${paid?'✓ Pago':'Pago'}</button>`:''}
      ${isHost?`<button class="btn btn-sm" style="padding:4px 7px;font-size:.7rem;background:${unpaid?'rgba(255,80,0,.25)':'rgba(255,255,255,.05)'};color:${unpaid?'#ff8040':'var(--muted)'};border:1px solid ${unpaid?'#ff8040':'var(--border)'}" onclick="toggleUnpaidAnnounce('${attrEsc(uid)}','${attrEsc(u.name)}')">${unpaid?'€ Anunciado':'€ Não Pago'}</button>`:''}
      ${isHost&&role!=='host'?`<button class="btn btn-ghost btn-sm" style="padding:4px 7px;font-size:.7rem" onclick="toggleAdmin('${attrEsc(uid)}')">${role==='admin'?'↓ Admin':'↑ Admin'}</button>`:''}
      ${isAdmin&&role!=='host'?`<button class="btn btn-red btn-sm" style="padding:4px 7px;font-size:.7rem" onclick="kickUser('${attrEsc(uid)}','${attrEsc(u.name)}')">🚫</button>`:''}
    </td>
  </tr>`;}).join('')}</tbody></table>`;
  const uw=$('host-unlock');if(!uw) return;
  uw.innerHTML=members.map(([uid,u])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);gap:7px;flex-wrap:wrap">
    <div><span style="font-size:.86rem;font-weight:600">${u.name}</span>
    <span class="badge ${allPredictions[uid]?'badge-open':'badge-locked'}" style="margin-left:6px">${allPredictions[uid]?'✓':'?'}</span>
    ${u.unlockedEdit?`<span class="badge" style="background:rgba(255,215,0,.15);color:var(--gold);margin-left:4px">editing</span>`:''}</div>
    <button class="btn btn-ghost btn-sm" onclick="toggleUnlock('${attrEsc(uid)}')">${u.unlockedEdit?t('relock'):t('allow')}</button>
  </div>`).join('');
}
async function togglePaid(uid){
  if(!isHost)return;
  const u=allUsers[uid];if(!u)return;
  const nowPaid=!u.paid;
  if(!confirm(nowPaid?`Marcar ${u.name} como PAGO?`:`Remover pagamento de ${u.name}?`))return;
  try{
    // Marking paid also clears the unpaid announcement — preserved from the original.
    await mutateMember(uid,m=>({...m,paid:nowPaid,...(nowPaid?{unpaidAnnounced:false}:{})}));
    toast(nowPaid?`✓ ${u.name} marcado como pago`:`${u.name} desmarcado`);
  }catch(e){ toast(e.message||'Erro',true); }
}
async function toggleUnpaidAnnounce(uid,name){
  if(!isHost)return;
  const u=allUsers[uid];if(!u)return;
  const nowAnnounced=!u.unpaidAnnounced;
  if(!confirm(nowAnnounced?`Anunciar ${name} como NÃO PAGO? Ficará visível na classificação.`:`Remover aviso de não pagamento de ${name}?`))return;
  try{
    await mutateMember(uid,m=>({...m,unpaidAnnounced:nowAnnounced,paid:nowAnnounced?false:m.paid}));
    toast(nowAnnounced?`€ ${name} anunciado como não pago`:`Aviso removido de ${name}`);
  }catch(e){ toast(e.message||'Erro',true); }
}
async function toggleUnlock(uid){
  if(!allUsers[uid]) return;
  try{ await mutateMember(uid,m=>({...m,unlockedEdit:!m.unlockedEdit})); toast(t('saved')); }
  catch(e){ toast(e.message||'Erro',true); }
}

// ═══ POINTS ADJUSTMENTS (host-only manual override layer) ═══
function renderHostAdjust(){
  const c=$('host-adjust');if(!c) return;
  // Host + admins
  if(!isAdmin){const sec=$('pts-adjust-section');if(sec)sec.style.display='none';return;}
  const sec=$('pts-adjust-section');if(sec)sec.style.display='';
  const members=Object.entries(allUsers).sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt'));
  if(!members.length){c.innerHTML='<p style="color:var(--muted)">Nenhum participante</p>';return;}
  const adjustments=(currentComp&&currentComp.adjustments)||{};
  c.innerHTML=members.map(([uid,u])=>{
    const base=calcTotal(uid)-adjustmentTotal(uid); // automatic-only total
    const adj=adjustmentTotal(uid);
    const log=(adjustments[uid]||[]);
    const logHtml=log.length?`<div style="margin-top:7px;display:flex;flex-direction:column;gap:4px">${log.map((a,idx)=>{
      const sign=a.delta>0?'+':'';const when=a.ts?new Date(a.ts).toLocaleDateString('pt-PT',{day:'2-digit',month:'short'}):'';
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;background:#0D1B2A;border:1px solid var(--border);border-radius:7px;padding:6px 9px">
        <span style="font-size:.74rem"><b style="color:${a.delta>0?'var(--green)':'var(--red)'}">${sign}${a.delta}</b> · ${a.reason?a.reason.replace(/</g,'&lt;'):'(sem motivo)'}<span style="color:var(--muted)">${when?' · '+when:''}</span></span>
        <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:.7rem" onclick="removeAdjustment('${attrEsc(uid)}',${a.ts||0})">🗑️</button>
      </div>`;
    }).join('')}</div>`:'';
    return `<div style="padding:11px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <div><span style="font-weight:700;font-size:.88rem">${u.name}</span>
          <span style="color:var(--muted);font-size:.72rem"> auto ${base>=0?'+':''}${base}${adj?` · ajuste <b style="color:${adj>0?'var(--green)':'var(--red)'}">${adj>0?'+':''}${adj}</b>`:''} · total <b>${calcTotal(uid)>=0?'+':''}${calcTotal(uid)}</b></span>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:7px;flex-wrap:wrap;align-items:center">
        <input type="number" class="adj-delta" data-uid="${attrEsc(uid)}" placeholder="±pts" style="width:74px;background:var(--card);border:1px solid var(--border);border-radius:7px;padding:7px 9px;color:var(--text);font-family:var(--fb);font-size:.85rem;outline:none">
        <input type="text" class="adj-reason" data-uid="${attrEsc(uid)}" placeholder="Motivo (ex: aposta)" style="flex:1;min-width:120px;background:var(--card);border:1px solid var(--border);border-radius:7px;padding:7px 9px;color:var(--text);font-family:var(--fb);font-size:.85rem;outline:none">
        <button class="btn btn-gold btn-sm" onclick="addAdjustment('${attrEsc(uid)}')">Aplicar</button>
      </div>
      ${logHtml}
    </div>`;
  }).join('');
}
// Atomically read-modify-write ONE player's adjustment list. Two guarantees:
//  · runTransaction re-reads the server copy at write time, so a stale in-memory
//    currentComp (backgrounded phone, listener not yet re-synced) can never be
//    written back over another device's data.
//  · the write is a single field path (adjustments.<uid>), so it physically cannot
//    touch any other player — unlike the old whole-map write, where the last device
//    to save replaced everyone's adjustments with its own snapshot.
async function mutateAdjustments(uid,mutator){
  const{db,doc,runTransaction,deleteField}=window._fb;
  const ref=doc(db,'competitions',currentCompId);
  await runTransaction(db,async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists()) throw new Error(lang==='pt'?'Competição não encontrada':'Competition not found');
    const cur=((snap.data().adjustments)||{})[uid];
    const next=mutator(Array.isArray(cur)?[...cur]:[]);
    tx.update(ref,{[`adjustments.${uid}`]:(next&&next.length)?next:deleteField()});
  });
}
async function addAdjustment(uid){
  if(!isAdmin){toast('Apenas host/admin',true);return;}
  const deltaInp=document.querySelector(`.adj-delta[data-uid="${cssEsc(uid)}"]`);
  const reasonInp=document.querySelector(`.adj-reason[data-uid="${cssEsc(uid)}"]`);
  if(!deltaInp) return;
  const delta=parseInt(deltaInp.value,10);
  if(isNaN(delta)||delta===0){toast(lang==='pt'?'Insere um valor (+ ou −)':'Enter a value',true);return;}
  const reason=(reasonInp?reasonInp.value:'').trim().slice(0,80);
  try{
    await mutateAdjustments(uid,list=>{list.push({delta,reason,by:currentUser?.displayName||'host',ts:Date.now()});return list;});
    deltaInp.value='';if(reasonInp)reasonInp.value='';
    toast(lang==='pt'?'Ajuste aplicado':'Adjustment applied');
  }catch(e){console.error(e);toast('Erro: '+e.message,true);}
}
// Removal targets the entry by its timestamp, not its position: the list may have
// changed on the server since this screen was rendered, and an index would then
// delete the wrong adjustment.
async function removeAdjustment(uid,ts){
  if(!isAdmin){toast('Apenas host/admin',true);return;}
  if(!confirm(lang==='pt'?'Remover este ajuste?':'Remove this adjustment?')) return;
  try{
    let found=false;
    await mutateAdjustments(uid,list=>{
      const i=list.findIndex(a=>a&&a.ts===ts);
      if(i>=0){list.splice(i,1);found=true;}
      return list;
    });
    toast(found?(lang==='pt'?'Ajuste removido':'Adjustment removed')
               :(lang==='pt'?'Esse ajuste já não existe':'That adjustment no longer exists'),!found);
  }catch(e){console.error(e);toast('Erro: '+e.message,true);}
}
// Escape a string for use inside a CSS attribute selector [data-uid="..."]
function cssEsc(s){return String(s).replace(/["\\]/g,'\\$&');}
async function clearAllAdjustments(){
  if(!isAdmin){toast('Apenas host/admin',true);return;}
  const adj=(currentComp&&currentComp.adjustments)||{};
  const count=Object.keys(adj).length;
  if(!count){toast(lang==='pt'?'Não há ajustes para apagar':'No adjustments to clear',false);return;}
  if(!confirm(lang==='pt'?`Apagar TODOS os ajustes manuais de ${count} jogador(es)? Isto não pode ser desfeito.`:`Delete ALL manual adjustments for ${count} player(s)? This cannot be undone.`)) return;
  const{db,doc,updateDoc}=window._fb;
  try{
    await updateDoc(doc(db,'competitions',currentCompId),{adjustments:{}});
    toast(lang==='pt'?'Todos os ajustes apagados':'All adjustments cleared');
  }catch(e){console.error(e);toast('Erro: '+e.message,true);}
}
window.clearAllAdjustments=clearAllAdjustments;
async function saveActualScores(){
  if(!isAdmin) return;const{db,doc,updateDoc}=window._fb;
  const scores={...actualScores};
  document.querySelectorAll('.ha').forEach(i=>{
    const id=i.dataset.mid,side=i.dataset.side;
    if(!scores[id])scores[id]={source:'manual'};
    const clean=String(i.value||'').replace(/[^0-9]/g,'');
    if(clean!==''){
      let n=parseInt(clean,10);
      if(isNaN(n)||n<0)n=0;if(n>20)n=20;
      scores[id][side]=n;
      scores[id].source='manual'; // Mark as manually entered
    }
  });
  const auto=autoGroupKeys(scores);for(const[k,v] of Object.entries(auto)) scores[k]=v;
  const ts=$('host-topscorer');if(ts&&ts.value) scores.topScorer=ts.value;
  await updateDoc(doc(db,'competitions',currentCompId),{actualScores:scores});toast(t('saved'));
}
function renderHostPlayerChars(){
  if(!isAdmin) return;const c=$('host-player-chars');if(!c) return;
  const chars=currentComp?.playerChars||{};
  const uids=Object.keys(allUsers);
  // Capture any in-progress (unsaved) edits so a rebuild can't lose them.
  const dirtyVals={};
  c.querySelectorAll('.pci').forEach(i=>{if(i.dataset.dirty==='1')dirtyVals[i.dataset.uid]=i.value;});
  // If the inputs already exist for the same set of users, DON'T rebuild —
  // just refresh the values of fields the admin isn't currently editing.
  const existing={};
  c.querySelectorAll('.pci').forEach(i=>{existing[i.dataset.uid]=i;});
  const sameSet=uids.length>0&&uids.length===Object.keys(existing).length&&uids.every(u=>existing[u]);
  if(sameSet){
    uids.forEach(uid=>{
      const inp=existing[uid];
      if(inp===document.activeElement) return;   // don't touch the focused field
      if(inp.dataset.dirty==='1') return;         // don't touch unsaved edits
      inp.value=chars[uid]||'';
    });
    return;
  }
  // First render, or the user set changed — rebuild, restoring any mid-edit values.
  c.innerHTML=Object.entries(allUsers).map(([uid,u])=>{
    const hasDirty=dirtyVals[uid]!==undefined;
    const val=hasDirty?dirtyVals[uid]:(chars[uid]||'');
    return `<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">
    <label style="font-size:.76rem;color:var(--muted);min-width:80px;flex-shrink:0">${u.name}</label>
    <input type="text" class="pci" data-uid="${attrEsc(uid)}" data-dirty="${hasDirty?'1':'0'}" value="${attrEsc(val)}" placeholder="${lang==='pt'?'adepto do Benfica, ex-árbitro...':'Liverpool fan, ex-referee...'}"
      oninput="this.dataset.dirty='1'"
      style="flex:1;background:#0D1B2A;border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-family:var(--fb);font-size:.8rem;outline:none"/>
  </div>`;}).join('');
}
async function savePlayerChars(){
  if(!isAdmin) return;const{db,doc,updateDoc}=window._fb;
  const inputs=[...document.querySelectorAll('.pci')];
  // CRITICAL: only write fields the admin actually edited this session. Writing
  // untouched (usually blank) fields would overwrite characteristics entered by
  // another admin or in another session with empty strings — that was the bug
  // making saved characteristics disappear. A field you didn't touch is left
  // exactly as it is in Firestore.
  const updates={};
  inputs.forEach(i=>{if(i.dataset.dirty==='1')updates[`playerChars.${i.dataset.uid}`]=i.value.trim();});
  if(Object.keys(updates).length===0){toast(t('saved'));return;} // nothing changed
  try{
    await updateDoc(doc(db,'competitions',currentCompId),updates);
    inputs.forEach(i=>{i.dataset.dirty='0';});   // mark clean now they're persisted
    toast(t('saved'));
  }catch(e){console.error('savePlayerChars:',e);toast('Erro ao guardar: '+e.message,true);}
}
function reviewTopScorer(){
  const official=($('host-topscorer')||{}).value||actualScores.topScorer||'';
  if(!official){toast(lang==='pt'?'Insere primeiro o nome oficial':'Enter official name first',true);return;}
  const c=$('ts-fuzzy-results');if(!c) return;
  let html=`<div style="font-size:.78rem;color:var(--muted);margin-bottom:8px">${lang==='pt'?'Nome oficial:':'Official name:'} <strong style="color:var(--gold)">${official}</strong></div>`;
  Object.entries(allUsers).forEach(([uid,u])=>{
    const pr=allPredictions[uid]||{};const pred=pr.topScorer||'';if(!pred) return;
    const score=fuzzyScore(pred,official);const pct=Math.round(score*100);
    const approved=approvedTopScorers[uid];const col=score===1?'var(--green)':score>=0.5?'var(--gold)':'var(--red)';
    html+=`<div class="ts-item"><div><div style="font-weight:700;font-size:.82rem">${u.name}</div>
      <div style="font-size:.74rem;color:var(--muted)">"<span style="color:${col}">${pred}</span>" · ${pct}% match</div></div>
      <div>${score===1?`<span class="badge badge-open">✓ Exact</span>`:
        `<button class="btn btn-sm ${approved===true?'btn-green':approved===false?'btn-red':'btn-ghost'}" onclick="approveTopScorer('${uid}',${approved!==true})">
          ${approved===true?(lang==='pt'?'✓ Aprovado':'✓ Approved'):(lang==='pt'?'Aprovar':'Approve')}</button>`}
      </div></div>`;
  });
  c.innerHTML=html||`<p style="color:var(--muted);font-size:.8rem">Sem previsões.</p>`;
}
async function approveTopScorer(uid,approve){
  const{db,doc,updateDoc}=window._fb;const approved={...approvedTopScorers};approved[uid]=approve;
  await updateDoc(doc(db,'competitions',currentCompId),{approvedTopScorers:approved});toast(t('saved'));reviewTopScorer();
}

