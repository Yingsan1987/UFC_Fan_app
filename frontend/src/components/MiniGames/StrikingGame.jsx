import { useState, useEffect, useRef } from 'react';
import { Zap, Check, X } from 'lucide-react';

const StrikingGame = ({ onComplete, onCancel }) => {
  const [gameState, setGameState] = useState('ready'); // ready, showing, playing, complete
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [result, setResult] = useState(null);
  const [isCritical, setIsCritical] = useState(false);
  const timerRef = useRef(null);

  const moves = [
    { id: 'left', emoji: '🤛', label: 'Left Punch', color: 'bg-red-500' },
    { id: 'right', emoji: '🤜', label: 'Right Punch', color: 'bg-red-600' },
    { id: 'kick', emoji: '🦶', label: 'Kick', color: 'bg-orange-500' },
    { id: 'block', emoji: '🛡️', label: 'Block', color: 'bg-blue-500' }
  ];

  // Generate random sequence
  const generateSequence = () => {
    const length = Math.floor(Math.random() * 3) + 3; // 3-5 moves
    const newSequence = [];
    for (let i = 0; i < length; i++) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      newSequence.push(randomMove);
    }
    setSequence(newSequence);
    
    // 10% chance for critical combo
    const critical = Math.random() < 0.1;
    setIsCritical(critical);
    
    return newSequence;
  };

  useEffect(() => {
    if (gameState === 'ready') {
      generateSequence();
    }
  }, [gameState]);

  // Show sequence animation
  useEffect(() => {
    if (gameState === 'showing' && currentMoveIndex < sequence.length) {
      const timeout = setTimeout(() => {
        setCurrentMoveIndex(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timeout);
    } else if (gameState === 'showing' && currentMoveIndex >= sequence.length) {
      // Start playing phase
      setGameState('playing');
      setTimeLeft(5);
      setCurrentMoveIndex(0);
    }
  }, [gameState, currentMoveIndex, sequence.length]);

  // Timer for playing phase
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      // Time's up - calculate result
      calculateResult();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('showing');
    setCurrentMoveIndex(0);
    setUserSequence([]);
  };

  const handleMoveClick = (move) => {
    if (gameState !== 'playing') return;

    const newUserSequence = [...userSequence, move];
    setUserSequence(newUserSequence);

    // Check if complete
    if (newUserSequence.length === sequence.length) {
      calculateResult(newUserSequence);
    }
  };

  const calculateResult = (finalSequence = userSequence) => {
    let correctMoves = 0;
    for (let i = 0; i < sequence.length; i++) {
      if (finalSequence[i]?.id === sequence[i].id) {
        correctMoves++;
      }
    }

    const accuracy = correctMoves / sequence.length;
    let xpGained = 1; // default

    if (accuracy === 1) {
      xpGained = 5; // Perfect
    } else if (accuracy >= 0.6) {
      xpGained = 3; // Good
    } else if (accuracy >= 0.3) {
      xpGained = 2; // Partial
    }

    // Critical bonus
    if (isCritical && accuracy === 1) {
      xpGained *= 2;
    }

    setResult({
      correctMoves,
      totalMoves: sequence.length,
      xpGained,
      accuracy,
      isCritical: isCritical && accuracy === 1
    });
    setGameState('complete');

    // Auto-close after showing result
    setTimeout(() => {
      onComplete(xpGained);
    }, 2500);
  };

  const getMoveButton = (move) => {
    const isInSequence = userSequence.some(m => m.id === move.id);
    return (
      <button
        key={move.id}
        onClick={() => handleMoveClick(move)}
        disabled={gameState !== 'playing'}
        className={`${move.color} text-white p-6 rounded-lg font-bold text-2xl transition-transform active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-lg`}
      >
        <div className="text-4xl mb-2">{move.emoji}</div>
        <div className="text-sm">{move.label}</div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🥊</span>
            Pad Work Combo
          </h2>
          {isCritical && (
            <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              <Zap className="w-4 h-4 inline mr-1" />
              CRITICAL COMBO! 2X XP
            </div>
          )}
        </div>

        {gameState === 'ready' && (
          <div className="space-y-4">
            <p className="text-gray-700 text-center mb-4">
              Watch the sequence carefully, then repeat it!
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Instructions:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Memorize {sequence.length} moves</li>
                <li>• Repeat the exact sequence</li>
                <li>• You have 5 seconds</li>
                <li>• Perfect = +5 XP, Good = +3 XP</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
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

        {gameState === 'showing' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-700 mb-4">Watch Carefully!</p>
              <div className="bg-gray-100 rounded-lg p-8 mb-4">
                {currentMoveIndex < sequence.length && (
                  <div className="animate-pulse">
                    <div className="text-8xl mb-4">{sequence[currentMoveIndex].emoji}</div>
                    <div className="text-xl font-bold text-gray-800">
                      {sequence[currentMoveIndex].label}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2">
                {sequence.map((move, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      idx < currentMoveIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-red-600 mb-2">
                ⏱️ {timeLeft}s
              </div>
              <p className="text-gray-600">Repeat the sequence!</p>
              <div className="flex justify-center gap-2 mt-2">
                {userSequence.map((move, idx) => (
                  <div key={idx} className="text-2xl">{move.emoji}</div>
                ))}
                {userSequence.length < sequence.length && (
                  <div className="text-2xl text-gray-300">❓</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moves.map(move => getMoveButton(move))}
            </div>
          </div>
        )}

        {gameState === 'complete' && result && (
          <div className="space-y-4 text-center">
            {result.accuracy === 1 ? (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 animate-pulse">
                <Check className="w-16 h-16 mx-auto text-green-500 mb-2" />
                <h3 className="text-2xl font-bold text-green-700 mb-2">
                  {result.isCritical ? '🔥 CRITICAL PERFECT! 🔥' : 'Perfect Combo!'}
                </h3>
                <p className="text-green-600">All moves correct!</p>
              </div>
            ) : result.accuracy >= 0.6 ? (
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
                <div className="text-4xl mb-2">👍</div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Good Job!</h3>
                <p className="text-blue-600">
                  {result.correctMoves}/{result.totalMoves} correct
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-6">
                <div className="text-4xl mb-2">💪</div>
                <h3 className="text-2xl font-bold text-orange-700 mb-2">Keep Training!</h3>
                <p className="text-orange-600">
                  {result.correctMoves}/{result.totalMoves} correct
                </p>
              </div>
            )}

            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-lg">
              <div className="text-3xl font-bold">+{result.xpGained} Striking XP</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrikingGame;

