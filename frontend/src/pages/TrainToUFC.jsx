import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Train, ArrowLeft, Trophy, Target, Users } from 'lucide-react';
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
  const [gameState, setGameState] = useState('avatar-builder'); // 'avatar-builder', 'training', 'train-active', 'game-over'
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
    skinColor: '#fdbcb4',
    hairColor: '#8B4513',
    hairStyle: 'short',
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

  const hairStyles = ['short', 'medium', 'long', 'bald'];
  const colorOptions = [
    { name: 'Red', value: '#DC143C' },
    { name: 'Blue', value: '#0066CC' },
    { name: 'Green', value: '#228B22' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#808080' },
    { name: 'Yellow', value: '#FFD700' }
  ];

  // Define ALL helper functions FIRST (before hooks that use them)
  const fetchTrainStatus = async (trainId) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/train-to-ufc/train-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.train) {
        setTrain(response.data.train);
        if (response.data.myAvatar) {
          setAvatar(response.data.myAvatar);
        }
      }
    } catch (error) {
      console.error('Error fetching train status:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/train-to-ufc/leaderboard?sortBy=wins&limit=20`);
      if (response.data && response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]); // Set empty array on error
    }
  };

  // Fetch leaderboard when train becomes active - MUST be AFTER function definitions but BEFORE early returns
  useEffect(() => {
    if (gameState === 'train-active' && train && avatar) {
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, train, avatar]);

  const fetchGameState = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        setGameState('avatar-builder');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/train-to-ufc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.avatar) {
        setAvatar(response.data.avatar);
        if (response.data.train) {
          setTrain(response.data.train);
          setGameState('train-active');
        } else {
          setGameState('training');
        }
      } else {
        setGameState('avatar-builder');
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      // 404 means no avatar exists yet - this is normal
      if (error.response?.status === 404) {
        setGameState('avatar-builder');
      } else {
        // Other errors - show error message but still allow avatar creation
        setMessage({ 
          text: error.response?.data?.message || 'Failed to load game state. You can still create an avatar.', 
          type: 'error' 
        });
        setGameState('avatar-builder');
      }
    } finally {
      setLoading(false);
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
      const response = await axios.post(`${API_URL}/train-to-ufc/create-avatar`, avatarConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvatar(response.data.avatar);
      setGameState('training');
      setMessage({ text: 'Avatar created successfully! Now start training!', type: 'success' });
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
      const response = await axios.post(`${API_URL}/train-to-ufc/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTrain(response.data.train);
      setAvatar(response.data.avatar || avatar);
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
    // If dropping on train, place fighter there
    if (carNumber && spotNumber) {
      try {
        setLoading(true);
        const token = await getAuthToken();
        const response = await axios.post(
          `${API_URL}/train-to-ufc/place-fighter`,
          { trainId: train._id, carNumber, spotNumber },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data) {
          if (response.data.train) {
            setTrain(response.data.train);
          }
          if (response.data.avatar) {
            setAvatar(response.data.avatar);
          }
          setMessage({ text: response.data.message || 'Fighter placed on train!', type: 'success' });
          
          // Refresh train state via socket
          if (socketRef.current && train?._id) {
            socketRef.current.emit('train-update-request', { trainId: train._id });
          }
        }
      } catch (error) {
        console.error('Error placing fighter:', error);
        setMessage({ 
          text: error.response?.data?.message || 'Failed to place fighter on train', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle dropping fighter back to waiting zone
  const handleDropToWaitingZone = async (fighter) => {
    if (!fighter || !train) return;
    
    // Only allow removing your own fighter
    if (avatar && fighter._id === avatar._id) {
      try {
        setLoading(true);
        const token = await getAuthToken();
        const response = await axios.post(
          `${API_URL}/train-to-ufc/leave-train`,
          { trainId: train._id },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data) {
          if (response.data.avatar) {
            setAvatar(response.data.avatar);
          }
          if (response.data.train) {
            setTrain(response.data.train);
          }
          setMessage({ text: response.data.message || 'Fighter moved back to waiting zone!', type: 'success' });
          
          // Refresh train state via socket
          if (socketRef.current && train?._id) {
            socketRef.current.emit('train-update-request', { trainId: train._id });
          }
        }
      } catch (error) {
        console.error('Error removing fighter from train:', error);
        setMessage({ 
          text: error.response?.data?.message || 'Failed to remove fighter from train', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFighterClick = (fighter, carNumber, spotNumber) => {
    // Show fighter stats modal or details
    console.log('Fighter clicked:', fighter);
  };

  // NOW define all hooks AFTER function definitions but BEFORE early returns
  // Initialize game and Socket.io
  useEffect(() => {
    if (!currentUser) return;
    
    fetchGameState();
    
    // Initialize Socket.io connection (optional - won't crash if fails)
    try {
      socketRef.current = io(`${SOCKET_URL}/train-to-ufc`, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });
      
      socketRef.current.on('connect', () => {
        console.log('🚂 Connected to train socket');
      });
      
      socketRef.current.on('train-state', (data) => {
        console.log('📊 Received train state:', data);
        if (data && data.train) {
          setTrain(data.train);
        }
      });
      
      socketRef.current.on('train-update', (data) => {
        console.log('🔄 Train update:', data);
        if (data && data.train) {
          setTrain(data.train);
          if (data.update && data.update.type === 'fighter-joined') {
            setMessage({ text: 'Fighter joined the train!', type: 'success' });
          }
        }
      });
      
      socketRef.current.on('fight-result', (data) => {
        console.log('⚔️ Fight result:', data);
        if (data) {
          setFightResult(data);
          setShowFightModal(true);
          
          // Refresh train state
          if (data.trainId) {
            fetchTrainStatus(data.trainId);
          }
        }
      });
      
      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
        // Don't show error to user - socket is optional
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.warn('Socket connection error (non-critical):', error.message);
        // Don't show error - socket is optional for offline mode
      });
    } catch (error) {
      console.warn('Socket.io not available (non-critical):', error.message);
      // Continue without socket - not required for basic functionality
    }
    
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (error) {
          console.warn('Error disconnecting socket:', error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Fetch leaderboard when train becomes active
  useEffect(() => {
    if (gameState === 'train-active' && train && avatar) {
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, train, avatar]);

  // Early returns start here
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Train className="w-20 h-20 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🚂 Train to UFC</h2>
          <p className="text-gray-600 mb-6">Sign in to start your journey on the train!</p>
        </div>
      </div>
    );
  }


  // Loading state
  if (loading && gameState === 'avatar-builder' && !avatar) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
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
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-4xl font-bold border-4 border-red-800">
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
                  Weight Class *
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
                  Only fighters in the same weight class can fight!
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
                        <span className="text-sm font-medium capitalize">{stat}</span>
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

  // Training Screen (to be implemented)
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

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Training Phase</h1>
          <p className="text-gray-600 mb-6">
            Train your fighter to improve stats before joining the train!
          </p>
          <button
            onClick={joinTrain}
            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-3 rounded-lg font-bold hover:from-red-700 hover:to-red-900 transition-all"
          >
            Join the Train 🚂
          </button>
        </div>
      </div>
    );
  }

  // Train Active Screen - Full Implementation
  // Show train even if avatar doesn't exist yet (so user can see train and create avatar)
  if (gameState === 'train-active' && train) {
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

        {/* Show message if no avatar exists */}
        {!avatar && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-100 border-2 border-yellow-400">
            <p className="text-yellow-800 font-bold mb-2">⚠️ No Fighter Avatar Yet!</p>
            <p className="text-yellow-700 text-sm mb-3">
              You need to create a fighter avatar first before you can join the train.
            </p>
            <button
              onClick={() => setGameState('avatar-builder')}
              className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-6 py-2 rounded-lg font-bold hover:from-yellow-700 hover:to-yellow-900 transition-all"
            >
              Create Fighter Avatar Now
            </button>
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
              {train && train.cars && Array.isArray(train.cars) && train.cars.length > 0 ? (
                <AnimatedTrain
                  train={train}
                  onDrop={handleDrop}
                  onDragStart={(fighter, carNumber, spotNumber, e) => {
                    console.log('Fighter drag started from train:', fighter);
                  }}
                  myAvatar={avatar}
                  onFighterClick={handleFighterClick}
                  isAnimating={train.isMoving !== false}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No train data available. Loading...</p>
                  <p className="text-sm mt-2">If this persists, try refreshing the page.</p>
                </div>
              )}
            </div>

            {/* Fighter Pool (for drag-and-drop) - Always show when avatar exists and not on train */}
            {avatar && (!avatar.onTrain || avatar.onTrain === false) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-300">
                <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Your Fighter
                </h3>
                <div className="max-w-xs mx-auto mb-4">
                  <DraggableFighter fighter={avatar} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-gray-700">
                    👆 Drag your fighter to an empty spot on the train!
                  </p>
                  <p className="text-xs text-gray-600">
                    Or use the button below to auto-place on the train
                  </p>
                  <button
                    onClick={joinTrain}
                    disabled={loading}
                    className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {loading ? 'Joining...' : 'Join Train Automatically'}
                  </button>
                </div>
              </div>
            )}

            {/* Your Fighter Stats (if on train) */}
            {avatar && avatar.onTrain && (
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
                      <h4 className="text-lg font-bold">{avatar?.name || 'Unknown'}</h4>
                      <p className="text-sm text-gray-600">{avatar?.weightClass || 'N/A'}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          W: {avatar?.wins || 0}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          L: {avatar?.losses || 0}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Streak: {avatar?.currentStreak || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="text-center bg-red-50 p-2 rounded">
                      <div className="font-bold text-red-600">STR</div>
                      <div>{avatar?.stats?.striking || 0}</div>
                    </div>
                    <div className="text-center bg-blue-50 p-2 rounded">
                      <div className="font-bold text-blue-600">SPD</div>
                      <div>{avatar?.stats?.speed || 0}</div>
                    </div>
                    <div className="text-center bg-green-50 p-2 rounded">
                      <div className="font-bold text-green-600">END</div>
                      <div>{avatar?.stats?.stamina || 0}</div>
                    </div>
                    <div className="text-center bg-purple-50 p-2 rounded">
                      <div className="font-bold text-purple-600">TECH</div>
                      <div>{avatar?.stats?.grappling || 0}</div>
                    </div>
                    <div className="text-center bg-yellow-50 p-2 rounded">
                      <div className="font-bold text-yellow-600">LCK</div>
                      <div>{avatar?.stats?.luck || 0}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Level:</span>
                      <span className="font-bold ml-2">{avatar?.level || 1}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">XP:</span>
                      <span className="font-bold ml-2">{avatar?.xp || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Coins:</span>
                      <span className="font-bold ml-2">{avatar?.coins || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tokens:</span>
                      <span className="font-bold ml-2">{avatar?.trainTokens || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Leaderboard */}
          {showLeaderboard && (
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
          )}
        </div>

        {/* Fight Visualization Modal */}
        {showFightModal && fightResult && (
          <FightVisualization
            fightResult={fightResult}
            fighters={{
              fighter1: train?.cars?.find(c => c.spot1.avatarId?._id === fightResult.winner._id)?.spot1.avatarId || 
                       train?.cars?.find(c => c.spot2.avatarId?._id === fightResult.winner._id)?.spot2.avatarId ||
                       { name: fightResult.winner.name, outfitColor: '#DC143C' },
              fighter2: { name: fightResult.loser.name, outfitColor: '#0066CC' }
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
            Better luck next time! Your stats: {avatar.wins || 0} wins, {avatar.losses || 0} losses
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default TrainToUFC;

