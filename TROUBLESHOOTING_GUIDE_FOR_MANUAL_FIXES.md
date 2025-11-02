# 🔧 Troubleshooting Guide - Manual Fix Reference

## File Locations & Responsibilities

### Frontend (React)
- **Main Game Page:** `UFC_Fan_app/frontend/src/pages/Game.jsx` (1,461 lines)
- **Mini-Games:** `UFC_Fan_app/frontend/src/components/MiniGames/`
  - `StrikingGame.jsx`
  - `GrapplingGame.jsx`
  - `StaminaGame.jsx` (Road Work)
  - `DefenseGame.jsx`

### Backend (Node.js)
- **Game Routes:** `UFC_Fan_app/backend/routes/game.js`
- **Models:** `UFC_Fan_app/backend/models/RookieFighter.js`

### Images
- **Location:** `UFC_Fan_app/frontend/public/Images/Fighter_Game/`
  - `fighter_stage_1_Rookie.png`
  - `fighter_stage_2_Preliminary.png`
  - `fighter_stage_3_Main_Event.png`
  - `fighter_stage_4_Champion.png`

---

## ⚡ Issue: Energy Not Reducing

### Where Energy is Displayed
**File:** `UFC_Fan_app/frontend/src/pages/Game.jsx`

**Line 895-904:** Energy Display in Header
```javascript
<p className="text-2xl font-bold">
  {rookieFighter && typeof rookieFighter.energy === 'number' ? rookieFighter.energy : 3}/3
</p>
```

### Where Energy is Updated
**File:** `UFC_Fan_app/backend/routes/game.js`

**Line 182:** Energy Reduction
```javascript
rookieFighter.energy -= 1;
```

**Line 186:** Save to Database
```javascript
await rookieFighter.save();
```

**Line 209:** Return Updated Data
```javascript
res.json({
  rookieFighter,  // ← Should contain energy: 2 (or 1, or 0)
  gameProgress
});
```

### Where Frontend Receives Update
**File:** `UFC_Fan_app/frontend/src/pages/Game.jsx`

**Lines 276-283:** API Call
```javascript
const response = await axios.post(`${API_URL}/game/train`, {
  trainingType: currentTrainingType,
  xpGained: xpGained 
});
```

**Lines 285-295:** State Update (CRITICAL!)
```javascript
console.log('✅ Training response received:', response.data);
console.log('⚡ New energy:', response.data.rookieFighter?.energy);

setGameStatus({
  initialized: true,
  rookieFighter: response.data.rookieFighter,  // ← New energy should be here
  gameProgress: response.data.gameProgress
});
```

**Lines 467-468:** Reactive Data Access (CRITICAL!)
```javascript
// MUST BE THIS WAY (not destructured):
const rookieFighter = gameStatus?.rookieFighter;
const gameProgress = gameStatus?.gameProgress;

// NOT THIS WAY:
// const { rookieFighter, gameProgress } = gameStatus; ❌
```

### Debug Steps for Energy

1. **Check Backend Response:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Complete a training
   - Find POST to `/game/train`
   - Check Response → Should show `rookieFighter.energy: 2` (reduced)

2. **Check Frontend Console:**
   ```
   ✅ Training response received: {...}
   ⚡ New energy: 2  ← Should decrease
   📈 Training sessions: 6  ← Should increase
   🔄 Game status updated
   ```

3. **Check State:**
   - In React DevTools
   - Find `Game` component
   - Check `gameStatus.rookieFighter.energy`
   - Should be 2 after first training

4. **Check Display:**
   - Energy display should show 2/3
   - If still shows 3/3 → State not updating
   - Check line 467-468 is correct (not destructured)

---

## 📊 Issue: Fighter Stats Not Updating

### Where Stats are Displayed
**File:** `UFC_Fan_app/frontend/src/pages/Game.jsx`

**Lines 1136-1151:** Stats Display
```javascript
{Object.entries(stats).map(([key, value]) => (
  <div key={key}>
    <span className="text-sm font-bold">{value || 50}/100</span>
    <div style={{ width: `${value || 50}%` }}></div>
  </div>
))}
```

**Line 471:** Stats Extraction
```javascript
const stats = rookieFighter?.stats || {};
```

