# How to Populate UFC Fighter Collections

## Current Issue
The fighters page is currently showing sample data from the `test/fighters` collection instead of data from `test/ufc-fighter_details` and `test/ufc-fighter_tott` collections.

## Solution

### Option 1: Use the API Endpoint (After Deployment)
Once the backend is redeployed with the new code, you can use this endpoint:

```bash
curl -X POST https://ufc-fan-app-backend.onrender.com/api/fighters/populate-collections
```

### Option 2: Manual Database Population
If you have direct access to your MongoDB database, you can run this script:

```javascript
// Connect to your MongoDB database
// Database: test
// Collections to create: ufc-fighter_details, ufc-fighter_tott

// Copy all data from the existing 'fighters' collection to both new collections
// The data structure should match the FighterDetails and FighterTott models
```

### Option 3: Use MongoDB Compass or Atlas
1. Connect to your MongoDB database
2. Navigate to the `test` database
3. Copy all documents from the `fighters` collection
4. Create two new collections: `ufc-fighter_details` and `ufc-fighter_tott`
5. Paste the documents into both collections

## Data Structure
The new collections should have this structure:

```javascript
{
  name: "Fighter Name",
  nickname: "Nickname",
  division: "Division",
  weight_class: "Division", // Same as division
  height: "6'0\"",
  weight: "170 lbs",
  reach: "72\"",
  age: 30,
  wins: 20,
  losses: 5,
  draws: 0,
  record: "20-5-0",
  status: "active",
  ranking: 5,
  champion: false,
  nationality: "American",
  country: "American", // Same as nationality
  hometown: "City, State",
  fighting_style: "Mixed Martial Arts",
  camp: "Gym Name",
  image_url: "https://...",
  profile_url: "https://...",
  striking_accuracy: 60,
  grappling: "Good ground game",
  knockouts: 10,
  submissions: 5,
  last_fight: {
    opponent: "Opponent Name",
    result: "Win",
    method: "Decision",
    date: "2023-01-01T00:00:00.000Z"
  },
  next_fight: null
}
```

## Verification
After populating the collections, you can verify by calling:

```bash
curl https://ufc-fan-app-backend.onrender.com/api/fighters/debug/collections
```

You should see:
```json
{
  "collections": {
    "ufc-fighter_details": {
      "exists": true,
      "count": 18
    },
    "ufc-fighter_tott": {
      "exists": true,
      "count": 18
    }
  }
}
```

## Next Steps
1. Populate the collections using one of the methods above
2. The API will automatically start using the new collections
3. The fighters page will display data from the correct collections
4. You can then enhance the data in these collections as needed

## Important Notes
- Both collections should have the same data initially
- The `ufc-fighter_tott` collection can be enhanced with additional data later
- The API combines data from both collections, preferring `ufc-fighter_tott` data when available
- Make sure to maintain the same document structure in both collections


