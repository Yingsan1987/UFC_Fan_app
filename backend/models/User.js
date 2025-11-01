const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  photoURL: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // User preferences
  preferences: {
    favoriteFighters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fighter'
    }],
    notifications: {
      type: Boolean,
      default: true
    }
  }
});

module.exports = mongoose.model('User', userSchema);


