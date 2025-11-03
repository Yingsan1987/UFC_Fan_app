# 🥊 Events Page Update - Upcoming Fights with Fighter Images

## Overview
The Events page has been enhanced to showcase **upcoming UFC fights** in a dedicated section with **fighter images** matched from the database, separate from past events.

---

## ✨ New Features

### 1. **Upcoming Fights Section** (Top of Page)
- Displays future UFC events with full fight cards
- Shows main event prominently with large fighter images
- Lists all fights on the card with smaller images
- Includes event details (date, location, card position)

### 2. **Fighter Images Integration**
- Automatically matches fighter names with images from database
- Displays fighter profile photos when available
- Fallback to colored initials if no image found
- Supports all fighters in the `ufc_fighter_images` collection

### 3. **Visual Divider**
- Clear separation between "Upcoming Fights" and "Past Events"
- Professional divider with label
- Better content organization

---

## 🎨 Visual Design

### Upcoming Fights Cards

**Event Header:**
- Red gradient background
- Event name (large, bold)
- Date and location icons
- "UPCOMING" badge (yellow)

**Main Event Fight:**
- Featured prominently at top
- Large fighter images (64×64px) with colored borders
  - Red border for Fighter 1
  - Blue border for Fighter 2
- Fighter names and "VS" in center
- Gold border around fight card
- Trophy icon for card position label

**Full Fight Card:**
- Grid layout (2 columns on desktop)
- Smaller fighter images (32×32px)
- Card position labels (Main Event, Co-Main, Main Card, etc.)
- Fighter names with VS separator
- Hover effects

---

## 🔧 Technical Implementation

### Frontend Changes

**File:** `UFC_Fan_app/frontend/src/pages/Events.jsx`

#### New State Variables:
```javascript
const [upcomingEvents, setUpcomingEvents] = useState([]);
const [fighterImages, setFighterImages] = useState({});
```

#### Data Fetching:
```javascript
// Fetch upcoming events
const upcomingResponse = await axios.get(`${API_URL}/fancoins/events/upcoming`);
setUpcomingEvents(upcomingResponse.data);

// Fetch fighter images
const imagesResponse = await axios.get(`${API_URL}/fighters/images`);
const imageMap = {};
imagesResponse.data.forEach(fighter => {
  if (fighter.name && fighter.image_url) {
    imageMap[fighter.name.toLowerCase()] = fighter.image_url;
  }
});
setFighterImages(imageMap);
```

#### Helper Functions:
```javascript
// Get fighter image by name
const getFighterImage = (fighterName) => {
  if (!fighterName) return null;
  return fighterImages[fighterName.toLowerCase()] || null;
};

// Get all fights from event (all card positions)
const getAllFights = (event) => {
  // Extracts fights from mainEvent, coMainEvent, mainCard, etc.
  // Returns array with cardType and cardLabel
};
```

---

### Backend Changes

**File:** `UFC_Fan_app/backend/routes/fighters.js`

#### New Endpoint (Lines 1290-1301):
```javascript
// GET /api/fighters/images
router.get('/images', async (req, res) => {
  try {
    console.log('🖼️ Fetching all fighter images...');
    const images = await FighterImages.find().select('name image_url');
    console.log(`✅ Found ${images.length} fighter images`);
    res.json(images);
  } catch (error) {
    console.error('❌ Error fetching fighter images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fighter images', 
      message: error.message 
    });
  }
});
```

**Returns:**
```json
[
  {
    "_id": "...",
    "name": "Conor McGregor",
    "image_url": "https://..."
  },
  ...
]
```

---

## 📊 Data Flow

### Page Load Sequence:

1. **Fetch Past Events**
   - GET `/api/events`
   - Returns past UFC events
   - Sorted by date (latest first)

2. **Fetch Upcoming Events**
   - GET `/api/fancoins/events/upcoming`
   - Returns future events with fight cards
   - Includes mainEvent, coMainEvent, mainCard, etc.

