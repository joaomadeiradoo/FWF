// ═══ HISTÓRIA / WALL OF FAME ═══
// ═══ FINAL PODIUM ═══
// Funny one-liners for each podium position, using one characteristic.
function podiumQuip(pos,name,char){
  const lc=s=>s?s.charAt(0).toLowerCase()+s.slice(1):'';
  const c=lc(char||'');
  const first=[
    `O Professor Karamba fez as suas contas. <strong>${name}</strong> venceu. Não há recurso.`,
    `<strong>${name}</strong> venceu. ${c?`Consta que ${c}. Agora também consta que é campeão.`:'Parabéns. Ou desculpa. Depende dos outros.'}`,
    `<strong>${name}</strong> campeão. ${c?`Dizem que ${c} — e aparentemente isso traduz-se em pontos.`:'Inesperado. Merecido. Inesperadamente merecido.'}`,
  ];
  const second=[
    `<strong>${name}</strong> ficou tão perto que até ele próprio ficou surpreendido.${c?` Sendo que ${c}, é uma conquista.`:''}`,
    `Segundo lugar para <strong>${name}</strong>. ${c?`O facto de ${c} só lhe valeu a prata. Desta vez.`:'Honra sem troféu. Clássico.'}`,
  ];
  const third=[
    `<strong>${name}</strong> em 3º. ${c?`Tendo em conta que ${c}, poderia ter sido pior. Poderia.`:'Pelo menos não foi o último. Esta vez.'}`,
    `Pódio para <strong>${name}</strong> — 3º lugar. ${c?`Reza a lenda que ${c}. A tabela rezou bronze.`:'Um pódio é um pódio.'}`,
  ];
  const h=(today||new Date().toISOString().split('T')[0]).split('-').reduce((a,b)=>a+parseInt(b),0);
  if(pos===1)return first[h%first.length];
  if(pos===2)return second[h%second.length];
  return third[h%third.length];
}
function avatarHtml(uid,size,borderClass){
  // Placeholder: coloured circle with initials. When real photos are added
  // (via currentComp.podiumPhotos[uid] as base64), we use those instead.
  const photos=(currentComp&&currentComp.podiumPhotos)||{};
  const u=allUsers[uid]||{};
  const initials=(u.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  // deterministic colour per uid
  const colours=['#E74C3C','#3498DB','#2ECC71','#9B59B6','#E67E22','#1ABC9C','#E91E63','#FF5722'];
  const bg=colours[(uid||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%colours.length];
  if(photos[uid]){
    return `<img src="${photos[uid]}" class="podium-avatar ${borderClass}" style="width:${size}px;height:${size}px;object-fit:cover" alt="${u.name}"/>`;
  }
  return `<div class="podium-avatar ${borderClass}" style="width:${size}px;height:${size}px;background:${bg}">${initials}</div>`;
}
function renderPodium(){
  const wrap=$('podium-wrap');if(!wrap) return;
  if(!currentComp||!currentComp.podiumActive){wrap.innerHTML='';return;}
  // Top 3 by calcTotal (submitted only)
  const top3=Object.entries(allUsers)
    .filter(([uid,u])=>allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0)
    .map(([uid,u])=>({uid,name:u.name,pts:calcTotal(uid)}))
    .sort((a,b)=>b.pts-a.pts).slice(0,3);
  if(top3.length<1){wrap.innerHTML='';return;}
  const chars=(currentComp&&currentComp.playerChars)||{};
  const getChar=uid=>{
    const raw=chars[uid]||'';
    const list=raw.split(',').map(s=>s.trim()).filter(Boolean);
    if(!list.length)return '';
    const h=new Date().toISOString().split('T')[0].split('-').reduce((a,b)=>a+parseInt(b),0);
    return list[h%list.length];
  };
  const p1=top3[0],p2=top3[1],p3=top3[2];
  // podium visual order: 2nd left, 1st centre, 3rd right
  const slots=[
    p2?{...p2,pos:2,sz:68,bc:'podium-slot-2',blkH:50,blkBg:'#ccc',medal:'🥈',slotCls:'podium-slot-2'}:{empty:true},
    p1?{...p1,pos:1,sz:82,bc:'podium-slot-1',blkH:72,blkBg:'var(--gold)',medal:'🥇',slotCls:'podium-slot-1'}:{empty:true},
    p3?{...p3,pos:3,sz:68,bc:'podium-slot-3',blkH:36,blkBg:'#cd7f32',medal:'🥉',slotCls:'podium-slot-3'}:{empty:true},
  ];
  const podiumHtml=slots.filter(s=>!s.empty).map(s=>`
    <div class="podium-slot ${s.slotCls}">
      <span style="font-size:${s.pos===1?'1.6rem':'1.2rem'}">${s.medal}</span>
      ${avatarHtml(s.uid,s.sz,s.bc)}
      <div class="podium-name">${s.name}</div>
      <div class="podium-pts">${s.pts>=0?'+':''}${s.pts} pts</div>
      <div class="podium-block" style="height:${s.blkH}px;background:${s.blkBg};width:${s.pos===1?'96px':'88px'}">${s.pos}</div>
    </div>`).join('');
  const quips=[p1,p2,p3].filter(Boolean).map((p,i)=>`<p>${podiumQuip(i+1,`<strong>${p.name}</strong>`,getChar(p.uid))}</p>`).join('');
  wrap.innerHTML=`<div class="podium-card">
    <div class="podium-card-title">🏆 PREVISÕES DO PROFESSOR KARAMBA</div>
    <div class="podium-card-sub">MUNDIAL 2026 · CAMPEÕES</div>
    <div class="podium-row">${podiumHtml}</div>
    <div class="podium-quip">${quips}</div>
    <button class="btn btn-gold btn-full" onclick="sharePodium()">📤 Partilhar Pódio</button>
  </div>`;
  // Also update the 2026 entry in história
  const entry=TOURNAMENT_HISTORY.find(t=>t.year===2026&&t.type==='WC');
  if(entry&&p1){entry.winner=p1.name;if(p2)entry.runnerUp=p2.name;if(p3)entry.third=p3.name;}
}
async function activatePodium(){
  if(!isHost)return;
  if(!confirm(lang==='pt'?'Revelar o pódio final? Esta ação é visível para todos.':'Reveal the final podium? This is visible to everyone.'))return;
  const{db,doc,updateDoc}=window._fb;
  try{
    await updateDoc(doc(db,'competitions',currentCompId),{podiumActive:true});
    toast('🏆 Pódio revelado!');
  }catch(e){toast('Erro: '+e.message,true);}
}
async function hidePodium(){
  if(!isHost)return;
  const{db,doc,updateDoc}=window._fb;
  try{await updateDoc(doc(db,'competitions',currentCompId),{podiumActive:false});toast('Pódio ocultado');}
  catch(e){toast('Erro: '+e.message,true);}
}
function renderPodiumHostSection(){
  const c=$('podium-host-btns');if(!c||!isHost)return;
  const active=currentComp&&currentComp.podiumActive;
  c.innerHTML=active
    ?`<span class="badge badge-open" style="margin-right:8px">✓ Pódio ativo</span><button class="btn btn-ghost btn-sm" onclick="hidePodium()">Ocultar</button>`
    :`<button class="btn btn-gold" onclick="activatePodium()">🏆 Revelar Pódio Final</button>`;
}
function sharePodium(){
  const card=$('podium-wrap');if(!card)return;
  const W=360,H=480;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  // bg
  ctx.fillStyle='#0D1B2A';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,215,0,.08)';ctx.fillRect(0,0,W,H);
  // title
  ctx.fillStyle='#FFD700';ctx.font='bold 18px Georgia,serif';ctx.textAlign='center';
  ctx.fillText('🏆 PREVISÕES DO PROFESSOR KARAMBA',W/2,34);
  ctx.fillStyle='#8899aa';ctx.font='11px sans-serif';
  ctx.fillText('MUNDIAL 2026 · CAMPEÕES',W/2,52);
  // podium blocks
  const tops=[{x:60,bh:50,by:200,col:'#cccccc',medal:'🥈'},{x:160,bh:72,by:178,col:'#FFD700',medal:'🥇'},{x:260,bh:36,by:214,col:'#cd7f32',medal:'🥉'}];
  const top3=Object.entries(allUsers).filter(([uid])=>allPredictions[uid]&&Object.keys(allPredictions[uid]).length>0).map(([uid,u])=>({uid,name:u.name,pts:calcTotal(uid)})).sort((a,b)=>b.pts-a.pts).slice(0,3);
  const order=[top3[1],top3[0],top3[2]];
  tops.forEach((t,i)=>{
    if(!order[i])return;
    const p=order[i];
    ctx.fillStyle=t.col;ctx.fillRect(t.x-36,t.by,72,t.bh);
    ctx.fillStyle='#0D1B2A';ctx.font='bold 22px Georgia,serif';ctx.textAlign='center';
    ctx.fillText(i===1?'1':i===0?'2':'3',t.x,t.by+t.bh/2+8);
    ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    const words=p.name.split(' ');
    words.forEach((w,wi)=>ctx.fillText(w,t.x,t.by-30+(wi*14)));
    ctx.fillStyle='#8899aa';ctx.font='10px sans-serif';
    ctx.fillText((p.pts>=0?'+':'')+p.pts+' pts',t.x,t.by-10);
    ctx.font='18px sans-serif';ctx.fillText(t.medal,t.x,t.by-50);
  });
  const dataUrl=canvas.toDataURL('image/png');
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[]})){
    const bin=atob(dataUrl.split(',')[1]);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const f=new File([new Blob([arr],{type:'image/png'})],'podium.png',{type:'image/png'});
    navigator.share({files:[f],title:'Pódio Final'}).catch(()=>{});
  }else{
    const a=document.createElement('a');a.href=dataUrl;a.download='podium_karamba.png';a.click();
  }
}
window.activatePodium=activatePodium;window.hidePodium=hidePodium;window.sharePodium=sharePodium;

