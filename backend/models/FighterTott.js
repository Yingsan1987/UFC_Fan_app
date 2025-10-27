const mongoose = require('mongoose');

const fighterTottSchema = new mongoose.Schema({
  // Actual data structure from your ufc-fighter_tott collection
  _id: mongoose.Schema.Types.ObjectId,
  FIGHTER: String,
  HEIGHT: String,
  WEIGHT: String,
  REACH: String,
  STANCE: mongoose.Schema.Types.Mixed, // Can be String, Number, or NaN
  DOB: String, // Date of Birth as string
  URL: String,
  
  // Additional fields that might exist in your collection
  DIVISION: String,
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
fighterTottSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FighterTott', fighterTottSchema, 'ufc-fighter_tott');
