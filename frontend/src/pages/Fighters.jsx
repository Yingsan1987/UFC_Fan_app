import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Trophy, MapPin, Target, Zap } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Fighters() {
  const [fighters, setFighters] = useState([]);
  const [filteredFighters, setFilteredFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const divisions = [
    "Heavyweight", "Light Heavyweight", "Middleweight", "Welterweight", 
    "Lightweight", "Featherweight", "Bantamweight", "Flyweight",
    "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight"
  ];

  useEffect(() => {
    const fetchFighters = async () => {
      try {
        const response = await axios.get(`${API_URL}/fighters`);
        setFighters(response.data);
        setFilteredFighters(response.data);
      } catch (err) {
        setError("Failed to fetch UFC fighters");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFighters();
  }, []);

  useEffect(() => {
    let filtered = fighters;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(fighter =>
        fighter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by division
    if (selectedDivision !== "all") {
      filtered = filtered.filter(fighter => fighter.division === selectedDivision);
    }

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "champions") {
        filtered = filtered.filter(fighter => fighter.champion);
      } else {
        filtered = filtered.filter(fighter => fighter.status === statusFilter);
      }
    }

    setFilteredFighters(filtered);
  }, [searchTerm, selectedDivision, statusFilter, fighters]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">UFC Fighters</h1>
        <p className="text-gray-600">Discover profiles and stats of UFC's elite fighters</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fighters..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Division Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <option value="all">All Divisions</option>
              {divisions.map(division => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Fighters</option>
              <option value="champions">Champions Only</option>
              <option value="active">Active</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-center bg-gray-100 rounded-lg">
            <span className="text-gray-700 font-medium">{filteredFighters.length} fighters</span>
          </div>
        </div>
      </div>

      {/* Fighters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFighters.map(fighter => (
          <div key={fighter._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Fighter Image */}
            <div className="h-48 bg-gradient-to-br from-red-500 to-red-600 relative">
              {fighter.imageUrl ? (
                <img 
                  src={fighter.imageUrl} 
                  alt={fighter.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-6xl font-bold" style={{display: fighter.imageUrl ? 'none' : 'flex'}}>
                {fighter.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="absolute top-2 right-2">
                {getStatusBadge(fighter)}
              </div>
            </div>

            {/* Fighter Info */}
            <div className="p-6">
              {/* Name and Nickname */}
              <div className="mb-3">
                <h3 className="text-xl font-bold text-gray-900">{fighter.name}</h3>
                {fighter.nickname && (
                  <p className="text-red-500 font-medium">"{fighter.nickname}"</p>
                )}
              </div>

              {/* Division and Record */}
              <div className="mb-4">
                <p className="text-gray-700 font-semibold">{fighter.division}</p>
                <p className="text-gray-600">Record: <span className="font-mono font-bold">{fighter.record}</span></p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-gray-600">{getFlagEmoji(fighter.nationality)} {fighter.nationality}</span>
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-gray-600">{fighter.strikingAccuracy}% accuracy</span>
                </div>
                <div className="text-gray-600">
                  Height: {fighter.height}
                </div>
                <div className="text-gray-600">
                  Weight: {fighter.weight}
                </div>
              </div>

              {/* Fighting Style */}
              <div className="mb-4">
                <p className="text-sm text-gray-500">Fighting Style</p>
                <p className="font-medium text-gray-700">{fighter.fightingStyle}</p>
              </div>

              {/* Last Fight */}
              {fighter.lastFight && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-500 mb-1">Last Fight</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">vs {fighter.lastFight.opponent}</span>
                    <span className={`text-sm font-bold ${
                      fighter.lastFight.result === 'Win' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {fighter.lastFight.result}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{fighter.lastFight.method}</p>
                </div>
              )}

              {/* Performance Stats */}
              <div className="flex justify-between mt-4 pt-3 border-t text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg text-red-600">{fighter.knockouts}</p>
                  <p className="text-gray-500">KOs</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-blue-600">{fighter.submissions}</p>
                  <p className="text-gray-500">Subs</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-green-600">{fighter.wins}</p>
                  <p className="text-gray-500">Wins</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredFighters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No fighters found matching your criteria</p>
          <button 
            onClick={() => {
              setSearchTerm("");
              setSelectedDivision("all");
              setStatusFilter("all");
            }}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
