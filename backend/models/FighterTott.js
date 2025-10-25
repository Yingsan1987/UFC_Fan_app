const mongoose = require('mongoose');

const fighterTottSchema = new mongoose.Schema({
  // Basic fighter information
  name: String,
  nickname: String,
  division: String,
  weight_class: String,
  
  // Physical attributes
  height: String,
  weight: String,
  reach: String,
  age: Number,
  
  // Fighting record
  wins: Number,
  losses: Number,
  draws: Number,
  record: String,
  
  // Career status
  status: String,
  ranking: Number,
  champion: Boolean,
  
  // Personal information
  nationality: String,
  country: String,
  hometown: String,
  fighting_style: String,
  camp: String,
  
  // Media
  image_url: String,
  profile_url: String,
  
  // Fighting statistics
  striking_accuracy: Number,
  grappling: String,
  knockouts: Number,
  submissions: Number,
  
  // Recent fights
  last_fight: {
    opponent: String,
    result: String,
    method: String,
    date: Date
  },
  next_fight: {
    opponent: String,
    event: String,
    date: Date
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
fighterTottSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FighterTott', fighterTottSchema, 'ufc-fighter_tott');
