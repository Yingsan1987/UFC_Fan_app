import { useState, useEffect, useRef } from 'react';
import { Heart, Zap, Check } from 'lucide-react';

const StaminaGame = ({ onComplete, onCancel }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, complete
  const [staminaBar, setStaminaBar] = useState(100);
  const [timeLeft, setTimeLeft] = useState(10); // Back to 10s for better balance
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(Date.now());
  const [drainRate, setDrainRate] = useState(2.5); // Reduced for more fun (was 4)
  const [isOverheating, setIsOverheating] = useState(false);
  const [result, setResult] = useState(null);
  const [resistance, setResistance] = useState(1);
  const intervalRef = useRef(null);
  const cooldownRef = useRef(null);

  // Randomize resistance pattern (balanced range)
  useEffect(() => {
    const randomResistance = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 (more forgiving)
    setResistance(randomResistance);
  }, []);

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

  // Stamina drain
  useEffect(() => {
    if (gameState === 'playing') {
      intervalRef.current = setInterval(() => {
        setStaminaBar(prev => {
          const now = Date.now();
          const timeSinceLastTap = now - lastTapTime;
          
          let currentDrainRate = drainRate;
          
          // If no tap in 1 second, drain faster (more forgiving)
          if (timeSinceLastTap > 1000) {
            currentDrainRate = drainRate * 2; // Balanced (was 2.5)
          }
          
          // If overheating, drain faster but not too punishing
          if (isOverheating) {
            currentDrainRate = drainRate * 2.5; // More forgiving (was 4)
          }
          
          const newStamina = Math.max(0, prev - (currentDrainRate * resistance));
          
          // Check for failure
          if (newStamina === 0) {
            completeGame(true); // Failed
          }
          
          return newStamina;
        });
      }, 100);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [gameState, drainRate, isOverheating, lastTapTime, resistance]);

  // Cooldown overheat
  useEffect(() => {
    if (isOverheating) {
      cooldownRef.current = setTimeout(() => {
        setIsOverheating(false);
      }, 2000);
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [isOverheating]);

  const startGame = () => {
    setGameState('playing');
    setStaminaBar(100);
    setTimeLeft(10); // Back to 10s
    setTapCount(0);
    setIsOverheating(false);
    setLastTapTime(Date.now());
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;

    const now = Date.now();
    const timeSinceLast = now - lastTapTime;

    // Check for rapid tapping (overheat) - more forgiving window
    if (timeSinceLast < 120) {
      // Too fast! Overheat (120ms is very fast but not impossible)
      setIsOverheating(true);
    } else {
      // Good tap - good refill amount
      setStaminaBar(prev => Math.min(100, prev + 8)); // Back to 8 for better balance
      setIsOverheating(false);
    }

    setTapCount(prev => prev + 1);
    setLastTapTime(now);
  };

  const completeGame = (failed = false) => {
    setGameState('complete');

    let xpGained = 1;
    let performance = '';

    if (failed) {
      xpGained = 1;
      performance = 'Ran out of stamina!';
    } else {
      // Calculate based on final stamina - more lenient scoring
      if (staminaBar >= 60) {
        xpGained = 5; // Excellent (lowered from 70)
        performance = 'Perfect Endurance!';
      } else if (staminaBar >= 40) {
        xpGained = 4; // Great (lowered from 50)
        performance = 'Great Pace!';
      } else if (staminaBar >= 20) {
        xpGained = 3; // Good (lowered from 30)
        performance = 'Good Effort!';
      } else if (staminaBar > 0) {
        xpGained = 2; // Okay - survived!
        performance = 'Barely Finished!';
      }
    }

    setResult({
      xpGained,
      performance,
      finalStamina: Math.round(staminaBar),
      tapCount,
      failed
    });

    setTimeout(() => {
      onComplete(xpGained);
    }, 2500);
  };

  const getStaminaColor = () => {
    if (staminaBar >= 70) return 'bg-green-500';
    if (staminaBar >= 40) return 'bg-yellow-500';
    if (staminaBar >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🫁</span>
            Endurance Runner
          </h2>
          <p className="text-gray-600">Maintain your stamina for 10 seconds!</p>
        </div>

        {gameState === 'ready' && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Instructions:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tap to maintain stamina above 0</li>
                <li>• Find your rhythm - tap every ~200-300ms</li>
                <li>• Tapping too fast causes OVERHEAT (&lt; 120ms)</li>
                <li>• Survive 10 seconds with high stamina = big XP</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Pro Tip:</strong> Maintain a steady rhythm. Too fast = overheat, too slow = stamina drain!
              </p>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Start Training!
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
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                ⏱️ {timeLeft}s
              </div>
              <div className="text-sm text-gray-600">
                Taps: {tapCount}
              </div>
            </div>

            {/* Stamina Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Stamina</span>
                <span className={`${staminaBar < 30 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                  {Math.round(staminaBar)}%
                </span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full ${getStaminaColor()} transition-all duration-100 flex items-center justify-center`}
                  style={{ width: `${staminaBar}%` }}
                >
                  {staminaBar > 15 && (
                    <Heart className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Overheat Warning */}
            {isOverheating && (
              <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 animate-pulse">
                <p className="text-red-800 font-bold text-center flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  OVERHEATING! Slow down!
                </p>
              </div>
            )}

            {/* Tap Button */}
            <button
              onClick={handleTap}
              onTouchStart={handleTap}
              className={`w-full py-12 rounded-lg font-bold text-xl transition-all active:scale-95 shadow-lg ${
                isOverheating
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isOverheating ? '🔥 OVERHEATING!' : '💚 TAP TO RUN'}
            </button>

            {/* Status Indicator */}
            <div className="flex justify-around text-xs text-gray-600">
              <div className={`${resistance < 1 ? 'text-green-600 font-bold' : ''}`}>
                {resistance < 1 ? '🍃 Easy Day' : resistance > 1.2 ? '💨 High Resistance' : '⚖️ Normal'}
              </div>
            </div>
          </div>
        )}

        {gameState === 'complete' && result && (
          <div className="space-y-4 text-center">
            {result.failed ? (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <div className="text-4xl mb-2">😰</div>
                <h3 className="text-2xl font-bold text-red-700 mb-2">
                  Out of Stamina!
                </h3>
                <p className="text-red-600">Keep training to improve!</p>
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <Check className="w-16 h-16 mx-auto text-green-500 mb-2" />
                <h3 className="text-2xl font-bold text-green-700 mb-2">
                  {result.performance}
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>Final Stamina: <strong>{result.finalStamina}%</strong></p>
                  <p>Total Taps: <strong>{result.tapCount}</strong></p>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg">
              <div className="text-3xl font-bold">+{result.xpGained} Stamina XP</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaminaGame;

