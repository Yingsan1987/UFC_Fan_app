import { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

// ─── Card Utilities ───────────────────────────────────────────
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const SUIT_SYM = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];

function rankLabel(r) {
  return r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : r === 14 ? 'A' : String(r);
}

function isRed(suit) { return suit === 'hearts' || suit === 'diamonds'; }

function newShuffledDeck() {
  const deck = SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── Hand Evaluation ─────────────────────────────────────────
function combos5(arr) {
  const out = [];
  for (let a = 0; a < arr.length - 4; a++)
    for (let b = a+1; b < arr.length - 3; b++)
      for (let c = b+1; c < arr.length - 2; c++)
        for (let d = c+1; d < arr.length - 1; d++)
          for (let e = d+1; e < arr.length; e++)
            out.push([arr[a], arr[b], arr[c], arr[d], arr[e]]);
  return out;
}

function evalFive(cards) {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);
  const flush = suits.every(s => s === suits[0]);

  let straight = false, strHigh = 0;
  if (new Set(ranks).size === 5 && ranks[0] - ranks[4] === 4) {
    straight = true; strHigh = ranks[0];
  }
  if (ranks[0]===14 && ranks[1]===5 && ranks[2]===4 && ranks[3]===3 && ranks[4]===2) {
    straight = true; strHigh = 5;
  }

  const freq = {};
  ranks.forEach(r => { freq[r] = (freq[r] || 0) + 1; });
  const g = Object.entries(freq)
    .map(([r, c]) => ({ r: +r, c }))
    .sort((a, b) => b.c - a.c || b.r - a.r);
  const counts = g.map(x => x.c);

  if (flush && straight) return { rank: 8, tie: [strHigh], name: strHigh === 14 ? 'Royal Flush' : 'Straight Flush' };
  if (counts[0] === 4) return { rank: 7, tie: [g[0].r, g[1].r], name: 'Four of a Kind' };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, tie: [g[0].r, g[1].r], name: 'Full House' };
  if (flush) return { rank: 5, tie: ranks, name: 'Flush' };
  if (straight) return { rank: 4, tie: [strHigh], name: 'Straight' };
  if (counts[0] === 3) return { rank: 3, tie: [g[0].r, g[1].r, g[2].r], name: 'Three of a Kind' };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, tie: [g[0].r, g[1].r, g[2].r], name: 'Two Pair' };
  if (counts[0] === 2) return { rank: 1, tie: [g[0].r, g[1].r, g[2].r, g[3].r], name: 'One Pair' };
  return { rank: 0, tie: ranks, name: 'High Card' };
}

