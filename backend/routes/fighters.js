const express = require('express');
const axios = require('axios');
const Fighter = require('../models/Fighter');
const FighterDetails = require('../models/FighterDetails');
const FighterTott = require('../models/FighterTott');
const router = express.Router();

// Rate limiting for API calls (3 calls per day)
const API_CALL_LIMIT = 3;
const API_CALLS_FILE = './api-calls.json';
const fs = require('fs');
const path = require('path');

// Function to check and update API call count
function checkAPICallLimit() {
  const filePath = path.join(__dirname, '..', 'api-calls.json');
  
  try {
    let apiCalls = { count: 0, lastReset: new Date().toDateString() };
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      apiCalls = JSON.parse(data);
    }
    
    // Reset count if it's a new day
    const today = new Date().toDateString();
    if (apiCalls.lastReset !== today) {
      apiCalls.count = 0;
      apiCalls.lastReset = today;
    }
    
    // Check if limit exceeded
    if (apiCalls.count >= API_CALL_LIMIT) {
      return { allowed: false, remaining: 0, resetDate: apiCalls.lastReset };
    }
    
    // Increment count
    apiCalls.count++;
    fs.writeFileSync(filePath, JSON.stringify(apiCalls, null, 2));
    
    return { 
      allowed: true, 
      remaining: API_CALL_LIMIT - apiCalls.count,
      resetDate: apiCalls.lastReset 
    };
  } catch (error) {
    console.error('Error managing API call limit:', error);
    return { allowed: false, remaining: 0, error: error.message };
  }
}

// UFC API configuration
const UFC_API_OPTIONS = {
  method: 'GET',
  url: 'https://ufc-fighters.p.rapidapi.com/fighters/champions',
  headers: {
    'x-rapidapi-key': '4f3fa274b6msh58fdd5586335f23p1c8128jsn31a539add001',
    'x-rapidapi-host': 'ufc-fighters.p.rapidapi.com'
  }
};

// Function to fetch champions from UFC API
async function fetchChampionsFromAPI() {
  try {
    const response = await axios.request(UFC_API_OPTIONS);
    return response.data;
  } catch (error) {
    console.error('Error fetching champions from UFC API:', error.message);
    throw error;
  }
}

