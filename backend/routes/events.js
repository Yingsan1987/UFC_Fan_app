const express = require('express');
const Event = require('../models/Event');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log('📅 Fetching events from ufc_event_details collection...');
    const events = await Event.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  const event = new Event(req.body);
  await event.save();
  res.status(201).json(event);
});

// Debug endpoint to check database connection and collection
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking database connection...');
    
    // Check if mongoose is connected
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log(`📊 Connection state: ${states[connectionState]}`);
    console.log(`📊 Database name: ${mongoose.connection.name}`);
    console.log(`📊 Collection name: ${Event.collection.name}`);
    
    // Try to count documents
    const count = await Event.countDocuments();
    console.log(`📊 Document count in ${Event.collection.name}: ${count}`);
    
    // Try to find one document
    const sample = await Event.findOne();
    console.log('📊 Sample document:', sample);
    
    res.json({
      connectionState: states[connectionState],
      databaseName: mongoose.connection.name,
      collectionName: Event.collection.name,
      documentCount: count,
      sampleDocument: sample,
      message: 'Debug information retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Debug failed'
    });
  }
});

module.exports = router;
