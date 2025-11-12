const mongoose = require('mongoose');

const pickSchema = new mongoose.Schema(
  {
    fightLabel: { type: String, required: true },
    prediction: { type: String, required: true },
    cardType: { type: String, default: 'main' },
    fighter1: { type: String, default: '' },
    fighter2: { type: String, default: '' },
    fighter1Image: { type: String, default: null },
    fighter2Image: { type: String, default: null },
    weightClass: { type: String, default: '' },
    predictedCorner: { type: String, enum: ['fighter1', 'fighter2', null], default: null },
  },
  { _id: false }
);

const userPredictionSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    eventDate: { type: String, default: '' },
    location: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now },
    picks: { type: [pickSchema], default: [] },
  },
  { timestamps: true }
);

userPredictionSchema.index({ firebaseUid: 1, savedAt: -1 });

module.exports = mongoose.model('UserPrediction', userPredictionSchema);

