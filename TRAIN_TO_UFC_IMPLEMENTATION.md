# 🚂 Train to UFC - Complete Implementation Guide

## Overview
A new game mode for the UFC Fan App where users build avatars and compete in a moving train battle royale system. Only fighters with the same weight class can fight.

---

## 📁 File Structure

### Backend Files Created/Modified

```
backend/
├── models/
│   ├── TrainToUFCAvatar.js      ✅ (Enhanced with STR, SPD, END, TECH, LCK stats, XP, coins, weightClass)
│   └── Train.js                  ✅ (Train with cars, spots, fighting logic)
├── routes/
│   └── train-to-ufc.js          ✅ (All API endpoints)
├── sockets/
│   └── trainSocket.js           ✅ (Real-time Socket.io updates)
├── utils/
│   └── fightEngine.js           ✅ (Fight calculation module)
└── server.js                     ✅ (Updated to include train socket)
```

### Frontend Files Created/Modified

```
frontend/src/
├── pages/
│   ├── GameSelection.jsx        ✅ (Menu to choose games)
│   ├── RoadToUFC.jsx            ✅ (Wrapper for existing Game.jsx)
│   └── TrainToUFC.jsx           ✅ (Main game component - TO BE ENHANCED)
└── components/
    └── TrainToUFC/
        ├── TrainCar.jsx         ✅ (Individual train car with 2 spots)
        ├── AnimatedTrain.jsx    ✅ (Moving train with cars)
        ├── FightVisualization.jsx ✅ (HP bars, fight animations)
        └── DraggableFighter.jsx ✅ (Drag-and-drop fighter component)
```

---

## 🔧 Backend Implementation

### 1. Fight Engine (`backend/utils/fightEngine.js`)

**Formula:** `final_score = (STR*1.2 + SPD*1.1 + END*1.3 + TECH*1.4) + random(5-25) + LCK * random(1-3)`

**Features:**
- ✅ Calculates fight outcomes based on stats + random factors
- ✅ Generates damage log for visualization
- ✅ Weight class matching validation
- ✅ Returns winner, loser, XP gained, damage details

### 2. API Routes (`backend/routes/train-to-ufc.js`)

#### `GET /api/train-to-ufc/status`
- Returns user's avatar and current train status

#### `POST /api/train-to-ufc/create-avatar`
- Creates fighter avatar with customization
- Requires: name, weightClass, stats, outfitColor
- Returns: created avatar

#### `POST /api/train-to-ufc/join` (alias: `/join-train`)
- Joins user to active train
- Finds available spot (2 spots per car)
- Validates weight class match before auto-fighting
- Returns: train with avatar placed

#### `POST /api/train-to-ufc/fight`
- Manually triggers fight in a car
- Requires: trainId, carNumber
- Returns: fight result with winner/loser, damage log, XP

#### `GET /api/train-to-ufc/train-status`
- Gets current train state with all fighters
- Returns: train with populated fighter data

#### `GET /api/train-to-ufc/leaderboard`
- Query params: `sortBy` (wins|streak|tokens|xp), `limit` (default: 50)
- Returns: ranked players with stats

#### `POST /api/train-to-ufc/reward`
- Grants rewards (xp, coins, tokens)
- Body: `{ rewardType: 'xp'|'coins'|'tokens', amount: number }`
- Returns: updated avatar stats

### 3. Socket.io Integration (`backend/sockets/trainSocket.js`)

**Namespace:** `/train-to-ufc`

**Events:**
- `join-train` - Join train room for real-time updates
- `leave-train` - Leave train room
- `train-state` - Current train state (sent on join)
- `train-update` - Train state changed (fighter joined/fight completed)
- `fight-result` - Fight completed (with damage log)
- `fight-requested` - Fight manually requested

### 4. Models