### Where Stats are Updated
**File:** `UFC_Fan_app/backend/routes/game.js`

**Line 178:** Stat Increase
```javascript
rookieFighter.stats[attribute] = Math.min(100, rookieFighter.stats[attribute] + validatedXP);
```

**Line 186:** Save to Database
```javascript
await rookieFighter.save();
```

**Line 209:** Return Updated Stats
```javascript
res.json({
  rookieFighter,  // ← Should contain updated stats
  gameProgress
});
```

### Debug Steps for Stats

1. **Check Backend Logs:**
   ```
   🎮 Mini-game XP gained: 3 for striking
   ⚡ Energy after training: 2
   ✅ Fighter saved with energy: 2
   ```

2. **Check API Response:**
   - DevTools → Network → POST `/game/train`
   - Response should show:
   ```json
   {
     "rookieFighter": {
       "stats": {
         "striking": 53,  ← Should be higher than before
         "grappling": 50,
         "stamina": 50,
         "defense": 50
       },
       "energy": 2,  ← Should be reduced
       "trainingSessions": 6  ← Should be incremented
     }
   }
   ```

3. **Check Console Logs:**
   ```
   ✅ Training response received: {...}
   📊 New stats: {striking: 53, grappling: 50, ...}
   ```

4. **Check State Update:**
   - React DevTools
   - `gameStatus.rookieFighter.stats.striking`
   - Should match backend response

---

## 🖼️ Issue: Images Not Showing

### Where Images are Referenced
**File:** `UFC_Fan_app/frontend/src/pages/Game.jsx`

**Lines 329-373:** Image Path Functions
```javascript
const getFighterStageImage = () => {
  const basePath = `${process.env.PUBLIC_URL || ''}/Images/Fighter_Game`;
  
  if (!rookieFighter?.isTransferred) {
    return `${basePath}/fighter_stage_1_Rookie.png`;
  }
  
  // ... other stages
};

const getFighterStageEmoji = () => {
  // Fallback emojis
};
```

**Lines 1112-1127:** Image Display in Stats Card
```javascript
{!imageLoadError ? (
  <img 
    src={getFighterStageImage().replace(`${process.env.PUBLIC_URL || ''}`, '')} 
    alt="Fighter Stage" 
    onError={() => setImageLoadError(true)}
    onLoad={() => console.log('Fighter stage image loaded successfully')}
  />
) : (
  <div className="text-8xl">{getFighterStageEmoji()}</div>
)}
```

### Image File Locations
**Directory:** `UFC_Fan_app/frontend/public/Images/Fighter_Game/`

**Files Must Exist:**
- `fighter_stage_1_Rookie.png` (554 KB)
- `fighter_stage_2_Preliminary.png`
- `fighter_stage_3_Main_Event.png`
- `fighter_stage_4_Champion.png`

### Debug Steps for Images

1. **Check Files Exist:**
   ```powershell
   Get-ChildItem "UFC_Fan_app\frontend\public\Images\Fighter_Game"
   ```
   Should show all 4 PNG files

2. **Check Browser Console:**
   - Should see: `"Fighter stage image loaded successfully"`
   - If see: `"Failed to load fighter stage image"` → Path issue

3. **Test Direct URL:**
   - Open in browser: `http://localhost:3000/Images/Fighter_Game/fighter_stage_1_Rookie.png`
   - Should display the image
   - If 404 → Files not in right location

4. **Check Network Tab:**
   - DevTools → Network
   - Filter by "Img"
   - Look for fighter_stage PNG requests
   - Check if 200 (success) or 404 (not found)

5. **Try Simplified Path:**
   - Edit line 1114
   - Change to: `src="/Images/Fighter_Game/fighter_stage_1_Rookie.png"`
   - Remove the `getFighterStageImage()` call temporarily
   - If works → Path function issue

---

## 🎯 Common Issues & Solutions

### Energy/Stats Not Updating

**Issue:** Data updates in backend but not in frontend UI

**Check These Lines in `Game.jsx`:**

1. **Line 467-468** - Must NOT use destructuring:
   ```javascript
   // ✅ CORRECT:
   const rookieFighter = gameStatus?.rookieFighter;
   const gameProgress = gameStatus?.gameProgress;
   
   // ❌ WRONG:
   const { rookieFighter, gameProgress } = gameStatus;
   ```

