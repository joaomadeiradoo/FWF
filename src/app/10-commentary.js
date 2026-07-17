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
// ═══ ROASTS — data-driven, not personalised (#2) ═══
// João's call: really good roasts that are NOT personalised. playerChars and the
// whole ROLL_CALL_PT/EN bank above are LEFT INTACT and still work — flip
// ROAST_MODE back to 'chars' and nothing is lost.
//
// WHY THIS IS BETTER THAN GENERIC. The obvious reading of "not personalised" is
// jokes built from name + rank + points. That is exactly what the `char`-less
// fallbacks in ROLL_CALL_PT already do, and they read like "Nome em 5º. Existe.
// É algo." — no joke, because there is nothing to bite on. A line that could be
// about anyone is about no one.
//
// But the app already knows something sharper than anyone's day job: WHAT THEY
// PREDICTED. "Escolheu o Brasil para campeão; o Brasil saiu no R32" is specific,
// true, checkable, funny — and not personal at all. So: roast the takes, never
// the person. That is also the only version that is safe to publish to 64 real
// people who know each other.
//
// THE HARD RULE: a roast that asserts a fact must never assert a WRONG fact. A
// joke built on a bug is a public lie about someone. So every fact below is
// derived from the same functions the scorer uses, returns null when unknown,
// and each template DECLARES the facts it needs — templates are filtered out
// unless every fact they need is known. No fact, no joke. Never a guessed one.
const ROAST_MODE='data'; // 'data' = predictions-based | 'chars' = legacy playerChars bank

