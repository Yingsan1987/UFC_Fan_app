const mongoose = require('mongoose');

const fighterSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  nickname: String,
  division: { type: String, required: true },
  
  // Physical Stats
  height: String, // e.g., "6'4\""
  weight: String, // e.g., "185 lbs"
  reach: String,  // e.g., "76\""
  age: Number,
  
  // Fighting Record
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  record: String, // e.g., "20-3-0"
  
  // Career Info
  status: { type: String, default: 'active' }, // active, retired, suspended
  ranking: Number, // Current UFC ranking in division
  champion: { type: Boolean, default: false },
  
  // Personal Info
  nationality: String,
  hometown: String,
  fightingStyle: String,
  camp: String, // Training camp/team
  
  // Media
  imageUrl: String,
  profileUrl: String, // Official UFC profile link
  
  // Fighting Stats
  strikingAccuracy: Number, // percentage
  grappling: String, // brief description
  knockouts: Number,
  submissions: Number,
  
  // Recent Activity
  lastFight: {
    opponent: String,
    result: String, // Win/Loss/Draw
    method: String, // Decision, KO, Submission, etc.
    date: Date
  },
  nextFight: {
    opponent: String,
    event: String,
    date: Date
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
fighterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Fighter', fighterSchema);
