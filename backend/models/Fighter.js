const mongoose = require('mongoose');

const fighterSchema = new mongoose.Schema({
  name: String,
  division: String,
  record: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fighter', fighterSchema);
