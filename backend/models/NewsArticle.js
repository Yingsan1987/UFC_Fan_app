const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: null
  },
  sourceName: {
    type: String,
    default: ''
  },
  sourceId: {
    type: String,
    default: null
  },
  urlToImage: {
    type: String,
    default: null
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  queryTag: {
    type: String,
    default: 'ufc',
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index for efficient querying by queryTag and publishedAt
newsArticleSchema.index({ queryTag: 1, publishedAt: -1 });

// Index for publishedAt descending (most recent first)
newsArticleSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('NewsArticle', newsArticleSchema);
