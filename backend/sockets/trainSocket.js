const Train = require('../models/Train');
const TrainToUFCAvatar = require('../models/TrainToUFCAvatar');

// Store helpers globally for routes to access
let socketHelpers = null;

/**
 * Socket.io handler for Train to UFC real-time updates
 */
function trainSocket(io) {
  const trainNamespace = io.of('/train-to-ufc');
  
  trainNamespace.on('connection', (socket) => {
    console.log(`🚂 Train socket connected: ${socket.id}`);
    
    // Join train room
    socket.on('join-train', async (data) => {
      try {
        const { trainId } = data;
        if (!trainId) {
          socket.emit('error', { message: 'Train ID required' });
          return;
        }
        
        socket.join(`train-${trainId}`);
        console.log(`✅ Socket ${socket.id} joined train ${trainId}`);
        
        // Send current train state
        const train = await Train.findById(trainId)
          .populate('cars.spot1.avatarId', 'name stats outfitColor wins losses weightClass')
          .populate('cars.spot2.avatarId', 'name stats outfitColor wins losses weightClass');
        
        if (train) {
          socket.emit('train-state', { train });
        }
      } catch (error) {
        console.error('Error joining train room:', error);
        socket.emit('error', { message: 'Failed to join train room' });
      }
    });
    
    // Leave train room
    socket.on('leave-train', (data) => {
      const { trainId } = data;
      if (trainId) {
        socket.leave(`train-${trainId}`);
        console.log(`❌ Socket ${socket.id} left train ${trainId}`);
      }
    });
    
    // Listen for fight requests (for manual trigger if needed)
    socket.on('request-fight', async (data) => {
      try {
        const { trainId, carNumber } = data;
        // Fight logic handled by backend routes
        trainNamespace.to(`train-${trainId}`).emit('fight-requested', { carNumber });
      } catch (error) {
        console.error('Error requesting fight:', error);
        socket.emit('error', { message: 'Failed to request fight' });
      }
    });

    // Listen for train state update requests
    socket.on('train-update-request', async (data) => {
      try {
        const { trainId } = data;
        if (trainId) {
          const train = await Train.findById(trainId)
            .populate('cars.spot1.avatarId', 'name stats outfitColor wins losses weightClass')
            .populate('cars.spot2.avatarId', 'name stats outfitColor wins losses weightClass');
          
          if (train) {
            trainNamespace.to(`train-${trainId}`).emit('train-state', { train });
          }
        }
      } catch (error) {
        console.error('Error handling train update request:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`🚂 Train socket disconnected: ${socket.id}`);
    });
  });
  
  // Helper function to broadcast train state updates
  async function broadcastTrainUpdate(trainId, update) {
    try {
      const train = await Train.findById(trainId)
        .populate('cars.spot1.avatarId', 'name stats outfitColor wins losses weightClass')
        .populate('cars.spot2.avatarId', 'name stats outfitColor wins losses weightClass');
      
      trainNamespace.to(`train-${trainId}`).emit('train-update', {
        train,
        update,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error broadcasting train update:', error);
    }
  }
  
  // Helper function to broadcast fight result
  function broadcastFightResult(trainId, fightResult) {
    trainNamespace.to(`train-${trainId}`).emit('fight-result', {
      ...fightResult,
      timestamp: new Date()
    });
  }
  
  // Export helper functions for use in routes
  const helpers = {
    broadcastTrainUpdate,
    broadcastFightResult,
    namespace: trainNamespace
  };
  
  // Store helpers globally for routes to access
  socketHelpers = helpers;
  
  return helpers;
}

// Export function to get helpers (for routes)
trainSocket.getHelpers = function() {
  return socketHelpers;
};

module.exports = trainSocket;

