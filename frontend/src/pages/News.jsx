import { useEffect, useState } from "react";
import { Search, RefreshCw, ExternalLink, Calendar, Clock, TrendingUp } from "lucide-react";

const API_URL = "https://ufc-fan-app-backend.onrender.com";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: "all", name: "All News", icon: "📰" },
    { id: "fights", name: "Fight Results", icon: "🥊" },
    { id: "announcements", name: "Announcements", icon: "📢" },
    { id: "transfers", name: "Fighter Moves", icon: "🔄" },
    { id: "injuries", name: "Injuries", icon: "🏥" },
    { id: "controversy", name: "Controversy", icon: "⚡" }
  ];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/news`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      setNews(data.articles || []);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError("Failed to fetch UFC news. Please try again later.");
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/news/refresh`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchNews();
      } else {
        throw new Error('Failed to refresh news');
      }
    } catch (err) {
      setError("Failed to refresh news. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    const categoryMap = {
      'fights': '🥊',
      'announcements': '📢',
      'transfers': '🔄',
      'injuries': '🏥',
      'controversy': '⚡',
      'default': '📰'
    };
    return categoryMap[category] || categoryMap.default;
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'fights': 'bg-red-100 text-red-800',
      'announcements': 'bg-blue-100 text-blue-800',
      'transfers': 'bg-green-100 text-green-800',
      'injuries': 'bg-yellow-100 text-yellow-800',
      'controversy': 'bg-purple-100 text-purple-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colorMap[category] || colorMap.default;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-red-500" />
            <p className="text-gray-600">Loading latest UFC news...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error Loading News</p>
          <p>{error}</p>
          <button
            onClick={fetchNews}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">UFC News</h1>
            <p className="text-gray-600">Latest updates from the world of mixed martial arts</p>
          </div>
          <div className="text-right">
            <button
              onClick={refreshNews}
              disabled={refreshing}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh News'}
            </button>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {formatDate(lastUpdated)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search news..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-gray-700 font-medium">{filteredNews.length} articles</span>
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No news articles found.</p>
          <p className="text-gray-400">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((article, index) => (
            <article key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {article.image && (
                <div className="relative">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {getCategoryIcon(article.category)} {article.category || 'News'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.publishedAt)}</span>
                  {article.source && (
                    <>
                      <span>•</span>
                      <span>{article.source}</span>
                    </>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {article.title}
                </h2>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.description || article.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{article.readTime || '5 min read'}</span>
                  </div>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    Read More
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Auto-Update Notice */}
      <div className="mt-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🔄 Automatic Updates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Daily Refresh</h3>
            <p className="text-blue-100">News is automatically updated every 24 hours to bring you the latest UFC developments.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Real-time Breaking News</h3>
            <p className="text-blue-100">Click "Refresh News" anytime to get the most current updates from multiple sources.</p>
          </div>
        </div>
      </div>
    </div>
  );
}