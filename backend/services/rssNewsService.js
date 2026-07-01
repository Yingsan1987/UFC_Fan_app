/**
 * RSS News Service
 *
 * Production-friendly fallback for NewsAPI. NewsAPI's free/Developer plan only
 * works from localhost (deployed servers get HTTP 426), so on Render we pull
 * UFC/MMA headlines from public RSS feeds instead — no API key, no cost.
 *
 * Output is normalized to the SAME shape as services/newsapiService.js
 * (url, title, description, content, author, sourceName, sourceId,
 *  urlToImage, publishedAt) so routes/news.js can upsert it unchanged.
 */

const Parser = require('rss-parser');

// Public MMA/UFC feeds. All are MMA-focused, so every item is on-topic.
// Override with the NEWS_RSS_FEEDS env var (comma-separated URLs) if desired.
const DEFAULT_FEEDS = [
  { url: 'https://www.mmafighting.com/rss/current.xml', source: 'MMA Fighting' },
  { url: 'https://www.mmamania.com/rss/current.xml',    source: 'MMA Mania' },
  { url: 'https://mmajunkie.usatoday.com/feed',         source: 'MMA Junkie' },
  { url: 'https://www.sherdog.com/rss/news.xml',        source: 'Sherdog' },
  { url: 'https://www.mmanews.com/feed/',               source: 'MMA News' },
];

function getFeeds() {
  const env = (process.env.NEWS_RSS_FEEDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (env.length) return env.map(url => ({ url, source: null }));
  return DEFAULT_FEEDS;
}

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'UFCFanApp/1.0 (+https://kurokuku.lol)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

// Strip HTML tags to a plain-text snippet.
function stripHtml(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Best-effort image extraction from the various places feeds hide it.
function extractImage(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;

  const media = item.mediaContent || item.mediaThumbnail;
  if (Array.isArray(media)) {
    for (const m of media) {
      const u = m && m.$ && m.$.url;
      if (u) return u;
    }
  } else if (media && media.$ && media.$.url) {
    return media.$.url;
  }

  const html = item.contentEncoded || item.content || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];

  return null;
}

/**
 * Fetch and normalize UFC/MMA articles from RSS feeds.
 * @param {Object} opts
 * @param {number} opts.lookbackDays - drop items older than this (default 7)
 * @param {number} opts.max - cap total returned (default 60)
 * @param {string} opts.query - optional keyword filter (matches title/description)
 * @returns {Promise<Array>} normalized article objects
 */
async function fetchRssNews({ lookbackDays = 7, max = 60, query = null } = {}) {
  const feeds = getFeeds();
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

  // Fetch feeds in parallel; a single failing feed must not break the batch.
  const results = await Promise.allSettled(
    feeds.map(f => parser.parseURL(f.url).then(parsed => ({ parsed, source: f.source })))
  );

  const byUrl = new Map(); // de-dupe by article URL

  for (const r of results) {
    if (r.status !== 'fulfilled') {
      console.warn(`⚠️  RSS feed failed: ${r.reason && r.reason.message}`);
      continue;
    }
    const { parsed, source } = r.value;
    const sourceName = source || parsed.title || 'MMA News';

    for (const item of parsed.items || []) {
      const url = item.link || item.guid;
      if (!url) continue;

      const published = item.isoDate || item.pubDate;
      const publishedAt = published ? new Date(published) : new Date();
      if (!Number.isNaN(publishedAt.getTime()) && publishedAt.getTime() < cutoff) continue;

      const description = stripHtml(item.contentSnippet || item.content || item.contentEncoded || '').slice(0, 500);

      if (query) {
        const hay = `${item.title || ''} ${description}`.toLowerCase();
        const ok = query.toLowerCase().split(/\s+OR\s+|\s+/i).some(term => {
          const t = term.replace(/["']/g, '').trim();
          return t && hay.includes(t.toLowerCase());
        });
        if (!ok) continue;
      }

      if (!byUrl.has(url)) {
        byUrl.set(url, {
          url,
          title: (item.title || 'Untitled').trim(),
          description,
          content: stripHtml(item.contentEncoded || item.content || '').slice(0, 2000),
          author: item.creator || item['dc:creator'] || null,
          sourceName,
          sourceId: null,
          urlToImage: extractImage(item),
          publishedAt,
        });
      }
    }
  }

  const articles = Array.from(byUrl.values())
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, max);

  console.log(`✅ RSS: collected ${articles.length} articles from ${feeds.length} feeds`);
  return articles;
}

module.exports = { fetchRssNews };
