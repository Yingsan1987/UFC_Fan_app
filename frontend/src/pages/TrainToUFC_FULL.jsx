import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Train, ArrowLeft, Trophy, Zap, Users, Target, TrendingUp } from 'lucide-react';
import axios from 'axios';
import AnimatedTrain from '../components/TrainToUFC/AnimatedTrain';
import FightVisualization from '../components/TrainToUFC/FightVisualization';
import DraggableFighter from '../components/TrainToUFC/DraggableFighter';

// Use localhost in development, production URL as fallback
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ufc-fan-app-backend.onrender.com/api');

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://ufc-fan-app-backend.onrender.com');

const TrainToUFC = () => {
  const { currentUser, getAuthToken } = useAuth();
  const navigate = useNavigate();
  
  // Game state
  const [gameState, setGameState] = useState('avatar-builder');
  const [avatar, setAvatar] = useState(null);
  const [train, setTrain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [fightResult, setFightResult] = useState(null);
  const [showFightModal, setShowFightModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Socket.io
  const socketRef = useRef(null);
  
  // Avatar builder state
  const [avatarConfig, setAvatarConfig] = useState({
    name: '',
    weightClass: 'Lightweight',
    outfitColor: '#DC143C',
    stats: {
      striking: 50,  // STR
      speed: 50,      // SPD
      stamina: 50,    // END
      grappling: 50,  // TECH
      luck: 50        // LCK
    }
  });

  const weightClasses = [
    'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
    'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  const colorOptions = [
    { name: 'Red', value: '#DC143C' },
    { name: 'Blue', value: '#0066CC' },
    { name: 'Green', value: '#228B22' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#808080' },
    { name: 'Yellow', value: '#FFD700' }
  ];

  // Initialize game and Socket.io
  useEffect(() => {
    if (!currentUser) return;
    
    fetchGameState();
    
    // Initialize Socket.io connection
    socketRef.current = io(`${SOCKET_URL}/train-to-ufc`);
    
    socketRef.current.on('connect', () => {
      console.log('🚂 Connected to train socket');
    });
    
    socketRef.current.on('train-state', (data) => {
      console.log('📊 Received train state:', data);
      if (data.train) {
        setTrain(data.train);
      }
    });
    
    socketRef.current.on('train-update', (data) => {
      console.log('🔄 Train update:', data);
      if (data.train) {
        setTrain(data.train);
        if (data.update.type === 'fighter-joined') {
          setMessage({ text: 'Fighter joined the train!', type: 'success' });
        }
      }
    });
    
    socketRef.current.on('fight-result', (data) => {
      console.log('⚔️ Fight result:', data);
      setFightResult(data);
      setShowFightModal(true);
      
      // Refresh train state
      if (data.trainId) {
        fetchTrainStatus(data.trainId);
      }
    });
    
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      setMessage({ text: error.message || 'Socket connection error', type: 'error' });
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser]);

  // Join train room when train is available
  useEffect(() => {
    if (train && train._id && socketRef.current) {
      socketRef.current.emit('join-train', { trainId: train._id });
      console.log('✅ Joined train room:', train._id);
    }
    
    return () => {
      if (train && train._id && socketRef.current) {
        socketRef.current.emit('leave-train', { trainId: train._id });
      }
    };
  }, [train]);

  const fetchGameState = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/train-to-ufc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.avatar) {
        setAvatar(response.data.avatar);
        setGameState('training');
        if (response.data.train) {
          setTrain(response.data.train);
          setGameState('train-active');
        }
      } else {
        setGameState('avatar-builder');
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      if (error.response?.status === 404) {
        setGameState('avatar-builder');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainStatus = async (trainId) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/train-to-ufc/train-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.train) {
        setTrain(response.data.train);
      }
    } catch (error) {
      console.error('Error fetching train status:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/train-to-ufc/leaderboard?sortBy=wins&limit=20`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const createAvatar = async () => {
    if (!avatarConfig.name.trim()) {
      setMessage({ text: 'Please enter a name for your fighter', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/train-to-ufc/create-avatar`,
        avatarConfig,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setAvatar(response.data.avatar);
      setGameState('training');
      setMessage({ text: 'Avatar created successfully!', type: 'success' });
    } catch (error) {
      console.error('Error creating avatar:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to create avatar', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const joinTrain = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/train-to-ufc/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTrain(response.data.train);
      setAvatar(response.data.avatar);
      setGameState('train-active');
      setMessage({ text: 'You joined the train!', type: 'success' });
      
      // Join socket room
      if (socketRef.current && response.data.train?._id) {
        socketRef.current.emit('join-train', { trainId: response.data.train._id });
      }
    } catch (error) {
      console.error('Error joining train:', error);
      setMessage({ 
        text: error.response?.data?.message || error.response?.data?.reason || 'Failed to join train', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (carNumber, spotNumber, fighter) => {
    // Validate weight class match if spot is already occupied
    if (train && train.cars) {
      const car = train.cars[carNumber - 1];
      const otherSpot = spotNumber === 1 ? car.spot2 : car.spot1;
      
      if (otherSpot.occupied && otherSpot.avatarId?.weightClass !== fighter.weightClass) {
        setMessage({
          text: `Weight class mismatch! Can only fight fighters in ${fighter.weightClass}`,
          type: 'error'
        });
        return;
      }
    }
    
    // Join train will auto-place the fighter
    await joinTrain();
  };

  const handleFighterClick = (fighter, carNumber, spotNumber) => {
    // Show fighter stats modal or details
    console.log('Fighter clicked:', fighter);
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Train className="w-20 h-20 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🚂 Train to UFC</h2>
          <p className="text-gray-600 mb-6">Sign in to start your journey on the train!</p>
        </div>
      </div>
    );
  }

  if (loading && gameState === 'avatar-builder') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Avatar Builder Screen
  if (gameState === 'avatar-builder') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Game Selection
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Train className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🚂 Train to UFC</h1>
            <p className="text-xl text-gray-600">Build your fighter and survive the train!</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Avatar Preview */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Avatar Preview</h3>
              <div className="bg-white rounded-lg p-8 flex items-center justify-center min-h-[300px] border-2 border-gray-300">
                <div className="text-center">
                  <div
                    className="w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 shadow-lg"
                    style={{
                      backgroundColor: avatarConfig.outfitColor || '#DC143C',
                      borderColor: avatarConfig.outfitColor || '#DC143C'
                    }}
                  >
                    {avatarConfig.name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{avatarConfig.name || 'Your Fighter'}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-red-100 p-2 rounded">STR: {avatarConfig.stats.striking}</div>
                    <div className="bg-blue-100 p-2 rounded">SPD: {avatarConfig.stats.speed}</div>
                    <div className="bg-green-100 p-2 rounded">END: {avatarConfig.stats.stamina}</div>
                    <div className="bg-purple-100 p-2 rounded">TECH: {avatarConfig.stats.grappling}</div>
                    <div className="bg-yellow-100 p-2 rounded col-span-2">LCK: {avatarConfig.stats.luck}</div>
                  </div>
                  {avatarConfig.weightClass && (
                    <div className="mt-2 text-center">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {avatarConfig.weightClass}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Avatar Customization */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fighter Name *
                </label>
                <input
                  type="text"
                  value={avatarConfig.name}
                  onChange={(e) => setAvatarConfig({ ...avatarConfig, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  placeholder="Enter fighter name"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Class * (Only same weight class can fight)
                </label>
                <select
                  value={avatarConfig.weightClass}
                  onChange={(e) => setAvatarConfig({ ...avatarConfig, weightClass: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                >
                  {weightClasses.map(wc => (
                    <option key={wc} value={wc}>{wc}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose your weight class. You can only fight fighters in the same class!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outfit Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAvatarConfig({ ...avatarConfig, outfitColor: color.value })}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        avatarConfig.outfitColor === color.value
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stats (All start at 50)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  You'll improve these through training before joining the train!
                </p>
                <div className="space-y-2">
                  {Object.entries(avatarConfig.stats).map(([stat, value]) => (
                    <div key={stat}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{stat === 'striking' ? 'STR' : stat === 'speed' ? 'SPD' : stat === 'stamina' ? 'END' : stat === 'grappling' ? 'TECH' : 'LCK'}</span>
                        <span className="text-sm font-bold">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={createAvatar}
                disabled={loading || !avatarConfig.name.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-lg font-bold hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Avatar & Start Training
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Training Screen
  if (gameState === 'training') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Game Selection
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Training Phase</h1>
            <p className="text-gray-600 mb-6">
              Training mini-games will be implemented here to improve your stats!
            </p>
            
            {/* Current Stats Display */}
            {avatar && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Your Fighter Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{avatar.stats.striking || 50}</div>
                    <div className="text-sm text-gray-600">STR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{avatar.stats.speed || 50}</div>
                    <div className="text-sm text-gray-600">SPD</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{avatar.stats.stamina || 50}</div>
                    <div className="text-sm text-gray-600">END</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{avatar.stats.grappling || 50}</div>
                    <div className="text-sm text-gray-600">TECH</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{avatar.stats.luck || 50}</div>
                    <div className="text-sm text-gray-600">LCK</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    {avatar.weightClass || 'Lightweight'}
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={joinTrain}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-4 rounded-lg font-bold hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-50 text-lg"
            >
              Join the Train 🚂
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Train Active Screen
  if (gameState === 'train-active' && train && avatar) {
    // Fetch leaderboard when showing train
    useEffect(() => {
      if (showLeaderboard) {
        fetchLeaderboard();
      }
    }, [showLeaderboard]);

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Game Selection
          </button>
          
          {/* Leaderboard Toggle */}
          <button
            onClick={() => {
              setShowLeaderboard(!showLeaderboard);
              if (!showLeaderboard) fetchLeaderboard();
            }}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Trophy className="w-5 h-5" />
            Leaderboard
          </button>
        </div>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Train View */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Train className="w-6 h-6 text-red-600" />
                Moving Train
              </h2>
              <AnimatedTrain
                train={train}
                onDrop={handleDrop}
                myAvatar={avatar}
                onFighterClick={handleFighterClick}
                isAnimating={train.isMoving !== false}
              />
            </div>

            {/* Fighter Pool (for drag-and-drop) */}
            {!avatar.onTrain && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Your Fighter</h3>
                <div className="max-w-xs">
                  <DraggableFighter fighter={avatar} />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  👆 Drag your fighter to an empty spot on the train!
                </p>
              </div>
            )}

            {/* Your Fighter Stats (if on train) */}
            {avatar.onTrain && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  Your Fighter
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 shadow-lg"
                      style={{
                        backgroundColor: avatar.outfitColor || '#DC143C',
                        borderColor: avatar.outfitColor || '#DC143C'
                      }}
                    >
                      {avatar.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{avatar.name}</h4>
                      <p className="text-sm text-gray-600">{avatar.weightClass}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          W: {avatar.wins || 0}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          L: {avatar.losses || 0}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Streak: {avatar.currentStreak || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="text-center bg-red-50 p-2 rounded">
                      <div className="font-bold text-red-600">STR</div>
                      <div>{avatar.stats.striking || 0}</div>
                    </div>
                    <div className="text-center bg-blue-50 p-2 rounded">
                      <div className="font-bold text-blue-600">SPD</div>
                      <div>{avatar.stats.speed || 0}</div>
                    </div>
                    <div className="text-center bg-green-50 p-2 rounded">
                      <div className="font-bold text-green-600">END</div>
                      <div>{avatar.stats.stamina || 0}</div>
                    </div>
                    <div className="text-center bg-purple-50 p-2 rounded">
                      <div className="font-bold text-purple-600">TECH</div>
                      <div>{avatar.stats.grappling || 0}</div>
                    </div>
                    <div className="text-center bg-yellow-50 p-2 rounded">
                      <div className="font-bold text-yellow-600">LCK</div>
                      <div>{avatar.stats.luck || 0}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Level:</span>
                      <span className="font-bold ml-2">{avatar.level || 1}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">XP:</span>
                      <span className="font-bold ml-2">{avatar.xp || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Coins:</span>
                      <span className="font-bold ml-2">{avatar.coins || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tokens:</span>
                      <span className="font-bold ml-2">{avatar.trainTokens || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Leaderboard
              </h3>
              
              {leaderboard.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">
                  Loading leaderboard...
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player._id || index}
                      className={`p-2 rounded-lg border-2 ${
                        player._id === avatar._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-600">
                          #{player.rank || index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{player.name}</div>
                          <div className="flex gap-2 text-xs text-gray-600">
                            <span>W: {player.wins || 0}</span>
                            <span>Streak: {player.longestStreak || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fight Visualization Modal */}
        {showFightModal && fightResult && (
          <FightVisualization
            fightResult={fightResult}
            fighters={{
              fighter1: train?.cars?.find(c => c.spot1.avatarId?._id === fightResult.winner._id)?.spot1.avatarId || 
                       train?.cars?.find(c => c.spot2.avatarId?._id === fightResult.winner._id)?.spot2.avatarId,
              fighter2: fightResult.loser
            }}
            onClose={() => {
              setShowFightModal(false);
              setFightResult(null);
            }}
            onComplete={() => {
              // Refresh train state after fight
              if (train?._id) {
                fetchTrainStatus(train._id);
              }
            }}
          />
        )}
      </div>
    );
  }

  // Game Over / Eliminated Screen
  if (avatar?.eliminated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">You've Been Eliminated!</h2>
          <p className="text-gray-600 mb-6">
            Better luck next time! Your stats: {avatar.wins} wins, {avatar.losses} losses
          </p>
          <button
            onClick={() => {
              setAvatar({ ...avatar, eliminated: false });
              setGameState('training');
            }}
            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-3 rounded-lg font-bold hover:from-red-700 hover:to-red-900 transition-all"
          >
            Create New Avatar & Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TrainToUFC;

