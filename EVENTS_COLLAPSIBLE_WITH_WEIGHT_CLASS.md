# ✅ Events Page - Collapsible with Weight Class

## Updates Completed

### 1. **Collapsible Event Cards**
Each upcoming event now has a clickable header that expands/collapses the full fight card.

### 2. **Weight Class Display**
Each fight now shows the weight class (e.g., "HEAVYWEIGHT BOUT", "FEATHERWEIGHT BOUT")

---

## 🎯 Features Implemented

### Collapsible Functionality

**Event Header (Clickable):**
```
┌─────────────────────────────────────────┐
│ UFC  FIGHT NIGHT                     [▼]│
│ UFC 309: Jones vs Miocic                │
│ 📅 Nov 16  📍 New York  👥 8 Fights     │
└─────────────────────────────────────────┘
```

**Click to expand:**
```
┌─────────────────────────────────────────┐
│ UFC  FIGHT NIGHT                     [▲]│
│ UFC 309: Jones vs Miocic                │
│ 📅 Nov 16  📍 New York  👥 8 Fights     │
├─────────────────────────────────────────┤
│ 🏆 MAIN EVENT    🔵 HEAVYWEIGHT BOUT    │
│                                         │
│  [IMG]    VS    [IMG]                  │
│  JONES        MIOCIC                    │
│                                         │
│ 👥 FULL FIGHT CARD (3 columns)         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Fight 2  │ │ Fight 3  │ │ Fight 4  ││
│ │ FEATHER  │ │ WELTER   │ │ BANTAM   ││
│ └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

---

## 🎨 Weight Class Display

### Main Event:
- **Location:** Next to "MAIN EVENT" label
- **Style:** Blue gradient badge
- **Size:** text-lg (18px)
- **Format:** UPPERCASE

```
┌─────────────────────────────────────┐
│ 🏆 MAIN EVENT    🔵 HEAVYWEIGHT BOUT │
│                                      │
│ [Large fighter display]              │
└─────────────────────────────────────┘
```

### Other Fights (Grid):
- **Location:** Top right corner of each fight card
- **Style:** Blue background badge
- **Size:** text-xs (12px)
- **Format:** UPPERCASE

```
┌──────────────────────┐
│ Co-Main   FEATHER🔵  │
│ [IMG] vs [IMG]       │
│ Fighter1  Fighter2   │
└──────────────────────┘
```

---

## 💻 Technical Details

### Backend Changes

**File:** `backend/routes/upcoming-events.js` (Line 53)

**Added weight_class to response:**
```javascript
eventMap[eventKey].fights.push({
  fighter1: redFighterName,
  fighter2: blueFighterName,
  fighter1Image: imageMap[redFighterName.toLowerCase()] || null,
  fighter2Image: imageMap[blueFighterName.toLowerCase()] || null,
  redProfileLink: fight.red_fighter?.profile_link,
  blueProfileLink: fight.blue_fighter?.profile_link,
  weightClass: fight.weight_class || null  // ← ADDED
});
```

### Frontend Changes

**File:** `frontend/src/pages/Events.jsx`

**1. Added state for collapsible (Line 17):**
```javascript
const [expandedEvents, setExpandedEvents] = useState({});
```

**2. Added toggle function (Lines 88-92):**
```javascript
const toggleEvent = (index) => {
  setExpandedEvents(prev => ({
    ...prev,
    [index]: !prev[index]
  }));
};
```

**3. Auto-expand first event (Lines 40-42):**
```javascript
if (upcomingResponse.data.length > 0) {
  setExpandedEvents({ 0: true });
}
```

**4. Made header clickable (Lines 220-265):**
```javascript
<button
  onClick={() => toggleEvent(eventIdx)}
  className="w-full bg-gradient-to-r from-yellow-400..."
>
  {/* Event info */}
  {isExpanded ? <ChevronUp /> : <ChevronDown />}
</button>
```

**5. Conditional rendering (Lines 268-393):**
```javascript
{isExpanded && (
  <div className="p-8...">
    {/* Fight card content */}
  </div>
)}
```

**6. Weight class display - Main Event (Lines 277-281):**
```javascript
{mainFight.weightClass && (
  <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white...">
    {mainFight.weightClass}
  </div>
)}
```

**7. Weight class display - Grid Fights (Lines 353-357):**
```javascript
{fight.weightClass && (
  <div className="text-xs font-bold text-blue-600 bg-blue-50...">
    {fight.weightClass}
  </div>
)}
```

---

## 🧪 What You'll See

### Initial State (Collapsed):
```
┌──────────────────────────────────────┐
│ UFC 309: Jones vs Miocic          [▼]│ ← First event expanded
│ 📅 Nov 16  📍 NY  👥 8 Fights        │
├──────────────────────────────────────┤
│ [Fight card visible]                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ UFC 310: Pantoja vs Asakura       [▶]│ ← Other events collapsed
│ 📅 Dec 7  📍 Vegas  👥 9 Fights      │
└──────────────────────────────────────┘
```

### Click to Expand/Collapse:
- Click collapsed header → Expands to show fights
- Click expanded header → Collapses to hide fights
- Chevron icon rotates (▼ ↔ ▲)
- Smooth animation

### Weight Classes Shown:
```
Main Event:
┌─────────────────────────────────┐
│ 🏆 MAIN EVENT  🔵 HEAVYWEIGHT   │
│                                 │
│ [Jon Jones  VS  Stipe Miocic]  │
└─────────────────────────────────┘

