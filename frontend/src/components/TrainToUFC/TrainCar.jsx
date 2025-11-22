import { useState, useEffect } from 'react';
import { User, Zap, Swords } from 'lucide-react';

const TrainCar = ({ car, carNumber, onDrop, onDragStart, isDragging, myAvatar, onFighterClick }) => {
  const [flash, setFlash] = useState(false);
  const spot1 = car?.spot1 || {};
  const spot2 = car?.spot2 || {};
  const isFighting = car?.isFighting || false;
  const fightResult = car?.fightResult;

  // Flash effect when fighting
  useEffect(() => {
    if (isFighting) {
      const interval = setInterval(() => {
        setFlash(prev => !prev);
      }, 300);
      return () => clearInterval(interval);
    } else {
      setFlash(false);
    }
  }, [isFighting]);

  const handleDrop = (e, spotNumber) => {
    e.preventDefault();
    const avatarData = e.dataTransfer.getData('application/json');
    if (avatarData) {
      try {
        const avatar = JSON.parse(avatarData);
        onDrop(carNumber, spotNumber, avatar);
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const FighterSlot = ({ spot, spotNumber, isLeft }) => {
    const hasFighter = spot?.occupied && spot?.avatarId;
    const fighter = spot?.avatarId || null;
    const isEmpty = !hasFighter;
    const isMyFighter = myAvatar && fighter && fighter._id === myAvatar._id;

    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${
          isLeft ? 'border-r-2 border-gray-400' : ''
        }`}
        onDrop={(e) => handleDrop(e, spotNumber)}
        onDragOver={handleDragOver}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center w-full h-full p-2 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <User className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Drop fighter here</span>
          </div>
        ) : (
          <div
            draggable={isMyFighter} // Only user's fighter is draggable
            onDragStart={(e) => {
              if (isMyFighter && fighter) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/json', JSON.stringify({
                  ...fighter,
                  _carNumber: carNumber,
                  _spotNumber: spotNumber
                }));
                if (onDragStart) onDragStart(fighter, carNumber, spotNumber, e);
              }
            }}
            className={`w-full h-full flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
              isMyFighter ? 'cursor-move hover:scale-105' : 'cursor-pointer'
            } ${
              isMyFighter
                ? 'border-blue-500 bg-blue-50 hover:border-blue-600'
                : 'border-gray-300 bg-white hover:border-gray-400'
            } ${flash ? 'bg-red-100 border-red-500' : ''}`}
            onClick={() => fighter && onFighterClick?.(fighter, carNumber, spotNumber)}
          >
            {/* Fighter Avatar */}
            <div
              className="w-16 h-16 rounded-full mb-2 flex items-center justify-center text-white font-bold text-xl border-4 shadow-lg"
              style={{
                backgroundColor: fighter?.outfitColor || '#DC143C',
                borderColor: fighter?.outfitColor || '#DC143C'
              }}
            >
              {fighter?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            
            {/* Fighter Name */}
            <span className="text-xs font-bold text-gray-900 text-center truncate w-full px-1">
              {fighter?.name || 'Unknown'}
            </span>
            
            {/* Fighter Stats */}
            {fighter?.stats && (
              <div className="mt-1 flex gap-1">
                <span className="text-[10px] text-red-600 font-bold">
                  STR: {fighter.stats.striking || 0}
                </span>
                <span className="text-[10px] text-blue-600 font-bold">
                  SPD: {fighter.stats.speed || 0}
                </span>
              </div>
            )}
            
            {/* Win/Loss Badge */}
            {fighter?.wins !== undefined && (
              <div className="mt-1 flex gap-2 text-[10px]">
                <span className="text-green-600 font-bold">W: {fighter.wins || 0}</span>
                <span className="text-red-600 font-bold">L: {fighter.losses || 0}</span>
              </div>
            )}
            
            {/* My Fighter Badge */}
            {isMyFighter && (
              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                YOU
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative bg-white rounded-lg border-2 p-2 min-h-[140px] transition-all ${
        isFighting
          ? `border-red-500 ${flash ? 'shadow-lg shadow-red-500/50' : 'shadow-md'}`
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {/* Car Number Badge */}
      <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
        Car #{carNumber}
      </div>
      
      {/* Fighting Indicator */}
      {isFighting && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1">
          <Swords className="w-3 h-3" />
          FIGHTING!
        </div>
      )}
      
      {/* Fight Result Indicator */}
      {fightResult && !isFighting && (
        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
          ✓ Fought
        </div>
      )}
      
      {/* Two Spots Side by Side */}
      <div className="flex gap-2 h-full mt-6">
        <div className="flex-1">
          <FighterSlot spot={spot1} spotNumber={1} isLeft={true} />
        </div>
        <div className="flex-1">
          <FighterSlot spot={spot2} spotNumber={2} isLeft={false} />
        </div>
      </div>
      
      {/* Weight Class Indicator */}
      {(spot1?.avatarId?.weightClass || spot2?.avatarId?.weightClass) && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
          {spot1?.avatarId?.weightClass || spot2?.avatarId?.weightClass}
        </div>
      )}
    </div>
  );
};

export default TrainCar;

