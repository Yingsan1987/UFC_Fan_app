const express = require('express');
const axios = require('axios');
const Fighter = require('../models/Fighter');
const router = express.Router();

// UFC API configuration
const UFC_API_CONFIG = {
  baseURL: 'https://ufc-fighters.p.rapidapi.com',
  headers: {
    'x-rapidapi-host': 'ufc-fighters.p.rapidapi.com',
    'x-rapidapi-key': '4f3fa274b6msh58fdd5586335f23p1c8128jsn31a539add001'
  }
};

// Function to fetch champions from UFC API
async function fetchChampionsFromAPI() {
  try {
    const response = await axios.get('/fighters/champions', UFC_API_CONFIG);
    return response.data;
  } catch (error) {
    console.error('Error fetching champions from UFC API:', error.message);
    throw error;
  }
}

// Function to map UFC API data to Fighter model
function mapAPIDataToFighter(apiFighter) {
  return {
    name: apiFighter.name || 'Unknown',
    nickname: apiFighter.nickname || null,
    division: apiFighter.weight_class || 'Unknown',
    height: apiFighter.height || null,
    weight: apiFighter.weight || null,
    reach: apiFighter.reach || null,
    age: apiFighter.age || null,
    wins: apiFighter.wins || 0,
    losses: apiFighter.losses || 0,
    draws: apiFighter.draws || 0,
    record: apiFighter.record || null,
    status: 'active',
    ranking: null,
    champion: true, // All fighters from champions endpoint are champions
    nationality: apiFighter.country || null,
    hometown: apiFighter.hometown || null,
    fightingStyle: apiFighter.fighting_style || null,
    camp: apiFighter.camp || null,
    imageUrl: apiFighter.image_url || null,
    profileUrl: apiFighter.profile_url || null,
    strikingAccuracy: null,
    grappling: null,
    knockouts: apiFighter.knockouts || 0,
    submissions: apiFighter.submissions || 0,
    lastFight: {
      opponent: apiFighter.last_fight?.opponent || null,
      result: apiFighter.last_fight?.result || null,
      method: apiFighter.last_fight?.method || null,
      date: apiFighter.last_fight?.date ? new Date(apiFighter.last_fight.date) : null
    },
    nextFight: {
      opponent: apiFighter.next_fight?.opponent || null,
      event: apiFighter.next_fight?.event || null,
      date: apiFighter.next_fight?.date ? new Date(apiFighter.next_fight.date) : null
    }
  };
}

router.get('/', async (req, res) => {
  const fighters = await Fighter.find();
  res.json(fighters);
});

router.post('/', async (req, res) => {
  const fighter = new Fighter(req.body);
  await fighter.save();
  res.status(201).json(fighter);
});

// Endpoint to sync champions from UFC API
router.post('/sync-champions', async (req, res) => {
  try {
    console.log('Starting champions sync from UFC API...');
    
    // Fetch champions from UFC API
    const championsData = await fetchChampionsFromAPI();
    
    if (!championsData || !Array.isArray(championsData)) {
      return res.status(400).json({ 
        error: 'Invalid data received from UFC API',
        data: championsData 
      });
    }

    let syncedCount = 0;
    let updatedCount = 0;
    let errors = [];

    // Process each champion
    for (const apiFighter of championsData) {
      try {
        const fighterData = mapAPIDataToFighter(apiFighter);
        
        // Check if fighter already exists (by name and division)
        const existingFighter = await Fighter.findOne({ 
          name: fighterData.name, 
          division: fighterData.division 
        });

        if (existingFighter) {
          // Update existing fighter
          Object.assign(existingFighter, fighterData);
          await existingFighter.save();
          updatedCount++;
          console.log(`Updated fighter: ${fighterData.name}`);
        } else {
          // Create new fighter
          const newFighter = new Fighter(fighterData);
          await newFighter.save();
          syncedCount++;
          console.log(`Added new fighter: ${fighterData.name}`);
        }
      } catch (fighterError) {
        console.error(`Error processing fighter ${apiFighter.name}:`, fighterError.message);
        errors.push({
          fighter: apiFighter.name || 'Unknown',
          error: fighterError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Champions sync completed',
      stats: {
        totalProcessed: championsData.length,
        newFighters: syncedCount,
        updatedFighters: updatedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error syncing champions:', error.message);
    res.status(500).json({
      error: 'Failed to sync champions from UFC API',
      message: error.message
    });
  }
});

// Endpoint to get a specific fighter by ID
router.get('/:id', async (req, res) => {
  try {
    const fighter = await Fighter.findById(req.params.id);
    if (!fighter) {
      return res.status(404).json({ error: 'Fighter not found' });
    }
    res.json(fighter);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching fighter', message: error.message });
  }
});

// Endpoint to update a specific fighter
router.put('/:id', async (req, res) => {
  try {
    const fighter = await Fighter.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!fighter) {
      return res.status(404).json({ error: 'Fighter not found' });
    }
    res.json(fighter);
  } catch (error) {
    res.status(500).json({ error: 'Error updating fighter', message: error.message });
  }
});

// Endpoint to delete a specific fighter
router.delete('/:id', async (req, res) => {
  try {
    const fighter = await Fighter.findByIdAndDelete(req.params.id);
    if (!fighter) {
      return res.status(404).json({ error: 'Fighter not found' });
    }
    res.json({ message: 'Fighter deleted successfully', fighter });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting fighter', message: error.message });
  }
});

module.exports = router;
