import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Dumbbell, 
  TrendingUp, 
  Zap, 
  Trophy, 
  Target, 
  Clock,
  Star,
  ArrowRight,
  Activity,
  Shield,
  Heart,
  Swords,
  Coins,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

function Game() {
  const { currentUser, getAuthToken } = useAuth();
  const [gameStatus, setGameStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWeightClass, setSelectedWeightClass] = useState('Lightweight');
  const [availableFighters, setAvailableFighters] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [showFighterStats, setShowFighterStats] = useState(true);
  const [showTrainingCenter, setShowTrainingCenter] = useState(true);
  const [showFighterPreview, setShowFighterPreview] = useState(true);
  const [previewFighters, setPreviewFighters] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [activeTab, setActiveTab] = useState('game'); // 'game' or 'leaderboard'

  const weightClasses = [
    'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
    'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  const trainingOptions = [
    {
      type: 'bagWork',
      name: 'Bag Work',
      icon: <Swords className="w-6 h-6" />,
      attribute: 'Striking',
      description: 'Increases striking accuracy & KO chance',
      color: 'bg-red-500'
    },
    {
      type: 'grappleDrills',
      name: 'Grapple Drills',
      icon: <Activity className="w-6 h-6" />,
      attribute: 'Grappling',
      description: 'Improves takedown & submission success',
      color: 'bg-blue-500'
    },
    {
      type: 'cardio',
      name: 'Cardio',
      icon: <Heart className="w-6 h-6" />,
      attribute: 'Stamina',
      description: 'Improves endurance for simulated fights',
      color: 'bg-green-500'
    },
    {
      type: 'sparDefense',
      name: 'Spar Defense',
      icon: <Shield className="w-6 h-6" />,
      attribute: 'Defense',
      description: "Reduces opponent's accuracy",
      color: 'bg-purple-500'
    }
  ];

  const fetchGameStatus = async () => {
    if (!currentUser) {
      console.log('⏭️ Skipping game status fetch - no user logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Fetching game status...');
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/game/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Game status received:', response.data);
      setGameStatus(response.data);
    } catch (error) {
      console.error('❌ Error fetching game status:', error);
      console.error('Error details:', error.response?.data);
      
      // Don't show error message if it's just that the game isn't initialized yet
      if (error.response?.status !== 404) {
        showMessage('Failed to load game status', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchGameStatus();
    } else {
      setLoading(false);
    }
    fetchUpcomingEvents();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUpcomingEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/fancoins/events/upcoming`);
      setUpcomingEvents(response.data.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const fetchPreviewFighters = async () => {
    try {
      // Get fighters from user's selected weight class or default
      const weightClass = gameStatus?.rookieFighter?.selectedWeightClass || selectedWeightClass;
      const response = await axios.get(`${API_URL}/fighters?division=${weightClass}&limit=6`);
      setPreviewFighters(response.data.slice(0, 6)); // Show 6 preview fighters
    } catch (error) {
      console.error('Error fetching preview fighters:', error);
    }
  };

  useEffect(() => {
    if (gameStatus?.rookieFighter?.selectedWeightClass) {
      fetchPreviewFighters();
    }
  }, [gameStatus?.rookieFighter?.selectedWeightClass]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/fancoins/leaderboard?limit=30`);
      setLeaderboard(response.data);
      
      if (currentUser) {
        const token = await getAuthToken();
        const rankResponse = await axios.get(`${API_URL}/fancoins/leaderboard/my-rank`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyRank(rankResponse.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeGame = async () => {
    console.log('🎮 Initializing game...', { selectedWeightClass, currentUser });
    
    if (!currentUser) {
      showMessage('Please sign in to start the game', 'error');
      return;
    }

    try {
      setActionLoading(true);
      console.log('🔑 Getting auth token...');
      const token = await getAuthToken();
      console.log('✅ Token received');
      
      console.log('📡 Making API call to:', `${API_URL}/game/initialize`);
      const response = await axios.post(
        `${API_URL}/game/initialize`,
        { weightClass: selectedWeightClass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Game initialized successfully:', response.data);
      setGameStatus({ 
        initialized: true, 
        ...response.data 
      });
      showMessage('Game initialized! Start training your Rookie Fighter!', 'success');
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to initialize game';
      
      if (error.message.includes('Firebase Auth not initialized')) {
        errorMessage = 'Authentication not configured. Please check Firebase setup.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (!error.response) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTraining = async (trainingType) => {
    try {
      setActionLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/game/train`,
        { trainingType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update game status with new data
      setGameStatus(prev => ({
        ...prev,
        rookieFighter: response.data.rookieFighter,
        gameProgress: response.data.gameProgress
      }));
      
      showMessage(`${response.data.message}`, 'success');
    } catch (error) {
      console.error('Error during training:', error);
      showMessage(error.response?.data?.message || 'Training failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAvailableFighters = async () => {
    try {
      setActionLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/game/available-fighters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableFighters(response.data.fighters);
      setShowTransferModal(true);
    } catch (error) {
      console.error('Error fetching fighters:', error);
      showMessage(error.response?.data?.message || 'Failed to fetch fighters', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (fighterId) => {
    try {
      setActionLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/game/transfer`,
        { fighterId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showMessage(response.data.message, 'success');
      setShowTransferModal(false);
      await fetchGameStatus();
    } catch (error) {
      console.error('Error during transfer:', error);
      showMessage(error.response?.data?.message || 'Transfer failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Trophy className="w-20 h-20 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🎮 UFC Fighter Game</h2>
          <p className="text-gray-600 mb-6">
            Sign in to start your journey from rookie to UFC champion!
          </p>
          <div className="text-left max-w-md mx-auto space-y-2 text-gray-700">
            <p>✅ Train your placeholder fighter</p>
            <p>✅ Earn stats through daily training</p>
            <p>✅ Transfer to real UFC fighters</p>
            <p>✅ Win based on real UFC results</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Initialize Game Screen
  if (!gameStatus?.initialized) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Trophy className="w-20 h-20 mx-auto text-red-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to UFC Fighter Game!</h2>
            <p className="text-gray-600">Choose your weight class to begin your journey</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Weight Class
            </label>
            <select
              value={selectedWeightClass}
              onChange={(e) => setSelectedWeightClass(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {weightClasses.map(wc => (
                <option key={wc} value={wc}>{wc}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">How It Works:</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <strong>Start as a Placeholder:</strong> Begin with basic stats (all at 50)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <strong>Train Daily:</strong> Complete 3 training sessions per day to improve stats
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <strong>Earn Your Shot:</strong> After 50 training sessions, transfer to a real UFC fighter
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <strong>Win Fights:</strong> Your fighter's real UFC results determine your rewards
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={initializeGame}
            disabled={actionLoading}
            className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Initializing...' : 'Start Your Journey!'}
          </button>
        </div>
      </div>
    );
  }

  const { rookieFighter, gameProgress } = gameStatus;
  const isTransferred = rookieFighter?.isTransferred;
  const stats = rookieFighter?.stats || {};
  const progress = rookieFighter ? 
    `${rookieFighter.trainingSessions}/${rookieFighter.trainingGoal}` : '0/12';
  const progressPercent = rookieFighter ? 
    (rookieFighter.trainingSessions / rookieFighter.trainingGoal) * 100 : 0;
  const isEligible = rookieFighter && 
    rookieFighter.trainingSessions >= rookieFighter.trainingGoal && 
    !isTransferred;

  // Fighter Level Info
  const fighterLevel = gameProgress?.fighterLevel || 'Preliminary Card';
  const levelWins = gameProgress?.levelWins || 0;
  const winsNeeded = gameProgress?.winsNeededForNextLevel || 5;
  const championWins = gameProgress?.championWins || 0;
  const isRetired = gameProgress?.isRetired || false;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'game'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🎮 Game
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Retirement Notice */}
      {isRetired && (
        <div className="mb-6 bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-500 rounded-lg p-6">
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h2 className="text-2xl font-bold text-purple-900 mb-2">🏆 Champion Retired!</h2>
            <p className="text-purple-800 mb-4">
              Your fighter has retired as Champion after 5 wins at the highest level!
              <br />
              Total Fan Coins Earned: <strong>{gameProgress?.fanCoin}</strong>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              Start New Rookie Fighter
            </button>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' ? (
        // Leaderboard Tab Content
        <div className="space-y-6">
          {myRank && myRank.rank && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-4">
                    <Star className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Your Ranking</h3>
                    <p className="text-blue-100">
                      {currentUser?.displayName || currentUser?.email}
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
                    <span className="text-3xl font-bold">{myRank.fanCoin}</span>
                  </div>
                  <div className="text-sm text-blue-100">Fan Coins</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Top 30 Rankings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fan Coins</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fighter Level</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Record</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prestige</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                          player.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                          player.rank <= 10 ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {player.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {player.photoURL ? (
                            <img src={player.photoURL} alt={player.displayName} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                              {player.displayName?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{player.displayName || 'Anonymous'}</div>
                            {currentUser && player.userId?.email === currentUser.email && (
                              <div className="text-xs text-blue-600 font-medium">You</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          <span className="text-2xl font-bold text-yellow-600">{player.fanCoin}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          player.fighterLevel === 'Champion' ? 'bg-yellow-100 text-yellow-800' :
                          player.fighterLevel === 'Main Card' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {player.fighterLevel || 'Preliminary Card'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className="text-green-600 font-bold">{player.totalWins}W</span>
                        {' - '}
                        <span className="text-red-600 font-bold">{player.totalLosses}L</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-semibold">{player.prestige}</span>
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
        </div>
      ) : (
        // Game Tab Content
        <>
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Fan Coins</p>
              <p className="text-2xl font-bold">{gameProgress?.fanCoin || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Fighter Level</p>
              <p className="text-sm font-bold">{fighterLevel}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Level Progress</p>
              <p className="text-2xl font-bold">{levelWins}/{winsNeeded}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Energy</p>
              <p className="text-2xl font-bold">
                {rookieFighter && typeof rookieFighter.energy === 'number' ? rookieFighter.energy : 3}/3
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fan Coin Opportunities */}
      {upcomingEvents.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-yellow-900">
              <Coins className="w-6 h-6 text-yellow-600" />
              Earn Fan Coins - Upcoming Events
            </h2>
            <button
              onClick={() => window.location.href = '/leaderboard'}
              className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              View Leaderboard
            </button>
          </div>
          <p className="text-yellow-800 mb-4">
            Transfer to fighters in these upcoming events. When they win, you earn Fan Coins based on their card position!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-lg">{event.eventName}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Main Event:</span>
                    <span className="font-bold text-purple-600 flex items-center gap-1">
                      <Coins className="w-4 h-4" /> 5 coins
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Co-Main:</span>
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      <Coins className="w-4 h-4" /> 4 coins
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Main Card:</span>
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <Coins className="w-4 h-4" /> 3 coins
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border-l-4 border-yellow-600">
            <p className="text-sm text-gray-700">
              <strong>💡 Pro Tip:</strong> Transfer to fighters before events to maximize your Fan Coin earnings. 
              Higher profile fights = more coins!
            </p>
          </div>
        </div>
      )}

      {/* Fighter Progression Ladder */}
      {gameStatus?.gameProgress && !isRetired && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-400 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-900 mb-4">
            <Trophy className="w-6 h-6 text-purple-600" />
            Fighter Career Ladder
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { level: 'Preliminary Card', wins: 5, coins: 2, color: 'from-gray-400 to-gray-600' },
              { level: 'Main Card', wins: 3, coins: 3, color: 'from-blue-400 to-blue-600' },
              { level: 'Champion', wins: 2, coins: 5, color: 'from-yellow-400 to-yellow-600' }
            ].map((tier, index) => {
              const isCurrent = fighterLevel === tier.level;
              const isCompleted = ['Preliminary Card', 'Main Card', 'Champion']
                .indexOf(fighterLevel) > index;
              
              return (
                <div 
                  key={tier.level}
                  className={`relative p-6 rounded-lg text-center transition-all ${
                    isCurrent 
                      ? `bg-gradient-to-br ${tier.color} text-white shadow-xl scale-105 border-4 border-white` 
                      : isCompleted
                      ? `bg-gradient-to-br ${tier.color} text-white opacity-60`
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      YOU
                    </div>
                  )}
                  <div className="text-3xl font-bold mb-2">{index + 1}</div>
                  <div className="text-sm font-semibold mb-2">{tier.level}</div>
                  <div className="text-xs mb-2">
                    <Coins className="w-4 h-4 inline mr-1" />
                    {tier.coins} coins/win
                  </div>
                  <div className="text-xs font-bold">
                    {tier.wins} wins needed
                  </div>
                  {isCurrent && (
                    <div className="mt-3 text-sm font-bold bg-white/30 rounded px-3 py-2">
                      Progress: {levelWins}/{winsNeeded}
                      {fighterLevel === 'Champion' && (
                        <div className="text-xs mt-1">
                          ({championWins}/5 champion wins)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-purple-800 mt-4">
            🏆 Preliminary: 5 wins → Main Card: 3 wins → Champion: 2 wins to unlock, retire after 5 champion wins
          </p>
        </div>
      )}


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fighter Stats */}
        <div className="lg:col-span-1 space-y-4">
          {/* Training Progress - Always Visible */}
          {!isTransferred && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Training Progress</span>
                <span className="text-sm font-bold text-red-600">{progress}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-red-600 h-4 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              {isEligible && (
                <p className="text-green-600 font-bold mt-2 text-sm">
                  ✅ Eligible to claim real fighter!
                </p>
              )}
              
              {isEligible && !isTransferred && (
                <button
                  onClick={fetchAvailableFighters}
                  disabled={actionLoading}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  Transfer to Real Fighter
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Collapsible Fighter Stats */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowFighterStats(!showFighterStats)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-red-600" />
                {isTransferred ? 'Your Fighter' : 'Rookie Fighter Stats'}
              </h2>
              {showFighterStats ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>

            {showFighterStats && (
              <div className="px-6 pb-6 border-t border-gray-100">
                {!isTransferred ? (
                  <>
                    <div className="space-y-4 mt-4">
                      {stats && Object.keys(stats).length > 0 ? (
                        <>
                          {Object.entries(stats).map(([key, value]) => (
                            <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                                <span className="text-sm font-bold">{value || 50}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${value || 50}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {['striking', 'grappling', 'stamina', 'defense'].map((key) => (
                            <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                                <span className="text-sm font-bold">50/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: '50%' }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-blue-900">Weight Class</span>
                      </div>
                      <p className="text-blue-800">{rookieFighter?.selectedWeightClass}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                    <p className="text-gray-700 font-medium">
                      You've transferred to a real UFC fighter!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fighter Preview Panel */}
          {!isTransferred && previewFighters.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => setShowFighterPreview(!showFighterPreview)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  Available Fighters
                </h2>
                {showFighterPreview ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {showFighterPreview && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mt-4 mb-3">
                    Preview of fighters in your weight class ({rookieFighter?.selectedWeightClass})
                  </p>
                  <div className="space-y-2">
                    {previewFighters.map((fighter, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{fighter.name}</p>
                            {fighter.nickname && (
                              <p className="text-xs text-gray-500">"{fighter.nickname}"</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-700">
                              {fighter.record || `${fighter.wins}-${fighter.losses}-${fighter.draws}`}
                            </p>
                            {fighter.ranking && (
                              <p className="text-xs text-gray-500">#{fighter.ranking}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Complete {12 - (rookieFighter?.trainingSessions || 0)} more training sessions to unlock transfer
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Training Center */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowTrainingCenter(!showTrainingCenter)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-red-600" />
                Training Center
              </h2>
              {showTrainingCenter ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>

            {showTrainingCenter && (
              <div className="px-6 pb-6 border-t border-gray-100">
                {isTransferred ? (
                  <div className="text-center py-12">
                    <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Training Complete!</h3>
                    <p className="text-gray-600">
                      You've successfully transferred to a real UFC fighter. 
                      Check upcoming events to see when your fighter competes!
                    </p>
                  </div>
                ) : (
                  <>
                {rookieFighter && rookieFighter.energy <= 0 && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 mt-4">
                    <p className="text-orange-800 font-medium">
                      ⚡ No energy remaining! Come back tomorrow for 3 new training sessions.
                    </p>
                  </div>
                )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {trainingOptions.map((option) => (
                        <div
                          key={option.type}
                          className="border-2 border-gray-200 rounded-lg p-4 hover:border-red-500 transition-all"
                        >
                          <div className={`${option.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3`}>
                            {option.icon}
                          </div>
                          <h3 className="font-bold text-lg mb-1">{option.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          <p className="text-xs text-gray-500 mb-3">
                            Improves: <span className="font-bold text-red-600">{option.attribute}</span>
                          </p>
                      <button
                        onClick={() => handleTraining(option.type)}
                        disabled={actionLoading || (rookieFighter && rookieFighter.energy <= 0)}
                        className={`w-full py-2 rounded-md font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${option.color} text-white hover:opacity-90`}
                      >
                        {actionLoading ? 'Training...' : 'Train (1 Energy)'}
                      </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-bold mb-2">💡 Training Tips:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Each training session costs 1 energy and gives +1-3 stat points</li>
                    <li>• Energy refreshes daily (3 sessions per day)</li>
                    <li>• Complete 12 sessions to unlock fighter transfer</li>
                    <li>• Win 3 fights to advance to the next level</li>
                    <li>• Progress: Preliminary → Main Card → Co-Main → Main Event → Champion</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Choose Your Fighter</h2>
              <p className="text-gray-600">Select a fighter from {rookieFighter?.selectedWeightClass}</p>
            </div>
            
            <div className="p-6">
              {availableFighters.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No fighters available in this weight class</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableFighters.map((fighter) => (
                    <div
                      key={fighter._id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-red-500 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {fighter.imageUrl && (
                          <img
                            src={fighter.imageUrl}
                            alt={fighter.name}
                            className="w-20 h-20 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{fighter.name}</h3>
                          {fighter.nickname && (
                            <p className="text-sm text-gray-600">"{fighter.nickname}"</p>
                          )}
                          <p className="text-sm text-gray-700 mt-1">
                            Record: <span className="font-bold">{fighter.record || `${fighter.wins}-${fighter.losses}-${fighter.draws}`}</span>
                          </p>
                          {fighter.ranking && (
                            <p className="text-sm text-gray-700">
                              Rank: <span className="font-bold">#{fighter.ranking}</span>
                            </p>
                          )}
                          <button
                            onClick={() => handleTransfer(fighter._id)}
                            disabled={actionLoading}
                            className="mt-3 w-full bg-red-600 text-white py-2 rounded-md font-bold hover:bg-red-700 transition-colors disabled:bg-gray-400"
                          >
                            {actionLoading ? 'Transferring...' : 'Select Fighter'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;

