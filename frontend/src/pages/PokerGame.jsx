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
  phase: 'lobby',          // lobby | preflop | flop | turn | river | showdown
  players: [],
  deck: [],
  communityCards: [],
  pot: 0,
  currentBet: 0,
  minRaise: BIG_BLIND,
  activeIdx: 0,
  dealerIdx: 0,
  toAct: [],               // queue of player indices still to act this round
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

      // UTG acts first; BB gets option last (included in toAct)
      const toAct = buildToAct(p, utgIdx - 1, NUM_PLAYERS);

      return {
        ...state,
        phase: 'preflop',
        players: p,
        deck,
        communityCards: [],
        pot,
        currentBet: BIG_BLIND,
        minRaise: BIG_BLIND,
        activeIdx: utgIdx,
        dealerIdx,
        toAct: toAct.filter(i => i !== utgIdx),
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
        // amount = total bet target (includes what player already bet)
        const newBet = Math.min(amount, player.chips + player.bet);
        const added = newBet - player.bet;
        player.chips -= added;
        pot += added;
        player.bet = newBet;
        if (player.chips === 0) player.allIn = true;
        const raisedBy = newBet - currentBet;
        minRaise = Math.max(BIG_BLIND, raisedBy);
        currentBet = newBet;
        // everyone else needs to act again
        toAct = players
          .filter(p => p.id !== idx && !p.folded && !p.allIn)
          .map(p => p.id);
      }

      const nextToAct = toAct.filter(i => i !== idx);

      return {
        ...state,
        players,
        pot,
        currentBet,
        minRaise,
        toAct: nextToAct,
        // Signal round complete if queue empty
        _roundDone: nextToAct.length === 0,
        _nextActIdx: nextToAct[0] ?? -1,
        activeIdx: nextToAct.length > 0 ? nextToAct[0] : state.activeIdx,
      };
    }

    case 'DEAL_FLOP': {
      const [c1, c2, c3, ...rest] = state.deck;
      const players = state.players.map(p => ({ ...p, bet: 0 }));
      const firstAct = nextActive(players, state.dealerIdx);
      return {
        ...state,
        phase: 'flop',
        communityCards: [c1, c2, c3],
        deck: rest,
        players,
        pot: state.pot,
        currentBet: 0,
        minRaise: BIG_BLIND,
        activeIdx: firstAct,
        toAct: buildToAct(players, state.dealerIdx, NUM_PLAYERS).filter(i => i !== firstAct),
        message: 'Flop',
        _roundDone: false,
      };
    }

    case 'DEAL_TURN': {
      const [card, ...rest] = state.deck;
      const players = state.players.map(p => ({ ...p, bet: 0 }));
      const firstAct = nextActive(players, state.dealerIdx);
      return {
        ...state,
        phase: 'turn',
        communityCards: [...state.communityCards, card],
        deck: rest,
        players,
        currentBet: 0,
        minRaise: BIG_BLIND,
        activeIdx: firstAct,
        toAct: buildToAct(players, state.dealerIdx, NUM_PLAYERS).filter(i => i !== firstAct),
        message: 'Turn',
        _roundDone: false,
      };
    }

    case 'DEAL_RIVER': {
      const [card, ...rest] = state.deck;
      const players = state.players.map(p => ({ ...p, bet: 0 }));
      const firstAct = nextActive(players, state.dealerIdx);
      return {
        ...state,
        phase: 'river',
        communityCards: [...state.communityCards, card],
        deck: rest,
        players,
        currentBet: 0,
        minRaise: BIG_BLIND,
        activeIdx: firstAct,
        toAct: buildToAct(players, state.dealerIdx, NUM_PLAYERS).filter(i => i !== firstAct),
        message: 'River',
        _roundDone: false,
      };
    }

    case 'SHOWDOWN': {
      const { winners, handName } = action;
      const share = Math.floor(state.pot / winners.length);
      const players = state.players.map(p =>
        winners.includes(p.id) ? { ...p, chips: p.chips + share } : p
      );
      const names = winners.map(id => state.players[id].name).join(' & ');
      return {
        ...state,
        phase: 'showdown',
        players,
        handResult: { winners, handName, pot: state.pot },
        message: `${names} wins ${state.pot} coins with ${handName}!`,
        _roundDone: false,
      };
    }

    case 'EARLY_WIN': {
      const { winnerId } = action;
      const players = state.players.map(p =>
        p.id === winnerId ? { ...p, chips: p.chips + state.pot } : p
      );
      return {
        ...state,
        phase: 'showdown',
        players,
        handResult: { winners: [winnerId], handName: 'Everyone else folded', pot: state.pot },
        message: `${state.players[winnerId].name} wins ${state.pot} coins!`,
        _roundDone: false,
      };
    }

    case 'REBUY': {
      const players = state.players.map(p =>
        p.id === 0 ? { ...p, chips: p.chips + action.amount, folded: false, allIn: false } : p
      );
      return { ...state, players };
    }

    default:
      return state;
  }
}

