# ✅ Events Page - Complete Update with Upcoming Fights

## Overview
The Events page now displays **upcoming UFC fights** from the `ufc_upcoming_events` collection, combined with **fighter images** from `ufc_fighter_images`, creating a professional and engaging showcase.

---

## 🎯 What Was Implemented

### 1. **Backend Integration**

**New Model:** `backend/models/UpcomingEvent.js`
- Maps to MongoDB collection: `ufc_upcoming_events`
- Schema matches your scraper output:
  ```javascript
  {
    event_title: String,
    event_date: String,
    event_location: String,
    red_fighter: { name, profile_link },
    blue_fighter: { name, profile_link }
  }
  ```

**New Route:** `backend/routes/upcoming-events.js`
- Endpoint: GET `/api/upcoming-events`
- Fetches from `ufc_upcoming_events` collection
- Fetches from `ufc_fighter_images` collection
- Automatically matches fighter names with images
- Groups fights by event
- Returns combined data with images

**Server Registration:** `backend/server.js`
- Added route: `app.use('/api/upcoming-events', ...)`

---

### 2. **Frontend Enhancement**

**Updated:** `frontend/src/pages/Events.jsx`

**New Features:**
- Fetches upcoming events from new endpoint
- Displays upcoming fights section at top
- Shows fighter profile images
- Fallback to colored initials if no image
- Visual divider separating upcoming from past events

**Data Flow:**
```
Backend combines:
  ufc_upcoming_events (fights data)
  + 
  ufc_fighter_images (photos)
  ↓
Returns: Events with fighter images already matched
  ↓
Frontend displays: Professional fight cards
```

---

## 📊 Data Structure

### Backend Response Format:

```javascript
[
  {
    eventName: "UFC 309: Jones vs Miocic",
    eventDate: "November 16, 2024",
    location: "Madison Square Garden, New York",
    eventLink: "https://www.ufc.com/event/...",
    fights: [
      {
        fighter1: "Jon Jones",
        fighter2: "Stipe Miocic",
        fighter1Image: "https://dmxg5wxfqgb4u.cloudfront.net/...",
        fighter2Image: "https://dmxg5wxfqgb4u.cloudfront.net/...",
        redProfileLink: "/athlete/jon-jones",
        blueProfileLink: "/athlete/stipe-miocic"
      },
      // ... more fights
    ]
  },
  // ... more events
]
```

---

## 🖼️ Fighter Image Matching

### How It Works:

1. **Backend fetches all fighter images:**
   ```javascript
   const fighterImages = await FighterImages.find();
   // From ufc_fighter_images collection
   ```

2. **Creates lookup map:**
   ```javascript
   imageMap = {
     "jon jones": "https://...",
     "stipe miocic": "https://...",
     ...
   }
   ```

3. **Matches each fighter:**
   ```javascript
   fight.fighter1Image = imageMap[fight.fighter1.toLowerCase()];
   fight.fighter2Image = imageMap[fight.fighter2.toLowerCase()];
   ```

4. **Frontend displays:**
   - If image URL exists → Show photo
   - If no image → Show colored initial circle

### Name Matching:

**Case-insensitive matching:**
- "Jon Jones" → "jon jones" → Finds match ✅
- "STIPE MIOCIC" → "stipe miocic" → Finds match ✅
- "Alex Pereira" → "alex pereira" → Finds match ✅

---

## 🎨 Visual Display

### Upcoming Events Section:

**Layout:**
```
🏆 Upcoming Fights (X Events)

┌─────────────────────────────────────────┐
│ 🔴 UFC 309: Jones vs Miocic             │
│ 📅 November 16, 2024                     │
│ 📍 Madison Square Garden, New York       │
│                          [UPCOMING]       │
├─────────────────────────────────────────┤
│ 🏆 Main Event                            │
│ ┌───────────────────────────────────┐   │
│ │ [Photo] Jon Jones  VS  Stipe [Photo]│   │
│ │         Red Corner    Blue Corner  │   │
│ └───────────────────────────────────┘   │
│                                          │
│ 👥 Full Fight Card (8 fights)           │
│ ┌──────────────┐ ┌──────────────┐      │
│ │ Co-Main Event│ │  Main Card   │      │
│ │ [img] F1 vs F2│ │ [img] F1 vs F2│      │
│ └──────────────┘ └──────────────┘      │
└─────────────────────────────────────────┘

──────────── Past Events ────────────

[Regular past events grid below]
```

