# 🎯 Populate Upcoming Events - Quick Guide

## Why You Only See Header Text

The "Upcoming Fights" section is **working correctly**, but there's **no data in the database yet**. The code shows the section only when `upcomingEvents.length > 0`, so you're seeing the header update but no actual events.

---

## 🚀 How to Populate Upcoming Events

### Option 1: Run the Populate Script (Recommended)

I've created a script with **3 sample upcoming UFC events** (UFC 309, UFC Fight Night, UFC 310).

**Run this command in your backend folder:**

```bash
cd UFC_Fan_app/backend
node populate-upcoming-events.js
```

**What it does:**
- Clears existing upcoming events
- Inserts 3 sample events with full fight cards
- Total ~20 fights across all events
- Includes main events, co-mains, main cards, prelims

**Expected output:**
```
🔄 Connecting to database...
🗑️ Clearing existing upcoming events...
📝 Inserting sample upcoming events...
✅ Successfully populated upcoming events!
📊 Inserted 3 events:
  - UFC 309: Jones vs Miocic (8 fights)
    Date: Sat Nov 16 2024
    Location: Madison Square Garden, New York, NY
  - UFC Fight Night: Yan vs Figueiredo (6 fights)
    Date: Sat Nov 23 2024
    Location: Galaxy Arena, Macau, China
  - UFC 310: Pantoja vs Asakura (9 fights)
    Date: Sat Dec 07 2024
    Location: T-Mobile Arena, Las Vegas, NV

🎉 Done! You can now view upcoming fights on the Events page.
```

---

### Option 2: Use Your Scraper Script

You have `scrape_ufc_upcoming_events.py` which scrapes real UFC.com data!

**But it saves to the wrong collection.** Here's how to fix it:

**Current script saves to:**
```python
collection = db['ufc_upcoming_events']  # ❌ Wrong collection
```

**Needs to save to:**
```python
collection = db['ufcevents']  # ✅ Correct collection for UFCEvent model
```

**And transform the data to match UFCEvent schema:**

```python
# Instead of:
fight_entry = {
    "event_title": title,
    "red_fighter": {"name": red_name},
    "blue_fighter": {"name": blue_name}
}

# Use:
event_entry = {
    "eventName": title,
    "eventDate": datetime.datetime.strptime(event_date, "%m/%d/%Y"),
    "location": location,
    "status": "upcoming",
    "fightCard": {
        "mainEvent": [{
            "fightId": "unique-id",
            "fighter1": red_name,
            "fighter2": blue_name,
            "winner": None,
            "result": None,
            "method": None,
            "processed": False
        }],
        "coMainEvent": [],
        "mainCard": [],
        "preliminaryCard": [],
        "earlyPreliminaryCard": []
    }
}
```

---

### Option 3: Add Events via API (Manual)

You can also create events through the API endpoint:

**Endpoint:** POST `/api/fancoins/events/create`

**Example request:**
```javascript
const newEvent = {
  eventName: "UFC 311: Test Event",
  eventDate: "2025-01-15",
  location: "Las Vegas, NV",
  fightCard: {
    mainEvent: [{
      fightId: "test-1",
      fighter1: "Fighter A",
      fighter2: "Fighter B",
      winner: null,
      result: null,
      method: null,
      processed: false
    }],
    coMainEvent: [],
    mainCard: [],
    preliminaryCard: [],
    earlyPreliminaryCard: []
  }
};

// POST to /api/fancoins/events/create with auth token
```

---

## 🎯 Recommended: Use the Populate Script

**Easiest and fastest way:**

```bash
# 1. Navigate to backend
cd UFC_Fan_app/backend

# 2. Run the populate script
node populate-upcoming-events.js

# 3. Refresh your Events page
# You should now see 3 upcoming events with full fight cards!
```

---

## 🖼️ Fighter Images Will Auto-Match

Once you have upcoming events, the fighter images will **automatically load** if:

1. ✅ Fighter name in event matches name in `ufc_fighter_images` collection
2. ✅ Matching is case-insensitive
3. ✅ If no match → Shows colored initial instead

