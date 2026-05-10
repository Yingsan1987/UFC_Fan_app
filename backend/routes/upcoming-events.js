const express = require('express');
const router = express.Router();
const UpcomingEvent = require('../models/UpcomingEvent');
const FighterImages = require('../models/FighterImages');
const { createFuzzyFinder } = require('../utils/nameMatcher');
const { requireAuth } = require('../middleware/authMiddleware');

const ADMIN_EMAIL = 'yingsan1987@gmail.com';

// ── POST /api/upcoming-events/admin-add ───────────────────────────────────────
// Admin-only: upsert a full fight card for an event into ufc_upcoming_events
router.post('/admin-add', requireAuth, async (req, res) => {
  try {
    if (req.user?.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const { eventTitle, eventDate, eventLocation, fights } = req.body;

    if (!eventTitle || !Array.isArray(fights) || fights.length === 0) {
      return res.status(400).json({ error: 'eventTitle and at least one fight are required' });
    }

    // Remove existing entries for this event so we can replace cleanly
    await UpcomingEvent.deleteMany({ event_title: eventTitle });

    const docs = fights
      .filter(f => f.redFighter && f.blueFighter)
      .map(f => ({
        event_title:    eventTitle,
        event_date:     eventDate  || '',
        event_location: eventLocation || '',
        weight_class:   f.weightClass || '',
        red_fighter:    { name: f.redFighter.trim()  },
        blue_fighter:   { name: f.blueFighter.trim() },
        status: 'upcoming',
        winner: null,
        result: null,
        method: null,
      }));

    if (docs.length === 0) {
      return res.status(400).json({ error: 'No valid fights (both fighters required)' });
    }

    await UpcomingEvent.insertMany(docs);

    res.json({ message: `${docs.length} fights created for ${eventTitle}`, count: docs.length });
  } catch (err) {
    console.error('Admin add event error:', err);
    res.status(500).json({ error: err.message });
  }
});

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
    
    // Count valid vs invalid images
    const { isValidImageUrl, normalizeName } = require('../utils/nameMatcher');
    const validImages = fighterImages.filter((img) => {
      const imageUrl = img?.image_url || img?.image_path;
      return img?.name && imageUrl && isValidImageUrl(imageUrl);
    });
    const invalidImages = fighterImages.filter((img) => {
      const imageUrl = img?.image_url || img?.image_path;
      return img?.name && imageUrl && !isValidImageUrl(imageUrl);
    });
    console.log(`✅ Valid images: ${validImages.length}, ❌ Invalid/placeholder images: ${invalidImages.length}`);
    
    // Show some example names from fighter images for debugging
    if (validImages.length > 0) {
      console.log(`📋 Sample fighter names in database: ${validImages.slice(0, 5).map(img => img.name).join(', ')}`);
    }
    
    const findImage = createFuzzyFinder(
      validImages.map((img) => ({
        name: img.name,
        value: img.image_url || img.image_path,
      })),
      { threshold: 0.90 } // 90% similarity threshold for fuzzy matching (handles special characters)
    );
    
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
      
      // Try to find images with logging for debugging
      const fighter1Image = findImage(redFighterName);
      const fighter2Image = findImage(blueFighterName);
      
      // Log when image not found for debugging
      if (redFighterName && !fighter1Image) {
        console.log(`⚠️ No image found for fighter: "${redFighterName}"`);
      }
      if (blueFighterName && !fighter2Image) {
        console.log(`⚠️ No image found for fighter: "${blueFighterName}"`);
      }
      if (redFighterName && fighter1Image) {
        console.log(`✅ Image found for "${redFighterName}": ${fighter1Image.substring(0, 50)}...`);
      }
      if (blueFighterName && fighter2Image) {
        console.log(`✅ Image found for "${blueFighterName}": ${fighter2Image.substring(0, 50)}...`);
      }
      
      eventMap[eventKey].fights.push({
        fighter1: redFighterName,
        fighter2: blueFighterName,
        fighter1Image: fighter1Image,
        fighter2Image: fighter2Image,
        redProfileLink: fight.red_fighter?.profile_link,
        blueProfileLink: fight.blue_fighter?.profile_link,
        weightClass: fight.weight_class || null
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