function renderHistoria(){
  const c=$('historia-content');if(!c) return;
  const getIcon=type=>{
    if(type==='WC') return '⚽';
    if(type==='EURO') return '🇪🇺';
    if(type==='CAN') return '🌍';
    return '🏆';
  };
  let html='<div class="wof-grid">';
  TOURNAMENT_HISTORY.forEach(t=>{
    const isCurrent=t.year===2026&&t.type==='WC';
    html+=`<div class="wof-tournament"${isCurrent?' style="border-color:var(--gold)"':''}>
      <div class="wof-year">${getIcon(t.type)} ${t.year}</div>
      <div class="wof-name">${t.name}</div>
      ${t.winner!=='TBD'&&t.winner!=='?'?`<div class="wof-winner first">🥇 ${t.winner}</div>`:'<div class="wof-winner" style="color:var(--muted)">🥇 '+(isCurrent?'Por decidir':'?')+'</div>'}
      ${t.runnerUp!=='TBD'&&t.runnerUp!=='?'?`<div class="wof-winner second">🥈 ${t.runnerUp}</div>`:'<div class="wof-winner" style="color:var(--muted)">🥈 '+(isCurrent?'Por decidir':'?')+'</div>'}
      ${t.third!=='TBD'&&t.third!=='?'?`<div class="wof-winner third">🥉 ${t.third}</div>`:'<div class="wof-winner" style="color:var(--muted)">🥉 '+(isCurrent?'Por decidir':'?')+'</div>'}
    </div>`;
  });
  html+='</div>';
  c.innerHTML=html;
  renderAwards();
}

