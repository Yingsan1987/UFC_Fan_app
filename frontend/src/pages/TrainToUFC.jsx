import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://ufc-fan-app-backend.onrender.com');

// ── constants ─────────────────────────────────────────────────────────────────

const WEIGHT_CLASSES = [
  'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
  'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
];

const OUTFIT_COLORS = [
  { name: 'Red',    value: '#DC143C' },
  { name: 'Blue',   value: '#0066CC' },
  { name: 'Green',  value: '#228B22' },
  { name: 'Black',  value: '#1a1a1a' },
  { name: 'Gold',   value: '#D4A017' },
  { name: 'Purple', value: '#6B21A8' },
];

const STAT_CONFIG = [
  { key: 'striking',  label: 'STR', fullLabel: 'Striking',  icon: '🥊', color: 'red',    desc: 'KO power & accuracy', drill: 'Bag Work' },
  { key: 'speed',     label: 'SPD', fullLabel: 'Speed',     icon: '⚡', color: 'yellow', desc: 'Footwork & reaction time', drill: 'Sprint Drills' },
  { key: 'stamina',   label: 'END', fullLabel: 'Stamina',   icon: '❤️', color: 'green',  desc: 'Fight endurance', drill: 'Road Work' },
  { key: 'grappling', label: 'TECH', fullLabel: 'Grappling', icon: '🤼', color: 'blue',   desc: 'Takedowns & submissions', drill: 'Mat Work' },
  { key: 'luck',      label: 'LCK', fullLabel: 'Luck',      icon: '🍀', color: 'emerald', desc: 'Critical hit chance', drill: 'Meditation' },
];

const COLOR_MAP = {
  red:     'from-red-600 to-red-800',
  yellow:  'from-yellow-500 to-orange-600',
  green:   'from-green-600 to-green-800',
  blue:    'from-blue-600 to-blue-800',
  emerald: 'from-emerald-500 to-teal-700',
};

const BAR_MAP = {
  red:     'bg-red-500',
  yellow:  'bg-yellow-400',
  green:   'bg-green-500',
  blue:    'bg-blue-500',
  emerald: 'bg-emerald-500',
};

// ── helpers ───────────────────────────────────────────────────────────────────

