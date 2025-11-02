const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseUid: {
    type: String,
    required: true
  },
  rookieFighterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RookieFighter',
    required: true
  },
  
  // Training Details
  trainingType: {
    type: String,
    enum: ['bagWork', 'grappleDrills', 'cardio', 'sparDefense'],
    required: true
  },
  attributeImproved: {
    type: String,
    enum: ['striking', 'grappling', 'stamina', 'defense'],
    required: true
  },
  xpGained: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  
  // Timestamp
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);

