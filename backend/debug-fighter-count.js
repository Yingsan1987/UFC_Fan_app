const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FighterDetails = require('./models/FighterDetails');
const FighterTott = require('./models/FighterTott');

// Function to combine fighter data (copied from routes/fighters.js)
function combineFighterData(fighterDetails, fighterTott) {
  const fighterMap = new Map();
  
  // Process fighter details first (with actual field names)
  fighterDetails.forEach(fighter => {
    const name = fighter.FIRST && fighter.LAST ? `${fighter.FIRST} ${fighter.LAST}` : fighter.FIRST || fighter.LAST || 'Unknown';
    const key = name.toLowerCase().trim();
    
    if (!fighterMap.has(key)) {
      fighterMap.set(key, {
        _id: fighter._id,
        name: name,
        source: 'ufc_fighter_details',
        // Map actual field names from your data structure
        height: fighter.HEIGHT || null,
        weight: fighter.WEIGHT || null,
        reach: fighter.REACH || null,
        stance: fighter.STANCE || null,
        dob: fighter.DOB || null,
        url: fighter.URL || null,
        nickname: fighter.NICKNAME || null,
        division: fighter.DIVISION || null,
        age: fighter.AGE || null,
        wins: fighter.WINS || null,
        losses: fighter.LOSSES || null,
        draws: fighter.DRAWS || null,
        record: fighter.RECORD || null,
        status: fighter.STATUS || null,
        ranking: fighter.RANKING || null,
        champion: fighter.CHAMPION || false,
        nationality: fighter.NATIONALITY || null,
        hometown: fighter.HOMETOWN || null,
        fightingStyle: fighter.FIGHTING_STYLE || null,
        camp: fighter.CAMP || null,
        imageUrl: fighter.IMAGE_URL || null,
        strikingAccuracy: fighter.STRIKING_ACCURACY || null,
        grappling: fighter.GRAPPLING || null,
        knockouts: fighter.KNOCKOUTS || null,
        submissions: fighter.SUBMISSIONS || null,
        lastFight: fighter.LAST_FIGHT || null,
        nextFight: fighter.NEXT_FIGHT || null
      });
    } else {
      // Merge additional data if already exists
      const existing = fighterMap.get(key);
      Object.keys(fighter.toObject()).forEach(field => {
        if (fighter[field] && !existing[field.toLowerCase()]) {
          existing[field.toLowerCase()] = fighter[field];
        }
      });
    }
  });
  
  // Process fighter tott data (with actual field names)
  fighterTott.forEach(fighter => {
    const name = fighter.FIGHTER || 'Unknown';
    const key = name.toLowerCase().trim();
    
    if (!fighterMap.has(key)) {
      fighterMap.set(key, {
        _id: fighter._id,
        name: name,
        source: 'ufc_fighter_tott',
        // Map actual field names from your data structure
        height: fighter.HEIGHT || null,
        weight: fighter.WEIGHT || null,
        reach: fighter.REACH || null,
        stance: fighter.STANCE || null,
        dob: fighter.DOB || null,
        url: fighter.URL || null,
        division: fighter.DIVISION || null,
        age: fighter.AGE || null,
        wins: fighter.WINS || null,
        losses: fighter.LOSSES || null,
        draws: fighter.DRAWS || null,
        record: fighter.RECORD || null,
        status: fighter.STATUS || null,
        ranking: fighter.RANKING || null,
        champion: fighter.CHAMPION || false,
        nationality: fighter.NATIONALITY || null,
        hometown: fighter.HOMETOWN || null,
        fightingStyle: fighter.FIGHTING_STYLE || null,
        camp: fighter.CAMP || null,
        imageUrl: fighter.IMAGE_URL || null,
        strikingAccuracy: fighter.STRIKING_ACCURACY || null,
        grappling: fighter.GRAPPLING || null,
        knockouts: fighter.KNOCKOUTS || null,
        submissions: fighter.SUBMISSIONS || null,
        lastFight: fighter.LAST_FIGHT || null,
        nextFight: fighter.NEXT_FIGHT || null
      });
    } else {
      // Merge additional data if already exists
      const existing = fighterMap.get(key);
      Object.keys(fighter.toObject()).forEach(field => {
        if (fighter[field] && !existing[field.toLowerCase()]) {
          existing[field.toLowerCase()] = fighter[field];
        }
      });
    }
  });
  
  return Array.from(fighterMap.values());
}

