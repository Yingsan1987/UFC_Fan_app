# 🎮 UFC Fan App - Fighter Game System Documentation

## Overview

The UFC Fighter Game is an immersive progression system that allows users to train a placeholder fighter, develop their stats, and eventually transfer to control a real UFC fighter whose performance in actual UFC events determines in-game rewards.

## Game Flow

### 1️⃣ Fighter Placeholder (Free User Entry Point)

Every new player starts with a **Placeholder Fighter** - a custom avatar not yet tied to a real UFC athlete.

**Initial Stats:**
- Striking: 50
- Grappling: 50
- Stamina: 50
- Defense: 50

**Goal:** Train your placeholder to "earn your shot" at controlling a real UFC fighter.

### 2️⃣ Training Phase (Progression System)

#### Energy System
- Players receive **3 energy points per day**
- Each training session consumes **1 energy**
- Energy automatically resets at midnight (daily refresh)

#### Training Options

| Training Type | Attribute | Description | Icon |
|--------------|-----------|-------------|------|
| Bag Work | Striking | Increases striking accuracy & KO chance | ⚔️ |
| Grapple Drills | Grappling | Improves takedown & submission success | 💪 |
| Cardio | Stamina | Improves endurance for simulated fights | ❤️ |
| Spar Defense | Defense | Reduces opponent's accuracy | 🛡️ |

#### Progression Mechanics
- Each training session grants **+1 to +3 XP** (random) to the chosen attribute
- Stats are capped at **100** maximum
- Total XP also contributes to player **Level progression**
- **50 training sessions** required to unlock fighter transfer

**Progress Tracking:**
```
Training Progress: 42/50 sessions completed
Eligible to claim real fighter soon!
```

### 3️⃣ Fighter Transfer (Reality Connection)

Once you complete **50 training sessions**, you become eligible to transfer to a real UFC fighter.

#### Transfer Process:
1. Choose from active fighters in your selected **weight class**
2. Only fighters scheduled for upcoming UFC events are available
3. Confirm your transfer to lock in your choice
4. Receive **+100 Fan Corn** bonus for completing training

#### Weight Classes Available:
- Flyweight
- Bantamweight
- Featherweight
- Lightweight
- Welterweight
- Middleweight
- Light Heavyweight
- Heavyweight

**Example Flow:**
```
Selected Weight Class: Lightweight
↓
Available Fighters: Islam Makhachev, Dustin Poirier, Justin Gaethje, etc.
↓
Choose Your Fighter
↓
Transfer Complete! +100 Fan Corn
```

### 4️⃣ Real Fight Outcome Integration

The actual UFC event results (from MongoDB `ufc_fight_results` collection) determine in-game outcomes.

#### Victory Rewards (✅ Fighter Wins)
- Large XP boost
- Fan Corn rewards
- Increased fighter prestige (better matchmaking for next event)
- Improved stats

#### Defeat Consequences (❌ Fighter Loses)
- Small XP loss or fatigue penalty
- Reduced prestige
- Option to retrain or switch for next event

**Premium Members Benefits:**
- Earlier access to fighter selection
- Bonus XP multipliers
- Exclusive fighter options

---

## Technical Architecture

### Backend Models

#### PlaceholderFighter Model
```javascript
{
  userId: ObjectId,
  firebaseUid: String,
  stats: {
    striking: Number (0-100),
    grappling: Number (0-100),
    stamina: Number (0-100),
    defense: Number (0-100)
  },
  trainingSessions: Number,
  trainingGoal: Number (default: 50),
  energy: Number (max: 3),
  lastEnergyRefresh: Date,
  isTransferred: Boolean,
  transferredTo: ObjectId (Fighter),
  selectedWeightClass: String
}
```

#### GameProgress Model
```javascript
{
  userId: ObjectId,
  firebaseUid: String,
  currentFighter: {
    isPlaceholder: Boolean,
    placeholderFighterId: ObjectId,
    realFighterId: ObjectId
  },
  fanCorn: Number,
  totalXP: Number,
  level: Number,
  fightHistory: Array,
  totalWins: Number,
  totalLosses: Number,
  totalDraws: Number,
  prestige: Number
}
```

#### TrainingSession Model
```javascript
{
  userId: ObjectId,
  firebaseUid: String,
  placeholderFighterId: ObjectId,
  trainingType: String,
  attributeImproved: String,
  xpGained: Number,
  completedAt: Date
}
```

### API Endpoints

#### POST `/api/game/initialize`
Initialize game for a user
- **Auth Required:** Yes
- **Body:** `{ weightClass: String }`
- **Returns:** Created placeholder fighter and game progress

#### GET `/api/game/status`
Get user's current game status
- **Auth Required:** Yes
- **Returns:** Game progress and placeholder fighter data

#### POST `/api/game/train`
Perform a training action
- **Auth Required:** Yes
- **Body:** `{ trainingType: String }`
- **Returns:** Updated stats and XP gained

