# 🪜 Ladder System & Game Updates

## ✅ Changes Implemented

### 1. **Training Progress: 0/50 → 0/12**
- Changed training goal from 50 sessions to 12 sessions
- Faster progression to transfer eligibility
- Less grind, more action

### 2. **Leaderboard Merged into Game Page**
- Top 10 leaderboard now integrated into Game page
- Collapsible section (click to expand/collapse)
- Shows your rank in the header
- Displays: Rank, Player, Fan Coins, Fighter Level, Record
- Auto-refreshes with game data

### 3. **Fighter Level Progression System (Ladder)**
- New progression ladder: Rookie → Champion
- Win fights to advance through levels
- Each level requires 3 wins to advance

### 4. **Rookie Fighter Stats Fixed**
- Now displays properly when initialized
- Shows message if no stats available yet
- Energy display fixed (shows 3/3 correctly)

---

## 🪜 Ladder Progression System

### Fighter Levels (5 Tiers)

```
1. Preliminary Card  ←  Starting level
   ↓ (3 wins)
2. Main Card
   ↓ (3 wins)
3. Co-Main Event
   ↓ (3 wins)
4. Main Event
   ↓ (3 wins)
5. Champion  ←  Final level
```

### How It Works

1. **Start at Preliminary Card**
   - All new fighters begin here
   - Can only fight in Preliminary Card events initially

2. **Win 3 Fights to Advance**
   - Each win counts toward level progression
   - Progress tracked: X/3 wins
   - Losses don't reset progress (but reduce prestige)

3. **Level Up Automatically**
   - After 3 wins, automatically promoted to next level
   - Counter resets to 0/3
   - Unlock higher-tier fight opportunities

4. **Champion Status**
   - Final tier - no further progression
   - Can compete in Main Events
   - Highest prestige and rewards

---

## 📊 New Header Stats (4 Cards)

### 1. Fan Coins 🪙
- Total Fan Coins earned
- Primary progression metric

### 2. Fighter Level ⭐
- Current ladder tier
- Shows: Preliminary Card, Main Card, Co-Main, Main Event, or Champion

### 3. Level Progress 🎯
- Wins toward next level
- Format: X/3
- Visual indicator of advancement

### 4. Energy ⚡
- Training energy available
- Format: X/3
- Refreshes daily

---

## 🏆 Leaderboard Integration

### Location
- Integrated into Game page (above main content)
- Collapsible section

### Features
- Shows Top 10 players
- Displays your rank in header if in top positions
- Color-coded rank badges (gold/silver/bronze)
- Highlights your row
- Shows fighter level for each player

### Leaderboard Columns
1. **Rank** - Position with colored badge
2. **Player** - Display name
3. **Fan Coins** - Total coins with icon
4. **Fighter Level** - Current ladder tier
5. **Record** - Wins-Losses

---

## 🎮 Updated Game Flow

### Complete Journey (Rookie to Champion)

```
Day 1-4: Training Phase
├─ Complete 12 training sessions (4 days × 3 energy/day)
├─ Build fighter stats
└─ Unlock transfer eligibility

Day 5: Transfer
├─ Choose real UFC fighter
├─ Start at "Preliminary Card" level
└─ Receive +100 Fan Coins bonus

Week 2-3: Preliminary Card (3 wins needed)
├─ Fighter competes in preliminary fights
├─ Earn 2 Fan Coins per win
├─ Win 3 fights total
└─ Advance to Main Card

Week 4-5: Main Card (3 wins needed)
├─ Fighter competes in main card fights
├─ Earn 3 Fan Coins per win
├─ Win 3 fights total
└─ Advance to Co-Main Event

Week 6-7: Co-Main Event (3 wins needed)
├─ Fighter competes in co-main events
├─ Earn 4 Fan Coins per win
├─ Win 3 fights total
└─ Advance to Main Event

Week 8-9: Main Event (3 wins needed)
├─ Fighter competes in main events
├─ Earn 5 Fan Coins per win
├─ Win 3 fights total
└─ Achieve Champion status

Champion Status:
├─ Compete in Main Events
├─ Maximum Fan Coin earnings
├─ Top leaderboard positions
└─ Elite status
```

---

## 💾 Database Schema Changes

### GameProgress Model - New Fields

```javascript
{
  // ... existing fields ...
  
  // NEW: Fighter Level Progression
  fighterLevel: {
    type: String,
    enum: ['Preliminary Card', 'Main Card', 'Co-Main Event', 'Main Event', 'Champion'],
    default: 'Preliminary Card'
  },
  
  levelWins: {
    type: Number,
    default: 0  // Wins toward next level
  },
  
  winsNeededForNextLevel: {
    type: Number,
    default: 3  // Always 3 wins to advance
  }
}
```

### RookieFighter Model - Updated

```javascript
{
  trainingGoal: {
    type: Number,
    default: 12  // Changed from 50
  }
}
```

---

## 🎯 Fan Coin Earnings by Level

| Fighter Level | Coins per Win | Total for 3 Wins |
|---------------|---------------|------------------|
| Preliminary Card | 2 | 6 coins |
| Main Card | 3 | 9 coins |
| Co-Main Event | 4 | 12 coins |
| Main Event | 5 | 15 coins |
| Champion | 5 | 15 coins |

**Total from Rookie to Champion:** 6 + 9 + 12 + 15 = **42 Fan Coins**
(Plus 100 coins from transfer bonus = **142 total**)

---

## 🔧 Technical Implementation

### Backend Changes

1. **GameProgress Model**
   - Added `fighterLevel` field
   - Added `levelWins` tracker
   - Added `winsNeededForNextLevel` field

