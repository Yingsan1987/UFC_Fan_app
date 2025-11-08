const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testPopulateEndpoint() {
  try {
    console.log('🔍 Testing populate collections endpoint...\n');
    
    // First, check the current status
    console.log('1. Checking current collection status...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Current status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Try to populate the collections
    console.log('\n2. Attempting to populate collections...');
    try {
      const populateResponse = await axios.post(`${API_URL}/fighters/populate-collections`);
      console.log('✅ Populate response:', JSON.stringify(populateResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Populate failed:', err.message);
      if (err.response?.data) {
        console.log('   Error details:', err.response.data);
      }
    }
    
    // Check status again
    console.log('\n3. Checking status after population...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Status after population:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Test the fighters endpoint
    console.log('\n4. Testing fighters endpoint...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      const fighters = Array.isArray(fightersResponse.data) ? fightersResponse.data : fightersResponse.data.fighters;
      console.log(`✅ Found ${fighters.length} fighters`);
      if (fighters.length > 0) {
        console.log(`   Sample fighter: ${fighters[0].name}`);
      }
    } catch (err) {
      console.log('❌ Fighters endpoint failed:', err.message);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPopulateEndpoint();






