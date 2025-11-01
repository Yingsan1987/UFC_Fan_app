const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  forumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
  author: { type: String, default: 'Anonymous', trim: true },
  content: { type: String, required: true },
  
  // User info for logged-in users
  authorUid: { type: String }, // Firebase UID
  authorPhotoURL: { type: String },
  
  // Like tracking
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // Array of Firebase UIDs who liked this
}, { timestamps: true });

module.exports = mongoose.model('ForumComment', forumCommentSchema, 'ufc_forum_comments');




