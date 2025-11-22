const mongoose = require('mongoose');

const upcomingEventSchema = new mongoose.Schema({
  event_title: String,
  event_date: String,
  event_location: String,
  event_link: String,
  weight_class: String,
  red_fighter: {
    name: String,
    profile_link: String
  },
  blue_fighter: {
    name: String,
    profile_link: String
  },
  // Fight Result Fields
  winner: String, // Name of the winning fighter
  result: String, // 'win', 'loss', 'draw', 'no_contest'
  method: String, // KO, Submission, Decision, etc.
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  }
}, { strict: false }); // Allow additional fields

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema, 'ufc_upcoming_events');

