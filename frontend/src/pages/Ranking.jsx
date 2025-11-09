import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trophy, Award, MapPin, Target } from 'lucide-react';
import axios from 'axios';

// Use localhost in development, production URL as fallback
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ufc-fan-app-backend.onrender.com/api');

export default function Ranking() {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedWeightClass, setExpandedWeightClass] = useState(null);

  useEffect(() => {
    fetchChampions();
  }, []);

  const fetchChampions = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching UFC Rankings...');
      console.log('🔗 API URL:', API_URL);
      console.log('🔗 Full endpoint:', `${API_URL}/sportradar/rankings`);
      
      const response = await axios.get(`${API_URL}/sportradar/rankings`);
      console.log('✅ Rankings data received:', response.data);
      console.log('📊 Rankings array length:', response.data.rankings?.length);
      
      if (response.data && response.data.rankings) {
        setChampions(response.data.rankings);
        setError(null);
        
        // Auto-expand the first weight class
        if (response.data.rankings.length > 0) {
          setExpandedWeightClass(response.data.rankings[0].name);
          console.log('✅ Auto-expanded first weight class:', response.data.rankings[0].name);
        }
      } else {
        console.warn('⚠️ No rankings in response');
        setChampions([]);
      }
    } catch (err) {
      console.error('❌ Error fetching rankings:');
      console.error('Error message:', err.message);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', err);
      setError('Failed to load rankings data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeightClass = (weightClassId) => {
    setExpandedWeightClass(expandedWeightClass === weightClassId ? null : weightClassId);
  };

  const getBeltColor = (index) => {
    const colors = [
      'from-yellow-400 to-yellow-600',
      'from-gray-300 to-gray-500',
      'from-orange-400 to-orange-600',
      'from-red-500 to-red-700',
      'from-blue-500 to-blue-700',
      'from-green-500 to-green-700',
      'from-purple-500 to-purple-700',
      'from-pink-500 to-pink-700',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Champions</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchChampions}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
        <div className="flex items-center gap-4 mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <div>
            <h1 className="text-4xl font-black text-gray-900">UFC RANKINGS</h1>
            <p className="text-gray-600 text-lg">Official fighter rankings across all weight divisions</p>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-4">
        {champions.map((ranking, index) => {
          const isExpanded = expandedWeightClass === ranking.name;
          const topFighter = ranking.competitor_rankings?.[0];
          const displayName = ranking.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const isWomens = ranking.name.toLowerCase().includes("women");

          return (
            <div
              key={ranking.name}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                isExpanded ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              {/* Collapsible Header */}
              <button
                onClick={() => toggleWeightClass(ranking.name)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-6 flex-1">
                  {/* Belt Icon */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getBeltColor(index)} flex items-center justify-center shadow-xl`}>
                    <Trophy className="w-8 h-8 text-white" />
                  </div>

                  {/* Weight Class Info */}
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-gray-900 mb-1">
                      {displayName}
                    </h2>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        Week {ranking.week}/{ranking.year}
                      </span>
                      {topFighter && (
                        <span className="text-sm font-bold text-red-600">
                          #1: {topFighter.competitor?.name}
                        </span>
                      )}
                      {ranking.competitor_rankings && (
                        <span className="text-xs text-gray-500">
                          {ranking.competitor_rankings.length} ranked fighters
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUp className="w-8 h-8 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-8 h-8 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Expanded Content - Rankings List */}
              {isExpanded && ranking.competitor_rankings && ranking.competitor_rankings.length > 0 && (
                <div className="border-t-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
                  <div className="space-y-3">
                    {ranking.competitor_rankings.map((competitorRanking, idx) => {
                      const competitor = competitorRanking.competitor;
                      const isChampion = competitorRanking.rank === 1;
                      const movementIcon = competitorRanking.movement > 0 ? '↑' : 
                                           competitorRanking.movement < 0 ? '↓' : '–';
                      const movementColor = competitorRanking.movement > 0 ? 'text-green-600' :
                                            competitorRanking.movement < 0 ? 'text-red-600' : 
                                            'text-gray-400';

                      return (
                        <div
                          key={competitor?.id || idx}
                          className={`bg-white rounded-xl p-4 border-2 ${
                            isChampion ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-gray-200'
                          } hover:shadow-lg transition-all`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center font-black text-2xl ${
                              isChampion 
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-xl' 
                                : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
                            }`}>
                              {competitorRanking.rank}
                            </div>

                            {/* Fighter Image */}
                            <div className="w-20 h-20 flex-shrink-0">
                              {competitor?.image_url ? (
                                <img
                                  src={competitor.image_url}
                                  alt={competitor.name}
                                  className="w-full h-full rounded-lg object-cover border-2 border-gray-300"
                                  onError={(e) => {
                                    e.target.src = `https://via.placeholder.com/80/ef4444/ffffff?text=${competitor?.abbreviation || '?'}`;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                  {competitor?.abbreviation || '?'}
                                </div>
                              )}
                            </div>

                            {/* Fighter Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-gray-900 truncate">
                                  {competitor?.name || 'Unknown Fighter'}
                                </h3>
                                {isChampion && (
                                  <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-4 flex-wrap text-sm">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span>{competitor?.country || 'Unknown'}</span>
                                </div>
                                {competitor?.record && (
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Target className="w-4 h-4" />
                                    <span className="font-semibold">{competitor.record}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Movement Indicator */}
                            <div className="flex-shrink-0 text-center">
                              <div className={`text-2xl font-bold ${movementColor}`}>
                                {movementIcon}
                              </div>
                              {competitorRanking.movement !== 0 && (
                                <div className="text-xs text-gray-500">
                                  {Math.abs(competitorRanking.movement)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Rankings Available */}
              {isExpanded && (!ranking.competitor_rankings || ranking.competitor_rankings.length === 0) && (
                <div className="border-t-2 border-gray-200 bg-gray-50 p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-semibold">
                    No rankings available for this weight class
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Rankings Available */}
      {champions.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <Trophy className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rankings Data Available</h3>
          <p className="text-gray-500">Rankings information will be displayed here once available.</p>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Rankings are updated weekly. Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-1 text-xs">↑ = Moved Up | ↓ = Moved Down | – = No Change</p>
      </div>
    </div>
  );
}
