// Simple state management using React hooks pattern
// Provides Zustand-like API without needing Zustand library

import React, { useState, useCallback, useContext, createContext } from 'react';

// Create context for store
const TrainGameContext = createContext(null);

// Custom hook to use the store
export const useTrainGameStore = () => {
  const context = useContext(TrainGameContext);
  if (!context) {
    // Return default implementation if context not available
    return {
      waitingZone: [],
      trainSlots: {},
      draggingFighter: null,
      train: null,
      myAvatar: null,
      setTrain: () => {},
      setMyAvatar: () => {},
      initializeWaitingZone: () => {},
      startDrag: () => {},
      stopDrag: () => {},
      placeFighter: () => ({ success: false }),
      returnToWaitingZone: () => ({ success: false }),
      clearSlot: () => {},
      syncTrainState: () => {},
      reset: () => {}
    };
  }
  return context;
};

// Provider component
export const TrainGameProvider = ({ children }) => {
  const [waitingZone, setWaitingZone] = useState([]);
  const [trainSlots, setTrainSlots] = useState({});
  const [draggingFighter, setDraggingFighter] = useState(null);
  const [train, setTrainState] = useState(null);
  const [myAvatar, setMyAvatarState] = useState(null);

  const setTrain = useCallback((trainData) => {
    setTrainState(trainData);
  }, []);

  const setMyAvatar = useCallback((avatar) => {
    setMyAvatarState(avatar);
  }, []);

  const initializeWaitingZone = useCallback((fighters) => {
    setWaitingZone(fighters || []);
  }, []);

  const startDrag = useCallback((fighterId) => {
    setDraggingFighter(fighterId);
  }, []);

  const stopDrag = useCallback(() => {
    setDraggingFighter(null);
  }, []);

  const placeFighter = useCallback((cartId, slotId, fighter) => {
    setTrainSlots(prev => {
      const newSlots = { ...prev };
      if (!newSlots[cartId]) {
        newSlots[cartId] = { slot1: null, slot2: null };
      }
      newSlots[cartId][slotId] = fighter._id || fighter.id;
      return newSlots;
    });

    setWaitingZone(prev => prev.filter(
      f => (f._id || f.id) !== (fighter._id || fighter.id)
    ));

    setDraggingFighter(null);
    return { success: true };
  }, []);

  const returnToWaitingZone = useCallback((fighter) => {
    const fighterId = fighter._id || fighter.id;

    setTrainSlots(prev => {
      const newSlots = { ...prev };
      Object.keys(newSlots).forEach(cartId => {
        if (newSlots[cartId].slot1 === fighterId) {
          newSlots[cartId].slot1 = null;
        }
        if (newSlots[cartId].slot2 === fighterId) {
          newSlots[cartId].slot2 = null;
        }
      });
      return newSlots;
    });

    setWaitingZone(prev => {
      const isInWaitingZone = prev.some(f => (f._id || f.id) === fighterId);
      if (!isInWaitingZone) {
        return [...prev, fighter];
      }
      return prev;
    });

    setDraggingFighter(null);
    return { success: true };
  }, []);

  const clearSlot = useCallback((cartId, slotId) => {
    setTrainSlots(prev => {
      const newSlots = { ...prev };
      if (newSlots[cartId]) {
        newSlots[cartId][slotId] = null;
      }
      return newSlots;
    });
  }, []);

  const syncTrainState = useCallback((trainData, avatar) => {
    const slots = {};
    if (trainData && trainData.cars) {
      trainData.cars.forEach((car, index) => {
        const cartId = `car-${car.carNumber || index + 1}`;
        slots[cartId] = {
          slot1: car.spot1?.occupied ? (car.spot1.avatarId?._id || car.spot1.avatarId) : null,
          slot2: car.spot2?.occupied ? (car.spot2.avatarId?._id || car.spot2.avatarId) : null
        };
      });
    }

    const waiting = [];
    if (avatar && !avatar.onTrain) {
      waiting.push(avatar);
    }

    setTrainState(trainData);
    setMyAvatarState(avatar);
    setTrainSlots(slots);
    setWaitingZone(waiting);
  }, []);

  const reset = useCallback(() => {
    setWaitingZone([]);
    setTrainSlots({});
    setDraggingFighter(null);
    setTrainState(null);
    setMyAvatarState(null);
  }, []);

  const value = {
    waitingZone,
    trainSlots,
    draggingFighter,
    train,
    myAvatar,
    setTrain,
    setMyAvatar,
    initializeWaitingZone,
    startDrag,
    stopDrag,
    placeFighter,
    returnToWaitingZone,
    clearSlot,
    syncTrainState,
    reset
  };

  return (
    <TrainGameContext.Provider value={value}>
      {children}
    </TrainGameContext.Provider>
  );
};

export default useTrainGameStore;

