const mongoose = require('mongoose');

const gameProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  
  // Current Fighter Status
  currentFighter: {
    isRookie: { type: Boolean, default: true },
    rookieFighterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RookieFighter'
    },
    realFighterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fighter'
    }
  },
  
  // Game Currency
  fanCoin: {
    type: Number,
    default: 0
  },
  
  // Fight History
  fightHistory: [{
    eventName: String,
    fighterName: String,
    opponent: String,
    result: { type: String, enum: ['win', 'loss', 'draw', 'no contest'] },
    method: String,
    fanCoinGained: Number,
    date: { type: Date, default: Date.now }
  }],
  
  // Stats
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalDraws: { type: Number, default: 0 },
  
  // Prestige (affects matchmaking)
  prestige: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Membership Status
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
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
gameProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add fight result
gameProgressSchema.methods.addFightResult = function(fightData) {
  this.fightHistory.push(fightData);
  
  if (fightData.result === 'win') {
    this.totalWins += 1;
    this.prestige += 10;
  } else if (fightData.result === 'loss') {
    this.totalLosses += 1;
    this.prestige = Math.max(0, this.prestige - 5);
  } else if (fightData.result === 'draw') {
    this.totalDraws += 1;
  }
  
  // Add Fan Coin
  if (fightData.fanCoinGained) {
    this.fanCoin += fightData.fanCoinGained;
  }
};

module.exports = mongoose.model('GameProgress', gameProgressSchema);

