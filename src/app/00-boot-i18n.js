// ═══ ANTI-CACHE: deteta versão nova no servidor e mostra barra (NÃO recarrega sozinho) ═══
const FWF_BUILD='20260717c';
function fwfUpdateNow(){
  try{if(typeof hasUnsavedEdits!=='undefined'&&hasUnsavedEdits&&!confirm('Tens alterações por guardar. Atualizar mesmo assim?'))return;}catch(e){}
  location.href=location.pathname+'?v='+Date.now();
}
window.fwfUpdateNow=fwfUpdateNow;
(async function fwfVersionCheck(){
  try{
    const res=await fetch(location.pathname+'?vc='+Date.now(),{cache:'no-store'});
    if(!res.ok)return;
    const txt=await res.text();
    const m=txt.match(/FWF-BUILD:([0-9A-Za-z.\-]+)/);
    if(m&&m[1]&&m[1]!==FWF_BUILD){const b=document.getElementById('update-banner');if(b)b.style.display='block';}
  }catch(e){}
})();

// ═══ TRANSLATIONS ═══
const T={
  pt:{sub:"2026 · EUA · CANADÁ · MÉXICO",deadlineClosed:"⛔ Apostas encerradas.",deadlineOpen:"Apostas fecham 1h antes do 1.º jogo.",saved:"Guardado!",copied:"Copiado!",predOpen:"✅ Submetido. Podes editar até ao prazo.",predLocked:"🔒 Apostas encerradas.",predSubmittedLocked:"✅ Submetido · 🔒 Prazo encerrado.",predNone:"✏️ Ainda não submeteste.",submitAll:"⚠️ Preenche todos os resultados de grupo antes de submeter.",brLocked:"⚡ Submete primeiro as previsões de grupo.",player:"Jogador",allow:"Permitir editar",relock:"Bloquear novamente",clickWinner:"Clica na equipa vencedora",predTable:"As tuas previsões",realTable:"Resultados reais",bestThirds:"🏅 Melhores 3.ºs classificados que avançam",pathway1:"Pathway 1",pathway2:"Pathway 2",today:"Hoje",totalPts:"Total"},
  en:{sub:"2026 · USA · CANADA · MEXICO",deadlineClosed:"⛔ Predictions closed.",deadlineOpen:"Predictions close 1h before kick-off.",saved:"Saved!",copied:"Copied!",predOpen:"✅ Submitted. You can edit until deadline.",predLocked:"🔒 Predictions closed.",predSubmittedLocked:"✅ Submitted · 🔒 Deadline passed.",predNone:"✏️ You haven't submitted yet.",submitAll:"⚠️ Fill all group scores before submitting.",brLocked:"⚡ Submit group predictions first.",player:"Player",allow:"Allow editing",relock:"Lock again",clickWinner:"Click the winning team",predTable:"Your predictions",realTable:"Real results",bestThirds:"🏅 Best 3rd-placed teams advancing",pathway1:"Pathway 1",pathway2:"Pathway 2",today:"Today",totalPts:"Total"}
};
let lang='pt';
function t(k){return T[lang][k]||k}
function setLang(l){
  lang=l;
  document.querySelectorAll('.lang-toggle button').forEach(b=>b.classList.toggle('active',b.textContent.includes(l.toUpperCase())));
  const hs=document.getElementById('hdr-sub');if(hs)hs.textContent=t('sub');
  renderGroupMatches();renderGruposTab();renderBracket();renderBracketMobile();renderBracketSwipe();renderBracketSwipe();renderRules();renderLeaderboard();renderPodium();renderLive();updateAdvanceBtn();
}

// ═══ FLAG HELPER ═══
const FC={
  'México':'mx','EUA':'us','Canadá':'ca','Uruguai':'uy','Argentina':'ar','Colômbia':'co',
  'Brasil':'br','Equador':'ec','Chile':'cl','Peru':'pe','Venezuela':'ve','Bolívia':'bo',
  'França':'fr','Bélgica':'be','Áustria':'at','Polónia':'pl','Espanha':'es','Portugal':'pt',
  'Escócia':'gb-sct','Türkiye':'tr','Turquia':'tr','Inglaterra':'gb-eng','Alemanha':'de',
  'Hungria':'hu','Eslovénia':'si','Marrocos':'ma','Senegal':'sn','Camarões':'cm','Tunísia':'tn',
  'Egipto':'eg','Argélia':'dz','África do Sul':'za','Gana':'gh','Japão':'jp',
  'Coreia do Sul':'kr','Austrália':'au','Indonésia':'id','Irão':'ir','Arábia Saudita':'sa',
  'Iraque':'iq','Jordânia':'jo','Países Baixos':'nl','Dinamarca':'dk','Suíça':'ch',
  'Geórgia':'ge','Itália':'it','Croácia':'hr','Albânia':'al','Czechia':'cz',
  'Bósnia e Herzegovina':'ba','Qatar':'qa','Haiti':'ht','Paraguai':'py','Curaçao':'cw',
  'Costa do Marfim':'ci','Nova Zelândia':'nz','Cabo Verde':'cv','Noruega':'no',
  'Suécia':'se','Congo DR':'cd','Uzbequistão':'uz','Gana':'gh','Panamá':'pa',
  'Scotland':'gb-sct','England':'gb-eng','France':'fr','Germany':'de','Spain':'es',
  'Brazil':'br','Argentina':'ar','Portugal':'pt','Netherlands':'nl','Belgium':'be',
  'Croatia':'hr','Norway':'no','Switzerland':'ch','Austria':'at','Sweden':'se',
  'Bosnia and Herzegovina':'ba','Morocco':'ma','South Africa':'za','South Korea':'kr',
  'USA':'us','Paraguay':'py','Australia':'au','Ivory Coast':'ci','Ecuador':'ec',
  'Japan':'jp','Tunisia':'tn','Iran':'ir','New Zealand':'nz','Cape Verde':'cv',
  'Saudi Arabia':'sa','Iraq':'iq','Algeria':'dz','Jordan':'jo','DR Congo':'cd',
  'Uzbekistan':'uz','Ghana':'gh','Panama':'pa','Colombia':'co','Turkey':'tr','Uruguay':'uy',
  'Czechia':'cz','Haiti':'ht','Curacao':'cw','Curaçao':'cw',
};
function fi(name,w=20){
  const code=FC[name]||FC[(name||'').trim()]||'un';
  return `<span class="fi fi-${code}" style="width:${w}px;height:${Math.round(w*0.67)}px;display:inline-block;border-radius:2px;flex-shrink:0;background-size:cover;vertical-align:middle"></span>`;
}

