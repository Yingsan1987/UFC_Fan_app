const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testFrontendFixes() {
  try {
    console.log('🎨 Testing frontend fixes...\n');
    
    // Test 1: Get large dataset to test pagination
    console.log('1. Testing large dataset fetch...');
    try {
      const response = await axios.get(`${API_URL}/fighters?limit=5000`);
      const data = response.data;
      
      console.log(`✅ Total fighters available: ${data.pagination.totalFighters}`);
      console.log(`✅ Fighters returned: ${data.fighters.length}`);
      console.log(`✅ Total pages: ${data.pagination.totalPages}`);
      
      // Test pagination
      console.log('\n2. Testing pagination...');
      const page2Response = await axios.get(`${API_URL}/fighters?page=2&limit=10`);
      const page2Data = page2Response.data;
      
      console.log(`✅ Page 2 fighters: ${page2Data.fighters.length}`);
      console.log(`✅ Page 2 current page: ${page2Data.pagination.currentPage}`);
      console.log(`✅ Page 2 has next: ${page2Data.pagination.hasNextPage}`);
      
      // Test different page sizes
      console.log('\n3. Testing different page sizes...');
      const largePageResponse = await axios.get(`${API_URL}/fighters?limit=50`);
      const largePageData = largePageResponse.data;
      
      console.log(`✅ Large page fighters: ${largePageData.fighters.length}`);
      console.log(`✅ Large page total: ${largePageData.pagination.totalFighters}`);
      
    } catch (err) {
      console.log('❌ Error testing API:', err.message);
    }
    
    console.log('\n✅ Frontend fixes test completed!');
    console.log('\n📋 Expected Results:');
    console.log('- Frontend should now load all 4,453+ fighters');
    console.log('- Show More button should be visible');
    console.log('- Total fighters counter should show correct numbers');
    console.log('- Pagination should work with large dataset');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFrontendFixes();




