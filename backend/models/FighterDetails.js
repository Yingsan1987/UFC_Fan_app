const mongoose = require('mongoose');

const fighterDetailsSchema = new mongoose.Schema({
  // Actual data structure from your ufc-fighter_details collection
  _id: mongoose.Schema.Types.ObjectId,
  FIRST: String,
  LAST: String,
  NICKNAME: String,
  URL: String,
  
  // Additional fields that might exist in your collection
  DIVISION: String,
  HEIGHT: String,
  WEIGHT: String,
  REACH: String,
  AGE: Number,
  WINS: Number,
  LOSSES: Number,
  DRAWS: Number,
  RECORD: String,
  STATUS: String,
  RANKING: Number,
  CHAMPION: Boolean,
  NATIONALITY: String,
  HOMETOWN: String,
  FIGHTING_STYLE: String,
  CAMP: String,
  IMAGE_URL: String,
  STRIKING_ACCURACY: Number,
  GRAPPLING: String,
  KNOCKOUTS: Number,
  SUBMISSIONS: Number,
  LAST_FIGHT: {
    OPPONENT: String,
    RESULT: String,
    METHOD: String,
    DATE: Date
  },
  NEXT_FIGHT: {
    OPPONENT: String,
    EVENT: String,
    DATE: Date
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow additional fields

// Update the updatedAt field before saving
fighterDetailsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Try both naming conventions: ufc-fighter_details and ufc_fighter_details
module.exports = mongoose.model('FighterDetails', fighterDetailsSchema, 'ufc_fighter_details');