### Color Scheme:

**Event Cards:**
- Background: Red-to-orange gradient
- Border: Red (2px)
- Header: Dark red gradient

**Fighter Images:**
- Red Corner: Red border (4px)
- Blue Corner: Blue border (4px)
- Size: 64×64px for main, 32×32px for others
- Circular with object-cover

**Fallback Initials:**
- Red Corner: Red circle with white letter
- Blue Corner: Blue circle with white letter
- Other Fights: Gray circle

---

## 🚀 How to Use

### Step 1: Run Your Scraper (If Needed)

```bash
python scrape_ufc_upcoming_events.py
```

This populates `test/ufc_upcoming_events` with current UFC.com data.

### Step 2: Restart Backend

```bash
cd UFC_Fan_app/backend
# Stop server (Ctrl+C if running)
# Start server
npm start
```

The new route `/api/upcoming-events` will now be available.

### Step 3: Refresh Frontend

Just refresh your Events page - it will automatically:
1. Fetch from `/api/upcoming-events`
2. Get events grouped by title
3. Get fighter images already matched
4. Display upcoming fights section

---

## 📡 API Endpoint Details

### GET `/api/upcoming-events`

**Returns:**
```javascript
[
  {
    eventName: "UFC 309: Jones vs Miocic",
    eventDate: "November 16, 2024",  
    location: "Madison Square Garden, New York",
    eventLink: "https://www.ufc.com/event/ufc-309",
    fights: [
      {
        fighter1: "Jon Jones",
        fighter2: "Stipe Miocic",
        fighter1Image: "https://...",  // From ufc_fighter_images
        fighter2Image: "https://...",   // From ufc_fighter_images
        redProfileLink: "/athlete/jon-jones",
        blueProfileLink: "/athlete/stipe-miocic"
      }
      // ... more fights for this event
    ]
  }
  // ... more events
]
```

**Processing:**
1. Fetches all documents from `ufc_upcoming_events`
2. Groups fights by `event_title`
3. Matches fighter names with `ufc_fighter_images`
4. Adds image URLs to each fight
5. Sorts events by date (earliest first)

---

## 🔍 Console Logs to Expect

### Backend Console (when endpoint is hit):

```
📅 Fetching upcoming events from ufc_upcoming_events...
✅ Found 45 upcoming fights
🖼️ Found 850 fighter images
📊 Grouped into 3 events
```

### Frontend Console (when Events page loads):

```
📅 Upcoming events loaded: [
  { eventName: "UFC 309...", fights: [...] },
  ...
]
```

---

## 🧪 Testing Guide

### Step 1: Check Backend Endpoint

Test the endpoint directly:
```bash
# Open in browser or use curl:
http://localhost:5000/api/upcoming-events
```

Should return JSON with events and fights.

### Step 2: Check Frontend

1. Open Events page
2. Open browser console (F12)
3. Look for: `📅 Upcoming events loaded: [...]`
4. Check Network tab for GET `/api/upcoming-events`

### Step 3: Visual Verification

**Should see:**
- "Upcoming Fights" section at top
- Event cards with red headers
- Main event prominently displayed
- Fighter photos (if names match database)
- Full fight card grid
- "Past Events" divider
- Regular past events below

---

## 🐛 Troubleshooting

### If No Upcoming Fights Show:

1. **Check if data exists in MongoDB:**
   ```javascript
   // In MongoDB Compass or Atlas:
   Database: test
   Collection: ufc_upcoming_events
   // Should have documents
   ```

