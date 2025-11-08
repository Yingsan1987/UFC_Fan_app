const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testAfterDeployment() {
  try {
    console.log('🔍 Testing after deployment...\n');
    
    // Test 1: Check collections
    console.log('1. Checking collections...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collection status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Test 2: Test fighters endpoint
    console.log('\n2. Testing fighters endpoint...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      const fighters = fightersResponse.data.fighters;
      
      if (fighters && fighters.length > 0) {
        console.log(`✅ SUCCESS! Found ${fighters.length} fighters`);
        console.log('✅ Sample fighter:', fighters[0].name);
        console.log('✅ Data source:', fighters[0].source);
      } else {
        console.log('❌ Still no fighters found');
        console.log('   - Fighters count:', fighters?.length || 0);
        console.log('   - Has error:', !!fightersResponse.data.error);
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
testAfterDeployment();






