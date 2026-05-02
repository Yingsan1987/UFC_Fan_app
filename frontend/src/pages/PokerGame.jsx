import { useState, useEffect, useReducer, useRef, useCallback } from 'react';
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

// ─── Card Component ────────────────────────────────────────────
function Card({ card, hidden = false, small = false }) {
  const base = `${small ? 'w-8 h-12 text-xs' : 'w-12 h-18 text-sm'} rounded border-2 flex flex-col items-center justify-center font-bold select-none`;
  if (hidden) return (
    <div className={`${base} bg-red-800 border-red-600`} style={{ height: small ? 48 : 72 }}>
      <span className="text-red-400 text-lg">🥊</span>
    </div>
  );
  const red = isRed(card.suit);
  return (
    <div className={`${base} bg-white border-gray-300 shadow`} style={{ height: small ? 48 : 72, minWidth: small ? 32 : 48 }}>
      <span className={red ? 'text-red-600' : 'text-gray-900'} style={{ fontSize: small ? 11 : 14 }}>
        {rankLabel(card.rank)}
      </span>
      <span className={red ? 'text-red-600' : 'text-gray-900'} style={{ fontSize: small ? 11 : 16 }}>
        {SUIT_SYM[card.suit]}
      </span>
    </div>
  );
}

// ─── Player Seat ───────────────────────────────────────────────
function PlayerSeat({ player, isActive, isDealer, showCards, communityCards, pot }) {
  const hand = showCards && player.holeCards.length === 2 && communityCards
    ? bestHand(player.holeCards, communityCards)
    : null;

  return (
    <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive && !player.folded ? 'ring-4 ring-yellow-400 rounded-xl p-1' : 'p-1'}`}>
      {/* Name + chips */}
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${player.folded ? 'bg-gray-500 text-gray-300' : player.isAI ? 'bg-red-800 text-white' : 'bg-yellow-500 text-gray-900'}`}>
        {isDealer && <span className="mr-1">D</span>}
        {player.name}
        {player.allIn && <span className="ml-1 text-yellow-300">ALL-IN</span>}
      </div>
      <div className="text-yellow-400 text-xs font-semibold">🥊 {player.chips}</div>
      {/* Cards */}
      <div className="flex gap-1">
        {player.holeCards.length === 2 ? (
          player.folded ? (
            <span className="text-gray-500 text-xs">Folded</span>
          ) : showCards ? (
            <>
              <Card card={player.holeCards[0]} small />
              <Card card={player.holeCards[1]} small />
            </>
          ) : (
            <>
              <Card hidden small />
              <Card hidden small />
            </>
          )
        ) : null}
      </div>
      {/* Current bet */}
      {player.bet > 0 && !player.folded && (
        <div className="text-xs text-yellow-300 font-bold">Bet: {player.bet}</div>
      )}
      {/* Hand name at showdown */}
      {hand && hand.rank >= 0 && (
        <div className="text-xs text-green-300 font-semibold">{hand.name}</div>
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

  // ── Derived state ──
  const human = game.players[0];
  const isMyTurn = game.activeIdx === 0 && ['preflop','flop','turn','river'].includes(game.phase);
  const toCall = human ? Math.max(0, game.currentBet - (human.bet || 0)) : 0;
  const canCheck = toCall === 0;
  const minRaiseTotal = game.currentBet + game.minRaise;
  // Net fan coin change this session (does not count initial free 1000)
  const sessionNet = human ? (human.chips - STARTING_CHIPS) - fanCoinsSpent : -fanCoinsSpent;

  // ── Lobby ──
  if (game.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🃏</div>
            <h1 className="text-3xl font-bold text-white mb-1">UFC Poker</h1>
            <p className="text-gray-400">Texas Hold'em · Fan Coins</p>
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
              {/* Free chip banner */}
              <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-4 mb-4 text-center border border-green-500">
                <p className="text-green-200 text-sm font-semibold mb-1">Every player starts with</p>
                <p className="text-4xl font-bold text-white">1,000 FREE chips</p>
                <p className="text-green-300 text-xs mt-1">No Fan Coins required to start</p>
              </div>

              {/* Fan coin balance */}
              <div className="bg-gray-700 rounded-xl p-3 mb-6 text-center">
                <p className="text-gray-400 text-xs mb-1">Your Fan Coin Balance (for rebuys)</p>
                <p className="text-2xl font-bold text-yellow-400">🥊 {fanCoins}</p>
              </div>

              <div className="bg-gray-700 rounded-xl p-3 mb-6 text-xs text-gray-400 space-y-1">
                <p>• 4 players: You vs 3 AI fighters</p>
                <p>• Blinds: {SMALL_BLIND}/{BIG_BLIND} chips</p>
                <p>• Run out? Rebuy using your Fan Coins</p>
                <p>• Win chips from AI → earn Fan Coins</p>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl text-lg hover:from-red-700 hover:to-red-900 transition-all shadow-lg"
              >
                Deal Cards — Free to Play!
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Game Table ──
  const showdownPhase = game.phase === 'showdown';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" style={{ fontFamily: 'sans-serif' }}>
      {/* Rebuy Modal */}
      {showRebuy && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-red-700">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">💀</div>
              <h2 className="text-xl font-bold text-white">You're out of chips!</h2>
              <p className="text-gray-400 text-sm mt-1">Use your Fan Coins to buy back in</p>
            </div>

            <div className="bg-gray-700 rounded-xl p-3 mb-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Fan Coin Balance</p>
              <p className="text-2xl font-bold text-yellow-400">🥊 {fanCoins}</p>
            </div>

            {fanCoins > 0 ? (
              <>
                <p className="text-gray-300 text-sm mb-2 text-center">Select rebuy amount (1 coin = 1 chip)</p>
                <div className="flex gap-2 mb-3">
                  {REBUY_OPTIONS.filter(v => v <= fanCoins).map(v => (
                    <button
                      key={v}
                      onClick={() => setRebuyInput(v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${rebuyInput === v ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={BIG_BLIND * 2}
                  max={fanCoins}
                  value={Math.min(rebuyInput, fanCoins)}
                  onChange={e => setRebuyInput(+e.target.value)}
                  className="w-full accent-red-500 mb-2"
                />
                <p className="text-yellow-400 text-center font-bold mb-4">
                  🥊 {Math.min(rebuyInput, fanCoins)} Fan Coins → {Math.min(rebuyInput, fanCoins)} chips
                </p>
                <button
                  onClick={() => handleRebuy(Math.min(rebuyInput, fanCoins))}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-900 transition-all mb-2"
                >
                  Rebuy {Math.min(rebuyInput, fanCoins)} chips
                </button>
              </>
            ) : (
              <p className="text-red-400 text-center font-semibold mb-4">No Fan Coins available for rebuy</p>
            )}

            <button
              onClick={cashOut}
              className="w-full py-2 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-colors text-sm"
            >
              Leave Table
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={cashOut}
          disabled={syncing}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
        >
          {syncing ? 'Saving…' : '← Cash Out'}
        </button>
        <div className="text-center">
          <span className="text-white font-bold">UFC Poker</span>
          <span className="text-gray-400 text-xs ml-2">Hand #{game.handNumber}</span>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className={`text-sm font-bold ${sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionNet >= 0 ? '+' : ''}{sessionNet} 🥊
          </span>
          {fanCoinsSpent > 0 && (
            <span className="text-xs text-gray-500">Spent: {fanCoinsSpent}</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col items-center justify-between p-4"
        style={{ background: 'radial-gradient(ellipse at center, #1a5c2a 0%, #0d3318 60%, #081c0e 100%)' }}>

        {/* Top: AI 1 */}
        <div className="flex justify-center mt-2">
          <PlayerSeat
            player={game.players[1]}
            isActive={game.activeIdx === 1}
            isDealer={game.dealerIdx === 1}
            showCards={showdownPhase}
            communityCards={game.communityCards}
          />
        </div>

        {/* Middle row: AI 2, Table center, AI 3 */}
        <div className="flex items-center justify-between w-full max-w-2xl my-2">
          {/* AI 2 - left */}
          <PlayerSeat
            player={game.players[2]}
            isActive={game.activeIdx === 2}
            isDealer={game.dealerIdx === 2}
            showCards={showdownPhase}
            communityCards={game.communityCards}
          />

          {/* Center: community cards + pot */}
          <div className="flex flex-col items-center gap-2">
            {/* Message */}
            {game.message && (
              <div className="bg-black bg-opacity-50 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full text-center max-w-xs">
                {game.message}
              </div>
            )}
            {/* Community cards */}
            <div className="flex gap-1">
              {[0,1,2,3,4].map(i => (
                game.communityCards[i]
                  ? <Card key={i} card={game.communityCards[i]} />
                  : <div key={i} className="w-12 rounded border-2 border-dashed border-green-800 opacity-40" style={{ height: 72 }} />
              ))}
            </div>
            {/* Pot */}
            <div className="bg-black bg-opacity-50 rounded-full px-4 py-1">
              <span className="text-yellow-400 font-bold text-sm">Pot: 🥊 {game.pot}</span>
            </div>
            {/* Phase badge */}
            <div className="text-green-300 text-xs uppercase tracking-widest font-semibold">{game.phase}</div>
          </div>

          {/* AI 3 - right */}
          <PlayerSeat
            player={game.players[3]}
            isActive={game.activeIdx === 3}
            isDealer={game.dealerIdx === 3}
            showCards={showdownPhase}
            communityCards={game.communityCards}
          />
        </div>

        {/* Bottom: Human player */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <PlayerSeat
            player={game.players[0]}
            isActive={game.activeIdx === 0}
            isDealer={game.dealerIdx === 0}
            showCards={true}
            communityCards={game.communityCards}
          />

          {/* Action buttons */}
          {isMyTurn && !human?.folded && !human?.allIn && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {/* Fold */}
                <button
                  onClick={() => doAction('fold')}
                  className="px-5 py-2 bg-gray-700 text-red-400 font-bold rounded-xl border border-red-700 hover:bg-red-900 transition-colors"
                >
                  Fold
                </button>

                {/* Check or Call */}
                {canCheck ? (
                  <button
                    onClick={() => doAction('check')}
                    className="px-5 py-2 bg-gray-700 text-green-400 font-bold rounded-xl border border-green-700 hover:bg-green-900 transition-colors"
                  >
                    Check
                  </button>
                ) : (
                  <button
                    onClick={() => doAction('call')}
                    className="px-5 py-2 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
                  >
                    Call {toCall}
                  </button>
                )}

                {/* Raise */}
                {human.chips > toCall && (
                  <button
                    onClick={() => {
                      setRaiseAmt(Math.min(minRaiseTotal, human.chips + human.bet));
                      setShowRaise(r => !r);
                    }}
                    className="px-5 py-2 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 transition-colors"
                  >
                    Raise
                  </button>
                )}

                {/* All-in */}
                <button
                  onClick={() => doAction('raise', human.chips + human.bet)}
                  className="px-4 py-2 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 transition-colors text-sm"
                >
                  All-in
                </button>
              </div>

              {/* Raise slider */}
              {showRaise && (
                <div className="bg-gray-800 rounded-xl p-3 flex flex-col items-center gap-2 border border-yellow-600">
                  <p className="text-yellow-300 text-xs font-bold">Raise to: 🥊 {raiseAmt}</p>
                  <input
                    type="range"
                    min={minRaiseTotal}
                    max={human.chips + human.bet}
                    value={raiseAmt}
                    onChange={e => setRaiseAmt(+e.target.value)}
                    className="w-48 accent-yellow-500"
                  />
                  <button
                    onClick={() => doAction('raise', raiseAmt)}
                    className="px-6 py-1 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    Confirm Raise
                  </button>
                </div>
              )}
            </div>
          )}

          {isMyTurn && human?.allIn && (
            <p className="text-yellow-400 text-sm font-bold animate-pulse">You're All-In</p>
          )}

          {!isMyTurn && !showdownPhase && ['preflop','flop','turn','river'].includes(game.phase) && (
            <p className="text-gray-400 text-xs">
              Waiting for {game.players[game.activeIdx]?.name ?? ''}…
            </p>
          )}
        </div>
      </div>

      {/* Hand result overlay */}
      {game.handResult && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black bg-opacity-75 text-white text-center p-6 rounded-2xl border-2 border-yellow-400 shadow-2xl">
            <div className="text-4xl mb-2">{game.handResult.winners.includes(0) ? '🏆' : '💀'}</div>
            <p className="text-xl font-bold text-yellow-400">
              {game.handResult.winners.includes(0) ? 'You win!' : `${game.players[game.handResult.winners[0]]?.name} wins!`}
            </p>
            <p className="text-gray-300 text-sm mt-1">{game.handResult.handName}</p>
            <p className="text-yellow-300 font-bold">🥊 {game.handResult.pot} coins</p>
          </div>
        </div>
      )}
    </div>
  );
}
