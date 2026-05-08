import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, MapPin, Trophy, Zap, ExternalLink, ChevronRight, Coins } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const GAMES = [
  { id: 'road-to-ufc', name: 'Road to UFC', emoji: '🥋', color: 'from-yellow-500 to-orange-600', desc: 'Build your career', route: '/game/road-to-ufc' },
  { id: 'train-to-ufc', name: 'Train to UFC', emoji: '🚂', color: 'from-red-600 to-red-800', desc: 'Last fighter standing', route: '/game/train-to-ufc' },
  { id: 'poker',       name: 'UFC Poker',    emoji: '🃏', color: 'from-green-600 to-green-800', desc: 'Texas Hold\'em', route: '/game/poker' },
  { id: 'fantasy',     name: 'UFC Fantasy',  emoji: '🏆', color: 'from-purple-600 to-purple-800', desc: 'Pick & earn coins', route: '/game/fantasy' },
];

function useCountdown(targetDateStr) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0, past: false });
  useEffect(() => {
    if (!targetDateStr) return;
    const tick = () => {
      const diff = new Date(targetDateStr) - new Date();
      if (diff <= 0) { setCountdown(c => ({ ...c, past: true })); return; }
      setCountdown({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000)  / 60000),
        secs:  Math.floor((diff % 60000)    / 1000),
        past:  false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);
  return countdown;
}

function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center bg-black/40 rounded-xl px-3 py-2 min-w-[56px]">
      <span className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-gray-400 text-xs uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [nextEvent, setNextEvent] = useState(null);
  const [news, setNews] = useState([]);
  const [fanCoins, setFanCoins] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const countdown = useCountdown(nextEvent?.eventDate);

  useEffect(() => {
    axios.get(`${API_URL}/upcoming-events`)
      .then(r => {
        const events = r.data;
        if (events?.length) setNextEvent(events[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingEvent(false));

    axios.get(`${API_URL}/news?limit=4&page=1`)
      .then(r => setNews((r.data.articles || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    currentUser.getIdToken().then(token =>
      axios.get(`${API_URL}/fancoins/poker-status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setFanCoins(r.data.fanCoin ?? 0))
        .catch(() => {})
    );
  }, [currentUser]);

  const mainFight = nextEvent?.fights?.[0];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-12">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-300 text-sm font-semibold">UFC Fan App</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                🥊 FIGHT NIGHT<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                  STARTS HERE
                </span>
              </h1>
              <p className="text-gray-400 mt-3 text-base sm:text-lg max-w-xl mx-auto">
                Games, fantasy picks, live chat, news — your ultimate UFC experience.
              </p>
            </motion.div>

            {/* User greeting */}
            {currentUser && (
              <motion.div variants={fadeUp}
                className="flex justify-center mb-6">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm">
                    {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      Welcome back, {currentUser.displayName || 'Fighter'}!
                    </p>
                    {fanCoins !== null && (
                      <p className="text-yellow-400 text-xs font-semibold">🥊 {fanCoins.toLocaleString()} Fan Coins</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next event countdown */}
            {nextEvent && !loadingEvent && (
              <motion.div variants={fadeUp}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Next Event</span>
                </div>
                <h2 className="text-white font-black text-lg sm:text-xl leading-tight mb-0.5">
                  {nextEvent.eventName}
                </h2>
                <div className="flex items-center gap-3 text-gray-400 text-xs mb-4 flex-wrap">
                  {nextEvent.eventDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{nextEvent.eventDate}
                    </span>
                  )}
                  {nextEvent.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{nextEvent.location}
                    </span>
                  )}
                </div>

                {/* Countdown */}
                {!countdown.past && (
                  <div className="flex gap-2 mb-4">
                    <CountdownBox value={countdown.days}  label="Days"  />
                    <CountdownBox value={countdown.hours} label="Hrs"   />
                    <CountdownBox value={countdown.mins}  label="Mins"  />
                    <CountdownBox value={countdown.secs}  label="Secs"  />
                  </div>
                )}

                {/* Main event fighter cards */}
                {mainFight && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-red-900/50 rounded-xl p-3 text-center border border-red-700/30">
                      <div className="text-xs text-red-300 font-bold uppercase mb-0.5">Red Corner</div>
                      <div className="text-white font-black text-sm">{mainFight.fighter1 || '—'}</div>
                    </div>
                    <div className="text-yellow-400 font-black text-sm">VS</div>
                    <div className="flex-1 bg-blue-900/50 rounded-xl p-3 text-center border border-blue-700/30">
                      <div className="text-xs text-blue-300 font-bold uppercase mb-0.5">Blue Corner</div>
                      <div className="text-white font-black text-sm">{mainFight.fighter2 || '—'}</div>
                    </div>
                  </div>
                )}

                <button onClick={() => navigate('/events')}
                  className="mt-3 text-sm text-red-300 hover:text-red-200 flex items-center gap-1 font-semibold">
                  View full card <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {loadingEvent && (
              <div className="max-w-2xl mx-auto h-36 rounded-2xl bg-white/10 animate-pulse" />
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Quick CTA buttons ─────────────────────────────────── */}
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Events',    emoji: '📅', route: '/events'     },
            { label: 'Fighters',  emoji: '🥊', route: '/fighters'   },
            { label: 'Rankings',  emoji: '🏆', route: '/ranking'    },
            { label: 'Predict',   emoji: '🎯', route: '/prediction' },
          ].map(item => (
            <motion.button key={item.route} variants={fadeUp}
              onClick={() => navigate(item.route)} whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center gap-1.5 bg-white rounded-2xl shadow-md border border-gray-100 py-4 px-2 hover:shadow-lg hover:border-red-200 transition-all group">
              <span className="text-2xl group-hover:scale-110 transition-transform">{item.emoji}</span>
              <span className="text-xs font-bold text-gray-700">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ── Games ─────────────────────────────────────────────── */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-600" /> Games
            </h2>
            <button onClick={() => navigate('/game')}
              className="text-sm text-red-600 font-semibold flex items-center gap-1 hover:text-red-700">
              All games <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GAMES.map(g => (
              <motion.button key={g.id} variants={fadeUp}
                onClick={() => navigate(g.route)} whileTap={{ scale: 0.97 }}
                className={`bg-gradient-to-br ${g.color} rounded-2xl p-4 text-left shadow-lg hover:shadow-xl transition-all group`}>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{g.emoji}</div>
                <div className="text-white font-black text-sm leading-tight">{g.name}</div>
                <div className="text-white/70 text-xs mt-0.5">{g.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── Latest News ───────────────────────────────────────── */}
        {news.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                📰 Latest News
              </h2>
              <button onClick={() => navigate('/news')}
                className="text-sm text-red-600 font-semibold flex items-center gap-1 hover:text-red-700">
                All news <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {news.map((article, i) => (
                <motion.a key={article.url || i} variants={fadeUp}
                  href={article.url} target="_blank" rel="noopener noreferrer"
                  className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all flex gap-0 flex-col">
                  {article.image && (
                    <div className="h-36 overflow-hidden">
                      <img src={article.image} alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div className="p-4 flex-1">
                    <p className="text-xs text-gray-400 mb-1">
                      {article.sourceName || article.source} · {new Date(article.publishedAt).toLocaleDateString()}
                    </p>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-red-700 transition-colors">
                      {article.title}
                    </h3>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Community links ───────────────────────────────────── */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: '💬 Community Forums', desc: 'Discuss fights with other fans', route: '/forums', color: 'from-blue-600 to-blue-800' },
            { label: '🔴 Live Chat',         desc: 'Chat during fight events',      route: '/live-chat', color: 'from-red-600 to-red-800' },
          ].map(c => (
            <motion.button key={c.route} variants={fadeUp}
              onClick={() => navigate(c.route)} whileTap={{ scale: 0.97 }}
              className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-all group`}>
              <div className="text-white font-black text-base">{c.label}</div>
              <div className="text-white/70 text-sm mt-0.5">{c.desc}</div>
              <div className="mt-3 text-white/80 text-xs flex items-center gap-1 font-semibold">
                Join now <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </motion.section>

        {/* ── Fan Coins CTA (not logged in) ─────────────────────── */}
        {!currentUser && (
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-center shadow-lg">
            <div className="text-3xl mb-2">🥊</div>
            <h3 className="font-black text-white text-lg mb-1">Earn Fan Coins</h3>
            <p className="text-white/80 text-sm mb-3">Sign in to track your coins, play games and submit fantasy picks</p>
            <button onClick={() => navigate('/')}
              className="bg-white text-orange-600 font-black px-6 py-2.5 rounded-xl hover:bg-orange-50 transition-colors text-sm">
              Sign In Free
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
