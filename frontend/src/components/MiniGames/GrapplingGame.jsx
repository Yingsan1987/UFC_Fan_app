import { useState, useEffect, useRef } from 'react';
import { Target, Check } from 'lucide-react';

const GrapplingGame = ({ onComplete, onCancel }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, complete
  const [markerPosition, setMarkerPosition] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [direction, setDirection] = useState(1);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(3);
  const [scores, setScores] = useState([]);
  const animationRef = useRef(null);

  // Sweet spot is 42-58% of the bar (narrower - was 40-60%)
  const sweetSpotStart = 42;
  const sweetSpotEnd = 58;

  useEffect(() => {
    // Randomize speed between 2.0 and 4.0 (faster - was 1.5-3.0)
    const randomSpeed = Math.random() * 2.0 + 2.0;
    setSpeed(randomSpeed);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      const animate = () => {
        setMarkerPosition(prev => {
          let newPos = prev + (speed * direction);
          
          // Bounce at edges
          if (newPos >= 100) {
            setDirection(-1);
            return 100;
          } else if (newPos <= 0) {
            setDirection(1);
            return 0;
          }
          
          return newPos;
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState, speed, direction]);

  const startGame = () => {
    setGameState('playing');
    setMarkerPosition(0);
    setDirection(1);
    setAttempts(3);
    setScores([]);
  };

  const handleTap = () => {
    if (gameState !== 'playing' || attempts <= 0) return;

    // Calculate accuracy (stricter scoring)
    let xp = 0;
    let feedback = '';
    
    if (markerPosition >= sweetSpotStart && markerPosition <= sweetSpotEnd) {
      // Inside sweet spot - calculate how close to center (50)
      const distanceFromCenter = Math.abs(markerPosition - 50);
      
      if (distanceFromCenter <= 1.5) {
        xp = 5; // Perfect center (stricter - was 2)
        feedback = '🎯 Perfect Takedown!';
      } else if (distanceFromCenter <= 4) {
        xp = 4; // Very good (stricter - was 5)
        feedback = '💪 Excellent Timing!';
      } else {
        xp = 3; // Good
        feedback = '👍 Good Takedown!';
      }
    } else {
      // Outside sweet spot
      const distanceFromSweet = Math.min(
        Math.abs(markerPosition - sweetSpotStart),
        Math.abs(markerPosition - sweetSpotEnd)
      );
      
      if (distanceFromSweet <= 8) {
        xp = 2; // Close (stricter - was 10)
        feedback = '😅 Slipped Grip';
      } else {
        xp = 1; // Miss
        feedback = '❌ Missed Timing';
      }
    }

    const newScores = [...scores, { xp, feedback, position: markerPosition }];
    setScores(newScores);
    setAttempts(prev => prev - 1);

    // If all attempts used, complete
    if (attempts - 1 === 0) {
      const totalXP = newScores.reduce((sum, score) => sum + score.xp, 0);
      const averageXP = Math.round(totalXP / 3);
      
      setResult({
        totalXP: averageXP,
        scores: newScores,
        bestScore: Math.max(...newScores.map(s => s.xp))
      });
      setGameState('complete');

      setTimeout(() => {
        onComplete(averageXP);
      }, 2500);
    } else {
      // Reset for next attempt
      setMarkerPosition(0);
      setDirection(1);
    }
  };

  const getMarkerColor = () => {
    if (markerPosition >= sweetSpotStart && markerPosition <= sweetSpotEnd) {
      const distanceFromCenter = Math.abs(markerPosition - 50);
      if (distanceFromCenter <= 5) return 'bg-green-500';
      return 'bg-yellow-500';
    }
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🤼</span>
            Takedown Timing
          </h2>
          <p className="text-gray-600">Hit the sweet spot for maximum XP!</p>
        </div>

        {gameState === 'ready' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Instructions:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tap when the marker is in the GREEN zone</li>
                <li>• Closer to center = more XP</li>
                <li>• You get 3 attempts</li>
                <li>• Perfect center = +5 XP</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
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
              <p className="text-lg font-bold text-gray-700 mb-2">
                Attempts: {attempts}/3
              </p>
            </div>

            {/* Previous scores */}
            {scores.length > 0 && (
              <div className="space-y-2">
                {scores.map((score, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded text-sm text-center">
                    <span className="font-bold">{score.feedback}</span> - +{score.xp} XP
                  </div>
                ))}
              </div>
            )}

            {/* Timing Bar */}
            <div className="space-y-4">
              <div className="relative h-16 bg-gray-200 rounded-lg overflow-hidden">
                {/* Sweet spot */}
                <div
                  className="absolute top-0 bottom-0 bg-green-300/50 border-2 border-green-500"
                  style={{
                    left: `${sweetSpotStart}%`,
                    width: `${sweetSpotEnd - sweetSpotStart}%`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-700" />
                  </div>
                </div>

                {/* Center marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-green-700"
                  style={{ left: '50%' }}
                />

                {/* Moving marker */}
                <div
                  className={`absolute top-0 bottom-0 w-3 ${getMarkerColor()} transition-colors shadow-lg`}
                  style={{ left: `${markerPosition}%` }}
                />
              </div>

              <button
                onClick={handleTap}
                className="w-full bg-blue-600 text-white py-6 rounded-lg font-bold text-xl hover:bg-blue-700 transition-colors active:scale-95 shadow-lg"
              >
                ⏱️ TAP NOW!
              </button>
            </div>

            {/* Visual guide */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Too Early</span>
              <span className="font-bold text-green-600">SWEET SPOT</span>
              <span>Too Late</span>
            </div>
          </div>
        )}

        {gameState === 'complete' && result && (
          <div className="space-y-4 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 rounded-lg p-6">
              <Check className="w-16 h-16 mx-auto text-blue-500 mb-2" />
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                Training Complete!
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                {result.scores.map((score, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>Attempt {idx + 1}:</span>
                    <span className="font-bold">+{score.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg">
              <div className="text-sm mb-1">Average XP Gained</div>
              <div className="text-3xl font-bold">+{result.totalXP} Grappling XP</div>
            </div>

            {result.bestScore === 5 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg font-bold">
                🎯 Perfect Takedown Achieved!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrapplingGame;