2. **Line 291-295** - Must use complete replacement:
   ```javascript
   // ✅ CORRECT:
   setGameStatus({
     initialized: true,
     rookieFighter: response.data.rookieFighter,
     gameProgress: response.data.gameProgress
   });
   
   // ❌ WRONG:
   setGameStatus(prev => ({
     ...prev,
     rookieFighter: response.data.rookieFighter
   }));
   ```

3. **Line 901** - Energy display must reference `rookieFighter.energy`:
   ```javascript
   {rookieFighter && typeof rookieFighter.energy === 'number' ? rookieFighter.energy : 3}/3
   ```

### Images Showing Emoji Instead of PNG

**Quick Fix:**
1. Set `imageLoadError` to `false` initially (line 51)
2. Try simple path: `/Images/Fighter_Game/fighter_stage_1_Rookie.png`
3. Remove `process.env.PUBLIC_URL` completely
4. Check console for load errors

**Path Issues:**
- If using subdirectory deployment → keep `PUBLIC_URL`
- If local dev → use simple `/Images/...` path
- Make sure capitalization matches exactly

---

## 📝 Manual Fix Checklist

### To Fix Energy/Stats Updates:

**In `frontend/src/pages/Game.jsx`:**

- [ ] Line 467-468: Change to `const rookieFighter = gameStatus?.rookieFighter;`
- [ ] Line 291: Use complete object replacement in `setGameStatus`
- [ ] Line 285-288: Verify console.log shows correct new values
- [ ] Save file and refresh browser
- [ ] Test training and check console logs

### To Fix Images:

**In `frontend/src/pages/Game.jsx`:**

- [ ] Line 51: Verify `imageLoadError` state exists
- [ ] Line 1114: Simplify to `src="/Images/Fighter_Game/fighter_stage_1_Rookie.png"`
- [ ] Remove `.replace()` call if present
- [ ] Check console for "Image loaded successfully" or error

**In file system:**

- [ ] Verify files in `frontend/public/Images/Fighter_Game/`
- [ ] Check file names match exactly (case-sensitive)
- [ ] Ensure files are valid PNG format
- [ ] Try opening image directly in browser

### To Test Premium Feature:

**Manual Test:**

- [ ] Set energy to 0 (train 3 times)
- [ ] As free user → buttons disabled, warning shown
- [ ] Set `gameProgress.isPremium = true` in database
- [ ] Refresh page
- [ ] Should see "Premium Play" buttons enabled
- [ ] Playing mini-game shows success but no XP gain

---

## 🔍 Key Code Snippets

### Complete handleMiniGameComplete Function
**Location:** `Game.jsx` Lines 261-308

