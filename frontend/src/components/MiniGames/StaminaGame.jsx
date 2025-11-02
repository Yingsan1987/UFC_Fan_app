import { useState, useEffect, useRef } from 'react';
import { Heart, Zap, Check, TrendingUp } from 'lucide-react';

const StaminaGame = ({ onComplete, onCancel }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, complete
  const [speed, setSpeed] = useState(50); // Speed level 0-100
  const [greenZoneCenter, setGreenZoneCenter] = useState(50); // Center of green zone
  const [timeLeft, setTimeLeft] = useState(10);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(Date.now());
  const [totalXPGained, setTotalXPGained] = useState(0);
  const [distanceRan, setDistanceRan] = useState(0);
  const [currentTerrain, setCurrentTerrain] = useState('Flat Road');
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);
  const zoneShiftRef = useRef(null);
  const xpGainRef = useRef(null);

  const greenZoneWidth = 20; // Width of green zone (±10 from center)
  const dayNumber = Math.floor(Math.random() * 100) + 1; // Random training day

  const terrains = [
    'Flat Road',
    'Uphill 🏔️',
    'Downhill ⬇️',
    'Windy 💨',
    'Trail 🌲'
  ];

  // Game timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      completeGame();
    }
  }, [gameState, timeLeft]);

  // Speed decay (naturally slows down if not tapping)
  useEffect(() => {
    if (gameState === 'playing') {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;
        
        setSpeed(prev => {
          let newSpeed = prev;
          
          // Speed decays if not tapping (simulates slowing down)
          if (timeSinceLastTap > 300) {
            newSpeed = Math.max(0, prev - 2); // Decay rate
          }
          
          return newSpeed;
        });

        // Update distance based on speed (speed/50 = multiplier)
        setDistanceRan(prev => prev + (speed / 5000));
        
      }, 100);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [gameState, lastTapTime, speed]);

  // Green zone shifting (simulates terrain changes)
  useEffect(() => {
    if (gameState === 'playing') {
      const shiftZone = () => {
        const nextShiftDelay = Math.random() * 2000 + 1500; // Shift every 1.5-3.5 seconds
        
        setGreenZoneCenter(prev => {
          // Random shift between -15 and +15
          const shift = (Math.random() - 0.5) * 30;
          const newCenter = Math.max(30, Math.min(70, prev + shift));
          return newCenter;
        });

        // Change terrain randomly
        const randomTerrain = terrains[Math.floor(Math.random() * terrains.length)];
        setCurrentTerrain(randomTerrain);
        
        zoneShiftRef.current = setTimeout(shiftZone, nextShiftDelay);
      };
      
      shiftZone();
      
      return () => {
        if (zoneShiftRef.current) clearTimeout(zoneShiftRef.current);
      };
    }
  }, [gameState]);

  // XP gain system (continuous when in green zone)
  useEffect(() => {
    if (gameState === 'playing') {
      xpGainRef.current = setInterval(() => {
        const inGreenZone = Math.abs(speed - greenZoneCenter) <= (greenZoneWidth / 2);
        
        if (inGreenZone) {
          // Award small XP continuously for staying in zone
          setTotalXPGained(prev => prev + 0.1);
        }
      }, 100);

      return () => {
        if (xpGainRef.current) clearInterval(xpGainRef.current);
      };
    }
  }, [gameState, speed, greenZoneCenter]);

  const startGame = () => {
    setGameState('playing');
    setSpeed(50);
    setGreenZoneCenter(50);
    setTimeLeft(10);
    setTapCount(0);
    setTotalXPGained(0);
    setDistanceRan(0);
    setCurrentTerrain('Flat Road');
    setLastTapTime(Date.now());
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;

    const now = Date.now();
    setLastTapTime(now);
    setTapCount(prev => prev + 1);

    // Increase speed when tapping
    setSpeed(prev => {
      const newSpeed = Math.min(100, prev + 8); // Cap at 100
      return newSpeed;
    });
  };

  const completeGame = () => {
    setGameState('complete');

    // Calculate final XP (1-5 based on performance)
    const finalXP = Math.round(totalXPGained);
    let xpGained = Math.max(1, Math.min(5, finalXP));
    
    let performance = '';
    if (xpGained >= 5) {
      performance = 'Perfect Pace!';
    } else if (xpGained >= 4) {
      performance = 'Great Run!';
    } else if (xpGained >= 3) {
      performance = 'Good Effort!';
    } else if (xpGained >= 2) {
      performance = 'Decent Pace';
    } else {
      performance = 'Keep Training!';
    }

    setResult({
      xpGained,
      performance,
      distanceRan: distanceRan.toFixed(2),
      tapCount,
      dayNumber
    });

    setTimeout(() => {
      onComplete(xpGained);
    }, 3000);
  };

  const getSpeedZoneColor = () => {
    const distanceFromCenter = Math.abs(speed - greenZoneCenter);
    
    if (distanceFromCenter <= greenZoneWidth / 2) {
      return 'bg-green-500'; // In green zone
    } else if (distanceFromCenter <= greenZoneWidth) {
      return 'bg-yellow-500'; // Near zone
    } else {
      return 'bg-red-500'; // Out of zone
    }
  };

  const getSpeedStatus = () => {
    const distanceFromCenter = Math.abs(speed - greenZoneCenter);
    
    if (distanceFromCenter <= greenZoneWidth / 2) {
      return '✅ Perfect Pace!';
    } else if (speed > greenZoneCenter + greenZoneWidth / 2) {
      return '⚡ Too Fast!';
    } else {
      return '🐌 Too Slow!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🏃‍♂️</span>
            Road Work
          </h2>
          <p className="text-gray-600">Keep your pace in the green zone!</p>
        </div>

        {gameState === 'ready' && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Day {dayNumber} Training</strong>
              </p>
              <p className="text-xs text-gray-600">Sprint pace timing drill</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Instructions:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tap to increase your running speed</li>
                <li>• Keep speed needle in the GREEN ZONE</li>
                <li>• Green zone shifts (simulating terrain)</li>
                <li>• Stay centered = earn XP continuously</li>
                <li>• Out of bounds = lose efficiency</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚡ Strategy:</strong> Don't spam tap! Find the rhythm that keeps you in the green zone as it moves.
              </p>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Start Running!
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* Timer and Stats */}
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">⏱️ {timeLeft}s</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Distance</div>
                <div className="text-xl font-bold text-blue-600">{distanceRan.toFixed(2)} km</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">XP</div>
                <div className="text-xl font-bold text-green-600">{Math.round(totalXPGained)}</div>
              </div>
            </div>

            {/* Terrain */}
            <div className="text-center">
              <div className="text-sm font-bold text-gray-700 bg-gray-100 rounded px-3 py-1 inline-block">
                {currentTerrain}
              </div>
            </div>

            {/* Speed Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Speed</span>
                <span className={`font-bold ${
                  Math.abs(speed - greenZoneCenter) <= greenZoneWidth / 2 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {getSpeedStatus()}
                </span>
              </div>
              
              {/* Speed bar with green zone indicator */}
              <div className="relative h-16 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
                {/* Green zone background */}
                <div
                  className="absolute top-0 bottom-0 bg-green-200/60 border-2 border-green-400 transition-all duration-1000"
                  style={{
                    left: `${Math.max(0, greenZoneCenter - greenZoneWidth / 2)}%`,
                    width: `${greenZoneWidth}%`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-700" />
                  </div>
                </div>

                {/* Center marker of green zone */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-green-700"
                  style={{ left: `${greenZoneCenter}%` }}
                />

                {/* Speed needle */}
                <div
                  className={`absolute top-0 bottom-0 w-2 ${getSpeedZoneColor()} transition-all duration-100 shadow-lg`}
                  style={{ left: `${speed}%` }}
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-current"></div>
                </div>
              </div>

              {/* Speed scale */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span className="font-bold text-green-600">ZONE</span>
                <span>100</span>
              </div>
            </div>

            {/* Tap Button */}
            <button
              onClick={handleTap}
              onTouchStart={handleTap}
              className="w-full py-12 rounded-lg font-bold text-xl transition-all active:scale-95 shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              🏃‍♂️ TAP TO RUN
            </button>

            {/* XP Gain Indicator */}
            {Math.abs(speed - greenZoneCenter) <= greenZoneWidth / 2 && (
              <div className="bg-green-100 border-2 border-green-400 rounded-lg p-2 text-center animate-pulse">
                <p className="text-green-800 font-bold text-sm">
                  ⭐ Earning XP! Keep it up!
                </p>
              </div>
            )}
          </div>
        )}

        {gameState === 'complete' && result && (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <Check className="w-16 h-16 mx-auto text-green-500 mb-2" />
              <h3 className="text-2xl font-bold text-green-700 mb-3">
                {result.performance}
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="text-lg font-bold text-blue-600">
                  Road Work Day {result.dayNumber}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  You ran {result.distanceRan} km! 🏃‍♂️
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-gray-600">Total Taps</div>
                    <div className="text-xl font-bold">{result.tapCount}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-gray-600">XP Earned</div>
                    <div className="text-xl font-bold text-green-600">+{result.xpGained}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg">
              <div className="text-3xl font-bold">+{result.xpGained} Stamina XP</div>
            </div>

            {result.xpGained >= 5 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg font-bold animate-bounce">
                🏆 Perfect Run!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaminaGame;
