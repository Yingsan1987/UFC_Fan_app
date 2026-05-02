# UFC News API Setup Guide

This document explains how to set up and configure the UFC News feature powered by NewsAPI.org.

## ⚠️ Important Note

**NewsAPI "Developer plan" cannot be used in production.** This implementation is for development/testing purposes only. For production use, you must upgrade to a paid NewsAPI plan or use an alternative news service.

## Architecture Overview

Here's how the news sync system works:

```
┌─────────────────────┐
│  PythonAnywhere     │
│  (Cron Job)         │
│                     │
│  syncNews.py        │
│  - Calls API        │
│  - No API key       │
└──────────┬──────────┘
           │ HTTP POST
           │ /api/news/refresh
           │ (with ADMIN_TOKEN)
           ▼
┌─────────────────────┐
│  Render Backend     │
│  (Node.js/Express)  │
│                     │
│  - Has NEWSAPI_KEY  │
│  - Calls NewsAPI    │
│  - Stores in MongoDB│
└──────────┬──────────┘
           │ API Request
           │ (with NEWSAPI_KEY)
           ▼
┌─────────────────────┐
│  NewsAPI.org        │
│  - Returns articles │
└─────────────────────┘
```

**Key Points:**
- `NEWSAPI_KEY` is stored **only on your Render backend** (secure)
- Python script just triggers the sync via HTTP (no API key needed)
- Backend handles all NewsAPI communication and MongoDB storage
- This keeps your API key secure and centralized

## Environment Variables

Set the following environment variables in your Render dashboard (or `.env` file for local development):

### Required

- **`NEWSAPI_KEY`** (required)
  - Your NewsAPI.org API key
  - Get one at: https://newsapi.org/register
  - Example: `abc123def456ghi789`

### Recommended

- **`ADMIN_TOKEN`** (recommended)
  - Secret token to protect the `/api/news/refresh` endpoint
  - Should be a strong, random string
  - Example: `your-secret-admin-token-here`
  - If not set, the refresh endpoint will be unprotected (not recommended for production)

### Optional

- **`NEWS_QUERY`** (optional)
  - Custom search query for NewsAPI
  - Default: `UFC OR MMA OR "Ultimate Fighting Championship" OR "Dana White"`
  - Example: `UFC OR "mixed martial arts" OR "Conor McGregor"`

- **`NEWS_LOOKBACK_DAYS`** (optional)
  - Number of days to look back when fetching news
  - Default: `7`
  - Example: `14` (for 2 weeks of news)

## Setting Up on Render

### 1. Environment Variables

1. Go to your Render service dashboard
2. Navigate to **Environment** tab
3. Add the following variables:
   ```
   NEWSAPI_KEY=your-newsapi-key-here
   ADMIN_TOKEN=your-secret-token-here
   NEWS_QUERY=UFC OR MMA OR "Ultimate Fighting Championship" OR "Dana White"
   NEWS_LOOKBACK_DAYS=7
   ```
4. Save the changes (service will restart)

### 2. Setting Up Automated Sync (PythonAnywhere or Render)

You can use either PythonAnywhere (recommended) or Render for scheduled news syncing.

#### Option A: PythonAnywhere (Recommended)

**How it works:**
- The Python script calls your backend API endpoint (`POST /api/news/refresh`)
- Your backend (Node.js on Render) has `NEWSAPI_KEY` in its environment variables
- The backend uses that key to fetch from NewsAPI.org
- The backend stores articles in MongoDB
- **The Python script doesn't need `NEWSAPI_KEY`** - it just triggers the backend to do the work

This keeps your API key secure on the backend server and allows the Python script to be a simple HTTP client.

To automatically sync news from NewsAPI using PythonAnywhere:

1. **Install required Python package (if needed):**
   - PythonAnywhere usually has `requests` installed, but if not:
   - In a Bash console: `pip3.10 install --user requests`
   - Or: `pip3 install --user requests`

