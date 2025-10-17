const mongoose = require('mongoose');

const fightDetailsSchema = new mongoose.Schema({
  EVENT: String,
  BOUT: String,
  URL: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FightDetails', fightDetailsSchema, 'ufc_fight_details');