Fight Grid:
┌──────────────┐ ┌──────────────┐
│ Co-Main      │ │ Main Card    │
│ FEATHER 🔵   │ │ WELTER 🔵    │
│ [F1 vs F2]   │ │ [F3 vs F4]   │
└──────────────┘ └──────────────┘
```

---

## 📊 Weight Class Examples

Your data might include:
- "HEAVYWEIGHT BOUT"
- "LIGHT HEAVYWEIGHT BOUT"
- "MIDDLEWEIGHT BOUT"
- "WELTERWEIGHT BOUT"
- "LIGHTWEIGHT BOUT"
- "FEATHERWEIGHT BOUT"
- "BANTAMWEIGHT BOUT"
- "FLYWEIGHT BOUT"
- "WOMEN'S BANTAMWEIGHT BOUT"
- "CATCHWEIGHT BOUT"

All will be displayed in UPPERCASE with blue styling.

---

## 🎨 Design Updates

### Collapsible Header:
- ✅ Entire yellow header is clickable
- ✅ Hover effect (darker yellow)
- ✅ Large chevron icon (48×48px)
- ✅ Shows fight count
- ✅ Smooth transitions

### Weight Class Badges:

**Main Event (Large):**
- Background: Blue gradient (blue-600 to blue-800)
- Text: White, text-lg, UPPERCASE, font-bold
- Padding: py-3 px-6
- Rounded corners

**Grid Fights (Small):**
- Background: Blue-50 (light blue)
- Text: Blue-600, text-xs, UPPERCASE, font-bold
- Padding: py-1 px-2
- Rounded corners
- Top right position

---

## 🔍 Data Structure Expected

### From ufc_upcoming_events:
```javascript
{
  event_title: "UFC 309: Jones vs Miocic",
  event_date: "November 16, 2024",
  event_location: "New York",
  red_fighter: {
    name: "Jon Jones",
    profile_link: "/athlete/jon-jones"
  },
  blue_fighter: {
    name: "Stipe Miocic",
    profile_link: "/athlete/stipe-miocic"
  },
  weight_class: "HEAVYWEIGHT BOUT"  // ← NEW FIELD
}
```

### Backend Response:
```javascript
{
  eventName: "UFC 309: Jones vs Miocic",
  eventDate: "November 16, 2024",
  location: "New York",
  fights: [
    {
      fighter1: "Jon Jones",
      fighter2: "Stipe Miocic",
      fighter1Image: "https://...",
      fighter2Image: "https://...",
      weightClass: "HEAVYWEIGHT BOUT"  // ← Passed through
    }
  ]
}
```

---

## 🚀 To Test

### Step 1: Restart Backend
```bash
cd UFC_Fan_app/backend
npm start
```

### Step 2: Open Events Page

**You should see:**
- ✅ First event expanded by default
- ✅ Other events collapsed
- ✅ Weight class badges on fights
- ✅ Click headers to expand/collapse
- ✅ Chevron icons rotate

### Step 3: Interact

1. **Click collapsed event** → Expands to show fights
2. **Click expanded event** → Collapses to hide fights
3. **Look for weight classes** → Blue badges next to fight info
4. **Main event** → Large blue badge
5. **Other fights** → Small blue badges in corner

---

## 📋 Files Modified

**Backend:**
- ✅ `routes/upcoming-events.js` - Added weight_class to response

**Frontend:**
- ✅ `pages/Events.jsx` - Added collapsible + weight class display
  - Added expandedEvents state
  - Added toggleEvent function
  - Made headers clickable
  - Added chevron icons
  - Added weight class badges
  - Auto-expand first event

---

## ✅ Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Collapsible Events** | ✅ Done | Click header to expand/collapse |
| **Weight Class Display** | ✅ Done | Shows on all fights |
| **Auto-Expand First** | ✅ Done | Better UX |
| **Chevron Icons** | ✅ Done | Visual indicator |
| **Weight Class Styling** | ✅ Done | Blue badges |

---

**The Events page now has:**
- 🎯 Collapsible upcoming event cards
- 🥊 Weight class displayed for each fight
- 📊 First event expanded by default
- 🎨 Professional UFC-style design

**Restart backend and refresh to see the collapsible cards with weight classes!** 🎉