**Example matches:**
- "Jon Jones" in event → Finds "jon jones" in images → Shows photo
- "Stipe Miocic" in event → Finds "stipe miocic" in images → Shows photo
- "Unknown Fighter" → No match → Shows red circle with "U"

---

## 📊 What You'll See After Populating

### Events Page Will Display:

**Top Section:**
```
🏆 Upcoming Fights (3 Events)

┌─────────────────────────────────────┐
│ UFC 309: Jones vs Miocic            │
│ 📅 Saturday, November 16, 2024      │
│ 📍 Madison Square Garden, New York  │
│                        [UPCOMING]    │
├─────────────────────────────────────┤
│ 🏆 Main Event                       │
│ ┌─────────────────────────────────┐ │
│ │ [IMG] Jon Jones  VS  Stipe [IMG]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ 👥 Full Fight Card (8 fights)      │
│ ┌─────────┐ ┌─────────┐           │
│ │Co-Main  │ │Main Card│           │
│ │Oliveira │ │ Nickal  │           │
│ │vs       │ │ vs      │           │
│ │Chandler │ │ Craig   │           │
│ └─────────┘ └─────────┘           │
└─────────────────────────────────────┘

[Similar cards for other 2 events]

──────────── Past Events ────────────

[Regular past events grid below]
```

---

## 🔧 Troubleshooting

### If No Upcoming Fights Show After Running Script:

1. **Check database connection:**
   ```bash
   # Script should show:
   🔄 Connecting to database...
   ✅ Successfully populated upcoming events!
   ```

2. **Verify data in database:**
   - Open MongoDB Compass or Atlas
   - Check `ufcevents` collection
   - Should see 3 documents with status: "upcoming"

3. **Check API response:**
   - Open browser DevTools (F12)
   - Network tab
   - Look for GET `/api/fancoins/events/upcoming`
   - Response should show 3 events

4. **Check frontend console:**
   ```javascript
   // Should NOT see:
   No upcoming events found: [error]
   
   // Should load silently (no errors)
   ```

### If Fighter Images Don't Show:

1. **Check images endpoint:**
   - DevTools → Network
   - GET `/api/fighters/images`
   - Should return array of {name, image_url}

2. **Check console:**
   ```javascript
   Could not load fighter images: [error]
   ```

3. **Verify ufc_fighter_images collection:**
   - Has data in MongoDB
   - Contains `name` and `image_url` fields

---

## 📂 Files Created/Modified

### New File:
- ✅ `backend/populate-upcoming-events.js` - Populate script

### Modified Files:
- ✅ `frontend/src/pages/Events.jsx` - UI with upcoming section
- ✅ `backend/routes/fighters.js` - Added `/images` endpoint

---

## 🎮 Sample Events Included

### UFC 309: Jones vs Miocic
- **Main Event:** Jon Jones vs Stipe Miocic
- **Co-Main:** Charles Oliveira vs Michael Chandler
- **Main Card:** 3 fights
- **Prelims:** 2 fights
- **Early Prelims:** 1 fight
- **Total:** 8 fights

### UFC Fight Night: Yan vs Figueiredo
- **Main Event:** Petr Yan vs Deiveson Figueiredo
- **Co-Main:** Alex Pereira vs Jamahal Hill
- **Main Card:** 2 fights
- **Prelims:** 1 fight
- **Total:** 5 fights

### UFC 310: Pantoja vs Asakura
- **Main Event:** Alexandre Pantoja vs Kai Asakura
- **Co-Main:** Valentina Shevchenko vs Alexa Grasso
- **Main Card:** 3 fights
- **Prelims:** 2 fights
- **Total:** 8 fights

---

## ✅ Quick Start

**Just run this ONE command:**

```bash
cd UFC_Fan_app/backend && node populate-upcoming-events.js
```

Then refresh your Events page and you'll see all 3 upcoming events with fighter images! 🎉

---

## 🔄 To Add Your Own Events

Edit `populate-upcoming-events.js` and add more events to the `sampleUpcomingEvents` array following the same structure, then re-run the script.

---

**Status:** ✅ Ready to Populate  
**Events Included:** 3 sample UFC events  
**Total Fights:** ~20 fights  
**Fighter Images:** Auto-matched from database

