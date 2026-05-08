import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

// ── Scoring reference ─────────────────────────────────────────────────────────
const SCORING = [
  { label: 'Correct Pick (Decision)',   pts: '+10 pts' },
  { label: 'Correct Pick (Submission)', pts: '+13 pts' },
  { label: 'Correct Pick (KO / TKO)',   pts: '+15 pts' },
  { label: 'Draw / No Contest',         pts: '+2 pts'  },
  { label: 'Wrong Pick',                pts: '0 pts'   },
  { label: 'Perfect Card Bonus',        pts: '+25 pts' },
];

const COIN_TIERS = [
  { min: 75, label: '75+ pts', coins: 50 },
  { min: 55, label: '55–74 pts', coins: 35 },
  { min: 40, label: '40–54 pts', coins: 20 },
  { min: 30, label: '30–39 pts', coins: 10 },
  { min: 20, label: '20–29 pts', coins: 5  },
  { min: 0,  label: '< 20 pts', coins: 0  },
];

// ── Result color helper ───────────────────────────────────────────────────────
function resultColor(result) {
  if (result === 'correct')   return 'text-green-400';
  if (result === 'incorrect') return 'text-red-400';
  if (result === 'draw' || result === 'nc') return 'text-yellow-400';
  return 'text-gray-400';
}

function resultLabel(result) {
  if (result === 'correct')   return '✅ Correct';
  if (result === 'incorrect') return '❌ Wrong';
  if (result === 'draw')      return '🤝 Draw';
  if (result === 'nc')        return '⛔ NC';
  return '⏳ Pending';
}