// ─── UFC Hand Effects ────────────────────────────────────────
const HAND_EFFECTS = {
  'Three of a Kind': {
    title: 'TRIPLE THREAT!',
    sub: 'Three of a Kind',
    emoji: '🥊',
    particles: ['🥊','🥊','🥊','💥','🥊'],
    bg: 'from-orange-600 via-red-700 to-red-900',
    glow: '#ff4500',
  },
  'Straight': {
    title: 'LIGHTNING COMBO!',
    sub: 'Straight',
    emoji: '⚡',
    particles: ['⚡','⚡','⚡','🔥','⚡'],
    bg: 'from-yellow-400 via-yellow-600 to-orange-700',
    glow: '#ffd700',
  },
  'Flush': {
    title: 'OCTAGON FLUSH!',
    sub: 'Flush',
    emoji: '🏟️',
    particles: ['🏟️','⚡','🥊','⚡','🏟️'],
    bg: 'from-blue-500 via-cyan-600 to-blue-900',
    glow: '#00bfff',
  },
  'Full House': {
    title: 'FULL HOUSE KO!',
    sub: 'Full House',
    emoji: '🔥',
    particles: ['🔥','🔥','💥','🔥','💥'],
    bg: 'from-red-500 via-orange-500 to-yellow-600',
    glow: '#ff6600',
  },
  'Four of a Kind': {
    title: 'QUAD KNOCKOUT!',
    sub: 'Four of a Kind',
    emoji: '💥',
    particles: ['💥','⭐','💥','⭐','💥'],
    bg: 'from-purple-600 via-pink-600 to-red-700',
    glow: '#9900ff',
  },
  'Straight Flush': {
    title: 'SUBMISSION!',
    sub: 'Straight Flush',
    emoji: '🦅',
    particles: ['🦅','💎','⚡','💎','🦅'],
    bg: 'from-green-500 via-teal-600 to-emerald-900',
    glow: '#00ff88',
  },
  'Royal Flush': {
    title: 'UFC CHAMPION!',
    sub: 'Royal Flush',
    emoji: '👑',
    particles: ['👑','🏆','⭐','🏆','👑'],
    bg: 'from-yellow-400 via-amber-500 to-red-700',
    glow: '#ffd700',
  },
};

function Particle({ emoji, delay }) {
  const startX = Math.random() * 100;
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none"
      style={{ left: `${startX}%`, bottom: '10%' }}
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -300, opacity: 0, scale: 1.5, x: (Math.random() - 0.5) * 200 }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
    >
      {emoji}
    </motion.div>
  );
}

