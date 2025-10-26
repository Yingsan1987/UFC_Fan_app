const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function testPopulate() {
  try {
    console.log('🔍 Testing collection population...\n');
    
    // First, let's check the current status
    console.log('1. Checking current collection status...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Current status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Status check failed:', err.message);
    }
    
    // Try to create sample data in the correct collections
    console.log('\n2. Attempting to populate collections...');
    try {
      // First, let's get the existing fighters
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      const fighters = Array.isArray(fightersResponse.data) ? fightersResponse.data : fightersResponse.data.fighters;
      
      console.log(`📊 Found ${fighters.length} existing fighters`);
      
      if (fighters.length > 0) {
        // Create a sample fighter for testing
        const sampleFighter = {
          name: "Test Fighter",
          nickname: "The Test",
          division: "Lightweight",
          weight_class: "Lightweight",
          height: "5'10\"",
          weight: "155 lbs",
          reach: "70\"",
          age: 30,
          wins: 10,
          losses: 2,
          draws: 0,
          record: "10-2-0",
          status: "active",
          ranking: 5,
          champion: false,
          nationality: "American",
          country: "American",
          hometown: "Test City",
          fighting_style: "Mixed Martial Arts",
          camp: "Test Gym",
          image_url: null,
          profile_url: null,
          striking_accuracy: 60,
          grappling: "Good ground game",
          knockouts: 5,
          submissions: 3,
          last_fight: {
            opponent: "Test Opponent",
            result: "Win",
            method: "Decision",
            date: new Date()
          },
          next_fight: null
        };
        
        console.log('📝 Sample fighter data prepared');
        console.log('Note: This is just a test. The actual data should come from your ufc-fighter_details and ufc-fighter_tott collections.');
        
        // Show the sample data structure
        console.log('\n📋 Sample fighter structure:');
        console.log(JSON.stringify(sampleFighter, null, 2));
        
      } else {
        console.log('❌ No existing fighters found to use as template');
      }
      
    } catch (err) {
      console.log('❌ Population test failed:', err.message);
    }
    
    console.log('\n✅ Test completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Ensure your MongoDB database has the ufc-fighter_details and ufc-fighter_tott collections');
    console.log('2. Populate these collections with your actual fighter data');
    console.log('3. The API will automatically use these collections instead of the fallback');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPopulate();
