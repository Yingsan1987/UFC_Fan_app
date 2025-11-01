const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  forumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
  author: { type: String, default: 'Anonymous', trim: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ForumComment', forumCommentSchema, 'ufc_forum_comments');




