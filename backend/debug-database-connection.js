const axios = require('axios');

const API_URL = 'https://ufc-fan-app-backend.onrender.com/api';

async function debugDatabaseConnection() {
  try {
    console.log('🔍 Debugging database connection and collections...\n');
    
    // Test 1: Check if we can connect to the database at all
    console.log('1. Testing basic database connection...');
    try {
      const testResponse = await axios.get(`${API_URL}/fighters/debug/combined`);
      console.log('✅ Database connection working');
      console.log('✅ Combined debug response:', JSON.stringify(testResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Database connection failed:', err.message);
    }
    
    // Test 2: Check collection status
    console.log('\n2. Checking collection status...');
    try {
      const statusResponse = await axios.get(`${API_URL}/fighters/debug/collections`);
      console.log('✅ Collection status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Collection status check failed:', err.message);
    }
    
    // Test 3: Try to get any data from fighters endpoint
    console.log('\n3. Testing fighters endpoint...');
    try {
      const fightersResponse = await axios.get(`${API_URL}/fighters`);
      console.log('✅ Fighters endpoint response:');
      console.log(`   - Fighters count: ${fightersResponse.data.fighters?.length || 0}`);
      console.log(`   - Has pagination: ${!!fightersResponse.data.pagination}`);
      console.log(`   - Has error: ${!!fightersResponse.data.error}`);
      if (fightersResponse.data.error) {
        console.log(`   - Error message: ${fightersResponse.data.error}`);
      }
    } catch (err) {
      console.log('❌ Fighters endpoint failed:', err.message);
    }
    
    console.log('\n📋 Analysis:');
    console.log('If the collections show count: 0 but you say the data exists, possible issues:');
    console.log('1. Database connection string might be pointing to wrong database');
    console.log('2. Collection names might be different (case sensitivity)');
    console.log('3. Models might not be connecting to the right collections');
    console.log('4. Data might be in a different database than expected');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Check your MongoDB connection string in Render environment variables');
    console.log('2. Verify the database name in the connection string');
    console.log('3. Check if collection names match exactly (case-sensitive)');
    console.log('4. Verify the data is in the same database the app is connecting to');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugDatabaseConnection();






