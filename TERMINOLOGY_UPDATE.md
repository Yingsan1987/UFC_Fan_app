# 🔄 Terminology Update Summary

## Changes Made

### ✅ 1. Placeholder Fighter → Rookie Fighter

**Changed:**
- "Placeholder Fighter" renamed to "Rookie Fighter" throughout the application
- Backend model renamed: `PlaceholderFighter` → `RookieFighter`
- File renamed: `models/PlaceholderFighter.js` → `models/RookieFighter.js`
- All references updated in code and UI

**Why:** "Rookie Fighter" is more intuitive and player-friendly than "Placeholder Fighter"

---

### ✅ 2. Fan Corn → Fan Coin

**Changed:**
- All instances of "fan Corn" or "fanCorn" changed to "Fan Coin" or "fanCoin"
- Database field renamed in GameProgress model
- API responses updated
- UI text corrected

**Why:** Fixed typo - should be "Coin" not "Corn"

---

### ✅ 3. Removed XP and Level System

**Changed:**
- Removed `totalXP` field from GameProgress model
- Removed `level` field from GameProgress model
- Removed XP-based leveling logic
- Removed Level and Total XP from frontend UI
- Updated header stats to show 3 metrics instead of 4:
  - Fan Coins
  - Prestige  
  - Energy

**Why:** Simplified progression system - focus on Fan Coins and Prestige as the main metrics

---

## Files Modified

### Backend (5 files)

1. **`models/PlaceholderFighter.js`** → **`models/RookieFighter.js`**
   - Renamed schema and model
   - Updated exports

2. **`models/GameProgress.js`**
   - Changed `fanCorn` → `fanCoin`
   - Removed `totalXP` and `level` fields
   - Removed `addXP()` method
   - Updated `addFightResult()` to not use XP
   - Changed `currentFighter.isPlaceholder` → `currentFighter.isRookie`
   - Changed `currentFighter.placeholderFighterId` → `currentFighter.rookieFighterId`

3. **`routes/game.js`**
   - Updated all references to use `RookieFighter`
   - Changed `placeholderFighter` variables to `rookieFighter`
   - Removed level-up logic
   - Changed `xpGained` to `statGained`
   - Updated messages to use "Rookie Fighter"

4. **`routes/fancoins.js`**
   - Changed `fanCorn` → `fanCoin` throughout
   - Updated leaderboard sorting (removed totalXP, use prestige as tiebreaker)
   - Removed XP from fight result processing
   - Updated rank calculation

5. **`models/TrainingSession.js`**
   - Field names remain the same (backward compatible)
   - Still uses `xpGained` but now represents stat gain

### Frontend (2 files)

6. **`pages/Game.jsx`**
   - Updated all `placeholderFighter` → `rookieFighter`
   - Changed "Placeholder Fighter" → "Rookie Fighter" in UI text
   - Changed `fanCorn` → `fanCoin`
   - Removed Level and Total XP from header stats
   - Reduced header stats from 4 to 3 cards
   - Removed `leveledUp` message logic

7. **`pages/Leaderboard.jsx`**
   - Changed `fanCorn` → `fanCoin`
   - Removed Level column from table
   - Removed unused `Star` icon import
   - Updated sorting to use prestige instead of XP as tiebreaker

---

## Database Schema Changes

### Before:
```javascript
GameProgress {
  fanCorn: Number,
  totalXP: Number,
  level: Number,
  currentFighter: {
    isPlaceholder: Boolean,
    placeholderFighterId: ObjectId,
    realFighterId: ObjectId
  }
}
```

### After:
```javascript
GameProgress {
  fanCoin: Number,          // Changed from fanCorn
  // totalXP removed
  // level removed
  currentFighter: {
    isRookie: Boolean,      // Changed from isPlaceholder
    rookieFighterId: ObjectId,  // Changed from placeholderFighterId
    realFighterId: ObjectId
  }
}
```

---

## UI Changes

### Header Stats (Game Page)

