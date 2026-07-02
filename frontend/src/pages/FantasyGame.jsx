import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const ADMIN_EMAIL = 'yingsan1987@gmail.com';

const WEIGHT_CLASSES = [
  'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
  'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight", "Women's Featherweight",
  'Catchweight',
];

const METHODS = [
  { id: 'KO/TKO',     emoji: '💥', label: 'KO / TKO',   sub: 'Knockout finish' },
  { id: 'Submission', emoji: '🔒', label: 'Submission', sub: 'Tap or sleep' },
  { id: 'Decision',   emoji: '📊', label: 'Decision',   sub: 'Goes the distance' },
];

const CONF_LABELS = ['', 'Coin flip', 'Leaning', 'Confident', 'Strong read', 'Lock of the night'];

// ── small helpers ───────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function methodEmoji(m = '') {
  const s = m.toLowerCase();
  if (s.includes('ko') || s.includes('tko')) return '💥';
  if (s.includes('sub')) return '🔒';
  if (s.includes('dec')) return '📊';
  return '';
}

function resultColor(r) {
  if (r === 'correct')   return 'text-green-400';
  if (r === 'incorrect') return 'text-red-400';
  if (r === 'draw' || r === 'nc') return 'text-yellow-400';
  return 'text-gray-400';
}
function resultLabel(r) {
  if (r === 'correct')   return '✅ Correct';
  if (r === 'incorrect') return '❌ Wrong';
  if (r === 'draw')      return '🤝 Draw';
  if (r === 'nc')        return '⛔ NC';
  return '⏳ Pending';
}

