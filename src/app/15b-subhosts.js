// ═══ SUB-HOSTS ═══
// A management layer over ONE competition (one leaderboard). A sub-host is a
// member with role 'subhost' who is responsible for their own guests: getting
// them to submit, and collecting their entry fee (offline — the app only tracks
// paid status). Guests are attributed automatically at join time via a
// per-sub-host invite code that points to the SAME competition.
//
// Schema (all additive — dormant on competitions that don't use it):
//   competition.subHostCodes : { CODE : subHostUid }   // many codes, one comp
//   member.subHost           : subHostUid               // who owns this guest
//   member.role              : 'subhost'                // new role value
//
// SECURITY NOTE: scoping here is client-side (trust model for ~64 friends). A
// sub-host writing only to their own group is enforced in code, not yet by the
// Firestore rules (those remain unverified — tracked separately). Do not treat
// this as a hard security boundary until the rules are read and tightened.

// Can the current user manage this member? Host/admins manage everyone; a
// sub-host manages only guests tagged to them.
function canManage(uid){
  if(isAdmin) return true;
  return !!(isSubHost && currentUser && (allUsers[uid]||{}).subHost===currentUser.uid);
}

// Members tagged to a given sub-host, sorted by name.
function subGroupMembers(subHostUid){
  return Object.entries(allUsers)
    .filter(([,u])=>u.subHost===subHostUid)
    .sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt'));
}

// Reverse-lookup a sub-host's own invite code from the competition map.
function subHostCodeFor(uid){
  const codes=(currentComp&&currentComp.subHostCodes)||{};
  return Object.keys(codes).find(c=>codes[c]===uid)||null;
}

// Per-sub-host roll-up for the host dashboard: counts + fee totals. An extra
// 'Sem sub-host' bucket covers guests who joined via the global code.
function subHostRollup(){
  const buckets={};
  const ensure=(id,name)=>{ buckets[id]||(buckets[id]={id,name,members:0,submitted:0,paid:0,unpaid:0}); return buckets[id]; };
  const UNGROUPED='__none__';
  for(const [uid,u] of Object.entries(allUsers)){
    if(u.role==='host') continue; // host isn't anyone's guest
    const shUid=u.subHost||UNGROUPED;
    const shName= shUid===UNGROUPED ? (lang==='pt'?'Sem sub-host':'No sub-host')
                                    : ((allUsers[shUid]||{}).name||'?');
    const b=ensure(shUid,shName);
    b.members++;
    if(allPredictions[uid]) b.submitted++;
    if(u.paid) b.paid++;
    if(u.unpaidAnnounced) b.unpaid++;
  }
  return Object.values(buckets).sort((a,b)=>a.name.localeCompare(b.name,'pt'));
}

// ── Host actions ────────────────────────────────────────────────────────────────
// Promote a member to sub-host: set role and register a fresh invite code, in one
// transaction (field paths only — no whole-object write).
async function promoteToSubHost(uid){
  if(!isHost) return;
  const u=allUsers[uid]; if(!u) return;
  if(u.role==='host'){ toast(lang==='pt'?'O host já gere tudo':'The host already manages everyone',true); return; }
  if(subHostCodeFor(uid)){ toast(lang==='pt'?'Já é sub-host':'Already a sub-host',true); return; }
  if(!confirm(lang==='pt'?`Tornar ${u.name} sub-host? Recebe um código próprio para convidar os seus convidados.`:`Make ${u.name} a sub-host? They get their own code to invite their guests.`)) return;
  const{db,doc,runTransaction}=window._fb;
  const ref=doc(db,'competitions',currentCompId);
  const code=genCode();
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists()) throw new Error(lang==='pt'?'Competição não encontrada':'Competition not found');
      const cur=((snap.data().members)||{})[uid];
      if(!cur) throw new Error(lang==='pt'?'Participante não encontrado':'Member not found');
      tx.update(ref,{ [`members.${uid}`]:{...cur,role:'subhost'}, [`subHostCodes.${code}`]:uid });
    });
    toast(lang==='pt'?`${u.name} é agora sub-host`:`${u.name} is now a sub-host`);
  }catch(e){ toast(e.message||'Erro',true); }
}

// Demote a sub-host back to member and remove their code. Their guests keep their
// tag (host can reassign) — we don't touch other members in this write.
async function demoteSubHost(uid){
  if(!isHost) return;
  const u=allUsers[uid]; if(!u) return;
  const code=subHostCodeFor(uid);
  if(!confirm(lang==='pt'?`Remover ${u.name} como sub-host?`:`Remove ${u.name} as sub-host?`)) return;
  const{db,doc,runTransaction,deleteField}=window._fb;
  const ref=doc(db,'competitions',currentCompId);
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists()) throw new Error(lang==='pt'?'Competição não encontrada':'Competition not found');
      const cur=((snap.data().members)||{})[uid];
      if(!cur) throw new Error(lang==='pt'?'Participante não encontrado':'Member not found');
      const patch={ [`members.${uid}`]:{...cur,role:cur.role==='subhost'?'member':cur.role} };
      if(code) patch[`subHostCodes.${code}`]=deleteField();
      tx.update(ref,patch);
    });
    toast(lang==='pt'?`${u.name} deixou de ser sub-host`:`${u.name} is no longer a sub-host`);
  }catch(e){ toast(e.message||'Erro',true); }
}

