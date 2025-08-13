/* PokemonZ balance simulator: runs many games with parameter variants and reports fairness/metrics */
'use strict';

function rngShuffle(a) { for (let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

const SUITS=['spades','hearts','diamonds','clubs'];
const PVAL={A:11,'10':10,K:4,Q:3,D:3,J:2,'9':0,'8':0,'7':0,X:0};
const JACK_ORDER=['clubs','spades','hearts','diamonds'];
const JOKER_ORDER=['clubs','spades','hearts','diamonds'];

function makeDeck(){ const deck=[]; for(const s of SUITS){ for(const r of ['7','8','9','10','J','Q','K','A']) deck.push({suit:s,rank:r}); deck.push({suit:s,rank:'X'}); } return deck; }
function isJack(c){ return c && c.rank==='J'; }
function isJoker(c){ return c && c.rank==='X'; }
function topcardTrump(top){ return (!top||top.rank==='J')? null : top.suit; }

function computeLeadSuit(trick,trumpSuit,ansFlags, RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD){
  if(!Array.isArray(trick)||trick.length===0) return null;
  for(let i=0;i<trick.length;i++){
    const e=trick[i]; if(!e||!e.card) continue;
    if(isJack(e.card)||isJoker(e.card)) continue;
    if(trumpSuit && e.card.suit===trumpSuit && ansFlags && ansFlags[e.player] && !RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD){ continue; }
    return e.card.suit;
  }
  return null;
}

function compareTrick(cards,leader,trumpSuit,ansFlags,RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD){
  ansFlags=ansFlags||[];
  let leadSuit=null;
  for(let i=0;i<cards.length;i++){
    const e=cards[i];
    if(e&&e.card&&!isJack(e.card)&&!isJoker(e.card)){
      const isAns=!!ansFlags[e.player];
      if(trumpSuit&&e.card.suit===trumpSuit&&isAns&&!RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD){ continue; }
      leadSuit=e.card.suit; break;
    }
  }
  function rankPower(r){ switch(r){ case 'A':return 80; case '10':return 70; case 'K':return 60; case 'Q': case 'D':return 50; case '9':return 40; case '8':return 30; case '7':return 20; default:return 10; } }
  function power(c,pid){ if(!c) return -9999; const isAns=!!ansFlags[pid];
    if(isJoker(c)) return 1000+(3-JOKER_ORDER.indexOf(c.suit));
    if(isJack(c))  return  900+(3-JACK_ORDER.indexOf(c.suit));
    if(trumpSuit&&c.suit===trumpSuit&&!isAns) return 600+rankPower(c.rank);
    if(leadSuit&&c.suit===leadSuit) return 300+rankPower(c.rank);
    return rankPower(c.rank);
  }
  let best=-1e9, wi=0; for(let i=0;i<cards.length;i++){ const pc=cards[i]; const pwr=power(pc?pc.card:null, pc?pc.player:null); if(pwr>best){ best=pwr; wi=i; } }
  return {winner:cards[wi].player, leadSuit};
}

function canFollow(hand,leadSuit){ if(!leadSuit||!Array.isArray(hand)||hand.length===0) return false; for(const c of hand){ if(c&&!isJack(c)&&!isJoker(c)&&c.suit===leadSuit) return true; } return false; }
function legalMoves(hand,leadSuit,trumpSuit,ansage){ if(!Array.isArray(hand)) return []; if(!leadSuit){ return hand.filter(Boolean); } const suitedNormals=hand.filter(c=>c&&!isJack(c)&&!isJoker(c)&&c.suit===leadSuit); if(suitedNormals.length>0) return suitedNormals; return hand.filter(Boolean); }

function aiWantsAnsage(hand,trumpSuit){ const j=hand.filter(isJack).length; const x=hand.filter(isJoker).length; const tn=hand.filter(c=>c&&!isJack(c)&&!isJoker(c)&&trumpSuit&&c.suit===trumpSuit).length; return (j+x)>=2 || (x>=1&&j>=1) || tn>=3; }
function aiChooseTopSwapCard(hand,top){ if(!top||top.rank==='J') return null; let cand=null, val=1e9; for(const c of hand){ if(!c||isJack(c)||isJoker(c)) continue; if(c.suit===top.suit) continue; const p=(PVAL[c.rank]||0); if(p<val){ val=p; cand=c; } } return cand; }
function aiWantsJokerSwap(hand){ return hand.some(isJoker); }

function pickCardAI(G, hand, ctx){
  const {leadSuit,trumpSuit,ansage}=ctx; const legal=legalMoves(hand,leadSuit,trumpSuit,ansage);
  if(!legal || legal.length===0) return null;
  if(G && Array.isArray(G.trick) && G.trick.length>0){ let best=null; const me = (G.leader + G.trick.length) % G.N; for(const c of legal){ const sim=[...G.trick, {player:me, card:c}]; const res=compareTrick(sim, G.leader, G.trumpSuit, G.ansage||[], G.RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD); const wins = (res.winner===me); let cost = (PVAL[c.rank]||0); if(isJoker(c)) cost += 1000; else if(isJack(c)) cost += 800; else if(trumpSuit && c.suit===trumpSuit && !ansage) cost += 400; if(wins){ if(!best || cost < best.cost){ best={card:c, cost}; } } } if(best) return best.card; }
  function dumpValue(c){ if(isJoker(c)) return 10000; if(isJack(c)) return 9000; let v=(PVAL[c.rank]||0); if(trumpSuit && c.suit===trumpSuit && !ansage) v += 500; return v; }
  legal.sort((a,b)=>dumpValue(a)-dumpValue(b)); return legal[0];
}

function playRound(params, tour){
  const {RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD, JOKER_BONUS, DANGER_PENALTY} = params;
  const deck=rngShuffle(makeDeck()); const hands=Array.from({length:tour.N},()=>[]);
  for(let r=0;r<5;r++){ for(let p=0;p<tour.N;p++){ const c=deck.shift(); if(c) hands[p].push(c); } }
  const top=deck.shift(); const reserveInit=deck.shift(); const trumpSuit=topcardTrump(top);
  const G={ N:tour.N, deck, hands, top, reserve:reserveInit, trumpSuit, leader:tour.leader, trick:[], piles:Array.from({length:tour.N},()=>[]), trickWins:Array(tour.N).fill(0), ansage:Array(tour.N).fill(false), jokers:Array(tour.N).fill(0), trumpSwapped:Array(tour.N).fill(false), phase:'pre', RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD };

  function preAIDecide(p){ const hand=G.hands[p].slice(); const ans=aiWantsAnsage(hand,G.trumpSuit); G.ansage[p]=!!ans; if(G.reserve && aiWantsJokerSwap(hand)){ const idx=G.hands[p].findIndex(c=>c&&c.rank==='X'); if(idx>=0){ const reserveCard=G.reserve; G.reserve=null; const joker=G.hands[p][idx]; G.hands[p].splice(idx,1); if(reserveCard) G.hands[p].push(reserveCard); G.jokers[p]=(G.jokers[p]||0)+JOKER_BONUS; G.trickWins[p]=(G.trickWins[p]||0)+1; } }
    if(!G.trumpSwapped[p]){ const card=aiChooseTopSwapCard(G.hands[p],G.top); if(card){ const i=G.hands[p].indexOf(card); const oldTop=G.top; G.top=G.hands[p][i]; G.hands[p][i]=oldTop; G.trumpSuit=topcardTrump(G.top); G.trumpSwapped[p]=true; } }
  }

  // Pre-phase in turn order starting from leader
  for(let k=0;k<tour.N;k++){ const p=(G.leader+k)%tour.N; preAIDecide(p); }
  G.phase='play';

  // Play 5 tricks
  for(let t=0;t<5;t++){
    G.trick=[];
    for(let off=0; off<tour.N; off++){
      const p=(G.leader + off) % tour.N; const leadSuit=computeLeadSuit(G.trick,G.trumpSuit,G.ansage,RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD);
      const card=pickCardAI(G, G.hands[p].filter(Boolean), {leadSuit,trumpSuit:G.trumpSuit,ansage:(G.ansage?G.ansage[p]:false)});
      // fallback pick first if null
      const chosen = card || G.hands[p].find(Boolean);
      const idx = G.hands[p].indexOf(chosen); if(idx>=0) G.hands[p].splice(idx,1); else G.hands[p].splice(0,1);
      G.trick.push({player:p,card:chosen});
    }
    const res=compareTrick(G.trick,G.leader,G.trumpSuit,G.ansage,RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD);
    const winner=res.winner; const wonCards=[]; for(const e of G.trick){ if(e&&e.card) wonCards.push(e.card); }
    G.piles[winner].push(...wonCards); G.trickWins[winner]++; G.leader=winner; // next trick leader
  }

  // Scoring for round
  const roundScores=G.piles.map(pp=>pp.reduce((sum,c)=>sum+(PVAL[c.rank]||0),0));
  for(let p=0;p<tour.N;p++){ roundScores[p]+=(G.jokers&&G.jokers[p]? G.jokers[p]:0); }
  for(let p=0;p<tour.N;p++){ const made=(G.trickWins&&G.trickWins[p]? G.trickWins[p]:0)>0; if(G.ansage&&G.ansage[p]){ roundScores[p]= made? roundScores[p]*2 : 0; } else if(tour.danger&&tour.danger[p]){ roundScores[p]*=2; } }
  const nextDanger=new Array(tour.N).fill(false);
  for(let q=0;q<tour.N;q++){ const tw=(G.trickWins&&G.trickWins[q]? G.trickWins[q]:0); if(tw===0){ if(tour.danger&&tour.danger[q]){ roundScores[q]+=DANGER_PENALTY; nextDanger[q]=false; } else { nextDanger[q]=true; } } }
  return { roundScores, nextDanger, nextLeader: G.leader, ansage:G.ansage, trickWins:G.trickWins };
}

function simulate(params){
  const N=params.N||3; const target=params.target||200; const games=params.games||10000;
  const results={ seatWins:new Array(N).fill(0), totalRounds:0, avgRounds:0, avgScorePerRound:new Array(N).fill(0), ansageRate:0, ansageSuccess:0 };
  for(let g=0; g<games; g++){
    const tour={ N, target, totals:new Array(N).fill(0), danger:new Array(N).fill(false), leader: (Math.random()*N)|0 };
    let rounds=0; let anyAns=0, anyAnsSuccess=0;
    while(Math.max(...tour.totals) < target){
      const r=playRound(params, tour); rounds++;
      for(let i=0;i<N;i++){ tour.totals[i]+=r.roundScores[i]; results.avgScorePerRound[i]+=r.roundScores[i]; }
      tour.danger=r.nextDanger; tour.leader=r.nextLeader;
      // track ansage
      for(let i=0;i<N;i++){ if(r.ansage[i]){ anyAns++; if(r.trickWins[i]>0) anyAnsSuccess++; } }
      if(rounds>200){ break; } // guard
    }
    results.totalRounds += rounds;
    const winner = tour.totals.indexOf(Math.max(...tour.totals)); results.seatWins[winner]++;
    results.ansageRate += anyAns>0 ? 1:0; results.ansageSuccess += anyAnsSuccess>0 ? 1:0;
  }
  results.avgRounds = results.totalRounds / games;
  results.avgScorePerRound = results.avgScorePerRound.map(v=>v/(games));
  return results;
}

function run(){
  const variants=[
    { name:'baseline', N:3, target:200, games:10000, RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD:true, JOKER_BONUS:7, DANGER_PENALTY:-10 },
    { name:'ansage_no_lead', N:3, target:200, games:10000, RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD:false, JOKER_BONUS:7, DANGER_PENALTY:-10 },
    { name:'danger_mild', N:3, target:200, games:10000, RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD:true, JOKER_BONUS:7, DANGER_PENALTY:-5 },
    { name:'danger_mild_no_lead', N:3, target:200, games:10000, RULE_ANSAGE_TRUMP_COUNTS_AS_LEAD:false, JOKER_BONUS:7, DANGER_PENALTY:-5 }
  ];
  const out={};
  console.log('Running simulations...');
  const t0=Date.now();
  for(const v of variants){ const res=simulate(v); out[v.name]=res; console.log(v.name, res); }
  const t1=Date.now();
  console.log('Done in', ((t1-t0)/1000).toFixed(2),'s');
  try{ require('fs').writeFileSync('./sim_results.json', JSON.stringify(out,null,2)); }catch(_){ }
}

if (require.main === module){ run(); }


