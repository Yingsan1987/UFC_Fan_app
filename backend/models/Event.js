const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  EVENT: String,
  URL: String,
  DATE: String,
  LOCATION: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema, 'ufc_event_details');