// ── HOW-TO-PLAY panel ─────────────────────────────────────────────────────────
function HowToPlay() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-black text-base mb-3 flex items-center gap-2">
          <span>📋</span> How it Works
        </h3>
        <ol className="space-y-2 text-sm text-gray-300">
          {[
            'Choose an upcoming UFC event from the Contests tab.',
            'Pick your fighter for each matchup on the card.',
            'You must select at least 3 fights to submit.',
            'After the event, your picks are automatically scored.',
            'Earn Fan Coins based on your total score!',
          ].map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-red-400 font-black flex-shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-black text-base mb-3 flex items-center gap-2">
          <span>⚡</span> Scoring
        </h3>
        <div className="space-y-1.5">
          {SCORING.map(s => (
            <div key={s.label} className="flex justify-between text-sm">
              <span className="text-gray-300">{s.label}</span>
              <span className="text-yellow-400 font-bold">{s.pts}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-black text-base mb-3 flex items-center gap-2">
          <span>🥊</span> Fan Coin Rewards
        </h3>
        <div className="space-y-1.5">
          {COIN_TIERS.map(t => (
            <div key={t.label} className="flex justify-between text-sm">
              <span className="text-gray-300">{t.label}</span>
              <span className={t.coins > 0 ? 'text-yellow-400 font-bold' : 'text-gray-500'}>
                {t.coins > 0 ? `🥊 +${t.coins}` : 'No reward'}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-600 pt-2 text-xs text-gray-400">
            Perfect card (all correct, min 3 picks): +25 bonus coins
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Contest card ──────────────────────────────────────────────────────────────
function ContestCard({ event, hasEntry, onSelect }) {
  const allDone = event.completedFights === event.totalFights && event.totalFights > 0;
  const partDone = event.completedFights > 0 && !allDone;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => !hasEntry && onSelect(event)}
      className={`rounded-xl border-2 overflow-hidden transition-all
        ${hasEntry
          ? 'border-green-600 opacity-80 cursor-default'
          : 'border-gray-700 hover:border-red-500 cursor-pointer hover:shadow-lg hover:shadow-red-900/20'
        }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm leading-tight">{event.eventName}</p>
          <p className="text-gray-400 text-xs mt-0.5">{event.eventDate} · {event.location || 'TBA'}</p>
        </div>
        {hasEntry ? (
          <span className="text-xs bg-green-700 text-green-100 font-bold px-2 py-1 rounded-full flex-shrink-0">
            ✅ Entered
          </span>
        ) : allDone ? (
          <span className="text-xs bg-gray-600 text-gray-300 font-bold px-2 py-1 rounded-full flex-shrink-0">
            Completed
          </span>
        ) : (
          <span className="text-xs bg-red-700 text-white font-bold px-2 py-1 rounded-full flex-shrink-0 animate-pulse">
            🔥 LIVE
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-400">
          <span>🥊 {event.totalFights} fights</span>
          {partDone && <span className="text-yellow-400">{event.completedFights} completed</span>}
        </div>
        {!hasEntry && !allDone && (
          <span className="text-red-400 text-xs font-bold">Pick Now →</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Entry result card ─────────────────────────────────────────────────────────
function EntryCard({ entry, onCheckScore }) {
  const correct   = entry.picks.filter(p => p.result === 'correct').length;
  const total     = entry.picks.length;
  const pending   = entry.picks.filter(p => p.result === 'pending').length;
  const isScored  = entry.status === 'scored';

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm">{entry.eventName}</p>
          <p className="text-gray-400 text-xs">{entry.eventDate}</p>
        </div>
        <div className="text-right">
          {isScored ? (
            <>
              <div className="text-yellow-400 font-black text-base">{entry.totalPoints} pts</div>
              {entry.fanCoinsEarned > 0 && (
                <div className="text-green-400 text-xs font-bold">+🥊{entry.fanCoinsEarned} earned</div>
              )}
            </>
          ) : (
            <span className="text-xs text-yellow-400 font-bold animate-pulse">⏳ Pending</span>
          )}
        </div>
      </div>

      {/* Picks */}
      <div className="divide-y divide-gray-800">
        {entry.picks.map((pick, i) => (
          <div key={i} className="px-4 py-2 flex items-center justify-between bg-gray-900">
            <div className="text-xs">
              <span className="text-white font-semibold">{pick.pickedFighter}</span>
              <span className="text-gray-500 ml-1">vs {pick.pickedFighter === pick.fighter1 ? pick.fighter2 : pick.fighter1}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {pick.pointsEarned > 0 && isScored && (
                <span className="text-yellow-400 font-bold">+{pick.pointsEarned}</span>
              )}
              <span className={resultColor(pick.result)}>{resultLabel(pick.result)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Score button if pending */}
      {!isScored && pending < total && (
        <div className="bg-gray-900 px-4 py-2 border-t border-gray-800">
          <button onClick={() => onCheckScore()} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
            ↻ Check Results
          </button>
        </div>
      )}

      {/* Score summary */}
      {isScored && (
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs">
          <span className="text-gray-400">{correct}/{total} correct</span>
          <span className="text-gray-400">
            {entry.picks.filter(p => p.method && (p.method.toLowerCase().includes('ko') || p.method.toLowerCase().includes('tko'))).length} KO/TKOs picked
          </span>
        </div>
      )}
    </div>
  );
}

// ── Draft view (pick fighters for an event) ───────────────────────────────────
function DraftView({ event, onSubmit, onBack, submitting }) {
  const [picks, setPicks] = useState({}); // { "fighter1 vs fighter2": pickedFighter }

  function togglePick(f1, f2, picked) {
    const key = `${f1}||${f2}`;
    setPicks(prev => {
      if (prev[key] === picked) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: picked };
    });
  }

  const pickedCount = Object.keys(picks).length;

  function buildSubmission() {
    return Object.entries(picks).map(([key, pickedFighter]) => {
      const [f1, f2] = key.split('||');
      const fight = event.fights.find(f => f.fighter1 === f1 && f.fighter2 === f2);
      return { fighter1: f1, fighter2: f2, pickedFighter, weightClass: fight?.weightClass || '' };
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
          ← Back
        </button>
        <div>
          <h2 className="text-white font-black text-base leading-tight">{event.eventName}</h2>
          <p className="text-gray-400 text-xs">{event.eventDate}</p>
        </div>
      </div>

      {/* Picks counter */}
      <div className="flex items-center justify-between mb-4 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
        <div>
          <p className="text-white font-bold text-sm">{pickedCount} / {event.fights.length} fights picked</p>
          <p className="text-gray-400 text-xs">Minimum 3 to submit</p>
        </div>
        <div className="flex gap-1">
          {event.fights.map((_, i) => {
            const key = `${event.fights[i].fighter1}||${event.fights[i].fighter2}`;
            return (
              <div key={i}
                className={`w-2 h-2 rounded-full transition-colors ${picks[key] ? 'bg-red-500' : 'bg-gray-600'}`} />
            );
          })}
        </div>
      </div>

      {/* Fight cards */}
      <div className="space-y-3 mb-6">
        {event.fights.map((fight, i) => {
          const key = `${fight.fighter1}||${fight.fighter2}`;
          const picked = picks[key];
          const isCompleted = fight.status === 'completed';

          return (
            <motion.div key={i}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                isCompleted ? 'opacity-50 cursor-not-allowed border-gray-700' : 'border-gray-700'
              }`}>
              {/* Weight class */}
              <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                  {fight.weightClass || 'Catchweight'}
                </span>
                {isCompleted && fight.winner && (
                  <span className="text-xs text-gray-400">Winner: {fight.winner}</span>
                )}
              </div>

              {/* Fighter selection */}
              <div className="grid grid-cols-2 divide-x divide-gray-700 bg-gray-900">
                {/* Red corner */}
                <button
                  disabled={isCompleted}
                  onClick={() => togglePick(fight.fighter1, fight.fighter2, fight.fighter1)}
                  className={`px-4 py-4 text-center transition-all group ${
                    isCompleted ? 'cursor-not-allowed' :
                    picked === fight.fighter1
                      ? 'bg-red-900/60 border-b-2 border-red-500'
                      : 'hover:bg-red-950/30'
                  }`}
                >
                  <div className="text-xs font-bold text-red-400 mb-1 uppercase tracking-wider">Red Corner</div>
                  <div className={`font-black text-sm leading-tight transition-colors ${
                    picked === fight.fighter1 ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>{fight.fighter1 || '—'}</div>
                  {picked === fight.fighter1 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="mt-1.5 inline-block text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                      ✓ PICKED
                    </motion.div>
                  )}
                </button>

                {/* Blue corner */}
                <button
                  disabled={isCompleted}
                  onClick={() => togglePick(fight.fighter1, fight.fighter2, fight.fighter2)}
                  className={`px-4 py-4 text-center transition-all group ${
                    isCompleted ? 'cursor-not-allowed' :
                    picked === fight.fighter2
                      ? 'bg-blue-900/60 border-b-2 border-blue-500'
                      : 'hover:bg-blue-950/30'
                  }`}
                >
                  <div className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Blue Corner</div>
                  <div className={`font-black text-sm leading-tight transition-colors ${
                    picked === fight.fighter2 ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>{fight.fighter2 || '—'}</div>
                  {picked === fight.fighter2 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="mt-1.5 inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                      ✓ PICKED
                    </motion.div>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Scoring preview */}
      <div className="bg-gray-800 rounded-xl p-3 mb-4 border border-gray-700">
        <p className="text-gray-400 text-xs font-semibold mb-1.5">Potential reward with {pickedCount} picks:</p>
        <div className="flex flex-wrap gap-2">
          {COIN_TIERS.filter(t => t.coins > 0).map(t => (
            <span key={t.label} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
              {t.label} → 🥊{t.coins}
            </span>
          ))}
        </div>
      </div>

      {/* Submit */}
      <motion.button
        onClick={() => pickedCount >= 3 && onSubmit(buildSubmission())}
        disabled={pickedCount < 3 || submitting}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-3 rounded-xl font-black text-base transition-all ${
          pickedCount >= 3 && !submitting
            ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 shadow-lg'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {submitting ? 'Submitting…' : pickedCount < 3 ? `Pick ${3 - pickedCount} more fight${3 - pickedCount !== 1 ? 's' : ''}` : `🥊 Submit ${pickedCount} Picks`}
      </motion.button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FantasyGame() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]                 = useState('contests'); // contests | entries | how
  const [contests, setContests]       = useState([]);
  const [myEntries, setMyEntries]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [draftEvent, setDraftEvent]   = useState(null);   // event being drafted
  const [successMsg, setSuccessMsg]   = useState('');
  const [errorMsg, setErrorMsg]       = useState('');

  // Fetch contests
  useEffect(() => {
    axios.get(`${API_URL}/fantasy/contests`)
      .then(r => setContests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch my entries
  const fetchEntries = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const r = await axios.get(`${API_URL}/fantasy/my-entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyEntries(r.data);
    } catch {}
  }, [currentUser]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Auto-score pending entries when switching to entries tab
  const checkScores = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const r = await axios.post(`${API_URL}/fantasy/score`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data.scored > 0) await fetchEntries();
    } catch {}
  }, [currentUser, fetchEntries]);

  function handleTabChange(t) {
    setTab(t);
    if (t === 'entries') checkScores();
    setDraftEvent(null);
  }

  async function handleSubmit(picks) {
    if (!currentUser) { setErrorMsg('Sign in to submit picks'); return; }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const token = await currentUser.getIdToken();
      await axios.post(`${API_URL}/fantasy/submit`, {
        eventName: draftEvent.eventName,
        eventDate: draftEvent.eventDate,
        picks,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(`Picks submitted for ${draftEvent.eventName}!`);
      setDraftEvent(null);
      await fetchEntries();
      setTimeout(() => setSuccessMsg(''), 5000);
      setTab('entries');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Submission failed');
    }
    setSubmitting(false);
  }

  const enteredEventNames = new Set(myEntries.map(e => e.eventName));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">UFC Fantasy Picks</h1>
        <p className="text-gray-500 text-sm mt-1">Pick fighters from real UFC events · Earn Fan Coins</p>
      </div>

      {/* Success / error banners */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm font-semibold px-4 py-3 rounded-xl">
            ✅ {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 bg-red-50 border border-red-300 text-red-800 text-sm font-semibold px-4 py-3 rounded-xl">
            ⚠️ {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft overlay */}
      {draftEvent ? (
        <div className="bg-gray-950 rounded-2xl p-4 border border-gray-700 shadow-2xl">
          <DraftView
            event={draftEvent}
            onSubmit={handleSubmit}
            onBack={() => setDraftEvent(null)}
            submitting={submitting}
          />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-6 bg-white shadow-sm">
            {[
              { id: 'contests', label: '🥊 Contests' },
              { id: 'entries',  label: '📋 My Picks' },
              { id: 'how',      label: '❓ How to Play' },
            ].map(t => (
              <button key={t.id} onClick={() => handleTabChange(t.id)}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  tab === t.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Contests tab ── */}
          {tab === 'contests' && (
            <div>
              {loading ? (
                <div className="text-center text-gray-400 py-12 animate-pulse">Loading contests…</div>
              ) : contests.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="font-semibold">No upcoming events found</p>
                  <p className="text-sm mt-1">Check back closer to event day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contests.map(event => (
                    <ContestCard
                      key={event.eventName}
                      event={event}
                      hasEntry={enteredEventNames.has(event.eventName)}
                      onSelect={setDraftEvent}
                    />
                  ))}
                </div>
              )}

              {!currentUser && (
                <div className="mt-6 text-center bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 font-semibold text-sm">Sign in to submit your picks and earn Fan Coins</p>
                  <button onClick={() => navigate('/')}
                    className="mt-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">
                    Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── My Entries tab ── */}
          {tab === 'entries' && (
            <div>
              {!currentUser ? (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="font-semibold">Sign in to see your picks</p>
                </div>
              ) : myEntries.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="font-semibold">No entries yet</p>
                  <p className="text-sm mt-1">Head to the Contests tab and make your first picks!</p>
                  <button onClick={() => setTab('contests')}
                    className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">
                    Browse Contests
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myEntries.map(entry => (
                    <EntryCard key={entry._id} entry={entry} onCheckScore={checkScores} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── How to play tab ── */}
          {tab === 'how' && <HowToPlay />}
        </>
      )}
    </div>
  );
}