function cmpTie(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function bestHand(hole, community) {
  const all = [...hole, ...community];
  if (all.length < 5) return { rank: -1, tie: [], name: '?' };
  let best = null;
  for (const combo of combos5(all)) {
    const h = evalFive(combo);
    if (!best || h.rank > best.rank || (h.rank === best.rank && cmpTie(h.tie, best.tie) > 0)) best = h;
  }
  return best;
}

// ─── AI Logic ─────────────────────────────────────────────────
const AI_NAMES = ['Conor McFighter', 'Khabib Nurmabot', 'Jon Jonesy'];
const AI_AGGRESSION = [0.6, 0.35, 0.78];

function preFlopScore(hole) {
  const hi = Math.max(hole[0].rank, hole[1].rank);
  const lo = Math.min(hole[0].rank, hole[1].rank);
  const suited = hole[0].suit === hole[1].suit;
  const pair = hi === lo;
  if (pair && hi >= 10) return 0.92;
  if (pair && hi >= 7)  return 0.75;
  if (pair)             return 0.58;
  if (hi === 14 && lo >= 10) return 0.86;
  if (hi === 14 && lo >= 7)  return 0.66;
  if (hi >= 12 && lo >= 10)  return 0.72;
  if (suited && hi >= 9 && hi - lo <= 2) return 0.62;
  if (hi >= 10 && lo >= 8)   return 0.48;
  return Math.max(0.12, (hi + lo - 4) / 55);
}

function aiHandScore(hole, community) {
  if (community.length === 0) return preFlopScore(hole);
  const h = bestHand(hole, community);
  return Math.min(0.97, h.rank * 0.105 + 0.12);
}

function aiDecide(player, { currentBet, pot, communityCards, bigBlind }) {
  const noise = (Math.random() - 0.5) * 0.18;
  const score = Math.max(0, Math.min(1, aiHandScore(player.holeCards, communityCards) + noise));
  const aggr = AI_AGGRESSION[(player.id - 1) % 3];
  const toCall = currentBet - player.bet;

  if (toCall === 0) {
    if (score > 0.52 + (1 - aggr) * 0.25) {
      const amount = Math.min(player.chips, Math.max(bigBlind * 2, Math.floor(pot * 0.6)));
      return { action: 'raise', amount: player.bet + amount };
    }
    return { action: 'check' };
  }
  const potOdds = toCall / (pot + toCall);
  if (score > potOdds + 0.22 && aggr > 0.5 && player.chips > toCall * 2) {
    const raiseExtra = Math.floor(pot * 0.65);
    return { action: 'raise', amount: Math.min(player.chips + player.bet, currentBet + raiseExtra) };
  }
  if (score > potOdds - 0.06) return { action: 'call' };
  return { action: 'fold' };
}

// ─── Game Constants ────────────────────────────────────────────
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const NUM_PLAYERS = 4;
const STARTING_CHIPS = 1000;
const REBUY_OPTIONS = [200, 500, 1000];

function makePlayers() {
  return [
    { id: 0, name: 'You',         chips: STARTING_CHIPS, holeCards: [], bet: 0, folded: false, allIn: false, isAI: false },
    { id: 1, name: AI_NAMES[0],   chips: STARTING_CHIPS, holeCards: [], bet: 0, folded: false, allIn: false, isAI: true  },
    { id: 2, name: AI_NAMES[1],   chips: STARTING_CHIPS, holeCards: [], bet: 0, folded: false, allIn: false, isAI: true  },
    { id: 3, name: AI_NAMES[2],   chips: STARTING_CHIPS, holeCards: [], bet: 0, folded: false, allIn: false, isAI: true  },
  ];
}

// ─── Reducer ──────────────────────────────────────────────────
const INIT = {
  phase: 'lobby',
  players: [],
  deck: [],
  communityCards: [],
  pot: 0,
  currentBet: 0,
  minRaise: BIG_BLIND,
  activeIdx: 0,
  dealerIdx: 0,
  toAct: [],
  message: '',
  handResult: null,
  handNumber: 0,
};

function nextActive(players, fromIdx) {
  for (let i = 1; i <= NUM_PLAYERS; i++) {
    const idx = (fromIdx + i) % NUM_PLAYERS;
    if (!players[idx].folded && !players[idx].allIn) return idx;
  }
  return -1;
}

function buildToAct(players, startIdx, count) {
  const q = [];
  for (let i = 1; i <= count; i++) {
    const idx = (startIdx + i) % NUM_PLAYERS;
    if (!players[idx].folded && !players[idx].allIn) q.push(idx);
  }
  return q;
}

function reducer(state, action) {
  switch (action.type) {

    case 'START_HAND': {
      const { players, deck, dealerIdx, handNumber } = action;
      const sbIdx = (dealerIdx + 1) % NUM_PLAYERS;
      const bbIdx = (dealerIdx + 2) % NUM_PLAYERS;
      const utgIdx = (dealerIdx + 3) % NUM_PLAYERS;

      const postBlind = (ps, idx, amount) => ps.map((p, i) => {
        if (i !== idx) return p;
        const actual = Math.min(p.chips, amount);
        return { ...p, chips: p.chips - actual, bet: actual, allIn: p.chips <= amount };
      });

      let p = postBlind(players, sbIdx, SMALL_BLIND);
      p = postBlind(p, bbIdx, BIG_BLIND);
      const pot = p[sbIdx].bet + p[bbIdx].bet;
      const toAct = buildToAct(p, utgIdx - 1, NUM_PLAYERS);

      // FIX: UTG slot may be an eliminated (folded) player — use the first
      // actually-active seat instead so activeIdx never points at a dead player.
      const firstToAct = (!p[utgIdx].folded && !p[utgIdx].allIn)
        ? utgIdx
        : (toAct[0] ?? -1);

      return {
        ...state,
        phase: 'preflop',
        players: p,
        deck,
        communityCards: [],
        pot,
        currentBet: BIG_BLIND,
        minRaise: BIG_BLIND,
        activeIdx: firstToAct >= 0 ? firstToAct : utgIdx,
        dealerIdx,
        toAct: toAct.filter(i => i !== firstToAct),
        _roundDone: false,
        message: `Hand #${handNumber} — Blinds ${SMALL_BLIND}/${BIG_BLIND}`,
        handResult: null,
        handNumber,
      };
    }

    case 'PLAYER_ACTION': {
      const { action: act, amount } = action;
      const idx = state.activeIdx;
      let players = state.players.map(p => ({ ...p }));
      const player = players[idx];
      let pot = state.pot;
      let currentBet = state.currentBet;
      let minRaise = state.minRaise;
      let toAct = [...state.toAct];

      if (act === 'fold') {
        player.folded = true;
      } else if (act === 'check') {
        // nothing
      } else if (act === 'call') {
        const toCall = Math.min(currentBet - player.bet, player.chips);
        player.chips -= toCall;
        player.bet += toCall;
        pot += toCall;
        if (player.chips === 0) player.allIn = true;
      } else if (act === 'raise') {
        const newBet = Math.min(amount, player.chips + player.bet);
        const added = newBet - player.bet;
        player.chips -= added;
        pot += added;
        player.bet = newBet;
        if (player.chips === 0) player.allIn = true;
        const raisedBy = newBet - currentBet;
        minRaise = Math.max(BIG_BLIND, raisedBy);
        currentBet = newBet;
        toAct = players.filter(p => p.id !== idx && !p.folded && !p.allIn).map(p => p.id);
      }

      const nextToAct = toAct.filter(i => i !== idx);

      return {
        ...state,
        players,
        pot,
        currentBet,
        minRaise,
        toAct: nextToAct,
        _roundDone: nextToAct.length === 0,
        _nextActIdx: nextToAct[0] ?? -1,
        activeIdx: nextToAct.length > 0 ? nextToAct[0] : state.activeIdx,
      };
    }

    case 'DEAL_FLOP': {
      const [c1, c2, c3, ...rest] = state.deck;
      const players = state.players.map(p => ({ ...p, bet: 0 }));
      const firstAct = nextActive(players, state.dealerIdx);
      // If no one can act (all allIn / only 1 left), mark round done immediately
      return {
        ...state, phase: 'flop', communityCards: [c1, c2, c3], deck: rest, players,
        currentBet: 0, minRaise: BIG_BLIND,
        activeIdx: firstAct >= 0 ? firstAct : state.activeIdx,
        toAct: buildToAct(players, state.dealerIdx, NUM_PLAYERS).filter(i => i !== firstAct),
        message: 'Flop', _roundDone: firstAct < 0,
      };
    }

    case 'DEAL_TURN': {
      const [card, ...rest] = state.deck;
      const players = state.players.map(p => ({ ...p, bet: 0 }));
      const firstAct = nextActive(players, state.dealerIdx);
      return {
        ...state, phase: 'turn', communityCards: [...state.communityCards, card], deck: rest, players,
        currentBet: 0, minRaise: BIG_BLIND,
        activeIdx: firstAct >= 0 ? firstAct : state.activeIdx,
        toAct: buildToAct(players, state.dealerIdx, NUM_PLAYERS).filter(i => i !== firstAct),
        message: 'Turn', _roundDone: firstAct < 0,
      };
    }

    case 'DEAL_RIVER': {
      const [card, ...rest] = state.deck;
      const players = state.players.map(p => ({ ...p, bet: 0 }));
      const firstAct = nextActive(players, state.dealerIdx);
      return {
        ...state, phase: 'river', communityCards: [...state.communityCards, card], deck: rest, players,
        currentBet: 0, minRaise: BIG_BLIND,
        activeIdx: firstAct >= 0 ? firstAct : state.activeIdx,
        toAct: buildToAct(players, state.dealerIdx, NUM_PLAYERS).filter(i => i !== firstAct),
        message: 'River', _roundDone: firstAct < 0,
      };
    }

    case 'SHOWDOWN': {
      const { winners, handName } = action;
      const share = Math.floor(state.pot / winners.length);
      const players = state.players.map(p => winners.includes(p.id) ? { ...p, chips: p.chips + share } : p);
      const names = winners.map(id => state.players[id].name).join(' & ');
      return {
        ...state, phase: 'showdown', players,
        handResult: { winners, handName, pot: state.pot },
        message: `${names} wins ${state.pot} with ${handName}!`,
        _roundDone: false,
      };
    }

    case 'EARLY_WIN': {
      const { winnerId } = action;
      const players = state.players.map(p => p.id === winnerId ? { ...p, chips: p.chips + state.pot } : p);
      return {
        ...state, phase: 'showdown', players,
        handResult: { winners: [winnerId], handName: 'Everyone else folded', pot: state.pot },
        message: `${state.players[winnerId].name} wins ${state.pot}!`,
        _roundDone: false,
      };
    }

    case 'REBUY': {
      const players = state.players.map(p =>
        p.id === 0 ? { ...p, chips: action.amount, folded: false, allIn: false } : p
      );
      return { ...state, players };
    }

    default:
      return state;
  }
}

// ─── UFC Hand Effects ────────────────────────────────────────
const HAND_EFFECTS = {
  'Three of a Kind': { title: 'TRIPLE THREAT!',    emoji: '🥊', particles: ['🥊','🥊','🥊','💥','🥊'], bg: 'from-orange-600 via-red-700 to-red-900',         glow: '#ff4500' },
  'Straight':        { title: 'LIGHTNING COMBO!',  emoji: '⚡', particles: ['⚡','⚡','⚡','🔥','⚡'], bg: 'from-yellow-400 via-yellow-600 to-orange-700',    glow: '#ffd700' },
  'Flush':           { title: 'OCTAGON FLUSH!',    emoji: '🏟️', particles: ['🏟️','⚡','🥊','⚡','🏟️'], bg: 'from-blue-500 via-cyan-600 to-blue-900',         glow: '#00bfff' },
  'Full House':      { title: 'FULL HOUSE KO!',    emoji: '🔥', particles: ['🔥','🔥','💥','🔥','💥'], bg: 'from-red-500 via-orange-500 to-yellow-600',      glow: '#ff6600' },
  'Four of a Kind':  { title: 'QUAD KNOCKOUT!',    emoji: '💥', particles: ['💥','⭐','💥','⭐','💥'], bg: 'from-purple-600 via-pink-600 to-red-700',        glow: '#9900ff' },
  'Straight Flush':  { title: 'SUBMISSION!',       emoji: '🦅', particles: ['🦅','💎','⚡','💎','🦅'], bg: 'from-green-500 via-teal-600 to-emerald-900',     glow: '#00ff88' },
  'Royal Flush':     { title: 'UFC CHAMPION!',     emoji: '👑', particles: ['👑','🏆','⭐','🏆','👑'], bg: 'from-yellow-400 via-amber-500 to-red-700',       glow: '#ffd700' },
};

function Particle({ emoji, delay }) {
  const startX = Math.random() * 100;
  return (
    <motion.div className="absolute text-2xl pointer-events-none select-none"
      style={{ left: `${startX}%`, bottom: '10%' }}
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -280, opacity: 0, scale: 1.4, x: (Math.random() - 0.5) * 180 }}
      transition={{ duration: 1.6, delay, ease: 'easeOut' }}>
      {emoji}
    </motion.div>
  );
}

