const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Fighter = require('../models/Fighter');
const FighterDetails = require('../models/FighterDetails');
const FighterTott = require('../models/FighterTott');
const FighterImages = require('../models/FighterImages');
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

// Function to match fighter names and get images
async function getFighterImages(fighters) {
  try {
    // Get all fighter images
    const fighterImages = await FighterImages.find();
    
    // Create a map for quick lookup
    const imageMap = new Map();
    fighterImages.forEach(img => {
      if (img.name) {
        // Normalize the name for matching
        const normalizedName = img.name.toLowerCase().trim();
        imageMap.set(normalizedName, img.image_url || img.image_path);
      }
    });
    
    // Match fighters with images
    return fighters.map(fighter => {
      const fighterName = fighter.name;
      if (!fighterName) return fighter;
      
      // Try different name matching strategies
      let imageUrl = null;
      
      // Strategy 1: Direct match
      const directMatch = imageMap.get(fighterName.toLowerCase().trim());
      if (directMatch) {
        imageUrl = directMatch;
      } else {
        // Strategy 2: Try matching with different name formats
        const nameParts = fighterName.split(' ');
        if (nameParts.length >= 2) {
          // Try "Last First" format
          const lastFirst = `${nameParts[nameParts.length - 1]} ${nameParts[0]}`.toLowerCase().trim();
          const lastFirstMatch = imageMap.get(lastFirst);
          if (lastFirstMatch) {
            imageUrl = lastFirstMatch;
          } else {
            // Try partial matches
            for (const [imgName, imgUrl] of imageMap.entries()) {
              if (imgName.includes(nameParts[0].toLowerCase()) && imgName.includes(nameParts[nameParts.length - 1].toLowerCase())) {
                imageUrl = imgUrl;
                break;
              }
            }
          }
        }
      }
      
      return {
        ...fighter,
        imageUrl: imageUrl
      };
    });
  } catch (error) {
    console.error('Error getting fighter images:', error.message);
    return fighters; // Return fighters without images if there's an error
  }
}

