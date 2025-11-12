const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const UserPrediction = require('../models/UserPrediction');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const predictions = await UserPrediction.find({ firebaseUid: req.user.uid })
      .sort({ savedAt: -1, createdAt: -1 })
      .lean();

    res.json(predictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch prediction history', message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { eventName, eventDate, location, savedAt, picks } = req.body || {};

    if (!eventName || !Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ error: 'Invalid payload. eventName and picks are required.' });
    }

    const prediction = await UserPrediction.create({
      firebaseUid: req.user.uid,
      eventName,
      eventDate,
      location,
      savedAt: savedAt ? new Date(savedAt) : new Date(),
      picks,
    });

    res.status(201).json(prediction.toObject());
  } catch (error) {
    console.error('Error saving prediction:', error);
    res.status(500).json({ error: 'Failed to save prediction', message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    await UserPrediction.deleteMany({ firebaseUid: req.user.uid });
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing predictions:', error);
    res.status(500).json({ error: 'Failed to clear predictions', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletion = await UserPrediction.findOneAndDelete({
      _id: id,
      firebaseUid: req.user.uid,
    });

    if (!deletion) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({ error: 'Failed to delete prediction', message: error.message });
  }
});

module.exports = router;

