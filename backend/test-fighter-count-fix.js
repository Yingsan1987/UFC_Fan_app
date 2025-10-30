const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testFighterCountFix() {
  try {
    console.log('🔧 Testing fighter count fix...\n');
    
    // Test 1: Get first page
    console.log('1. Testing first page (limit=10)...');
    try {
      const response = await axios.get(`${API_URL}/fighters?page=1&limit=10`);
      const data = response.data;
      
      console.log(`✅ Fighters returned: ${data.fighters.length}`);
      console.log(`✅ Total fighters: ${data.pagination.totalFighters}`);
      console.log(`✅ Total pages: ${data.pagination.totalPages}`);
      console.log(`✅ Current page: ${data.pagination.currentPage}`);
      console.log(`✅ Has next page: ${data.pagination.hasNextPage}`);
      
      if (data.fighters.length > 0) {
        console.log('\n✅ Sample fighters:');
        data.fighters.slice(0, 3).forEach((fighter, index) => {
          console.log(`   ${index + 1}. ${fighter.name} (${fighter.source})`);
        });
      }
      
    } catch (err) {
      console.log('❌ Error fetching first page:', err.message);
    }
    
    // Test 2: Get second page
    console.log('\n2. Testing second page (limit=10)...');
    try {
      const response = await axios.get(`${API_URL}/fighters?page=2&limit=10`);
      const data = response.data;
      
      console.log(`✅ Fighters returned: ${data.fighters.length}`);
      console.log(`✅ Total fighters: ${data.pagination.totalFighters}`);
      console.log(`✅ Current page: ${data.pagination.currentPage}`);
      
      if (data.fighters.length > 0) {
        console.log('\n✅ Sample fighters from page 2:');
        data.fighters.slice(0, 3).forEach((fighter, index) => {
          console.log(`   ${index + 1}. ${fighter.name} (${fighter.source})`);
        });
      }
      
    } catch (err) {
      console.log('❌ Error fetching second page:', err.message);
    }
    
    // Test 3: Get larger page
    console.log('\n3. Testing larger page (limit=50)...');
    try {
      const response = await axios.get(`${API_URL}/fighters?page=1&limit=50`);
      const data = response.data;
      
      console.log(`✅ Fighters returned: ${data.fighters.length}`);
      console.log(`✅ Total fighters: ${data.pagination.totalFighters}`);
      
    } catch (err) {
      console.log('❌ Error fetching larger page:', err.message);
    }
    
    console.log('\n✅ Fighter count fix test completed!');
    console.log('\n📋 Expected Results:');
    console.log('- Should return thousands of fighters, not just 14');
    console.log('- Pagination should work correctly');
    console.log('- Total count should reflect all unique fighters');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFighterCountFix();
