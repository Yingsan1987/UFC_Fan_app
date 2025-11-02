const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testPaginationUI() {
  try {
    console.log('🔍 Testing pagination UI functionality...\n');
    
    // Test 1: Get all fighters
    console.log('1. Fetching all fighters...');
    try {
      const response = await axios.get(`${API_URL}/fighters`);
      const fighters = response.data.fighters || [];
      
      console.log(`✅ Total fighters available: ${fighters.length}`);
      
      if (fighters.length > 0) {
        console.log('✅ Sample fighters:');
        fighters.slice(0, 3).forEach((fighter, index) => {
          console.log(`   ${index + 1}. ${fighter.name} (${fighter.height || 'N/A'}, ${fighter.weight || 'N/A'})`);
        });
        
        if (fighters.length > 11) {
          console.log(`\n📊 Pagination test: ${fighters.length} fighters available`);
          console.log(`   - Initial display: 11 fighters`);
          console.log(`   - Remaining: ${fighters.length - 11} fighters`);
          console.log(`   - Show More button should appear`);
        } else {
          console.log(`\n📊 Pagination test: ${fighters.length} fighters available`);
          console.log(`   - All fighters will be displayed initially`);
          console.log(`   - No Show More button needed`);
        }
      } else {
        console.log('❌ No fighters found');
      }
    } catch (err) {
      console.log('❌ Error fetching fighters:', err.message);
    }
    
    // Test 2: Test with pagination parameters
    console.log('\n2. Testing with pagination parameters...');
    try {
      const page1Response = await axios.get(`${API_URL}/fighters?page=1&limit=11`);
      const page1Fighters = page1Response.data.fighters || [];
      
      console.log(`✅ Page 1 (limit 11): ${page1Fighters.length} fighters`);
      
      if (page1Response.data.pagination) {
        console.log('✅ Pagination info:', page1Response.data.pagination);
      }
    } catch (err) {
      console.log('❌ Error testing pagination:', err.message);
    }
    
    console.log('\n✅ Pagination UI test completed!');
    console.log('\n📋 Expected UI Behavior:');
    console.log('- Initial load: Shows first 11 fighters');
    console.log('- Show More button: Appears if more than 11 fighters available');
    console.log('- Button text: Shows remaining count (e.g., "Show More Fighters (3 remaining)")');
    console.log('- Loading state: Shows spinner when loading more');
    console.log('- Footer stats: Updates to show current vs total count');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaginationUI();



