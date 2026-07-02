const mongoose = require('mongoose');

const pickSchema = new mongoose.Schema({
  fighter1: String,       // red corner name
  fighter2: String,       // blue corner name
  pickedFighter: String,  // which fighter they picked
  weightClass: String,
  // NEW: predicted finish method + confidence (single-fight "next fight" mode)
  pickedMethod: {         // 'KO/TKO' | 'Submission' | 'Decision' | '' (winner-only, legacy card mode)
    type: String,
    default: '',
  },
  confidence: {           // 1–5 slider; scoring scales with this (new mode only)
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  methodCorrect: { type: Boolean, default: false }, // did the predicted method hit?
  result: {
    type: String,
    enum: ['pending', 'correct', 'incorrect', 'draw', 'nc'],
    default: 'pending',
  },
  pointsEarned: { type: Number, default: 0 },
  method: String,         // ACTUAL result method (filled in at scoring time)
});

const fantasyEntrySchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true },
  eventName:   { type: String, required: true },
  eventDate:   String,
  picks: [pickSchema],
  totalPoints:      { type: Number, default: 0 },
  fanCoinsEarned:   { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'partial', 'scored'],
    default: 'pending',
  },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One entry per user per event
fantasyEntrySchema.index({ firebaseUid: 1, eventName: 1 }, { unique: true });

module.exports = mongoose.model('FantasyEntry', fantasyEntrySchema, 'fantasy_entries');