// Function to fetch enhanced fighter data
async function fetchFighterData(firstName, lastName) {
  try {
    const options = {
      method: 'GET',
      url: 'https://ufc-fighters.p.rapidapi.com/fighters/data',
      params: {
        first_name: firstName,
        last_name: lastName
      },
      headers: {
        'x-rapidapi-key': '4f3fa274b6msh58fdd5586335f23p1c8128jsn31a539add001',
        'x-rapidapi-host': 'ufc-fighters.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fighter data for ${firstName} ${lastName}:`, error.message);
    return null;
  }
}

// Function to fetch fighter fight history
async function fetchFighterHistory(firstName, lastName) {
  try {
    const options = {
      method: 'GET',
      url: 'https://ufc-fighters.p.rapidapi.com/fighters/fight_history',
      params: {
        first_name: firstName,
        last_name: lastName
      },
      headers: {
        'x-rapidapi-key': '4f3fa274b6msh58fdd5586335f23p1c8128jsn31a539add001',
        'x-rapidapi-host': 'ufc-fighters.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fight history for ${firstName} ${lastName}:`, error.message);
    return null;
  }
}

// Function to combine fighter data from both collections
function combineFighterData(fighterDetails, fighterTott) {
  const fighterMap = new Map();
  
  // Process fighter details first
  fighterDetails.forEach(fighter => {
    const key = fighter.name?.toLowerCase() || '';
    if (key) {
      fighterMap.set(key, {
        _id: fighter._id,
        name: fighter.name,
        nickname: fighter.nickname,
        division: fighter.division || fighter.weight_class,
        height: fighter.height,
        weight: fighter.weight,
        reach: fighter.reach,
        age: fighter.age,
        wins: fighter.wins || 0,
        losses: fighter.losses || 0,
        draws: fighter.draws || 0,
        record: fighter.record,
        status: fighter.status || 'active',
        ranking: fighter.ranking,
        champion: fighter.champion || false,
        nationality: fighter.nationality || fighter.country,
        hometown: fighter.hometown,
        fightingStyle: fighter.fighting_style,
        camp: fighter.camp,
        imageUrl: fighter.image_url,
        profileUrl: fighter.profile_url,
        strikingAccuracy: fighter.striking_accuracy,
        grappling: fighter.grappling,
        knockouts: fighter.knockouts || 0,
        submissions: fighter.submissions || 0,
        lastFight: fighter.last_fight,
        nextFight: fighter.next_fight,
        createdAt: fighter.createdAt,
        updatedAt: fighter.updatedAt,
        source: 'fighter_details'
      });
    }
  });
  
  // Process fighter tott data and merge with existing data
  fighterTott.forEach(fighter => {
    const key = fighter.name?.toLowerCase() || '';
    if (key) {
      if (fighterMap.has(key)) {
        // Merge with existing data, preferring tott data for certain fields
        const existing = fighterMap.get(key);
        fighterMap.set(key, {
          ...existing,
          // Update with tott data where available
          nickname: fighter.nickname || existing.nickname,
          division: fighter.division || fighter.weight_class || existing.division,
          height: fighter.height || existing.height,
          weight: fighter.weight || existing.weight,
          reach: fighter.reach || existing.reach,
          age: fighter.age || existing.age,
          wins: fighter.wins || existing.wins,
          losses: fighter.losses || existing.losses,
          draws: fighter.draws || existing.draws,
          record: fighter.record || existing.record,
          status: fighter.status || existing.status,
          ranking: fighter.ranking || existing.ranking,
          champion: fighter.champion !== undefined ? fighter.champion : existing.champion,
          nationality: fighter.nationality || fighter.country || existing.nationality,
          hometown: fighter.hometown || existing.hometown,
          fightingStyle: fighter.fighting_style || existing.fightingStyle,
          camp: fighter.camp || existing.camp,
          imageUrl: fighter.image_url || existing.imageUrl,
          profileUrl: fighter.profile_url || existing.profileUrl,
          strikingAccuracy: fighter.striking_accuracy || existing.strikingAccuracy,
          grappling: fighter.grappling || existing.grappling,
          knockouts: fighter.knockouts || existing.knockouts,
          submissions: fighter.submissions || existing.submissions,
          lastFight: fighter.last_fight || existing.lastFight,
          nextFight: fighter.next_fight || existing.nextFight,
          source: 'combined'
        });
      } else {
        // Add new fighter from tott collection
        fighterMap.set(key, {
          _id: fighter._id,
          name: fighter.name,
          nickname: fighter.nickname,
          division: fighter.division || fighter.weight_class,
          height: fighter.height,
          weight: fighter.weight,
          reach: fighter.reach,
          age: fighter.age,
          wins: fighter.wins || 0,
          losses: fighter.losses || 0,
          draws: fighter.draws || 0,
          record: fighter.record,
          status: fighter.status || 'active',
          ranking: fighter.ranking,
          champion: fighter.champion || false,
          nationality: fighter.nationality || fighter.country,
          hometown: fighter.hometown,
          fightingStyle: fighter.fighting_style,
          camp: fighter.camp,
          imageUrl: fighter.image_url,
          profileUrl: fighter.profile_url,
          strikingAccuracy: fighter.striking_accuracy,
          grappling: fighter.grappling,
          knockouts: fighter.knockouts || 0,
          submissions: fighter.submissions || 0,
          lastFight: fighter.last_fight,
          nextFight: fighter.next_fight,
          createdAt: fighter.createdAt,
          updatedAt: fighter.updatedAt,
          source: 'fighter_tott'
        });
      }
    }
  });
  
  return Array.from(fighterMap.values());
}

// Function to map UFC API data to Fighter model with enhanced data
async function mapAPIDataToFighter(apiFighter, enhancedData = null, fightHistory = null) {
  // Extract first and last name for enhanced data lookup
  const nameParts = (apiFighter.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Get enhanced data if available
  const fighterData = enhancedData || {};
  const history = fightHistory || {};
  
  return {
    name: apiFighter.name || fighterData.name || 'Unknown',
    nickname: apiFighter.nickname || fighterData.nickname || null,
    division: apiFighter.weight_class || fighterData.weight_class || 'Unknown',
    height: apiFighter.height || fighterData.height || null,
    weight: apiFighter.weight || fighterData.weight || null,
    reach: apiFighter.reach || fighterData.reach || null,
    age: apiFighter.age || fighterData.age || null,
    wins: apiFighter.wins || fighterData.wins || 0,
    losses: apiFighter.losses || fighterData.losses || 0,
    draws: apiFighter.draws || fighterData.draws || 0,
    record: apiFighter.record || fighterData.record || null,
    status: 'active',
    ranking: null,
    champion: true, // All fighters from champions endpoint are champions
    nationality: apiFighter.country || fighterData.country || fighterData.nationality || null,
    hometown: apiFighter.hometown || fighterData.hometown || null,
    fightingStyle: apiFighter.fighting_style || fighterData.fighting_style || null,
    camp: apiFighter.camp || fighterData.camp || null,
    imageUrl: apiFighter.image_url || fighterData.image_url || null,
    profileUrl: apiFighter.profile_url || fighterData.profile_url || null,
    strikingAccuracy: fighterData.striking_accuracy || null,
    grappling: fighterData.grappling || null,
    knockouts: apiFighter.knockouts || fighterData.knockouts || 0,
    submissions: apiFighter.submissions || fighterData.submissions || 0,
    lastFight: {
      opponent: apiFighter.last_fight?.opponent || history.last_fight?.opponent || null,
      result: apiFighter.last_fight?.result || history.last_fight?.result || null,
      method: apiFighter.last_fight?.method || history.last_fight?.method || null,
      date: apiFighter.last_fight?.date ? new Date(apiFighter.last_fight.date) : 
            (history.last_fight?.date ? new Date(history.last_fight.date) : null)
    },
    nextFight: {
      opponent: apiFighter.next_fight?.opponent || null,
      event: apiFighter.next_fight?.event || null,
      date: apiFighter.next_fight?.date ? new Date(apiFighter.next_fight.date) : null
    }
  };
}

// ✅ Get fighters from MongoDB - now combines data from ufc-fighter_details and ufc-fighter_tott
router.get('/', async (req, res) => {
  try {
    // Get data from both collections
    const [fighterDetails, fighterTott] = await Promise.all([
      FighterDetails.find(),
      FighterTott.find()
    ]);
    
    console.log(`📊 Found ${fighterDetails.length} fighters from ufc-fighter_details`);
    console.log(`📊 Found ${fighterTott.length} fighters from ufc-fighter_tott`);
    
    // Combine and merge the data
    const combinedFighters = combineFighterData(fighterDetails, fighterTott);
    
    console.log(`📊 Combined into ${combinedFighters.length} unique fighters`);
    res.json(combinedFighters);
  } catch (err) {
    console.error('Database error:', err.message);
    // Fallback to original Fighter collection if new collections don't exist
    try {
      const fighters = await Fighter.find();
      res.json(fighters);
    } catch (fallbackErr) {
      console.error('Fallback error:', fallbackErr.message);
      res.json([]);
    }
  }
});

router.post('/', async (req, res) => {
  try {
    const fighter = new Fighter(req.body);
    await fighter.save();
    res.status(201).json(fighter);
  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({ error: 'Failed to create fighter', message: error.message });
  }
});

// Debug endpoint to check combined fighter data
router.get('/debug/combined', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking combined fighter data...');
    
    const [fighterDetails, fighterTott] = await Promise.all([
      FighterDetails.find().limit(5),
      FighterTott.find().limit(5)
    ]);
    
    const combinedFighters = combineFighterData(fighterDetails, fighterTott);
    
    res.json({
      message: 'Combined fighter data debug information',
      fighterDetailsCount: fighterDetails.length,
      fighterTottCount: fighterTott.length,
      combinedCount: combinedFighters.length,
      sampleFighterDetails: fighterDetails[0] || null,
      sampleFighterTott: fighterTott[0] || null,
      sampleCombined: combinedFighters[0] || null
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Debug failed'
    });
  }
});

// Endpoint to check API usage status (must be before /:id route)
router.get('/api-status', (req, res) => {
  console.log('✅ API-STATUS ROUTE HIT - This should work!');
  try {
    const filePath = path.join(__dirname, '..', 'api-calls.json');
    let apiCalls = { count: 0, lastReset: new Date().toDateString() };
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      apiCalls = JSON.parse(data);
    }
    
    // Reset count if it's a new day
    const today = new Date().toDateString();
    if (apiCalls.lastReset !== today) {
      apiCalls.count = 0;
      apiCalls.lastReset = today;
    }
    
    res.json({
      limit: API_CALL_LIMIT,
      used: apiCalls.count,
      remaining: API_CALL_LIMIT - apiCalls.count,
      resetDate: apiCalls.lastReset,
      canMakeCall: apiCalls.count < API_CALL_LIMIT
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking API status', message: error.message });
  }
});

// Endpoint to sync champions from UFC API
router.post('/sync-champions', async (req, res) => {
  let limitCheck = null;
  
  try {
    console.log('Starting champions sync from UFC API...');
    
    // Check API call limit first
    limitCheck = checkAPICallLimit();
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: 'API call limit exceeded',
        message: `You have reached the daily limit of ${API_CALL_LIMIT} API calls. Try again tomorrow.`,
        remaining: limitCheck.remaining,
        resetDate: limitCheck.resetDate
      });
    }
    
    console.log(`API call allowed. Remaining calls today: ${limitCheck.remaining}`);
    
    // Fetch champions from UFC API
    const championsData = await fetchChampionsFromAPI();
    
    console.log('\n🏆 === UFC CHAMPIONS API DATA ===');
    console.log('Total champions received:', championsData?.length || 0);
    console.log('Raw API response:', JSON.stringify(championsData, null, 2));
    
    if (championsData && championsData.length > 0) {
      console.log('\n📊 === FIRST CHAMPION DATA STRUCTURE ===');
      console.log('Sample champion:', JSON.stringify(championsData[0], null, 2));
      
      console.log('\n🔍 === AVAILABLE FIELDS ===');
      const sampleFighter = championsData[0];
      Object.keys(sampleFighter).forEach(key => {
        console.log(`- ${key}: ${typeof sampleFighter[key]} = ${JSON.stringify(sampleFighter[key])}`);
      });
    }
    
    if (!championsData || !Array.isArray(championsData)) {
      return res.status(400).json({ 
        error: 'Invalid data received from UFC API',
        data: championsData 
      });
    }

    let syncedCount = 0;
    let updatedCount = 0;
    let errors = [];

    // Check if enhanced data should be fetched (from query parameter)
    const fetchEnhanced = req.query.enhanced === 'true';
    console.log(`Enhanced data fetching: ${fetchEnhanced}`);

    // Process each champion
    for (const apiFighter of championsData) {
      try {
        let enhancedData = null;
        let fightHistory = null;
        
        // Fetch enhanced data if requested and API calls remaining
        if (fetchEnhanced && limitCheck.remaining > 0) {
          const nameParts = (apiFighter.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          if (firstName && lastName) {
            console.log(`\n🔍 === ENHANCED DATA FOR ${firstName} ${lastName} ===`);
            console.log(`Fetching enhanced data for ${firstName} ${lastName}...`);
            
            enhancedData = await fetchFighterData(firstName, lastName);
            console.log('📊 Fighter Data API Response:', JSON.stringify(enhancedData, null, 2));
            
            fightHistory = await fetchFighterHistory(firstName, lastName);
            console.log('🥊 Fight History API Response:', JSON.stringify(fightHistory, null, 2));
            
            if (enhancedData) {
              console.log('\n📋 === ENHANCED DATA FIELDS ===');
              Object.keys(enhancedData).forEach(key => {
                console.log(`- ${key}: ${typeof enhancedData[key]} = ${JSON.stringify(enhancedData[key])}`);
              });
            }
            
            if (fightHistory) {
              console.log('\n🥊 === FIGHT HISTORY FIELDS ===');
              Object.keys(fightHistory).forEach(key => {
                console.log(`- ${key}: ${typeof fightHistory[key]} = ${JSON.stringify(fightHistory[key])}`);
              });
            }
          }
        }
        
        const fighterData = await mapAPIDataToFighter(apiFighter, enhancedData, fightHistory);
        
        console.log(`\n💾 === MAPPED FIGHTER DATA FOR ${fighterData.name} ===`);
        console.log('Final fighter data to be saved:', JSON.stringify(fighterData, null, 2));
        
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

    const response = {
      success: true,
      message: 'Champions sync completed',
      stats: {
        totalProcessed: championsData.length,
        newFighters: syncedCount,
        updatedFighters: updatedCount,
        errors: errors.length
      },
      apiUsage: {
        remaining: limitCheck.remaining,
        limit: API_CALL_LIMIT,
        resetDate: limitCheck.resetDate
      },
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('Error syncing champions:', error.message);
    res.status(500).json({
      error: 'Failed to sync champions from UFC API',
      message: error.message,
      apiUsage: limitCheck ? {
        remaining: limitCheck.remaining,
        limit: API_CALL_LIMIT,
        resetDate: limitCheck.resetDate
      } : null
    });
  }
});

// Endpoint to get a specific fighter by ID
router.get('/:id', async (req, res) => {
  console.log(`❌ ID ROUTE HIT with ID: ${req.params.id} - This should NOT happen for api-status!`);
  try {
    const fighter = await Fighter.findById(req.params.id);
    if (!fighter) {
      return res.status(404).json({ error: 'Fighter not found' });
    }
    res.json(fighter);
  } catch (error) {
    console.error('Database error:', error.message);
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
    console.error('Database error:', error.message);
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
    console.error('Database error:', error.message);
    res.status(500).json({ error: 'Error deleting fighter', message: error.message });
  }
});

module.exports = router;