3. **Fetch Fighter Images**
   - GET `/api/fighters/images`
   - Returns name → image_url mapping
   - Used for image matching

4. **Match & Display**
   - For each fight, lookup fighter names in image map
   - Display image if found
   - Display colored initial if not found

---

## 🎯 Fighter Image Matching

### How It Works:

```javascript
// Image map created from database:
{
  "conor mcgregor": "https://dmxg5wxfqgb4u.cloudfront.net/styles/...",
  "dustin poirier": "https://dmxg5wxfqgb4u.cloudfront.net/styles/...",
  ...
}

// When displaying fight:
const fighter1Name = "Conor McGregor";
const imageUrl = fighterImages[fighter1Name.toLowerCase()];
// Returns image URL if found, null if not
```

### Display Logic:

```javascript
{getFighterImage(fighter.name) ? (
  <img src={getFighterImage(fighter.name)} ... />
) : (
  <div className="rounded-full bg-red-500">
    {fighter.name[0]} // First letter
  </div>
)}
```

---

## 🎨 UI Components

### Upcoming Event Card Structure:

```
┌─────────────────────────────────────────┐
│ 🔴 Event Header (Red Gradient)          │
│ UFC 309: Jones vs Miocic                │
│ 📅 November 16, 2024 📍 New York        │
│                           [UPCOMING]     │
├─────────────────────────────────────────┤
│ 🏆 Main Event                           │
│ ┌───────────────────────────────────┐   │
│ │ [IMG] Fighter 1    VS  Fighter 2 [IMG]│
│ └───────────────────────────────────┘   │
│                                          │
│ 👥 Full Fight Card (8 fights)           │
│ ┌──────────────┐ ┌──────────────┐      │
│ │ Co-Main Event│ │  Main Card   │      │
│ │ F1 vs F2     │ │  F1 vs F2    │      │
│ └──────────────┘ └──────────────┘      │
└─────────────────────────────────────────┘
```

### Color Coding:

- **Main Event Border:** Yellow/Gold (premium feel)
- **Fighter 1 Border:** Red
- **Fighter 2 Border:** Blue
- **Event Background:** Red gradient
- **Card Background:** White with red accents

---

## 📱 Responsive Design

### Desktop:
- Full fight card in 2-column grid
- Large fighter images (64×64px for main, 32×32px for others)
- Spacious layout

### Mobile:
- Single column layout
- Stacked fight cards
- Responsive image sizes
- Touch-friendly spacing

---

## 🔄 Past Events Section

**After the divider, past events display as before:**
- Grid layout (4 columns on desktop)
- Compact event cards
- "View Details" button
- Search functionality

---

## 🚀 Features Breakdown

### Upcoming Events Display

**Shows:**
- ✅ Event name and branding
- ✅ Date (formatted nicely)
- ✅ Location with icon
- ✅ "UPCOMING" badge
- ✅ Main event with large fighter photos
- ✅ Full fight card breakdown
- ✅ Card position labels (Main Event, Co-Main, etc.)
- ✅ Total fight count

### Fighter Images

**Features:**
- ✅ Automatic name matching (case-insensitive)
- ✅ Fallback to colored initials
- ✅ Error handling (placeholder if image fails)
- ✅ Circular images with borders
- ✅ Different colors for each fighter

### Visual Divider

```
────────────────────────────────
      【 Past Events 】
────────────────────────────────
```

---

## 📊 API Endpoints Used

| Endpoint | Purpose | Data Returned |
|----------|---------|---------------|
| `/api/events` | Past events | Event list with DATE, LOCATION |
| `/api/fancoins/events/upcoming` | Future events | Events with fightCard structure |
| `/api/fighters/images` | Fighter photos | name + image_url mapping |

---

## 🎯 User Experience Improvements

