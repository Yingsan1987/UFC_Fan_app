import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Info, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const ROWS = 4;
const COLS = 5;
const COINS_PER_UFC = 1000;
const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

// ─── Fighter Symbols ────────────────────────────────────────────
const FIGHTERS = [
  { id: 0,  name: 'Conor McGregor',         short: 'MC', color: '#fbbf24', bg: '#78350f', tier: 3, emoji: '🇮🇪' },
  { id: 1,  name: 'Khabib Nurmagomedov',    short: 'KH', color: '#6ee7b7', bg: '#064e3b', tier: 3, emoji: '🦅' },
  { id: 2,  name: 'Jon Jones',              short: 'JJ', color: '#c4b5fd', bg: '#3b0764', tier: 3, emoji: '🦁' },
  { id: 3,  name: 'Islam Makhachev',        short: 'IM', color: '#67e8f9', bg: '#0c4a6e', tier: 2, emoji: '🌊' },
  { id: 4,  name: 'Kamaru Usman',           short: 'KU', color: '#f9a8d4', bg: '#831843', tier: 2, emoji: '👑' },
  { id: 5,  name: 'Francis Ngannou',        short: 'FN', color: '#fdba74', bg: '#7c2d12', tier: 2, emoji: '💪' },
  { id: 6,  name: 'Israel Adesanya',        short: 'IA', color: '#93c5fd', bg: '#1e3a5f', tier: 2, emoji: '💀' },
  { id: 7,  name: 'Alexander Volkanovski',  short: 'AV', color: '#fca5a5', bg: '#7f1d1d', tier: 1, emoji: '🦈' },
  { id: 8,  name: 'Charles Oliveira',       short: 'CO', color: '#bbf7d0', bg: '#14532d', tier: 1, emoji: '🌿' },
  { id: 9,  name: 'Alex Pereira',           short: 'AP', color: '#fda4af', bg: '#881337', tier: 1, emoji: '⚡' },
  { id: 10, name: 'Leon Edwards',           short: 'LE', color: '#d8b4fe', bg: '#581c87', tier: 1, emoji: '🎯' },
  { id: 11, name: 'Dustin Poirier',         short: 'DP', color: '#93c5fd', bg: '#1e40af', tier: 1, emoji: '💎' },
];

// Tier 3 rare (weight 1), tier 2 uncommon (weight 2), tier 1 common (weight 3)
const WEIGHTS = FIGHTERS.map(f => f.tier === 3 ? 1 : f.tier === 2 ? 2 : 3);
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0);

function weightedRandom() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < FIGHTERS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return FIGHTERS.length - 1;
}

function makeGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => weightedRandom())
  );
}

