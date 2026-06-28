const mongoose = require('mongoose');

// Stores the latest UFC rankings scraped from ufc.com by the PythonAnywhere job
// (see scrapers/ufc_rankings/). A single document keyed "ufc_rankings" holds the
// full payload in the shape the frontend expects:
//   { rankings: [ { name, competitor_rankings: [ { rank, movement, competitor } ] } ] }
// strict:false so the Python-written document is read as-is without schema loss.
const rankingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'ufc_rankings', unique: true },
    rankings: { type: Array, default: [] },
    source: String,
    updatedAt: Date,
  },
  { collection: 'rankings', strict: false }
);

module.exports = mongoose.model('Ranking', rankingSchema);