2. **Run your scraper to populate data:**
   ```bash
   python scrape_ufc_upcoming_events.py
   ```

3. **Check backend console:**
   ```
   Should see: ✅ Found X upcoming fights
   If see: ✅ Found 0 upcoming fights → No data in collection
   ```

4. **Check API response:**
   ```bash
   curl http://localhost:5000/api/upcoming-events
   # Should return array of events
   ```

### If Fighter Images Don't Show:

1. **Check if images exist in MongoDB:**
   ```javascript
   Database: test
   Collection: ufc_fighter_images
   // Should have documents with 'name' and 'image_url' fields
   ```

2. **Check name matching:**
   - Fighter name in `ufc_upcoming_events`: "Jon Jones"
   - Fighter name in `ufc_fighter_images`: must be "Jon Jones" (case-insensitive)
   - Check backend console for match count

3. **Check image URLs:**
   - Open image URL in browser
   - Should display fighter photo
   - If 404 → Image URL is broken

### If You See Empty Section:

**Console shows:** `No upcoming events found: [error]`

**Fix:**
- Check backend is running
- Check route is registered in `server.js`
- Check MongoDB connection
- Check collection has data

---

## 📂 Files Created/Modified

### New Files:
- ✅ `backend/models/UpcomingEvent.js` - Model for ufc_upcoming_events
- ✅ `backend/routes/upcoming-events.js` - Route to fetch and combine data

### Modified Files:
- ✅ `backend/server.js` - Registered new route
- ✅ `frontend/src/pages/Events.jsx` - Updated to use new endpoint

---

## 🔄 Data Flow Diagram

```
MongoDB Collections:
├─ ufc_upcoming_events (fight data)
│  └─ event_title, red_fighter.name, blue_fighter.name
│
└─ ufc_fighter_images (photos)
   └─ name, image_url

         ↓ (Backend fetches both)

/api/upcoming-events endpoint
         ↓ (Combines data)

{
  eventName,
  fights: [{
    fighter1,
    fighter2,
    fighter1Image,  ← Matched!
    fighter2Image   ← Matched!
  }]
}
         ↓ (Frontend receives)

Events Page Display
├─ Main event with large photos
├─ Full fight card with small photos
└─ Colored initials if no photo
```

---

## ✅ Current Status

**Backend:**
- ✅ Model created for ufc_upcoming_events
- ✅ Route created to fetch and combine data
- ✅ Fighter image matching implemented
- ✅ Route registered in server.js

**Frontend:**
- ✅ Fetches from new endpoint
- ✅ Displays upcoming fights section
- ✅ Shows fighter images
- ✅ Visual divider added
- ✅ Professional card layouts

**Integration:**
- ✅ Auto-matches fighters with images
- ✅ Groups fights by event
- ✅ Sorts by date
- ✅ Ready to display!

---

## 🚀 Next Steps

1. **Restart your backend server:**
   ```bash
   cd UFC_Fan_app/backend
   npm start
   ```

2. **Refresh Events page in browser**

3. **You should now see:**
   - Upcoming fights from `ufc_upcoming_events`
   - Fighter images from `ufc_fighter_images`  
   - Beautiful event cards
   - Full fight cards

4. **If no data yet:**
   ```bash
   python scrape_ufc_upcoming_events.py
   ```

---

## 📸 Expected Result

**Top of Events Page:**
```
🏆 Upcoming Fights (3 Events)

[Beautiful event cards with fighter photos]
[Main event featured with large images]
[Full fight card grid with smaller images]

──────────── Past Events ────────────

[Regular past events grid]
```

---

**Status:** ✅ Complete  
**Data Source:** MongoDB test/ufc_upcoming_events  
**Images Source:** MongoDB test/ufc_fighter_images  
**Auto-Matching:** ✅ Implemented  
**Ready to Test:** ✅ Yes!

---

**Just restart your backend and refresh the page!** The upcoming fights will appear automatically if you have data in `ufc_upcoming_events`. 🎉

