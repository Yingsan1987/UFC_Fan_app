# 📋 Quick Reference - Files & Line Numbers

## Files Responsible for Each Feature

---

## ⚡ Energy Updates

### Frontend Display:
**File:** `frontend/src/pages/Game.jsx`
- **Line 901:** Energy display `{rookieFighter.energy}/3`

### Frontend State Update:
**File:** `frontend/src/pages/Game.jsx`
- **Line 467:** `const rookieFighter = gameStatus?.rookieFighter;` (MUST NOT destructure)
- **Lines 291-295:** `setGameStatus({...})` (Complete replacement)

### Backend Processing:
**File:** `backend/routes/game.js`
- **Line 182:** `rookieFighter.energy -= 1;`
- **Line 186:** `await rookieFighter.save();`
- **Line 209:** `res.json({ rookieFighter, ... })`

---

## 📊 Fighter Stats Updates

### Frontend Display:
**File:** `frontend/src/pages/Game.jsx`
- **Line 471:** `const stats = rookieFighter?.stats || {};`
- **Lines 1144-1151:** Stats display with progress bars

### Frontend State Update:
**File:** `frontend/src/pages/Game.jsx`
- **Same as Energy** (Lines 291-295, 467)

### Backend Processing:
**File:** `backend/routes/game.js`
- **Line 178:** `rookieFighter.stats[attribute] += validatedXP;`
- **Line 186:** `await rookieFighter.save();`
- **Line 209:** `res.json({ rookieFighter, ... })`

---

## 🖼️ Fighter Stage Images

### Frontend Image Paths:
**File:** `frontend/src/pages/Game.jsx`
- **Lines 329-355:** `getFighterStageImage()` function
- **Lines 357-373:** `getFighterStageEmoji()` function

### Frontend Image Display:
**File:** `frontend/src/pages/Game.jsx`
- **Line 51:** `const [imageLoadError, setImageLoadError] = useState(false);`
- **Lines 411-428:** Init screen image
- **Lines 1112-1127:** Stats card image (main display)
- **Lines 639-648:** Retirement screen image

### Image Files:
**Directory:** `frontend/public/Images/Fighter_Game/`
- `fighter_stage_1_Rookie.png`
- `fighter_stage_2_Preliminary.png`
- `fighter_stage_3_Main_Event.png`
- `fighter_stage_4_Champion.png`

---

## 💎 Premium Feature (Energy Bypass)

### Frontend Logic:
**File:** `frontend/src/pages/Game.jsx`
- **Lines 238-246:** Check energy before launching mini-game
- **Lines 261-271:** Premium can play without XP gain
- **Lines 1330-1356:** Premium/Free user warning messages
- **Line 1354:** Button disabled state
- **Lines 1357-1360:** Button text based on energy/premium

---

## 🎯 Critical Lines to Check

### If Energy Not Reducing:
1. Line 467 in `Game.jsx` - NOT `const { rookieFighter }`
2. Line 291 in `Game.jsx` - Complete object in `setGameStatus`
3. Line 182 in `game.js` - Energy reduction
4. Line 186 in `game.js` - Save to DB

### If Stats Not Updating:
1. Line 471 in `Game.jsx` - `const stats = rookieFighter?.stats`
2. Line 178 in `game.js` - Stats update
3. Line 291 in `Game.jsx` - State update
4. Lines 1144-1151 in `Game.jsx` - Display rendering

### If Images Showing Emoji:
1. Line 51 in `Game.jsx` - `imageLoadError` state
2. Line 1114 in `Game.jsx` - Image src path
3. Check files exist in `public/Images/Fighter_Game/`

---

## 🔧 Most Common Fix

**If nothing updates after training:**

**Change line 291-295 in `Game.jsx` from:**
```javascript
setGameStatus(prev => ({
  ...prev,
  rookieFighter: response.data.rookieFighter,
  gameProgress: response.data.gameProgress
}));
```

**To:**
```javascript
setGameStatus({
  initialized: true,
  rookieFighter: response.data.rookieFighter,
  gameProgress: response.data.gameProgress
});
```

**And change line 467-468 from:**
```javascript
const { rookieFighter, gameProgress } = gameStatus;
```

**To:**
```javascript
const rookieFighter = gameStatus?.rookieFighter;
const gameProgress = gameStatus?.gameProgress;
```

---

## 📱 Testing Console Commands

### Check what's in console after training:
```
Expected output:
✅ Training response received: {...}
⚡ New energy: 2
📊 New stats: {striking: 52, grappling: 50, stamina: 50, defense: 50}
📈 Training sessions: 6
🔄 Game status updated
```

### If not seeing these logs:
- Check line 285-297 in `Game.jsx`
- Make sure console.log statements are there

---

## 🎯 Line Numbers Summary

| Feature | File | Key Lines |
|---------|------|-----------|
| **Energy Display** | `Game.jsx` | 901 |
| **Energy State** | `Game.jsx` | 467, 291-295 |
| **Energy Backend** | `game.js` | 182, 186, 209 |
| **Stats Display** | `Game.jsx` | 1144-1151 |
| **Stats State** | `Game.jsx` | 471, 291-295 |
| **Stats Backend** | `game.js` | 178, 186, 209 |
| **Image Paths** | `Game.jsx` | 329-373 |
| **Image Display** | `Game.jsx` | 1112-1127 |
| **Premium Logic** | `Game.jsx` | 238-246, 261-271 |
| **Button States** | `Game.jsx` | 1354, 1357-1360 |

---

Good luck with your manual fixes! Check these exact lines and let me know if you need clarification on any specific section.

