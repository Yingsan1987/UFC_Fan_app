import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Trophy, MapPin, Target, ArrowUp, ExternalLink, Filter } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const DIVISIONS = [
  'All', 'Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight',
  'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight',
  "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight",
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Fighters' },
  { value: 'champions', label: '👑 Champions' },
  { value: 'active', label: '✅ Active' },
  { value: 'retired', label: '🏁 Retired' },
];

const PER_PAGE = 12;

function FighterCard({ fighter, idx }) {
  const [imgOk, setImgOk] = useState(true);
  const initials = fighter.name
    ? fighter.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : '?';

  const isChampion = fighter.champion;
  const isRetired = fighter.status === 'retired';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (idx % PER_PAGE) * 0.04, duration: 0.3 }}
      className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${
        isChampion ? 'border-yellow-400' : 'border-gray-100 hover:border-red-200'
      }`}
    >
      {/* Image / header */}
      <div className={`relative h-36 overflow-hidden ${isChampion ? 'bg-gradient-to-br from-yellow-500 to-amber-700' : 'bg-gradient-to-br from-red-700 to-gray-900'}`}>
        {fighter.imageUrl && imgOk ? (
          <img
            src={fighter.imageUrl} alt={fighter.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-black text-white/30">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badge */}
        <div className="absolute top-2 right-2">
          {isChampion ? (
            <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full shadow">
              <Trophy className="w-3 h-3" /> CHAMP
            </span>
          ) : isRetired ? (
            <span className="bg-gray-600/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">RETIRED</span>
          ) : fighter.ranking && fighter.ranking <= 15 ? (
            <span className="bg-blue-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-full">#{fighter.ranking}</span>
          ) : (
            <span className="bg-green-600/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
          )}
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-black text-sm leading-tight truncate drop-shadow">{fighter.name}</p>
          {fighter.nickname && (
            <p className="text-red-300 text-xs font-medium truncate">"{fighter.nickname}"</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-3">
        <div className="flex justify-between text-center mb-3">
          <div>
            <p className="text-lg font-black text-red-600">{fighter.knockouts ?? 0}</p>
            <p className="text-xs text-gray-400 font-medium">KOs</p>
          </div>
          <div>
            <p className="text-lg font-black text-blue-600">{fighter.submissions ?? 0}</p>
            <p className="text-xs text-gray-400 font-medium">Subs</p>
          </div>
          <div>
            <p className="text-lg font-black text-green-600">{fighter.wins ?? 0}</p>
            <p className="text-xs text-gray-400 font-medium">Wins</p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          {fighter.division && (
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="truncate">{fighter.division}</span>
            </div>
          )}
          {fighter.record && (
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="font-semibold">{fighter.record}</span>
            </div>
          )}
          {fighter.nationality && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="truncate">{fighter.nationality}</span>
            </div>
          )}
        </div>

        {fighter.url && (
          <a href={fighter.url} target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1 text-xs text-red-600 font-semibold hover:text-red-800 transition-colors border-t border-gray-100 pt-2">
            UFC Stats <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function Fighters() {
  const [fighters, setFighters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState('All');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadMsg, setLoadMsg] = useState('Loading fighters…');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showTop, setShowTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        try {
          await axios.get(`${API_URL}/health`, { timeout: 5000 });
        } catch {
          setLoadMsg('Waking up server… this may take a moment');
        }
        const r = await axios.get(`${API_URL}/fighters?limit=5000`, { timeout: 60000 });
        const data = r.data.fighters || (Array.isArray(r.data) ? r.data : []);
        setFighters(data);
        setError(null);
      } catch (err) {
        setError('Failed to load fighters. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let f = fighters;
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(x =>
        x.name?.toLowerCase().includes(q) ||
        x.nickname?.toLowerCase().includes(q) ||
        x.nationality?.toLowerCase().includes(q)
      );
    }
    if (division !== 'All') f = f.filter(x => x.division === division);
    if (status === 'champions') f = f.filter(x => x.champion);
    else if (status === 'active') f = f.filter(x => x.status === 'active');
    else if (status === 'retired') f = f.filter(x => x.status === 'retired');

    setFiltered(f);
    setPage(1);
    setDisplayed(f.slice(0, PER_PAGE));
  }, [search, division, status, fighters]);

  const loadMore = () => {
    const next = page + 1;
    setDisplayed(filtered.slice(0, next * PER_PAGE));
    setPage(next);
  };

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hasMore = displayed.length < filtered.length;
  const isFiltering = search || division !== 'All' || status !== 'all';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600 font-semibold text-center max-w-xs">{loadMsg}</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Couldn't load fighters</h3>
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
      <div className="bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight">🥊 UFC Fighters</h1>
                <p className="text-gray-400 mt-1 text-sm">
                  {fighters.length.toLocaleString()} fighters · {isFiltering ? `${filtered.length} match` : 'All divisions'}
                </p>
              </div>
              <button onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Filters'}
                {isFiltering && <span className="w-2 h-2 bg-red-400 rounded-full" />}
              </button>
            </div>

            {/* Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, nickname, or nationality…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:border-red-400 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                  <div className="space-y-3">
                    {/* Status pills */}
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_FILTERS.map(s => (
                        <button key={s.value} onClick={() => setStatus(s.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                            status === s.value ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {/* Division pills */}
                    <div className="flex gap-2 flex-wrap">
                      {DIVISIONS.map(d => (
                        <button key={d} onClick={() => setDivision(d)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                            division === d ? 'bg-yellow-400 text-yellow-900' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Active filter chips */}
        {isFiltering && (
          <div className="flex gap-2 flex-wrap mb-4">
            {search && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                "{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {division !== 'All' && (
              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                {division} <button onClick={() => setDivision('All')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {status !== 'all' && (
              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                {STATUS_FILTERS.find(s => s.value === status)?.label}
                <button onClick={() => setStatus('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={() => { setSearch(''); setDivision('All'); setStatus('all'); }}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold underline">
              Clear all
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-lg">No fighters found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setDivision('All'); setStatus('all'); }}
              className="mt-4 text-sm text-red-600 font-semibold hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayed.map((fighter, i) => (
                <FighterCard key={fighter._id || i} fighter={fighter} idx={i} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button onClick={loadMore}
                  className="bg-gradient-to-r from-red-600 to-red-800 text-white font-black px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-900 transition-all shadow-lg">
                  Show More ({filtered.length - displayed.length} remaining)
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-6">
              Showing {displayed.length} of {filtered.length} fighters
            </p>
          </>
        )}
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-xl z-50 transition-colors">
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