#### TrainToUFCAvatar
- ✅ Avatar customization (name, colors, hair style)
- ✅ Stats: STR (striking), SPD (speed), END (stamina), TECH (grappling), LCK (luck)
- ✅ Weight class (required for matchmaking)
- ✅ XP, level, coins, trainTokens
- ✅ Leaderboard stats: wins, losses, currentStreak, longestStreak
- ✅ Train position: trainId, carNumber, spotNumber

#### Train
- ✅ 10 cars, 2 spots each = 20 total spots
- ✅ Car status: occupied spots, isFighting, fightResult
- ✅ Winner tracking
- ✅ Active/inactive state

---

## 🎮 Frontend Implementation

### 1. Game Selection (`GameSelection.jsx`)
- ✅ Menu with 2 game options
- ✅ Visual cards with descriptions
- ✅ Routes to selected game

### 2. Train Components

#### `TrainCar.jsx`
- ✅ 2 drop zones (spot1, spot2)
- ✅ Fighter avatar display
- ✅ Weight class indicator
- ✅ Fighting status indicator
- ✅ Drag-and-drop handlers

#### `AnimatedTrain.jsx`
- ✅ Continuous scrolling animation
- ✅ Infinite loop effect
- ✅ Renders all train cars
- ✅ Stats overlay (fighters, cars, winner)

#### `FightVisualization.jsx`
- ✅ HP bars for both fighters
- ✅ Animated damage over rounds
- ✅ Critical hit indicators
- ✅ Winner announcement with rewards

#### `DraggableFighter.jsx`
- ✅ Draggable fighter card
- ✅ Stats preview
- ✅ Visual feedback on drag

### 3. TrainToUFC Page (TO BE ENHANCED)

**Current States:**
1. `avatar-builder` - Create avatar
2. `training` - Train stats (placeholder)
3. `train-active` - Main game view (TO BE IMPLEMENTED)

**Needed Features:**
- ✅ Socket.io connection for real-time updates
- ✅ Animated train display
- ✅ Drag-and-drop from fighter pool to train
- ✅ Fight visualization modal
- ✅ Leaderboard sidebar
- ✅ Stats display

---

## 🔄 Data Flow

### Join Train Flow:
```
User clicks "Join Train"
  ↓
POST /api/train-to-ufc/join
  ↓
Backend finds active train or creates new
  ↓
Finds available spot (car + spot)
  ↓
Checks weight class compatibility
  ↓
Places fighter in spot
  ↓
If car full → Check weight class → Trigger fight
  ↓
Broadcast via Socket.io to all viewers
  ↓
Frontend receives update → Update train display
```

### Fight Flow:
```
Car has 2 fighters with same weight class
  ↓
Trigger fight (auto or manual)
  ↓
Calculate fight using fightEngine
  ↓
Update winner/loser stats (XP, coins, streak)
  ↓
Eliminate loser (free spot)
  ↓
Check if last fighter → End train
  ↓
Broadcast fight result via Socket.io
  ↓
Frontend shows fight animation
  ↓
Display winner rewards
```

---

## 🎨 UI Components Needed

### Avatar Builder
- ✅ Name input
- ✅ Weight class selector (8 weight classes)
- ✅ Outfit color picker
- ✅ Stats display (all start at 50)

### Training Screen
- [ ] Mini-games to improve stats (STR, SPD, END, TECH, LCK)
- [ ] Stat bars with visual progress
- [ ] Join train button

### Train Active Screen
- [ ] Animated train with all cars
- [ ] Draggable fighter pool sidebar
- [ ] Drag-and-drop to train spots
- [ ] Weight class filter
- [ ] Leaderboard panel
- [ ] Stats panel (XP, level, coins, tokens)
- [ ] Fight visualization modal

---

## 🔐 Matchmaking Logic

### Weight Class Validation
- ✅ Only same weight class can fight
- ✅ Checks before allowing fighter placement
- ✅ Error message if mismatch
- ✅ Prevents auto-fight if classes don't match

### Spot Assignment
- ✅ Finds first available spot
- ✅ Fills spots sequentially (car by car, left to right)
- ✅ Prevents double-booking

