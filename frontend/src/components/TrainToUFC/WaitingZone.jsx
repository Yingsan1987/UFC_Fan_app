import { useState } from 'react';
import { Target } from 'lucide-react';
import FighterAvatar from './FighterAvatar';
import { useTrainGameStore } from '../../store/trainGameStore';

const WaitingZone = ({ fighters, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const store = useTrainGameStore();
  const draggingFighter = store?.draggingFighter || null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const fighterData = e.dataTransfer.getData('application/json');
    if (!fighterData) return;

    try {
      const fighter = JSON.parse(fighterData);
      
      // Call parent's onDrop handler (which should call returnToWaitingZone)
      if (onDrop) {
        await onDrop(fighter);
      }
    } catch (error) {
      console.error('Error handling drop to waiting zone:', error);
    }
  };

  const emptyFighters = !fighters || fighters.length === 0;

  return (
    <>
      <style>{`
        @keyframes snapBack {
          0% { transform: scale(1.2) rotate(-5deg); opacity: 0.5; }
          60% { transform: scale(0.95) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        .fighter-snap-back {
          animation: snapBack 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
      
      <div
        className={`
          bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2
          min-h-[300px] transition-all duration-200
          ${isDragOver 
            ? 'border-green-500 bg-green-50 scale-102' 
            : 'border-blue-300'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Waiting Zone</h3>
        </div>

        {emptyFighters ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Target className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">
              {isDragOver ? 'Drop fighter here' : 'No fighters available'}
            </p>
            {isDragOver && (
              <p className="text-xs mt-2 text-green-600 font-bold animate-pulse">
                Release to return fighter!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {fighters.map((fighter, index) => {
              const fighterId = fighter._id || fighter.id;
              const isDragging = draggingFighter === fighterId;
              
              return (
                <div
                  key={fighterId || index}
                  className={`
                    flex flex-col items-center justify-center
                    transition-all duration-200
                    ${isDragging ? 'opacity-30 scale-90' : 'fighter-snap-back'}
                    hover:scale-105
                  `}
                >
                  <FighterAvatar
                    fighterData={fighter}
                    size="md"
                    draggable={true}
                    isDragging={isDragging}
                    showStats={true}
                  />
                  {fighter.name && (
                    <p className="text-xs text-gray-600 mt-1 text-center truncate w-full px-2">
                      {fighter.name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isDragOver && (
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-green-600 animate-pulse">
              👇 Release to return fighter to waiting zone
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default WaitingZone;