// ─── Win Evaluation ─────────────────────────────────────────────
function evaluateWins(grid, bet, wildId, streakBonus) {
  const wins = [];
  const highlighted = new Set();
  const key = (r, c) => `${r},${c}`;

  const isMatch = (a, b) => {
    if (wildId !== null && (a === wildId || b === wildId)) return true;
    return a === b;
  };

  const addWin = (type, cells, multiplier, emoji, tier = 'normal') => {
    const finalMult = streakBonus ? Math.round(multiplier * 1.5) : multiplier;
    cells.forEach(([r, c]) => highlighted.add(key(r, c)));
    wins.push({ type, cells, multiplier: finalMult, payout: bet * finalMult, emoji, tier });
  };

  // 1. Horizontal paylines (consecutive run detection)
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const base = grid[r][c];
      let end = c + 1;
      while (end < COLS && isMatch(grid[r][end], base)) end++;
      const len = end - c;
      if (len >= 3) {
        const cells = Array.from({ length: len }, (_, i) => [r, c + i]);
        if (len === 5) addWin('LINE JACKPOT!', cells, 25, '🎰', 'jackpot');
        else if (len === 4) addWin('Four in a Row!', cells, 8, '💥', 'high');
        else addWin('Three in a Row!', cells, 2, '⚡', 'normal');
      }
      c = end;
    }
  }

  // 2. Vertical matches
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const base = grid[r][c];
      let end = r + 1;
      while (end < ROWS && isMatch(grid[end][c], base)) end++;
      const len = end - r;
      if (len >= 3) {
        const cells = Array.from({ length: len }, (_, i) => [r + i, c]);
        if (len === 4) addWin('Full Column!', cells, 12, '🔥', 'high');
        else addWin('Column Three!', cells, 3, '👊', 'normal');
      }
      r = end;
    }
  }

  // 3. Main diagonal [0,0][1,1][2,2][3,3]
  {
    const diag = Array.from({ length: ROWS }, (_, i) => [i, i]);
    const base = grid[0][0];
    if (diag.every(([r, c]) => isMatch(grid[r][c], base))) {
      addWin('Diagonal Strike!', diag, 30, '↘️', 'high');
    }
  }

  // 4. Anti-diagonal [0,4][1,3][2,2][3,1]
  {
    const diag = Array.from({ length: ROWS }, (_, i) => [i, COLS - 1 - i]);
    const base = grid[0][COLS - 1];
    if (diag.every(([r, c]) => isMatch(grid[r][c], base))) {
      addWin('Counter Diagonal!', diag, 30, '↙️', 'high');
    }
  }

  // 5. Both diagonals same fighter — X mark!
  {
    const d1 = Array.from({ length: ROWS }, (_, i) => [i, i]);
    const d2 = Array.from({ length: ROWS }, (_, i) => [i, COLS - 1 - i]);
    const b1 = grid[0][0];
    const b2 = grid[0][COLS - 1];
    if (
      d1.every(([r, c]) => isMatch(grid[r][c], b1)) &&
      d2.every(([r, c]) => isMatch(grid[r][c], b2)) &&
      isMatch(b1, b2)
    ) {
      // Union of both diagonals (centre cell [1,2] and [2,2] overlap)
      const seen = new Set();
      const cells = [...d1, ...d2].filter(([r, c]) => {
        const k = `${r},${c}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      addWin('DOUBLE DIAGONAL! ✖', cells, 80, '✖️', 'jackpot');
    }
  }

  // 6. Corner Quad — all 4 corners same
  {
    const corners = [[0, 0], [0, COLS - 1], [ROWS - 1, 0], [ROWS - 1, COLS - 1]];
    const base = grid[0][0];
    if (corners.every(([r, c]) => isMatch(grid[r][c], base))) {
      addWin('Corner Quad!', corners, 25, '🔲', 'high');
    }
  }

  // 7. Cross pattern: entire middle row + entire middle column same fighter
  {
    const midRow = 1;
    const midCol = 2;
    const rowF = grid[midRow][0];
    const colF = grid[0][midCol];
    const rowSame = Array.from({ length: COLS }, (_, c) => grid[midRow][c]).every(f => isMatch(f, rowF));
    const colSame = Array.from({ length: ROWS }, (_, r) => grid[r][midCol]).every(f => isMatch(f, colF));
    if (rowSame && colSame && isMatch(rowF, colF)) {
      const rowCells = Array.from({ length: COLS }, (_, c) => [midRow, c]);
      const colCells = Array.from({ length: ROWS }, (_, r) => [r, midCol]).filter(([r]) => r !== midRow);
      addWin('Cross Pattern!', [...rowCells, ...colCells], 40, '✝️', 'high');
    }
  }

  // 8. Full-board jackpot — all 20 same
  {
    const first = grid[0][0];
    if (grid.every(row => row.every(f => isMatch(f, first)))) {
      const allCells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) allCells.push([r, c]);
      addWin('GRAND JACKPOT!!!', allCells, 1000, '🏆', 'jackpot');
    }
  }

  // 9. Scatter wins — count appearances of each fighter anywhere
  const counts = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const f = grid[r][c];
      if (!counts[f]) counts[f] = [];
      counts[f].push([r, c]);
    }
  }
  for (const [, cells] of Object.entries(counts)) {
    const n = cells.length;
    if (n >= 10)      addWin('LEGENDARY SCATTER!', cells, 300, '👑', 'jackpot');
    else if (n >= 8)  addWin('MEGA SCATTER!',       cells, 150, '🌟', 'jackpot');
    else if (n >= 6)  addWin('Super Scatter!',       cells,  50, '✨', 'high');
    else if (n >= 5)  addWin('Scatter Win!',          cells,  20, '💫', 'high');
    else if (n >= 4)  addWin('Scatter Hit!',          cells,   8, '⭐', 'normal');
  }

  // 10. Rivalry Bonus — McGregor (0) + Khabib (1) on same row
  for (let r = 0; r < ROWS; r++) {
    if (grid[r].includes(0) && grid[r].includes(1)) {
      const cells = grid[r].flatMap((f, c) => (f === 0 || f === 1) ? [[r, c]] : []);
      addWin('McGregor vs Khabib! Rivalry Bonus!', cells, 15, '🥊', 'high');
    }
  }

  // 11. Triple Champions — all 3 tier-3 fighters on same row
  for (let r = 0; r < ROWS; r++) {
    if (grid[r].includes(0) && grid[r].includes(1) && grid[r].includes(2)) {
      const cells = grid[r].flatMap((f, c) => [0, 1, 2].includes(f) ? [[r, c]] : []);
      addWin('TRIPLE CHAMPIONS!', cells, 60, '👑', 'jackpot');
    }
  }

  // 12. Champion Column — 3+ tier-3 fighters in same column
  for (let c = 0; c < COLS; c++) {
    const col = Array.from({ length: ROWS }, (_, r) => grid[r][c]);
    const tier3Cells = col.flatMap((f, r) => FIGHTERS[f].tier === 3 ? [[r, c]] : []);
    if (tier3Cells.length >= 3) {
      addWin('Champion Column!', tier3Cells, 20, '🏅', 'high');
    }
  }

  // 13. KO Row — any row where 4 out of 5 are the same fighter (near-miss jackpot)
  for (let r = 0; r < ROWS; r++) {
    const row = grid[r];
    const freq = {};
    row.forEach(f => { freq[f] = (freq[f] || 0) + 1; });
    for (const [fId, cnt] of Object.entries(freq)) {
      if (cnt === 4) {
        const cells = row.flatMap((f, c) => f === Number(fId) ? [[r, c]] : []);
        addWin('Near-Miss KO!', cells, 5, '🎯', 'normal');
      }
    }
  }

  // 14. Checkered — alternating pattern detection (row 0 & 2 dominant fighter same)
  {
    const r0dom = mostFrequent(grid[0]);
    const r2dom = mostFrequent(grid[2]);
    const r1dom = mostFrequent(grid[1]);
    const r3dom = mostFrequent(grid[3]);
    if (r0dom === r2dom && r1dom === r3dom && r0dom !== r1dom) {
      const cells = [];
      [0, 2].forEach(r => grid[r].forEach((f, c) => { if (f === r0dom) cells.push([r, c]); }));
      [1, 3].forEach(r => grid[r].forEach((f, c) => { if (f === r1dom) cells.push([r, c]); }));
      if (cells.length >= 6) addWin('Checkered Pattern!', cells, 18, '⬛', 'normal');
    }
  }

  return { wins, highlighted };
}

function mostFrequent(arr) {
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}

// ─── Fighter Cell ────────────────────────────────────────────────
function FighterCell({ fighterId, isHighlighted, isSpinning, fighterImages }) {
  const fighter = FIGHTERS[fighterId] ?? FIGHTERS[0];
  const imgSrc = fighterImages?.[fighter.name];
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => { setImgOk(true); }, [fighterId]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border-2 transition-all duration-150 select-none ${
        isHighlighted
          ? 'border-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.7)] scale-105 z-10'
          : 'border-gray-700'
      }`}
      style={{ aspectRatio: '1 / 1' }}
    >
      {imgOk && imgSrc ? (
        <img
          src={imgSrc}
          alt={fighter.name}
          className="w-full h-full object-cover object-top"
          onError={() => setImgOk(false)}
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-0.5"
          style={{ backgroundColor: fighter.bg }}
        >
          <span className="text-xl sm:text-2xl leading-none">{fighter.emoji}</span>
          <span className="text-xs font-black leading-none" style={{ color: fighter.color }}>
            {fighter.short}
          </span>
          <span
            className="text-[9px] text-white/50 leading-none text-center px-0.5 w-full"
            style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
          >
            {fighter.name.split(' ')[0]}
          </span>
        </div>
      )}
      {isHighlighted && (
        <div className="absolute inset-0 bg-yellow-300/20 animate-pulse pointer-events-none rounded-lg" />
      )}
      {isSpinning && (
        <div className="absolute inset-0 bg-black/40 pointer-events-none rounded-lg" />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function UFCSlots() {
  const navigate = useNavigate();
  const { currentUser, getAuthToken } = useAuth();

  // wallet
  const [ufcCoins, setUfcCoins]     = useState(0);
  const [slotCoins, setSlotCoins]   = useState(0);
  const [exchangeAmt, setExchangeAmt] = useState(1);

  // game
  const [bet, setBet]               = useState(50);
  const [grid, setGrid]             = useState(() => makeGrid());
  const [spinning, setSpinning]     = useState(false);
  const [stoppedCols, setStoppedCols] = useState(COLS);
  const [spinFrame, setSpinFrame]   = useState(0);
  const [wins, setWins]             = useState([]);
  const [highlighted, setHighlighted] = useState(new Set());
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [totalWin, setTotalWin]     = useState(0);
  const [freeSpins, setFreeSpins]   = useState(0);
  const [wildFighter, setWildFighter] = useState(null);
  const [streak, setStreak]         = useState(0);
  const [sessionNet, setSessionNet] = useState(0);
  const [recentWins, setRecentWins] = useState([]);

  // UI
  const [loading, setLoading]           = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [bonusMsg, setBonusMsg]         = useState(null);
  const [fighterImages, setFighterImages] = useState({});

  const finalGridRef   = useRef(null);
  const spinInterval   = useRef(null);
  const colTimeouts    = useRef([]);

  // Load fighter images from API
  useEffect(() => {
    axios.get(`${API_URL}/fighters`).then(res => {
      const map = {};
      (res.data || []).forEach(f => {
        if (!f.imageUrl) return;
        map[f.name] = f.imageUrl;
        // fuzzy-match against our slot fighters
        FIGHTERS.forEach(sf => {
          const last = sf.name.split(' ').pop().toLowerCase();
          if (f.name.toLowerCase().includes(last) && !map[sf.name]) {
            map[sf.name] = f.imageUrl;
          }
        });
      });
      setFighterImages(map);
    }).catch(() => {});
  }, []);

  // Fetch UFC coin balance
  const fetchBalance = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/fancoins/poker-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUfcCoins(res.data.fanCoin ?? 0);
    } catch {}
  }, [currentUser, getAuthToken]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // Computed display grid during spin
  const displayGrid = spinning
    ? Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          if (c < stoppedCols) return finalGridRef.current?.[r][c] ?? 0;
          return (spinFrame + c * 4 + r * 3) % FIGHTERS.length;
        })
      )
    : grid;

  const canSpin = !spinning && (freeSpins > 0 || slotCoins >= bet);

  const handleSpin = () => {
    if (!canSpin) return;
    const isFree = freeSpins > 0;

    if (!isFree) setSlotCoins(prev => prev - bet);
    else         setFreeSpins(prev => prev - 1);

    // Wild fighter — 3% chance
    const wild = Math.random() < 0.03 ? Math.floor(Math.random() * FIGHTERS.length) : null;
    setWildFighter(wild);

    const fg = makeGrid();
    finalGridRef.current = fg;

    setSpinning(true);
    setStoppedCols(0);
    setWins([]);
    setHighlighted(new Set());
    setShowWinOverlay(false);

    spinInterval.current = setInterval(() => setSpinFrame(f => f + 1), 80);

    // Stop columns left → right
    [600, 800, 1000, 1200, 1400].forEach((delay, col) => {
      const t = setTimeout(() => setStoppedCols(col + 1), delay);
      colTimeouts.current.push(t);
    });

    // Resolve spin
    setTimeout(() => {
      clearInterval(spinInterval.current);
      colTimeouts.current.forEach(clearTimeout);
      colTimeouts.current = [];

      setSpinning(false);
      setStoppedCols(COLS);
      setGrid(fg.map(row => [...row]));

      const effectiveBet = isFree ? bet * 2 : bet;
      const streakBonus  = streak >= 3;
      const { wins: w, highlighted: h } = evaluateWins(fg, effectiveBet, wild, streakBonus);
      const winTotal = w.reduce((s, x) => s + x.payout, 0);

      setWins(w);
      setHighlighted(h);
      setTotalWin(winTotal);
      setSessionNet(prev => prev + winTotal - (isFree ? 0 : bet));

      if (winTotal > 0) {
        setSlotCoins(prev => prev + winTotal);
        setStreak(prev => prev + 1);
        setRecentWins(prev => [{ wins: w, total: winTotal, ts: Date.now() }, ...prev.slice(0, 4)]);
        setShowWinOverlay(true);

        // Jackpot win triggers 5 free spins
        if (w.some(x => x.tier === 'jackpot') && freeSpins === 0) {
          setFreeSpins(5);
          setBonusMsg('🏆 JACKPOT BONUS! 5 Free Spins!');
          setTimeout(() => setBonusMsg(null), 3500);
        }
      } else {
        setStreak(0);
      }

      // Random bonus spins — 5% per spin
      if (Math.random() < 0.05 && freeSpins === 0) {
        setFreeSpins(3);
        setBonusMsg('🎁 BONUS ROLLS! 3 Free Spins awarded!');
        setTimeout(() => setBonusMsg(null), 3500);
      }
    }, 1650);
  };

  const handleExchange = async () => {
    if (exchangeAmt < 1 || exchangeAmt > ufcCoins || loading) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      await axios.post(
        `${API_URL}/fancoins/slots-result`,
        { coinDelta: -exchangeAmt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUfcCoins(prev => prev - exchangeAmt);
      setSlotCoins(prev => prev + exchangeAmt * COINS_PER_UFC);
    } catch {}
    setLoading(false);
    setShowExchange(false);
  };

  const handleCashOut = async () => {
    const earned = Math.floor(slotCoins / COINS_PER_UFC);
    if (earned < 1 || loading) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        `${API_URL}/fancoins/slots-result`,
        { coinDelta: earned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUfcCoins(res.data.fanCoin ?? (ufcCoins + earned));
      setSlotCoins(prev => prev % COINS_PER_UFC);
    } catch {}
    setLoading(false);
  };

  useEffect(() => () => {
    clearInterval(spinInterval.current);
    colTimeouts.current.forEach(clearTimeout);
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎰</div>
          <h2 className="text-2xl font-black text-white mb-2">UFC Slots</h2>
          <p className="text-gray-400 mb-6">Sign in to spin the reels!</p>
          <button onClick={() => navigate('/game')}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const topWin = wins.find(w => w.tier === 'jackpot') ?? wins.find(w => w.tier === 'high') ?? wins[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10 relative">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-gray-900 via-red-950 to-gray-900 px-4 py-3 flex items-center justify-between border-b border-red-900/60">
        <button onClick={() => navigate('/game')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black tracking-widest text-red-400 uppercase">🎰 UFC Slots 🎰</h1>
          <p className="text-[10px] text-gray-500">5 × 4 Fighter Grid • 14 Win Types</p>
        </div>
        <button onClick={() => setShowPaytable(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Info size={20} />
        </button>
      </div>

      {/* ── Wallet bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-gray-500">UFC Coins</p>
            <p className="font-black text-yellow-400">🥊 {ufcCoins.toLocaleString()}</p>
          </div>
          <button onClick={() => setShowExchange(true)}
            className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-[11px] rounded-lg transition-colors">
            Exchange
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-gray-500">Slot Coins</p>
          <p className="font-black text-purple-400">🪙 {slotCoins.toLocaleString()}</p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-gray-500">Session</p>
          <p className={`font-black text-sm ${sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionNet >= 0 ? '+' : ''}{sessionNet.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Status badges ── */}
      {(freeSpins > 0 || wildFighter !== null || streak >= 3) && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-950/80 border-b border-purple-800/50 flex-wrap">
          {freeSpins > 0 && (
            <span className="text-[11px] font-black text-purple-200 bg-purple-900 px-2 py-0.5 rounded-full">
              🎁 {freeSpins} FREE SPIN{freeSpins !== 1 ? 'S' : ''} • 2× WINS!
            </span>
          )}
          {wildFighter !== null && (
            <span className="text-[11px] font-black text-yellow-200 bg-yellow-900/50 px-2 py-0.5 rounded-full">
              ⚡ WILD: {FIGHTERS[wildFighter].name.split(' ')[0]}
            </span>
          )}
          {streak >= 3 && (
            <span className="text-[11px] font-black text-orange-200 bg-orange-900/50 px-2 py-0.5 rounded-full">
              🔥 {streak}× STREAK • +50% BONUS!
            </span>
          )}
        </div>
      )}

      {/* ── Slot Grid ── */}
      <div className="px-3 pt-3 pb-2 max-w-sm mx-auto">
        <div
          className={`grid gap-1 p-2.5 rounded-2xl border-2 transition-colors duration-300 ${
            spinning ? 'border-purple-600 bg-gray-900/90' : 'border-gray-700 bg-gray-900'
          }`}
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {displayGrid.map((row, r) =>
            row.map((fId, c) => (
              <FighterCell
                key={`${r}-${c}`}
                fighterId={fId}
                isHighlighted={!spinning && highlighted.has(`${r},${c}`)}
                isSpinning={spinning && c >= stoppedCols}
                fighterImages={fighterImages}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="max-w-sm mx-auto px-3 space-y-2">

        {/* Bet selector */}
        <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-2.5">
          <span className="text-[11px] text-gray-500 font-bold w-7 flex-shrink-0">BET</span>
          <div className="flex gap-1 flex-1">
            {BET_OPTIONS.map(b => (
              <button key={b} onClick={() => setBet(b)} disabled={spinning}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  bet === b ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Spin button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSpin}
          disabled={!canSpin}
          className={`w-full py-5 rounded-2xl font-black text-2xl tracking-wide transition-all duration-200 ${
            freeSpins > 0
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
              : canSpin
              ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-500/30'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {spinning
            ? '🌀 SPINNING...'
            : freeSpins > 0
            ? `🎁 FREE SPIN (${freeSpins} left)`
            : '🎰 SPIN'}
        </motion.button>

        {/* Cash-out button */}
        {slotCoins >= COINS_PER_UFC && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleCashOut}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-green-800 hover:bg-green-700 text-green-100 transition-all"
          >
            💰 Cash Out → {Math.floor(slotCoins / COINS_PER_UFC)} UFC Coins
            <span className="text-green-400 text-xs ml-1 font-normal">
              ({slotCoins.toLocaleString()} slot coins)
            </span>
          </motion.button>
        )}

        {/* No coins hint */}
        {slotCoins < bet && freeSpins === 0 && (
          <p className="text-center text-xs text-gray-600">
            Exchange UFC Coins to get Slot Coins and start spinning!
          </p>
        )}
      </div>

      {/* ── Recent wins ticker ── */}
      {recentWins.length > 0 && !showWinOverlay && (
        <div className="max-w-sm mx-auto px-3 mt-3 space-y-1">
          {recentWins.slice(0, 2).map((rw, i) => (
            <div key={rw.ts}
              className="flex items-center justify-between bg-gray-900/80 rounded-lg px-3 py-1.5 text-[11px]"
              style={{ opacity: 1 - i * 0.35 }}>
              <span className="text-gray-400">{rw.wins[0]?.emoji} {rw.wins[0]?.type}</span>
              <span className="text-green-400 font-black">+{rw.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Bonus message flash ── */}
      <AnimatePresence>
        {bonusMsg && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={{   scale: 0.6, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-black px-8 py-6 rounded-3xl shadow-2xl text-center leading-snug">
              {bonusMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Win Overlay ── */}
      <AnimatePresence>
        {showWinOverlay && wins.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/75 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowWinOverlay(false)}
          >
            <motion.div
              initial={{ y: 60, scale: 0.9 }}
              animate={{ y: 0,  scale: 1 }}
              exit={{   y: 60, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl ${
                topWin?.tier === 'jackpot'
                  ? 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600'
                  : topWin?.tier === 'high'
                  ? 'bg-gradient-to-br from-purple-700 to-pink-700'
                  : 'bg-gradient-to-br from-green-800 to-emerald-700'
              }`}
            >
              <div className="text-5xl mb-1">
                {topWin?.tier === 'jackpot' ? '🏆' : topWin?.tier === 'high' ? '💎' : '🎉'}
              </div>
              <h2 className="text-xl font-black text-white mb-0.5">
                {topWin?.tier === 'jackpot' ? 'JACKPOT!!!' : 'YOU WIN!'}
              </h2>
              <div className="text-4xl font-black text-white mb-3">
                +{totalWin.toLocaleString()}
                <span className="text-lg font-bold"> coins</span>
              </div>

              <div className="space-y-1 mb-4 max-h-40 overflow-y-auto text-left">
                {wins.map((w, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
                    <span className="text-white/90 text-xs font-semibold truncate mr-2">{w.emoji} {w.type}</span>
                    <span className="text-white font-black text-xs whitespace-nowrap">{w.multiplier}× +{w.payout}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowWinOverlay(false)}
                className="w-full py-3 bg-black/25 hover:bg-black/40 rounded-xl font-bold text-white text-sm transition-all">
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exchange Modal ── */}
      <AnimatePresence>
        {showExchange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowExchange(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1,    y: 0 }}
              exit={{   scale: 0.85, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-5 w-full max-w-sm border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">💱 Exchange Coins</h3>
                <button onClick={() => setShowExchange(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-gray-800 rounded-xl p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rate</span>
                  <span className="text-white font-bold">1 UFC Coin = 1,000 Slot Coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your UFC Coins</span>
                  <span className="text-yellow-400 font-bold">{ufcCoins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Slot Coins</span>
                  <span className="text-purple-400 font-bold">{slotCoins.toLocaleString()}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1.5 block">UFC Coins to exchange</label>
                <input
                  type="number"
                  min={1}
                  max={ufcCoins}
                  value={exchangeAmt}
                  onChange={e => setExchangeAmt(Math.max(1, Math.min(ufcCoins, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-500 outline-none"
                />
                <p className="text-xs text-green-400 mt-1.5 font-semibold">
                  → {(exchangeAmt * COINS_PER_UFC).toLocaleString()} slot coins
                </p>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-4">
                {[1, 5, 10, 50].map(n => (
                  <button key={n}
                    onClick={() => setExchangeAmt(Math.min(n, ufcCoins))}
                    disabled={n > ufcCoins}
                    className="flex-1 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 disabled:opacity-30">
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowExchange(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-semibold text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleExchange}
                  disabled={loading || exchangeAmt < 1 || exchangeAmt > ufcCoins}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-black text-sm disabled:opacity-40 transition-colors">
                  {loading ? 'Processing…' : 'Exchange!'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Paytable Modal ── */}
      <AnimatePresence>
        {showPaytable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/85 overflow-y-auto p-4"
            onClick={() => setShowPaytable(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-5 w-full max-w-sm mx-auto my-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">📋 Paytable</h3>
                <button onClick={() => setShowPaytable(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {/* Win types */}
              <div className="space-y-1.5 text-xs mb-4">
                {[
                  { tier: 'jackpot', emoji: '🏆', name: 'GRAND JACKPOT (all 20 same)', mult: '1000×' },
                  { tier: 'jackpot', emoji: '👑', name: 'LEGENDARY SCATTER (10+)', mult: '300×' },
                  { tier: 'jackpot', emoji: '🌟', name: 'MEGA SCATTER (8+)', mult: '150×' },
                  { tier: 'jackpot', emoji: '👑', name: 'TRIPLE CHAMPIONS', mult: '60×' },
                  { tier: 'jackpot', emoji: '✖️', name: 'DOUBLE DIAGONAL', mult: '80×' },
                  { tier: 'high',   emoji: '✝️', name: 'CROSS PATTERN', mult: '40×' },
                  { tier: 'high',   emoji: '↘️', name: 'DIAGONAL STRIKE / COUNTER', mult: '30×' },
                  { tier: 'high',   emoji: '🔲', name: 'CORNER QUAD', mult: '25×' },
                  { tier: 'high',   emoji: '🎰', name: 'LINE JACKPOT (5 in row)', mult: '25×' },
                  { tier: 'high',   emoji: '🏅', name: 'CHAMPION COLUMN (3+ tier-3)', mult: '20×' },
                  { tier: 'high',   emoji: '💫', name: 'SCATTER WIN (5 same)', mult: '20×' },
                  { tier: 'high',   emoji: '✨', name: 'SUPER SCATTER (6 same)', mult: '50×' },
                  { tier: 'high',   emoji: '🥊', name: 'McGregor vs Khabib Rivalry', mult: '15×' },
                  { tier: 'high',   emoji: '🔥', name: 'FULL COLUMN (4 same)', mult: '12×' },
                  { tier: 'normal', emoji: '⭐', name: 'SCATTER HIT (4 same)', mult: '8×' },
                  { tier: 'normal', emoji: '💥', name: 'FOUR IN A ROW', mult: '8×' },
                  { tier: 'normal', emoji: '👊', name: 'COLUMN THREE', mult: '3×' },
                  { tier: 'normal', emoji: '⚡', name: 'THREE IN A ROW', mult: '2×' },
                  { tier: 'normal', emoji: '⬛', name: 'CHECKERED PATTERN', mult: '18×' },
                  { tier: 'normal', emoji: '🎯', name: 'NEAR-MISS KO (4 of 5 same)', mult: '5×' },
                ].map(item => (
                  <div key={item.name} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${
                    item.tier === 'jackpot' ? 'bg-yellow-900/40 border border-yellow-700/30' :
                    item.tier === 'high'    ? 'bg-purple-900/30' : 'bg-gray-800'
                  }`}>
                    <span className="text-white/90">{item.emoji} {item.name}</span>
                    <span className={`font-black ml-2 whitespace-nowrap ${
                      item.tier === 'jackpot' ? 'text-yellow-400' :
                      item.tier === 'high'    ? 'text-purple-300' : 'text-gray-300'
                    }`}>{item.mult}</span>
                  </div>
                ))}
              </div>

              {/* Fighters legend */}
              <div className="mb-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Fighter Tiers</p>
                <div className="grid grid-cols-3 gap-1">
                  {FIGHTERS.map(f => (
                    <div key={f.id} className="flex items-center gap-1 text-[10px]"
                      style={{ color: f.color }}>
                      <span>{f.emoji}</span>
                      <span className="truncate font-semibold">{f.name.split(' ')[0]}</span>
                      <span className="ml-auto text-gray-600">T{f.tier}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bonuses */}
              <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-xs text-gray-400 mb-4">
                <p>⚡ <strong className="text-white">Wild Fighter (3%):</strong> Substitutes for any fighter in win checks</p>
                <p>🎁 <strong className="text-white">Bonus Rolls (5%):</strong> 3 free spins awarded randomly</p>
                <p>🏆 <strong className="text-white">Jackpot Bonus:</strong> Any jackpot win = 5 free spins</p>
                <p>🔥 <strong className="text-white">Win Streak (3+):</strong> +50% multiplier on all wins</p>
                <p>💎 <strong className="text-white">Free Spins:</strong> All wins pay 2× and don't cost coins</p>
                <p>💱 <strong className="text-white">Rate:</strong> 1 UFC Coin = 1,000 Slot Coins</p>
              </div>

              <button onClick={() => setShowPaytable(false)}
                className="w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
                Let's Play!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
