const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function clearCollections() {
  try {
    console.log('🧹 Clearing incorrect data from collections...\n');
    
    // Clear the collections by calling the populate endpoint with empty data
    // We'll need to create a new endpoint for this, but first let's check what we have
    
    console.log('1. Checking current collection status...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Current status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    console.log('\n2. The collections currently contain sample data from the original fighters collection.');
    console.log('   This is NOT the real data structure you described.');
    console.log('   The real data should have fields like:');
    console.log('   - ufc-fighter_details: _id, FIRST, LAST, NICKNAME, URL');
    console.log('   - ufc-fighter_tott: _id, FIGHTER, HEIGHT, WEIGHT, REACH, STANCE, DOB, URL');
    
    console.log('\n3. Next steps needed:');
    console.log('   a) Clear the current incorrect data');
    console.log('   b) Update the models to match your actual data structure');
    console.log('   c) Update the API to work with the real data');
    console.log('   d) Import the real data from your actual collections');
    
    console.log('\n✅ Analysis completed!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
clearCollections();
