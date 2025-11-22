import { useState } from 'react';
import { User, X } from 'lucide-react';
import FighterAvatar from './FighterAvatar';

const TrainSlot = ({ car, carNumber, slotNumber, fighter, myAvatar, onDrop, onRemove }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const slot = slotNumber === 1 ? car?.spot1 : car?.spot2;
  const occupied = slot?.occupied || false;
  const slotFighter = slot?.avatarId || fighter;
  const isMyFighter = myAvatar && slotFighter && 
    (slotFighter._id === myAvatar._id || slotFighter === myAvatar._id);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (occupied) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsRejecting(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (occupied) {
      setIsRejecting(true);
      setTimeout(() => setIsRejecting(false), 500);
      return;
    }
    
    const fighterData = e.dataTransfer.getData('application/json');
    if (!fighterData) return;
    
    try {
      const fighter = JSON.parse(fighterData);
      
      // Validate weight class if slot already has a fighter in the other slot
      const otherSlot = slotNumber === 1 ? car?.spot2 : car?.spot1;
      if (otherSlot?.occupied && otherSlot?.avatarId) {
        // This validation should happen on backend, but we can check here too
        const canPlace = true; // Will be validated by backend
        if (!canPlace) {
          setIsRejecting(true);
          setTimeout(() => setIsRejecting(false), 500);
          return;
        }
      }
      
      // Call parent's onDrop handler
      if (onDrop) {
        await onDrop(carNumber, slotNumber, fighter);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <>
      <style>{`
        @keyframes snap {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .slot-snap {
          animation: snap 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .slot-reject {
          animation: shake 0.3s ease;
        }
      `}</style>
      
      <div
        className={`
          relative w-full h-full flex items-center justify-center
          ${occupied ? '' : 'border-2 border-dashed border-gray-300 rounded-lg bg-gray-50'}
          transition-all duration-200
          ${isDragOver && !occupied 
            ? 'border-blue-500 bg-blue-100 scale-105 border-solid' 
            : ''
          }
          ${isRejecting ? 'slot-reject border-red-500 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {occupied ? (
          <div className={`
            w-full h-full flex flex-col items-center justify-center p-2 rounded-lg
            transition-all duration-200
            ${isMyFighter 
              ? 'bg-blue-50 border-2 border-blue-500 cursor-move' 
              : 'bg-white border-2 border-gray-300'
            }
          `}>
            {/* Remove button for my fighter */}
            {isMyFighter && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(carNumber, slotNumber);
                }}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            
            <FighterAvatar
              fighterData={slotFighter}
              size="md"
              draggable={isMyFighter}
              showStats={true}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-4">
            <User className={`w-8 h-8 text-gray-400 mb-2 ${isDragOver ? 'text-blue-500' : ''}`} />
            <span className={`text-xs ${isDragOver ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              {isDragOver ? 'Drop here!' : 'Drop fighter here'}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default TrainSlot;