2. **Upload the Python script to PythonAnywhere:**
   - Upload `backend/scripts/syncNews.py` to your PythonAnywhere account
   - Make it executable: `chmod +x syncNews.py`

3. **Set up environment variables in PythonAnywhere:**
   - Go to PythonAnywhere Dashboard > **Tasks** tab
   - Click **Add a new scheduled task**
   - In the task settings, add environment variables:
     ```
     API_URL=https://ufc-fan-app-backend.onrender.com/api
     ADMIN_TOKEN=your-secret-admin-token-here
     ```
   - **Important Notes:**
     - The `ADMIN_TOKEN` must match the `ADMIN_TOKEN` set in your Render backend
     - **You do NOT need `NEWSAPI_KEY` here** - it's stored on your Render backend server
     - The Python script just calls your backend API, which handles the NewsAPI fetching

4. **Configure the scheduled task:**
   - **Command**: `python3 /home/yourusername/path/to/syncNews.py`
     - Replace `yourusername` with your PythonAnywhere username
     - Replace `path/to/` with the actual path where you uploaded the script
   - **Schedule**: `0 */6 * * *` (every 6 hours)
     - Other examples:
       - `0 */4 * * *` - Every 4 hours
       - `0 0 * * *` - Daily at midnight
       - `0 */12 * * *` - Every 12 hours
       - `0 9,15,21 * * *` - At 9 AM, 3 PM, and 9 PM daily
   - **Enabled**: Check the box to enable the task

5. **Test the script manually first:**
   - In PythonAnywhere, go to **Consoles** > **Bash console**
   - Set environment variables for testing:
     ```bash
     export API_URL=https://ufc-fan-app-backend.onrender.com/api
     export ADMIN_TOKEN=your-secret-admin-token-here
     ```
   - Run: `python3 /home/yourusername/path/to/syncNews.py`
   - Check for any errors and verify it works
   - You should see output like:
     ```
     🚀 Starting news sync script at 2026-01-27T12:00:00
     📡 Calling backend API: https://ufc-fan-app-backend.onrender.com/api/news/refresh
        (Backend will use NEWSAPI_KEY from Render environment to fetch from NewsAPI)
     ✅ News sync completed successfully
     📊 Results:
        - Inserted: 15
        - Updated: 10
        - Total Fetched: 25
     ✨ Script completed successfully
     ```

6. **Monitor the task:**
   - Go to **Tasks** tab to see execution logs
   - Check the logs to ensure the sync is running successfully

#### Option B: Render Cron Job (Alternative)

To automatically sync news from NewsAPI using Render:

1. In Render Dashboard, go to **Cron Jobs**
2. Click **New Cron Job**
3. Configure:
   - **Name**: `Sync UFC News`
   - **Command**: `node scripts/syncNews.js`
   - **Schedule**: `0 */6 * * *` (every 6 hours)
     - Other examples:
       - `0 */4 * * *` - Every 4 hours
       - `0 0 * * *` - Daily at midnight
       - `0 */12 * * *` - Every 12 hours
   - **Service**: Select your backend service
   - **Environment Variables**: Same as your main service (NEWSAPI_KEY, etc.)
4. Save the cron job

### 3. Manual Refresh (Optional)

If you want to manually trigger a refresh from the frontend:

1. In your browser's developer console, run:
   ```javascript
   localStorage.setItem('adminToken', 'your-admin-token-here');
   ```
2. Refresh the page
3. The "Refresh News" button will appear in the News page header
4. Click it to manually sync news from NewsAPI

**Note**: The admin token must match the `ADMIN_TOKEN` environment variable on the backend.

## API Endpoints

### GET /api/news

Fetch paginated news articles from MongoDB cache.

**Query Parameters:**
- `limit` (optional, default: 30, max: 100) - Number of articles per page
- `page` (optional, default: 1) - Page number
- `q` (optional) - Custom search query (triggers background sync with custom query)

