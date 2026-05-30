import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Info, X, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const ROWS = 4;
const COLS = 5;
const COINS_PER_UFC = 1000;
const BET_OPTIONS = [10, 25, 50, 100, 250, 500];
const ADMIN_EMAIL = 'yingsan1987@gmail.com';

// ─── Fighter symbols — 12 UFC legends ───────────────────────────
const FIGHTERS = [
  { id: 0,  name: 'Conor McGregor',        short: 'MC', color: '#fbbf24', bg: '#78350f', tier: 3, emoji: '🇮🇪' },
  { id: 1,  name: 'Khabib Nurmagomedov',   short: 'KH', color: '#6ee7b7', bg: '#064e3b', tier: 3, emoji: '🦅' },
  { id: 2,  name: 'Jon Jones',             short: 'JJ', color: '#c4b5fd', bg: '#3b0764', tier: 3, emoji: '🦁' },
  { id: 3,  name: 'Islam Makhachev',       short: 'IM', color: '#67e8f9', bg: '#0c4a6e', tier: 2, emoji: '🌊' },
  { id: 4,  name: 'Kamaru Usman',          short: 'KU', color: '#f9a8d4', bg: '#831843', tier: 2, emoji: '👑' },
  { id: 5,  name: 'Francis Ngannou',       short: 'FN', color: '#fdba74', bg: '#7c2d12', tier: 2, emoji: '💪' },
  { id: 6,  name: 'Israel Adesanya',       short: 'IA', color: '#93c5fd', bg: '#1e3a5f', tier: 2, emoji: '💀' },
  { id: 7,  name: 'Alexander Volkanovski', short: 'AV', color: '#fca5a5', bg: '#7f1d1d', tier: 1, emoji: '🦈' },
  { id: 8,  name: 'Charles Oliveira',      short: 'CO', color: '#bbf7d0', bg: '#14532d', tier: 1, emoji: '🌿' },
  { id: 9,  name: 'Alex Pereira',          short: 'AP', color: '#fda4af', bg: '#881337', tier: 1, emoji: '⚡' },
  { id: 10, name: 'Leon Edwards',          short: 'LE', color: '#d8b4fe', bg: '#581c87', tier: 1, emoji: '🎯' },
  { id: 11, name: 'Dustin Poirier',        short: 'DP', color: '#93c5fd', bg: '#1e40af', tier: 1, emoji: '💎' },
];

// Tier 3 = rare (1), Tier 2 = uncommon (2), Tier 1 = common (3)
const WEIGHTS     = FIGHTERS.map(f => f.tier === 3 ? 1 : f.tier === 2 ? 2 : 3);
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0);

function weightedRandom() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < FIGHTERS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return i; }
  return FIGHTERS.length - 1;
}
function makeGrid() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, weightedRandom));
}
function mostFrequent(arr) {
  const f = {}; arr.forEach(v => { f[v] = (f[v] || 0) + 1; });
  return Number(Object.entries(f).sort((a, b) => b[1] - a[1])[0][0]);
}

// ─── Build fighter image map from API data ───────────────────────
// Returns { [fighterId]: imageUrl }
function buildImageMap(apiData) {
  const map = {};
  const valid = (apiData || []).filter(f => f?.imageUrl);

  FIGHTERS.forEach(sf => {
    // 1. Exact full name
    const exact = valid.find(f => f.name?.toLowerCase() === sf.name.toLowerCase());
    if (exact) { map[sf.id] = exact.imageUrl; return; }

    // 2. Last name (e.g. "Nurmagomedov", "Adesanya")
    const lastName = sf.name.split(' ').pop().toLowerCase();
    const byLast = valid.find(f => f.name?.toLowerCase().includes(lastName));
    if (byLast) { map[sf.id] = byLast.imageUrl; return; }

    // 3. Any significant word (>3 chars) in fighter name
    const words = sf.name.toLowerCase().split(' ').filter(w => w.length > 3);
    const byWord = valid.find(f => words.some(w => f.name?.toLowerCase().includes(w)));
    if (byWord) { map[sf.id] = byWord.imageUrl; }
  });

  return map;
}

