# Sportradar MMA API Setup Guide

## 📦 Step 1: Install the Sportradar MMA Package

In your backend directory, run:

```bash
cd backend
npx api install "@sportradar-mma/v2#dm3jcnfmd4nh8rp"
```

**Note:** This uses the `api` CLI tool which installs the package in a special `.api` directory with ES6 module support.

## 🔑 Step 2: Configure Your API Key

Add your Sportradar API key to the backend `.env` file:

```env
SPORTRADAR_API_KEY=ufc_fan_app_API
```

**Note:** If the `.env` file doesn't exist, create it in the `backend/` directory.

## ✅ Step 3: Restart Backend Server

```bash
# In backend directory
npm start
```

You should see:
```
✅ Sportradar MMA API initialized
🚀 Server running on port 5000
```

## 🧪 Step 4: Test the API

The endpoint will automatically:
1. Try to fetch real data from Sportradar
2. Fall back to mock data if the API fails
3. Use mock data if the package isn't installed

### Test in Browser:
```
http://localhost:5000/api/sportradar/champions
```

### Test in Terminal:
```bash
curl http://localhost:5000/api/sportradar/champions
```

## 📊 How It Works

The backend route (`routes/sportradar.js`):
1. **Initializes** the Sportradar MMA package with your API key
2. **Calls** `sportradarMma.mmaChampions()` with trial access
3. **Returns** real champion data from Sportradar
4. **Falls back** to mock data if API fails or package not installed

## 🔍 Troubleshooting

### Package Not Found Error
If you see: `⚠️ Sportradar MMA package not found. Using mock data.`

**Solution:** Install the package:
```bash
npm install @api/sportradar-mma
```

### API Error
If you see: `❌ Sportradar API error: ...`

**Possible causes:**
1. Invalid API key
2. API rate limit exceeded
3. Network connectivity issue
4. Trial access expired

**Solution:** Check your API key and account status at Sportradar dashboard.

### Still Using Mock Data
If the API is installed but still using mock data:

1. Check backend console for error messages
2. Verify API key in `.env` file
3. Restart backend server after changes
4. Check if trial access is still valid

## 📝 API Response Format

The Sportradar API returns data in this format:

```javascript
{
  weight_classes: [
    {
      id: "heavyweight",
      name: "Heavyweight",
      weight_limit: "265 lbs",
      champion: {
        id: "champion-id",
        name: "Champion Name",
        country: "Country",
        record: "W-L-D",
        image_url: "https://..."
      }
    },
    // ... more weight classes
  ],
  generated_at: "2024-11-09T..."
}
```

## 🎯 Frontend Integration

The frontend Ranking page automatically:
- Fetches data from `/api/sportradar/champions`
- Displays all weight classes
- Makes each weight class collapsible
- Shows champion details when expanded

No frontend changes needed! Just ensure backend is running.

## 🚀 Production Deployment

For production (Vercel, Render, etc.):

1. Add environment variable to your hosting platform:
   ```
   SPORTRADAR_API_KEY=your_actual_api_key
   ```

2. Ensure `@api/sportradar-mma` is in `package.json` dependencies

3. The app will automatically use real API in production

## 📚 Additional Resources

- [Sportradar Developer Portal](https://developer.sportradar.com/)
- [MMA API Documentation](https://developer.sportradar.com/docs/mma)
- Package: [@api/sportradar-mma](https://www.npmjs.com/package/@api/sportradar-mma)

