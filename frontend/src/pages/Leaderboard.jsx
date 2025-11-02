import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, TrendingUp, Coins, Star, Award, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

function Leaderboard() {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fancoins'); // fancoins or prestige

  useEffect(() => {
    fetchLeaderboard();
    if (currentUser) {
      fetchMyRank();
    }
  }, [currentUser]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/fancoins/leaderboard?limit=30`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRank = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/fancoins/leaderboard/my-rank`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRank(response.data);
    } catch (error) {
      console.error('Error fetching my rank:', error);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />;
    if (rank === 3) return <Medal className="w-8 h-8 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">🏆 Fan Coin Leaderboard</h1>
          <p className="text-red-100 text-lg">Top 30 Players Ranked by Fan Coins</p>
        </div>
      </div>

      {/* User's Rank Card (if logged in) */}
      {currentUser && myRank && myRank.rank && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-4">
                <Star className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Your Ranking</h3>
                <p className="text-blue-100">
                  {currentUser.displayName || currentUser.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">#{myRank.rank}</div>
              <div className="text-sm text-blue-100">
                out of {myRank.totalUsers} players
              </div>
              <div className="text-sm text-blue-100">
                Top {myRank.percentile}%
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Coins className="w-6 h-6 text-yellow-300" />
                <span className="text-3xl font-bold">{myRank.fanCorn}</span>
              </div>
              <div className="text-sm text-blue-100">Fan Coins</div>
            </div>
          </div>
        </div>
      )}

      {/* How to Earn Fan Coins */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-500" />
          How to Earn Fan Coins
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">1</div>
            <div className="text-sm font-semibold">Early Prelims</div>
            <div className="text-xs text-gray-600">Win = 1 Coin</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">2</div>
            <div className="text-sm font-semibold">Prelims</div>
            <div className="text-xs text-gray-600">Win = 2 Coins</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">3</div>
            <div className="text-sm font-semibold">Main Card</div>
            <div className="text-xs text-gray-600">Win = 3 Coins</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-sm font-semibold">Co-Main Event</div>
            <div className="text-xs text-gray-600">Win = 4 Coins</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
            <div className="text-sm font-semibold">Main Event</div>
            <div className="text-xs text-gray-600">Win = 5 Coins</div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          💡 Transfer to fighters competing in upcoming UFC events to earn Fan Coins when they win!
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-600" />
            Top 30 Rankings
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fan Coins
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestige
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((player) => (
                <tr 
                  key={player.rank}
                  className={`hover:bg-gray-50 transition-colors ${
                    player.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/30' : ''
                  } ${
                    currentUser && player.userId?.email === currentUser.email 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getRankIcon(player.rank)}
                      <span className={`
                        inline-flex items-center justify-center w-10 h-10 rounded-full font-bold
                        ${getRankBadge(player.rank)}
                      `}>
                        {player.rank}
                      </span>
                    </div>
                  </td>

                  {/* Player */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {player.photoURL ? (
                        <img
                          src={player.photoURL}
                          alt={player.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                          {player.displayName?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {player.displayName || 'Anonymous'}
                        </div>
                        {currentUser && player.userId?.email === currentUser.email && (
                          <div className="text-xs text-blue-600 font-medium">You</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Fan Coins */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-yellow-600">
                        {player.fanCorn}
                      </span>
                    </div>
                  </td>

                  {/* Level */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
                      <Star className="w-4 h-4" />
                      {player.level}
                    </div>
                  </td>

                  {/* Record */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm">
                      <span className="text-green-600 font-bold">{player.totalWins}W</span>
                      {' - '}
                      <span className="text-red-600 font-bold">{player.totalLosses}L</span>
                    </div>
                  </td>

                  {/* Prestige */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">{player.prestige}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No rankings yet</p>
            <p className="text-sm">Be the first to earn Fan Coins!</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>🎯 How it works:</strong> Transfer to a real UFC fighter before their fight. 
          When they win, you earn Fan Coins based on their position on the fight card. 
          Higher profile fights = more coins!
        </p>
      </div>
    </div>
  );
}

export default Leaderboard;

