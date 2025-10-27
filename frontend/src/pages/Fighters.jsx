import { useState, useEffect } from 'react';
import { Search, X, Trophy, MapPin, Target } from 'lucide-react';
import axios from 'axios';

const API_URL = "https://ufc-fan-app-backend.onrender.com/api";

const Fighters = () => {
  const [fighters, setFighters] = useState([]);
  const [filteredFighters, setFilteredFighters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const divisions = [
    "Heavyweight", "Light Heavyweight", "Middleweight", "Welterweight", 
    "Lightweight", "Featherweight", "Bantamweight", "Flyweight",
    "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight"
  ];

  useEffect(() => {
    const fetchFighters = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/fighters`);
        
        // Handle the new format from ufc-fighter_details and ufc-fighter_tott collections
        let fightersData;
        if (response.data.fighters) {
          // New format - object with fighters and pagination
          fightersData = response.data.fighters;
        } else if (Array.isArray(response.data)) {
          // Fallback for array format
          fightersData = response.data;
        } else {
          // Empty or error response
          fightersData = [];
        }
        
        setFighters(fightersData);
        setFilteredFighters(fightersData);
        
        // Check if there's an error message from the API
        if (response.data.error) {
          setError(`No fighter data available: ${response.data.error}`);
        } else {
          setError(null);
        }
      } catch (err) {
        setError('Failed to load fighters from ufc-fighter_details and ufc-fighter_tott collections');
        console.error('Error fetching fighters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFighters();
  }, []);

  // Filter fighters based on search term, division, and status
  useEffect(() => {
    let filtered = fighters;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(fighter =>
        fighter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by division
    if (selectedDivision !== 'all') {
      filtered = filtered.filter(fighter => fighter.division === selectedDivision);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'champions') {
        filtered = filtered.filter(fighter => fighter.champion);
      } else {
        filtered = filtered.filter(fighter => fighter.status === statusFilter);
      }
    }

    setFilteredFighters(filtered);
  }, [searchTerm, selectedDivision, statusFilter, fighters]);

  const clearSearch = () => {
    setSearchTerm('');
  };


  const getFlagEmoji = (nationality) => {
    const flags = {
      "American": "🇺🇸",
      "Russian": "🇷🇺",
      "British": "🇬🇧",
      "Australian": "🇦🇺",
      "Irish": "🇮🇪",
      "Brazilian": "🇧🇷",
      "Nigerian-New Zealand": "🇳🇬🇳🇿",
      "Cameroonian-French": "🇨🇲🇫🇷"
    };
    return flags[nationality] || "🌍";
  };

  const getStatusBadge = (fighter) => {
    if (fighter.champion) {
      return <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold flex items-center"><Trophy className="w-3 h-3 mr-1" />CHAMPION</span>;
    }
    if (fighter.status === "retired") {
      return <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">RETIRED</span>;
    }
    if (fighter.ranking && fighter.ranking <= 15) {
      return <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">#{fighter.ranking} RANKED</span>;
    }
    return <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">ACTIVE</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UFC Fighters</h1>
        <p className="text-gray-600 mb-6">Live fighter data from ufc_fighter_details and ufc_fighter_tott collections - Discover profiles and stats of UFC's elite fighters</p>
        
        {/* Search Bar */}
        <div className="relative max-w-md mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search fighters, nicknames, or nationality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
          >
            <option value="all">All Divisions</option>
            {divisions.map(division => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Fighters</option>
            <option value="champions">Champions Only</option>
            <option value="active">Active</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        
        {/* Search Results Count */}
        {searchTerm && (
          <div className="text-sm text-gray-600">
            {filteredFighters.length === 0 ? (
              <span>No fighters found matching "{searchTerm}"</span>
            ) : (
              <span>
                {filteredFighters.length} fighter{filteredFighters.length !== 1 ? 's' : ''} found
                {filteredFighters.length !== fighters.length && ` out of ${fighters.length} total`}
              </span>
            )}
          </div>
        )}
      </div>

      {filteredFighters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🥊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'No Fighters Found' : 'No Fighters Available'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? `Try a different search term` : 'No data available from ufc-fighter_details and ufc-fighter_tott collections. Please populate these collections with fighter data.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFighters.map((fighter) => (
            <div
              key={fighter._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
            >
              {/* Fighter Header */}
              <div className="h-24 bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center relative">
                <div className="text-white text-center">
                  <div className="text-2xl mb-1">🥊</div>
                  <p className="text-xs font-semibold">UFC Fighter</p>
                </div>
                <div className="absolute top-2 right-2">
                  {getStatusBadge(fighter)}
                </div>
              </div>

              {/* Fighter Content */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {fighter.name}
                </h3>
                {fighter.nickname && (
                  <p className="text-xs text-red-600 font-medium mb-2">"{fighter.nickname}"</p>
                )}
                
                <div className="space-y-1">
                  {/* Division */}
                  {fighter.division && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-xs font-medium truncate">{fighter.division}</span>
                    </div>
                  )}
                  
                  {/* Height */}
                  {fighter.height && fighter.height !== '--' && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8" />
                      </svg>
                      <span className="text-xs font-medium truncate">Height: {fighter.height}</span>
                    </div>
                  )}

                  {/* Weight */}
                  {fighter.weight && fighter.weight !== '--' && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      <span className="text-xs font-medium truncate">Weight: {fighter.weight}</span>
                    </div>
                  )}

                  {/* Reach */}
                  {fighter.reach && fighter.reach !== '--' && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-xs font-medium truncate">Reach: {fighter.reach}</span>
                    </div>
                  )}

                  {/* Stance */}
                  {fighter.stance && fighter.stance !== 'NaN' && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-xs font-medium truncate">Stance: {fighter.stance}</span>
                    </div>
                  )}

                  {/* Date of Birth */}
                  {fighter.dob && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium truncate">DOB: {fighter.dob}</span>
                    </div>
                  )}

                  {/* Nationality */}
                  {fighter.nationality && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{getFlagEmoji(fighter.nationality)} {fighter.nationality}</span>
                    </div>
                  )}

                  {/* Record */}
                  {fighter.record && (
                    <div className="flex items-center text-gray-600">
                      <Target className="w-3 h-3 mr-2 text-red-600 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">Record: {fighter.record}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-3 flex justify-between text-center">
                  <div>
                    <p className="text-lg font-bold text-red-600">{fighter.knockouts || 0}</p>
                    <p className="text-xs text-gray-500">KOs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{fighter.submissions || 0}</p>
                    <p className="text-xs text-gray-500">Subs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{fighter.wins || 0}</p>
                    <p className="text-xs text-gray-500">Wins</p>
                  </div>
                </div>

                {/* UFC Stats Link */}
                {fighter.url && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <a 
                      href={fighter.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View UFC Stats
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {fighters.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm ? `Showing ${filteredFighters.length} of ${fighters.length} fighters` : `Total Fighters: ${fighters.length}`}
            </h3>
            <p className="text-gray-600 text-sm">
              {searchTerm ? `Filtered by "${searchTerm}"` : 'Showing live data from ufc_fighter_details and ufc_fighter_tott collections'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fighters;
