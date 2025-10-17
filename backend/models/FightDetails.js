const mongoose = require('mongoose');

const fightResultsSchema = new mongoose.Schema({
  EVENT: String,
  BOUT: String,
  OUTCOME: String,
  WEIGHTCLASS: String,
  METHOD: String,
  ROUND: Number,
  TIME: String,
  TIME_FORMAT: String,
  REFEREE: String,
  DETAILS: String,
  URL: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FightResults', fightResultsSchema, 'ufc_fight_results');
