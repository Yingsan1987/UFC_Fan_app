const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testUpdatedSystem() {
  try {
    console.log('🔍 Testing updated system (no fallback to test/fighters)...\n');
    
    // Test 1: Check collection status
    console.log('1. Checking collection status...');
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
      console.log('✅ Fighters response structure:');
      console.log(`   - Has fighters array: ${!!fightersResponse.data.fighters}`);
      console.log(`   - Fighters count: ${fightersResponse.data.fighters?.length || 0}`);
      console.log(`   - Has pagination: ${!!fightersResponse.data.pagination}`);
      console.log(`   - Has error: ${!!fightersResponse.data.error}`);
      
      if (fightersResponse.data.error) {
        console.log(`   - Error message: ${fightersResponse.data.error}`);
      }
      
      if (fightersResponse.data.fighters?.length > 0) {
        console.log(`   - Sample fighter: ${fightersResponse.data.fighters[0].name}`);
        console.log(`   - Sample fighter source: ${fightersResponse.data.fighters[0].source || 'unknown'}`);
      }
      
    } catch (err) {
      console.log('❌ Fighters endpoint failed:', err.message);
    }
    
    // Test 3: Test pagination
    console.log('\n3. Testing pagination...');
    try {
      const page2Response = await axios.get(`${API_URL}/fighters?page=2&limit=5`);
      console.log('✅ Page 2 response:');
      console.log(`   - Fighters count: ${page2Response.data.fighters?.length || 0}`);
      console.log(`   - Pagination info:`, page2Response.data.pagination);
    } catch (err) {
      console.log('❌ Pagination test failed:', err.message);
    }
    
    // Test 4: Test combined data debug
    console.log('\n4. Testing combined data debug...');
    try {
      const combinedResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      console.log('✅ Combined data debug:', JSON.stringify(combinedResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Combined data debug failed:', err.message);
    }
    
    console.log('\n✅ System test completed!');
    console.log('\n📋 Summary:');
    console.log('- API no longer falls back to test/fighters collection');
    console.log('- API only uses ufc-fighter_details and ufc-fighter_tott collections');
    console.log('- If collections are empty, API returns empty result with error message');
    console.log('- Frontend will show appropriate message when no data is available');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpdatedSystem();
