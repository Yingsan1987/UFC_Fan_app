const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function verifyRealData() {
  try {
    console.log('🔍 Verifying real data import...\n');
    
    // Check collection status
    console.log('1. Checking collection status...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collection status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Test fighters endpoint
    console.log('\n2. Testing fighters endpoint...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      const fighters = fightersResponse.data.fighters;
      
      if (fighters && fighters.length > 0) {
        console.log(`✅ Found ${fighters.length} fighters`);
        console.log('✅ Sample fighter:');
        console.log(JSON.stringify(fighters[0], null, 2));
      } else {
        console.log('❌ No fighters found - collections may still be empty');
      }
    } catch (err) {
      console.log('❌ Fighters endpoint failed:', err.message);
    }
    
    // Test combined data debug
    console.log('\n3. Testing combined data debug...');
    try {
      const combinedResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      console.log('✅ Combined data debug:', JSON.stringify(combinedResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Combined data debug failed:', err.message);
    }
    
    console.log('\n✅ Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyRealData();
