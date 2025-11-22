import { useState } from 'react';
import { User } from 'lucide-react';

const DraggableFighter = ({ fighter, onDragStart, onDragEnd, isDragging = false }) => {
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const handleDragStart = (e) => {
    setIsBeingDragged(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(fighter));
    if (onDragStart) onDragStart(fighter, e);
  };

  const handleDragEnd = (e) => {
    setIsBeingDragged(false);
    if (onDragEnd) onDragEnd(fighter, e);
  };

  if (!fighter) return null;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-move transition-all duration-200 ${
        isBeingDragged || isDragging
          ? 'opacity-50 scale-95 transform rotate-2'
          : 'hover:scale-105 hover:shadow-lg'
      }`}
    >
      <div className="bg-white rounded-lg border-2 border-gray-300 p-3 hover:border-blue-500 transition-all shadow-md">
        {/* Fighter Avatar */}
        <div
          className="w-16 h-16 mx-auto rounded-full mb-2 flex items-center justify-center text-white text-2xl font-bold border-4 shadow-lg"
          style={{
            backgroundColor: fighter.outfitColor || '#DC143C',
            borderColor: fighter.outfitColor || '#DC143C'
          }}
        >
          {fighter.name?.charAt(0).toUpperCase() || '?'}
        </div>
        
        {/* Fighter Name */}
        <h4 className="text-sm font-bold text-gray-900 text-center mb-1 truncate">
          {fighter.name || 'Unknown'}
        </h4>
        
        {/* Stats Preview */}
        {fighter.stats && (
          <div className="text-xs text-gray-600 text-center space-y-0.5">
            <div>STR: {fighter.stats.striking || 0}</div>
            <div>SPD: {fighter.stats.speed || 0}</div>
            <div>END: {fighter.stats.stamina || 0}</div>
            <div>WC: {fighter.weightClass || 'N/A'}</div>
          </div>
        )}
        
        {/* Drag Indicator */}
        <div className="mt-2 text-center">
          <span className="text-xs text-blue-600 font-bold">👆 Drag to train</span>
        </div>
      </div>
    </div>
  );
};

export default DraggableFighter;

