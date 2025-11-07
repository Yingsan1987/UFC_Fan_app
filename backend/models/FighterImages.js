const mongoose = require('mongoose');

const fighterImagesSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String, // Full name like "Nariman Abbassov"
  image_url: String,
  // Additional fields that might exist
  image_path: String,
  fighter_id: String,
  created_at: Date,
  updated_at: Date,
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow additional fields

// Update the updatedAt field before saving
fighterImagesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FighterImages', fighterImagesSchema, 'ufc_fighter_images');





