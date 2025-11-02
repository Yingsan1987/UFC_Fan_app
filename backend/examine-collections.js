const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function examineCollections() {
  try {
    console.log('🔍 Examining actual data structure in collections...\n');
    
    // Get a sample from each collection
    console.log('1. Getting sample data from ufc-fighter_details...');
    try {
      const detailsResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      const sampleDetails = detailsResponse.data.sampleFighterDetails;
      
      if (sampleDetails) {
        console.log('✅ Sample from ufc-fighter_details:');
        console.log(JSON.stringify(sampleDetails, null, 2));
      } else {
        console.log('❌ No sample data from ufc-fighter_details');
      }
    } catch (err) {
      console.log('❌ Error getting ufc-fighter_details sample:', err.message);
    }
    
    console.log('\n2. Getting sample data from ufc-fighter_tott...');
    try {
      const tottResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      const sampleTott = tottResponse.data.sampleFighterTott;
      
      if (sampleTott) {
        console.log('✅ Sample from ufc-fighter_tott:');
        console.log(JSON.stringify(sampleTott, null, 2));
      } else {
        console.log('❌ No sample data from ufc-fighter_tott');
      }
    } catch (err) {
      console.log('❌ Error getting ufc-fighter_tott sample:', err.message);
    }
    
    console.log('\n3. Getting sample combined data...');
    try {
      const combinedResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      const sampleCombined = combinedResponse.data.sampleCombined;
      
      if (sampleCombined) {
        console.log('✅ Sample combined data:');
        console.log(JSON.stringify(sampleCombined, null, 2));
      } else {
        console.log('❌ No sample combined data');
      }
    } catch (err) {
      console.log('❌ Error getting combined sample:', err.message);
    }
    
    console.log('\n4. Testing current fighters endpoint...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      const fighters = fightersResponse.data.fighters;
      
      if (fighters && fighters.length > 0) {
        console.log(`✅ Found ${fighters.length} fighters`);
        console.log('✅ Sample fighter structure:');
        console.log(JSON.stringify(fighters[0], null, 2));
      } else {
        console.log('❌ No fighters found');
      }
    } catch (err) {
      console.log('❌ Error getting fighters:', err.message);
    }
    
    console.log('\n✅ Examination completed!');
    
  } catch (error) {
    console.error('❌ Examination failed:', error.message);
  }
}

// Run the examination
examineCollections();



