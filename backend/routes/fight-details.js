const express = require('express');
const FightDetails = require('../models/FightDetails');
const router = express.Router();

// Get fight details by event name
router.get('/:eventName', async (req, res) => {
  try {
    const eventName = decodeURIComponent(req.params.eventName);
    console.log(`🥊 Fetching fight details for event: ${eventName}`);
    
    // Search for fights that match the event name (case insensitive)
    const fightDetails = await FightDetails.find({
      EVENT: { $regex: eventName, $options: 'i' }
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${fightDetails.length} fights for event: ${eventName}`);
    
    if (fightDetails.length === 0) {
      return res.status(404).json({ 
        message: 'No fight details found for this event',
        eventName: eventName
      });
    }
    
    res.json(fightDetails);
  } catch (error) {
    console.error('❌ Error fetching fight details:', error);
    res.status(500).json({ error: 'Failed to fetch fight details' });
  }
});

// Get all fight details
router.get('/', async (req, res) => {
  try {
    console.log('🥊 Fetching all fight details...');
    const fightDetails = await FightDetails.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${fightDetails.length} total fights`);
    res.json(fightDetails);
  } catch (error) {
    console.error('❌ Error fetching fight details:', error);
    res.status(500).json({ error: 'Failed to fetch fight details' });
  }
});

// Create new fight detail
router.post('/', async (req, res) => {
  try {
    const fightDetail = new FightDetails(req.body);
    await fightDetail.save();
    console.log(`✅ Created new fight detail: ${fightDetail.EVENT}`);
    res.status(201).json(fightDetail);
  } catch (error) {
    console.error('❌ Error creating fight detail:', error);
    res.status(500).json({ error: 'Failed to create fight detail' });
  }
});

// Debug endpoint
router.get('/debug/collections', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking fight details collection...');
    
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const count = await FightDetails.countDocuments();
    const sample = await FightDetails.findOne();
    
    res.json({
      connectionState: states[connectionState],
      databaseName: mongoose.connection.name,
      collectionName: FightDetails.collection.name,
      documentCount: count,
      sampleDocument: sample,
      message: 'Fight details debug information retrieved successfully'
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
