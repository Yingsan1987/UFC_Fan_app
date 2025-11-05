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
  username: {
    type: String,
    default: function() {
      return this.displayName || this.email.split('@')[0];
    }
  },
  photoURL: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: '/images/avatars/avatar1.png'
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
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
  },
  
  // Game Progress Reference
  gameProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameProgress',
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);