// Reassign a guest to a different sub-host (or clear the tag). Host only.
async function reassignMember(uid,targetSubHostUid){
  if(!isHost) return;
  const{deleteField}=window._fb;
  try{
    await mutateMember(uid,m=>{ const n={...m}; if(targetSubHostUid) n.subHost=targetSubHostUid; else delete n.subHost; return n; });
    toast(t('saved'));
  }catch(e){ toast(e.message||'Erro',true); }
  // deleteField import kept available for callers that prefer a field-path delete.
  void deleteField;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
// Host dashboard: one row per sub-host with submitted / paid / fee counts.
function renderSubHostRollup(){
  if(!isHost) return;
  const c=$('subhost-rollup'); if(!c) return;
  const rows=subHostRollup();
  if(!rows.length){ c.innerHTML=''; return; }
  c.innerHTML=`<h4 style="margin:14px 0 6px">Sub-hosts</h4>
  <table class="leaderboard" style="font-size:.78rem"><thead><tr><th>Sub-host</th><th>Convidados</th><th>Enviaram</th><th>Pagos</th></tr></thead><tbody>
  ${rows.map(r=>`<tr>
    <td>${r.name}</td>
    <td>${r.members}</td>
    <td>${r.submitted}/${r.members}</td>
    <td>${r.paid}/${r.members}${r.unpaid?` <span style="color:#ff8040">(${r.unpaid}€!)</span>`:''}</td>
  </tr>`).join('')}</tbody></table>`;
}

// A sub-host's own panel: manage only their guests (paid / not-paid / submission).
function renderSubHostPanel(){
  const c=$('subhost-panel'); if(!c) return;
  if(!isSubHost || !currentUser){ c.classList.add('hidden'); return; }
  c.classList.remove('hidden');
  const group=subGroupMembers(currentUser.uid);
  const submitted=group.filter(([uid])=>allPredictions[uid]).length;
  const paid=group.filter(([,u])=>u.paid).length;
  const link=`${location.origin}${location.pathname}?j=${subHostCodeFor(currentUser.uid)||''}`;
  c.innerHTML=`<div class="card"><h3>O Meu Grupo</h3>
    <p style="color:var(--muted);font-size:.8rem">Link de convite: <code style="word-break:break-all">${link}</code>
      <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${attrEsc(link)}');toast(t('copied'))">Copiar</button></p>
    <p style="font-size:.82rem">Enviaram previsões: <b>${submitted}/${group.length}</b> · Pagaram: <b>${paid}/${group.length}</b></p>
    ${!group.length?`<p style="color:var(--muted)">Ainda ninguém entrou com o teu código.</p>`:
    `<table class="leaderboard" style="font-size:.78rem"><thead><tr><th>Nome</th><th>Previsão</th><th></th></tr></thead><tbody>
    ${group.map(([uid,u])=>`<tr>
      <td>${u.name}</td>
      <td><span class="badge ${allPredictions[uid]?'badge-open':'badge-locked'}">${allPredictions[uid]?'✓':'?'}</span></td>
      <td style="display:flex;gap:3px;flex-wrap:wrap">
        <button class="btn btn-sm" style="padding:4px 7px;font-size:.7rem;background:${u.paid?'var(--green)':'rgba(45,198,83,.15)'};color:${u.paid?'#0D1B2A':'var(--green)'};border:1px solid var(--green)" onclick="togglePaid('${attrEsc(uid)}')">${u.paid?'✓ Pago':'Pago'}</button>
        <button class="btn btn-sm" style="padding:4px 7px;font-size:.7rem;background:${u.unpaidAnnounced?'rgba(255,80,0,.25)':'rgba(255,255,255,.05)'};color:${u.unpaidAnnounced?'#ff8040':'var(--muted)'};border:1px solid ${u.unpaidAnnounced?'#ff8040':'var(--border)'}" onclick="toggleUnpaidAnnounce('${attrEsc(uid)}','${attrEsc(u.name)}')">${u.unpaidAnnounced?'€ Anunciado':'€ Não Pago'}</button>
      </td>
    </tr>`).join('')}</tbody></table>`}
  </div>`;
}

// Auto-fill the invite code from a ?j=CODE link so guests never type it.
function applyJoinCodeFromURL(){
  try{
    const j=new URLSearchParams(location.search).get('j');
    if(j){ const el=$('auth-code'); if(el) el.value=j.trim().toUpperCase(); }
  }catch(_){}
}
