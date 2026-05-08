import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, ExternalLink, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const getAdminToken = () => { try { return localStorage.getItem('adminToken') || null; } catch { return null; } };

function readTime(text) {
  if (!text) return '2 min';
  return `${Math.max(1, Math.ceil(text.split(/\s+/).length / 200))} min`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CATEGORIES = ['All', 'UFC', 'MMA', 'Fighting', 'Boxing'];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse border border-gray-100">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  );
}

function ArticleCard({ article, featured = false }) {
  const src = article.urlToImage || article.image;
  const [imgOk, setImgOk] = useState(true);

  if (featured) {
    return (
      <motion.a
        href={article.url} target="_blank" rel="noopener noreferrer"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="group block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:border-red-200 transition-all"
      >
        <div className="sm:flex h-full">
          {src && imgOk ? (
            <div className="sm:w-2/5 h-52 sm:h-auto overflow-hidden flex-shrink-0">
              <img src={src} alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgOk(false)} />
            </div>
          ) : (
            <div className="sm:w-2/5 h-52 sm:h-auto bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center flex-shrink-0">
              <span className="text-5xl">🥊</span>
            </div>
          )}
          <div className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">FEATURED</span>
                <span>{article.sourceName || article.source}</span>
                <span>·</span>
                <span>{timeAgo(article.publishedAt)}</span>
              </div>
              <h2 className="font-black text-gray-900 text-xl leading-snug line-clamp-3 group-hover:text-red-700 transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{article.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {readTime(article.content || article.description)}
              </span>
              <span className="text-red-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Read more <ExternalLink className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.a
      href={article.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all flex flex-col"
    >
      {src && imgOk ? (
        <div className="h-44 overflow-hidden">
          <img src={src} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgOk(false)} />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <span className="text-4xl opacity-40">🥊</span>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
          <span className="font-semibold text-gray-500">{article.sourceName || article.source}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="font-bold text-gray-900 text-sm line-clamp-3 group-hover:text-red-700 transition-colors flex-1">
          {article.title}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {readTime(article.content || article.description)}
          </span>
          <span className="text-red-600 text-xs font-bold flex items-center gap-1">
            Read <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function News() {
  const [news, setNews]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal]         = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const hasAdmin = Boolean(getAdminToken());

  const fetchNews = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/news?limit=30&page=${p}`);
      if (!r.ok) throw new Error('Failed');
      const data = await r.json();
      setNews(data.articles || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNews(page); }, [page]);

  const handleRefresh = async () => {
    const token = getAdminToken();
    if (!token) return;
    setRefreshing(true);
    try {
      await fetch(`${API_URL}/news/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      });
      await fetchNews(1);
    } catch {}
    setRefreshing(false);
  };

  const filtered = news.filter(a => {
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' ||
      a.title?.toLowerCase().includes(category.toLowerCase()) ||
      a.description?.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight">📰 UFC News</h1>
                <p className="text-gray-400 mt-1 text-sm">Latest from the world of MMA · {total} articles</p>
              </div>
              {hasAdmin && (
                <button onClick={handleRefresh} disabled={refreshing}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing…' : 'Refresh Feed'}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mt-6 relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search articles…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:border-red-500 focus:bg-white/15 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    category === c
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <span className="text-sm font-semibold">{error}</span>
            <button onClick={() => fetchNews(page)} className="text-red-600 font-bold text-sm hover:underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-lg">No articles found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }}
              className="mt-4 text-sm text-red-600 font-semibold hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && !search && (
              <div className="mb-6">
                <ArticleCard article={featured} featured />
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {(search ? filtered : rest).map((a, i) => (
                  <ArticleCard key={a.url || i} article={a} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
