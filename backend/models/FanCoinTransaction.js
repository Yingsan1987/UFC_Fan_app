const mongoose = require('mongoose');

const fanCoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseUid: {
    type: String,
    required: true
  },
  
  // Transaction Details
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'bonus', 'penalty'],
    required: true
  },
  
  // Source of transaction
  source: {
    type: String,
    enum: ['fight_win', 'transfer_bonus', 'daily_bonus', 'achievement', 'purchase', 'other'],
    required: true
  },
  
  // Fight-specific details (if earned from fight)
  fightDetails: {
    eventName: String,
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UFCEvent'
    },
    fighterName: String,
    fighterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fighter'
    },
    cardPosition: {
      type: String,
      enum: ['mainEvent', 'coMainEvent', 'mainCard', 'preliminaryCard', 'earlyPreliminaryCard']
    },
    result: String // win/loss
  },
  
  // Balance after transaction
  balanceAfter: {
    type: Number,
    required: true
  },
  
  description: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
fanCoinTransactionSchema.index({ firebaseUid: 1, createdAt: -1 });
fanCoinTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FanCoinTransaction', fanCoinTransactionSchema);




