import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trophy, MapPin, Target, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const BELT_COLORS = [
  'from-yellow-400 to-yellow-600',
  'from-red-500 to-red-700',
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-green-500 to-green-700',
  'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
];

function formatDivision(name) {
  return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function MovementBadge({ movement }) {
  if (movement > 0) return (
    <div className="flex items-center gap-0.5 text-green-600 font-bold text-xs">
      <TrendingUp className="w-3 h-3" />{movement}
    </div>
  );
  if (movement < 0) return (
    <div className="flex items-center gap-0.5 text-red-500 font-bold text-xs">
      <TrendingDown className="w-3 h-3" />{Math.abs(movement)}
    </div>
  );
  return <Minus className="w-3 h-3 text-gray-400" />;
}

function FighterRow({ cr, idx, isChampion, beltGradient }) {
  const c = cr.competitor || {};
  const initials = (c.abbreviation || c.name?.split(' ').map(n => n[0]).join('') || '?').slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        isChampion
          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
          : 'bg-white border-gray-100 hover:border-gray-300'
      }`}
    >
      {/* Rank bubble */}
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base sm:text-lg shadow ${
        isChampion
          ? `bg-gradient-to-br ${beltGradient} text-white`
          : 'bg-gray-100 text-gray-600'
      }`}>
        {isChampion ? <Trophy className="w-5 h-5" /> : cr.rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200">
        {c.image_url ? (
          <img src={c.image_url} alt={c.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-red-500 to-red-800 items-center justify-center text-white font-black text-xs ${c.image_url ? 'hidden' : 'flex'}`}>
          {initials}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-black text-sm sm:text-base truncate ${isChampion ? 'text-amber-800' : 'text-gray-900'}`}>
            {c.name || 'Unknown'}
          </span>
          {isChampion && (
            <span className="text-xs bg-yellow-400 text-yellow-900 font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
              CHAMP
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {c.country && (
            <span className="flex items-center gap-0.5 text-gray-400 text-xs">
              <MapPin className="w-3 h-3" />{c.country}
            </span>
          )}
          {c.record && (
            <span className="flex items-center gap-0.5 text-gray-600 text-xs font-semibold">
              <Target className="w-3 h-3" />{c.record}
            </span>
          )}
        </div>
      </div>

      {/* Movement */}
      <div className="flex-shrink-0">
        <MovementBadge movement={cr.movement ?? 0} />
      </div>
    </motion.div>
  );
}

export default function Ranking() {
  const [rankings, setRankings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/sportradar/rankings`)
      .then(r => {
        const data = r.data.rankings || [];
        setRankings(data);
        if (data.length) setExpanded(data[0].name);
      })
      .catch(() => setError('Failed to load rankings.'))
      .finally(() => setLoading(false));
  }, []);

  // Global search across all divisions
  const searchResults = search
    ? rankings.flatMap(r =>
        (r.competitor_rankings || [])
          .filter(cr => cr.competitor?.name?.toLowerCase().includes(search.toLowerCase()))
          .map(cr => ({ ...cr, division: formatDivision(r.name) }))
      )
    : [];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Loading rankings…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Couldn't load rankings</h3>
        <p className="text-gray-500 mb-4 text-sm">{error}</p>
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
      <div className="bg-gradient-to-br from-gray-950 to-gray-900 text-white px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-black">UFC Rankings</h1>
            </div>
            <p className="text-gray-400 text-sm mb-6">Official fighter rankings across all weight divisions</p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search any fighter…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-yellow-400 transition-all"
              />
            </div>

            {/* Division quick-jump pills */}
            {!search && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
                {rankings.map(r => (
                  <button key={r.name} onClick={() => setExpanded(r.name)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                      expanded === r.name
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}>
                    {formatDivision(r.name)}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Global search results */}
        {search && (
          <div>
            <p className="text-sm text-gray-500 mb-4 font-semibold">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🔍</div>
                <p className="font-semibold">No fighters found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((cr, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-1">
                      {cr.division}
                    </div>
                    <FighterRow cr={cr} idx={0} isChampion={cr.rank === 0} beltGradient="from-yellow-400 to-yellow-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Division accordions */}
        {!search && (
          <div className="space-y-3">
            {rankings.map((ranking, index) => {
              const isExpanded = expanded === ranking.name;
              const champion = ranking.competitor_rankings?.[0];
              const divName = formatDivision(ranking.name);
              const beltGradient = BELT_COLORS[index % BELT_COLORS.length];

              return (
                <div key={ranking.name}
                  className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-all ${
                    isExpanded ? 'border-red-400 shadow-lg' : 'border-gray-100 hover:border-gray-300'
                  }`}>
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : ranking.name)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Belt icon */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${beltGradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <Trophy className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-black text-gray-900 text-base sm:text-lg">{divName}</h2>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {champion && (
                          <span className="text-xs text-yellow-700 bg-yellow-100 font-bold px-2 py-0.5 rounded-full">
                            👑 {champion.competitor?.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {ranking.competitor_rankings?.length || 0} ranked
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Expanded fighters */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-gray-100 bg-gray-50/50">
                          {ranking.competitor_rankings?.length > 0 ? (
                            ranking.competitor_rankings.map((cr, i) => (
                              <FighterRow
                                key={cr.competitor?.id || i}
                                cr={cr} idx={i}
                                isChampion={cr.rank === 0}
                                beltGradient={beltGradient}
                              />
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                              <p className="text-sm font-semibold">No rankings available</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {rankings.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">No rankings data available</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          Rankings updated weekly · ↑ Moved Up · ↓ Moved Down · — No change
        </p>
      </div>
    </div>
  );
}
