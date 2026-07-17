// ═══ DAILY COMMENTARY (40+ cheeky templates) ═══
// Savage commentary templates with player characteristics
const SAVAGE_COMMENTARY={
  savage_pt:[
    (name,char,pts)=>`${name}${char?` (${char})`:''} teve um dia desastroso. ${pts} pontos pelo ralo.`,
    (name,char,pts)=>`Ser ${char||'jogador'} não ajudou ${name} hoje. ${pts} pontos desapareceram.`,
    (name,char,pts)=>`${name} previu${char?` como ${char}`:''} com os olhos fechados. Perdeu ${pts} pontos para provar.`,
    (name,char,pts)=>`Mesmo ${char?`como ${char}`:''}, ${name} devia ter visto isso. ${pts} pontos foram-se.`,
    (name,char,pts)=>`${char?char+' e ':''}${name}? Mais ${name} o vidente... de previsões erradas. -${pts} hoje.`,
    (name,char,pts)=>`As previsões de ${name} hoje: prova que ${char?`ser ${char}`:' entusiasmo'} não é qualificação. ${pts} pontos evaporados.`,
    (name,char,pts)=>`${char?`Como ${char}, `:' '}${name} não tem desculpa para perder ${pts} pontos. Nenhuma.`,
    (name,char,pts)=>`${name} combinou ${char?`ser ${char} com`:'excesso de confiança e'} julgamento terrível. Resultado: -${pts} pontos.`,
    (name,char,pts)=>`${char?`Ser ${char}`:' A paixão'} deu confiança a ${name}. Infelizmente não deu precisão. ${pts} pontos perdidos.`,
    (name,char,pts)=>`Os instintos ${char?`de ${char}`:''} de ${name} falharam espetacularmente. ${pts} pontos de colapso.`,
    (name,char,pts)=>`${char?char+'? ':''}${name} previu como se nunca tivesse visto futebol. ${pts} pontos de prova.`,
    (name,char,pts)=>`${name}${char?` é ${char}`:''} mas previu como turista confuso. ${pts} pontos desapareceram.`,
    (name,char,pts)=>`Pensarias que ${char?`ser ${char}`:' experiência'} ajudaria ${name}. Não ajudou. ${pts} pontos perdidos.`,
    (name,char,pts)=>`A energia ${char?`de ${char}`:''} de ${name} era forte. As previsões não. ${pts} pontos mais fraco.`,
    (name,char,pts)=>`${char?`Como ${char}, `:' '}${name} devia saber melhor. Claramente não sabe. ${pts} pontos confirmam.`,
  ],
  hype_pt:[
    (name,char,pts)=>`${name}${char?` é ${char}`:''} E aparentemente psíquico. +${pts} pontos hoje. Exibicionista.`,
    (name,char,pts)=>`${char?`Ser ${char}`:' A intuição'} finalmente compensou ${name}. +${pts} pontos. Imparável.`,
    (name,char,pts)=>`Os instintos ${char?`de ${char}`:''} de ${name} estão em fogo. +${pts} pontos. Alguém os pare.`,
    (name,char,pts)=>`Ser ${char||'vidente'} torna-te clarividente. ${name} acabou de provar com +${pts}.`,
    (name,char,pts)=>`${name} combinou ${char?char+' com':''} conhecimento real de futebol. +${pts} pontos. Combinação perigosa.`,
    (name,char,pts)=>`${char?`Como ${char}, `:' '}${name} chamou tudo perfeitamente. +${pts} pontos. Números da lotaria a seguir?`,
    (name,char,pts)=>`${name}${char?` (${char})`:''} tinha superpoderes hoje. +${pts} pontos. Vantagem injusta.`,
    (name,char,pts)=>`${char?`Ser ${char}`:' Saber'} tem benefícios. Pergunta a ${name}, que acabou de ganhar +${pts} pontos.`,
    (name,char,pts)=>`${name}${char?` é ${char}`:''} numa missão. +${pts} pontos. Todos os outros jogam pelo 2º.`,
    (name,char,pts)=>`${char||'Instinto'} encontra bola de cristal. ${name} ganhou ${pts} pontos. Alguém verifique o regulamento.`,
    (name,char,pts)=>`A sequência ${char?`de ${char}`:''} de ${name} continua. +${pts} pontos hoje. Oficialmente irritante.`,
    (name,char,pts)=>`${char?`Ser ${char}`:' Acertar'} E estar certo é o superpoder de ${name}. +${pts} pontos provam-no.`,
    (name,char,pts)=>`${name} usou${char?` a sabedoria ${char}`:' lógica'} perfeitamente. +${pts} pontos. Resto chora.`,
    (name,char,pts)=>`${char?`Como ${char}, `:' '}${name} previu como se tivesse escrito os scripts. +${pts} pontos.`,
    (name,char,pts)=>`${name}${char?` é ${char}`:''} com poderes proféticos. +${pts} pontos. Ridículo agora.`,
  ],
  chaos_pt:[
    (name,char,swing)=>`${name}${char?` é ${char}`:''} numa montanha-russa emocional. ${swing>0?'↑':'↓'} ${Math.abs(swing)} lugares hoje.`,
    (name,char,swing)=>`${char?`Ser ${char}`:' Jogar assim'} significa drama para ${name}. Oscilou ${Math.abs(swing)} posições ${swing>0?'↑':'↓'}.`,
    (name,char,swing)=>`A energia ${char?`de ${char}`:''} de ${name} é caótica. ${swing>0?'↑':'↓'} ${Math.abs(swing)} lugares. Nunca é aborrecido.`,
    (name,char,swing)=>`${char?`Como ${char}, `:' '}${name} foi ${swing>0?'↑':'↓'} ${Math.abs(swing)} lugares. Entretenimento puro.`,
    (name,char,swing)=>`${name}${char?` é ${char}`:''} sem chill zero. Oscilação de ${Math.abs(swing)} posições ${swing>0?'↑':'↓'}.`,
    (name,char,swing)=>`${char?`Ser ${char}`:' Esta estratégia'} cai bem em ${name}. Moveu ${Math.abs(swing)} lugares ${swing>0?'↑':'↓'}. Caos puro.`,
    (name,char,swing)=>`Instintos ${char?`de ${char}`:''} de ${name} = imprevisível. ${swing>0?'↑':'↓'} ${Math.abs(swing)} posições hoje.`,
    (name,char,swing)=>`${char||'Isto'} significa viagens selvagens para ${name}. ${Math.abs(swing)} lugares ${swing>0?'↑':'↓'}. Apertem cintos.`,
    (name,char,swing)=>`${name}${char?` é ${char}`:''} e claramente prospera no caos. ${swing>0?'↑':'↓'} ${Math.abs(swing)} lugares.`,
    (name,char,swing)=>`${char?`Como ${char}, `:' '}${name} não faz estabilidade. Oscilação de ${Math.abs(swing)} posições ${swing>0?'↑':'↓'} prova-o.`,
    (name,char,swing)=>`A jornada ${char?`de ${char}`:''} de ${name}: ${swing>0?'↑':'↓'} ${Math.abs(swing)} posições. Dano emocional.`,
    (name,char,swing)=>`${char?`Ser ${char}`:' Estas previsões'} significa que a classificação de ${name} é lotaria. ${swing>0?'↑':'↓'} ${Math.abs(swing)} hoje.`,
    (name,char,swing)=>`${name}${char?` é ${char}`:''} numa missão para confundir todos. ${swing>0?'↑':'↓'} ${Math.abs(swing)} lugares.`,
    (name,char,swing)=>`${char||'Volatilidade'} + ${name} = volatilidade. ${Math.abs(swing)} posições ${swing>0?'↑':'↓'}. Nunca mudes.`,
    (name,char,swing)=>`As previsões ${char?`de ${char}`:''} de ${name} oscilam violentamente. ${swing>0?'↑':'↓'} ${Math.abs(swing)} lugares hoje.`,
  ],
  bottom_pt:[
    (name,char,rank)=>`${name}${char?` é ${char}`:''} em último. Pelo menos é consistentemente último.`,
    (name,char,rank)=>`${char?`Ser ${char}`:' Esforço'} não salvou ${name} do ${rank}º lugar. Talvez nunca.`,
    (name,char,rank)=>`A energia ${char?`de ${char}`:''} de ${name} pertence no ${rank}º. Encaixe perfeito honestamente.`,
    (name,char,rank)=>`${char?`Como ${char}, `:' '}${name} mantém o ${rank}º lugar com orgulho. Compromisso admirável.`,
    (name,char,rank)=>`${name}${char?` é ${char}`:''} e firmemente no ${rank}º. Aparentemente é uma vibe.`,
    (name,char,rank)=>`${char?`Ser ${char}`:' Estas escolhas'} não desculpa ${name} na posição ${rank}º. Hora do amor duro.`,
    (name,char,rank)=>`${name}${char?` é ${char}`:''} mantendo o ${rank}º lugar quentinho. Alguém tem de o fazer.`,
    (name,char,rank)=>`${char||'Último lugar'} no ${rank}º = ${name}. História de amor.`,
    (name,char,rank)=>`A estratégia ${char?`de ${char}`:''} de ${name} leva ao ${rank}º lugar. A funcionar como pretendido?`,
    (name,char,rank)=>`${char?`Como ${char}, `:' '}${name} ganhou o ${rank}º lugar de forma justa. Respeito.`,
    (name,char,rank)=>`${name}${char?` é ${char}`:''} no fundo (${rank}º). Essa é a marca agora.`,
    (name,char,rank)=>`${char?`Ser ${char}`:' Isto'} levou ${name} ao ${rank}º lugar. Não claro se era o objetivo.`,
    (name,char,rank)=>`Vibes ${char?`de ${char}`:''} de ${name} = ${rank}º lugar. Matemática verifica.`,
    (name,char,rank)=>`${char||'Mau julgamento'} + previsões terríveis = ${name} no ${rank}º. Equação simples.`,
    (name,char,rank)=>`${name}${char?` é ${char}`:''} e possui o ${rank}º lugar. Ninguém pode tirar isso.`,
  ],
};