```javascript
const handleMiniGameComplete = async (xpGained) => {
  const isPremium = gameProgress?.isPremium || false;
  const hasEnergy = rookieFighter && rookieFighter.energy > 0;
  
  // Premium users can play without energy but won't gain XP
  if (!hasEnergy && isPremium) {
    showMessage('⭐ Premium Training (No Energy) - No XP gained but thanks for playing!', 'success');
    setActiveMiniGame(null);
    setCurrentTrainingType(null);
    return;
  }
  
  try {
    setActionLoading(true);
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/game/train`,
      { 
        trainingType: currentTrainingType,
        xpGained: xpGained 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Training response received:', response.data);
    console.log('⚡ New energy:', response.data.rookieFighter?.energy);
    console.log('📊 New stats:', response.data.rookieFighter?.stats);
    console.log('📈 Training sessions:', response.data.rookieFighter?.trainingSessions);
    
    // Force complete state update to trigger re-render
    setGameStatus({
      initialized: true,
      rookieFighter: response.data.rookieFighter,
      gameProgress: response.data.gameProgress
    });
    
    console.log('🔄 Game status updated');
    
    showMessage(`${response.data.message}`, 'success');
  } catch (error) {
    console.error('❌ Error during training:', error);
    showMessage(error.response?.data?.message || 'Training failed', 'error');
  } finally {
    setActionLoading(false);
    setActiveMiniGame(null);
    setCurrentTrainingType(null);
  }
};
```

### Backend Training Endpoint
**Location:** `backend/routes/game.js` Lines 127-216

```javascript
router.post('/train', requireAuth, async (req, res) => {
  const firebaseUid = req.user.uid;
  const { trainingType, xpGained } = req.body;

  const rookieFighter = await RookieFighter.findOne({ firebaseUid, isTransferred: false });
  
  // Refresh energy
  const wasRefreshed = rookieFighter.refreshEnergy();
  if (wasRefreshed) {
    await rookieFighter.save();
  }

  // Check energy
  if (rookieFighter.energy <= 0) {
    return res.status(400).json({ 
      message: 'No energy remaining. Come back tomorrow!',
      energy: rookieFighter.energy
    });
  }

  // Map training type to attribute
  const trainingMap = {
    bagWork: 'striking',
    grappleDrills: 'grappling',
    cardio: 'stamina',
    sparDefense: 'defense'
  };
  const attribute = trainingMap[trainingType];

  // Validate XP
  const validatedXP = Math.max(1, Math.min(10, xpGained || 3));

  // Update stats
  rookieFighter.stats[attribute] = Math.min(100, rookieFighter.stats[attribute] + validatedXP);
  rookieFighter.trainingSessions += 1;
  rookieFighter.energy -= 1;
  
  // Save
  await rookieFighter.save();

  // Return updated data
  res.json({
    message: `Training complete! +${validatedXP} ${attribute}. Energy: ${rookieFighter.energy}/3`,
    statGained: validatedXP,
    attribute,
    rookieFighter,  // ← Contains: energy: 2, stats: {...}, trainingSessions: 6
    gameProgress
  });
});
```

---

## 🖼️ Image Display Code

### Image Path Function
**Location:** `Game.jsx` Lines 329-373

```javascript
const getFighterStageImage = () => {
  const basePath = `${process.env.PUBLIC_URL || ''}/Images/Fighter_Game`;
  
  if (!gameStatus?.initialized) {
    return `${basePath}/fighter_stage_1_Rookie.png`;
  }
  
  if (!rookieFighter?.isTransferred) {
    return `${basePath}/fighter_stage_1_Rookie.png`;
  }
  
  const level = gameProgress?.fighterLevel || 'Preliminary Card';
  
  switch(level) {
    case 'Preliminary Card':
      return `${basePath}/fighter_stage_2_Preliminary.png`;
    case 'Main Card':
      return `${basePath}/fighter_stage_3_Main_Event.png`;
    case 'Champion':
      return `${basePath}/fighter_stage_4_Champion.png`;
    default:
      return `${basePath}/fighter_stage_1_Rookie.png`;
  }
};
```

### Image Display Component
**Location:** `Game.jsx` Lines 1109-1139

```javascript
<div className="relative w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center shadow-md">
  {!imageLoadError ? (
    <img 
      src={getFighterStageImage().replace(`${process.env.PUBLIC_URL || ''}`, '')} 
      alt="Fighter Stage" 
      className="w-full h-full object-contain p-2"
      onError={(e) => {
        console.error('Failed to load fighter stage image');
        setImageLoadError(true);
      }}
      onLoad={(e) => {
        console.log('Fighter stage image loaded successfully');
      }}
    />
  ) : (
    <div className="text-8xl">{getFighterStageEmoji()}</div>
  )}
</div>
```

### Simplified Image Fix

**Replace line 1114 with:**
```javascript
src="/Images/Fighter_Game/fighter_stage_1_Rookie.png"
```

**Or even simpler - hardcode for testing:**
```javascript
<img 
  src="/Images/Fighter_Game/fighter_stage_1_Rookie.png"
  alt="Fighter Stage"
  className="w-full h-full object-contain p-2"
/>
```

---

## 🎮 Premium Feature Implementation

### Free User (No Energy)
- Buttons disabled
- Warning: "No energy remaining! Come back tomorrow"
- Cannot play mini-games

### Premium User (No Energy)
- Buttons enabled: "Premium Play (No XP)"
- Warning: "Premium Member - Continue Training! (No XP gain)"
- Can play mini-games for fun
- No XP awarded
- No energy consumed

### Code Locations:

**Button State** (Line 1354):
```javascript
disabled={actionLoading || (rookieFighter && rookieFighter.energy <= 0 && !gameProgress?.isPremium)}
```

**Button Text** (Lines 1357-1360):
```javascript
{actionLoading ? 'Training...' : 
 rookieFighter && rookieFighter.energy <= 0 && gameProgress?.isPremium ? 'Premium Play (No XP)' :
 rookieFighter && rookieFighter.energy <= 0 ? 'No Energy' :
 'Train (1 Energy)'}
