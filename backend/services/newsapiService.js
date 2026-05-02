/**
 * NewsAPI Service
 * 
 * WARNING: NewsAPI "Developer plan" cannot be used in production.
 * This implementation is for development/testing purposes only.
 * For production, consider upgrading to a paid plan or using an alternative service.
 */

const axios = require('axios');

const NEWSAPI_BASE_URL = 'https://newsapi.org/v2/everything';

/**
 * Fetches articles from NewsAPI
 * @param {Object} options - Query options
 * @param {string} options.apiKey - NewsAPI key from process.env.NEWSAPI_KEY
 * @param {string} options.query - Search query (default: UFC-related terms)
 * @param {number} options.lookbackDays - Number of days to look back (default: 7)
 * @param {number} options.pageSize - Number of articles per page (default: 50, max: 100)
 * @param {number} options.page - Page number (default: 1)
 * @returns {Promise<Array>} Array of normalized article objects
 */
async function fetchNewsAPI({ 
  apiKey, 
  query = null, 
  lookbackDays = 7, 
  pageSize = 50,
  page = 1 
}) {
  if (!apiKey) {
    throw new Error('NEWSAPI_KEY is not set in environment variables');
  }

  // Default query for UFC news
  const defaultQuery = 'UFC OR MMA OR "Ultimate Fighting Championship" OR "Dana White"';
  const searchQuery = query || defaultQuery;

  // Calculate date for 'from' parameter (last N days)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - lookbackDays);
  const fromDateISO = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Build query parameters
  const params = {
    q: searchQuery,
    language: 'en',
    sortBy: 'publishedAt',
    from: fromDateISO,
    pageSize: Math.min(pageSize, 100), // NewsAPI max is 100
    page: page,
    apiKey: apiKey
  };

  const config = {
    method: 'GET',
    url: NEWSAPI_BASE_URL,
    params: params,
    timeout: 10000 // 10 second timeout
  };

  try {
    console.log(`📰 Fetching news from NewsAPI (query: "${searchQuery}", from: ${fromDateISO})`);
    const response = await axios(config);
    
    if (response.data.status === 'ok' && response.data.articles) {
      console.log(`✅ Fetched ${response.data.articles.length} articles from NewsAPI`);
      return normalizeArticles(response.data.articles);
    } else {
      throw new Error(`NewsAPI returned status: ${response.data.status || 'unknown'}`);
    }
  } catch (error) {
    // Handle rate limiting (429) and server errors (5xx) with retry
    if (error.response) {
      const status = error.response.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      
      if (isRetryable) {
        console.log(`⚠️  Retryable error (${status}), retrying after 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const retryResponse = await axios(config);
          if (retryResponse.data.status === 'ok' && retryResponse.data.articles) {
            console.log(`✅ Fetched ${retryResponse.data.articles.length} articles after retry`);
            return normalizeArticles(retryResponse.data.articles);
          }
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError.message);
          throw new Error(`NewsAPI request failed after retry: ${retryError.message}`);
        }
      }
      
      // Non-retryable HTTP errors
      if (status === 401) {
        throw new Error('NewsAPI authentication failed - check your API key');
      } else if (status === 400) {
        throw new Error(`NewsAPI bad request: ${error.response.data.message || 'Invalid parameters'}`);
      } else {
        throw new Error(`NewsAPI error (${status}): ${error.response.data.message || error.message}`);
      }
    }
    
    // Network or other errors
    throw new Error(`Failed to fetch from NewsAPI: ${error.message}`);
  }
}

/**
 * Normalizes NewsAPI article format to our schema
 * @param {Array} articles - Raw articles from NewsAPI
 * @returns {Array} Normalized article objects
 */
function normalizeArticles(articles) {
  return articles.map(article => ({
    url: article.url,
    title: article.title || 'Untitled',
    description: article.description || '',
    content: article.content || '',
    author: article.author || null,
    sourceName: article.source?.name || 'Unknown',
    sourceId: article.source?.id || null,
    urlToImage: article.urlToImage || null,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date()
  }));
}

module.exports = {
  fetchNewsAPI
};