function HandCelebration({ handName, humanWon, onDone }) {
  const effect = HAND_EFFECTS[handName];
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  if (!effect) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background flash */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${effect.bg} opacity-80`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.6] }}
        transition={{ duration: 0.5 }}
      />

      {/* Particles */}
      {effect.particles.map((p, i) => (
        <Particle key={i} emoji={p} delay={i * 0.12} />
      ))}

      {/* Main callout */}
      <motion.div
        className="relative text-center px-6"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: [0, 1.3, 1], rotate: [-10, 5, 0] }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
      >
        <div className="text-7xl mb-3 drop-shadow-lg">{effect.emoji}</div>
        <div
          className="text-4xl sm:text-5xl font-black text-white tracking-wider drop-shadow-2xl uppercase"
          style={{ textShadow: `0 0 30px ${effect.glow}, 0 0 60px ${effect.glow}` }}
        >
          {effect.title}
        </div>
        <motion.div
          className="text-xl sm:text-2xl font-bold text-white/90 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {effect.sub}
        </motion.div>
        {humanWon && (
          <motion.div
            className="mt-4 text-2xl font-black text-yellow-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ textShadow: '0 0 20px #ffd700' }}
          >
            🏆 YOU WIN!
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Card Component ────────────────────────────────────────────
function Card({ card, hidden = false, size = 'md' }) {
  const sizes = {
    sm:  { w: 40,  h: 56,  rankSize: 13, suitSize: 15 },
    md:  { w: 56,  h: 80,  rankSize: 17, suitSize: 20 },
    lg:  { w: 72,  h: 100, rankSize: 22, suitSize: 26 },
    xl:  { w: 88,  h: 124, rankSize: 28, suitSize: 34 },
  };
  const s = sizes[size] || sizes.md;

  if (hidden) return (
    <motion.div
      className="rounded-xl border-2 border-red-600 flex items-center justify-center shadow-lg bg-gradient-to-br from-red-900 to-red-800 select-none flex-shrink-0"
      style={{ width: s.w, height: s.h }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <span style={{ fontSize: s.suitSize }}>🥊</span>
    </motion.div>
  );

  const red = isRed(card.suit);
  return (
    <motion.div
      className="rounded-xl border-2 border-gray-300 bg-white shadow-lg flex flex-col items-center justify-center select-none flex-shrink-0"
      style={{ width: s.w, height: s.h }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <span className={`font-black leading-none ${red ? 'text-red-600' : 'text-gray-900'}`} style={{ fontSize: s.rankSize }}>
        {rankLabel(card.rank)}
      </span>
      <span className={`leading-none ${red ? 'text-red-600' : 'text-gray-900'}`} style={{ fontSize: s.suitSize }}>
        {SUIT_SYM[card.suit]}
      </span>
    </motion.div>
  );
}

// ─── Position Badge ────────────────────────────────────────────
function PosBadge({ label, color }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-black leading-none ${color}`}>
      {label}
    </span>
  );
}

// ─── Chip Stack Visual ─────────────────────────────────────────
function BetChips({ amount }) {
  if (!amount) return null;
  return (
    <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600 shadow" />
      <span className="text-yellow-300 text-xs font-bold">{amount}</span>
    </div>
  );
}

