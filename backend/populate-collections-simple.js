/**
 * Simple script to populate ufc-fighter_details and ufc-fighter_tott collections
 * 
 * This script copies data from the existing 'fighters' collection to the new collections
 * that the API expects to use.
 * 
 * Run this script after connecting to your MongoDB database.
 */

const mongoose = require('mongoose');

// Define the schemas (same as in the models)
const fighterDetailsSchema = new mongoose.Schema({
  name: String,
  nickname: String,
  division: String,
  weight_class: String,
  height: String,
  weight: String,
  reach: String,
  age: Number,
  wins: Number,
  losses: Number,
  draws: Number,
  record: String,
  status: String,
  ranking: Number,
  champion: Boolean,
  nationality: String,
  country: String,
  hometown: String,
  fighting_style: String,
  camp: String,
  image_url: String,
  profile_url: String,
  striking_accuracy: Number,
  grappling: String,
  knockouts: Number,
  submissions: Number,
  last_fight: {
    opponent: String,
    result: String,
    method: String,
    date: Date
  },
  next_fight: {
    opponent: String,
    event: String,
    date: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fighterTottSchema = new mongoose.Schema({
  name: String,
  nickname: String,
  division: String,
  weight_class: String,
  height: String,
  weight: String,
  reach: String,
  age: Number,
  wins: Number,
  losses: Number,
  draws: Number,
  record: String,
  status: String,
  ranking: Number,
  champion: Boolean,
  nationality: String,
  country: String,
  hometown: String,
  fighting_style: String,
  camp: String,
  image_url: String,
  profile_url: String,
  striking_accuracy: Number,
  grappling: String,
  knockouts: Number,
  submissions: Number,
  last_fight: {
    opponent: String,
    result: String,
    method: String,
    date: Date
  },
  next_fight: {
    opponent: String,
    event: String,
    date: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fighterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: String,
  division: { type: String, required: true },
  height: String,
  weight: String,
  reach: String,
  age: Number,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  record: String,
  status: { type: String, default: 'active' },
  ranking: Number,
  champion: { type: Boolean, default: false },
  nationality: String,
  hometown: String,
  fightingStyle: String,
  camp: String,
  imageUrl: String,
  profileUrl: String,
  strikingAccuracy: Number,
  grappling: String,
  knockouts: Number,
  submissions: Number,
  lastFight: {
    opponent: String,
    result: String,
    method: String,
    date: Date
  },
  nextFight: {
    opponent: String,
    event: String,
    date: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

async function populateCollections() {
  try {
    // Connect to MongoDB
    // Replace this with your actual MongoDB connection string
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Create models
    const Fighter = mongoose.model('Fighter', fighterSchema);
    const FighterDetails = mongoose.model('FighterDetails', fighterDetailsSchema, 'ufc-fighter_details');
    const FighterTott = mongoose.model('FighterTott', fighterTottSchema, 'ufc-fighter_tott');
    
    // Get existing fighters
    console.log('📊 Fetching existing fighters...');
    const existingFighters = await Fighter.find();
    console.log(`✅ Found ${existingFighters.length} fighters`);
    
    if (existingFighters.length === 0) {
      console.log('❌ No fighters found in the original collection');
      return;
    }
    
    // Clear existing data in target collections
    console.log('🧹 Clearing existing data in target collections...');
    await FighterDetails.deleteMany({});
    await FighterTott.deleteMany({});
    
    // Prepare data for both collections
    console.log('🔄 Preparing data...');
    const fighterData = existingFighters.map(fighter => ({
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
    
    // Insert into both collections
    console.log('💾 Inserting data into ufc-fighter_details...');
    await FighterDetails.insertMany(fighterData);
    
    console.log('💾 Inserting data into ufc-fighter_tott...');
    await FighterTott.insertMany(fighterData);
    
    // Verify
    const detailsCount = await FighterDetails.countDocuments();
    const tottCount = await FighterTott.countDocuments();
    
    console.log('\n✅ Collections populated successfully!');
    console.log(`📊 ufc-fighter_details: ${detailsCount} fighters`);
    console.log(`📊 ufc-fighter_tott: ${tottCount} fighters`);
    console.log('\n🎯 The API will now use data from these collections!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  populateCollections();
}

module.exports = populateCollections;