```

**Premium Check in Handler** (Lines 238-246):
```javascript
const handleTraining = (trainingType) => {
  const isPremium = gameProgress?.isPremium || false;
  const hasEnergy = rookieFighter && rookieFighter.energy > 0;
  
  if (!hasEnergy && !isPremium) {
    showMessage('⚡ No energy remaining! Upgrade to Premium...', 'error');
    return;
  }
  
  // Launch mini-game
};
```

**Premium No-XP Logic** (Lines 261-271):
```javascript
const handleMiniGameComplete = async (xpGained) => {
  const isPremium = gameProgress?.isPremium || false;
  const hasEnergy = rookieFighter && rookieFighter.energy > 0;
  
  // Premium users can play without energy but won't gain XP
  if (!hasEnergy && isPremium) {
    showMessage('⭐ Premium Training (No Energy) - No XP gained...', 'success');
    setActiveMiniGame(null);
    setCurrentTrainingType(null);
    return; // Exit without API call
  }
  
  // Continue with normal training...
};
```

---

## 🐛 If Still Not Working

### Energy Not Reducing

**Check in order:**
1. Backend receiving request? → Check Network tab
2. Backend reducing energy? → Check backend console logs
3. Backend saving? → Check database directly
4. Backend returning new energy? → Check API response
5. Frontend receiving? → Check `response.data.rookieFighter.energy`
6. Frontend updating state? → Check `setGameStatus` is called
7. State updated? → Check React DevTools `gameStatus`
8. Component re-rendering? → Check line 467-468 (not destructured!)
9. Display showing? → Check line 901 references `rookieFighter.energy`

### Stats Not Updating

**Same debugging flow as energy above**

**Additional Check:**
- Make sure `trainingType` is correct (`bagWork`, `grappleDrills`, `cardio`, `sparDefense`)
- Make sure backend maps to right attribute (`striking`, `grappling`, `stamina`, `defense`)
- Check `rookieFighter.stats[attribute]` is being updated
- Verify response contains updated stats object

### Images Not Loading

**Quick fixes to try:**
1. Use absolute simple path: `src="/Images/Fighter_Game/fighter_stage_1_Rookie.png"`
2. Remove all `process.env.PUBLIC_URL` references
3. Check file capitalization matches exactly
4. Verify files are in `public/Images/Fighter_Game/` not `src/Images/`
5. Restart development server

---

## 📂 Complete File Reference

### Files You Need to Edit:

1. **`frontend/src/pages/Game.jsx`**
   - Lines 51-52: State declarations
   - Lines 238-259: `handleTraining` function
   - Lines 261-308: `handleMiniGameComplete` function  
   - Lines 329-373: Image path functions
   - Lines 467-468: Reactive data access
   - Lines 895-904: Energy display
   - Lines 1112-1139: Image display
   - Lines 1136-1151: Stats display
   - Lines 1330-1356: No energy warning
   - Lines 1352-1361: Training buttons

2. **`backend/routes/game.js`**
   - Lines 127-216: `/train` endpoint
   - This file should already be correct

3. **Image files:**
   - Must be in: `frontend/public/Images/Fighter_Game/`

---

## ✅ Summary

**For Energy/Stats Issues:**
- Main file: `frontend/src/pages/Game.jsx`
- Key lines: 267-468 (state), 291-295 (update), 901 (display)
- Backend: `backend/routes/game.js` lines 127-216

**For Image Issues:**
- Main file: `frontend/src/pages/Game.jsx`
- Key lines: 329-373 (paths), 1112-1139 (display)
- Files location: `frontend/public/Images/Fighter_Game/`

**For Premium Feature:**
- Frontend: Lines 238-246, 261-271, 1330-1361
- Already implemented and working

---

Let me know which specific issue you want to tackle first, and I can provide more targeted guidance!