function renderAwards(){
  const ac=$('awards-content');if(!ac) return;
  
  // Calculate awards from history
  const stats={};
  TOURNAMENT_HISTORY.forEach(t=>{
    [
      {name:t.winner,pos:1,type:t.type},
      {name:t.runnerUp,pos:2,type:t.type},
      {name:t.third,pos:3,type:t.type}
    ].forEach(({name,pos,type})=>{
      if(!name||name==='TBD'||name==='?'||name.includes('No record')) return;
      
      if(!stats[name]) stats[name]={
        total:0,can:0,euro:0,wc:0,
        wins:0,canWins:0,euroWins:0,wcWins:0,
        seconds:0,thirds:0
      };
      
      stats[name].total++;
      if(type==='CAN') stats[name].can++;
      if(type==='EURO') stats[name].euro++;
      if(type==='WC') stats[name].wc++;
      
      if(pos===1){
        stats[name].wins++;
        if(type==='CAN') stats[name].canWins++;
        if(type==='EURO') stats[name].euroWins++;
        if(type==='WC') stats[name].wcWins++;
      }
      if(pos===2) stats[name].seconds++;
      if(pos===3) stats[name].thirds++;
    });
  });
  
  // CAN Supremo - most CAN podiums
  const canLeader=Object.entries(stats)
    .filter(([_,s])=>s.can>0)
    .sort((a,b)=>b[1].can-a[1].can||b[1].canWins-a[1].canWins)[0];
  
  // Mr. Endurance - most total podiums
  const endurance=Object.entries(stats)
    .sort((a,b)=>b[1].total-a[1].total||b[1].wins-a[1].wins||b[1].seconds-a[1].seconds)[0];
  
  // Eterno Segundo - most runner-ups
  const runner=Object.entries(stats)
    .filter(([_,s])=>s.seconds>0)
    .sort((a,b)=>b[1].seconds-a[1].seconds)[0];
  
  // Mr. Bronze - most third places
  const bronze=Object.entries(stats)
    .filter(([_,s])=>s.thirds>0)
    .sort((a,b)=>b[1].thirds-a[1].thirds)[0];
  
  let html='';
  if(canLeader) html+=`<div class="award-item"><div class="award-title">🌍 CAN Supremo</div><div class="award-desc">Rei da Taça Africana de Nações</div><div class="award-winner">${canLeader[0]} (${canLeader[1].can} pódios, ${canLeader[1].canWins}× campeão)</div></div>`;
  if(endurance) html+=`<div class="award-item"><div class="award-title">🏃 Mr. Endurance</div><div class="award-desc">Sempre presente, sempre no pódio</div><div class="award-winner">${endurance[0]} (${endurance[1].total} pódios totais)</div></div>`;
  if(runner) html+=`<div class="award-item"><div class="award-title">💀 Eterno Segundo</div><div class="award-desc">Sempre perto, nunca lá</div><div class="award-winner">${runner[0]} (${runner[1].seconds}× vice-campeão)</div></div>`;
  if(bronze) html+=`<div class="award-item"><div class="award-title">🥉 Mr. Bronze</div><div class="award-desc">Especialista em 3º lugares</div><div class="award-winner">${bronze[0]} (${bronze[1].thirds}× terceiro)</div></div>`;
  
  ac.innerHTML=html||`<p style="color:var(--muted);font-size:.82rem">Ainda sem dados suficientes para troféus especiais.</p>`;
}

function renderHostRules(){
  const c=$('host-rules-edit');if(!c) return;
  c.innerHTML=`<div class="rules-grid">${RULE_ITEMS.map(it=>`<div class="rule-item"><span class="rule-label">${it.label[lang]}</span><input class="rule-val-edit" type="number" data-rule="${it.k}" value="${rules[it.k]}"/></div>`).join('')}</div>`;
}
async function saveRules(){
  if(!isAdmin) return;const{db,doc,updateDoc}=window._fb;
  const nr={...rules};
  document.querySelectorAll('.rule-val-edit').forEach(i=>{
    const v=parseInt(i.value);
    if(!isNaN(v)) nr[i.dataset.rule]=v;
  });
  await updateDoc(doc(db,'competitions',currentCompId),{rules:nr});toast(t('saved'));
}

