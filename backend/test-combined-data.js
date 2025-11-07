const mongoose = require('mongoose');
const FighterDetails = require('./models/FighterDetails');
const FighterTott = require('./models/FighterTott');

// Connect to MongoDB
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI;
    if (mongoURI && !mongoURI.includes('/test')) {
      mongoURI = mongoURI.endsWith('/') ? `${mongoURI}test` : `${mongoURI}/test`;
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    throw err;
  }
};

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

async function testCombinedData() {
  try {
    await connectDB();
    
    console.log('\n🔍 Testing combined fighter data...');
    
    // Get data from both collections
    const [fighterDetails, fighterTott] = await Promise.all([
      FighterDetails.find().limit(5),
      FighterTott.find().limit(5)
    ]);
    
    console.log(`📊 Found ${fighterDetails.length} fighters from ufc-fighter_details`);
    console.log(`📊 Found ${fighterTott.length} fighters from ufc-fighter_tott`);
    
    // Combine and merge the data
    const combinedFighters = combineFighterData(fighterDetails, fighterTott);
    
    console.log(`📊 Combined into ${combinedFighters.length} unique fighters`);
    
    if (combinedFighters.length > 0) {
      console.log('\n📋 Sample combined fighter:');
      console.log(JSON.stringify(combinedFighters[0], null, 2));
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run the test
testCombinedData();