// Is this team definitively out? true / false / null (= not yet decidable).
// Reads the same ko_ arrays as the scorer. Walks rounds in order and stops at
// the first one that is not fully decided, so it can never claim a team is out
// on the basis of a half-entered round.
function teamOut(team){
  if(!team) return null;
  const need={ko_r32:16,ko_r16:8,ko_qf:4,ko_sf:2};
  let known=null;
  for(const k of ['ko_r32','ko_r16','ko_qf','ko_sf']){
    const arr=(actualScores[k]||[]).filter(Boolean);
    if(arr.length<need[k]) break;      // round undecided → nothing further is knowable
    if(!arr.includes(team)) return true;
    known=false;                        // survived this round
  }
  return known;
}
// ═══ COMPETITION HISTORY (2008–2025) ═══
// TOURNAMENT_HISTORY holds 18 years of this group's winners/runners-up/thirds.
// A former champion languishing mid-table is the best roast material in the app.
//
// ⚠️ EXACT NORMALISED MATCH ONLY. NEVER fuzzyScore. This is not caution for its
// own sake — fuzzyScore('João Luís Mota','Luís Mota') returns 0.85, ABOVE the
// 0.82 the app uses elsewhere to decide two names are the same person. And the
// 2019 CAN Egipto row lists runnerUp 'Luís Mota' and third 'João Luís Mota' —
// the SAME PODIUM. They are demonstrably two different people. A fuzzy match
// would publicly credit one man with the other's title, in a roast, in front of
// the other 63. Same for João do Ó / Nuno do Ó and the three Motas.
// If the name does not match exactly, there is no history fact and no history
// joke. No fact, no joke.
function historyFor(playerName){
  const target=normalize(playerName);
  if(!target) return null;
  const bad=v=>!v||v==='TBD'||v==='?'||/no record/i.test(v);
  const wins=[],seconds=[],thirds=[];
  for(const t of TOURNAMENT_HISTORY){
    if(t.year===2026) continue;                    // the competition being played
    if(!bad(t.winner)&&normalize(t.winner)===target) wins.push(t);
    if(!bad(t.runnerUp)&&normalize(t.runnerUp)===target) seconds.push(t);
    if(!bad(t.third)&&normalize(t.third)===target) thirds.push(t);
  }
  if(!wins.length&&!seconds.length&&!thirds.length) return null;
  return{wins,seconds,thirds};
}
// Every fact a roast may use. null means "not knowable yet" — never 0, never a guess.
function roastFacts(uid,rows){
  const r=rows.find(x=>x.uid===uid);
  if(!r) return null;
  const s=profileStats(uid);            // VIEW over calcBreakdown — not a second computation
  const rank=rows.indexOf(r)+1,N=rows.length;
  const groupsDone=ALL_MATCHES.every(m=>{const a=actualScores[m.id];return a&&a.home!==undefined&&a.home!=='';});
  const champ=(s.bp.fin||[])[0]||null;
  const vice=(s.bp.fin||[])[1]||null;
  const leader=rows[0];
  const h=historyFor(r.name);
  const wins=h?h.wins:[];
  const podiums=h?(h.wins.length+h.seconds.length+h.thirds.length):0;
  const lastWin=wins.length?wins.reduce((a,b)=>b.year>a.year?b:a):null;
  const wcWin=wins.filter(t=>t.type==='WC').sort((a,b)=>b.year-a.year)[0]||null;
  const bottomHalf=rank>Math.ceil(N/2);
  return{
    n:`<strong>${r.name}</strong>`,
    // ── history (null unless an EXACT name match exists) ──
    titles:wins.length||null,
    lastWin,
    wcWin,
    wcWinFaded:(wcWin&&bottomHalf)?wcWin:null,
    fallenChamp:(wins.length&&bottomHalf)?wins.length:null,
    nearlyMan:(!wins.length&&podiums>=2)?podiums:null,
    podiums:podiums||null,
    veteran:(podiums>=4)?podiums:null,
    rank,N,pts:r.pts,
    // MUST be true-or-null, never false. Eligibility tests !==null/!==undefined,
    // so a `false` here reads as "fact known" and fires the template. That bug
    // shipped a "Paulo Niza lidera" line about a player in 5th. If it is not a
    // fact, it is null.
    last:rank===N?true:null,
    first:rank===1?true:null,
    neg:r.pts<0?r.pts:null,
    gap:(leader&&leader.uid!==uid&&typeof leader.pts==='number')?leader.pts-r.pts:null,
    champ,
    champOut:teamOut(champ)===true?champ:null,
    champAlive:teamOut(champ)===false?champ:null,
    vice,viceOut:teamOut(vice)===true?vice:null,
    topScorer:s.pr.topScorer||null,
    exact:s.played?s.exact:null,played:s.played||null,
    // "zero group winners" is only a fact once the group stage is complete
    gwZero:(groupsDone&&(s.d.gw||0)===0)?true:null,
    gwAll:(groupsDone&&(s.d.gw||0)>=60)?true:null,
    adj:s.bd.adj?s.bd.adj:null,
    r32hit:s.rounds[0][1],sfhit:s.rounds[3][1],
  };
}
// Each entry: need = facts required (all must be non-null), f = the line.
const ROAST_PT=[
  // ── history-based (2008–2025) ──
  {need:['wcWinFaded','rank','N'],f:x=>`${x.n} ganhou o ${x.wcWinFaded.name} em ${x.wcWinFaded.year}. Hoje vai em ${x.rank}º de ${x.N}. Os títulos não se herdam.`},
  {need:['wcWin','rank'],f:x=>`Campeão do Mundial de ${x.wcWin.year}. Em ${x.rank}º agora. O Professor Karamba não faz descontos a ex-campeões.`},
  {need:['fallenChamp','rank','N'],f:x=>`${x.n} tem ${x.fallenChamp} título${x.fallenChamp>1?'s':''} nesta casa e está em ${x.rank}º de ${x.N}. A glória é temporária. A tabela é permanente.`},
  {need:['lastWin','rank'],f:x=>`Último troféu de ${x.n}: ${x.lastWin.name}, ${x.lastWin.year}. Desde então, ${x.rank}º e muito silêncio.`},
  {need:['titles','rank'],f:x=>`${x.n}, ${x.titles}× vencedor. Este ano, ${x.rank}º. Toda a gente tem uma década má.`},
  {need:['nearlyMan','rank'],f:x=>`${x.n}: ${x.nearlyMan} pódios, zero títulos. O eterno padrinho, nunca o noivo. Este ano, ${x.rank}º — nem padrinho.`},
  {need:['nearlyMan'],f:x=>`${x.n} já subiu ao pódio ${x.nearlyMan} vezes sem nunca ganhar. Há quem chame a isso consistência.`},
  {need:['veteran','rank','N'],f:x=>`${x.veteran} pódios ao longo dos anos para ${x.n}. Hoje: ${x.rank}º de ${x.N}. A experiência conta — contra.`},
  {need:['lastWin','champOut'],f:x=>`${x.n} ganhou em ${x.lastWin.year}. Este ano apostou no ${x.champOut}, que já saiu. O tempo é cruel.`},
  {need:['titles','neg'],f:x=>`${x.n}: ${x.titles} título${x.titles>1?'s':''} no currículo e ${x.neg} pontos este ano. Isto é uma queda com história.`},
  {need:['champOut'],f:x=>`${x.n} apostou tudo no ${x.champOut} para campeão. O ${x.champOut} já está de férias. ${x.n} continua aqui, em ${x.rank}º, de luto.`},
  {need:['champOut'],f:x=>`Lembram-se de quando ${x.n} disse que o ${x.champOut} ganhava isto? O Mundial não se lembra.`},
  {need:['champOut'],f:x=>`${x.champOut}, campeão — segundo ${x.n}. Segundo a realidade, não.`},
  {need:['champOut','rank'],f:x=>`O campeão de ${x.n} era o ${x.champOut}. Saiu. ${x.n} ficou em ${x.rank}º a fingir que era o plano.`},
  {need:['champAlive','rank'],f:x=>`${x.n} tem o ${x.champAlive} para campeão e ainda está vivo. Em ${x.rank}º, mas vivo. É mais do que muitos podem dizer.`},
  {need:['viceOut'],f:x=>`${x.n} pôs o ${x.viceOut} na final. O ${x.viceOut} nem chegou lá perto. Detalhes.`},
  {need:['gwZero','rank'],f:x=>`Doze grupos. Doze vencedores. ${x.n} acertou zero. Isso já não é azar, é uma metodologia.`},
  {need:['gwZero'],f:x=>`${x.n} não acertou um único vencedor de grupo. Doze tentativas. Zero. Estatisticamente, isto dá trabalho.`},
  {need:['gwAll','rank'],f:x=>`${x.n} acertou os doze vencedores de grupo e mesmo assim está em ${x.rank}º. Fascinante.`},
  {need:['exact','played'],f:x=>x.exact===0?`${x.n} acertou o resultado exacto de ${x.exact} jogos em ${x.played}. Zero. Nem por acidente.`:x.exact===x.played?`${x.n} acertou os ${x.played} resultados todos. Isto ou é génio ou é fraude.`:`${x.n}: ${x.exact} resultados exactos em ${x.played}. O resto foi imaginação.`},
  {need:['exact','played','rank'],f:x=>`${x.exact} em ${x.played} resultados certos e um ${x.rank}º lugar. Há aqui uma lição, mas ${x.n} não a vai aprender.`},
  {need:['neg'],f:x=>`${x.n} tem ${x.neg} pontos. Negativo. Não submeter nada dava mais.`},
  {need:['neg'],f:x=>`${x.n}: ${x.neg} pontos. Chegou abaixo de zero. Isso exige dedicação.`},
  {need:['neg','N'],f:x=>`${x.n} conseguiu pontuação negativa num jogo onde acertar é opcional mas errar custa. Respeito, de certa forma.`},
  {need:['topScorer','rank'],f:x=>`Melhor marcador segundo ${x.n}: ${x.topScorer}. Segundo ${x.rank}º lugar: talvez não.`},
  {need:['topScorer','champOut'],f:x=>`${x.n} apostou no ${x.topScorer} para melhor marcador e no ${x.champOut} para campeão. Metade desse plano já morreu.`},
  {need:['last','N'],f:x=>`${x.N}º de ${x.N}. Alguém tinha de ser. É ${x.n}. E foi convincente.`},
  {need:['last'],f:x=>`${x.n} fecha a tabela. Não por pouco.`},
  {need:['first','pts'],f:x=>`${x.n} lidera com ${x.pts>=0?'+':''}${x.pts}. Aproveita. Isto é um Mundial, não um contrato vitalício.`},
  {need:['first'],f:x=>`${x.n} em 1º. Ou percebe mesmo de futebol, ou teve sorte. A tabela não distingue.`},
  {need:['gap','rank'],f:x=>`${x.n} está a ${x.gap} pontos da liderança. A pé, dava para lá chegar mais depressa.`},
  {need:['gap'],f:x=>x.gap>60?`${x.gap} pontos atrás do líder. ${x.n} não está a jogar o mesmo Mundial que nós.`:`${x.n}, a ${x.gap} do topo. Tecnicamente ainda dá. Tecnicamente.`},
  {need:['adj','rank'],f:x=>`${x.n} tem ${x.adj>0?'+':''}${x.adj} pontos de ajuste manual do host. Nem tudo se ganha a prever.`},
  {need:['r32hit'],f:x=>`${x.n} acertou ${x.r32hit.n} das ${x.r32hit.of} equipas que passaram o R32. As outras ${x.r32hit.of-x.r32hit.n} foram uma surpresa — para ${x.n}, pelo menos.`},
  {need:['sfhit'],f:x=>x.sfhit.n===0?`Finalistas previstos por ${x.n}: nenhum acertado. Nem um. A sério.`:`${x.n} acertou ${x.sfhit.n} finalista(s). Vamos fingir que foi de propósito.`},
  {need:['rank','N','pts'],f:x=>`${x.n}: ${x.rank}º de ${x.N}, ${x.pts>=0?'+':''}${x.pts} pontos. Sem drama, sem glória, sem comentários.`},
  {need:['rank','N'],f:x=>x.rank<=Math.ceil(x.N/2)?`${x.n} em ${x.rank}º. Metade de cima. Não é vitória, é ausência de vergonha.`:`${x.n} em ${x.rank}º. Metade de baixo. Há espaço para descer.`},
  {need:['champ','rank'],f:x=>`${x.n} escolheu o ${x.champ} para campeão e está em ${x.rank}º. Uma dessas coisas ainda pode salvar-se.`},
  {need:['pts','rank'],f:x=>`${x.pts>=0?'+':''}${x.pts} pontos para ${x.n}. O Professor Karamba viu as previsões e não quis comentar.`},
  {need:['exact','played'],f:x=>x.exact===x.played?`${x.n} previu ${x.played} jogos em ${x.played} ao certo. Alguém verifique isto.`:`${x.n} viu ${x.played} jogos acontecerem e previu ${x.exact} deles ao certo. Os outros ${x.played-x.exact} também os viu.`},
];
const ROAST_EN=[
  {need:['wcWinFaded','rank','N'],f:x=>`${x.n} won the ${x.wcWinFaded.year} World Cup pool. Currently ${x.rank}th of ${x.N}. Titles don't carry over.`},
  {need:['fallenChamp','rank','N'],f:x=>`${x.n} has ${x.fallenChamp} title${x.fallenChamp>1?'s':''} here and sits ${x.rank}th of ${x.N}. Glory is temporary. The table is permanent.`},
  {need:['lastWin','rank'],f:x=>`${x.n}'s last trophy: ${x.lastWin.name}, ${x.lastWin.year}. Since then: ${x.rank}th, and silence.`},
  {need:['nearlyMan'],f:x=>`${x.n}: ${x.nearlyMan} podiums, no titles. Always the bridesmaid.`},
  {need:['champOut'],f:x=>`${x.n} backed ${x.champOut} to win it all. ${x.champOut} went home. ${x.n} is still here, in ${x.rank}th, grieving.`},
  {need:['champAlive','rank'],f:x=>`${x.n}'s champion pick ${x.champAlive} is somehow still alive. ${x.n}, in ${x.rank}th, less so.`},
  {need:['gwZero'],f:x=>`Twelve groups. Twelve winners. ${x.n} got zero. That takes effort.`},
  {need:['exact','played'],f:x=>x.exact===0?`${x.n} called ${x.exact} exact scorelines out of ${x.played}. Not one. Not even by accident.`:`${x.n}: ${x.exact} exact scorelines from ${x.played}. The rest was fiction.`},
  {need:['neg'],f:x=>`${x.n} is on ${x.neg} points. Negative. Submitting nothing would have scored higher.`},
  {need:['last','N'],f:x=>`${x.N}th of ${x.N}. Someone had to be. It's ${x.n}, and it wasn't close.`},
  {need:['first','pts'],f:x=>`${x.n} leads on ${x.pts>=0?'+':''}${x.pts}. Enjoy it. This is a World Cup, not a tenure.`},
  {need:['gap'],f:x=>`${x.n} is ${x.gap} points off the lead. You could walk there faster.`},
  {need:['topScorer','rank'],f:x=>`Top scorer according to ${x.n}: ${x.topScorer}. According to ${x.rank}th place: perhaps not.`},
  {need:['rank','N','pts'],f:x=>`${x.n}: ${x.rank}th of ${x.N}, ${x.pts>=0?'+':''}${x.pts}. No drama, no glory, no notes.`},
];
// Eligible = every declared fact is known. Deterministic pick per player per day.
function roastFor(uid,rows,today,i){
  const x=roastFacts(uid,rows);
  if(!x) return null;
  const bank=lang==='pt'?ROAST_PT:ROAST_EN;
  const ok=bank.filter(t=>t.need.every(k=>x[k]!==null&&x[k]!==undefined));
  if(!ok.length) return null;
  const dayHash=today.split('-').reduce((a,b)=>a+parseInt(b,10),0);
  const idx=(dayHash+i*13+x.rank*7)%ok.length;
  try{ return ok[idx].f(x); }catch(e){ return null; }
}

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
    // Data-driven roasts (#2). Falls through to the legacy playerChars bank if
    // ROAST_MODE is flipped, or if no roast has enough known facts to fire.
    if(ROAST_MODE==='data'){
      const roast=roastFor(uid,rows,today,i);
      if(roast) return roast;
    }
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

