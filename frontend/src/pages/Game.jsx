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
  Calendar
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
    `${rookieFighter.trainingSessions}/${rookieFighter.trainingGoal}` : '0/50';
  const progressPercent = rookieFighter ? 
    (rookieFighter.trainingSessions / rookieFighter.trainingGoal) * 100 : 0;
  const isEligible = rookieFighter && 
    rookieFighter.trainingSessions >= rookieFighter.trainingGoal && 
    !isTransferred;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Message Banner */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <p className="text-sm text-gray-600">Prestige</p>
              <p className="text-2xl font-bold">{gameProgress?.prestige || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Energy</p>
              <p className="text-2xl font-bold">{rookieFighter?.energy || 0}/3</p>
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fighter Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-red-600" />
              {isTransferred ? 'Your Fighter' : 'Rookie Fighter'}
            </h2>

            {!isTransferred ? (
              <>
                <div className="mb-6">
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
                </div>

                <div className="space-y-4">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                        <span className="text-sm font-bold">{value}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
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

            {isEligible && !isTransferred && (
              <button
                onClick={fetchAvailableFighters}
                disabled={actionLoading}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                Transfer to Real Fighter
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Training Options */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-red-600" />
              Training Center
            </h2>

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
                {rookieFighter?.energy === 0 && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                    <p className="text-orange-800 font-medium">
                      ⚡ No energy remaining! Come back tomorrow for 3 new training sessions.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        disabled={actionLoading || rookieFighter?.energy === 0}
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
                    <li>• Complete 50 sessions to unlock fighter transfer</li>
                    <li>• Balanced training creates a well-rounded fighter</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Choose Your Fighter</h2>
              <p className="text-gray-600">Select a fighter from {placeholderFighter?.selectedWeightClass}</p>
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