### Before:
- ❌ Only showed past events
- ❌ No fighter images
- ❌ No upcoming fight information
- ❌ Generic placeholders

### After:
- ✅ Dedicated upcoming fights section
- ✅ Real fighter profile images
- ✅ Full fight card details
- ✅ Professional card layouts
- ✅ Clear visual hierarchy
- ✅ Engaging presentation

---

## 🧪 Testing Guide

### Test Upcoming Events Display:

1. **Open Events page**
2. **Look for "Upcoming Fights" section** at top
3. **Verify:**
   - Event name displayed
   - Date and location shown
   - "UPCOMING" badge visible
   - Main event prominently featured

### Test Fighter Images:

1. **Check main event fighters**
   - Should see circular profile photos
   - Red border on left fighter
   - Blue border on right fighter
   - Images load or show colored initials

2. **Check full fight card**
   - Smaller fighter images (32×32px)
   - Images for all fighters (if available)
   - Fallback initials if no image

3. **Test image fallback**
   - If image URL invalid → Placeholder image
   - If no image in database → Colored initial circle

### Test Divider:

1. **Scroll down** past upcoming events
2. **Should see:** Clear divider with "Past Events" label
3. **Below divider:** Regular event grid (past events)

---

## 📂 Files Modified

### Frontend:
- **`frontend/src/pages/Events.jsx`**
  - Added upcomingEvents state
  - Added fighterImages state
  - Added fetch logic for both
  - Added getFighterImage() helper
  - Added getAllFights() helper
  - Added upcoming events UI section
  - Added visual divider

### Backend:
- **`backend/routes/fighters.js`**
  - Added GET `/images` endpoint
  - Returns all fighter images from database

---

## 🔍 Data Sources

### Upcoming Events:
**Collection:** UFCEvent (via `/api/fancoins/events/upcoming`)
```javascript
{
  eventName: "UFC 309: Jones vs Miocic",
  eventDate: "2024-11-16T00:00:00.000Z",
  location: "Madison Square Garden, New York",
  fightCard: {
    mainEvent: [{
      fighter1: "Jon Jones",
      fighter2: "Stipe Miocic",
      ...
    }],
    coMainEvent: [...],
    mainCard: [...]
  },
  status: "upcoming"
}
```

### Fighter Images:
**Collection:** ufc_fighter_images (via `/api/fighters/images`)
```javascript
{
  name: "Jon Jones",
  image_url: "https://dmxg5wxfqgb4u.cloudfront.net/..."
}
```

---

## 🎮 Integration with Game System

### Future Enhancement:

The upcoming events section can be enhanced to:
- Show which fighters players have selected
- Highlight fights that award Fan Coins
- Show potential coin earnings
- Add "Transfer to Fighter" button
- Display countdown to event

---

## ✅ Status

**Implementation:** ✅ Complete  
**Backend Endpoint:** ✅ Added  
**Frontend UI:** ✅ Updated  
**Fighter Images:** ✅ Integrated  
**Visual Divider:** ✅ Added  
**Testing:** Ready for testing  

---

## 🚀 Deployment

### To Deploy These Changes:

**Backend (Render):**
```bash
git add backend/routes/fighters.js
git commit -m "Add fighter images endpoint"
git push origin main
```

**Frontend (Vercel):**
```bash
git add frontend/src/pages/Events.jsx  
git commit -m "Add upcoming fights section with fighter images"
git push origin main
```

**Both** deployments needed for full functionality!

---

## 🎯 Expected Result

When you open the Events page, you should see:

1. **Top:** "Upcoming Fights" section
   - Future events with fight cards
   - Fighter images loaded from database
   - Professional card layouts

2. **Middle:** Visual divider
   - "Past Events" label

3. **Bottom:** Regular past events grid
   - Existing functionality
   - Search still works

---

**Update Date:** November 2, 2025  
**Status:** ✅ Complete and Ready to Test  
**Impact:** Major UX improvement for Events page

