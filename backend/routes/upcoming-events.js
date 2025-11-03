const express = require('express');
const router = express.Router();
const UpcomingEvent = require('../models/UpcomingEvent');
const FighterImages = require('../models/FighterImages');

// Get upcoming events with fighter images
router.get('/', async (req, res) => {
  try {
    console.log('📅 Fetching upcoming events from ufc_upcoming_events...');
    
    // Fetch all upcoming events (fights)
    const upcomingFights = await UpcomingEvent.find();
    console.log(`✅ Found ${upcomingFights.length} upcoming fights`);
    
    // Fetch all fighter images
    const fighterImages = await FighterImages.find();
    console.log(`🖼️ Found ${fighterImages.length} fighter images`);
    
    // Create image map for quick lookup
    const imageMap = {};
    fighterImages.forEach(img => {
      if (img.name && img.image_url) {
        imageMap[img.name.toLowerCase()] = img.image_url;
      }
    });
    
    // Group fights by event
    const eventMap = {};
    upcomingFights.forEach(fight => {
      const eventKey = fight.event_title || 'Unknown Event';
      
      if (!eventMap[eventKey]) {
        eventMap[eventKey] = {
          eventName: fight.event_title,
          eventDate: fight.event_date,
          location: fight.event_location,
          eventLink: fight.event_link,
          fights: []
        };
      }
      
      // Add fighter images to fight data
      const redFighterName = fight.red_fighter?.name || '';
      const blueFighterName = fight.blue_fighter?.name || '';
      
      eventMap[eventKey].fights.push({
        fighter1: redFighterName,
        fighter2: blueFighterName,
        fighter1Image: imageMap[redFighterName.toLowerCase()] || null,
        fighter2Image: imageMap[blueFighterName.toLowerCase()] || null,
        redProfileLink: fight.red_fighter?.profile_link,
        blueProfileLink: fight.blue_fighter?.profile_link
      });
    });
    
    // Convert map to array and sort by date
    const events = Object.values(eventMap).sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      return dateA - dateB; // Earliest first
    });
    
    console.log(`📊 Grouped into ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching upcoming events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upcoming events', 
      message: error.message 
    });
  }
});

module.exports = router;