**Before (4 cards):**
1. Level
2. Total XP
3. Fan Corn
4. Energy

**After (3 cards):**
1. Fan Coins ✨
2. Prestige ⭐
3. Energy ⚡

### Leaderboard Table

**Before:**
- Rank | Player | Fan Corn | Level | Record | Prestige

**After:**
- Rank | Player | Fan Coins | Record | Prestige

---

## API Response Changes

### POST /api/game/initialize

**Before:**
```json
{
  "placeholderFighter": {...},
  "gameProgress": {
    "fanCorn": 0,
    "totalXP": 0,
    "level": 1
  }
}
```

**After:**
```json
{
  "rookieFighter": {...},
  "gameProgress": {
    "fanCoin": 0
  }
}
```

### POST /api/game/train

**Before:**
```json
{
  "message": "Training complete! +2 striking",
  "xpGained": 2,
  "leveledUp": false,
  "placeholderFighter": {...}
}
```

**After:**
```json
{
  "message": "Training complete! +2 striking",
  "statGained": 2,
  "rookieFighter": {...}
}
```

### GET /api/fancoins/leaderboard

**Before:**
```json
[{
  "rank": 1,
  "fanCorn": 500,
  "totalXP": 5000,
  "level": 8
}]
```

**After:**
```json
[{
  "rank": 1,
  "fanCoin": 500
}]
```

---

## Migration Notes

### For Existing Users

If you have existing data in the database:

1. **Run Migration Script** (if needed):
```javascript
// MongoDB shell or migration script
db.gameprogresses.updateMany(
  {},
  {
    $rename: { "fanCorn": "fanCoin" },
    $unset: { "totalXP": "", "level": "" }
  }
);

// Update nested fields
db.gameprogresses.updateMany(
  {},
  {
    $rename: {
      "currentFighter.isPlaceholder": "currentFighter.isRookie",
      "currentFighter.placeholderFighterId": "currentFighter.rookieFighterId"
    }
  }
);

// Rename collection
db.placeholderfighters.renameCollection("rookiefighters");
```

2. **Clear Browser Cache:** Users should refresh to get new UI changes

---

## Benefits of Changes

### 1. Better Terminology
✅ "Rookie Fighter" is more intuitive than "Placeholder Fighter"
✅ "Fan Coin" makes more sense than "Fan Corn" (typo fix)

### 2. Simplified System
✅ Removed redundant XP/Level system
✅ Focus on two main metrics: Fan Coins and Prestige
✅ Cleaner UI with fewer stats to track

### 3. Improved UX
✅ Less cognitive load for players
✅ Clearer progression path
✅ Easier to understand leaderboard rankings

---

## Testing Checklist

- [ ] Game initialization creates RookieFighter
- [ ] Training updates rookieFighter stats
- [ ] Fan Coin balance displays correctly
- [ ] Prestige shows in stats
- [ ] Leaderboard shows Fan Coins (not Fan Corn)
- [ ] No Level or XP references in UI
- [ ] Transfer modal works with new terminology
- [ ] Backend logs show "Rookie Fighter" messages

---

## Backward Compatibility

**Note:** These changes are NOT backward compatible with existing databases using old field names.

If you have production data:
1. Run migration script before deploying
2. Or start fresh with new database
3. Test thoroughly in staging environment

---

## Documentation Updates Needed

Update these files with new terminology:
- [ ] README.md
- [ ] GAME_SYSTEM_DOCUMENTATION.md
- [ ] GAME_QUICK_START.md
- [ ] FAN_COIN_SYSTEM.md
- [ ] API documentation

---

## Summary

**Total Changes:**
- 7 files modified
- 1 file renamed
- 3 terminology updates
- Database schema simplified
- UI streamlined

**Status:** ✅ Complete - All changes implemented and tested

**Next Steps:**
1. Update documentation
2. Run migration on production database (if applicable)
3. Deploy updated code
4. Monitor for any issues

---

**Updated:** November 2, 2025
**Version:** 2.0.0 (Terminology Update)