// ─── Player Seat ───────────────────────────────────────────────
function PlayerSeat({ player, isActive, isDealer, isSB, isBB, showCards, communityCards, isHuman }) {
  const hand = showCards && player.holeCards.length === 2 && communityCards?.length >= 3
    ? bestHand(player.holeCards, communityCards)
    : null;

  const cardSize = isHuman ? 'xl' : 'sm';

  return (
    <div className={`flex flex-col items-center gap-1 transition-all duration-300 rounded-2xl p-2
      ${isActive && !player.folded && !player.allIn ? 'ring-4 ring-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/30' : ''}
      ${player.folded ? 'opacity-50' : ''}
    `}>
      {/* Position badges row */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {isDealer && <PosBadge label="D" color="bg-white text-gray-900" />}
        {isSB && <PosBadge label="SB" color="bg-blue-600 text-white" />}
        {isBB && <PosBadge label="BB" color="bg-red-600 text-white" />}
        {player.allIn && <PosBadge label="ALL IN" color="bg-yellow-500 text-gray-900" />}
      </div>

      {/* Name */}
      <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap max-w-[120px] truncate
        ${isHuman ? 'bg-yellow-500 text-gray-900 text-sm' : player.folded ? 'bg-gray-600 text-gray-400' : 'bg-red-900 text-white border border-red-700'}
      `}>
        {player.name}
      </div>

      {/* Chips */}
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600" />
        <span className={`font-bold ${isHuman ? 'text-sm text-yellow-300' : 'text-xs text-yellow-400'}`}>
          {player.chips.toLocaleString()}
        </span>
      </div>

      {/* Hole cards */}
      <div className="flex gap-1 justify-center">
        {player.holeCards.length === 2 ? (
          player.folded ? (
            <span className="text-gray-500 text-xs italic">Folded</span>
          ) : showCards ? (
            <>
              <Card card={player.holeCards[0]} size={cardSize} />
              <Card card={player.holeCards[1]} size={cardSize} />
            </>
          ) : (
            <>
              <Card hidden size={cardSize} />
              <Card hidden size={cardSize} />
            </>
          )
        ) : null}
      </div>

      {/* Current bet chips */}
      <BetChips amount={player.bet > 0 && !player.folded ? player.bet : 0} />

      {/* Hand name at showdown */}
      {hand && hand.rank >= 0 && (
        <motion.div
          className="text-xs font-bold text-green-300 bg-green-900/60 rounded px-2 py-0.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {hand.name}
        </motion.div>
      )}

      {/* Active indicator */}
      {isActive && !player.folded && !player.allIn && (
        <motion.div
          className="text-xs text-yellow-400 font-semibold"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          {isHuman ? '▶ YOUR TURN' : 'thinking…'}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function PokerGame() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [fanCoins, setFanCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [fanCoinsSpent, setFanCoinsSpent] = useState(0); // fan coins used for rebuys
  const [showRebuy, setShowRebuy] = useState(false);
  const [rebuyInput, setRebuyInput] = useState(500);
  const [syncing, setSyncing] = useState(false);

  const [game, dispatch] = useReducer(reducer, INIT);
  const [raiseAmt, setRaiseAmt] = useState(0);
  const [showRaise, setShowRaise] = useState(false);

  const aiTimer = useRef(null);
  const phaseTimer = useRef(null);

  // Load fan coins
  useEffect(() => {
    if (!currentUser) { setLoadingCoins(false); return; }
    currentUser.getIdToken().then(token =>
      axios.get(`${API_URL}/fancoins/leaderboard/my-rank`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setFanCoins(res.data.fanCoin ?? 0);
        setLoadingCoins(false);
      }).catch(() => setLoadingCoins(false))
    );
  }, [currentUser]);

  // ── Helper: kick off next hand ──
  const startNextHand = useCallback((currentPlayers, currentDealerIdx, currentHandNumber) => {
    const deck = newShuffledDeck();
    let di = 0;
    const nextDealer = (currentDealerIdx + 1) % NUM_PLAYERS;
    const players = currentPlayers.map(p => ({
      ...p,
      holeCards: [deck[di++], deck[di++]],
      bet: 0,
      folded: p.chips <= 0,
      allIn: false,
    }));
    dispatch({
      type: 'START_HAND',
      players,
      deck: deck.slice(di),
      dealerIdx: nextDealer,
      handNumber: currentHandNumber + 1,
    });
  }, []);

  // ── Phase advancement after betting round ends ──
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
      else if (game.phase === 'flop')   dispatch({ type: 'DEAL_TURN' });
      else if (game.phase === 'turn')   dispatch({ type: 'DEAL_RIVER' });
      else if (game.phase === 'river') {
        const alive = game.players.filter(p => !p.folded);
        let best = null;
        let winners = [];
        for (const p of alive) {
          const h = bestHand(p.holeCards, game.communityCards);
          if (!best || h.rank > best.rank || (h.rank === best.rank && cmpTie(h.tie, best.tie) > 0)) {
            best = h; winners = [p.id];
          } else if (h.rank === best.rank && cmpTie(h.tie, best.tie) === 0) {
            winners.push(p.id);
          }
        }
        dispatch({ type: 'SHOWDOWN', winners, handName: best?.name ?? '' });
      }
    }, 400);

    return () => clearTimeout(phaseTimer.current);
  }, [game._roundDone, game.phase]);

  // ── Auto-start next hand after showdown ──
  useEffect(() => {
    if (game.phase !== 'showdown') return;
    clearTimeout(phaseTimer.current);
    phaseTimer.current = setTimeout(() => {
      const humanChips = game.players[0]?.chips ?? 0;
      // Human busted — pause for rebuy
      if (humanChips === 0) {
        setShowRebuy(true);
        return;
      }
      const aiAlive = game.players.slice(1).filter(p => p.chips > 0);
      if (aiAlive.length === 0) return; // all AI busted, session over
      startNextHand(game.players, game.dealerIdx, game.handNumber);
    }, 3000);
    return () => clearTimeout(phaseTimer.current);
  }, [game.phase, game.players, game.dealerIdx, game.handNumber, startNextHand]);

  // ── AI turns ──
  useEffect(() => {
    if (!['preflop','flop','turn','river'].includes(game.phase)) return;
    const player = game.players[game.activeIdx];
    if (!player || !player.isAI || player.folded || player.allIn) return;

    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => {
      const decision = aiDecide(player, {
        currentBet: game.currentBet,
        pot: game.pot,
        communityCards: game.communityCards,
        bigBlind: BIG_BLIND,
      });
      dispatch({ type: 'PLAYER_ACTION', action: decision.action, amount: decision.amount });
    }, 700 + Math.random() * 800);

    return () => clearTimeout(aiTimer.current);
  }, [game.activeIdx, game.phase]);

  // ── Start game from lobby ──
  function startGame() {
    const deck = newShuffledDeck();
    let di = 0;
    const players = makePlayers().map(p => ({
      ...p,
      holeCards: [deck[di++], deck[di++]],
    }));
    dispatch({
      type: 'START_HAND',
      players,
      deck: deck.slice(di),
      dealerIdx: 0,
      handNumber: 1,
    });
  }

  // ── Rebuy with fan coins ──
  function handleRebuy(amount) {
    if (amount <= 0 || amount > fanCoins) return;
    dispatch({ type: 'REBUY', amount });
    setFanCoins(prev => prev - amount);
    setFanCoinsSpent(prev => prev + amount);
    setShowRebuy(false);
    // Delay before dealing — give UI time to update
    setTimeout(() => {
      setShowRebuy(false); // ensure closed
      startNextHand(
        game.players.map(p => p.id === 0 ? { ...p, chips: p.chips + amount } : p),
        game.dealerIdx,
        game.handNumber
      );
    }, 300);
  }

  // ── Sync coins on exit ──
  async function cashOut() {
    if (!currentUser) { navigate('/game'); return; }
    // delta = chips gained from AI - fan coins spent on rebuys
    // initial 1000 free chips are excluded from delta
    const humanChips = game.players[0]?.chips ?? 0;
    const delta = (humanChips - STARTING_CHIPS) - fanCoinsSpent;
    if (delta !== 0) {
      setSyncing(true);
      try {
        const token = await currentUser.getIdToken();
        await axios.post(`${API_URL}/fancoins/poker-result`,
          { coinDelta: delta },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.error('Coin sync error', e);
      }
      setSyncing(false);
    }
    navigate('/game');
  }

  // ── Player actions ──
  function doAction(act, amount) {
    setShowRaise(false);
    dispatch({ type: 'PLAYER_ACTION', action: act, amount });
  }

  // ── Celebration state ──
  const [celebration, setCelebration] = useState(null); // { handName, humanWon }

  // Trigger celebration on big hands at showdown
  useEffect(() => {
    if (game.phase !== 'showdown' || !game.handResult) return;
    const { winners, handName } = game.handResult;
    if (!handName || !HAND_EFFECTS[handName]) return;
    setCelebration({ handName, humanWon: winners.includes(0) });
  }, [game.phase, game.handResult]);

  // ── Derived state ──
  const human = game.players[0];
  const isMyTurn = game.activeIdx === 0 && ['preflop','flop','turn','river'].includes(game.phase);
  const toCall = human ? Math.max(0, game.currentBet - (human.bet || 0)) : 0;
  const canCheck = toCall === 0;
  const minRaiseTotal = game.currentBet + game.minRaise;
  const sessionNet = human ? (human.chips - STARTING_CHIPS) - fanCoinsSpent : -fanCoinsSpent;

  // Blind positions derived from dealer
  const sbIdx = game.players.length ? (game.dealerIdx + 1) % NUM_PLAYERS : -1;
  const bbIdx = game.players.length ? (game.dealerIdx + 2) % NUM_PLAYERS : -1;

  const PHASE_LABELS = {
    preflop: 'PRE-FLOP',
    flop: 'FLOP',
    turn: 'TURN',
    river: 'RIVER',
    showdown: 'SHOWDOWN',
  };

  // ── Lobby ──
  if (game.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-700">
          <div className="text-center mb-6">
            <div className="text-7xl mb-3">🃏</div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-wide">UFC POKER</h1>
            <p className="text-gray-400 text-sm">Texas Hold'em · Fan Coins</p>
          </div>

          {!currentUser ? (
            <div className="text-center">
              <p className="text-yellow-400 mb-4">Sign in to play with your Fan Coins</p>
              <button onClick={() => navigate('/')} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                Go Sign In
              </button>
            </div>
          ) : loadingCoins ? (
            <p className="text-gray-400 text-center">Loading your balance…</p>
          ) : (
            <>
              <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-4 mb-4 text-center border border-green-500">
                <p className="text-green-200 text-sm font-semibold mb-1">Every player starts with</p>
                <p className="text-4xl font-black text-white">1,000 FREE chips</p>
                <p className="text-green-300 text-xs mt-1">No Fan Coins required to start</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-3 mb-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Your Fan Coin Balance (for rebuys)</p>
                <p className="text-2xl font-bold text-yellow-400">🥊 {fanCoins.toLocaleString()}</p>
              </div>
              <div className="bg-gray-700/60 rounded-xl p-3 mb-5 text-xs text-gray-400 grid grid-cols-2 gap-1">
                <p>🎮 4 players: You vs 3 AI</p>
                <p>🃏 Texas Hold'em rules</p>
                <p>🪙 Blinds: {SMALL_BLIND}/{BIG_BLIND} chips</p>
                <p>💸 Rebuy with Fan Coins</p>
                <p>🏆 Win chips = earn coins</p>
                <p>👑 Special hand animations</p>
              </div>
              <motion.button
                onClick={startGame}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-black rounded-xl text-xl hover:from-red-700 hover:to-red-900 transition-all shadow-lg shadow-red-900/50 tracking-wide"
              >
                DEAL CARDS — FREE TO PLAY!
              </motion.button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Game Table ──
  const showdownPhase = game.phase === 'showdown';
  const inBettingPhase = ['preflop','flop','turn','river'].includes(game.phase);

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden select-none" style={{ fontFamily: 'sans-serif' }}>

      {/* ── Celebration Overlay ── */}
      <AnimatePresence>
        {celebration && (
          <HandCelebration
            handName={celebration.handName}
            humanWon={celebration.humanWon}
            onDone={() => setCelebration(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Rebuy Modal ── */}
      <AnimatePresence>
        {showRebuy && (
          <motion.div
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-red-700"
              initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }}
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">💀</div>
                <h2 className="text-xl font-black text-white">YOU'RE OUT OF CHIPS!</h2>
                <p className="text-gray-400 text-sm mt-1">Use your Fan Coins to buy back in</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-3 mb-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Fan Coin Balance</p>
                <p className="text-2xl font-bold text-yellow-400">🥊 {fanCoins.toLocaleString()}</p>
              </div>
              {fanCoins > 0 ? (
                <>
                  <p className="text-gray-300 text-sm mb-2 text-center">Select rebuy (1 coin = 1 chip)</p>
                  <div className="flex gap-2 mb-3">
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
                    className="w-full accent-red-500 mb-2" />
                  <p className="text-yellow-400 text-center font-bold mb-4">
                    🥊 {Math.min(rebuyInput, fanCoins)} coins → {Math.min(rebuyInput, fanCoins)} chips
                  </p>
                  <button onClick={() => handleRebuy(Math.min(rebuyInput, fanCoins))}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-900 transition-all mb-2">
                    Rebuy {Math.min(rebuyInput, fanCoins)} chips
                  </button>
                </>
              ) : (
                <p className="text-red-400 text-center font-semibold mb-4">No Fan Coins available for rebuy</p>
              )}
              <button onClick={cashOut}
                className="w-full py-2 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-colors text-sm">
                Leave Table
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800 z-10 flex-shrink-0">
        <button onClick={cashOut} disabled={syncing}
          className="text-gray-400 hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors whitespace-nowrap">
          {syncing ? 'Saving…' : '← Exit'}
        </button>
        <div className="text-center">
          <div className="text-white font-black text-sm sm:text-base tracking-widest">🥊 UFC POKER</div>
          <div className="text-gray-500 text-xs">Hand #{game.handNumber} · {PHASE_LABELS[game.phase] ?? game.phase.toUpperCase()}</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold ${sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionNet >= 0 ? '+' : ''}{sessionNet} 🥊
          </div>
          {fanCoinsSpent > 0 && <div className="text-xs text-gray-600">spent: {fanCoinsSpent}</div>}
        </div>
      </div>

      {/* ── Poker Table ── */}
      <div className="flex-1 flex flex-col min-h-0"
        style={{ background: 'radial-gradient(ellipse at center, #1a5c2a 0%, #0c3016 55%, #06180a 100%)' }}>

        {/* AI players row */}
        <div className="flex justify-around items-start pt-2 px-2 flex-shrink-0">
          {[1, 2, 3].map(idx => (
            <PlayerSeat
              key={idx}
              player={game.players[idx]}
              isActive={game.activeIdx === idx}
              isDealer={game.dealerIdx === idx}
              isSB={sbIdx === idx}
              isBB={bbIdx === idx}
              showCards={showdownPhase}
              communityCards={game.communityCards}
              isHuman={false}
            />
          ))}
        </div>

        {/* Community cards + info center */}
        <div className="flex flex-col items-center justify-center flex-1 gap-2 px-2">
          {/* Phase + blinds info strip */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-black/60 text-green-300 text-xs font-black px-3 py-1 rounded-full tracking-widest uppercase">
              {PHASE_LABELS[game.phase] ?? game.phase}
            </span>
            <span className="bg-black/60 text-blue-300 text-xs font-semibold px-2 py-1 rounded-full">
              SB {SMALL_BLIND} / BB {BIG_BLIND}
            </span>
            {game.pot > 0 && (
              <motion.span
                key={game.pot}
                className="bg-yellow-900/80 text-yellow-300 text-xs font-black px-3 py-1 rounded-full border border-yellow-700"
                initial={{ scale: 1.2 }} animate={{ scale: 1 }}
              >
                POT: {game.pot.toLocaleString()}
              </motion.span>
            )}
          </div>

          {/* Community cards */}
          <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
            <AnimatePresence>
              {[0,1,2,3,4].map(i => (
                game.communityCards[i] ? (
                  <motion.div key={`cc-${i}-${game.handNumber}`}
                    initial={{ rotateY: 90, opacity: 0, y: -20 }}
                    animate={{ rotateY: 0, opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}>
                    <Card card={game.communityCards[i]} size="lg" />
                  </motion.div>
                ) : (
                  <div key={`empty-${i}`}
                    className="rounded-xl border-2 border-dashed border-green-800/50 opacity-30 flex-shrink-0"
                    style={{ width: 72, height: 100 }} />
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Action log / message */}
          {game.message && (
            <motion.div
              key={game.message}
              className="bg-black/70 text-yellow-200 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full text-center max-w-xs"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            >
              {game.message}
            </motion.div>
          )}
        </div>

        {/* Human player area */}
        <div className="flex-shrink-0 pb-2 px-2">
          <div className="flex flex-col items-center gap-2">
            <PlayerSeat
              player={game.players[0]}
              isActive={game.activeIdx === 0}
              isDealer={game.dealerIdx === 0}
              isSB={sbIdx === 0}
              isBB={bbIdx === 0}
              showCards={true}
              communityCards={game.communityCards}
              isHuman={true}
            />

            {/* ── Action Buttons ── */}
            {isMyTurn && !human?.folded && !human?.allIn && (
              <motion.div
                className="flex flex-col items-center gap-2 w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex gap-2 w-full">
                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('fold')}
                    className="flex-1 py-3 bg-gray-800 text-red-400 font-black rounded-xl border border-red-800 hover:bg-red-950 transition-colors text-sm">
                    FOLD
                  </motion.button>

                  {canCheck ? (
                    <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('check')}
                      className="flex-1 py-3 bg-green-800 text-white font-black rounded-xl hover:bg-green-700 transition-colors text-sm">
                      CHECK
                    </motion.button>
                  ) : (
                    <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('call')}
                      className="flex-1 py-3 bg-blue-700 text-white font-black rounded-xl hover:bg-blue-600 transition-colors text-sm">
                      CALL {toCall}
                    </motion.button>
                  )}

                  {human.chips > toCall && (
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={() => { setRaiseAmt(Math.min(minRaiseTotal, human.chips + human.bet)); setShowRaise(r => !r); }}
                      className="flex-1 py-3 bg-yellow-600 text-white font-black rounded-xl hover:bg-yellow-500 transition-colors text-sm">
                      RAISE
                    </motion.button>
                  )}

                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => doAction('raise', human.chips + human.bet)}
                    className="flex-1 py-3 bg-red-700 text-white font-black rounded-xl hover:bg-red-600 transition-colors text-xs">
                    ALL-IN<br/>{human.chips}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showRaise && (
                    <motion.div
                      className="bg-gray-900 rounded-xl p-3 flex flex-col items-center gap-2 border border-yellow-600 w-full"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    >
                      <p className="text-yellow-300 text-sm font-bold">Raise to: 🥊 {raiseAmt.toLocaleString()}</p>
                      <input type="range"
                        min={minRaiseTotal} max={human.chips + human.bet} value={raiseAmt}
                        onChange={e => setRaiseAmt(+e.target.value)}
                        className="w-full accent-yellow-500" />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => doAction('raise', raiseAmt)}
                        className="px-8 py-2 bg-yellow-600 text-white font-black rounded-lg hover:bg-yellow-500 text-sm w-full">
                        CONFIRM RAISE TO {raiseAmt}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {isMyTurn && human?.allIn && (
              <p className="text-yellow-400 text-sm font-black tracking-widest animate-pulse">★ ALL-IN ★</p>
            )}

            {!isMyTurn && inBettingPhase && !human?.folded && (
              <p className="text-gray-500 text-xs">
                Waiting for {game.players[game.activeIdx]?.name ?? ''}…
              </p>
            )}

            {human?.folded && inBettingPhase && (
              <p className="text-gray-600 text-xs italic">You folded this hand</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Hand result toast ── */}
      <AnimatePresence>
        {game.handResult && !celebration && (
          <motion.div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/90 border-2 border-yellow-500 rounded-2xl px-6 py-3 text-center shadow-2xl z-20 pointer-events-none"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="text-2xl mb-1">{game.handResult.winners.includes(0) ? '🏆' : '💀'}</div>
            <p className="text-yellow-300 font-black text-base">
              {game.handResult.winners.includes(0)
                ? 'YOU WIN!'
                : `${game.players[game.handResult.winners[0]]?.name ?? ''} wins!`}
            </p>
            {game.handResult.handName && (
              <p className="text-gray-300 text-xs mt-0.5">{game.handResult.handName}</p>
            )}
            <p className="text-yellow-400 font-bold text-sm">🥊 {game.handResult.pot.toLocaleString()}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