const SAVAGE_EN={
  savage:[
    (name,char,pts)=>`${name}${char?` (${char})`:''} had a disastrous day. ${pts} points down the drain.`,
    (name,char,pts)=>`Being ${char||'passionate'} didn't help ${name} today. ${pts} points vanished.`,
    (name,char,pts)=>`${name} predicted${char?` as ${char}`:''} with eyes closed. Lost ${pts} points to prove it.`,
    (name,char,pts)=>`Even${char?` as ${char}`:''}, ${name} should've seen that. ${pts} points gone.`,
    (name,char,pts)=>`${char?char+' and ':''}${name}? More like ${name} the clairvoyant... of wrong predictions. -${pts} today.`,
  ],
  hype:[
    (name,char,pts)=>`${name}${char?` is ${char}`:''} AND apparently psychic. +${pts} points today. Show-off.`,
    (name,char,pts)=>`Being ${char||'smart'} finally paid off for ${name}. +${pts} points. Unstoppable.`,
    (name,char,pts)=>`${name}'s ${char||'instincts'} are on fire. +${pts} points. Someone stop them.`,
  ],
  chaos:[
    (name,char,swing)=>`${name}${char?` is ${char}`:''} on emotional rollercoaster. ${swing>0?'↑':'↓'} ${Math.abs(swing)} places.`,
    (name,char,swing)=>`Being ${char||'unpredictable'} means drama for ${name}. Swung ${Math.abs(swing)} ${swing>0?'↑':'↓'}.`,
  ],
  bottom:[
    (name,char,rank)=>`${name}${char?` is ${char}`:''} in last. At least consistently last.`,
    (name,char,rank)=>`Being ${char||'trying'} hasn't saved ${name} from ${rank}º. Might never.`,
  ],
};