async function debugFighterCount() {
  try {
    console.log('🔍 Debugging fighter count issue...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get counts
    const [totalDetails, totalTott] = await Promise.all([
      FighterDetails.countDocuments(),
      FighterTott.countDocuments()
    ]);
    
    console.log(`📊 Total records in ufc_fighter_details: ${totalDetails}`);
    console.log(`📊 Total records in ufc_fighter_tott: ${totalTott}`);
    
    // Get sample data to understand structure
    console.log('\n🔍 Sample data from ufc_fighter_details:');
    const sampleDetails = await FighterDetails.find().limit(3);
    sampleDetails.forEach((fighter, index) => {
      console.log(`   ${index + 1}. Name: "${fighter.FIRST} ${fighter.LAST}"`);
      console.log(`      FIRST: "${fighter.FIRST}"`);
      console.log(`      LAST: "${fighter.LAST}"`);
      console.log(`      HEIGHT: "${fighter.HEIGHT}"`);
      console.log(`      WEIGHT: "${fighter.WEIGHT}"`);
    });
    
    console.log('\n🔍 Sample data from ufc_fighter_tott:');
    const sampleTott = await FighterTott.find().limit(3);
    sampleTott.forEach((fighter, index) => {
      console.log(`   ${index + 1}. Name: "${fighter.FIGHTER}"`);
      console.log(`      FIGHTER: "${fighter.FIGHTER}"`);
      console.log(`      HEIGHT: "${fighter.HEIGHT}"`);
      console.log(`      WEIGHT: "${fighter.WEIGHT}"`);
    });
    
    // Test combining with small sample
    console.log('\n🔍 Testing data combination with sample:');
    const sampleCombined = combineFighterData(sampleDetails, sampleTott);
    console.log(`   Combined sample: ${sampleCombined.length} fighters`);
    sampleCombined.forEach((fighter, index) => {
      console.log(`   ${index + 1}. "${fighter.name}" (source: ${fighter.source})`);
    });
    
    // Test with larger sample
    console.log('\n🔍 Testing with larger sample (100 records each):');
    const [largerDetails, largerTott] = await Promise.all([
      FighterDetails.find().limit(100),
      FighterTott.find().limit(100)
    ]);
    
    const largerCombined = combineFighterData(largerDetails, largerTott);
    console.log(`   Combined larger sample: ${largerCombined.length} fighters`);
    
    // Check for potential issues
    console.log('\n🔍 Checking for potential issues:');
    
    // Check for null/empty names
    const nullNamesDetails = await FighterDetails.countDocuments({
      $or: [
        { FIRST: { $in: [null, '', undefined] } },
        { LAST: { $in: [null, '', undefined] } }
      ]
    });
    
    const nullNamesTott = await FighterTott.countDocuments({
      FIGHTER: { $in: [null, '', undefined] }
    });
    
    console.log(`   Records with null/empty names in ufc_fighter_details: ${nullNamesDetails}`);
    console.log(`   Records with null/empty names in ufc_fighter_tott: ${nullNamesTott}`);
    
    // Check for duplicate names
    const uniqueNamesDetails = await FighterDetails.distinct('FIRST');
    const uniqueNamesTott = await FighterTott.distinct('FIGHTER');
    
    console.log(`   Unique first names in ufc_fighter_details: ${uniqueNamesDetails.length}`);
    console.log(`   Unique fighter names in ufc_fighter_tott: ${uniqueNamesTott.length}`);
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the debug
debugFighterCount();