function HandCelebration({ handName, humanWon, onDone }) {
  const effect = HAND_EFFECTS[handName];
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  if (!effect) return null;
  return (
    <motion.div className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <motion.div className={`absolute inset-0 bg-gradient-to-b ${effect.bg}`}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 0.82, 0.55] }} transition={{ duration: 0.4 }} />
      {effect.particles.map((p, i) => <Particle key={i} emoji={p} delay={i * 0.1} />)}
      <motion.div className="relative text-center px-6"
        initial={{ scale: 0, rotate: -10 }} animate={{ scale: [0, 1.25, 1], rotate: [-10, 4, 0] }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 280 }}>
        <div className="text-6xl mb-2">{effect.emoji}</div>
        <div className="text-3xl sm:text-4xl font-black text-white tracking-wider uppercase"
          style={{ textShadow: `0 0 25px ${effect.glow}, 0 0 50px ${effect.glow}` }}>
          {effect.title}
        </div>
        <div className="text-lg font-bold text-white/80 mt-1">{handName}</div>
        {humanWon && (
          <motion.div className="mt-3 text-2xl font-black text-yellow-300"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ textShadow: '0 0 18px #ffd700' }}>
            🏆 YOU WIN!
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Card Component ────────────────────────────────────────────
const CARD_SIZES = {
  ai:        { w: 34,  h: 48,  rankSize: 11, suitSize: 13 },
  community: { w: 50,  h: 72,  rankSize: 15, suitSize: 19 },
  human:     { w: 62,  h: 88,  rankSize: 19, suitSize: 25 },
};

