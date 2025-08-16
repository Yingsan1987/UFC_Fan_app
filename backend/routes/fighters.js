const express = require('express');
const Fighter = require('../models/Fighter');
const router = express.Router();

router.get('/', async (req, res) => {
  const fighters = await Fighter.find();
  res.json(fighters);
});

router.post('/', async (req, res) => {
  const fighter = new Fighter(req.body);
  await fighter.save();
  res.status(201).json(fighter);
});

module.exports = router;
