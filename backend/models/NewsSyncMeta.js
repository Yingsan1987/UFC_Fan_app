const mongoose = require('mongoose');

/**
 * NewsSyncMeta - Tracks last sync time to implement rate limiting
 * Only one document should exist (singleton pattern)
 */
const newsSyncMetaSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'singleton'
  },
  lastFetchedAt: {
    type: Date,
    default: null
  },
  lastQueryTag: {
    type: String,
    default: 'ufc'
  },
  lastFetchCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure only one document exists
newsSyncMetaSchema.statics.getSingleton = async function() {
  let meta = await this.findOne({ _id: 'singleton' });
  if (!meta) {
    meta = await this.create({ _id: 'singleton' });
  }
  return meta;
};

module.exports = mongoose.model('NewsSyncMeta', newsSyncMetaSchema);
