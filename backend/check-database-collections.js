/**
 * Script to check what collections exist in your MongoDB database
 * This will help us identify why the API can't find your data
 */

const mongoose = require('mongoose');

// You'll need to replace this with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function checkDatabaseCollections() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    console.log(`📊 Connection string: ${MONGO_URI}`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database name: ${mongoose.connection.name}`);
    
    // List all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`\n📋 Found ${collections.length} collections in database "${mongoose.connection.name}":`);
    
    // Get detailed info about each collection
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`\n📁 Collection: "${collection.name}"`);
        console.log(`   - Document count: ${count}`);
        console.log(`   - Type: ${collection.type || 'collection'}`);
        
        // If it's one of our target collections, show a sample document
        if (collection.name === 'ufc-fighter_details' || collection.name === 'ufc-fighter_tott') {
          if (count > 0) {
            const sample = await db.collection(collection.name).findOne();
            console.log(`   - Sample document structure:`);
            console.log(`     ${JSON.stringify(sample, null, 6)}`);
          }
        }
      } catch (err) {
        console.log(`   - Error: ${err.message}`);
      }
    }
    
    // Check specifically for our target collections
    console.log('\n🎯 Checking for target collections:');
    const targetCollections = ['ufc-fighter_details', 'ufc-fighter_tott', 'ufc_fighter_details', 'ufc_fighter_tott'];
    
    for (const targetName of targetCollections) {
      try {
        const exists = await db.listCollections({ name: targetName }).hasNext();
        if (exists) {
          const count = await db.collection(targetName).countDocuments();
          console.log(`✅ Found "${targetName}" with ${count} documents`);
        } else {
          console.log(`❌ Collection "${targetName}" not found`);
        }
      } catch (err) {
        console.log(`❌ Error checking "${targetName}": ${err.message}`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('- If you see your collections listed above, the data exists');
    console.log('- If the API still can\'t find them, there might be a connection issue');
    console.log('- Check if the collection names match exactly (case-sensitive)');
    console.log('- Verify the database name in your connection string');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from MongoDB');
  }
}

// Run the check
checkDatabaseCollections();



