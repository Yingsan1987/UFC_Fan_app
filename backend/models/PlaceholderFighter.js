const mongoose = require('mongoose');

const rookieFighterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseUid: {
    type: String,
    required: true
  },
  
  // Fighter Stats (start at 50)
  stats: {
    striking: { type: Number, default: 50, min: 0, max: 100 },
    grappling: { type: Number, default: 50, min: 0, max: 100 },
    stamina: { type: Number, default: 50, min: 0, max: 100 },
    defense: { type: Number, default: 50, min: 0, max: 100 }
  },
  
  // Training Progress
  trainingSessions: {
    type: Number,
    default: 0
  },
  trainingGoal: {
    type: Number,
    default: 50
  },
  
  // Energy System
  energy: {
    type: Number,
    default: 3,
    max: 3
  },
  lastEnergyRefresh: {
    type: Date,
    default: Date.now
  },
  
  // Transfer Status
  isTransferred: {
    type: Boolean,
    default: false
  },
  transferredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fighter',
    default: null
  },
  
  // Weight Class Selection
  selectedWeightClass: {
    type: String,
    enum: ['Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'],
    default: 'Lightweight'
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
rookieFighterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to refresh energy (3 per day)
rookieFighterSchema.methods.refreshEnergy = function() {
  const now = new Date();
  const lastRefresh = new Date(this.lastEnergyRefresh);
  
  // Check if a new day has started
  if (now.getDate() !== lastRefresh.getDate() || 
      now.getMonth() !== lastRefresh.getMonth() || 
      now.getFullYear() !== lastRefresh.getFullYear()) {
    this.energy = 3;
    this.lastEnergyRefresh = now;
    return true;
  }
  return false;
};

// Method to check if eligible for transfer
rookieFighterSchema.methods.isEligibleForTransfer = function() {
  return this.trainingSessions >= this.trainingGoal && !this.isTransferred;
};

module.exports = mongoose.model('RookieFighter', rookieFighterSchema);

