const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

router.get('/', async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(50);
  res.json(messages);
});

module.exports = router;