#### GET `/api/game/available-fighters`
Get fighters available for transfer
- **Auth Required:** Yes
- **Returns:** List of fighters in selected weight class

#### POST `/api/game/transfer`
Transfer to a real UFC fighter
- **Auth Required:** Yes
- **Body:** `{ fighterId: ObjectId }`
- **Returns:** Transfer confirmation and updated progress

#### GET `/api/game/training-history`
Get user's training history
- **Auth Required:** Yes
- **Query:** `?limit=20`
- **Returns:** Array of training sessions

#### GET `/api/game/leaderboard`
Get top players by prestige
- **Auth Required:** No
- **Returns:** Top 50 players ranked by prestige

---

## Frontend Components

### Main Game Page (`/game`)

**Features:**
- Dashboard with Level, XP, Fan Corn, and Energy display
- Fighter stats visualization with progress bars
- Training center with 4 training options
- Transfer modal for fighter selection
- Real-time progress tracking

**UI Sections:**
1. **Header Stats** - Quick view of player metrics
2. **Fighter Panel** - Current stats and progress
3. **Training Center** - Interactive training options
4. **Transfer Modal** - Fighter selection interface

---

## Leveling System

**Formula:** `Level = floor(sqrt(totalXP / 100)) + 1`

**Example Progression:**
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 400 XP
- Level 4: 900 XP
- Level 5: 1,600 XP

Each training session grants 10-30 total XP (based on 1-3 attribute XP).

---

## Fan Corn (In-Game Currency)

**Earning Methods:**
- Complete fighter transfer: +100
- Win fights: Variable based on fight significance
- Daily login bonuses (future feature)
- Event participation rewards (future feature)

**Potential Uses (Future):**
- Purchase energy refills
- Unlock special training modes
- Cosmetic fighter customizations
- Premium fighter early access

---

## Future Enhancements

### Phase 2 Features:
- [ ] Live fight simulation during UFC events
- [ ] Multiplayer matchmaking system
- [ ] Fighter trading/marketplace
- [ ] Achievement system
- [ ] Seasonal rankings and rewards

### Phase 3 Features:
- [ ] Custom fighter creation with NFT integration
- [ ] Team/gym management
- [ ] Tournament mode
- [ ] Mobile app integration

---

## Installation & Setup

### Backend Setup

1. **Install Dependencies:**
```bash
cd UFC_Fan_app/backend
npm install
```

2. **Environment Variables:**
Ensure your `.env` includes MongoDB connection string:
```
MONGODB_URI=your_mongodb_connection_string
```

3. **Start Server:**
```bash
npm start
```

The game routes are automatically registered at `/api/game/*`

### Frontend Setup

1. **Install Dependencies:**
```bash
cd UFC_Fan_app/frontend
npm install
```

2. **Environment Variables:**
Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

3. **Start Development Server:**
```bash
npm run dev
```

4. **Access Game:**
Navigate to `http://localhost:5173/game`

---

## Testing the Game

### Test Flow:
1. Sign in with Firebase authentication
2. Navigate to "Game" in sidebar menu
3. Select weight class and initialize game
4. Perform training sessions (3 available per day)
5. Complete 50 sessions
6. Transfer to real UFC fighter
7. Wait for UFC event results (future integration)

### Manual Testing Commands:

**Check Game Status:**
```bash
curl -X GET http://localhost:5000/api/game/status \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Initialize Game:**
```bash
curl -X POST http://localhost:5000/api/game/initialize \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weightClass": "Lightweight"}'
```

**Train:**
```bash
curl -X POST http://localhost:5000/api/game/train \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trainingType": "bagWork"}'
```

---

## Database Collections

The game system adds three new MongoDB collections:

1. **placeholderfighters** - User placeholder fighters
2. **trainingsessions** - Training activity logs
3. **gameprogresses** - User game state and progression

The **users** collection is updated to include a `gameProgress` reference field.

---

## Security & Authentication

All game endpoints require Firebase authentication via JWT token:

```javascript
headers: {
  'Authorization': 'Bearer <firebase_id_token>'
}
```

The `authMiddleware` validates tokens and attaches user info to requests.

---

## Performance Considerations

- Energy refresh checked on each status request (minimal DB impact)
- Training sessions limited to 3/day prevents spam
- Leaderboard capped at top 50 for fast queries
- Fighter selection limited to 20 per weight class

---

## Support & Troubleshooting

### Common Issues:

**"No energy remaining"**
- Energy resets daily at midnight
- Wait until next day or use Fan Corn to refill (future feature)

**"Not eligible for transfer yet"**
- Complete 50 training sessions first
- Check progress: `/api/game/status`

**"Fighter not found"**
- Ensure fighter exists in database
- Verify weight class matches your selection

### Debug Endpoints:

Check MongoDB collections:
```bash
node backend/examine-collections.js
```

---

## Credits

**Developed by:** UFC Fan App Team
**Version:** 1.0.0
**Last Updated:** November 2025

For questions or support, visit `/support` page in the app.

---

## License

This game system is part of the UFC Fan App and follows the same licensing terms as the main application.


