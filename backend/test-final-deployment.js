const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testFinalDeployment() {
  try {
    console.log('🎯 Testing final deployment with correct collection names...\n');
    
    // Test 1: Check collections with correct names
    console.log('1. Checking collections (ufc_fighter_details and ufc_fighter_tott)...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collection status:', JSON.stringify(statusResponse.data, null, 2));
      
      const collections = statusResponse.data.collections;
      const detailsCount = collections.ufc_fighter_details?.count || 0;
      const tottCount = collections.ufc_fighter_tott?.count || 0;
      
      if (detailsCount > 0 || tottCount > 0) {
        console.log(`🎉 SUCCESS! Found data in collections:`);
        console.log(`   - ufc_fighter_details: ${detailsCount} documents`);
        console.log(`   - ufc_fighter_tott: ${tottCount} documents`);
      } else {
        console.log('❌ Collections still empty - check database connection');
      }
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Test 2: Test fighters endpoint
    console.log('\n2. Testing fighters endpoint...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      const fighters = fightersResponse.data.fighters;
      
      if (fighters && fighters.length > 0) {
        console.log(`🎉 SUCCESS! Found ${fighters.length} fighters`);
        console.log('✅ Sample fighter data:');
        console.log(`   - Name: ${fighters[0].name}`);
        console.log(`   - Source: ${fighters[0].source}`);
        console.log(`   - Height: ${fighters[0].height || 'N/A'}`);
        console.log(`   - Weight: ${fighters[0].weight || 'N/A'}`);
        console.log(`   - URL: ${fighters[0].url || 'N/A'}`);
        
        console.log('\n🎯 The fighters page should now show your real data!');
      } else {
        console.log('❌ Still no fighters found');
        console.log('   - Fighters count:', fighters?.length || 0);
        if (fightersResponse.data.error) {
          console.log(`   - Error: ${fightersResponse.data.error}`);
        }
      }
    } catch (err) {
      console.log('❌ Fighters endpoint failed:', err.message);
    }
    
    // Test 3: Test combined data debug
    console.log('\n3. Testing combined data debug...');
    try {
      const combinedResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      const data = combinedResponse.data;
      
      if (data.fighterDetailsCount > 0 || data.fighterTottCount > 0) {
        console.log('✅ Combined data debug:');
        console.log(`   - ufc_fighter_details: ${data.fighterDetailsCount} documents`);
        console.log(`   - ufc_fighter_tott: ${data.fighterTottCount} documents`);
        console.log(`   - Combined: ${data.combinedCount} fighters`);
      } else {
        console.log('❌ No data found in combined debug');
      }
    } catch (err) {
      console.log('❌ Combined debug failed:', err.message);
    }
    
    console.log('\n✅ Final deployment test completed!');
    
    console.log('\n📋 Summary:');
    console.log('- If you see fighters with real data above, the system is working!');
    console.log('- If collections show 0 documents, check your database connection');
    console.log('- If you see errors, the deployment might not be complete yet');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFinalDeployment();