function StatBar({ value, color }) {
  return (
    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${BAR_MAP[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

function AvatarCircle({ name, outfitColor, size = 'md' }) {
  const sz = size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'sm' ? 'w-10 h-10 text-base' : 'w-16 h-16 text-xl';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-black text-white border-4 shadow-lg flex-shrink-0`}
      style={{ backgroundColor: outfitColor || '#DC143C', borderColor: outfitColor || '#DC143C' }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── mini-game overlays ────────────────────────────────────────────────────────

function BagWorkGame({ onComplete }) {
  const [targets, setTargets] = useState([]);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const done = useRef(false);

  useEffect(() => {
    const spawn = () => {
      const id = Date.now();
      const x = 10 + Math.random() * 70;
      const y = 10 + Math.random() * 70;
      setTargets(prev => [...prev.slice(-4), { id, x, y }]);
      setTimeout(() => setTargets(prev => prev.filter(t => t.id !== id)), 1200);
    };
    spawn();
    const si = setInterval(spawn, 900);
    const ti = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(si);
          clearInterval(ti);
          if (!done.current) { done.current = true; setTimeout(() => onComplete(hits + (hits > 2 ? 1 : 0)), 400); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hit = (id) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    setHits(h => h + 1);
  };

  return (
    <div className="relative h-48 bg-gray-900 rounded-xl border border-red-700 overflow-hidden">
      <div className="absolute top-2 left-3 text-xs text-gray-400">🥊 Hit the bags! <span className="text-white font-bold">{timeLeft}s</span></div>
      <div className="absolute top-2 right-3 text-xs text-yellow-400 font-bold">{hits} hits</div>
      {targets.map(t => (
        <motion.button key={t.id}
          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          onClick={() => hit(t.id)}
          className="absolute w-10 h-10 bg-red-600 rounded-full border-2 border-red-400 flex items-center justify-center text-white text-lg hover:bg-red-500 transition-colors"
          style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)' }}
        >
          🥊
        </motion.button>
      ))}
    </div>
  );
}

function SprintGame({ onComplete }) {
  const seq = useRef([1, 2, 3, 1, 2, 3, 2, 1].map((_, i) => i % 3 + 1));
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [error, setError] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const ti = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        clearInterval(ti);
        if (!done.current) { done.current = true; setTimeout(() => onComplete(step), 300); }
        return 0;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(ti);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (n) => {
    if (done.current) return;
    if (n === seq.current[step]) {
      const next = step + 1;
      setStep(next);
      setError(false);
      if (next >= seq.current.length) {
        done.current = true;
        onComplete(3);
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 400);
    }
  };

  return (
    <div className="h-48 bg-gray-900 rounded-xl border border-yellow-700 flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-gray-400">⚡ Press in order: <span className="text-yellow-300 font-bold">{seq.current.join(' → ')}</span></p>
      <div className="flex gap-3">
        {[1, 2, 3].map(n => (
          <button key={n} onClick={() => press(n)}
            className={`w-16 h-16 rounded-xl font-black text-2xl border-2 transition-all ${error ? 'bg-red-900 border-red-500' : n === seq.current[step] ? 'bg-yellow-500 border-yellow-300 text-black animate-pulse' : 'bg-gray-700 border-gray-600 text-white'}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-400">{step}/{seq.current.length} · {timeLeft}s left</div>
    </div>
  );
}

function RoadWorkGame({ onComplete }) {
  const [taps, setTaps] = useState(0);
  const needed = 8;
  const [timeLeft, setTimeLeft] = useState(5);
  const done = useRef(false);

  useEffect(() => {
    const ti = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        clearInterval(ti);
        if (!done.current) { done.current = true; setTimeout(() => onComplete(Math.min(3, Math.floor(taps / needed * 3) + (taps >= needed ? 1 : 0))), 300); }
        return 0;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(ti);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = () => {
    if (done.current) return;
    const next = taps + 1;
    setTaps(next);
    if (next >= needed) {
      done.current = true;
      onComplete(3);
    }
  };

  return (
    <div className="h-48 bg-gray-900 rounded-xl border border-green-700 flex flex-col items-center justify-center gap-4">
      <p className="text-xs text-gray-400">❤️ Tap fast! <span className="text-green-300 font-bold">{needed - taps > 0 ? `${needed - taps} more` : 'Done!'}</span> · {timeLeft}s</p>
      <motion.button whileTap={{ scale: 0.9 }} onClick={tap}
        className="w-24 h-24 bg-gradient-to-br from-green-600 to-green-900 rounded-full border-4 border-green-400 text-4xl shadow-lg active:shadow-green-500/50">
        🏃
      </motion.button>
      <div className="w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div className="h-full bg-green-500" animate={{ width: `${(taps / needed) * 100}%` }} />
      </div>
    </div>
  );
}

function MatWorkGame({ onComplete }) {
  const pattern = useRef(['🟦', '🟥', '🟩', '🟦'].slice(0, 4));
  const [input, setInput] = useState([]);
  const [showing, setShowing] = useState(true);
  const done = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setShowing(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const press = (s) => {
    if (showing || done.current) return;
    const next = [...input, s];
    setInput(next);
    const correct = pattern.current.slice(0, next.length);
    if (next.some((v, i) => v !== correct[i])) {
      done.current = true;
      onComplete(1);
      return;
    }
    if (next.length === pattern.current.length) {
      done.current = true;
      onComplete(3);
    }
  };

  return (
    <div className="h-48 bg-gray-900 rounded-xl border border-blue-700 flex flex-col items-center justify-center gap-3">
      {showing ? (
        <>
          <p className="text-xs text-gray-400">🤼 Memorise the pattern!</p>
          <div className="flex gap-2 text-3xl">{pattern.current.map((s, i) => <span key={i}>{s}</span>)}</div>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400">Repeat it: {input.map((s, i) => <span key={i}>{s}</span>)}</p>
          <div className="flex gap-3">
            {['🟦', '🟥', '🟩'].map(s => (
              <button key={s} onClick={() => press(s)} className="text-3xl w-14 h-14 bg-gray-800 rounded-xl border border-gray-600 hover:border-blue-400 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MeditationGame({ onComplete }) {
  const [result, setResult] = useState(null);
  const done = useRef(false);

  const roll = () => {
    if (done.current) return;
    done.current = true;
    const r = Math.random();
    const outcome = r > 0.7 ? 3 : r > 0.3 ? 2 : 1;
    setResult(outcome);
    setTimeout(() => onComplete(outcome), 1200);
  };

  return (
    <div className="h-48 bg-gray-900 rounded-xl border border-emerald-700 flex flex-col items-center justify-center gap-4">
      <p className="text-xs text-gray-400">🍀 Feel the energy... tap to channel luck</p>
      {result === null ? (
        <motion.button whileTap={{ scale: 0.85 }} onClick={roll}
          className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-full border-4 border-emerald-400 text-3xl shadow-lg">
          🍀
        </motion.button>
      ) : (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="text-4xl mb-1">{result === 3 ? '✨' : result === 2 ? '🌟' : '⭐'}</div>
          <p className="text-sm text-emerald-300 font-bold">{result === 3 ? 'Lucky!' : result === 2 ? 'Good energy' : 'Mild luck'}</p>
        </motion.div>
      )}
    </div>
  );
}

const MINI_GAMES = {
  striking:  BagWorkGame,
  speed:     SprintGame,
  stamina:   RoadWorkGame,
  grappling: MatWorkGame,
  luck:      MeditationGame,
};

// ── TrainCarSlot (simple display, not drag-drop) ──────────────────────────────

function TrainCarSlot({ fighter, isEmpty }) {
  if (isEmpty || !fighter) {
    return (
      <div className="flex-1 h-20 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center text-gray-600 text-xs">
        Empty
      </div>
    );
  }
  return (
    <div className="flex-1 h-20 bg-gray-800 border-2 border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1 p-2">
      <AvatarCircle name={fighter.name} outfitColor={fighter.outfitColor} size="sm" />
      <span className="text-xs text-gray-300 font-semibold truncate w-full text-center">{fighter.name}</span>
      <span className="text-xs text-gray-500">{fighter.weightClass || ''}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function TrainToUFC() {
  const { currentUser, getAuthToken } = useAuth();
  const navigate = useNavigate();

  const [gameState, setGameState]     = useState('loading');
  const [avatar, setAvatar]           = useState(null);
  const [train, setTrain]             = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [toast, setToast]             = useState(null);
  const [activeMiniGame, setActiveMiniGame] = useState(null); // stat key
  const [trainingResult, setTrainingResult] = useState(null);
  const [activeTab, setActiveTab]     = useState('train'); // 'train' | 'leaderboard'

  // Avatar builder state
  const [config, setConfig] = useState({
    name: '', weightClass: 'Lightweight', outfitColor: '#DC143C',
  });

  const socketRef = useRef(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── data fetching ──────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await getAuthToken();
      const { data } = await axios.get(`${API_URL}/train-to-ufc/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvatar(data.avatar);
      if (data.train) { setTrain(data.train); setGameState('train-active'); }
      else setGameState('training');
    } catch (err) {
      if (err.response?.status === 404) setGameState('avatar-builder');
      else setGameState('avatar-builder');
    }
  }, [currentUser, getAuthToken]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/train-to-ufc/leaderboard?sortBy=wins&limit=20`);
      setLeaderboard(data.leaderboard || []);
    } catch { setLeaderboard([]); }
  }, []);

  useEffect(() => {
    if (!currentUser) { setGameState('not-auth'); return; }
    fetchStatus();
    fetchLeaderboard();

    // Socket.io
    try {
      socketRef.current = io(`${SOCKET_URL}/train-to-ufc`, {
        transports: ['websocket', 'polling'], timeout: 5000,
        reconnection: true, reconnectionAttempts: 3,
      });
      socketRef.current.on('train-update', d => { if (d?.train) setTrain(d.train); });
      socketRef.current.on('fight-result', d => {
        if (d) showToast(`⚔️ ${d.winner?.name} defeated ${d.loser?.name}!`, 'info');
      });
    } catch { /* socket optional */ }

    return () => { try { socketRef.current?.disconnect(); } catch { /* ignore */ } };
  }, [currentUser, fetchStatus, fetchLeaderboard, showToast]);

  // ── avatar creation ────────────────────────────────────────────────────────

  const createAvatar = async () => {
    if (!config.name.trim()) { showToast('Enter a fighter name', 'error'); return; }
    setLoading(true);
    try {
      const token = await getAuthToken();
      const { data } = await axios.post(`${API_URL}/train-to-ufc/create-avatar`, config, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvatar(data.avatar);
      setGameState('training');
      showToast('Fighter created! Start training 💪');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create avatar', 'error');
    }
    setLoading(false);
  };

  // ── training ───────────────────────────────────────────────────────────────

  const handleMiniGameComplete = async (gain, stat) => {
    setActiveMiniGame(null);
    setLoading(true);
    try {
      const token = await getAuthToken();
      const { data } = await axios.post(`${API_URL}/train-to-ufc/train-stat`,
        { stat },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvatar(prev => prev ? {
        ...prev,
        stats: { ...prev.stats, [stat]: data.newValue },
        energy: data.energy,
        xp: data.xp,
        level: data.level,
        trainingSessions: data.trainingSessions,
        weeklyTrainSessions: data.weeklyTrainSessions,
      } : prev);
      setTrainingResult({ message: data.message, gain: data.gain, stat, newValue: data.newValue });
      showToast(data.message);
      setTimeout(() => setTrainingResult(null), 3000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Training failed', 'error');
    }
    setLoading(false);
  };

  // ── join train ─────────────────────────────────────────────────────────────

  const joinTrain = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const { data } = await axios.post(`${API_URL}/train-to-ufc/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrain(data.train);
      setAvatar(data.avatar || avatar);
      setGameState('train-active');
      showToast('You boarded the train! 🚂');
      if (socketRef.current && data.train?._id)
        socketRef.current.emit('join-train', { trainId: data.train._id });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join train', 'error');
    }
    setLoading(false);
  };

  const leaveTrain = async () => {
    if (!train) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      const { data } = await axios.post(`${API_URL}/train-to-ufc/leave-train`,
        { trainId: train._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvatar(data.avatar || avatar);
      setTrain(data.train || null);
      setGameState('training');
      showToast('You left the train');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave train', 'error');
    }
    setLoading(false);
  };

  // ── weekly schedule helpers ────────────────────────────────────────────────

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, 6=Sat
  const daysUntilWeekend = dayOfWeek === 0 ? 6 : dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const schedule = [
    { day: 'Mon', action: 'Train Stats', icon: '💪', done: dayOfWeek > 1 },
    { day: 'Tue', action: 'Train Stats', icon: '💪', done: dayOfWeek > 2 },
    { day: 'Wed', action: 'Train Stats', icon: '💪', done: dayOfWeek > 3 },
    { day: 'Thu', action: 'Train Stats', icon: '💪', done: dayOfWeek > 4 },
    { day: 'Fri', action: 'Train Stats', icon: '💪', done: dayOfWeek > 5 },
    { day: 'Sat', action: '🚂 Train Battle!', icon: '🚂', done: dayOfWeek > 6 },
    { day: 'Sun', action: 'Rest', icon: '😴', done: false },
  ];

  // ── render: not authenticated ──────────────────────────────────────────────

  if (gameState === 'not-auth' || !currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🚂</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Train to UFC</h2>
        <p className="text-gray-500 mb-6">Sign in to build your fighter and battle on the train!</p>
        <button onClick={() => navigate('/')}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700">
          Sign In
        </button>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // ── render: avatar builder ─────────────────────────────────────────────────

  if (gameState === 'avatar-builder') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🚂</div>
          <h1 className="text-3xl font-black text-gray-900">Train to UFC</h1>
          <p className="text-gray-500 text-sm mt-1">Build your fighter · Train daily · Battle on the train</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h2 className="text-lg font-black text-gray-800 mb-5">Create Your Fighter</h2>

          {/* Preview */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <AvatarCircle name={config.name} outfitColor={config.outfitColor} size="lg" />
            <div>
              <p className="font-black text-gray-900 text-lg">{config.name || 'Your Fighter'}</p>
              <p className="text-sm text-gray-500">{config.weightClass}</p>
              <p className="text-xs text-gray-400 mt-1">All stats start at 50 · Train to improve them</p>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Fighter Name</label>
            <input
              value={config.name}
              onChange={e => setConfig(p => ({ ...p, name: e.target.value }))}
              maxLength={20}
              placeholder="Enter your fighter's name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {/* Weight class */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Weight Class</label>
            <select
              value={config.weightClass}
              onChange={e => setConfig(p => ({ ...p, weightClass: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            >
              {WEIGHT_CLASSES.map(wc => <option key={wc} value={wc}>{wc}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">⚠️ Only same weight class fighters can battle</p>
          </div>

          {/* Outfit color */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Fighter Colour</label>
            <div className="flex gap-2">
              {OUTFIT_COLORS.map(c => (
                <button key={c.value} onClick={() => setConfig(p => ({ ...p, outfitColor: c.value }))}
                  className={`w-10 h-10 rounded-full border-4 transition-transform ${config.outfitColor === c.value ? 'border-gray-900 scale-110' : 'border-gray-300'}`}
                  style={{ backgroundColor: c.value }} title={c.name} />
              ))}
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }}
            onClick={createAvatar}
            disabled={loading || !config.name.trim()}
            className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg">
            {loading ? 'Creating…' : '🥊 Create Fighter & Start Training'}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── render: training phase ─────────────────────────────────────────────────

  if (gameState === 'training') {
    const energy = avatar?.energy ?? 3;
    const sessionsDone = avatar?.weeklyTrainSessions ?? 0;

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl ${
                toast.type === 'error' ? 'bg-red-600 text-white' :
                toast.type === 'info'  ? 'bg-blue-600 text-white' :
                'bg-green-600 text-white'
              }`}>
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <AvatarCircle name={avatar?.name} outfitColor={avatar?.outfitColor} />
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">{avatar?.name}</h1>
            <p className="text-sm text-gray-500">{avatar?.weightClass} · Level {avatar?.level || 1}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">XP</p>
            <p className="text-lg font-black text-yellow-600">{avatar?.xp || 0}</p>
          </div>
        </div>

        {/* Energy bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">⚡ Daily Energy</span>
            <span className={`text-sm font-black ${energy > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{energy}/3</span>
          </div>
          <div className="flex gap-2">
            {[0,1,2].map(i => (
              <div key={i} className={`flex-1 h-3 rounded-full ${i < energy ? 'bg-yellow-400' : 'bg-gray-200'}`} />
            ))}
          </div>
          {energy === 0 && <p className="text-xs text-gray-400 mt-2">Come back tomorrow for 3 more training sessions! 🌙</p>}
        </div>

        {/* Stats + training */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-800">Fighter Stats</h2>
            <span className="text-xs text-gray-400">{avatar?.trainingSessions || 0} sessions total</span>
          </div>

          <div className="space-y-3">
            {STAT_CONFIG.map(s => {
              const val = avatar?.stats?.[s.key] ?? 50;
              const canTrain = energy > 0 && !loading;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{s.icon}</span>
                  <div className="w-12 text-xs font-black text-gray-700">{s.label}</div>
                  <StatBar value={val} color={s.color} />
                  <span className="text-xs font-bold text-gray-600 w-7 text-right">{val}</span>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => canTrain && setActiveMiniGame(s.key)}
                    disabled={!canTrain}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      canTrain
                        ? `bg-gradient-to-r ${COLOR_MAP[s.color]} text-white hover:opacity-90 shadow-sm`
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    {s.drill}
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini-game modal */}
        <AnimatePresence>
          {activeMiniGame && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="w-full max-w-sm bg-gray-950 rounded-2xl border border-gray-700 p-5 shadow-2xl">
                {(() => {
                  const cfg = STAT_CONFIG.find(s => s.key === activeMiniGame);
                  const Game = MINI_GAMES[activeMiniGame];
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-white">{cfg?.icon} {cfg?.drill}</h3>
                        <button onClick={() => setActiveMiniGame(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
                      </div>
                      <Game onComplete={(gain) => handleMiniGameComplete(gain, activeMiniGame)} />
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Training result flash */}
        <AnimatePresence>
          {trainingResult && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-green-500 text-green-400 px-6 py-3 rounded-2xl font-black text-lg shadow-2xl">
              {STAT_CONFIG.find(s => s.key === trainingResult.stat)?.icon} +{trainingResult.gain} {trainingResult.stat.toUpperCase()}!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekly schedule */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-800">This Week's Schedule</h2>
            <span className="text-xs text-gray-400">{sessionsDone} sessions done</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {schedule.map((d, i) => {
              const isToday = weekDays[dayOfWeek] === d.day;
              return (
                <div key={i} className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${
                  isToday ? 'bg-red-50 border border-red-200' :
                  d.done   ? 'bg-green-50 border border-green-100 opacity-60' :
                  'bg-gray-50 border border-gray-100'
                }`}>
                  <span className="text-xs font-bold text-gray-500">{d.day}</span>
                  <span className="text-base">{d.icon}</span>
                  {isToday && <span className="text-xs text-red-500 font-bold text-center leading-tight">Today</span>}
                </div>
              );
            })}
          </div>
          {daysUntilWeekend > 0
            ? <p className="text-xs text-gray-400 mt-2 text-center">🚂 Train battle in {daysUntilWeekend} day{daysUntilWeekend !== 1 ? 's' : ''}</p>
            : <p className="text-xs text-red-500 mt-2 text-center font-bold">🚂 It's battle day! Join the train now!</p>
          }
        </div>

        {/* Join train CTA */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-5 text-center">
          <h3 className="text-white font-black text-lg mb-1">Ready to Battle? 🚂</h3>
          <p className="text-gray-400 text-sm mb-4">
            Join the moving train and fight other players. Last fighter standing wins big rewards!
          </p>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={joinTrain}
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50 transition-all shadow-lg">
            {loading ? 'Boarding…' : '🚂 Board the Train'}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── render: train active ───────────────────────────────────────────────────

  if (gameState === 'train-active' && train) {
    const occupants = [];
    (train.cars || []).forEach(car => {
      if (car.spot1?.avatarId) occupants.push({ car: car.carNumber, spot: 1, fighter: car.spot1.avatarId });
      if (car.spot2?.avatarId) occupants.push({ car: car.carNumber, spot: 2, fighter: car.spot2.avatarId });
    });
    const isOnTrain = avatar?.onTrain;
    const myFighter = occupants.find(o => {
      const f = o.fighter;
      return f && (typeof f === 'object' ? f._id?.toString() === avatar?._id?.toString() : f === avatar?._id?.toString());
    });

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl ${
                toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-5 bg-white shadow-sm">
          {[
            { id: 'train', label: '🚂 Train Battle' },
            { id: 'leaderboard', label: '🏆 Leaderboard' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${activeTab === t.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'train' && (
          <>
            {/* Status strip */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AvatarCircle name={avatar?.name} outfitColor={avatar?.outfitColor} size="sm" />
                  <div>
                    <p className="text-white font-bold text-sm">{avatar?.name}</p>
                    <p className="text-gray-400 text-xs">{avatar?.weightClass} · Lv{avatar?.level || 1}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-center">
                  <div><p className="text-green-400 font-black">{avatar?.wins || 0}</p><p className="text-gray-500 text-xs">W</p></div>
                  <div><p className="text-red-400 font-black">{avatar?.losses || 0}</p><p className="text-gray-500 text-xs">L</p></div>
                  <div><p className="text-yellow-400 font-black">{avatar?.trainTokens || 0}</p><p className="text-gray-500 text-xs">Tokens</p></div>
                </div>
              </div>

              {/* Stat mini-bars */}
              <div className="grid grid-cols-5 gap-1 mt-3">
                {STAT_CONFIG.map(s => {
                  const val = avatar?.stats?.[s.key] ?? 50;
                  return (
                    <div key={s.key} className="text-center">
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-0.5">
                        <div className={`h-full ${BAR_MAP[s.color]}`} style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Train cars */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-gray-800">🚂 The Train</h2>
                <span className="text-xs text-gray-400">{occupants.length}/{(train.cars || []).length * 2} spots filled</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(train.cars || []).map(car => (
                  <div key={car.carNumber} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8">#{car.carNumber}</span>
                    <TrainCarSlot
                      fighter={car.spot1?.avatarId && typeof car.spot1.avatarId === 'object' ? car.spot1.avatarId : null}
                      isEmpty={!car.spot1?.occupied}
                    />
                    <TrainCarSlot
                      fighter={car.spot2?.avatarId && typeof car.spot2.avatarId === 'object' ? car.spot2.avatarId : null}
                      isEmpty={!car.spot2?.occupied}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            {isOnTrain ? (
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-green-700 font-bold text-sm">✅ You're on the train!</p>
                  <p className="text-green-600 text-xs">Car #{avatar?.carNumber} · Spot {avatar?.spotNumber}</p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={leaveTrain} disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                  Leave Train
                </motion.button>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={joinTrain} disabled={loading}
                className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50 shadow-lg">
                {loading ? 'Joining…' : '🚂 Auto-Join Train'}
              </motion.button>
            )}

            {/* Back to training */}
            <button onClick={() => setGameState('training')}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              ← Back to Training
            </button>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h2 className="font-black text-gray-800 mb-3">🏆 Top Fighters</h2>
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No fighters yet — be the first!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((p, i) => {
                  const isMine = p._id?.toString() === avatar?._id?.toString();
                  return (
                    <div key={p._id || i}
                      className={`flex items-center gap-3 p-2 rounded-xl ${isMine ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                      <span className={`text-sm font-black w-7 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-500'}`}>
                        #{i + 1}
                      </span>
                      <AvatarCircle name={p.name} outfitColor={p.outfitColor} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{p.name} {isMine && '(You)'}</p>
                        <p className="text-xs text-gray-400">Lv{p.level} · {p.wins}W {p.losses}L</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-yellow-600">{p.trainTokens || 0} 🎫</p>
                        <p className="text-xs text-gray-400">streak {p.longestStreak || 0}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── render: eliminated ─────────────────────────────────────────────────────

  if (avatar?.eliminated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">😤</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">You Were Eliminated!</h2>
        <p className="text-gray-500 mb-2">{avatar.wins || 0}W · {avatar.losses || 0}L · {avatar.xp || 0} XP</p>
        <p className="text-gray-400 text-sm mb-6">Keep training — come back stronger next week!</p>
        <button onClick={() => setGameState('training')}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700">
          Back to Training
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
    </div>
  );
}
