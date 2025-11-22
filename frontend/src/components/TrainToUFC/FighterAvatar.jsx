import React, { useState, useRef, useEffect } from 'react';
import { Target } from 'lucide-react';

const FighterAvatar = ({ 
  fighterData, 
  size = 'md', 
  draggable = true, 
  onDragStart, 
  onDragEnd,
  isDragging = false,
  showStats = true 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isIdleAnimating, setIsIdleAnimating] = useState(true);
  const avatarRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-12 h-16', avatar: 'w-10 h-14', text: 'text-xs', icon: 'w-3 h-3' },
    md: { container: 'w-16 h-24', avatar: 'w-14 h-20', text: 'text-sm', icon: 'w-4 h-4' },
    lg: { container: 'w-24 h-32', avatar: 'w-20 h-28', text: 'text-base', icon: 'w-5 h-5' }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Idle breathing animation
  useEffect(() => {
    if (!isIdleAnimating || isDragging) return;
    
    const interval = setInterval(() => {
      if (avatarRef.current) {
        avatarRef.current.style.animation = 'breathing 3s ease-in-out infinite';
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isIdleAnimating, isDragging]);

  const handleDragStart = (e) => {
    if (!draggable || !fighterData) return;
    
    setIsHovered(false);
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(fighterData));
    e.dataTransfer.setData('fighter-id', fighterData._id || fighterData.id);
    
    // Create custom drag image
    if (avatarRef.current) {
      const dragImage = avatarRef.current.cloneNode(true);
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'rotate(5deg) scale(1.1)';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    if (onDragStart) {
      onDragStart(fighterData, e);
    }
  };

  const handleDragEnd = (e) => {
    setIsHovered(false);
    if (onDragEnd) {
      onDragEnd(fighterData, e);
    }
  };

  if (!fighterData) return null;

  const outfitColor = fighterData.outfitColor || '#DC143C';
  const initials = fighterData.name?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <style>{`
        @keyframes breathing {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-2px) scale(1.02); }
        }
        
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        
        .fighter-avatar-idle {
          animation: breathing 3s ease-in-out infinite;
        }
        
        .fighter-avatar-drag-start {
          animation: pop 0.15s ease;
        }
        
        .fighter-avatar-glow {
          filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.6));
        }
      `}</style>
      
      <div
        ref={avatarRef}
        draggable={draggable && !isDragging}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${config.container}
          relative
          cursor-${draggable ? 'grab' : 'default'}
          transition-all duration-180 ease-out
          ${isHovered && !isDragging ? 'transform scale-105' : ''}
          ${isDragging ? 'opacity-50 scale-95 rotate-2' : ''}
          ${isIdleAnimating && !isDragging && !isHovered ? 'fighter-avatar-idle' : ''}
        `}
        style={{
          cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {/* UFC Fighter Silhouette */}
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Glow effect on hover */}
          {isHovered && !isDragging && (
            <div 
              className="absolute inset-0 rounded-full blur-md opacity-50 fighter-avatar-glow"
              style={{
                backgroundColor: outfitColor,
                boxShadow: `0 0 20px ${outfitColor}`
              }}
            />
          )}

          {/* Fighter Avatar Circle */}
          <div
            className={`
              ${config.avatar}
              rounded-full
              flex items-center justify-center
              text-white font-bold
              border-4 shadow-lg
              relative overflow-hidden
              transition-all duration-180
              ${isHovered ? 'border-opacity-100' : 'border-opacity-90'}
            `}
            style={{
              backgroundColor: outfitColor,
              borderColor: outfitColor,
              boxShadow: isHovered 
                ? `0 0 15px ${outfitColor}, inset 0 0 20px rgba(0,0,0,0.3)` 
                : 'inset 0 0 20px rgba(0,0,0,0.3)'
            }}
          >
            {/* Muscle silhouette effect */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(ellipse at center, transparent 0%, ${outfitColor} 100%)`
              }}
            />

            {/* Initials */}
            <span className={`${config.text} font-bold relative z-10 drop-shadow-md`}>
              {initials}
            </span>

            {/* UFC Badge */}
            {size !== 'sm' && (
              <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-tl-lg">
                UFC
              </div>
            )}
          </div>

          {/* Fighter Name */}
          {size !== 'sm' && fighterData.name && (
            <div className={`mt-1 ${config.text} font-bold text-gray-900 text-center truncate w-full px-1`}>
              {fighterData.name}
            </div>
          )}

          {/* Stats Display */}
          {showStats && fighterData.stats && size !== 'sm' && (
            <div className="mt-1 flex gap-1 text-[10px] text-gray-600">
              <span className="text-red-600 font-bold">STR:{fighterData.stats.striking || 0}</span>
              {size === 'lg' && (
                <>
                  <span className="text-blue-600 font-bold">SPD:{fighterData.stats.speed || 0}</span>
                  <span className="text-green-600 font-bold">END:{fighterData.stats.stamina || 0}</span>
                </>
              )}
            </div>
          )}

          {/* Weight Class Badge */}
          {fighterData.weightClass && size !== 'sm' && (
            <div className="mt-1 bg-gray-800 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
              {fighterData.weightClass.slice(0, 3).toUpperCase()}
            </div>
          )}

          {/* Drag Indicator */}
          {draggable && !isDragging && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              <Target className="w-2 h-2" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FighterAvatar;

