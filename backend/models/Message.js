const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, default: '' },
  image: { type: String, default: null }, // Base64 image data
  timestamp: { type: String, default: () => new Date().toISOString() },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
