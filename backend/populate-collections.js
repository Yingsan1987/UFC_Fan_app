const mongoose = require('mongoose');
const FighterDetails = require('./models/FighterDetails');
const FighterTott = require('./models/FighterTott');
const Fighter = require('./models/Fighter');

// Connect to MongoDB
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI;
    if (mongoURI && !mongoURI.includes('/test')) {
      mongoURI = mongoURI.endsWith('/') ? `${mongoURI}test` : `${mongoURI}/test`;
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    throw err;
  }
};

async function populateCollections() {
  try {
    await connectDB();
    
    console.log('\n🔍 Checking existing data...');
    
    // Check existing fighters
    const existingFighters = await Fighter.find();
    console.log(`📊 Found ${existingFighters.length} fighters in original collection`);
    
    if (existingFighters.length === 0) {
      console.log('❌ No fighters found in original collection. Please add some fighters first.');
      return;
    }
    
    // Check if collections already exist
    const detailsCount = await FighterDetails.countDocuments();
    const tottCount = await FighterTott.countDocuments();
    
    console.log(`📊 ufc-fighter_details count: ${detailsCount}`);
    console.log(`📊 ufc-fighter_tott count: ${tottCount}`);
    
    if (detailsCount > 0 || tottCount > 0) {
      console.log('⚠️  Collections already have data. Clearing them first...');
      await FighterDetails.deleteMany({});
      await FighterTott.deleteMany({});
    }
    
    console.log('\n🔄 Populating ufc-fighter_details collection...');
    
    // Populate ufc-fighter_details with existing fighters
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
    
    await FighterDetails.insertMany(fighterDetailsData);
    console.log(`✅ Inserted ${fighterDetailsData.length} fighters into ufc-fighter_details`);
    
    console.log('\n🔄 Populating ufc-fighter_tott collection...');
    
    // Populate ufc-fighter_tott with enhanced data (same fighters but with some variations)
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
    
    await FighterTott.insertMany(fighterTottData);
    console.log(`✅ Inserted ${fighterTottData.length} fighters into ufc-fighter_tott`);
    
    // Verify the data
    const finalDetailsCount = await FighterDetails.countDocuments();
    const finalTottCount = await FighterTott.countDocuments();
    
    console.log('\n📊 Final counts:');
    console.log(`   ufc-fighter_details: ${finalDetailsCount}`);
    console.log(`   ufc-fighter_tott: ${finalTottCount}`);
    
    console.log('\n✅ Collections populated successfully!');
    console.log('🎯 The API should now use data from these collections instead of the original fighters collection.');
    
  } catch (error) {
    console.error('❌ Error populating collections:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run the population
populateCollections();