function Card({ card, hidden = false, size = 'community' }) {
  const s = CARD_SIZES[size] || CARD_SIZES.community;
  if (hidden) return (
    <motion.div className="rounded-lg border-2 border-red-600 flex items-center justify-center shadow-md bg-gradient-to-br from-red-900 to-red-800 select-none flex-shrink-0"
      style={{ width: s.w, height: s.h }}
      initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.28 }}>
      <span style={{ fontSize: s.suitSize - 2 }}>🥊</span>
    </motion.div>
  );
  const red = isRed(card.suit);
  return (
    <motion.div className="rounded-lg border-2 border-gray-300 bg-white shadow-md flex flex-col items-center justify-center select-none flex-shrink-0"
      style={{ width: s.w, height: s.h }}
      initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.28 }}>
      <span className={`font-black leading-none ${red ? 'text-red-600' : 'text-gray-900'}`} style={{ fontSize: s.rankSize }}>{rankLabel(card.rank)}</span>
      <span className={`leading-none ${red ? 'text-red-600' : 'text-gray-900'}`} style={{ fontSize: s.suitSize }}>{SUIT_SYM[card.suit]}</span>
    </motion.div>
  );
}

// ─── Compact AI Seat ───────────────────────────────────────────
function AISeat({ player, isActive, isDealer, isSB, isBB, showCards, communityCards }) {
  const hand = showCards && player.holeCards.length === 2 && communityCards?.length >= 3
    ? bestHand(player.holeCards, communityCards) : null;

  return (
    <div className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl flex-1 min-w-0 transition-all
      ${isActive && !player.folded && !player.allIn ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}
      ${player.folded ? 'opacity-40' : ''}`}>
      <div className="flex gap-0.5 flex-wrap justify-center min-h-[16px]">
        {isDealer && <span className="bg-white text-gray-900 font-black px-1 rounded leading-tight" style={{fontSize:9}}>D</span>}
        {isSB && <span className="bg-blue-600 text-white font-black px-1 rounded leading-tight" style={{fontSize:9}}>SB</span>}
        {isBB && <span className="bg-red-600 text-white font-black px-1 rounded leading-tight" style={{fontSize:9}}>BB</span>}
        {player.allIn && <span className="bg-yellow-500 text-gray-900 font-black px-1 rounded leading-tight" style={{fontSize:9}}>AI</span>}
      </div>
      <div className="flex gap-0.5">
        {player.holeCards.length === 2 ? (
          player.folded ? <span className="text-gray-600" style={{fontSize:10}}>—</span> :
          showCards ? <><Card card={player.holeCards[0]} size="ai"/><Card card={player.holeCards[1]} size="ai"/></> :
          <><Card hidden size="ai"/><Card hidden size="ai"/></>
        ) : <div style={{ width: 72, height: 48 }} />}
      </div>
      <div className={`font-bold truncate ${player.folded ? 'text-gray-500' : 'text-white'}`}
        style={{ fontSize: 9, maxWidth: 88 }}>{player.name}</div>
      <div className="text-yellow-400 font-semibold" style={{fontSize:9}}>🥊{player.chips}</div>
      {player.bet > 0 && !player.folded && (
        <div className="bg-black/60 rounded-full px-1.5 flex items-center gap-0.5" style={{fontSize:8}}>
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-yellow-300 font-bold">{player.bet}</span>
        </div>
      )}
      {hand && hand.rank >= 0 && <div className="text-green-300 font-semibold text-center" style={{fontSize:8}}>{hand.name}</div>}
      {isActive && !player.folded && !player.allIn && (
        <motion.div style={{fontSize:8}} className="text-yellow-400 font-bold"
          animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 0.8 }}>●●●</motion.div>
      )}
    </div>
  );
}

// ─── Human Seat ────────────────────────────────────────────────
function HumanSeat({ player, isDealer, isSB, isBB, communityCards }) {
  const hand = player.holeCards.length === 2 && communityCards?.length >= 3
    ? bestHand(player.holeCards, communityCards) : null;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {isDealer && <span className="bg-white text-gray-900 text-xs font-black px-1.5 py-0.5 rounded">D</span>}
        {isSB && <span className="bg-blue-600 text-white text-xs font-black px-1.5 py-0.5 rounded">SB</span>}
        {isBB && <span className="bg-red-600 text-white text-xs font-black px-1.5 py-0.5 rounded">BB</span>}
        <span className="bg-yellow-500 text-gray-900 text-sm font-black px-2 py-0.5 rounded-full">You</span>
        {player.allIn && <span className="bg-orange-500 text-white text-xs font-black px-1.5 py-0.5 rounded animate-pulse">ALL-IN</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600" />
          <span className="text-yellow-300 font-bold text-sm">{player.chips.toLocaleString()}</span>
        </div>
        {player.bet > 0 && !player.folded && (
          <div className="bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-300 text-xs font-bold">Bet:{player.bet}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-center">
        {player.holeCards.length === 2 && (player.folded
          ? <span className="text-gray-500 text-sm italic">Folded</span>
          : <><Card card={player.holeCards[0]} size="human"/><Card card={player.holeCards[1]} size="human"/></>
        )}
      </div>
      {hand && hand.rank >= 0 && (
        <motion.div className="bg-green-900/70 text-green-300 text-xs font-bold px-2 py-0.5 rounded"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{hand.name}</motion.div>
      )}
    </div>
  );
}

// ─── Rebuy Modal ───────────────────────────────────────────────
function RebuyModal({ fanCoins, rebuyInput, setRebuyInput, onRebuy, onLeave, loading }) {
  return (
    <motion.div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm border border-red-700"
        initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}>
        <div className="text-center mb-3">
          <div className="text-5xl mb-1">💀</div>
          <h2 className="text-lg font-black text-white">OUT OF CHIPS!</h2>
          <p className="text-gray-400 text-xs mt-0.5">Use Fan Coins to buy back in</p>
        </div>
        <div className="bg-gray-700 rounded-xl p-2.5 mb-3 flex items-center justify-between">
          <span className="text-gray-400 text-xs">Fan Coin Balance</span>
          <span className="text-yellow-400 font-bold text-lg">🥊{fanCoins.toLocaleString()}</span>
        </div>
        {fanCoins >= BIG_BLIND * 2 ? (
          <>
            <p className="text-gray-300 text-xs mb-2 text-center">1 Fan Coin = 1 chip</p>
            <div className="flex gap-1.5 mb-2">
              {REBUY_OPTIONS.filter(v => v <= fanCoins).map(v => (
                <button key={v} onClick={() => setRebuyInput(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${rebuyInput === v ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
                  {v}
                </button>
              ))}
            </div>
            <input type="range" min={BIG_BLIND * 2} max={fanCoins}
              value={Math.min(rebuyInput, fanCoins)}
              onChange={e => setRebuyInput(+e.target.value)}
              className="w-full accent-red-500 mb-1.5" />
            <p className="text-yellow-400 text-center font-bold text-sm mb-3">
              🥊{Math.min(rebuyInput, fanCoins)} coins → {Math.min(rebuyInput, fanCoins)} chips
            </p>
            <button onClick={() => onRebuy(Math.min(rebuyInput, fanCoins))} disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-900 transition-all mb-2 text-sm disabled:opacity-50">
              {loading ? 'Processing…' : `Rebuy ${Math.min(rebuyInput, fanCoins)} chips`}
            </button>
          </>
        ) : (
          <p className="text-red-400 text-center text-sm font-semibold mb-3">Not enough Fan Coins to rebuy</p>
        )}
        <button onClick={onLeave}
          className="w-full py-2 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-colors text-xs">
          Leave Table
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function PokerGame() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [fanCoins, setFanCoins]         = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [isBusted, setIsBusted]         = useState(false);
  const [fanCoinsSpent, setFanCoinsSpent] = useState(0);
  const [showRebuy, setShowRebuy]       = useState(false);
  const [rebuyInput, setRebuyInput]     = useState(500);
  const [syncing, setSyncing]           = useState(false);
  const [rebuyLoading, setRebuyLoading] = useState(false);
  const [celebration, setCelebration]   = useState(null);

  const [game, dispatch] = useReducer(reducer, INIT);
  const [raiseAmt, setRaiseAmt]   = useState(0);
  const [showRaise, setShowRaise] = useState(false);

  const aiTimer    = useRef(null);
  const phaseTimer = useRef(null);

  // ── Load poker status (balance + server-persisted bust flag) ──
  useEffect(() => {
    if (!currentUser) { setLoadingCoins(false); return; }
    currentUser.getIdToken().then(token =>
      axios.get(`${API_URL}/fancoins/poker-status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setFanCoins(res.data.fanCoin ?? 0);
          setIsBusted(!!res.data.busted);
          if (res.data.busted) setShowRebuy(true);
          setLoadingCoins(false);
        }).catch(() => setLoadingCoins(false))
    );
  }, [currentUser]);

  // ── Next-hand helper ──
  const startNextHand = useCallback((currentPlayers, dealerIdx, handNumber) => {
    const deck = newShuffledDeck();
    let di = 0;
    const nextDealer = (dealerIdx + 1) % NUM_PLAYERS;
    const players = currentPlayers.map(p => ({
      ...p, holeCards: [deck[di++], deck[di++]], bet: 0, folded: p.chips <= 0, allIn: false,
    }));
    dispatch({ type: 'START_HAND', players, deck: deck.slice(di), dealerIdx: nextDealer, handNumber: handNumber + 1 });
  }, []);

  // ── Betting-round end → advance phase ──
  useEffect(() => {
    if (!game._roundDone) return;
    clearTimeout(phaseTimer.current);
    const active = game.players.filter(p => !p.folded);
    if (active.length === 1) {
      phaseTimer.current = setTimeout(() => dispatch({ type: 'EARLY_WIN', winnerId: active[0].id }), 200);
      return;
    }
    phaseTimer.current = setTimeout(() => {
      if (game.phase === 'preflop') dispatch({ type: 'DEAL_FLOP' });
      else if (game.phase === 'flop') dispatch({ type: 'DEAL_TURN' });
      else if (game.phase === 'turn') dispatch({ type: 'DEAL_RIVER' });
      else if (game.phase === 'river') {
        const alive = game.players.filter(p => !p.folded);
        let best = null; let winners = [];
        for (const p of alive) {
          const h = bestHand(p.holeCards, game.communityCards);
          if (!best || h.rank > best.rank || (h.rank === best.rank && cmpTie(h.tie, best.tie) > 0)) { best = h; winners = [p.id]; }
          else if (h.rank === best.rank && cmpTie(h.tie, best.tie) === 0) winners.push(p.id);
        }
        dispatch({ type: 'SHOWDOWN', winners, handName: best?.name ?? '' });
      }
    }, 350);
    return () => clearTimeout(phaseTimer.current);
  }, [game._roundDone, game.phase]);

  // ── Showdown → persist bust / auto-next hand ──
  useEffect(() => {
    if (game.phase !== 'showdown') return;
    clearTimeout(phaseTimer.current);
    phaseTimer.current = setTimeout(async () => {
      const humanChips = game.players[0]?.chips ?? 0;
      if (humanChips === 0) {
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            await axios.post(`${API_URL}/fancoins/poker-bust`, {}, { headers: { Authorization: `Bearer ${token}` } });
          } catch (e) { /* non-critical */ }
        }
        setIsBusted(true);
        setShowRebuy(true);
        return;
      }
      if (game.players.slice(1).every(p => p.chips <= 0)) return; // all AI busted
      startNextHand(game.players, game.dealerIdx, game.handNumber);
    }, 2600);
    return () => clearTimeout(phaseTimer.current);
  }, [game.phase, game.players, game.dealerIdx, game.handNumber, startNextHand, currentUser]);

  // ── AI turns ──
  useEffect(() => {
    if (!['preflop','flop','turn','river'].includes(game.phase)) return;
    const player = game.players[game.activeIdx];

    // Safety net: if the active seat is a dead player (folded / eliminated / allIn)
    // dispatch a fold so PLAYER_ACTION advances activeIdx to toAct[0].
    // This self-heals any edge case where activeIdx ends up pointing at a dead seat.
    if (!player || player.folded || player.allIn) {
      clearTimeout(aiTimer.current);
      aiTimer.current = setTimeout(() => {
        dispatch({ type: 'PLAYER_ACTION', action: 'fold' });
      }, 50);
      return () => clearTimeout(aiTimer.current);
    }

    if (!player.isAI) return;
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => {
      const d = aiDecide(player, { currentBet: game.currentBet, pot: game.pot, communityCards: game.communityCards, bigBlind: BIG_BLIND });
      dispatch({ type: 'PLAYER_ACTION', action: d.action, amount: d.amount });
    }, 550 + Math.random() * 650);
    return () => clearTimeout(aiTimer.current);
  }, [game.activeIdx, game.phase]);

  // ── Celebration trigger ──
  useEffect(() => {
    if (game.phase !== 'showdown' || !game.handResult) return;
    const { winners, handName } = game.handResult;
    if (HAND_EFFECTS[handName]) setCelebration({ handName, humanWon: winners.includes(0) });
  }, [game.phase, game.handResult]);

  // ── Start game ──
  function startGame() {
    const deck = newShuffledDeck();
    let di = 0;
    const players = makePlayers().map(p => ({ ...p, holeCards: [deck[di++], deck[di++]] }));
    dispatch({ type: 'START_HAND', players, deck: deck.slice(di), dealerIdx: 0, handNumber: 1 });
  }

  // ── Rebuy (server deducts coins + clears bust) ──
  async function handleRebuy(amount) {
    if (!currentUser || amount <= 0 || amount > fanCoins) return;
    setRebuyLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.post(`${API_URL}/fancoins/poker-rebuy`, { amount }, { headers: { Authorization: `Bearer ${token}` } });
      setFanCoins(res.data.fanCoin);
      setFanCoinsSpent(prev => prev + amount);
      setIsBusted(false);
      setShowRebuy(false);
      dispatch({ type: 'REBUY', amount });
      const updatedPlayers = game.players.map(p => p.id === 0 ? { ...p, chips: amount, folded: false, allIn: false } : p);
      setTimeout(() => startNextHand(updatedPlayers, game.dealerIdx, game.handNumber), 300);
    } catch (e) {
      alert(e.response?.data?.message || 'Rebuy failed — please try again.');
    }
    setRebuyLoading(false);
  }

  // ── Cash out ──
  async function cashOut() {
    if (!currentUser) { navigate('/game'); return; }
    const humanChips = game.players[0]?.chips ?? 0;
    // Positive winnings above starting stack (rebuys already deducted server-side)
    const delta = Math.max(0, humanChips - STARTING_CHIPS);
    if (delta > 0) {
      setSyncing(true);
      try {
        const token = await currentUser.getIdToken();
        await axios.post(`${API_URL}/fancoins/poker-result`, { coinDelta: delta }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (e) { /* non-critical */ }
      setSyncing(false);
    }
    navigate('/game');
  }

  function doAction(act, amount) {
    setShowRaise(false);
    dispatch({ type: 'PLAYER_ACTION', action: act, amount });
  }

  // ── Derived ──
  const human          = game.players[0];
  const isMyTurn       = game.activeIdx === 0 && ['preflop','flop','turn','river'].includes(game.phase);
  const toCall         = human ? Math.max(0, game.currentBet - (human.bet || 0)) : 0;
  const canCheck       = toCall === 0;
  const minRaiseTotal  = game.currentBet + game.minRaise;
  const sessionNet     = human ? Math.max(0, human.chips - STARTING_CHIPS) - fanCoinsSpent : -fanCoinsSpent;
  const sbIdx          = game.players.length ? (game.dealerIdx + 1) % NUM_PLAYERS : -1;
  const bbIdx          = game.players.length ? (game.dealerIdx + 2) % NUM_PLAYERS : -1;
  const inBettingPhase = ['preflop','flop','turn','river'].includes(game.phase);
  const showdownPhase  = game.phase === 'showdown';
  const PHASE_LABELS   = { preflop: 'PRE-FLOP', flop: 'FLOP', turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN' };

  // ── Lobby ──
  if (game.phase === 'lobby') {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-5 max-w-sm w-full border border-gray-700">
          <div className="text-center mb-4">
            <div className="text-5xl mb-1">🃏</div>
            <h1 className="text-2xl font-black text-white tracking-widest">UFC POKER</h1>
            <p className="text-gray-400 text-xs mt-0.5">Texas Hold'em · Fan Coins</p>
          </div>
          {!currentUser ? (
            <div className="text-center">
              <p className="text-yellow-400 mb-3 text-sm">Sign in to play</p>
              <button onClick={() => navigate('/')} className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 text-sm">Sign In</button>
            </div>
          ) : loadingCoins ? (
            <p className="text-gray-400 text-center text-sm animate-pulse">Loading…</p>
          ) : (
            <>
              <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-3 mb-3 text-center border border-green-600">
                <p className="text-green-200 text-xs font-semibold">Every player starts with</p>
                <p className="text-3xl font-black text-white">1,000 FREE chips</p>
                <p className="text-green-300 text-xs">No Fan Coins needed to start</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-2.5 mb-3 flex items-center justify-between">
                <span className="text-gray-400 text-xs">Fan Coins (rebuys)</span>
                <span className="text-yellow-400 font-bold">🥊 {fanCoins.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-4 text-xs text-gray-400 bg-gray-700/40 rounded-xl p-2">
                <span>🃏 4 players</span><span>⚡ Texas Hold'em</span>
                <span>🪙 SB{SMALL_BLIND}/BB{BIG_BLIND}</span><span>💸 Rebuy=Fan Coins</span>
              </div>
              {isBusted ? (
                <div className="text-center">
                  <p className="text-red-400 text-sm font-semibold mb-2">You ran out of chips.<br/>Rebuy to continue.</p>
                  <button onClick={() => setShowRebuy(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white font-black rounded-xl text-base hover:from-red-700 hover:to-red-900">
                    REBUY WITH FAN COINS
                  </button>
                </div>
              ) : (
                <motion.button onClick={startGame} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-black rounded-xl text-lg hover:from-red-700 hover:to-red-900 shadow-lg">
                  DEAL CARDS — FREE!
                </motion.button>
              )}
            </>
          )}
        </div>
        <AnimatePresence>
          {showRebuy && (
            <RebuyModal fanCoins={fanCoins} rebuyInput={rebuyInput} setRebuyInput={setRebuyInput}
              onRebuy={handleRebuy} onLeave={() => { setShowRebuy(false); navigate('/game'); }} loading={rebuyLoading} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Game Table — fixed inset-0 so it fills the full viewport regardless of app padding ──
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a5c2a 0%, #0c3016 55%, #06180a 100%)' }}>

      <AnimatePresence>
        {celebration && <HandCelebration handName={celebration.handName} humanWon={celebration.humanWon} onDone={() => setCelebration(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRebuy && <RebuyModal fanCoins={fanCoins} rebuyInput={rebuyInput} setRebuyInput={setRebuyInput}
          onRebuy={handleRebuy} onLeave={cashOut} loading={rebuyLoading} />}
      </AnimatePresence>

      {/* ── Header (compact) ── */}
      <div className="flex items-center justify-between px-3 py-1 bg-black/60 border-b border-white/10 flex-shrink-0">
        <button onClick={cashOut} disabled={syncing}
          className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors">
          {syncing ? '…' : '← Exit'}
        </button>
        <div className="text-center leading-none">
          <div className="text-white font-black text-xs tracking-widest">🥊 UFC POKER</div>
          <div className="text-gray-400" style={{fontSize:9}}>
            Hand #{game.handNumber} · <span className="text-green-300 font-bold">{PHASE_LABELS[game.phase] ?? game.phase.toUpperCase()}</span>
            {' '}· SB{SMALL_BLIND}/BB{BIG_BLIND}
          </div>
        </div>
        <div className="text-right leading-none">
          <div className={`text-xs font-bold ${sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionNet >= 0 ? '+' : ''}{sessionNet}🥊
          </div>
          <div className="text-gray-500" style={{fontSize:9}}>bal:{fanCoins}</div>
        </div>
      </div>

      {/* ── AI Row (compact, fixed height) ── */}
      <div className="flex justify-around items-stretch px-1 pt-1 pb-0.5 flex-shrink-0 bg-black/30">
        {[1,2,3].map(idx => (
          <AISeat key={idx} player={game.players[idx]}
            isActive={game.activeIdx === idx} isDealer={game.dealerIdx === idx}
            isSB={sbIdx === idx} isBB={bbIdx === idx}
            showCards={showdownPhase} communityCards={game.communityCards} />
        ))}
      </div>

      {/* ── Center: community cards + pot (flex-1, fills remaining space) ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-2 min-h-0">
        <motion.div key={game.pot} className="bg-black/60 rounded-full px-3 py-1 border border-yellow-700/40"
          initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
          <span className="text-yellow-300 font-black text-sm">POT 🥊{game.pot.toLocaleString()}</span>
        </motion.div>

        <div className="flex gap-1 sm:gap-1.5 justify-center flex-wrap">
          <AnimatePresence>
            {[0,1,2,3,4].map(i => (
              game.communityCards[i] ? (
                <motion.div key={`cc-${i}-${game.handNumber}`}
                  initial={{ rotateY: 90, opacity: 0, y: -8 }}
                  animate={{ rotateY: 0, opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}>
                  <Card card={game.communityCards[i]} size="community" />
                </motion.div>
              ) : (
                <div key={`empty-${i}`}
                  className="rounded-lg border-2 border-dashed border-green-800/40 opacity-25 flex-shrink-0"
                  style={{ width: CARD_SIZES.community.w, height: CARD_SIZES.community.h }} />
              )
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {game.message && (
            <motion.div key={game.message}
              className="bg-black/70 text-yellow-200 font-semibold px-3 py-1 rounded-full text-center max-w-xs"
              style={{fontSize:11}}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {game.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Human zone (fixed at bottom) ── */}
      <div className="flex-shrink-0 pb-1.5 pt-1 px-2 bg-black/30 border-t border-white/10">
        <div className="flex flex-col items-center gap-1">
          <HumanSeat player={game.players[0]} isDealer={game.dealerIdx === 0}
            isSB={sbIdx === 0} isBB={bbIdx === 0} communityCards={game.communityCards} />

          {/* Action buttons */}
          {isMyTurn && !human?.folded && !human?.allIn && (
            <motion.div className="flex flex-col items-center gap-1 w-full max-w-sm"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex gap-1.5 w-full">
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('fold')}
                  className="flex-1 py-2 bg-gray-800 text-red-400 font-black rounded-xl border border-red-900 hover:bg-red-950 text-xs transition-colors">FOLD</motion.button>
                {canCheck
                  ? <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('check')}
                      className="flex-1 py-2 bg-green-800 text-white font-black rounded-xl hover:bg-green-700 text-xs transition-colors">CHECK</motion.button>
                  : <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('call')}
                      className="flex-1 py-2 bg-blue-700 text-white font-black rounded-xl hover:bg-blue-600 text-xs transition-colors">CALL {toCall}</motion.button>
                }
                {human.chips > toCall && (
                  <motion.button whileTap={{ scale: 0.93 }}
                    onClick={() => { setRaiseAmt(Math.min(minRaiseTotal, human.chips + human.bet)); setShowRaise(r => !r); }}
                    className="flex-1 py-2 bg-yellow-600 text-white font-black rounded-xl hover:bg-yellow-500 text-xs transition-colors">RAISE</motion.button>
                )}
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('raise', human.chips + human.bet)}
                  className="flex-1 py-2 bg-red-700 text-white font-black rounded-xl hover:bg-red-600 transition-colors leading-tight"
                  style={{fontSize:10}}>ALL-IN<br/>{human.chips}</motion.button>
              </div>
              <AnimatePresence>
                {showRaise && (
                  <motion.div className="bg-gray-900 rounded-xl p-2 w-full border border-yellow-600"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p className="text-yellow-300 text-xs font-bold text-center mb-1">Raise to: 🥊{raiseAmt}</p>
                    <input type="range" min={minRaiseTotal} max={human.chips + human.bet} value={raiseAmt}
                      onChange={e => setRaiseAmt(+e.target.value)} className="w-full accent-yellow-500 mb-1" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => doAction('raise', raiseAmt)}
                      className="w-full py-1.5 bg-yellow-600 text-white font-black rounded-lg hover:bg-yellow-500 text-xs">
                      CONFIRM RAISE TO {raiseAmt}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {isMyTurn && human?.allIn && <p className="text-yellow-400 font-black tracking-widest animate-pulse" style={{fontSize:11}}>★ ALL-IN ★</p>}
          {!isMyTurn && inBettingPhase && !human?.folded && <p className="text-gray-500" style={{fontSize:10}}>Waiting for {game.players[game.activeIdx]?.name}…</p>}
          {human?.folded && inBettingPhase && <p className="text-gray-600 italic" style={{fontSize:10}}>You folded this hand</p>}
        </div>
      </div>

      {/* ── Hand result toast ── */}
      <AnimatePresence>
        {game.handResult && !celebration && (
          <motion.div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/90 border-2 border-yellow-500 rounded-xl px-4 py-2 text-center shadow-2xl z-20 pointer-events-none"
            initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="text-xl">{game.handResult.winners.includes(0) ? '🏆' : '💀'}</div>
            <p className="text-yellow-300 font-black text-sm">
              {game.handResult.winners.includes(0) ? 'YOU WIN!' : `${game.players[game.handResult.winners[0]]?.name} wins!`}
            </p>
            {game.handResult.handName && <p className="text-gray-400" style={{fontSize:10}}>{game.handResult.handName}</p>}
            <p className="text-yellow-400 font-bold text-sm">🥊{game.handResult.pot.toLocaleString()}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
