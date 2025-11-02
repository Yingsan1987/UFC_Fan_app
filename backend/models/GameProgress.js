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
  
  // Fighter Level Progression (3-tier system)
  fighterLevel: {
    type: String,
    enum: ['Preliminary Card', 'Main Card', 'Champion'],
    default: 'Preliminary Card'
  },
  levelWins: {
    type: Number,
    default: 0
  },
  winsNeededForNextLevel: {
    type: Number,
    default: 5  // Varies by level
  },
  
  // Champion Retirement
  championWins: {
    type: Number,
    default: 0
  },
  isRetired: {
    type: Boolean,
    default: false
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

// Method to add fight result and check for level up
gameProgressSchema.methods.addFightResult = function(fightData) {
  this.fightHistory.push(fightData);
  
  let leveledUp = false;
  let retired = false;
  
  if (fightData.result === 'win') {
    this.totalWins += 1;
    this.prestige += 10;
    this.levelWins += 1;
    
    // Track champion wins separately
    if (this.fighterLevel === 'Champion') {
      this.championWins += 1;
      
      // Retire after 5 champion wins
      if (this.championWins >= 5) {
        this.isRetired = true;
        retired = true;
      }
    }
    
    // Check for level progression (3-tier system)
    if (this.levelWins >= this.winsNeededForNextLevel && !this.isRetired) {
      if (this.fighterLevel === 'Preliminary Card') {
        this.fighterLevel = 'Main Card';
        this.levelWins = 0;
        this.winsNeededForNextLevel = 3;
        leveledUp = true;
      } else if (this.fighterLevel === 'Main Card') {
        this.fighterLevel = 'Champion';
        this.levelWins = 0;
        this.winsNeededForNextLevel = 2; // Champion needs 2 wins, then retires at 5
        leveledUp = true;
      }
    }
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
  
  return { leveledUp, retired };
};

module.exports = mongoose.model('GameProgress', gameProgressSchema);

