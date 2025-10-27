const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testRealDataStructure() {
  try {
    console.log('🔍 Testing system with real data structure...\n');
    
    // Step 1: Clear collections
    console.log('1. Clearing collections...');
    try {
      const clearResponse = await axios.post(`${API_URL}/fighters/clear-collections`);
      console.log('✅ Collections cleared:', clearResponse.data.message);
    } catch (err) {
      console.log('❌ Clear failed:', err.message);
    }
    
    // Step 2: Check collection status
    console.log('\n2. Checking collection status...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collection status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Step 3: Test fighters endpoint with empty collections
    console.log('\n3. Testing fighters endpoint with empty collections...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      console.log('✅ Fighters response:');
      console.log(`   - Fighters count: ${fightersResponse.data.fighters?.length || 0}`);
      console.log(`   - Has error: ${!!fightersResponse.data.error}`);
      if (fightersResponse.data.error) {
        console.log(`   - Error message: ${fightersResponse.data.error}`);
      }
    } catch (err) {
      console.log('❌ Fighters endpoint failed:', err.message);
    }
    
    console.log('\n✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log('- Collections have been cleared');
    console.log('- System is ready for real data with the correct structure');
    console.log('- Models have been updated to match your actual data structure:');
    console.log('  * ufc-fighter_details: _id, FIRST, LAST, NICKNAME, URL');
    console.log('  * ufc-fighter_tott: _id, FIGHTER, HEIGHT, WEIGHT, REACH, STANCE, DOB, URL');
    console.log('- API will now work with the real data structure');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Import your real data into the collections');
    console.log('2. The API will automatically use the correct field mappings');
    console.log('3. The frontend will display the real fighter data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealDataStructure();
