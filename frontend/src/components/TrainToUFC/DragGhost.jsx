import { useState, useEffect } from 'react';
import FighterAvatar from './FighterAvatar';

const DragGhost = ({ fighterData, position, isVisible }) => {
  const [ghostPosition, setGhostPosition] = useState(position);

  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = (e) => {
      setGhostPosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('touchmove', updatePosition);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('touchmove', updatePosition);
    };
  }, [isVisible]);

  if (!isVisible || !fighterData) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-none"
      style={{
        left: `${ghostPosition.x - 40}px`,
        top: `${ghostPosition.y - 60}px`,
        transform: 'rotate(5deg) scale(1.1)',
        opacity: 0.8,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
      }}
    >
      <FighterAvatar
        fighterData={fighterData}
        size="md"
        draggable={false}
        showStats={false}
      />
      
      {/* Trail effect */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{
          backgroundColor: fighterData.outfitColor || '#DC143C',
          transform: 'scale(1.5)'
        }}
      />
    </div>
  );
};

export default DragGhost;

