const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// News sources and search terms
const NEWS_SOURCES = [
  {
    name: 'ESPN MMA',
    searchTerms: ['UFC', 'mixed martial arts', 'MMA'],
    category: 'sports'
  },
  {
    name: 'MMA Fighting',
    searchTerms: ['UFC', 'MMA', 'fighting'],
    category: 'sports'
  },
  {
    name: 'Bloody Elbow',
    searchTerms: ['UFC', 'MMA', 'fighting'],
    category: 'sports'
  }
];

// Function to search for UFC news using web search
async function searchUFNews() {
  try {
    console.log('🔍 Searching for latest UFC news...');
    
    // For demo purposes, we'll create mock news data
    // In a real implementation, you would use a news API like NewsAPI, Google News API, or web scraping
    const mockNews = [
      {
        title: "UFC 300: Championship Fight Announced",
        description: "The UFC has officially announced the main event for UFC 300, featuring a highly anticipated championship bout.",
        content: "The Ultimate Fighting Championship has revealed the main event for their milestone UFC 300 event. The championship fight promises to be one of the most exciting matchups in recent history, with both fighters bringing impressive records to the octagon.",
        url: "https://example.com/ufc-300-announcement",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date().toISOString(),
        source: "UFC.com",
        category: "announcements",
        readTime: "3 min read"
      },
      {
        title: "Fighter Suspended for Anti-Doping Violation",
        description: "A prominent UFC fighter has been suspended following a positive test for banned substances.",
        content: "The UFC has announced the suspension of a high-profile fighter after testing positive for performance-enhancing drugs. The fighter will face a lengthy suspension and potential career implications.",
        url: "https://example.com/fighter-suspension",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source: "ESPN MMA",
        category: "controversy",
        readTime: "4 min read"
      },
      {
        title: "Upset Victory at UFC Fight Night",
        description: "Underdog fighter pulls off stunning upset in main event, shocking the MMA world.",
        content: "In a stunning turn of events, the underdog fighter delivered a spectacular performance, defeating the heavily favored opponent with a second-round knockout. The victory has sent shockwaves through the MMA community.",
        url: "https://example.com/upset-victory",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        source: "MMA Fighting",
        category: "fights",
        readTime: "5 min read"
      },
      {
        title: "Fighter Announces Retirement",
        description: "Veteran UFC fighter announces retirement after 15-year career in mixed martial arts.",
        content: "A beloved veteran of the sport has announced his retirement from professional fighting. The fighter leaves behind a legacy of exciting fights and memorable moments in the octagon.",
        url: "https://example.com/fighter-retirement",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        source: "Bloody Elbow",
        category: "announcements",
        readTime: "3 min read"
      },
      {
        title: "New UFC Signing Creates Buzz",
        description: "UFC announces signing of highly-touted prospect from regional circuit.",
        content: "The UFC has signed a promising young fighter who has been making waves in the regional circuit. The signing has generated significant buzz among MMA fans and analysts.",
        url: "https://example.com/new-signing",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        source: "UFC.com",
        category: "transfers",
        readTime: "2 min read"
      },
      {
        title: "Fighter Injured, Fight Cancelled",
        description: "Upcoming fight card suffers setback as main event fighter withdraws due to injury.",
        content: "The upcoming fight card has been significantly impacted by the withdrawal of a main event fighter due to injury. The UFC is working to find a replacement or reschedule the bout.",
        url: "https://example.com/fight-cancelled",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        source: "ESPN MMA",
        category: "injuries",
        readTime: "3 min read"
      }
    ];

    // Add some variety to the mock data
    const additionalNews = [
      {
        title: "UFC Performance Institute Expands",
        description: "The UFC Performance Institute announces new facilities and programs for fighter development.",
        content: "The UFC Performance Institute has unveiled new state-of-the-art facilities designed to help fighters reach their full potential. The expansion includes new training areas and recovery facilities.",
        url: "https://example.com/performance-institute",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        source: "UFC.com",
        category: "announcements",
        readTime: "4 min read"
      },
      {
        title: "Controversial Decision Sparks Debate",
        description: "Split decision victory in championship fight divides fans and experts.",
        content: "A controversial split decision in a recent championship fight has sparked heated debate among fans and MMA experts. The decision has been widely discussed across social media and sports forums.",
        url: "https://example.com/controversial-decision",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
        publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
        source: "MMA Fighting",
        category: "controversy",
        readTime: "6 min read"
      }
    ];

    return [...mockNews, ...additionalNews];
  } catch (error) {
    console.error('Error searching for UFC news:', error);
    throw error;
  }
}

// Function to save news to cache
function saveNewsCache(newsData) {
  try {
    const cachePath = path.join(__dirname, '..', 'news-cache.json');
    const cacheData = {
      articles: newsData,
      lastUpdated: new Date().toISOString(),
      source: 'web-search'
    };
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    console.log('📰 News cache updated successfully');
  } catch (error) {
    console.error('Error saving news cache:', error);
    // Don't throw error, just log it
  }
}

// Function to load news from cache
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

// Function to check if cache is stale (older than 24 hours)
function isCacheStale(cacheData) {
  if (!cacheData || !cacheData.lastUpdated) return true;
  
  const lastUpdated = new Date(cacheData.lastUpdated);
  const now = new Date();
  const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
  
  return hoursDiff > 24; // Cache is stale if older than 24 hours
}

// GET /api/news - Fetch news articles
router.get('/', async (req, res) => {
  try {
    console.log('📰 News API endpoint hit');
    
    // Check cache first
    let cacheData = loadNewsCache();
    
    // If cache is stale or doesn't exist, fetch new news
    if (isCacheStale(cacheData)) {
      console.log('🔄 Cache is stale, fetching new news...');
      const freshNews = await searchUFNews();
      saveNewsCache(freshNews);
      
      res.json({
        articles: freshNews,
        lastUpdated: new Date().toISOString(),
        source: 'fresh-web-search',
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
    res.status(500).json({
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

// POST /api/news/refresh - Force refresh news
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refreshing news...');
    
    const freshNews = await searchUFNews();
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
    res.status(500).json({
      error: 'Failed to refresh news',
      message: error.message
    });
  }
});

// GET /api/news/cache-status - Check cache status
router.get('/cache-status', (req, res) => {
  try {
    const cacheData = loadNewsCache();
    const isStale = isCacheStale(cacheData);
    
    res.json({
      hasCache: !!cacheData,
      isStale: isStale,
      lastUpdated: cacheData?.lastUpdated || null,
      articleCount: cacheData?.articles?.length || 0,
      nextRefresh: isStale ? 'Immediate' : 'In 24 hours'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check cache status',
      message: error.message
    });
  }
});

module.exports = router;
