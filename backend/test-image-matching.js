const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testImageMatching() {
  try {
    console.log('🖼️ Testing fighter image matching...\n');
    
    // Test 1: Get fighters with images
    console.log('1. Fetching fighters with images...');
    try {
      const response = await axios.get(`${API_URL}/fighters`);
      const fighters = response.data.fighters || [];
      
      console.log(`✅ Total fighters: ${fighters.length}`);
      
      const fightersWithImages = fighters.filter(f => f.imageUrl);
      const fightersWithoutImages = fighters.filter(f => !f.imageUrl);
      
      console.log(`🖼️ Fighters with images: ${fightersWithImages.length}`);
      console.log(`❌ Fighters without images: ${fightersWithoutImages.length}`);
      
      if (fightersWithImages.length > 0) {
        console.log('\n✅ Sample fighters with images:');
        fightersWithImages.slice(0, 3).forEach((fighter, index) => {
          console.log(`   ${index + 1}. ${fighter.name}`);
          console.log(`      Image: ${fighter.imageUrl}`);
        });
      }
      
      if (fightersWithoutImages.length > 0) {
        console.log('\n❌ Fighters without images:');
        fightersWithoutImages.slice(0, 3).forEach((fighter, index) => {
          console.log(`   ${index + 1}. ${fighter.name}`);
        });
      }
      
    } catch (err) {
      console.log('❌ Error fetching fighters:', err.message);
    }
    
    // Test 2: Test debug endpoint for images
    console.log('\n2. Testing debug endpoint...');
    try {
      const debugResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collections status:', JSON.stringify(debugResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Debug endpoint failed:', err.message);
    }
    
    console.log('\n✅ Image matching test completed!');
    console.log('\n📋 Expected Results:');
    console.log('- Fighters should have imageUrl field if image is found');
    console.log('- Name matching should work between different formats');
    console.log('- UI should display fighter images in cards');
    console.log('- Fallback to emoji if no image found');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImageMatching();



