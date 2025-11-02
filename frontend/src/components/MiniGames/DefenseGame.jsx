import { useState, useEffect, useRef } from 'react';
import { Shield, Check, X } from 'lucide-react';

const DefenseGame = ({ onComplete, onCancel }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, complete
  const [activePads, setActivePads] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [result, setResult] = useState(null);
  const [doubleHitChance, setDoubleHitChance] = useState(0.15);
  const spawnIntervalRef = useRef(null);
  const padTimeoutRefs = useRef({});

  const gridSize = 9; // 3x3 grid
  const padLifetime = 800; // milliseconds to tap before miss

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

  // Spawn pads
  useEffect(() => {
    if (gameState === 'playing') {
      const spawnPad = () => {
        // Random delay between spawns (300-800ms)
        const nextSpawnDelay = Math.random() * 500 + 300;
        
        // Determine if double hit
        const isDoubleHit = Math.random() < doubleHitChance;
        
        // Get available positions (not currently active)
        const availablePositions = Array.from({ length: gridSize }, (_, i) => i)
          .filter(pos => !activePads.some(pad => pad.position === pos));
        
        if (availablePositions.length > 0) {
          const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
          const padId = Date.now() + Math.random();
          
          const newPad = {
            id: padId,
            position,
            timestamp: Date.now()
          };
          
          setActivePads(prev => [...prev, newPad]);
          
          // Set timeout to remove pad (miss)
          padTimeoutRefs.current[padId] = setTimeout(() => {
            handleMiss(padId);
          }, padLifetime);
          
          // If double hit, spawn another immediately
          if (isDoubleHit && availablePositions.length > 1) {
            const position2 = availablePositions.filter(p => p !== position)[
              Math.floor(Math.random() * (availablePositions.length - 1))
            ];
            const padId2 = Date.now() + Math.random() + 0.1;
            
            const newPad2 = {
              id: padId2,
              position: position2,
              timestamp: Date.now()
            };
            
            setActivePads(prev => [...prev, newPad2]);
            
            padTimeoutRefs.current[padId2] = setTimeout(() => {
              handleMiss(padId2);
            }, padLifetime);
          }
        }
        
        spawnIntervalRef.current = setTimeout(spawnPad, nextSpawnDelay);
      };
      
      spawnPad();
      
      return () => {
        if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current);
        Object.values(padTimeoutRefs.current).forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [gameState, activePads, doubleHitChance]);

  const startGame = () => {
    setGameState('playing');
    setActivePads([]);
    setTimeLeft(15);
    setScore(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
  };

  const handlePadClick = (padId) => {
    if (gameState !== 'playing') return;

    const pad = activePads.find(p => p.id === padId);
    if (!pad) return;

    // Remove from active pads
    setActivePads(prev => prev.filter(p => p.id !== padId));
    
    // Clear timeout
    if (padTimeoutRefs.current[padId]) {
      clearTimeout(padTimeoutRefs.current[padId]);
      delete padTimeoutRefs.current[padId];
    }

    // Calculate timing bonus
    const reactionTime = Date.now() - pad.timestamp;
    let points = 1;
    
    if (reactionTime < 200) {
      points = 3; // Lightning fast
    } else if (reactionTime < 400) {
      points = 2; // Quick
    }

    setScore(prev => prev + points);
    
    // Update combo
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) {
      setMaxCombo(newCombo);
    }
  };

  const handleMiss = (padId) => {
    // Remove from active pads
    setActivePads(prev => prev.filter(p => p.id !== padId));
    
    // Clear timeout ref
    delete padTimeoutRefs.current[padId];

    // Increment misses and reset combo
    setMisses(prev => prev + 1);
    setCombo(0);
  };

  const completeGame = () => {
    setGameState('complete');

    // Clear all timeouts
    Object.values(padTimeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    padTimeoutRefs.current = {};

    // Calculate XP
    let xpGained = 1;
    let performance = '';

    // Base on score and accuracy
    const totalAttempts = score + misses;
    const accuracy = totalAttempts > 0 ? score / totalAttempts : 0;

    if (score >= 30 && accuracy >= 0.8 && maxCombo >= 5) {
      xpGained = 5; // Excellent
      performance = 'Perfect Defense!';
    } else if (score >= 20 && accuracy >= 0.7) {
      xpGained = 4; // Great
      performance = 'Great Reflexes!';
    } else if (score >= 15) {
      xpGained = 3; // Good
      performance = 'Good Blocks!';
    } else if (score >= 10) {
      xpGained = 2; // Okay
      performance = 'Keep Practicing!';
    }

    // Penalty for too many misses
    if (misses >= 10) {
      xpGained = Math.max(1, xpGained - 1);
    }

    setResult({
      xpGained,
      performance,
      score,
      misses,
      maxCombo,
      accuracy: Math.round(accuracy * 100)
    });

    setTimeout(() => {
      onComplete(xpGained);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🛡️</span>
            Reflex Block
          </h2>
          <p className="text-gray-600">Block incoming strikes!</p>
        </div>

        {gameState === 'ready' && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Instructions:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tap RED pads before they disappear</li>
                <li>• Faster reactions = more points</li>
                <li>• Chain 3+ perfects = combo bonus</li>
                <li>• Watch out for double-hits!</li>
                <li>• 15 seconds to score as much as possible</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
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
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">⏱️ {timeLeft}s</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Score</div>
                <div className="text-2xl font-bold text-green-600">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Combo</div>
                <div className={`text-2xl font-bold ${combo >= 3 ? 'text-yellow-600 animate-pulse' : 'text-gray-900'}`}>
                  {combo >= 3 ? '🔥' : ''}{combo}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-gray-100 rounded-lg">
              {Array.from({ length: gridSize }).map((_, index) => {
                const activePad = activePads.find(pad => pad.position === index);
                const isActive = !!activePad;
                
                return (
                  <button
                    key={index}
                    onClick={() => isActive && handlePadClick(activePad.id)}
                    className={`aspect-square rounded-lg font-bold text-2xl transition-all transform ${
                      isActive
                        ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse'
                        : 'bg-gray-300 text-gray-400'
                    } active:scale-95`}
                  >
                    {isActive ? '⚠️' : ''}
                  </button>
                );
              })}
            </div>

            {/* Combo notification */}
            {combo >= 3 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-2 text-center animate-bounce">
                <p className="text-yellow-800 font-bold">
                  🔥 {combo}x COMBO! 🔥
                </p>
              </div>
            )}

            {/* Miss counter */}
            <div className="flex justify-center gap-2 text-xs">
              <span className="text-gray-600">Misses: </span>
              <span className={`font-bold ${misses >= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                {misses}
              </span>
            </div>
          </div>
        )}

        {gameState === 'complete' && result && (
          <div className="space-y-4 text-center">
            <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-6">
              <Check className="w-16 h-16 mx-auto text-purple-500 mb-2" />
              <h3 className="text-2xl font-bold text-purple-700 mb-3">
                {result.performance}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Blocks</div>
                  <div className="text-2xl font-bold text-green-600">{result.score}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Max Combo</div>
                  <div className="text-2xl font-bold text-yellow-600">{result.maxCombo}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Accuracy</div>
                  <div className="text-2xl font-bold text-blue-600">{result.accuracy}%</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Misses</div>
                  <div className="text-2xl font-bold text-red-600">{result.misses}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-lg">
              <div className="text-3xl font-bold">+{result.xpGained} Defense XP</div>
            </div>

            {result.maxCombo >= 5 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg font-bold">
                🔥 Combo Master!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefenseGame;

