const express = require('express');
const Event = require('../models/Event');
const router = express.Router();

router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

router.post('/', async (req, res) => {
  const event = new Event(req.body);
  await event.save();
  res.status(201).json(event);
});

module.exports = router;