// ─── Win Evaluation ─────────────────────────────────────────────
function evaluateWins(grid, bet, wildId, streakBonus) {
  const wins = [];
  const highlighted = new Set();
  const key = (r, c) => `${r},${c}`;

  const isMatch = (a, b) =>
    wildId !== null && (a === wildId || b === wildId) ? true : a === b;

  const addWin = (type, cells, baseMultiplier, emoji, tier = 'normal') => {
    const mult = streakBonus ? Math.round(baseMultiplier * 1.5) : baseMultiplier;
    cells.forEach(([r, c]) => highlighted.add(key(r, c)));
    wins.push({ type, cells, multiplier: mult, payout: bet * mult, emoji, tier });
  };

  // 1. Horizontal paylines
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const base = grid[r][c]; let end = c + 1;
      while (end < COLS && isMatch(grid[r][end], base)) end++;
      const len = end - c;
      if (len >= 3) {
        const cells = Array.from({ length: len }, (_, i) => [r, c + i]);
        if (len === 5) addWin('LINE JACKPOT!',  cells, 25, '🎰', 'jackpot');
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
      const base = grid[r][c]; let end = r + 1;
      while (end < ROWS && isMatch(grid[end][c], base)) end++;
      const len = end - r;
      if (len >= 3) {
        const cells = Array.from({ length: len }, (_, i) => [r + i, c]);
        if (len === 4) addWin('Full Column!',  cells, 12, '🔥', 'high');
        else            addWin('Column Three!', cells,  3, '👊', 'normal');
      }
      r = end;
    }
  }

  // 3. Main diagonal ↘
  {
    const d = Array.from({ length: ROWS }, (_, i) => [i, i]);
    if (d.every(([r, c]) => isMatch(grid[r][c], grid[0][0])))
      addWin('Diagonal Strike!', d, 30, '↘️', 'high');
  }

  // 4. Anti-diagonal ↙
  {
    const d = Array.from({ length: ROWS }, (_, i) => [i, COLS - 1 - i]);
    if (d.every(([r, c]) => isMatch(grid[r][c], grid[0][COLS - 1])))
      addWin('Counter Diagonal!', d, 30, '↙️', 'high');
  }

  // 5. Double diagonal (X) — both diagonals same fighter
  {
    const d1 = Array.from({ length: ROWS }, (_, i) => [i, i]);
    const d2 = Array.from({ length: ROWS }, (_, i) => [i, COLS - 1 - i]);
    if (
      d1.every(([r, c]) => isMatch(grid[r][c], grid[0][0])) &&
      d2.every(([r, c]) => isMatch(grid[r][c], grid[0][COLS - 1])) &&
      isMatch(grid[0][0], grid[0][COLS - 1])
    ) {
      const seen = new Set();
      const cells = [...d1, ...d2].filter(([r, c]) => {
        const k = `${r},${c}`; if (seen.has(k)) return false; seen.add(k); return true;
      });
      addWin('DOUBLE DIAGONAL! ✖', cells, 80, '✖️', 'jackpot');
    }
  }

  // 6. Corner Quad
  {
    const corners = [[0, 0], [0, COLS - 1], [ROWS - 1, 0], [ROWS - 1, COLS - 1]];
    if (corners.every(([r, c]) => isMatch(grid[r][c], grid[0][0])))
      addWin('Corner Quad!', corners, 25, '🔲', 'high');
  }

  // 7. Cross pattern (mid row + mid col all same)
  {
    const mRow = 1, mCol = 2;
    const rF = grid[mRow][0], cF = grid[0][mCol];
    const rowOk = Array.from({ length: COLS }, (_, c) => grid[mRow][c]).every(f => isMatch(f, rF));
    const colOk = Array.from({ length: ROWS }, (_, r) => grid[r][mCol]).every(f => isMatch(f, cF));
    if (rowOk && colOk && isMatch(rF, cF)) {
      const cells = [
        ...Array.from({ length: COLS }, (_, c) => [mRow, c]),
        ...Array.from({ length: ROWS }, (_, r) => [r, mCol]).filter(([r]) => r !== mRow),
      ];
      addWin('Cross Pattern!', cells, 40, '✝️', 'high');
    }
  }

  // 8. Full board
  {
    if (grid.every(row => row.every(f => isMatch(f, grid[0][0])))) {
      const cells = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push([r, c]);
      addWin('GRAND JACKPOT!!!', cells, 1000, '🏆', 'jackpot');
    }
  }

  // 9. Scatter wins
  const counts = {};
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) { const f = grid[r][c]; (counts[f] = counts[f] || []).push([r, c]); }
  for (const [, cells] of Object.entries(counts)) {
    const n = cells.length;
    if      (n >= 10) addWin('LEGENDARY SCATTER!', cells, 300, '👑', 'jackpot');
    else if (n >= 8)  addWin('MEGA SCATTER!',       cells, 150, '🌟', 'jackpot');
    else if (n >= 6)  addWin('Super Scatter!',       cells,  50, '✨', 'high');
    else if (n >= 5)  addWin('Scatter Win!',          cells,  20, '💫', 'high');
    else if (n >= 4)  addWin('Scatter Hit!',          cells,   8, '⭐', 'normal');
  }

  // 10. Rivalry: McGregor (0) + Khabib (1) on same row
  for (let r = 0; r < ROWS; r++) {
    if (grid[r].includes(0) && grid[r].includes(1)) {
      const cells = grid[r].flatMap((f, c) => f === 0 || f === 1 ? [[r, c]] : []);
      addWin('McGregor vs Khabib! Rivalry!', cells, 15, '🥊', 'high');
    }
  }

  // 11. Triple Champions (all 3 tier-3 on same row)
  for (let r = 0; r < ROWS; r++) {
    if (grid[r].includes(0) && grid[r].includes(1) && grid[r].includes(2)) {
      const cells = grid[r].flatMap((f, c) => [0, 1, 2].includes(f) ? [[r, c]] : []);
      addWin('TRIPLE CHAMPIONS!', cells, 60, '👑', 'jackpot');
    }
  }

  // 12. Champion Column (3+ tier-3 in any column)
  for (let c = 0; c < COLS; c++) {
    const cells = Array.from({ length: ROWS }, (_, r) => [r, c]).filter(([r]) => FIGHTERS[grid[r][c]].tier === 3);
    if (cells.length >= 3) addWin('Champion Column!', cells, 20, '🏅', 'high');
  }

  // 13. Near-Miss KO (4 of 5 same in any row)
  for (let r = 0; r < ROWS; r++) {
    const freq = {}; grid[r].forEach(f => { freq[f] = (freq[f] || 0) + 1; });
    for (const [fId, cnt] of Object.entries(freq)) {
      if (cnt === 4) {
        const cells = grid[r].flatMap((f, c) => f === Number(fId) ? [[r, c]] : []);
        addWin('Near-Miss KO!', cells, 5, '🎯', 'normal');
      }
    }
  }

  // 14. Checkered (alternating rows dominated by same 2 fighters)
  {
    const r0 = mostFrequent(grid[0]), r2 = mostFrequent(grid[2]);
    const r1 = mostFrequent(grid[1]), r3 = mostFrequent(grid[3]);
    if (r0 === r2 && r1 === r3 && r0 !== r1) {
      const cells = [];
      [0, 2].forEach(r => grid[r].forEach((f, c) => { if (f === r0) cells.push([r, c]); }));
      [1, 3].forEach(r => grid[r].forEach((f, c) => { if (f === r1) cells.push([r, c]); }));
      if (cells.length >= 6) addWin('Checkered Pattern!', cells, 18, '⬛', 'normal');
    }
  }

  return { wins, highlighted };
}

