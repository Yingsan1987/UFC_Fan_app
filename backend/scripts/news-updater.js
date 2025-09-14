const axios = require('axios');
const fs = require('fs');
const path = require('path');

// This script can be run as a cron job to automatically update news
// Example cron job: 0 6 * * * node /path/to/news-updater.js

const NEWS_API_URL = 'http://localhost:5000/api/news/refresh';

async function updateNews() {
  try {
    console.log('🔄 Starting automated news update...');
    
    const response = await axios.post(NEWS_API_URL);
    
    if (response.data.success) {
      console.log('✅ News updated successfully');
      console.log(`📰 ${response.data.totalArticles} articles updated`);
      console.log(`🕐 Last updated: ${response.data.lastUpdated}`);
    } else {
      console.error('❌ News update failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error updating news:', error.message);
  }
}

// Run the update
updateNews();