// ── Fighter avatar (initials, corner-colored) ────────────────────────────────
function Avatar({ name, corner }) {
  const grad = corner === 'red'
    ? 'from-red-600 to-red-900'
    : 'from-blue-600 to-blue-900';
  return (
    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-white/10`}>
      {initials(name)}
    </div>
  );
}

// ── Community pick meter ─────────────────────────────────────────────────────
function CommunityMeter({ community, f1, f2 }) {
  const total = community?.total || 0;
  const f1Pct = community?.f1Pct ?? 50;
  const f2Pct = community?.f2Pct ?? 50;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[11px] font-bold mb-1">
        <span className="text-red-400">{f1Pct}%</span>
        <span className="text-gray-500">
          {total > 0 ? `${total} fan${total !== 1 ? 's' : ''} picked` : 'Be the first to pick'}
        </span>
        <span className="text-blue-400">{f2Pct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden bg-gray-700 flex">
        <div className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500" style={{ width: `${f1Pct}%` }} />
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500" style={{ width: `${f2Pct}%` }} />
      </div>
    </div>
  );
}

// ── THE STAR: featured next-fight pick card ──────────────────────────────────
function NextFightCard({ fight, onLockIn, submitting, isAuthed, onSignIn }) {
  const [picked, setPicked]     = useState(null);   // fighter name
  const [method, setMethod]     = useState(null);   // METHODS id
  const [conf, setConf]         = useState(3);

  // reset when the featured fight changes
  useEffect(() => { setPicked(null); setMethod(null); setConf(3); }, [fight?.fighter1, fight?.fighter2]);

  const potential = (10 + (method ? 5 : 0)) * conf;
  const ready = picked && method;

  if (fight.alreadyPicked) {
    return (
      <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-2xl p-6 border border-green-700 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-white font-black text-lg">You're locked in on this fight</p>
        <p className="text-gray-400 text-sm mt-1">{fight.fighter1} vs {fight.fighter2}</p>
        <p className="text-gray-500 text-xs mt-3">Check the next fight below, or view it under My Picks.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl"
    >
      {/* Event banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-800 to-gray-900 px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-black text-sm tracking-wide">{fight.eventName}</span>
          <span className="text-[11px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
            {fight.weightClass}
          </span>
        </div>
        <p className="text-red-100/80 text-xs mt-0.5">
          {fight.eventDate || 'Date TBA'}{fight.location ? ` · ${fight.location}` : ''}
        </p>
      </div>

      {/* Fighters */}
      <div className="px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          {[{ name: fight.fighter1, corner: 'red' }, { name: fight.fighter2, corner: 'blue' }].map(f => {
            const sel = picked === f.name;
            const ring = f.corner === 'red' ? 'ring-red-500 bg-red-900/40' : 'ring-blue-500 bg-blue-900/40';
            return (
              <button key={f.corner} onClick={() => setPicked(f.name)}
                className={`rounded-xl p-4 flex flex-col items-center gap-2 border-2 transition-all
                  ${sel ? `${ring} ring-2 border-transparent` : 'border-gray-700 hover:border-gray-500 bg-gray-800/40'}`}>
                <Avatar name={f.name} corner={f.corner} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${f.corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                  {f.corner} corner
                </span>
                <span className="text-white font-black text-sm text-center leading-tight">{f.name}</span>
                <AnimatePresence>
                  {sel && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="text-[10px] bg-white text-gray-900 font-black px-2 py-0.5 rounded-full">
                      ✓ MY PICK
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <div className="text-center text-gray-600 font-black text-xs my-2">— VS —</div>
        <CommunityMeter community={fight.community} f1={fight.fighter1} f2={fight.fighter2} />

        {/* Method */}
        <AnimatePresence>
          {picked && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <p className="text-gray-300 text-xs font-bold mt-5 mb-2">How does {picked.split(' ')[0]} win?</p>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map(m => {
                  const sel = method === m.id;
                  return (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`rounded-xl py-3 px-1 flex flex-col items-center gap-1 border-2 transition-all
                        ${sel ? 'border-yellow-500 bg-yellow-500/15' : 'border-gray-700 hover:border-gray-500 bg-gray-800/40'}`}>
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-white font-bold text-[11px] leading-tight text-center">{m.label}</span>
                      <span className="text-gray-500 text-[9px] text-center leading-tight">{m.sub}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence slider */}
        <AnimatePresence>
          {picked && method && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="flex items-center justify-between mt-5 mb-1">
                <span className="text-gray-300 text-xs font-bold">Confidence</span>
                <span className="text-yellow-400 text-xs font-black">{CONF_LABELS[conf]} · {conf}×</span>
              </div>
              <input type="range" min="1" max="5" value={conf} onChange={e => setConf(parseInt(e.target.value))}
                className="w-full accent-yellow-500" />
              <div className="flex justify-between text-[9px] text-gray-600 px-0.5">
                {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
              </div>
              <div className="mt-3 bg-gray-800/60 rounded-lg px-3 py-2 text-center">
                <span className="text-gray-400 text-xs">Potential score: </span>
                <span className="text-yellow-400 font-black text-sm">up to {potential} pts</span>
                <span className="text-gray-500 text-[10px] block">
                  10 (winner){method ? ' + 5 (method)' : ''} × {conf} confidence
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lock in */}
        {isAuthed ? (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => ready && onLockIn({ picked, method, conf })}
            disabled={!ready || submitting}
            className={`w-full mt-5 py-3.5 rounded-xl font-black text-base transition-all ${
              ready && !submitting
                ? 'bg-gradient-to-r from-yellow-500 to-red-600 text-white shadow-lg hover:from-yellow-400 hover:to-red-500'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}>
            {submitting ? 'Locking in…'
              : !picked ? 'Pick a fighter'
              : !method ? 'Pick a method'
              : '🔒 Lock In My Pick'}
          </motion.button>
        ) : (
          <button onClick={onSignIn}
            className="w-full mt-5 py-3.5 rounded-xl font-black text-base bg-red-600 text-white hover:bg-red-700">
            Sign in to lock in your pick
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Upcoming queue row ───────────────────────────────────────────────────────
function QueueRow({ fight, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-xl px-3 py-2.5 border transition-all flex items-center justify-between gap-2
        ${active ? 'border-red-500 bg-red-950/30' : 'border-gray-700 hover:border-gray-500 bg-gray-900'}`}>
      <div className="min-w-0">
        <p className="text-white text-xs font-bold truncate">
          {fight.fighter1} <span className="text-gray-500">vs</span> {fight.fighter2}
        </p>
        <p className="text-gray-500 text-[10px] truncate">{fight.eventName} · {fight.weightClass}</p>
      </div>
      {fight.alreadyPicked
        ? <span className="text-[10px] text-green-400 font-bold flex-shrink-0">✓ Picked</span>
        : <span className="text-[10px] text-red-400 font-bold flex-shrink-0">Pick →</span>}
    </button>
  );
}

// ── Stats / streak / badges ──────────────────────────────────────────────────
function StatsPanel({ stats, loading }) {
  if (loading) return <div className="text-center text-gray-400 py-12 animate-pulse">Loading stats…</div>;
  if (!stats)  return <div className="text-center text-gray-400 py-12">Sign in to track your stats.</div>;

  const tiles = [
    { label: 'Current streak', value: stats.currentStreak, emoji: '🔥' },
    { label: 'Best streak',    value: stats.bestStreak,    emoji: '🏅' },
    { label: 'Accuracy',       value: `${stats.accuracy}%`, emoji: '🎯' },
    { label: 'Coins earned',   value: stats.coins,         emoji: '🥊' },
  ];

  return (
    <div className="space-y-5">
      {stats.currentStreak >= 3 && (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl px-4 py-3 text-center">
          <p className="text-white font-black text-sm">🔥 {stats.currentStreak}-pick heater! Keep it rolling.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-2xl mb-1">{t.emoji}</div>
            <div className="text-white font-black text-2xl">{t.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-white font-black text-sm mb-3">🎖 Badges</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.badges?.map(b => (
            <div key={b.id}
              className={`rounded-xl p-3 border text-center transition-all ${
                b.earned ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800/40 opacity-70'
              }`}>
              <div className={`text-3xl mb-1 ${b.earned ? '' : 'grayscale opacity-50'}`}>{b.emoji}</div>
              <div className="text-white font-bold text-xs">{b.name}</div>
              <div className="text-gray-500 text-[10px] leading-tight mt-0.5">{b.desc}</div>
              {!b.earned && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(b.progress / b.target) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-500">{b.progress}/{b.target}</span>
                </div>
              )}
              {b.earned && <div className="text-[9px] text-yellow-400 font-bold mt-1">UNLOCKED</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── My picks entry card ──────────────────────────────────────────────────────
function EntryCard({ entry }) {
  const correct  = entry.picks.filter(p => p.result === 'correct').length;
  const total    = entry.picks.length;
  const isScored = entry.status === 'scored';
  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm">{entry.eventName}</p>
          <p className="text-gray-400 text-xs">{entry.eventDate}</p>
        </div>
        <div className="text-right">
          {isScored ? (
            <>
              <div className="text-yellow-400 font-black text-base">{entry.totalPoints} pts</div>
              {entry.fanCoinsEarned > 0 && <div className="text-green-400 text-xs font-bold">+🥊{entry.fanCoinsEarned}</div>}
            </>
          ) : <span className="text-xs text-yellow-400 font-bold animate-pulse">⏳ Pending</span>}
        </div>
      </div>
      <div className="divide-y divide-gray-800">
        {entry.picks.map((p, i) => (
          <div key={i} className="px-4 py-2.5 bg-gray-900 flex items-center justify-between">
            <div className="text-xs min-w-0">
              <span className="text-white font-semibold">{p.pickedFighter}</span>
              <span className="text-gray-500"> over {p.pickedFighter === p.fighter1 ? p.fighter2 : p.fighter1}</span>
              {p.pickedMethod && (
                <span className="text-gray-400 block text-[10px] mt-0.5">
                  {methodEmoji(p.pickedMethod)} {p.pickedMethod}
                  {p.confidence ? ` · ${p.confidence}× conf` : ''}
                  {p.methodCorrect ? ' · 🎯 method hit' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs flex-shrink-0">
              {p.pointsEarned > 0 && isScored && <span className="text-yellow-400 font-bold">+{p.pointsEarned}</span>}
              <span className={resultColor(p.result)}>{resultLabel(p.result)}</span>
            </div>
          </div>
        ))}
      </div>
      {isScored && (
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
          {correct}/{total} correct
        </div>
      )}
    </div>
  );
}

// ── How to play ──────────────────────────────────────────────────────────────
function HowToPlay() {
  const steps = [
    'Open the Next Fight tab to see the soonest upcoming bout.',
    'Pick who wins, then how they win: KO/TKO, Submission, or Decision.',
    'Set your confidence (1–5×) — higher confidence multiplies your score.',
    'Lock it in, then pick the next fight in the queue.',
    'After the fight, results score automatically. Correct picks build your streak and earn Fan Coins.',
  ];
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-black text-base mb-3">📋 How it works</h3>
        <ol className="space-y-2 text-sm text-gray-300">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-red-400 font-black flex-shrink-0">{i + 1}.</span><span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-black text-base mb-3">⚡ Scoring</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-300">Right winner</span><span className="text-yellow-400 font-bold">10 pts</span></div>
          <div className="flex justify-between"><span className="text-gray-300">Right method (bonus)</span><span className="text-yellow-400 font-bold">+5 pts</span></div>
          <div className="flex justify-between"><span className="text-gray-300">× Confidence</span><span className="text-yellow-400 font-bold">×1 to ×5</span></div>
          <div className="flex justify-between border-t border-gray-600 pt-1.5"><span className="text-gray-300">Perfect confident call</span><span className="text-yellow-400 font-bold">75 pts</span></div>
          <div className="flex justify-between"><span className="text-gray-300">Draw / No Contest</span><span className="text-yellow-400 font-bold">2 pts</span></div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-black text-base mb-2">🔥 Streaks & badges</h3>
        <p className="text-gray-400 text-sm">Correct picks in a row build your streak. A wrong pick resets it — draws leave it untouched. Hit milestones to unlock badges like Hot Streak, Finisher, and Unstoppable.</p>
      </div>
    </div>
  );
}

// ── Full-card draft (secondary mode, winner-only) ────────────────────────────
function DraftView({ event, onSubmit, onBack, submitting }) {
  const [picks, setPicks] = useState({});
  function togglePick(f1, f2, picked) {
    const key = `${f1}||${f2}`;
    setPicks(prev => {
      if (prev[key] === picked) { const n = { ...prev }; delete n[key]; return n; }
      return { ...prev, [key]: picked };
    });
  }
  const pickedCount = Object.keys(picks).length;
  function build() {
    return Object.entries(picks).map(([key, pickedFighter]) => {
      const [f1, f2] = key.split('||');
      const fight = event.fights.find(f => f.fighter1 === f1 && f.fighter2 === f2);
      return { fighter1: f1, fighter2: f2, pickedFighter, weightClass: fight?.weightClass || '' };
    });
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg border border-gray-700">← Back</button>
        <div><h2 className="text-white font-black text-base">{event.eventName}</h2><p className="text-gray-400 text-xs">{event.eventDate}</p></div>
      </div>
      <div className="mb-4 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
        <p className="text-white font-bold text-sm">{pickedCount} / {event.fights.length} picked · min 3</p>
      </div>
      <div className="space-y-3 mb-6">
        {event.fights.map((fight, i) => {
          const key = `${fight.fighter1}||${fight.fighter2}`;
          const picked = picks[key];
          const done = fight.status === 'completed';
          return (
            <div key={i} className={`rounded-xl border-2 overflow-hidden ${done ? 'opacity-50 border-gray-700' : 'border-gray-700'}`}>
              <div className="bg-gray-800 px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase">{fight.weightClass || 'Catchweight'}</div>
              <div className="grid grid-cols-2 divide-x divide-gray-700 bg-gray-900">
                {[fight.fighter1, fight.fighter2].map((fn, idx) => (
                  <button key={idx} disabled={done} onClick={() => togglePick(fight.fighter1, fight.fighter2, fn)}
                    className={`px-4 py-4 text-center ${picked === fn ? (idx === 0 ? 'bg-red-900/60' : 'bg-blue-900/60') : 'hover:bg-gray-800'}`}>
                    <div className={`text-xs font-bold mb-1 uppercase ${idx === 0 ? 'text-red-400' : 'text-blue-400'}`}>{idx === 0 ? 'Red' : 'Blue'} Corner</div>
                    <div className="text-white font-black text-sm">{fn || '—'}</div>
                    {picked === fn && <div className="mt-1 text-[10px] bg-white text-gray-900 inline-block px-2 py-0.5 rounded-full font-bold">✓ PICKED</div>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => pickedCount >= 3 && onSubmit(build())} disabled={pickedCount < 3 || submitting}
        className={`w-full py-3 rounded-xl font-black ${pickedCount >= 3 && !submitting ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
        {submitting ? 'Submitting…' : pickedCount < 3 ? `Pick ${3 - pickedCount} more` : `Submit ${pickedCount} Picks`}
      </button>
    </div>
  );
}

// ── Admin panel (add/replace event fight card) ───────────────────────────────
function AdminPanel({ currentUser, onEventCreated }) {
  const emptyFight = { redFighter: '', blueFighter: '', weightClass: 'Lightweight' };
  const [eventTitle, setEventTitle]       = useState('');
  const [eventDate, setEventDate]         = useState(new Date().toISOString().split('T')[0]);
  const [eventLocation, setEventLocation] = useState('');
  const [fights, setFights]               = useState([{ ...emptyFight }, { ...emptyFight }, { ...emptyFight }]);
  const [saving, setSaving]               = useState(false);
  const [msg, setMsg]                     = useState('');
  const updateFight = (i, f, v) => setFights(p => p.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const save = async () => {
    if (!eventTitle.trim()) { setMsg('⚠️ Event title is required'); return; }
    const valid = fights.filter(f => f.redFighter.trim() && f.blueFighter.trim());
    if (valid.length === 0) { setMsg('⚠️ Add at least one fight'); return; }
    setSaving(true); setMsg('');
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.post(`${API_URL}/upcoming-events/admin-add`,
        { eventTitle: eventTitle.trim(), eventDate, eventLocation: eventLocation.trim(), fights: valid },
        { headers: { Authorization: `Bearer ${token}` } });
      setMsg(`✅ ${res.data.message}`); onEventCreated();
    } catch (err) { setMsg(`❌ ${err.response?.data?.error || 'Failed to save'}`); }
    setSaving(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
        <h3 className="text-white font-black text-sm">🛠 Add / Replace Event</h3>
        <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. UFC 328" maxLength={80}
          className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 outline-none" />
          <input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Location"
            className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 outline-none" />
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-black text-sm">Fights ({fights.length})</h3>
          <button onClick={() => setFights(p => [...p, { ...emptyFight }])} className="text-xs bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold">+ Add</button>
        </div>
        <div className="space-y-3">
          {fights.map((f, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs font-bold">Fight #{i + 1}</span>
                {fights.length > 1 && <button onClick={() => setFights(p => p.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 text-xs">✕</button>}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input value={f.redFighter} onChange={e => updateFight(i, 'redFighter', e.target.value)} placeholder="🔴 Red"
                  className="w-full bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 outline-none" />
                <input value={f.blueFighter} onChange={e => updateFight(i, 'blueFighter', e.target.value)} placeholder="🔵 Blue"
                  className="w-full bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 outline-none" />
              </div>
              <select value={f.weightClass} onChange={e => updateFight(i, 'weightClass', e.target.value)}
                className="w-full bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 outline-none">
                {WEIGHT_CLASSES.map(wc => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      {msg && <div className={`text-sm font-semibold px-4 py-3 rounded-xl ${msg.startsWith('✅') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{msg}</div>}
      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl font-black bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
        {saving ? 'Saving…' : '💾 Save Fight Card'}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FantasyGame() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('next'); // next | entries | stats | card | how | admin
  const [nextFights, setNextFights] = useState([]);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [contests, setContests]     = useState([]);
  const [myEntries, setMyEntries]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draftEvent, setDraftEvent] = useState(null);
  const [toast, setToast]           = useState(null);
  const [errorMsg, setErrorMsg]     = useState('');

  const authHeader = useCallback(async () => {
    if (!currentUser) return {};
    const token = await currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }, [currentUser]);

  // Fetch next fights (with auth if available, to flag alreadyPicked)
  const fetchNext = useCallback(async () => {
    try {
      const headers = await authHeader();
      const r = await axios.get(`${API_URL}/fantasy/next-fight`, { headers });
      setNextFights(r.data.fights || []);
      // jump to first unpicked
      const firstOpen = (r.data.fights || []).findIndex(f => !f.alreadyPicked);
      setActiveIdx(firstOpen >= 0 ? firstOpen : 0);
    } catch { setNextFights([]); }
    finally { setLoading(false); }
  }, [authHeader]);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  const fetchStats = useCallback(async () => {
    if (!currentUser) { setStats(null); return; }
    setStatsLoading(true);
    try {
      const headers = await authHeader();
      // score first so streak/badges reflect latest results
      await axios.post(`${API_URL}/fantasy/score`, {}, { headers }).catch(() => {});
      const r = await axios.get(`${API_URL}/fantasy/stats`, { headers });
      setStats(r.data);
    } catch {}
    setStatsLoading(false);
  }, [currentUser, authHeader]);

  const fetchEntries = useCallback(async () => {
    if (!currentUser) return;
    try {
      const headers = await authHeader();
      await axios.post(`${API_URL}/fantasy/score`, {}, { headers }).catch(() => {});
      const r = await axios.get(`${API_URL}/fantasy/my-entries`, { headers });
      setMyEntries(r.data);
    } catch {}
  }, [currentUser, authHeader]);

  const fetchContests = useCallback(async () => {
    try { const r = await axios.get(`${API_URL}/fantasy/contests`); setContests(r.data); } catch {}
  }, []);

  useEffect(() => { if (currentUser) { fetchEntries(); fetchStats(); } }, [currentUser, fetchEntries, fetchStats]);

  function handleTab(t) {
    setTab(t); setDraftEvent(null); setErrorMsg('');
    if (t === 'entries') fetchEntries();
    if (t === 'stats')   fetchStats();
    if (t === 'card' && contests.length === 0) fetchContests();
  }

  // Lock in a single next-fight pick
  async function lockIn({ picked, method, conf }) {
    if (!currentUser) { setErrorMsg('Sign in to lock in picks'); return; }
    const fight = nextFights[activeIdx];
    setSubmitting(true); setErrorMsg('');
    try {
      const headers = await authHeader();
      await axios.post(`${API_URL}/fantasy/pick`, {
        eventName: fight.eventName, eventDate: fight.eventDate,
        fighter1: fight.fighter1, fighter2: fight.fighter2, weightClass: fight.weightClass,
        pickedFighter: picked, pickedMethod: method, confidence: conf,
      }, { headers });
      setToast(`🔒 Locked in: ${picked.split(' ')[0]} by ${method}!`);
      setTimeout(() => setToast(null), 3500);
      await fetchNext();
      fetchStats();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Could not lock in pick');
    }
    setSubmitting(false);
  }

  // Full-card submit
  async function submitCard(picks) {
    if (!currentUser) { setErrorMsg('Sign in to submit picks'); return; }
    setSubmitting(true); setErrorMsg('');
    try {
      const headers = await authHeader();
      await axios.post(`${API_URL}/fantasy/submit`,
        { eventName: draftEvent.eventName, eventDate: draftEvent.eventDate, picks },
        { headers });
      setToast(`✅ Card submitted for ${draftEvent.eventName}!`);
      setTimeout(() => setToast(null), 3500);
      setDraftEvent(null); await fetchEntries(); setTab('entries');
    } catch (err) { setErrorMsg(err.response?.data?.error || 'Submission failed'); }
    setSubmitting(false);
  }

  const enteredNames = new Set(myEntries.map(e => e.eventName));
  const activeFight = nextFights[activeIdx];

  const TABS = [
    { id: 'next',    label: '🥊 Next Fight' },
    { id: 'entries', label: '📋 My Picks' },
    { id: 'stats',   label: '🔥 Stats' },
    { id: 'card',    label: '🏆 Full Card' },
    { id: 'how',     label: '❓ How' },
    ...(currentUser?.email === ADMIN_EMAIL ? [{ id: 'admin', label: '🛠 Admin' }] : []),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-5">
        <div className="text-5xl mb-2">🥊</div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">UFC Fantasy Picks</h1>
        <p className="text-gray-500 text-sm mt-1">Call the winner and the finish · Build streaks · Earn Fan Coins</p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm font-bold px-4 py-3 rounded-xl text-center">
            {toast}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 bg-red-50 border border-red-300 text-red-800 text-sm font-semibold px-4 py-3 rounded-xl">
            ⚠️ {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-6 bg-white shadow-sm text-xs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTab(t.id)}
            className={`flex-1 py-2.5 font-bold transition-colors whitespace-nowrap px-1 ${
              tab === t.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Next Fight (star) ── */}
      {tab === 'next' && (
        <div>
          {loading ? (
            <div className="text-center text-gray-400 py-12 animate-pulse">Loading next fight…</div>
          ) : !activeFight ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-2">📅</div>
              <p className="font-semibold">No upcoming fights right now</p>
              <p className="text-sm mt-1">Check back closer to fight night.</p>
            </div>
          ) : (
            <>
              <NextFightCard
                fight={activeFight}
                onLockIn={lockIn}
                submitting={submitting}
                isAuthed={!!currentUser}
                onSignIn={() => navigate('/')}
              />

              {nextFights.length > 1 && (
                <div className="mt-6">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">Upcoming fight queue</p>
                  <div className="space-y-2">
                    {nextFights.map((f, i) => (
                      i !== activeIdx && (
                        <QueueRow key={`${f.fighter1}-${f.fighter2}-${i}`} fight={f} active={false} onClick={() => setActiveIdx(i)} />
                      )
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── My Picks ── */}
      {tab === 'entries' && (
        !currentUser ? (
          <div className="text-center text-gray-400 py-12"><div className="text-4xl mb-2">🔒</div><p className="font-semibold">Sign in to see your picks</p></div>
        ) : myEntries.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-2">📭</div><p className="font-semibold">No picks yet</p>
            <button onClick={() => setTab('next')} className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">Make your first pick</button>
          </div>
        ) : (
          <div className="space-y-4">{myEntries.map(e => <EntryCard key={e._id} entry={e} />)}</div>
        )
      )}

      {/* ── Stats ── */}
      {tab === 'stats' && (
        !currentUser
          ? <div className="text-center text-gray-400 py-12"><div className="text-4xl mb-2">🔒</div><p className="font-semibold">Sign in to track streaks & badges</p></div>
          : <StatsPanel stats={stats} loading={statsLoading} />
      )}

      {/* ── Full Card (secondary) ── */}
      {tab === 'card' && (
        draftEvent ? (
          <div className="bg-gray-950 rounded-2xl p-4 border border-gray-700">
            <DraftView event={draftEvent} onSubmit={submitCard} onBack={() => setDraftEvent(null)} submitting={submitting} />
          </div>
        ) : (
          <div>
            <p className="text-gray-500 text-sm mb-4">Prefer to pick a whole card at once? Choose an event and pick every winner.</p>
            {contests.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-2">📅</div><p className="font-semibold">No events loaded</p>
                <button onClick={fetchContests} className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Load events</button>
              </div>
            ) : (
              <div className="space-y-3">
                {contests.map(ev => {
                  const done = ev.completedFights === ev.totalFights && ev.totalFights > 0;
                  const has = enteredNames.has(ev.eventName);
                  return (
                    <button key={ev.eventName} disabled={has || done} onClick={() => setDraftEvent(ev)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${has ? 'border-green-600 opacity-70' : done ? 'border-gray-700 opacity-60' : 'border-gray-700 hover:border-red-500'}`}>
                      <div className="flex items-center justify-between">
                        <div><p className="text-gray-900 font-black text-sm">{ev.eventName}</p><p className="text-gray-500 text-xs">{ev.eventDate} · {ev.totalFights} fights</p></div>
                        <span className="text-xs font-bold">{has ? '✅ Entered' : done ? 'Completed' : 'Pick →'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ── How ── */}
      {tab === 'how' && <HowToPlay />}

      {/* ── Admin ── */}
      {tab === 'admin' && currentUser?.email === ADMIN_EMAIL && (
        <div className="bg-gray-950 rounded-2xl p-4 border border-gray-700">
          <AdminPanel currentUser={currentUser} onEventCreated={() => { fetchNext(); fetchContests(); }} />
        </div>
      )}

      {!currentUser && tab === 'next' && (
        <div className="mt-6 text-center bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 font-semibold text-sm">Sign in to lock in picks, build streaks, and earn Fan Coins</p>
          <button onClick={() => navigate('/')} className="mt-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">Sign In</button>
        </div>
      )}
    </div>
  );
}
