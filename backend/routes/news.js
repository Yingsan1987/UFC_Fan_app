// routes/news.js
const express = require('express');
const router = express.Router();
const NewsArticle = require('../models/NewsArticle');
const NewsSyncMeta = require('../models/NewsSyncMeta');
const { fetchNewsAPI } = require('../services/newsapiService');

// Configuration
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const NEWS_QUERY = process.env.NEWS_QUERY || 'UFC OR MMA OR "Ultimate Fighting Championship" OR "Dana White"';
const NEWS_LOOKBACK_DAYS = parseInt(process.env.NEWS_LOOKBACK_DAYS || '7', 10);
const MIN_FETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Syncs UFC news from NewsAPI to MongoDB
 * Implements rate limiting: won't fetch if last fetch was < 10 minutes ago
 * @param {Object} options - Sync options
 * @param {boolean} options.force - Force sync even if rate limit would block
 * @param {string} options.query - Optional custom query (defaults to NEWS_QUERY)
 * @returns {Promise<Object>} { insertedCount, updatedCount, totalFetched }
 */
async function syncUfcNews({ force = false, query = null } = {}) {
  try {
    // Check rate limit (unless forced)
    if (!force) {
      const meta = await NewsSyncMeta.getSingleton();
      if (meta.lastFetchedAt) {
        const timeSinceLastFetch = Date.now() - meta.lastFetchedAt.getTime();
        if (timeSinceLastFetch < MIN_FETCH_INTERVAL_MS) {
          const minutesRemaining = Math.ceil((MIN_FETCH_INTERVAL_MS - timeSinceLastFetch) / 60000);
          console.log(`⏸️  Rate limit: Last fetch was ${Math.floor(timeSinceLastFetch / 60000)} minutes ago. Wait ${minutesRemaining} more minutes.`);
          return {
            insertedCount: 0,
            updatedCount: 0,
            totalFetched: 0,
            skipped: true,
            message: `Rate limited. Last fetch was ${Math.floor(timeSinceLastFetch / 60000)} minutes ago.`
          };
        }
      }
    }

    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY is not set in environment variables');
    }

    const searchQuery = query || NEWS_QUERY;
    const queryTag = query ? 'custom' : 'ufc';

    console.log(`🔄 Syncing news from NewsAPI (query: "${searchQuery}", lookback: ${NEWS_LOOKBACK_DAYS} days)`);

    // Fetch from NewsAPI
    const articles = await fetchNewsAPI({
      apiKey: NEWSAPI_KEY,
      query: searchQuery,
      lookbackDays: NEWS_LOOKBACK_DAYS,
      pageSize: 50
    });

    if (!articles || articles.length === 0) {
      console.log('⚠️  No articles fetched from NewsAPI');
      return {
        insertedCount: 0,
        updatedCount: 0,
        totalFetched: 0
      };
    }

    // Upsert articles by URL
    let insertedCount = 0;
    let updatedCount = 0;
    const now = new Date();

    for (const article of articles) {
      try {
        const result = await NewsArticle.findOneAndUpdate(
          { url: article.url },
          {
            ...article,
            fetchedAt: now,
            queryTag: queryTag
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );

        // Check if it was inserted or updated
        if (result.createdAt && result.createdAt.getTime() === result.updatedAt.getTime()) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      } catch (error) {
        // Skip duplicates or other errors for individual articles
        if (error.code !== 11000) { // 11000 is duplicate key error
          console.error(`Error upserting article "${article.title}":`, error.message);
        }
      }
    }

    // Update sync meta
    const meta = await NewsSyncMeta.getSingleton();
    meta.lastFetchedAt = now;
    meta.lastQueryTag = queryTag;
    meta.lastFetchCount = articles.length;
    await meta.save();

    console.log(`✅ News sync complete: ${insertedCount} inserted, ${updatedCount} updated, ${articles.length} total fetched`);

    return {
      insertedCount,
      updatedCount,
      totalFetched: articles.length
    };
  } catch (error) {
    console.error('❌ Error syncing news:', error);
    throw error;
  }
}

/**
 * GET /api/news
 * Query params:
 *   - limit (default 30, max 100)
 *   - page (default 1)
 *   - q (optional override query - server-side only, stored with queryTag = "custom")
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;
    const customQuery = req.query.q;

    // If custom query provided, trigger a sync (but still return cached results)
    if (customQuery) {
      // Run sync in background (don't wait for it)
      syncUfcNews({ force: false, query: customQuery }).catch(err => {
        console.error('Background sync with custom query failed:', err.message);
      });
    }

    // Build query
    const mongoQuery = {};
    if (customQuery) {
      mongoQuery.queryTag = 'custom';
    } else {
      mongoQuery.queryTag = 'ufc';
    }

    // Get articles from MongoDB
    const [articles, total] = await Promise.all([
      NewsArticle.find(mongoQuery)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsArticle.countDocuments(mongoQuery)
    ]);

    // Auto-sync if cache is empty (only for default query)
    if (articles.length === 0 && !customQuery) {
      console.log('📦 Cache is empty, triggering auto-sync...');
      syncUfcNews({ force: false }).catch(err => {
        console.error('Auto-sync failed:', err.message);
      });
    }

    // Format response
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      articles: articles.map(article => ({
        url: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        author: article.author,
        source: article.sourceName,
        sourceId: article.sourceId,
        image: article.urlToImage,
        publishedAt: article.publishedAt,
        fetchedAt: article.fetchedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news', 
      message: error.message 
    });
  }
});

/**
 * POST /api/news/refresh
 * Protected by x-admin-token header
 * Forces a sync from NewsAPI
 */
router.post('/refresh', async (req, res) => {
  try {
    // Check admin token
    const adminToken = req.headers['x-admin-token'];
    if (ADMIN_TOKEN && adminToken !== ADMIN_TOKEN) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Invalid admin token' 
      });
    }

    const customQuery = req.body.query || req.query.q || null;
    
    console.log('🔄 Manual refresh requested');
    const result = await syncUfcNews({ force: true, query: customQuery });

    res.json({
      success: true,
      message: 'News refreshed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error refreshing news:', error);
    res.status(500).json({ 
      error: 'Failed to refresh news', 
      message: error.message 
    });
  }
});

module.exports = router;
// Export syncUfcNews for use in scripts
module.exports.syncUfcNews = syncUfcNews;
