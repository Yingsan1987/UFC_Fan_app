const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Anonymous', trim: true },
  
  // User info for logged-in users
  authorUid: { type: String }, // Firebase UID
  authorPhotoURL: { type: String },
  
  // Like tracking
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // Array of Firebase UIDs who liked this
  
  // Dislike tracking
  dislikes: { type: Number, default: 0 },
  dislikedBy: [{ type: String }], // Array of Firebase UIDs who disliked this
  
  // Comment count
  commentCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Forum', forumSchema, 'ufc_forums');