const DAILY_TEMPLATES_PT=SAVAGE_COMMENTARY.savage_pt.concat(SAVAGE_COMMENTARY.hype_pt,SAVAGE_COMMENTARY.chaos_pt,SAVAGE_COMMENTARY.bottom_pt);
const DAILY_TEMPLATES_EN=SAVAGE_EN.savage.concat(SAVAGE_EN.hype,SAVAGE_EN.chaos,SAVAGE_EN.bottom);


// Personalised shoutout templates
function shoutLeader(name,char){
  const opts={
    pt:[`${name} continua no topo.${char?` Como ${char}, claramente sabe o que está a fazer.`:' Quem diria!'}`,
        `${name} imparável.${char?` Sendo ${char}, talvez tenha vantagens que os outros não têm.`:''}`],
    en:[`${name} stays on top.${char?` As ${char}, they clearly know what they're doing.`:' Who knew!'}`,
        `${name} unstoppable.${char?` Being ${char} has its advantages.`:''}`]
  };
  const arr=opts[lang];return arr[Math.floor(Math.random()*arr.length)];
}
function shoutClimb(name,diff,char){
  const opts={
    pt:[`📈 <strong style="color:var(--green)">${name}</strong> subiu ${diff} lugar(es) hoje.${char?` Típico de ${char}!`:' Estava calado mas estava a trabalhar!'}`,
        `🚀 <strong style="color:var(--green)">${name}</strong> disparou +${diff} posições.${char?` Isso é que é ser ${char}!`:''}`],
    en:[`📈 <strong style="color:var(--green)">${name}</strong> climbed ${diff} place(s) today.${char?` Typical of ${char}!`:' Quiet but deadly!'}`,
        `🚀 <strong style="color:var(--green)">${name}</strong> shot up ${diff} spots.${char?` That's what being ${char} does!`:''}`]
  };
  const arr=opts[lang];return arr[Math.floor(Math.random()*arr.length)];
}
function shoutFall(name,diff,char){
  const opts={
    pt:[`📉 <strong style="color:var(--red)">${name}</strong> caiu ${diff} lugar(es).${char?` Sendo ${char}, talvez fosse melhor apostar noutro desporto.`:' Amanhã é outro dia.'}`,
        `💀 <strong style="color:var(--red)">${name}</strong> em queda livre: -${diff} posições.${char?` ${char} nem sempre é garantia de sucesso.`:''}`],
    en:[`📉 <strong style="color:var(--red)">${name}</strong> dropped ${diff} place(s).${char?` Being ${char} doesn't always help.`:' Tomorrow is another day.'}`,
        `💀 <strong style="color:var(--red)">${name}</strong> in freefall: -${diff} positions.${char?` Even ${char} can't save you now.`:''}`]
  };
  const arr=opts[lang];return arr[Math.floor(Math.random()*arr.length)];
}
function shoutBigDay(name,pts,char){
  const opts={
    pt:[`🔥 <strong style="color:var(--gold)">${name}</strong> teve um dia INCRÍVEL: +${pts} pontos!${char?` Como ${char}, sabe exactamente como fazer mal aos outros.`:' Chapéu!'}`,
        `💥 Dia épico para <strong style="color:var(--gold)">${name}</strong> com +${pts} pontos hoje. Alguém parou isto?`],
    en:[`🔥 <strong style="color:var(--gold)">${name}</strong> had an INCREDIBLE day: +${pts} points!${char?` As ${char}, they know how to hurt people.`:' Hats off!'}`,
        `💥 Epic day for <strong style="color:var(--gold)">${name}</strong> with +${pts} points today. Can anyone stop them?`]
  };
  const arr=opts[lang];return arr[Math.floor(Math.random()*arr.length)];
}
function shoutBadDay(name,pts,char){
  const opts={
    pt:[`💩 <strong style="color:var(--red)">${name}</strong> perdeu ${Math.abs(pts)} pontos hoje. ${char?`Até ${char} tem dias maus.`:' Acontece aos melhores.'}`,
        `🤕 Dia para esquecer de <strong style="color:var(--red)">${name}</strong>: ${pts} pontos. Já passou!`],
    en:[`💩 <strong style="color:var(--red)">${name}</strong> lost ${Math.abs(pts)} points today. ${char?`Even ${char} has bad days.`:' Happens to the best.'}`,
        `🤕 Forgettable day for <strong style="color:var(--red)">${name}</strong>: ${pts} points. It'll be better tomorrow!`]
  };
  const arr=opts[lang];return arr[Math.floor(Math.random()*arr.length)];
}

// ═══ ROLL CALL: standing-anchored one-liners that cycle through all players ═══
// Guarantees every player is mentioned ≥2x across ~30 days (3/day rotation).
// Templates take (name, char, rank, totalPlayers, pts). Standing-anchored.
const ROLL_CALL_PT=[
  (n,c,r,N,p)=>`${n} em ${r}º.${c?` Dizem que ${c}. As previsões não confirmam.`:''}`,
  (n,c,r,N,p)=>`${r}º: ${n}. ${c?`"${c}" — e mesmo assim está em ${r}º de ${N}.`:'Sem comentários adicionais.'}`,
  (n,c,r,N,p)=>`${n} (${p>=0?'+':''}${p} pts, ${r}º).${c?` Consta que ${c}. Não ajudou.`:''}`,
  (n,c,r,N,p)=>`${n} em ${r}º de ${N}. ${c?`Sabendo que ${c}, eu esperava mais drama.`:'Esperava mais drama. Não houve.'}`,
  (n,c,r,N,p)=>`${r}º — ${n}. ${c?`Perguntaram-lhe se ${c} ajuda a prever futebol. Respondeu que sim. Está em ${r}º.`:'Aposta a olhómetro e nota-se.'}`,
  (n,c,r,N,p)=>`${n}: ${r}º.${c?` Parece que ${c}. A tabela classifica isso em ${r}º lugar.`:''}`,
  (n,c,r,N,p)=>`Notícia: ${n} ainda joga isto. Está em ${r}º.${c?` Já agora, ${c}.`:''}`,
  (n,c,r,N,p)=>`${n} senta-se no ${r}º lugar.${c?` Tendo em conta que ${c}, não é surpreendente.`:' Confortavelmente mediocre.'}`,
  (n,c,r,N,p)=>`${r}º: ${n}.${c?` ${c} — claramente não é qualificação para vidente.`:' Continua a achar que sabe de futebol.'}`,
  (n,c,r,N,p)=>`${n} em ${r}º (${p>=0?'+':''}${p}).${c?` Ouvi dizer que ${c}. Ouvi também que está em ${r}º.`:''}`,
  (n,c,r,N,p)=>`Para ${n} (${r}º), o Mundial é ${r<=5?'um copo-d\'água':'um exame de recuperação'}.${c?` Especialmente porque ${c}.`:''}`,
  (n,c,r,N,p)=>`${n} em ${r}º.${c?` O facto de ${c} não o impediu de chegar aqui. Impressionante, de que forma errada.`:''}`,
  (n,c,r,N,p)=>`${n}: ${p>=0?'+':''}${p} pts, ${r}º lugar.${c?` Já me disseram que ${c}. A matemática discorda.`:''}`,
  (n,c,r,N,p)=>`${n} ocupa o ${r}º lugar com a dignidade de quem ${c?`sabe que ${c} e mesmo assim apostou assim`:'já não tem esperança'}.`,
  (n,c,r,N,p)=>`${r}º — ${n}. ${c?`Fui à net tentar perceber como "${c}" se relaciona com futebol. Não encontrei.`:'Aposta como se fosse a primeira vez. Talvez seja.'}`,
  (n,c,r,N,p)=>`${n} (${r}º) prevê com a paixão de quem ${c||'adora futebol'} e a precisão de um meteorologista de Famalicão.`,
  (n,c,r,N,p)=>`Em ${r}º: ${n}. ${c?`Dizem que ${c}. A tabela diz ${r}º de ${N}.`:'Mais um na multidão do meio.'}`,
  (n,c,r,N,p)=>`${n} em ${r}º.${c?` Reconheço que ${c} é uma característica. Não sei é de quê.`:' Existe. É algo.'}`,
  (n,c,r,N,p)=>`${r}º: ${n}. ${c?`O facto de ${c} devia contar para alguma coisa. Conta — para chegar a ${r}º.`:'Coerente. Coerentemente assim.'}`,
  (n,c,r,N,p)=>`${n} está em ${r}º. ${c?`Com tudo o que implica ${c}, eu esperava pelo menos top 10.`:'Com tudo o que implica existir, eu esperava mais.'}`,
  (n,c,r,N,p)=>`${n} (${r}º): ${p>=0?'+':''}${p} pontos. ${c?`Sendo que ${c}, podemos dizer que há consistência. Toda ela na direção errada.`:''}`,
  (n,c,r,N,p)=>`${r}º lugar, ${n}. ${c?`Curioso que ${c} e ainda assim as previsões saíam assim.`:'Curioso.'}`,
  (n,c,r,N,p)=>`${n} em ${r}º de ${N}. ${c?`Perguntei ao ${n} se ${c} era vantagem. Disse que sim. Está em ${r}º.`:''}`,
  (n,c,r,N,p)=>`${n}: ${r}º. ${c?`"${c}" — escreve-se bem no perfil. Pontua-se mal na tabela.`:'Pelo menos é consistente.'}`,
  (n,c,r,N,p)=>`${n} vive no ${r}º andar deste prédio.${r<=5?' Penthouse.':r>=N-5?' Cave.':' Sem vista.'}${c?` Curiosamente, ${c}.`:''}`,
  (n,c,r,N,p)=>`${r}º: ${n}.${c?` ${c} — responsabilidades que claramente ignora na hora de apostar.`:''}`,
  (n,c,r,N,p)=>`${n} em ${r}º.${c?` Já sabíamos que ${c}. Agora sabemos também que é ${r}º.`:'Surpreendentemente não-surpreendente.'}`,
  (n,c,r,N,p)=>`${n} (${p>=0?'+':''}${p}, ${r}º).${c?` ${c} — e com isso chegou a ${r}º de ${N}. Respeito.`:''}`,
  (n,c,r,N,p)=>`${r}º — ${n}. ${c?`Tendo em conta que ${c}, a questão não é porquê ${r}º. É porquê não pior.`:'Tendo em conta tudo, poderia ser pior.'}`,
  (n,c,r,N,p)=>`Em ${r}º está ${n}.${c?` Reza a lenda que ${c}. As previsões rezam outra coisa.`:''}`,
];
const ROLL_CALL_EN=[
  (n,c,r,N,p)=>`${n} in ${r}th.${c?` Word is that ${c}. The table disagrees.`:''}`,
  (n,c,r,N,p)=>`${r}th: ${n}.${c?` Apparently ${c}. Still ${r}th.`:' Carrying on.'}`,
  (n,c,r,N,p)=>`${n} (${p>=0?'+':''}${p}) in ${r}th.${c?` Given that ${c}, I expected more.`:''}`,
  (n,c,r,N,p)=>`${n} parked at ${r}th. ${c?`Knowing that ${c} should count for something. It counts for ${r}th.`:'Beautifully mediocre.'}`,
  (n,c,r,N,p)=>`${n}, ${r}th of ${N}.${c?` They say ${c}. The ranking says ${r}.`:''}`,
];
// Pick K players from the sorted-by-uid list, deterministically rotating by date
function rotateForDay(uids,K,today){
  const N=uids.length;if(N===0) return [];
  const dayHash=today.split('-').reduce((a,b)=>a+parseInt(b,10),0);
  const stride=(N%7===0)?11:7;
  const start=(dayHash*stride)%N;
  const out=[];
  for(let i=0;i<Math.min(K,N);i++) out.push(uids[(start+i*stride)%N]);
  return out;
}
function dailyRollCall(rows,excludeUids,today){
  const sortedUids=rows.map(r=>r.uid).slice().sort();
  if(sortedUids.length<2) return [];
  const exclude=new Set(excludeUids.filter(Boolean));
  const pool=rotateForDay(sortedUids,Math.min(sortedUids.length,8),today);
  const picked=pool.filter(uid=>!exclude.has(uid)).slice(0,3);
  const chars=currentComp?.playerChars||{};
  const N=rows.length;
  const bank=lang==='pt'?ROLL_CALL_PT:ROLL_CALL_EN;
  const dayHash=today.split('-').reduce((a,b)=>a+parseInt(b,10),0);
  return picked.map((uid,i)=>{
    const r=rows.find(x=>x.uid===uid);if(!r) return null;
    const rank=rows.indexOf(r)+1;
    // Split by comma, pick ONE characteristic deterministically per day
    const rawChar=chars[uid]||'';
    const charList=rawChar.split(',').map(s=>s.trim()).filter(Boolean);
    const charIdx=charList.length?(dayHash+sortedUids.indexOf(uid)*7)%charList.length:-1;
    const rawPick=charIdx>=0?charList[charIdx]:'';
    // lowercase first character so it reads naturally mid-sentence
    const char=rawPick?rawPick.charAt(0).toLowerCase()+rawPick.slice(1):'';
    const tplIdx=(dayHash+i*13+sortedUids.indexOf(uid))%bank.length;
    const name=`<strong>${r.name}</strong>`;
    return bank[tplIdx](name,char,rank,N,r.pts);
  }).filter(Boolean);
}


function renderDailySummary(rows){
  const wrap=$('dsum-wrap');if(!wrap) return;
  const hasAnyReal=ALL_MATCHES.some(m=>{const s=actualScores[m.id];return s&&s.home!==undefined&&s.home!=='';});
  if(!hasAnyReal){
    wrap.innerHTML=`<div class="dsum"><div class="dsum-hl">📢 Aviso importante</div><p class="dsum-p">Mandem as apostas e pagamentos a tempo. Que ganhe o melhor, desde que o melhor não seja o João Eira!</p></div>`;
    return;
  }
  if(rows.length<2) return;
  const today=new Date().toISOString().split('T')[0];
  if(dailyCommentDate===today&&dailyComment){wrap.innerHTML=dailyComment;return;}
  const chars=currentComp?.playerChars||{};
  const leader=rows[0],second=rows[1],last=rows[rows.length-1];
  let bigClimb={diff:-99,name:'',uid:'',pts:0},bigFall={diff:99,name:'',uid:'',pts:0};
  let bigDay={diff:0,name:'',uid:''},badDay={diff:0,name:'',uid:''};
  if(prevLb.length===rows.length){
    rows.forEach((r,i)=>{
      const prev=prevLb.findIndex(p=>p.uid===r.uid);
      if(prev>=0){
        const posD=prev-i;if(posD>bigClimb.diff)bigClimb={diff:posD,name:r.name,uid:r.uid};if(posD<bigFall.diff)bigFall={diff:posD,name:r.name,uid:r.uid};
        const ptsPrev=prevLb[prev].pts;const ptsD=r.pts-ptsPrev;
        if(ptsD>bigDay.diff)bigDay={diff:ptsD,name:r.name,uid:r.uid};
        if(ptsD<badDay.diff)badDay={diff:ptsD,name:r.name,uid:r.uid};
      }
    });
  }
  
  // Pick template type based on day's drama
  let sum='';
  const isSavage=lang==='pt'?SAVAGE_COMMENTARY.savage_pt:SAVAGE_EN.savage;
  const isHype=lang==='pt'?SAVAGE_COMMENTARY.hype_pt:SAVAGE_EN.hype;
  const isChaos=lang==='pt'?SAVAGE_COMMENTARY.chaos_pt:SAVAGE_EN.chaos;
  const isBottom=lang==='pt'?SAVAGE_COMMENTARY.bottom_pt:SAVAGE_EN.bottom;
  const dayHash=today.split('-').reduce((a,b)=>a+parseInt(b),0);
  // Pick ONE characteristic (comma-split list) per uid per day
  const pickChar=uid=>{
    const raw=chars[uid]||'';
    const list=raw.split(',').map(s=>s.trim()).filter(Boolean);
    if(!list.length) return '';
    const picked=list[dayHash%list.length];
    return picked.charAt(0).toLowerCase()+picked.slice(1);
  };
  const ch=pickChar;

  if(badDay.diff<-5){
    const idx=dayHash%isSavage.length;
    sum=isSavage[idx](badDay.name,ch(badDay.uid),Math.abs(badDay.diff));
  }else if(bigDay.diff>5){
    const idx=dayHash%isHype.length;
    sum=isHype[idx](bigDay.name,ch(bigDay.uid),bigDay.diff);
  }else if(bigClimb.diff>=3||bigFall.diff<=-3){
    const idx=dayHash%isChaos.length;
    const target=bigClimb.diff>=3?bigClimb:bigFall;
    sum=isChaos[idx](target.name,ch(target.uid),target.diff);
  }else if(last.pts<-10){
    const idx=dayHash%isBottom.length;
    sum=isBottom[idx](last.name,ch(last.uid),rows.length);
  }else{
    const idx=dayHash%isHype.length;
    sum=isHype[idx](leader.name,ch(leader.uid),leader.pts);
  }

  // Who was the subject of the main `sum` line?
  const sumSubjectUid=badDay.diff<-5?badDay.uid:bigDay.diff>5?bigDay.uid:(bigClimb.diff>=3||bigFall.diff<=-3)?(bigClimb.diff>=3?bigClimb.uid:bigFall.uid):last.pts<-10?last.uid:leader.uid;

  const shouts=[];
  // Leader shoutout — only if leader wasn't already the subject of sum
  if(sumSubjectUid!==leader.uid) shouts.push(shoutLeader(`<strong style="color:var(--gold)">${leader.name}</strong>`,ch(leader.uid)));
  // Biggest climber
  if(bigClimb.diff>0&&bigClimb.uid!==leader.uid&&bigClimb.uid!==sumSubjectUid) shouts.push(shoutClimb(bigClimb.name,bigClimb.diff,ch(bigClimb.uid)));
  // Biggest faller
  if(bigFall.diff<0&&bigFall.uid!==bigClimb.uid&&bigFall.uid!==sumSubjectUid) shouts.push(shoutFall(bigFall.name,Math.abs(bigFall.diff),ch(bigFall.uid)));
  // Big day bonus
  if(bigDay.diff>=6&&bigDay.uid!==leader.uid&&bigDay.uid!==sumSubjectUid) shouts.push(shoutBigDay(bigDay.name,bigDay.diff,ch(bigDay.uid)));
  else if(badDay.diff<=-4&&badDay.uid!==sumSubjectUid) shouts.push(shoutBadDay(badDay.name,badDay.diff,ch(badDay.uid)));

  // Daily roll-call: rotating 3 players/day so everyone is mentioned ≥2x across
  // the tournament. Excludes anyone already featured in main commentary/shouts.
  const featuredUids=[leader.uid,bigClimb.uid,bigFall.uid,bigDay.uid,badDay.uid,last.uid];
  const rollCall=dailyRollCall(rows,featuredUids,today);

  // Cap total lines at 5: 1 main + at most 1 shout + 3 roll-call jabs
  const shoutLines=shouts.slice(0,1);
  const allLines=[...shoutLines,...rollCall].slice(0,4); // 4 extra + 1 main = 5 total
  const html=`<div class="dsum"><div class="dsum-hl" style="display:flex;align-items:center;justify-content:space-between">🎙️ ${lang==='pt'?'Comentário do Dia':'Daily Commentary'}${isHost?`<button onclick="dailyComment='';dailyCommentDate='';renderLeaderboard()" style="background:none;border:none;cursor:pointer;font-size:1rem;opacity:.5" title="Forçar regeneração">🔄</button>`:''}</div><p class="dsum-p">${sum}</p>${allLines.map(s=>`<p class="dsum-p">${s}</p>`).join('')}</div>`;
  dailyComment=html;dailyCommentDate=today;wrap.innerHTML=html;
}