// Function to combine fighter data from both collections with actual data structure
function combineFighterData(fighterDetails, fighterTott) {
  const fighterMap = new Map();
  
  // Process fighter details first (with actual field names)
  fighterDetails.forEach(fighter => {
    const name = fighter.FIRST && fighter.LAST ? `${fighter.FIRST} ${fighter.LAST}` : fighter.FIRST || fighter.LAST || 'Unknown';
    const key = name.toLowerCase();
    
    if (key && key !== 'unknown') {
      fighterMap.set(key, {
        _id: fighter._id,
        name: name,
        nickname: fighter.NICKNAME || null,
        division: fighter.DIVISION || null,
        height: fighter.HEIGHT || null,
        weight: fighter.WEIGHT || null,
        reach: fighter.REACH || null,
        age: fighter.AGE || null,
        wins: fighter.WINS || 0,
        losses: fighter.LOSSES || 0,
        draws: fighter.DRAWS || 0,
        record: fighter.RECORD || null,
        status: fighter.STATUS || 'active',
        ranking: fighter.RANKING || null,
        champion: fighter.CHAMPION || false,
        nationality: fighter.NATIONALITY || null,
        hometown: fighter.HOMETOWN || null,
        fightingStyle: fighter.FIGHTING_STYLE || null,
        camp: fighter.CAMP || null,
        imageUrl: fighter.IMAGE_URL || null,
        profileUrl: fighter.URL || null,
        strikingAccuracy: fighter.STRIKING_ACCURACY || null,
        grappling: fighter.GRAPPLING || null,
        knockouts: fighter.KNOCKOUTS || 0,
        submissions: fighter.SUBMISSIONS || 0,
        lastFight: fighter.LAST_FIGHT || null,
        nextFight: fighter.NEXT_FIGHT || null,
        url: fighter.URL || null,
        createdAt: fighter.createdAt,
        updatedAt: fighter.updatedAt,
        source: 'fighter_details'
      });
    }
  });
  
  // Process fighter tott data and merge with existing data
  fighterTott.forEach(fighter => {
    const name = fighter.FIGHTER || 'Unknown';
    const key = name.toLowerCase();
    
    if (key && key !== 'unknown') {
      if (fighterMap.has(key)) {
        // Merge with existing data, preferring tott data for certain fields
        const existing = fighterMap.get(key);
        fighterMap.set(key, {
          ...existing,
          // Update with tott data where available
          height: fighter.HEIGHT || existing.height,
          weight: fighter.WEIGHT || existing.weight,
          reach: fighter.REACH || existing.reach,
          age: fighter.AGE || existing.age,
          wins: fighter.WINS ?? existing.wins,
          losses: fighter.LOSSES ?? existing.losses,
          draws: fighter.DRAWS ?? existing.draws,
          record: fighter.RECORD || existing.record,
          status: fighter.STATUS || existing.status,
          ranking: fighter.RANKING ?? existing.ranking,
          champion: fighter.CHAMPION !== undefined ? fighter.CHAMPION : existing.champion,
          nationality: fighter.NATIONALITY || existing.nationality,
          hometown: fighter.HOMETOWN || existing.hometown,
          fightingStyle: fighter.FIGHTING_STYLE || existing.fightingStyle,
          camp: fighter.CAMP || existing.camp,
          imageUrl: fighter.IMAGE_URL || existing.imageUrl,
          profileUrl: fighter.URL || existing.profileUrl,
          strikingAccuracy: fighter.STRIKING_ACCURACY || existing.strikingAccuracy,
          grappling: fighter.GRAPPLING || existing.grappling,
          knockouts: fighter.KNOCKOUTS ?? existing.knockouts,
          submissions: fighter.SUBMISSIONS ?? existing.submissions,
          lastFight: fighter.LAST_FIGHT || existing.lastFight,
          nextFight: fighter.NEXT_FIGHT || existing.nextFight,
          url: fighter.URL || existing.url,
          stance: fighter.STANCE || null,
          dob: fighter.DOB || null,
          source: 'combined'
        });
      } else {
        // Add new fighter from tott collection
        fighterMap.set(key, {
          _id: fighter._id,
          name: name,
          nickname: null,
          division: fighter.DIVISION || null,
          height: fighter.HEIGHT || null,
          weight: fighter.WEIGHT || null,
          reach: fighter.REACH || null,
          age: fighter.AGE || null,
          wins: fighter.WINS || 0,
          losses: fighter.LOSSES || 0,
          draws: fighter.DRAWS || 0,
          record: fighter.RECORD || null,
          status: fighter.STATUS || 'active',
          ranking: fighter.RANKING || null,
          champion: fighter.CHAMPION || false,
          nationality: fighter.NATIONALITY || null,
          hometown: fighter.HOMETOWN || null,
          fightingStyle: fighter.FIGHTING_STYLE || null,
          camp: fighter.CAMP || null,
          imageUrl: fighter.IMAGE_URL || null,
          profileUrl: fighter.URL || null,
          strikingAccuracy: fighter.STRIKING_ACCURACY || null,
          grappling: fighter.GRAPPLING || null,
          knockouts: fighter.KNOCKOUTS || 0,
          submissions: fighter.SUBMISSIONS || 0,
          lastFight: fighter.LAST_FIGHT || null,
          nextFight: fighter.NEXT_FIGHT || null,
          url: fighter.URL || null,
          stance: fighter.STANCE || null,
          dob: fighter.DOB || null,
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

// ✅ Get fighters from MongoDB - ONLY uses combined data from ufc-fighter_details and ufc-fighter_tott
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log(`📊 Fetching fighters from ufc-fighter_details and ufc-fighter_tott - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);
    
    // Get data from both collections with pagination
    const [fighterDetails, fighterTott] = await Promise.all([
      FighterDetails.find().skip(skip).limit(limit),
      FighterTott.find().skip(skip).limit(limit)
    ]);
    
    console.log(`📊 Found ${fighterDetails.length} fighters from ufc-fighter_details`);
    console.log(`📊 Found ${fighterTott.length} fighters from ufc-fighter_tott`);
    
    // Combine and merge the data
    const combinedFighters = combineFighterData(fighterDetails, fighterTott);
    
    // Get fighter images
    const fightersWithImages = await getFighterImages(combinedFighters);
    
    // Get total count for pagination info
    const [totalDetails, totalTott] = await Promise.all([
      FighterDetails.countDocuments(),
      FighterTott.countDocuments()
    ]);
    
    const totalFighters = Math.max(totalDetails, totalTott);
    const totalPages = Math.ceil(totalFighters / limit);
    
    console.log(`📊 Combined into ${combinedFighters.length} unique fighters`);
    console.log(`📊 Total fighters: ${totalFighters}, Total pages: ${totalPages}`);
    console.log(`🖼️ Added images to ${fightersWithImages.filter(f => f.imageUrl).length} fighters`);
    
    // Return the combined data with images - NO FALLBACK to original collection
    res.json({
      fighters: fightersWithImages,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalFighters: totalFighters,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limit
      }
    });
    
  } catch (err) {
    console.error('Database error:', err.message);
    
    // Return empty result if collections don't exist or have errors
    res.json({
      fighters: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalFighters: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      },
      error: 'No data available from ufc-fighter_details and ufc-fighter_tott collections'
    });
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

// Endpoint to clear the collections
router.post('/clear-collections', async (req, res) => {
  try {
    console.log('🧹 Clearing collections...');
    
    // Clear existing data in the target collections
    await FighterDetails.deleteMany({});
    await FighterTott.deleteMany({});
    
    console.log('✅ Collections cleared successfully');
    
    res.json({
      success: true,
      message: 'Collections cleared successfully',
      data: {
        ufcFighterDetails: 0,
        ufcFighterTott: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error clearing collections:', error.message);
    res.status(500).json({ 
      error: 'Failed to clear collections', 
      message: error.message 
    });
  }
});

// Endpoint to populate the correct collections with existing fighter data
router.post('/populate-collections', async (req, res) => {
  try {
    console.log('🔄 Starting collection population...');
    
    // Get existing fighters from the original collection
    const existingFighters = await Fighter.find();
    console.log(`📊 Found ${existingFighters.length} fighters in original collection`);
    
    if (existingFighters.length === 0) {
      return res.status(400).json({ 
        error: 'No fighters found in original collection',
        message: 'Please add some fighters to the original collection first'
      });
    }
    
    // Clear existing data in the target collections
    await FighterDetails.deleteMany({});
    await FighterTott.deleteMany({});
    console.log('🧹 Cleared existing data in target collections');
    
    // Prepare data for ufc-fighter_details
    const fighterDetailsData = existingFighters.map(fighter => ({
      name: fighter.name,
      nickname: fighter.nickname,
      division: fighter.division,
      weight_class: fighter.division,
      height: fighter.height,
      weight: fighter.weight,
      reach: fighter.reach,
      age: fighter.age,
      wins: fighter.wins,
      losses: fighter.losses,
      draws: fighter.draws,
      record: fighter.record,
      status: fighter.status,
      ranking: fighter.ranking,
      champion: fighter.champion,
      nationality: fighter.nationality,
      country: fighter.nationality,
      hometown: fighter.hometown,
      fighting_style: fighter.fightingStyle,
      camp: fighter.camp,
      image_url: fighter.imageUrl,
      profile_url: fighter.profileUrl,
      striking_accuracy: fighter.strikingAccuracy,
      grappling: fighter.grappling,
      knockouts: fighter.knockouts,
      submissions: fighter.submissions,
      last_fight: fighter.lastFight,
      next_fight: fighter.nextFight
    }));
    
    // Prepare data for ufc-fighter_tott (same structure, could be enhanced later)
    const fighterTottData = existingFighters.map(fighter => ({
      name: fighter.name,
      nickname: fighter.nickname,
      division: fighter.division,
      weight_class: fighter.division,
      height: fighter.height,
      weight: fighter.weight,
      reach: fighter.reach,
      age: fighter.age,
      wins: fighter.wins,
      losses: fighter.losses,
      draws: fighter.draws,
      record: fighter.record,
      status: fighter.status,
      ranking: fighter.ranking,
      champion: fighter.champion,
      nationality: fighter.nationality,
      country: fighter.nationality,
      hometown: fighter.hometown,
      fighting_style: fighter.fightingStyle,
      camp: fighter.camp,
      image_url: fighter.imageUrl,
      profile_url: fighter.profileUrl,
      striking_accuracy: fighter.strikingAccuracy,
      grappling: fighter.grappling,
      knockouts: fighter.knockouts,
      submissions: fighter.submissions,
      last_fight: fighter.lastFight,
      next_fight: fighter.nextFight
    }));
    
    // Insert data into both collections
    const insertedDetails = await FighterDetails.insertMany(fighterDetailsData);
    const insertedTott = await FighterTott.insertMany(fighterTottData);
    
    console.log(`✅ Inserted ${insertedDetails.length} fighters into ufc-fighter_details`);
    console.log(`✅ Inserted ${insertedTott.length} fighters into ufc-fighter_tott`);
    
    // Verify the data
    const finalDetailsCount = await FighterDetails.countDocuments();
    const finalTottCount = await FighterTott.countDocuments();
    
    res.json({
      success: true,
      message: 'Collections populated successfully',
      data: {
        originalFighters: existingFighters.length,
        ufcFighterDetails: finalDetailsCount,
        ufcFighterTott: finalTottCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error populating collections:', error.message);
    res.status(500).json({ 
      error: 'Failed to populate collections', 
      message: error.message 
    });
  }
});

// Endpoint to create sample fighters for testing
router.post('/create-sample', async (req, res) => {
  try {
    const sampleFighters = [
      {
        name: "Jon Jones",
        nickname: "Bones",
        division: "Light Heavyweight",
        height: "6'4\"",
        weight: "205 lbs",
        wins: 27,
        losses: 1,
        draws: 0,
        record: "27-1-0",
        status: "active",
        champion: true,
        nationality: "American",
        fightingStyle: "Wrestling, Boxing",
        knockouts: 10,
        submissions: 6
      },
      {
        name: "Amanda Nunes",
        nickname: "Lioness",
        division: "Women's Bantamweight",
        height: "5'8\"",
        weight: "135 lbs",
        wins: 22,
        losses: 5,
        draws: 0,
        record: "22-5-0",
        status: "retired",
        champion: false,
        nationality: "Brazilian",
        fightingStyle: "Boxing, BJJ",
        knockouts: 13,
        submissions: 4
      },
      {
        name: "Khabib Nurmagomedov",
        nickname: "The Eagle",
        division: "Lightweight",
        height: "5'10\"",
        weight: "155 lbs",
        wins: 29,
        losses: 0,
        draws: 0,
        record: "29-0-0",
        status: "retired",
        champion: false,
        nationality: "Russian",
        fightingStyle: "Sambo, Wrestling",
        knockouts: 8,
        submissions: 11
      },
      {
        name: "Conor McGregor",
        nickname: "The Notorious",
        division: "Lightweight",
        height: "5'9\"",
        weight: "155 lbs",
        wins: 22,
        losses: 6,
        draws: 0,
        record: "22-6-0",
        status: "active",
        champion: false,
        nationality: "Irish",
        fightingStyle: "Boxing, Karate",
        knockouts: 19,
        submissions: 1
      },
      {
        name: "Daniel Cormier",
        nickname: "DC",
        division: "Heavyweight",
        height: "5'11\"",
        weight: "240 lbs",
        wins: 22,
        losses: 3,
        draws: 0,
        record: "22-3-0",
        status: "retired",
        champion: false,
        nationality: "American",
        fightingStyle: "Wrestling, Boxing",
        knockouts: 6,
        submissions: 5
      },
      {
        name: "Ronda Rousey",
        nickname: "Rowdy",
        division: "Women's Bantamweight",
        height: "5'7\"",
        weight: "135 lbs",
        wins: 12,
        losses: 2,
        draws: 0,
        record: "12-2-0",
        status: "retired",
        champion: false,
        nationality: "American",
        fightingStyle: "Judo, Boxing",
        knockouts: 3,
        submissions: 9
      },
      {
        name: "Anderson Silva",
        nickname: "The Spider",
        division: "Middleweight",
        height: "6'2\"",
        weight: "185 lbs",
        wins: 34,
        losses: 11,
        draws: 0,
        record: "34-11-0",
        status: "retired",
        champion: false,
        nationality: "Brazilian",
        fightingStyle: "Muay Thai, BJJ",
        knockouts: 23,
        submissions: 3
      },
      {
        name: "Georges St-Pierre",
        nickname: "GSP",
        division: "Welterweight",
        height: "5'10\"",
        weight: "170 lbs",
        wins: 26,
        losses: 2,
        draws: 0,
        record: "26-2-0",
        status: "retired",
        champion: false,
        nationality: "Canadian",
        fightingStyle: "Wrestling, Boxing",
        knockouts: 8,
        submissions: 6
      },
      {
        name: "Fedor Emelianenko",
        nickname: "The Last Emperor",
        division: "Heavyweight",
        height: "6'0\"",
        weight: "235 lbs",
        wins: 40,
        losses: 6,
        draws: 1,
        record: "40-6-1",
        status: "retired",
        champion: false,
        nationality: "Russian",
        fightingStyle: "Sambo, Boxing",
        knockouts: 16,
        submissions: 15
      },
      {
        name: "Cris Cyborg",
        nickname: "Cyborg",
        division: "Women's Featherweight",
        height: "5'8\"",
        weight: "145 lbs",
        wins: 26,
        losses: 2,
        draws: 0,
        record: "26-2-0",
        status: "active",
        champion: false,
        nationality: "Brazilian",
        fightingStyle: "Muay Thai, BJJ",
        knockouts: 20,
        submissions: 1
      },
      {
        name: "Jose Aldo",
        nickname: "Junior",
        division: "Featherweight",
        height: "5'7\"",
        weight: "145 lbs",
        wins: 31,
        losses: 8,
        draws: 0,
        record: "31-8-0",
        status: "active",
        champion: false,
        nationality: "Brazilian",
        fightingStyle: "Muay Thai, BJJ",
        knockouts: 17,
        submissions: 1
      },
      {
        name: "Dominick Cruz",
        nickname: "The Dominator",
        division: "Bantamweight",
        height: "5'8\"",
        weight: "135 lbs",
        wins: 24,
        losses: 4,
        draws: 0,
        record: "24-4-0",
        status: "retired",
        champion: false,
        nationality: "American",
        fightingStyle: "Boxing, Wrestling",
        knockouts: 7,
        submissions: 1
      }
    ];

    // Clear existing fighters first
    await Fighter.deleteMany({});
    
    // Insert sample fighters
    const createdFighters = await Fighter.insertMany(sampleFighters);
    
    res.json({
      message: `Created ${createdFighters.length} sample fighters`,
      fighters: createdFighters
    });
  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({ error: 'Failed to create sample fighters', message: error.message });
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

// Endpoint to check if collections exist and have data
router.get('/debug/collections', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking ufc-fighter_details and ufc-fighter_tott collections...');
    
    const [fighterDetailsCount, fighterTottCount] = await Promise.all([
      FighterDetails.countDocuments().catch(() => 0),
      FighterTott.countDocuments().catch(() => 0)
    ]);
    
    res.json({
      message: 'Collection status check for ufc_fighter_details and ufc_fighter_tott',
      collections: {
        'ufc_fighter_details': {
          exists: fighterDetailsCount > 0,
          count: fighterDetailsCount
        },
        'ufc_fighter_tott': {
          exists: fighterTottCount > 0,
          count: fighterTottCount
        }
      },
      recommendation: fighterDetailsCount > 0 || fighterTottCount > 0 
        ? 'Collections have data - API will use combined data' 
        : 'Collections are empty - populate them with fighter data'
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Debug failed'
    });
  }
});

// Endpoint to debug fighter images
router.get('/debug/images', async (req, res) => {
  try {
    console.log('🖼️ Debug: Checking fighter images...');
    
    // Get sample fighters
    const fighters = await FighterDetails.find().limit(3);
    const fighterTott = await FighterTott.find().limit(3);
    const combinedFighters = combineFighterData(fighters, fighterTott);
    
    // Get sample images
    const images = await FighterImages.find().limit(5);
    
    // Test name matching
    const testMatching = await getFighterImages(combinedFighters.slice(0, 3));
    
    res.json({
      message: 'Fighter images debug information',
      fighters: {
        sample: combinedFighters.slice(0, 3).map(f => ({
          name: f.name,
          source: f.source
        })),
        total: combinedFighters.length
      },
      images: {
        sample: images.map(img => ({
          name: img.name,
          image_url: img.image_url || img.image_path
        })),
        total: images.length
      },
      matching: {
        test: testMatching.slice(0, 3).map(f => ({
          name: f.name,
          hasImage: !!f.imageUrl,
          imageUrl: f.imageUrl
        }))
      }
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Debug failed'
    });
  }
});

// Endpoint to list all collections in the database
router.get('/debug/list-collections', async (req, res) => {
  try {
    console.log('🔍 Debug: Listing all collections in the database...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections in database`);
    
    // Get counts for each collection
    const collectionInfo = await Promise.all(
      collections.map(async (collection) => {
        try {
          const count = await db.collection(collection.name).countDocuments();
          return {
            name: collection.name,
            count: count,
            type: collection.type || 'collection'
          };
        } catch (err) {
          return {
            name: collection.name,
            count: 'error',
            error: err.message
          };
        }
      })
    );
    
    res.json({
      message: 'All collections in the database',
      database: mongoose.connection.name,
      totalCollections: collections.length,
      collections: collectionInfo
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to list collections'
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