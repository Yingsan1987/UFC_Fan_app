import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, MapPin, Users, Trophy, ChevronDown, ChevronUp, Swords } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const safeLower = v => (v ?? '').toString().toLowerCase();
const toTime = d => { const ms = Date.parse(d); return Number.isFinite(ms) ? ms : 0; };

function formatDate(dateStr) {
  const ms = Date.parse(dateStr);
  if (!Number.isFinite(ms)) return dateStr ?? 'TBD';
  return new Date(ms).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function FighterAvatar({ src, name, corner }) {
  const [ok, setOk] = useState(true);
  const initials = (name ?? '?').toString().charAt(0);
  const colors = corner === 'red'
    ? 'from-red-500 to-red-800 border-red-500'
    : 'from-blue-500 to-blue-800 border-blue-500';

  return ok && src ? (
    <img src={src} alt={name}
      className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover object-top border-4 ${corner === 'red' ? 'border-red-500' : 'border-blue-500'} shadow-2xl`}
      onError={() => setOk(false)} />
  ) : (
    <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${colors} border-4 flex items-center justify-center text-white text-3xl font-black shadow-2xl`}>
      {initials}
    </div>
  );
}

function UpcomingEventCard({ event, idx }) {
  const [expanded, setExpanded] = useState(idx === 0);
  const fights = (event?.fights ?? []).map((f, i) => ({
    ...f,
    label: i === 0 ? 'Main Event' : i === 1 ? 'Co-Main Event' : 'Main Card',
  }));
  const main = fights[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white rounded-2xl shadow-xl border-2 border-yellow-400 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 p-4 sm:p-6 text-left hover:brightness-105 transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-black text-white text-xs font-black px-2 py-0.5 rounded">UFC</span>
              <span className="bg-red-700 text-white text-xs font-black px-2 py-0.5 rounded">UPCOMING</span>
            </div>
            <h3 className="text-gray-900 font-black text-base sm:text-xl leading-tight truncate">
              {event?.eventName ?? 'UFC Event'}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm text-gray-800 font-semibold">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{event?.eventDate ?? 'TBD'}</span>
              {event?.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>}
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{fights.length} Fights</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-gray-800">
            {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>
      </button>

      {/* Fight card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-950 to-gray-900 space-y-4">
              {/* Main event */}
              {main && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="flex items-center gap-1.5 bg-red-700 text-white text-xs font-black px-3 py-1 rounded-full">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" /> {main.label}
                    </span>
                    {main.weightClass && (
                      <span className="bg-blue-700/60 text-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                        {main.weightClass}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <FighterAvatar src={main.fighter1Image} name={main.fighter1} corner="red" />
                      <div className="text-center">
                        <p className="text-white font-black text-sm sm:text-base uppercase leading-tight">{main.fighter1 ?? 'TBD'}</p>
                        <p className="text-red-400 text-xs font-bold">RED CORNER</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-red-700 to-red-900 text-white font-black text-xl sm:text-3xl px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-xl rotate-3">
                        VS
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 flex-1">
                      <FighterAvatar src={main.fighter2Image} name={main.fighter2} corner="blue" />
                      <div className="text-center">
                        <p className="text-white font-black text-sm sm:text-base uppercase leading-tight">{main.fighter2 ?? 'TBD'}</p>
                        <p className="text-blue-400 text-xs font-bold">BLUE CORNER</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining fights */}
              {fights.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-4 h-4 text-gray-400" />
                    <h4 className="text-gray-300 text-sm font-bold uppercase tracking-wider">Full Fight Card</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fights.slice(1).map((fight, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-red-500/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-red-400 font-bold">{fight.label}</span>
                          {fight.weightClass && <span className="text-xs text-blue-400 font-semibold">{fight.weightClass}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {fight.fighter1Image ? (
                              <img src={fight.fighter1Image} alt={fight.fighter1}
                                className="w-8 h-8 rounded-full object-cover border border-red-500 flex-shrink-0"
                                onError={e => e.target.style.display = 'none'} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(fight.fighter1 ?? '?').charAt(0)}
                              </div>
                            )}
                            <span className="text-white text-xs font-semibold truncate">{fight.fighter1 ?? 'TBD'}</span>
                          </div>
                          <span className="text-red-500 font-black text-sm flex-shrink-0">VS</span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                            <span className="text-white text-xs font-semibold truncate text-right">{fight.fighter2 ?? 'TBD'}</span>
                            {fight.fighter2Image ? (
                              <img src={fight.fighter2Image} alt={fight.fighter2}
                                className="w-8 h-8 rounded-full object-cover border border-blue-500 flex-shrink-0"
                                onError={e => e.target.style.display = 'none'} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(fight.fighter2 ?? '?').charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [evRes, upRes] = await Promise.allSettled([
          axios.get(`${API_URL}/events`),
          axios.get(`${API_URL}/upcoming-events`),
        ]);
        if (!cancelled) {
          const raw = evRes.status === 'fulfilled' && Array.isArray(evRes.value.data) ? evRes.value.data : [];
          const sorted = raw.slice().sort((a, b) => toTime(b?.DATE) - toTime(a?.DATE));
          setEvents(sorted);
          setFiltered(sorted);
          setUpcoming(upRes.status === 'fulfilled' && Array.isArray(upRes.value.data) ? upRes.value.data : []);
        }
      } catch {
        if (!cancelled) setError('Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const term = safeLower(search);
    if (!term) { setFiltered(events); return; }
    setFiltered(events.filter(e =>
      safeLower(e?.EVENT).includes(term) ||
      safeLower(e?.LOCATION).includes(term) ||
      safeLower(e?.DATE).includes(term)
    ));
  }, [search, events]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Loading events…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Couldn't load events</h3>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-black tracking-tight">UFC Events</h1>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              {upcoming.length > 0 && `${upcoming.length} upcoming · `}{events.length} past events
            </p>

            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search past events by name, location, or date…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:border-red-400 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-black text-gray-900">Upcoming Events</h2>
              <span className="bg-red-100 text-red-700 text-xs font-black px-2 py-0.5 rounded-full">{upcoming.length}</span>
            </div>
            <div className="space-y-4">
              {upcoming.map((ev, i) => <UpcomingEventCard key={i} event={ev} idx={i} />)}
            </div>
          </section>
        )}

        {/* Past events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">
              Past Events
              {search && <span className="ml-2 text-sm text-gray-400 font-normal">· {filtered.length} results</span>}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-semibold text-lg">No events found</p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-3 text-sm text-red-600 font-semibold hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((event, i) => {
                const name = event?.EVENT ?? 'UFC Event';
                const date = event?.DATE ?? 'TBD';
                const loc = event?.LOCATION ?? 'TBD';
                return (
                  <motion.div key={event?._id ?? i}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.03 }}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all group"
                  >
                    <div className="h-20 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                      <span className="text-3xl opacity-30">🥊</span>
                      <div className="absolute top-2 left-3">
                        <span className="bg-red-700 text-white text-xs font-black px-2 py-0.5 rounded">UFC</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-red-700 transition-colors mb-2">
                        {name}
                      </h3>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-red-400" />
                          {formatDate(date)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          <span className="truncate">{loc}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/event-details/${encodeURIComponent(name)}`)}
                        className="mt-3 w-full text-xs font-bold bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 py-2 rounded-xl transition-all">
                        View Details →
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