**Response:**
```json
{
  "page": 1,
  "limit": 30,
  "total": 150,
  "totalPages": 5,
  "articles": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "description": "Article description",
      "content": "Full article content",
      "author": "Author Name",
      "source": "Source Name",
      "sourceId": "source-id",
      "image": "https://example.com/image.jpg",
      "publishedAt": "2026-01-27T10:00:00.000Z",
      "fetchedAt": "2026-01-27T12:00:00.000Z"
    }
  ]
}
```

### POST /api/news/refresh

Manually trigger a sync from NewsAPI. Protected by `x-admin-token` header.

**Headers:**
- `x-admin-token`: Must match `ADMIN_TOKEN` environment variable

**Response:**
```json
{
  "success": true,
  "message": "News refreshed successfully",
  "insertedCount": 15,
  "updatedCount": 10,
  "totalFetched": 25
}
```

## Rate Limiting

The sync function implements rate limiting to prevent excessive API calls:

- **Minimum interval**: 10 minutes between fetches
- If a sync is attempted within 10 minutes of the last sync, it will be skipped
- The `/api/news/refresh` endpoint can bypass this with `force: true`

## Database Schema

### NewsArticle Model

Articles are stored in MongoDB with the following schema:

- `url` (String, unique, indexed) - Article URL (used as unique key)
- `title` (String, required) - Article title
- `description` (String) - Article description
- `content` (String) - Full article content
- `author` (String) - Author name
- `sourceName` (String) - Source publication name
- `sourceId` (String) - Source ID
- `urlToImage` (String) - Article image URL
- `publishedAt` (Date, indexed) - Publication date
- `fetchedAt` (Date) - When article was fetched from NewsAPI
- `queryTag` (String, indexed) - Query tag ('ufc' or 'custom')
- `createdAt` (Date) - When record was created
- `updatedAt` (Date) - When record was last updated

### Indexes

- `url` (unique)
- `publishedAt` (descending)
- `queryTag` + `publishedAt` (compound)

## Troubleshooting

### No articles showing

1. Check that `NEWSAPI_KEY` is set correctly
2. Verify MongoDB connection is working
3. Manually trigger a sync: `POST /api/news/refresh` with admin token
4. Check backend logs for errors

### Rate limit errors

- Wait 10 minutes between manual refreshes
- Set up a PythonAnywhere scheduled task or Render Cron Job to automate syncing
- Check `NewsSyncMeta` collection for last fetch time

### Authentication errors

- Verify `NEWSAPI_KEY` is valid and active
- Check NewsAPI account status (Developer plan has limitations)
- Ensure API key hasn't expired

### Refresh endpoint returns 403

- Verify `ADMIN_TOKEN` is set in environment variables
- Check that `x-admin-token` header matches exactly
- If `ADMIN_TOKEN` is not set, the endpoint is unprotected (not recommended)

## Local Development

1. Create a `.env` file in the `backend` directory:
   ```
   NEWSAPI_KEY=your-key-here
   ADMIN_TOKEN=your-token-here
   NEWS_LOOKBACK_DAYS=7
   ```

2. Run the sync script manually:
   
   **Node.js (for Render):**
   ```bash
   node scripts/syncNews.js
   ```
   
   **Python (for PythonAnywhere):**
   ```bash
   python3 scripts/syncNews.py
   ```
   (Make sure `API_URL` and `ADMIN_TOKEN` environment variables are set)

3. Test the API:
   ```bash
   curl http://localhost:5000/api/news
   ```

## Files Structure

```
backend/
├── models/
│   ├── NewsArticle.js          # Article model
│   └── NewsSyncMeta.js         # Sync metadata (rate limiting)
├── services/
│   └── newsapiService.js       # NewsAPI integration
├── routes/
│   └── news.js                 # API routes
└── scripts/
    ├── syncNews.js             # Node.js cron script (for Render)
    └── syncNews.py             # Python cron script (for PythonAnywhere)
```
