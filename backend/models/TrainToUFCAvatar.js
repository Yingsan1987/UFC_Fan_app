const mongoose = require('mongoose');

const trainToUFCAvatarSchema = new mongoose.Schema({
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
  
  // Avatar Customization
  name: {
    type: String,
    required: true,
    maxlength: 20
  },
  skinColor: {
    type: String,
    default: '#fdbcb4'
  },
  hairColor: {
    type: String,
    default: '#8B4513'
  },
  hairStyle: {
    type: String,
    enum: ['short', 'medium', 'long', 'bald'],
    default: 'short'
  },
  outfitColor: {
    type: String,
    default: '#DC143C'
  },
  
  // Fighter Stats (STR, SPD, END, TECH, LCK)
  stats: {
    striking: { type: Number, default: 50, min: 0, max: 100 }, // STR
    speed: { type: Number, default: 50, min: 0, max: 100 }, // SPD
    stamina: { type: Number, default: 50, min: 0, max: 100 }, // END
    grappling: { type: Number, default: 50, min: 0, max: 100 }, // TECH
    luck: { type: Number, default: 50, min: 0, max: 100 }, // LCK
    defense: { type: Number, default: 50, min: 0, max: 100 } // Legacy support
  },
  
  // Weight Class (required for matchmaking)
  weightClass: {
    type: String,
    enum: ['Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 
           'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'],
    required: true,
    default: 'Lightweight'
  },
  
  // XP and Currency
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  trainTokens: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Leaderboard Stats
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Training Progress
  trainingSessions: {
    type: Number,
    default: 0
  },
  totalTrainingPoints: {
    type: Number,
    default: 0
  },
  
  // Train Status
  onTrain: {
    type: Boolean,
    default: false
  },
  trainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Train',
    default: null
  },
  carNumber: {
    type: Number,
    default: null
  },
  spotNumber: {
    type: Number,
    default: null
  },
  
  // Battle History
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  eliminated: {
    type: Boolean,
    default: false
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

trainToUFCAvatarSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TrainToUFCAvatar', trainToUFCAvatarSchema, 'train_to_ufc_avatars');

