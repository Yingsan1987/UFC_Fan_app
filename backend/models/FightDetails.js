const mongoose = require('mongoose');

const fightDetailsSchema = new mongoose.Schema({
  EVENT: String,
  DATE: String,
  LOCATION: String,
  URL: String,
  WEIGHT_CLASS: String,
  ROUNDS: String,
  FIGHTER_1: String,
  FIGHTER_1_RECORD: String,
  FIGHTER_1_AGE: String,
  FIGHTER_1_HEIGHT: String,
  FIGHTER_1_WEIGHT: String,
  FIGHTER_2: String,
  FIGHTER_2_RECORD: String,
  FIGHTER_2_AGE: String,
  FIGHTER_2_HEIGHT: String,
  FIGHTER_2_WEIGHT: String,
  RESULT: String,
  METHOD: String,
  ROUND: String,
  TIME: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FightDetails', fightDetailsSchema, 'ufc_fight_details');
