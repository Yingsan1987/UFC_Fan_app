import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

// ── constants ─────────────────────────────────────────────────────────────────

const CAREER_STAGES = [
  { key: 'rookie',      label: 'Rookie',           icon: '🥋', color: 'gray'   },
  { key: 'preliminary', label: 'Preliminary Card',  icon: '⭐', color: 'blue'   },
  { key: 'mainCard',    label: 'Main Card',          icon: '🔥', color: 'orange' },
  { key: 'champion',    label: 'Champion',           icon: '🏆', color: 'gold'   },
];

const DAILY_TIPS = [
  'Train all 3 energy sessions daily — 4 days builds a stronger fighter.',
  "After transfer, your fighter's real UFC results count towards your ladder climb.",
  'Picking a fighter who fights frequently means faster progression.',
  'Champion wins earn 5 Fan Coins each — the best return in the game.',
  'Fan Coins accumulate across careers — every retired champion adds to your total.',
  "Check the Events page the day after a UFC event to see your fighter's result.",
  "A fighter on a winning streak is the best choice for Main Card & Champion stages.",
];

const WEEKLY_SCHEDULE = [
  { day: 'Mon', task: 'Train (3 sessions)', icon: '💪' },
  { day: 'Tue', task: 'Train (3 sessions)', icon: '💪' },
  { day: 'Wed', task: 'Train (3 sessions)', icon: '💪' },
  { day: 'Thu', task: 'Train (3 sessions)', icon: '💪' },
  { day: 'Fri', task: 'Transfer ready!',    icon: '🥊' },
  { day: 'Sat', task: 'UFC Fight Night',    icon: '📺' },
  { day: 'Sun', task: 'Check results',      icon: '🏅' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── helpers ───────────────────────────────────────────────────────────────────

function StatBar({ value, color }) {
  const colors = {
    red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
  };
  return (
    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className={colors[color] || 'bg-gray-400'}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%' }}
      />
    </div>
  );
}

function CareerLadderStep({ stage, isCurrent, isComplete, progress, target }) {
  const colorMap = {
    gray:   'border-gray-400 text-gray-500',
    blue:   'border-blue-500 text-blue-600',
    orange: 'border-orange-500 text-orange-600',
    gold:   'border-yellow-500 text-yellow-600',
  };
  const bgMap = {
    gray:   'bg-gray-100',
    blue:   'bg-blue-50',
    orange: 'bg-orange-50',
    gold:   'bg-yellow-50',
  };
  return (
    <div className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
      isCurrent ? `${colorMap[stage.color]} ${bgMap[stage.color]} shadow-md` :
      isComplete ? 'border-green-400 bg-green-50 opacity-70' :
      'border-gray-200 bg-white opacity-40'
    }`}>
      <span className="text-xl">{isComplete ? '✅' : stage.icon}</span>
      <span className={`text-xs font-bold text-center leading-tight ${isCurrent ? '' : isComplete ? 'text-green-700' : 'text-gray-400'}`}>
        {stage.label}
      </span>
      {isCurrent && target > 0 && (
        <span className="text-xs font-black">{progress}/{target}</span>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function RoadToUFC() {
  const { currentUser, getAuthToken } = useAuth();
  const navigate = useNavigate();

  const [gameStatus, setGameStatus] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tipIndex]                  = useState(Math.floor(Math.random() * DAILY_TIPS.length));
  const [showHowTo, setShowHowTo]   = useState(false);

  const today    = new Date();
  const dayIndex = today.getDay();
  const todayTag = DAY_NAMES[dayIndex];

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    (async () => {
      try {
        const token = await getAuthToken();
        const { data } = await axios.get(`${API_URL}/game/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGameStatus(data);
      } catch { /* 404 = not started yet, that's fine */ }
      setLoading(false);
    })();
  }, [currentUser, getAuthToken]);

  // ── derived state ──────────────────────────────────────────────────────────

  const gp  = gameStatus?.gameProgress;
  const rf  = gameStatus?.rookieFighter;
  const isInitialized = !!rf;
  const energy          = rf?.energy ?? 0;
  const sessionsDone    = rf?.trainingSessions ?? 0;
  const sessionsNeeded  = rf?.trainingGoal ?? 12;
  const isTransferred   = rf?.isTransferred ?? false;
  const fighterLevel    = gp?.fighterLevel ?? 'Preliminary Card';
  const levelWins       = gp?.levelWins ?? 0;
  const fanCoins        = gp?.fanCoin ?? 0;

  const levelTarget = { 'Preliminary Card': 5, 'Main Card': 3, 'Champion': 5 }[fighterLevel] ?? 5;
  const stageIndex  = CAREER_STAGES.findIndex(s =>
    s.key === 'preliminary' && fighterLevel === 'Preliminary Card' ||
    s.key === 'mainCard'    && fighterLevel === 'Main Card'        ||
    s.key === 'champion'    && fighterLevel === 'Champion'         ||
    (!isTransferred && s.key === 'rookie')
  );
  const currentStageIndex = isTransferred ? Math.max(1, stageIndex) : 0;

  // ── render: not authenticated ──────────────────────────────────────────────

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Road to UFC</h1>
        <p className="text-gray-500 mb-6">Build a rookie fighter · Transfer to a real UFC athlete · Climb the career ladder</p>
        <button onClick={() => navigate('/')}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg">
          Sign In to Play
        </button>

        {/* Preview cards */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            { icon: '💪', title: 'Train Daily', desc: '3 sessions/day to build your rookie' },
            { icon: '🥊', title: 'Transfer', desc: 'Pick a real UFC fighter to represent you' },
            { icon: '🏆', title: 'Climb Ladder', desc: 'Prelims → Main Card → Champion → Retire' },
          ].map(c => (
            <div key={c.title} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
              <div className="text-3xl mb-1">{c.icon}</div>
              <p className="font-bold text-xs text-gray-800">{c.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  // ── render: not started ────────────────────────────────────────────────────

  if (!isInitialized) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-gray-900">Road to UFC</h1>
          <p className="text-gray-500 text-sm mt-1">Your journey from rookie to champion starts here</p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="font-black text-gray-800 mb-4">How It Works</h2>
          <div className="space-y-3">
            {[
              { step: 1, icon: '💪', title: 'Train your Rookie (4 days)', desc: '3 sessions per day · Improve Striking, Grappling, Stamina & Defense' },
              { step: 2, icon: '🥊', title: 'Transfer to a real UFC fighter', desc: 'Choose from active fighters in your weight class' },
              { step: 3, icon: '📺', title: 'Watch real UFC events', desc: "Your fighter's real results count as your wins/losses" },
              { step: 4, icon: '🪜', title: 'Climb the ladder', desc: 'Preliminary Card → Main Card → Champion → Retire with coins' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{s.step}</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{s.icon} {s.title}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career earnings preview */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-5 mb-4">
          <h3 className="text-white font-black mb-3">💰 Perfect Career Earnings</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: 'Transfer Bonus',    coins: 100 },
              { label: 'Prelim wins (5)',   coins: 10  },
              { label: 'Main Card wins (3)',coins: 9   },
              { label: 'Champion wins (5)', coins: 25  },
            ].map(r => (
              <div key={r.label} className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                <span className="text-gray-300 text-xs">{r.label}</span>
                <span className="text-yellow-400 font-black text-xs">+{r.coins} 🥊</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-600 flex justify-between">
            <span className="text-gray-300 font-bold">Total per career</span>
            <span className="text-yellow-400 font-black">144 Fan Coins 🥊</span>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/game/road-to-ufc/play')}
          className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 shadow-lg">
          🥋 Start My Road to UFC
        </motion.button>
      </div>
    );
  }

  // ── render: active career ──────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Road to UFC</h1>
          <p className="text-sm text-gray-500">
            {isTransferred
              ? `${fighterLevel} · ${levelWins}/${levelTarget} wins`
              : `Training ${sessionsDone}/${sessionsNeeded} sessions`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Fan Coins</p>
          <p className="text-xl font-black text-yellow-600">🥊 {fanCoins}</p>
        </div>
      </div>

      {/* Career ladder */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="font-black text-gray-800 mb-3 text-sm">Career Ladder</h2>
        <div className="flex gap-2">
          {CAREER_STAGES.map((stage, i) => (
            <CareerLadderStep
              key={stage.key}
              stage={stage}
              isCurrent={i === currentStageIndex}
              isComplete={i < currentStageIndex}
              progress={i === currentStageIndex ? levelWins : 0}
              target={i === currentStageIndex ? levelTarget : 0}
            />
          ))}
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 to-red-700"
            initial={{ width: 0 }}
            animate={{ width: `${isTransferred ? (levelWins / levelTarget) * 100 : (sessionsDone / sessionsNeeded) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Today's action */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-5 mb-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-red-200 text-xs font-bold uppercase tracking-wide">Today — {todayTag}</p>
            <h3 className="text-white font-black text-lg leading-tight">
              {!isTransferred
                ? energy > 0 ? '💪 Train Now!' : '✅ Training Done Today'
                : '📺 Watch your fighter compete'}
            </h3>
          </div>
          {!isTransferred && (
            <div className="text-center">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < energy ? 'bg-yellow-300' : 'bg-red-900'}`} />
                ))}
              </div>
              <p className="text-red-200 text-xs mt-1">{energy}/3 energy</p>
            </div>
          )}
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/game/road-to-ufc/play')}
          className="w-full py-2.5 bg-white text-red-700 rounded-xl font-black hover:bg-red-50 transition-colors shadow-md">
          {!isTransferred
            ? energy > 0 ? 'Open Training Centre →' : 'Check Progress →'
            : 'Open Career Dashboard →'}
        </motion.button>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="font-black text-gray-800 mb-3 text-sm">Weekly Routine</h2>
        <div className="grid grid-cols-7 gap-1">
          {WEEKLY_SCHEDULE.map((d, i) => {
            const isToday = d.day === todayTag;
            const isPast  = i < dayIndex - (dayIndex === 0 ? -6 : 1) && !isToday;
            return (
              <div key={d.day} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl border ${
                isToday ? 'bg-red-50 border-red-200' :
                isPast   ? 'bg-green-50 border-green-100 opacity-60' :
                'bg-gray-50 border-gray-100'
              }`}>
                <span className="text-xs font-bold text-gray-500">{d.day}</span>
                <span className="text-base">{d.icon}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-center text-gray-500">
          <span className="bg-gray-50 rounded-lg px-2 py-1">💪 Mon–Fri: Train</span>
          <span className="bg-gray-50 rounded-lg px-2 py-1">📺 Sat: UFC events</span>
          <span className="bg-gray-50 rounded-lg px-2 py-1">🏅 Sun: Check results</span>
        </div>
      </div>

      {/* Fighter stats (if training phase) */}
      {!isTransferred && rf?.stats && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-800 text-sm">Rookie Stats</h2>
            <span className="text-xs text-gray-400">{sessionsDone}/{sessionsNeeded} sessions</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Striking',  key: 'striking',  color: 'red'   },
              { label: 'Grappling', key: 'grappling', color: 'blue'  },
              { label: 'Stamina',   key: 'stamina',   color: 'green' },
              { label: 'Defense',   key: 'defense',   color: 'purple'},
            ].map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600 w-16">{s.label}</span>
                <StatBar value={rf.stats[s.key] || 50} color={s.color} />
                <span className="text-xs font-bold text-gray-600 w-6 text-right">{rf.stats[s.key] || 50}</span>
              </div>
            ))}
          </div>
          {sessionsDone >= sessionsNeeded && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-green-700 font-bold text-sm">🎉 Training complete! Ready to transfer!</p>
            </div>
          )}
        </div>
      )}

      {/* Daily tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
        <p className="text-blue-800 text-xs font-bold uppercase tracking-wide mb-1">💡 Daily Tip</p>
        <p className="text-blue-700 text-sm">{DAILY_TIPS[tipIndex]}</p>
      </div>

      {/* How to play toggle */}
      <button onClick={() => setShowHowTo(v => !v)}
        className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mb-2">
        {showHowTo ? '▲' : '▼'} {showHowTo ? 'Hide' : 'Show'} How to Play
      </button>

      <AnimatePresence>
        {showHowTo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
              <div className="space-y-3">
                {[
                  { icon: '💪', title: 'Training Phase (4 days)', desc: 'Open the game and train 3 sessions per day. Each session costs 1 energy and improves your rookie stats (+1 to +3 random). Energy resets at midnight.' },
                  { icon: '🥊', title: 'Transfer (after 12 sessions)', desc: 'Choose a real UFC fighter in your weight class. Their real fight results become your in-game results.' },
                  { icon: '🪜', title: 'Climb the Ladder', desc: 'Win 5 fights at Preliminary → 3 at Main Card → reach Champion → retire after 5 champion wins.' },
                  { icon: '💰', title: 'Earn Fan Coins', desc: 'Prelim win = 2 coins, Main Card win = 3 coins, Champion win = 5 coins. Coins accumulate across all careers!' },
                ].map(s => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/game/road-to-ufc/play')}
        className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 shadow-lg">
        Open Full Game Dashboard →
      </motion.button>
    </div>
  );
}
