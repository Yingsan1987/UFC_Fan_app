const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Anonymous', trim: true },
  likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Forum', forumSchema, 'ufc_forums');




