const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testPagination() {
  try {
    console.log('🔍 Testing pagination endpoints...\n');
    
    // Test 1: Check collections status
    console.log('1. Checking collections status...');
    try {
      const collectionsResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collections status:', JSON.stringify(collectionsResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Collections check failed:', err.message);
    }
    
    // Test 2: Test pagination with page 1
    console.log('\n2. Testing pagination - Page 1...');
    try {
      const page1Response = await axios.get(`${API_URL}/fighters?page=1&limit=10`);
      console.log('✅ Page 1 response structure:');
      console.log('   - Full response:', JSON.stringify(page1Response.data, null, 2));
      console.log(`   - Fighters count: ${page1Response.data.fighters?.length || 0}`);
      console.log(`   - Pagination info:`, page1Response.data.pagination);
      
      if (page1Response.data.fighters?.length > 0) {
        console.log('   - Sample fighter:', page1Response.data.fighters[0].name);
      }
    } catch (err) {
      console.log('❌ Page 1 test failed:', err.message);
      if (err.response?.data) {
        console.log('   Error details:', err.response.data);
      }
    }
    
    // Test 3: Test pagination with page 2
    console.log('\n3. Testing pagination - Page 2...');
    try {
      const page2Response = await axios.get(`${API_URL}/fighters?page=2&limit=10`);
      console.log('✅ Page 2 response structure:');
      console.log(`   - Fighters count: ${page2Response.data.fighters?.length || 0}`);
      console.log(`   - Pagination info:`, page2Response.data.pagination);
    } catch (err) {
      console.log('❌ Page 2 test failed:', err.message);
    }
    
    // Test 4: Test combined data debug
    console.log('\n4. Testing combined data debug...');
    try {
      const combinedResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      console.log('✅ Combined data debug:', JSON.stringify(combinedResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Combined data debug failed:', err.message);
    }
    
    console.log('\n✅ Pagination testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPagination();
