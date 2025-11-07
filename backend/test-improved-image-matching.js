const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testImprovedImageMatching() {
  try {
    console.log('🖼️ Testing improved image matching...\n');
    
    // Test 1: Get fighters with improved matching
    console.log('1. Fetching fighters with improved image matching...');
    try {
      const response = await axios.get(`${API_URL}/fighters?limit=100`);
      const fighters = response.data.fighters || [];
      
      console.log(`✅ Total fighters: ${fighters.length}`);
      
      const fightersWithImages = fighters.filter(f => f.imageUrl);
      const fightersWithoutImages = fighters.filter(f => !f.imageUrl);
      
      console.log(`🖼️ Fighters with images: ${fightersWithImages.length}`);
      console.log(`❌ Fighters without images: ${fightersWithoutImages.length}`);
      
      if (fightersWithImages.length > 0) {
        console.log('\n✅ Sample fighters with images:');
        fightersWithImages.slice(0, 5).forEach((fighter, index) => {
          console.log(`   ${index + 1}. ${fighter.name}`);
          console.log(`      Image: ${fighter.imageUrl}`);
        });
      }
      
      // Look specifically for Danny Abbadi
      const dannyAbbadi = fighters.find(f => f.name && f.name.toLowerCase().includes('danny abbadi'));
      if (dannyAbbadi) {
        console.log('\n🔍 Danny Abbadi status:');
        console.log(`   Name: ${dannyAbbadi.name}`);
        console.log(`   Has Image: ${!!dannyAbbadi.imageUrl}`);
        if (dannyAbbadi.imageUrl) {
          console.log(`   Image URL: ${dannyAbbadi.imageUrl}`);
        }
      }
      
    } catch (err) {
      console.log('❌ Error fetching fighters:', err.message);
    }
    
    // Test 2: Test debug endpoint for images
    console.log('\n2. Testing debug endpoint...');
    try {
      const debugResponse = await axios.get(`${API_URL}/fighters/debug/images`);
      console.log('✅ Images debug info:', JSON.stringify(debugResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Debug endpoint failed:', err.message);
    }
    
    console.log('\n✅ Improved image matching test completed!');
    console.log('\n📋 Expected Results:');
    console.log('- More fighters should have images with improved matching');
    console.log('- Danny Abbadi should have an image if available');
    console.log('- Multiple matching strategies should work');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImprovedImageMatching();





