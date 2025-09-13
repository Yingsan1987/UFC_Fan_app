const express = require('express');
const axios = require('axios');
const Fighter = require('../models/Fighter');
const router = express.Router();

// ✅ Get fighters from MongoDB
router.get('/', async (req, res) => {
  try {
    const fighters = await Fighter.find();
    res.json(fighters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get live fighters from RapidAPI
router.get('/live', async (req, res) => {
  try {
    const options = {
      method: 'GET',
      url: 'https://ufc-data-api.p.rapidapi.com/api/fighters', // Adjust endpoint as per RapidAPI docs
      headers: {
        'x-rapidapi-host': 'ufc-data-api.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch data from RapidAPI' });
  }
});

// ✅ Add new fighter manually into MongoDB
router.post('/', async (req, res) => {
  try {
    const fighter = new Fighter(req.body);
    await fighter.save();
    res.status(201).json(fighter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
