const mongoose = require('mongoose');

const ufcEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    unique: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  location: String,
  
  // Fight Card Structure
  fightCard: {
    mainEvent: [{
      fightId: String,
      fighter1: String,
      fighter2: String,
      winner: String, // fighter name who won
      result: String, // win/loss/draw/no contest
      method: String, // KO, Submission, Decision, etc.
      processed: { type: Boolean, default: false } // coins awarded?
    }],
    coMainEvent: [{
      fightId: String,
      fighter1: String,
      fighter2: String,
      winner: String,
      result: String,
      method: String,
      processed: { type: Boolean, default: false }
    }],
    mainCard: [{
      fightId: String,
      fighter1: String,
      fighter2: String,
      winner: String,
      result: String,
      method: String,
      processed: { type: Boolean, default: false }
    }],
    preliminaryCard: [{
      fightId: String,
      fighter1: String,
      fighter2: String,
      winner: String,
      result: String,
      method: String,
      processed: { type: Boolean, default: false }
    }],
    earlyPreliminaryCard: [{
      fightId: String,
      fighter1: String,
      fighter2: String,
      winner: String,
      result: String,
      method: String,
      processed: { type: Boolean, default: false }
    }]
  },
  
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
ufcEventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get coin value for a fight based on card position
ufcEventSchema.methods.getCoinValue = function(cardType) {
  const coinValues = {
    mainEvent: 30,        // Champion level
    coMainEvent: 30,      // Champion level
    mainCard: 5,          // Main Card level
    preliminaryCard: 1,   // Preliminary level
    earlyPreliminaryCard: 1  // Preliminary level
  };
  return coinValues[cardType] || 0;
};

module.exports = mongoose.model('UFCEvent', ufcEventSchema);

