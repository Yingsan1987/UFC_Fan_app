/**
 * Sync News Script for Render Cron Job
 * 
 * This script connects to MongoDB and runs syncUfcNews once, then exits.
 * 
 * Usage:
 *   node scripts/syncNews.js
 * 
 * Environment variables required:
 *   - MONGO_URI: MongoDB connection string
 *   - NEWSAPI_KEY: NewsAPI.org API key
 *   - NEWS_QUERY (optional): Custom query string
 *   - NEWS_LOOKBACK_DAYS (optional): Days to look back (default: 7)
 * 
 * To set up as Render Cron Job:
 *   1. Go to Render Dashboard > Cron Jobs
 *   2. Create new Cron Job
 *   3. Command: node scripts/syncNews.js
 *   4. Schedule: e.g., "0 */6 * * *" (every 6 hours)
 *   5. Set environment variables
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { syncUfcNews } = require('../routes/news');

async function main() {
  try {
    console.log('🚀 Starting news sync script...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Run sync
    const result = await syncUfcNews({ force: false });
    
    console.log('📊 Sync Results:');
    console.log(`   - Inserted: ${result.insertedCount}`);
    console.log(`   - Updated: ${result.updatedCount}`);
    console.log(`   - Total Fetched: ${result.totalFetched}`);
    
    if (result.skipped) {
      console.log(`   - Status: ${result.message}`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    console.log('✨ Script completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