2. **addFightResult Method**
   - Now checks for level progression
   - Automatically advances tier after 3 wins
   - Returns `leveledUp` boolean
   - Resets `levelWins` counter on advancement

3. **Leaderboard API**
   - Now includes `fighterLevel` in response
   - Sorted by Fan Coins, then Prestige

### Frontend Changes

1. **Header Stats**
   - Added Fighter Level display
   - Added Level Progress (X/3 wins)
   - Changed from 3 cards to 4 cards

2. **Leaderboard Section**
   - New collapsible section on Game page
   - Top 10 table with fighter levels
   - Your rank displayed in header
   - Auto-loads on page mount

3. **Progress Updates**
   - Changed all references from 50 → 12
   - Updated training tips
   - Added ladder progression info

---

## 🚀 User Experience Improvements

### Faster Progression
- **Before:** 50 training sessions (17 days)
- **After:** 12 training sessions (4 days)
- **Impact:** 4x faster to start competing

### Clear Advancement Path
- Visible fighter level in header
- Progress tracker shows wins needed
- Leaderboard shows where you stand
- Motivating progression system

### Competitive Element
- See top 10 players
- Know your rank
- Compare fighter levels
- Compete for top spots

---

## 📱 UI Layout Changes

### Header (4 Stats)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Fan Coins    │Fighter Level │Level Progress│   Energy     │
│   125 🪙     │  Main Card   │    2/3  🎯   │   3/3  ⚡    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Leaderboard Section (Collapsible)
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Top 10 Leaderboard (You're #5)                          │
├───┬────────────┬───────┬──────────────┬─────────────────────┤
│ # │   Player   │ Coins │    Level     │      Record         │
├───┼────────────┼───────┼──────────────┼─────────────────────┤
│ 1 │ ChampMaker │  487  │  Champion    │      25W - 3L       │
│ 2 │ FighterPro │  412  │  Main Event  │      22W - 6L       │
│ 3 │ Striker99  │  389  │  Co-Main     │      20W - 5L       │
└───┴────────────┴───────┴──────────────┴─────────────────────┘
```

---

## 🎮 Gameplay Strategy

### Optimal Path to Champion

1. **Training (Days 1-4)**
   - Train 3 sessions daily
   - Focus on balanced stats or specialization
   - Complete 12 sessions

2. **Transfer (Day 5)**
   - Choose fighter wisely
   - Consider upcoming events
   - +100 Fan Coins bonus

3. **Grind Preliminary (3 wins)**
   - Need 3 wins at 2 coins each
   - Can take 3-6 events depending on fighter
   - Build momentum

4. **Main Card Push (3 wins)**
   - 3 coins per win
   - Higher visibility fights
   - Better competition

5. **Co-Main Climb (3 wins)**
   - 4 coins per win
   - Near-elite status
   - Challenging opponents

6. **Main Event Battles (3 wins)**
   - 5 coins per win
   - Biggest fights
   - Elite competition

7. **Champion Throne**
   - Stay at Main Event tier
   - Maximum earnings
   - Leaderboard dominance

---

## 🐛 Bug Fixes

### Energy Display
- **Issue:** Energy not showing correctly
- **Fix:** Changed `rookieFighter?.energy || 0` to `rookieFighter?.energy ?? 3`
- **Result:** Now shows 3/3 properly for new fighters

### Rookie Fighter Stats
- **Issue:** Stats not displaying
- **Fix:** Added check for stats existence and fallback message
- **Result:** Shows stats when available or helpful message

### Training Progress
- **Issue:** Still showing 0/50
- **Fix:** Updated trainingGoal default to 12
- **Result:** Now correctly shows 0/12

---

## 📈 Expected Timeline

### Casual Player (1-2 events/month per fighter)
- Training: 4 days
- Preliminary → Main Card: 3-6 months
- Main Card → Co-Main: 3-6 months
- Co-Main → Main Event: 3-6 months
- Main Event → Champion: 3-6 months
- **Total: ~1-2 years to Champion**

### Active Player (4 events/month per fighter)
- Training: 4 days
- Preliminary → Main Card: 1 month
- Main Card → Co-Main: 1 month
- Co-Main → Main Event: 1 month
- Main Event → Champion: 1 month
- **Total: ~4 months to Champion**

---

## 🎯 Success Metrics

### Engagement
- Average time to transfer: **~4 days** (vs 17 days before)
- Fighter level diversity in leaderboard
- Daily active users checking rankings

### Progression
- Players reaching each tier
- Average wins per level
- Time spent at each tier

### Competition
- Leaderboard position changes
- Fan Coin distribution
- Champion count

---

## ✅ Testing Checklist

- [x] Training progress shows 0/12
- [x] Energy displays correctly (3/3)
- [x] Rookie fighter stats visible
- [x] Leaderboard loads on Game page
- [x] Fighter level displays in header
- [x] Level progress shows X/3
- [x] Leaderboard shows fighter levels
- [x] Collapsible sections work
- [x] Your rank highlighted
- [x] No linting errors

---

## 🎉 Summary

**Major Changes:**
- ✅ Training: 50 → 12 sessions
- ✅ Leaderboard merged into Game page
- ✅ 5-tier ladder progression system
- ✅ Fighter level tracking
- ✅ Energy display fixed
- ✅ Stats display fixed

**User Benefits:**
- Faster progression (4 days vs 17 days)
- Clear advancement path
- Competitive leaderboard
- Rewarding ladder system
- Improved UI/UX

**Status:** ✅ Complete and Ready to Play!

---

**Last Updated:** November 2, 2025  
**Version:** 3.0.0 (Ladder System)