// ─── Slot Cell with casino reel animation ───────────────────────
function SlotCell({ fighterId, isHighlighted, isSpinning, justStopped, spinFrame, fighterImages }) {
  const fighter = FIGHTERS[fighterId] ?? FIGHTERS[0];
  const imgSrc  = fighterImages?.[fighter.id];
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => { setImgOk(true); }, [fighterId]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-md select-none">

      {/* ── Reel content — key change triggers slide-in animation ── */}
      <motion.div
        key={isSpinning ? `sp-${spinFrame % FIGHTERS.length}-${fighterId}` : `st-${fighterId}`}
        className="absolute inset-0"
        initial={isSpinning ? { y: '-55%', opacity: 0.5 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.08, ease: 'easeOut' }}
      >
        {imgOk && imgSrc ? (
          <img
            src={imgSrc}
            alt={fighter.name}
            className="w-full h-full object-cover object-top"
            style={{
              filter: isSpinning ? 'brightness(0.55) blur(1.5px)' : 'brightness(1) blur(0px)',
              transition: 'filter 0.08s',
            }}
            onError={() => setImgOk(false)}
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-0.5"
            style={{
              backgroundColor: fighter.bg,
              filter: isSpinning ? 'brightness(0.55) blur(1px)' : 'brightness(1)',
              transition: 'filter 0.08s',
            }}
          >
            <span className="text-3xl leading-none">{fighter.emoji}</span>
            <span className="font-black text-[11px] leading-none mt-0.5" style={{ color: fighter.color }}>
              {fighter.short}
            </span>
            <span className="text-[9px] text-white/40 mt-0.5 w-full text-center px-1 truncate">
              {fighter.name.split(' ')[0]}
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Scanline highlight strip moving downward (reel motion) ── */}
      {isSpinning && (
        <motion.div
          className="absolute inset-x-0 pointer-events-none z-10"
          style={{
            height: '40%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)',
          }}
          animate={{ top: ['-40%', '140%'] }}
          transition={{ duration: 0.22, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* ── Column-stop flash ── */}
      <AnimatePresence>
        {justStopped && (
          <motion.div
            className="absolute inset-0 bg-white/35 pointer-events-none z-20 rounded-md"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── Win shimmer sweep ── */}
      {isHighlighted && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-md">
          <motion.div
            className="absolute inset-y-0 w-2/3"
            style={{
              background: 'linear-gradient(105deg, transparent 0%, rgba(251,191,36,0.55) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '250%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* ── Border ── */}
      <motion.div
        className="absolute inset-0 rounded-md pointer-events-none z-30"
        animate={
          isHighlighted
            ? { boxShadow: ['0 0 6px 2px rgba(251,191,36,0.5)', '0 0 16px 4px rgba(251,191,36,0.9)', '0 0 6px 2px rgba(251,191,36,0.5)'], borderColor: '#fbbf24' }
            : { boxShadow: '0 0 0px rgba(0,0,0,0)', borderColor: '#1f2937' }
        }
        transition={isHighlighted ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        style={{ border: '2px solid', borderRadius: '0.375rem' }}
      />
    </div>
  );
}

// ─── Decorative casino light strip ──────────────────────────────
function LightStrip({ count = 9, colors = ['#ef4444', '#fbbf24'] }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: colors[i % colors.length] }}
          animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function UFCSlots() {
  const navigate = useNavigate();
  const { currentUser, getAuthToken } = useAuth();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // ── Wallet ──
  const [ufcCoins, setUfcCoins]       = useState(0);
  const [slotCoins, setSlotCoins]     = useState(0);
  const [exchangeAmt, setExchangeAmt] = useState(1);

  // ── Game ──
  const [bet, setBet]             = useState(50);
  const [grid, setGrid]           = useState(() => makeGrid());
  const [spinning, setSpinning]   = useState(false);
  const [stoppedCols, setStoppedCols] = useState(COLS);
  const [spinFrame, setSpinFrame] = useState(0);
  const [justStoppedCols, setJustStoppedCols] = useState(new Set());
  const [wins, setWins]           = useState([]);
  const [highlighted, setHighlighted] = useState(new Set());
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [totalWin, setTotalWin]   = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [wildFighter, setWildFighter] = useState(null);
  const [streak, setStreak]       = useState(0);
  const [sessionNet, setSessionNet] = useState(0);
  const [recentWins, setRecentWins] = useState([]);
  const [jackpotFlash, setJackpotFlash] = useState(false);
  const [bonusMsg, setBonusMsg]   = useState(null);

  // ── UI ──
  const [loading, setLoading]           = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [fighterImages, setFighterImages] = useState({});

  // ── Grid sizing via ResizeObserver ──
  const gridContainerRef = useRef(null);
  const [gridDim, setGridDim]     = useState({ w: 320, h: 256 });

  useEffect(() => {
    const update = () => {
      const el = gridContainerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const avW = width  * 0.97;
      const avH = height * 0.97;
      const ratio = COLS / ROWS; // 5/4 = 1.25
      let w = avW, h = w / ratio;
      if (h > avH) { h = avH; w = h * ratio; }
      setGridDim({ w: Math.floor(w), h: Math.floor(h) });
    };
    update();
    const ro = new ResizeObserver(update);
    if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Refs ──
  const finalGridRef  = useRef(null);
  const spinInterval  = useRef(null);
  const colTimeouts   = useRef([]);

  // ── Load fighter images ──
  useEffect(() => {
    axios.get(`${API_URL}/fighters`)
      .then(res => setFighterImages(buildImageMap(res.data)))
      .catch(() => {});
  }, []);

  // ── Fetch UFC coin balance ──
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

  // ── Computed display grid (spinning columns show spinFrame-based fighter) ──
  const displayGrid = spinning
    ? Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) =>
          c < stoppedCols
            ? (finalGridRef.current?.[r][c] ?? 0)
            : (spinFrame + c * 4 + r * 3) % FIGHTERS.length
        )
      )
    : grid;

  const canSpin = !spinning && (isAdmin || freeSpins > 0 || slotCoins >= bet);

  // ── Spin handler ──
  const handleSpin = () => {
    if (!canSpin) return;
    const isFree = isAdmin || freeSpins > 0;

    if (!isAdmin) {
      if (freeSpins > 0) setFreeSpins(p => p - 1);
      else               setSlotCoins(p => p - bet);
    }

    const wild = Math.random() < 0.03 ? Math.floor(Math.random() * FIGHTERS.length) : null;
    setWildFighter(wild);

    const fg = makeGrid();
    finalGridRef.current = fg;

    setSpinning(true);
    setStoppedCols(0);
    setJustStoppedCols(new Set());
    setWins([]);
    setHighlighted(new Set());
    setShowWinOverlay(false);

    spinInterval.current = setInterval(() => setSpinFrame(f => f + 1), 80);

    // Stop each column with a staggered delay
    const stopDelays = [620, 840, 1060, 1280, 1500];
    stopDelays.forEach((delay, col) => {
      const t = setTimeout(() => {
        setStoppedCols(col + 1);
        setJustStoppedCols(prev => new Set([...prev, col]));
        setTimeout(() => setJustStoppedCols(prev => { const n = new Set(prev); n.delete(col); return n; }), 500);
      }, delay);
      colTimeouts.current.push(t);
    });

    // Resolve after all columns stopped
    setTimeout(() => {
      clearInterval(spinInterval.current);
      colTimeouts.current.forEach(clearTimeout);
      colTimeouts.current = [];
      setSpinning(false);
      setStoppedCols(COLS);
      setGrid(fg.map(row => [...row]));

      const effectiveBet = (isFree && !isAdmin) ? bet * 2 : bet;
      const { wins: w, highlighted: h } = evaluateWins(fg, effectiveBet, wild, streak >= 3);
      const winTotal = w.reduce((s, x) => s + x.payout, 0);

      setWins(w);
      setHighlighted(h);
      setTotalWin(winTotal);
      setSessionNet(p => p + winTotal - (isAdmin ? 0 : freeSpins > 0 ? 0 : bet));

      if (winTotal > 0) {
        setSlotCoins(p => p + winTotal);
        setStreak(p => p + 1);
        setRecentWins(p => [{ wins: w, total: winTotal, ts: Date.now() }, ...p.slice(0, 4)]);
        setShowWinOverlay(true);

        const hasJackpot = w.some(x => x.tier === 'jackpot');
        if (hasJackpot) {
          setJackpotFlash(true);
          setTimeout(() => setJackpotFlash(false), 900);
          if (freeSpins === 0 && !isAdmin) {
            setTimeout(() => {
              setFreeSpins(5);
              setBonusMsg('🏆 JACKPOT! 5 Free Spins Awarded!');
              setTimeout(() => setBonusMsg(null), 3500);
            }, 800);
          }
        }
      } else {
        setStreak(0);
      }

      // Random bonus spin — 5% chance
      if (Math.random() < 0.05 && freeSpins === 0 && !isAdmin) {
        setTimeout(() => {
          setFreeSpins(3);
          setBonusMsg('🎁 BONUS ROLLS! 3 Free Spins!');
          setTimeout(() => setBonusMsg(null), 3500);
        }, winTotal > 0 ? 1200 : 0);
      }
    }, 1700);
  };

  // ── Exchange UFC → Slot coins ──
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
      setUfcCoins(p => p - exchangeAmt);
      setSlotCoins(p => p + exchangeAmt * COINS_PER_UFC);
    } catch {}
    setLoading(false);
    setShowExchange(false);
  };

  // ── Cash out Slot → UFC coins ──
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
      setSlotCoins(p => p % COINS_PER_UFC);
    } catch {}
    setLoading(false);
  };

  // Cleanup
  useEffect(() => () => {
    clearInterval(spinInterval.current);
    colTimeouts.current.forEach(clearTimeout);
  }, []);

  // ── Not logged in ──
  if (!currentUser) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎰</div>
          <h2 className="text-2xl font-black text-white mb-2">UFC Slots</h2>
          <p className="text-gray-400 mb-6">Sign in to spin the reels!</p>
          <button onClick={() => navigate('/game')} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const topWin = wins.find(w => w.tier === 'jackpot') ?? wins.find(w => w.tier === 'high') ?? wins[0];
  const cellGap = Math.max(2, Math.floor(gridDim.w / 80));
  const cellW = Math.floor((gridDim.w - cellGap * (COLS - 1)) / COLS);
  const cellH = Math.floor((gridDim.h - cellGap * (ROWS - 1)) / ROWS);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

      {/* ── Jackpot flash overlay ── */}
      <AnimatePresence>
        {jackpotFlash && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            style={{ background: 'rgba(251,191,36,0.35)' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.6, 1, 0.3, 0] }}
            transition={{ duration: 0.9, times: [0, 0.2, 0.5, 0.75, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 via-red-950 to-gray-900 border-b border-red-900/50 px-3 py-2 flex items-center justify-between">
        <button onClick={() => navigate('/game')} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black tracking-widest text-red-400 uppercase leading-tight">🎰 UFC Slots 🎰</h1>
          <p className="text-[10px] text-gray-500">5 × 4 Fighter Grid • 14 Win Types</p>
        </div>
        <button onClick={() => setShowPaytable(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <Info size={20} />
        </button>
      </div>

      {/* ── Wallet bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[9px] text-gray-500 leading-none">UFC Coins</p>
            <p className="text-sm font-black text-yellow-400 leading-tight">🥊 {ufcCoins.toLocaleString()}</p>
          </div>
          {!isAdmin && (
            <button onClick={() => setShowExchange(true)}
              className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-[11px] rounded-md transition-colors">
              Exchange
            </button>
          )}
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-1.5 bg-purple-900/60 border border-purple-700 px-2.5 py-1 rounded-lg">
            <Shield size={13} className="text-purple-300" />
            <span className="text-[11px] font-black text-purple-200">ADMIN • FREE PLAY</span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[9px] text-gray-500 leading-none">Slot Coins</p>
            <p className="text-sm font-black text-purple-400 leading-tight">🪙 {slotCoins.toLocaleString()}</p>
          </div>
        )}

        <div className="text-right">
          <p className="text-[9px] text-gray-500 leading-none">Session</p>
          <p className={`text-sm font-black leading-tight ${sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionNet >= 0 ? '+' : ''}{sessionNet.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Status badges ── */}
      {(freeSpins > 0 || wildFighter !== null || streak >= 3) && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 px-2 py-1 bg-purple-950/70 border-b border-purple-800/40 flex-wrap">
          {freeSpins > 0 && (
            <span className="text-[10px] font-black text-purple-200 bg-purple-900 px-2 py-0.5 rounded-full">
              🎁 {freeSpins} FREE SPIN{freeSpins !== 1 ? 'S' : ''} • 2× WINS
            </span>
          )}
          {wildFighter !== null && (
            <span className="text-[10px] font-black text-yellow-200 bg-yellow-900/60 px-2 py-0.5 rounded-full">
              ⚡ WILD: {FIGHTERS[wildFighter]?.name.split(' ')[0]}
            </span>
          )}
          {streak >= 3 && (
            <span className="text-[10px] font-black text-orange-200 bg-orange-900/50 px-2 py-0.5 rounded-full">
              🔥 {streak}× STREAK • +50% BONUS
            </span>
          )}
        </div>
      )}

      {/* ── Machine casing + grid — takes all remaining space ── */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-2 py-1">

        {/* Machine chrome top */}
        <div className="w-full max-w-lg">
          <div className="bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-t-2xl px-3 pt-1 pb-0.5 border-t-2 border-x-2 border-gray-600">
            <LightStrip count={11} colors={['#ef4444', '#fbbf24', '#ef4444']} />
          </div>
        </div>

        {/* Machine body with grid */}
        <div
          className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-gray-950 border-x-2 border-gray-600 flex-1 min-h-0"
          style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)' }}
        >
          {/* Inner grid area */}
          <div
            ref={gridContainerRef}
            className="w-full h-full flex items-center justify-center p-2"
          >
            {/* Actual grid */}
            <div
              style={{
                width:  gridDim.w,
                height: gridDim.h,
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, ${cellW}px)`,
                gridTemplateRows:    `repeat(${ROWS}, ${cellH}px)`,
                gap: `${cellGap}px`,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: 8,
                padding: 4,
                boxShadow: spinning
                  ? '0 0 24px rgba(139,92,246,0.5), inset 0 0 16px rgba(0,0,0,0.7)'
                  : '0 0 12px rgba(0,0,0,0.6), inset 0 0 16px rgba(0,0,0,0.7)',
                transition: 'box-shadow 0.3s',
              }}
            >
              {displayGrid.map((row, r) =>
                row.map((fId, c) => {
                  const isSpinning = spinning && c >= stoppedCols;
                  return (
                    <SlotCell
                      key={`${r}-${c}`}
                      fighterId={fId}
                      isHighlighted={!spinning && highlighted.has(`${r},${c}`)}
                      isSpinning={isSpinning}
                      justStopped={justStoppedCols.has(c) && !spinning}
                      spinFrame={spinFrame}
                      fighterImages={fighterImages}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Machine chrome bottom */}
        <div className="w-full max-w-lg">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-2xl px-3 pb-1 pt-0.5 border-b-2 border-x-2 border-gray-600">
            <LightStrip count={11} colors={['#fbbf24', '#ef4444', '#fbbf24']} />
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2 space-y-1.5 max-w-lg mx-auto w-full">

        {/* Bet row */}
        <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-2.5 py-1.5">
          <span className="text-[10px] text-gray-500 font-bold w-6 flex-shrink-0">BET</span>
          <div className="flex gap-1 flex-1">
            {BET_OPTIONS.map(b => (
              <button key={b} onClick={() => setBet(b)} disabled={spinning}
                className={`flex-1 py-1 rounded-lg text-[11px] font-black transition-all ${
                  bet === b ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Spin button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSpin}
          disabled={!canSpin}
          className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide transition-all duration-200 relative overflow-hidden ${
            freeSpins > 0 || isAdmin
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : canSpin
              ? 'bg-gradient-to-r from-red-600 to-red-800 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          style={canSpin ? { boxShadow: freeSpins > 0 || isAdmin ? '0 4px 20px rgba(168,85,247,0.5)' : '0 4px 20px rgba(220,38,38,0.5)' } : {}}
        >
          {/* Button shine effect */}
          {canSpin && (
            <motion.div
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '400%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
          )}
          {spinning
            ? '🌀  SPINNING...'
            : isAdmin
            ? '🛠  ADMIN SPIN (FREE)'
            : freeSpins > 0
            ? `🎁  FREE SPIN  (${freeSpins} left)`
            : '🎰  SPIN'}
        </motion.button>

        {/* Cash out row */}
        <div className="flex items-center gap-2">
          {!isAdmin && slotCoins >= COINS_PER_UFC && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleCashOut}
              disabled={loading}
              className="flex-1 py-2 rounded-xl font-bold text-xs bg-green-800 hover:bg-green-700 text-green-100 transition-all">
              💰 Cash Out {Math.floor(slotCoins / COINS_PER_UFC)} UFC Coins
            </motion.button>
          )}
          {recentWins.length > 0 && (
            <div className={`${!isAdmin && slotCoins >= COINS_PER_UFC ? 'w-36 flex-shrink-0' : 'flex-1'} bg-gray-900 rounded-xl px-2 py-1.5`}>
              <p className="text-[9px] text-gray-600 leading-none">Last win</p>
              <p className="text-[11px] font-black text-green-400 truncate leading-tight">
                {recentWins[0].wins[0]?.emoji} +{recentWins[0].total.toLocaleString()}
              </p>
            </div>
          )}
          {!isAdmin && slotCoins < bet && freeSpins === 0 && (
            <p className="flex-1 text-center text-[10px] text-gray-600">
              Exchange UFC Coins to get Slot Coins
            </p>
          )}
        </div>
      </div>

      {/* ── Bonus message flash ── */}
      <AnimatePresence>
        {bonusMsg && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={{   scale: 0.5, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-black px-8 py-5 rounded-3xl shadow-2xl text-center leading-snug">
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
            className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowWinOverlay(false)}
          >
            <motion.div
              initial={{ y: 80, scale: 0.88 }}
              animate={{ y: 0,  scale: 1 }}
              exit={{   y: 80, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl ${
                topWin?.tier === 'jackpot'
                  ? 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600'
                  : topWin?.tier === 'high'
                  ? 'bg-gradient-to-br from-purple-700 via-violet-700 to-pink-700'
                  : 'bg-gradient-to-br from-green-800 to-emerald-700'
              }`}
            >
              {/* Shimmer on overlay */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <motion.div
                  className="absolute inset-y-0 w-1/2"
                  style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
                />
              </div>

              <div className="relative">
                <div className="text-5xl mb-1">
                  {topWin?.tier === 'jackpot' ? '🏆' : topWin?.tier === 'high' ? '💎' : '🎉'}
                </div>
                <h2 className="text-xl font-black text-white mb-0.5">
                  {topWin?.tier === 'jackpot' ? 'JACKPOT!!!' : 'YOU WIN!'}
                </h2>
                <div className="text-4xl font-black text-white mb-3">
                  +{totalWin.toLocaleString()}
                  <span className="text-lg font-bold opacity-80"> coins</span>
                </div>

                <div className="space-y-1 mb-4 max-h-44 overflow-y-auto text-left">
                  {wins.map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
                      <span className="text-white/90 text-xs font-semibold truncate mr-2">{w.emoji} {w.type}</span>
                      <span className="text-white font-black text-xs whitespace-nowrap">{w.multiplier}× +{w.payout}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => setShowWinOverlay(false)}
                  className="w-full py-3 bg-black/25 hover:bg-black/40 rounded-xl font-bold text-white text-sm transition-all">
                  Keep Spinning!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exchange Modal ── */}
      <AnimatePresence>
        {showExchange && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowExchange(false)}>
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1,    y: 0 }}
              exit={{   scale: 0.85, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-5 w-full max-w-sm border border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-white">💱 Exchange Coins</h3>
                <button onClick={() => setShowExchange(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 mb-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-400">Rate</span><span className="text-white font-bold">1 UFC = 1,000 Slot Coins</span></div>
                <div className="flex justify-between"><span className="text-gray-400">UFC Coins</span><span className="text-yellow-400 font-bold">{ufcCoins.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Slot Coins</span><span className="text-purple-400 font-bold">{slotCoins.toLocaleString()}</span></div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">UFC Coins to exchange</label>
                <input type="number" min={1} max={ufcCoins} value={exchangeAmt}
                  onChange={e => setExchangeAmt(Math.max(1, Math.min(ufcCoins, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-500 outline-none" />
                <p className="text-xs text-green-400 mt-1 font-semibold">→ {(exchangeAmt * COINS_PER_UFC).toLocaleString()} slot coins</p>
              </div>
              <div className="flex gap-1.5 mb-3">
                {[1, 5, 10, 50].map(n => (
                  <button key={n} onClick={() => setExchangeAmt(Math.min(n, ufcCoins))} disabled={n > ufcCoins}
                    className="flex-1 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 disabled:opacity-30">
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowExchange(false)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-semibold text-sm">Cancel</button>
                <button onClick={handleExchange} disabled={loading || exchangeAmt < 1 || exchangeAmt > ufcCoins}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/85 overflow-y-auto p-4"
            onClick={() => setShowPaytable(false)}>
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-5 w-full max-w-sm mx-auto my-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">📋 Paytable</h3>
                <button onClick={() => setShowPaytable(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
              </div>
              <div className="space-y-1 text-xs mb-4">
                {[
                  ['jackpot','🏆','GRAND JACKPOT (all 20 same)','1000×'],
                  ['jackpot','👑','LEGENDARY SCATTER (10+)','300×'],
                  ['jackpot','🌟','MEGA SCATTER (8+)','150×'],
                  ['jackpot','👑','TRIPLE CHAMPIONS','60×'],
                  ['jackpot','✖️','DOUBLE DIAGONAL','80×'],
                  ['high','✝️','CROSS PATTERN','40×'],
                  ['high','↘️','DIAGONAL STRIKE / COUNTER','30×'],
                  ['high','🔲','CORNER QUAD','25×'],
                  ['high','🎰','LINE JACKPOT (5 in a row)','25×'],
                  ['high','🏅','CHAMPION COLUMN','20×'],
                  ['high','💫','SCATTER WIN (5 same)','20×'],
                  ['high','✨','SUPER SCATTER (6 same)','50×'],
                  ['high','🥊','McGregor vs Khabib Rivalry','15×'],
                  ['high','🔥','FULL COLUMN (4)','12×'],
                  ['normal','⭐','SCATTER HIT (4 same)','8×'],
                  ['normal','💥','FOUR IN A ROW','8×'],
                  ['normal','⬛','CHECKERED PATTERN','18×'],
                  ['normal','🎯','NEAR-MISS KO (4 of 5)','5×'],
                  ['normal','👊','COLUMN THREE','3×'],
                  ['normal','⚡','THREE IN A ROW','2×'],
                ].map(([tier, emoji, name, mult]) => (
                  <div key={name} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${
                    tier === 'jackpot' ? 'bg-yellow-900/40 border border-yellow-700/30' :
                    tier === 'high'    ? 'bg-purple-900/30' : 'bg-gray-800'
                  }`}>
                    <span className="text-white/90">{emoji} {name}</span>
                    <span className={`font-black ml-2 whitespace-nowrap ${
                      tier === 'jackpot' ? 'text-yellow-400' :
                      tier === 'high'    ? 'text-purple-300' : 'text-gray-300'
                    }`}>{mult}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-xs text-gray-400 mb-4">
                <p>⚡ <strong className="text-white">Wild Fighter (3%):</strong> Substitutes for any fighter</p>
                <p>🎁 <strong className="text-white">Bonus Rolls (5%):</strong> 3 random free spins</p>
                <p>🏆 <strong className="text-white">Jackpot Bonus:</strong> Any jackpot = 5 free spins</p>
                <p>🔥 <strong className="text-white">Win Streak (3+):</strong> +50% on all multipliers</p>
                <p>💎 <strong className="text-white">Free Spins:</strong> 2× wins, no cost</p>
                <p>💱 <strong className="text-white">Rate:</strong> 1 UFC Coin = 1,000 Slot Coins</p>
              </div>
              <div className="mb-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Fighter Symbols (Tier = rarity)</p>
                <div className="grid grid-cols-2 gap-1">
                  {FIGHTERS.map(f => (
                    <div key={f.id} className="flex items-center gap-1.5 text-[10px] bg-gray-800 rounded-lg px-2 py-1">
                      <span>{f.emoji}</span>
                      <span className="flex-1 truncate font-semibold" style={{ color: f.color }}>{f.name.split(' ')[0]}</span>
                      <span className={`font-black ${f.tier === 3 ? 'text-yellow-400' : f.tier === 2 ? 'text-purple-400' : 'text-gray-400'}`}>T{f.tier}</span>
                    </div>
                  ))}
                </div>
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
