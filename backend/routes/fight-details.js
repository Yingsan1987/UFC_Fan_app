const express = require('express');
const FightResults = require('../models/FightDetails');
const FighterImages = require('../models/FighterImages');
const { createFuzzyFinder } = require('../utils/nameMatcher');
const router = express.Router();

// Get fight details by event name
router.get('/:eventName', async (req, res) => {
  try {
    const eventName = decodeURIComponent(req.params.eventName);
    console.log(`🥊 Fetching fight details for event: ${eventName}`);
    
    // Search for fights that match the event name (case insensitive)
    const fightDetails = await FightResults.find({
      EVENT: { $regex: eventName, $options: 'i' }
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${fightDetails.length} fights for event: ${eventName}`);
    
    if (fightDetails.length === 0) {
      return res.status(404).json({ 
        message: 'No fight details found for this event',
        eventName: eventName
      });
    }
    
    // Fetch fighter images and add fuzzy matching
    const { isValidImageUrl } = require('../utils/nameMatcher');
    const fighterImages = await FighterImages.find();
    const findImage = createFuzzyFinder(
      fighterImages
        .filter((img) => {
          const imageUrl = img?.image_url || img?.image_path;
          return img?.name && imageUrl && isValidImageUrl(imageUrl);
        })
        .map((img) => ({
          name: img.name,
          value: img.image_url || img.image_path,
        })),
      { threshold: 0.90 } // 90% similarity threshold for fuzzy matching
    );
    
    // Parse fighter names from BOUT field and add images
    const fightsWithImages = fightDetails.map(fight => {
      const bout = fight.BOUT || '';
      const parts = bout.split(/\s+vs\.?\s+/i);
      
      let fighter1Name = parts[0]?.trim() || '';
      let fighter2Name = parts[1]?.trim() || '';
      
      // Try to get images using fuzzy matching
      const fighter1Image = fighter1Name ? findImage(fighter1Name) : null;
      const fighter2Image = fighter2Name ? findImage(fighter2Name) : null;
      
      return {
        ...fight.toObject(),
        fighter1Name,
        fighter2Name,
        fighter1Image,
        fighter2Image
      };
    });
    
    res.json(fightsWithImages);
  } catch (error) {
    console.error('❌ Error fetching fight details:', error);
    res.status(500).json({ error: 'Failed to fetch fight details' });
  }
});

// Get all fight details
router.get('/', async (req, res) => {
  try {
    console.log('🥊 Fetching all fight details...');
    const fightDetails = await FightResults.find().sort({ createdAt: -1 });
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
    const fightDetail = new FightResults(req.body);
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
    
    const count = await FightResults.countDocuments();
    const sample = await FightResults.findOne();
    
    res.json({
      connectionState: states[connectionState],
      databaseName: mongoose.connection.name,
      collectionName: FightResults.collection.name,
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