---

## 📊 Leaderboard System

**Tracks:**
- Total wins
- Longest streak
- Train tokens
- XP / Level
- Total losses

**Sorting Options:**
- Wins (default)
- Streak
- Tokens
- XP

---

## 🎁 Rewards System

### Fight Win:
- XP: Based on fight score / 10 + damage dealt / 2
- Coins: +10 base
- Train Tokens: +1

### Train Win (Last Fighter Standing):
- XP: +100 bonus
- Coins: +50 bonus
- Train Tokens: +5 bonus

### Level Up:
- Every 100 XP = +1 level
- Auto-calculated on XP gain

---

## 🔌 Socket.io Integration

### Client Connection

```javascript
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://ufc-fan-app-backend.onrender.com');

const trainSocket = io(`${socketUrl}/train-to-ufc`);

// Join train room
trainSocket.emit('join-train', { trainId: '...' });

// Listen for updates
trainSocket.on('train-update', (data) => {
  // Update train state
});

trainSocket.on('fight-result', (data) => {
  // Show fight animation
});
```

---

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if needed)
npm install socket.io mongoose

# Start server
npm start
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (socket.io-client already included)
npm install

# Start dev server
npm run dev
```

### 3. Database Migration

No migration needed - models will create collections automatically on first use.

---

## ✅ Implementation Checklist

### Backend
- ✅ Fight engine module with formula
- ✅ TrainToUFCAvatar model (enhanced with all stats)
- ✅ Train model (cars, spots, fighting)
- ✅ API routes (status, create, join, fight, leaderboard, reward)
- ✅ Socket.io integration
- ✅ Weight class matchmaking
- ✅ Auto-fight on car fill

### Frontend
- ✅ Game selection menu
- ✅ TrainCar component
- ✅ AnimatedTrain component
- ✅ FightVisualization component
- ✅ DraggableFighter component
- ⚠️ TrainToUFC page (needs full implementation with Socket.io)
- ⚠️ Training mini-games (placeholder)

---

## 🎯 Next Steps

1. **Enhance TrainToUFC.jsx** with:
   - Socket.io connection
   - Full train visualization
   - Drag-and-drop integration
   - Leaderboard sidebar
   - Stats display

2. **Training Mini-Games**:
   - Striking game (improves STR)
   - Speed game (improves SPD)
   - Endurance game (improves END)
   - Technique game (improves TECH)
   - Luck game (improves LCK)

3. **Polish**:
   - Better animations
   - Sound effects
   - Victory celebrations
   - Tutorial/help system

---

## 📝 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/train-to-ufc/status` | Get user's game status |
| POST | `/api/train-to-ufc/create-avatar` | Create fighter avatar |
| POST | `/api/train-to-ufc/join` | Join train (auto-placement) |
| POST | `/api/train-to-ufc/fight` | Trigger fight manually |
| GET | `/api/train-to-ufc/train-status` | Get train state |
| GET | `/api/train-to-ufc/leaderboard` | Get leaderboard |
| POST | `/api/train-to-ufc/reward` | Grant rewards |

---

## 🔗 Integration Points

1. **Routes** - `/game` → GameSelection → `/game/train-to-ufc`
2. **Auth** - All endpoints require authentication
3. **Socket.io** - Namespace `/train-to-ufc` for real-time updates
4. **Models** - Uses existing User model, creates new TrainToUFCAvatar and Train models

---

## 🐛 Known Issues / TODO

- [ ] Frontend TrainToUFC.jsx needs full implementation with Socket.io
- [ ] Training mini-games not yet implemented (placeholder exists)
- [ ] Avatar builder needs weight class selector
- [ ] Need to add avatar image_url field for custom avatars
- [ ] Socket.io helpers export/import needs fixing

---

**Status:** Core backend complete ✅ | Frontend components created ✅ | Full UI integration pending ⚠️

