// routes/news.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Config
const NEWSAPI_KEY = process.env.NEWSAPI_KEY; // Must be set in Render env
const NEWSAPI_URL = 'https://newsapi.org/v2/everything?q=UFC&language=en&sortBy=publishedAt';

// Fetch news from NewsAPI
async function fetchNewsAPI() {
  if (!NEWSAPI_KEY) throw new Error('NEWSAPI_KEY is not set in environment variables');

  const response = await axios.get(NEWSAPI_URL, {
    headers: { 'Authorization': NEWSAPI_KEY }
  });

  return response.data.articles.map(article => ({
    title: article.title,
    description: article.description,
    content: article.content,
    url: article.url,
    image: article.urlToImage || null,
    publishedAt: article.publishedAt,
    source: article.source.name,
    category: 'sports',
    readTime: '3 min read'
  }));
}

// Cache functions
function saveNewsCache(newsData) {
  try {
    const cachePath = path.join(__dirname, '..', 'news-cache.json');
    const cacheData = {
      articles: newsData,
      lastUpdated: new Date().toISOString(),
      source: 'live-newsapi'
    };
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    console.log('📰 News cache updated successfully');
  } catch (error) {
    console.error('Error saving news cache:', error);
  }
}

function loadNewsCache() {
  try {
    const cachePath = path.join(__dirname, '..', 'news-cache.json');
    if (fs.existsSync(cachePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log('📰 News loaded from cache');
      return cacheData;
    }
  } catch (error) {
    console.error('Error loading news cache:', error);
  }
  return null;
}

function isCacheStale(cacheData) {
  if (!cacheData || !cacheData.lastUpdated) return true;
  const lastUpdated = new Date(cacheData.lastUpdated);
  const now = new Date();
  const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
  return hoursDiff > 1; // Cache stale if older than 1 hour
}

// GET /api/news - Fetch news
router.get('/', async (req, res) => {
  try {
    console.log('📰 News API endpoint hit');

    let cacheData = loadNewsCache();
    if (isCacheStale(cacheData)) {
      console.log('🔄 Cache is stale, fetching new news...');
      const freshNews = await fetchNewsAPI();
      saveNewsCache(freshNews);

      res.json({
        articles: freshNews,
        lastUpdated: new Date().toISOString(),
        source: 'fresh-newsapi',
        totalArticles: freshNews.length
      });
    } else {
      console.log('✅ Using cached news data');
      res.json({
        articles: cacheData.articles,
        lastUpdated: cacheData.lastUpdated,
        source: 'cache',
        totalArticles: cacheData.articles.length
      });
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news', message: error.message });
  }
});

// POST /api/news/refresh - Force refresh
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refreshing news...');
    const freshNews = await fetchNewsAPI();
    saveNewsCache(freshNews);

    res.json({
      success: true,
      message: 'News refreshed successfully',
      articles: freshNews,
      lastUpdated: new Date().toISOString(),
      source: 'force-refresh',
      totalArticles: freshNews.length
    });
  } catch (error) {
    console.error('Error refreshing news:', error);
    res.status(500).json({ error: 'Failed to refresh news', message: error.message });
  }
});

// GET /api/news/cache-status - Check cache status
router.get('/cache-status', (req, res) => {
  try {
    const cacheData = loadNewsCache();
    const isStale = isCacheStale(cacheData);

    res.json({
      hasCache: !!cacheData,
      isStale,
      lastUpdated: cacheData?.lastUpdated || null,
      articleCount: cacheData?.articles?.length || 0,
      nextRefresh: isStale ? 'Immediate' : 'In 1 hour'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check cache status', message: error.message });
  }
});

module.exports = router;
