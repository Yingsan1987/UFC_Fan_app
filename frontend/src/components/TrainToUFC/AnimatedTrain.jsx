import { useState, useEffect, useRef } from 'react';
import TrainCar from './TrainCar';

const AnimatedTrain = ({ train, onDrop, onDragStart, myAvatar, onFighterClick, isAnimating = true }) => {
  const trainRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Continuous scrolling animation
  useEffect(() => {
    if (!isAnimating) return;

    const scrollSpeed = 0.5; // pixels per frame
    let animationFrameId;

    const animate = () => {
      setScrollPosition(prev => {
        const newPos = prev + scrollSpeed;
        // Reset position when scrolled past train width
        if (trainRef.current) {
          const trainWidth = trainRef.current.scrollWidth;
          return newPos >= trainWidth ? 0 : newPos;
        }
        return newPos;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAnimating, train?.cars?.length]);

  if (!train) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading train...</p>
      </div>
    );
  }

  if (!train.cars || train.cars.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No train available. Join a train to start!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-2xl border-4 border-gray-700">
      {/* Background Track Lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white transform -translate-y-1/2" style={{ top: '30%' }}></div>
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white transform -translate-y-1/2" style={{ top: '70%' }}></div>
      </div>

      {/* Train Container */}
      <div
        ref={trainRef}
        className="flex gap-4 p-4"
        style={{
          transform: `translateX(-${scrollPosition}px)`,
          transition: isAnimating ? 'none' : 'transform 0.1s linear'
        }}
      >
        {/* Duplicate cars for seamless loop */}
        {[...train.cars, ...train.cars].map((car, index) => {
          const carNumber = (index % train.cars.length) + 1;
          return (
            <div
              key={`car-${index}`}
              className="flex-shrink-0 w-64"
            >
              <TrainCar
                car={car}
                carNumber={carNumber}
                onDrop={onDrop}
                onDragStart={onDragStart}
                myAvatar={myAvatar}
                onFighterClick={onFighterClick}
              />
            </div>
          );
        })}
      </div>

      {/* Train Speed Indicator */}
      {isAnimating && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          Moving
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
        <div className="flex gap-4">
          <span>Fighters: {train.occupiedSpots || 0}/{train.totalSpots || 20}</span>
          <span>Cars: {train.currentCarCount || 10}</span>
          {train.winner && (
            <span className="text-yellow-400 font-bold">
              Winner: {train.winner.avatarId?.name || 'Unknown'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedTrain;

