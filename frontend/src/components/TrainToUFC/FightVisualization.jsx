import { useState, useEffect } from 'react';
import { Swords, Zap, Trophy, X } from 'lucide-react';

const FightVisualization = ({ fightResult, fighters, onClose, onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  const [damageLog, setDamageLog] = useState([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    if (!fightResult || !fightResult.damageLog) return;

    setDamageLog(fightResult.damageLog);
    
    let roundIndex = 0;
    const roundDuration = 2000; // 2 seconds per round

    const animateRounds = () => {
      if (roundIndex >= fightResult.damageLog.length) {
        setIsAnimating(false);
        setTimeout(() => setShowWinner(true), 500);
        if (onComplete) onComplete();
        return;
      }

      const round = fightResult.damageLog[roundIndex];
      
      // Update HP bars
      if (round.attacker === fighters.fighter1?.name) {
        setHp2(prev => Math.max(0, prev - round.damage));
      } else {
        setHp1(prev => Math.max(0, prev - round.damage));
      }

      setCurrentRound(roundIndex + 1);
      roundIndex++;

      setTimeout(animateRounds, roundDuration);
    };

    animateRounds();
  }, [fightResult, fighters, onComplete]);

  const fighter1 = fighters.fighter1 || {};
  const fighter2 = fighters.fighter2 || {};
  const winner = fightResult?.winner;
  const loser = fightResult?.loser;

  if (!fightResult) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Fight Arena */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">⚔️ FIGHT!</h2>
            <p className="text-gray-600">Round {currentRound} / {damageLog.length}</p>
          </div>

          {/* Fighters */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Fighter 1 */}
            <div className="text-center">
              <div
                className="w-32 h-32 mx-auto rounded-full mb-4 flex items-center justify-center text-white text-4xl font-bold border-4 shadow-lg"
                style={{
                  backgroundColor: fighter1.outfitColor || '#DC143C',
                  borderColor: fighter1.outfitColor || '#DC143C'
                }}
              >
                {fighter1.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <h3 className="text-xl font-bold mb-2">{fighter1.name || 'Fighter 1'}</h3>
              
              {/* HP Bar */}
              <div className="w-full bg-gray-200 rounded-full h-6 mb-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    hp1 > 50 ? 'bg-green-500' : hp1 > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${hp1}%` }}
                >
                  <span className="text-xs font-bold text-white flex items-center justify-center h-full">
                    {Math.round(hp1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* VS Separator */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-red-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                VS
              </div>
            </div>

            {/* Fighter 2 */}
            <div className="text-center">
              <div
                className="w-32 h-32 mx-auto rounded-full mb-4 flex items-center justify-center text-white text-4xl font-bold border-4 shadow-lg"
                style={{
                  backgroundColor: fighter2.outfitColor || '#0066CC',
                  borderColor: fighter2.outfitColor || '#0066CC'
                }}
              >
                {fighter2.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <h3 className="text-xl font-bold mb-2">{fighter2.name || 'Fighter 2'}</h3>
              
              {/* HP Bar */}
              <div className="w-full bg-gray-200 rounded-full h-6 mb-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    hp2 > 50 ? 'bg-green-500' : hp2 > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${hp2}%` }}
                >
                  <span className="text-xs font-bold text-white flex items-center justify-center h-full">
                    {Math.round(hp2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Damage Log */}
          <div className="bg-gray-100 rounded-lg p-4 max-h-48 overflow-y-auto">
            <h4 className="font-bold mb-2">Fight Log:</h4>
            <div className="space-y-1">
              {damageLog.slice(0, currentRound).map((log, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${
                    log.isCritical
                      ? 'bg-yellow-200 text-yellow-900 font-bold'
                      : log.type === 'heavy'
                      ? 'bg-red-100 text-red-900'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  <span className="font-bold">{log.attacker}</span> {log.message}
                  {log.isCritical && <Zap className="w-4 h-4 inline ml-1 text-yellow-600" />}
                  <span className="float-right font-bold">
                    -{log.damage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Winner Animation */}
          {showWinner && winner && (
            <div className="mt-6 text-center animate-bounce">
              <div className="bg-yellow-400 text-gray-900 rounded-lg p-6">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-3xl font-bold mb-2">WINNER!</h3>
                <p className="text-2xl font-bold">{winner.name}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-lg">XP Gained: <span className="font-bold text-green-600">+{winner.xpGained}</span></p>
                  <p className="text-lg">Coins: <span className="font-bold text-yellow-600">+10</span></p>
                  <p className="text-lg">Train Tokens: <span className="font-bold text-blue-600">+1</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FightVisualization;

