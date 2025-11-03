const mongoose = require('mongoose');

const upcomingEventSchema = new mongoose.Schema({
  event_title: String,
  event_date: String,
  event_location: String,
  event_link: String,
  red_fighter: {
    name: String,
    profile_link: String
  },
  blue_fighter: {
    name: String,
    profile_link: String
  }
}, { strict: false }); // Allow additional fields

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema, 'ufc_upcoming_events');

