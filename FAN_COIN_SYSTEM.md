# 🪙 Fan Coin System Documentation

## Overview

The Fan Coin system rewards players based on real UFC fight results. When your chosen fighter wins in an actual UFC event, you earn Fan Coins based on their position on the fight card. The more prestigious the fight, the more coins you earn!

---

## 💰 Earning Fan Coins

### Fight Card Position Rewards

| Card Position | Coins Earned | Description |
|---------------|--------------|-------------|
| **Early Preliminary Card** | 1 coin | Opening fights of the event |
| **Preliminary Card** | 2 coins | Prelim fights before main card |
| **Main Card** | 3 coins | Main card fights |
| **Co-Main Event** | 4 coins | Second most important fight |
| **Main Event** | 5 coins | Headliner fight of the night |

### How It Works

1. **Transfer to a Fighter** - Choose a real UFC fighter before their upcoming fight
2. **Wait for Event** - The UFC event takes place
3. **Automatic Processing** - When results are confirmed, coins are awarded
4. **Earn Coins** - If your fighter wins, you earn coins based on card position

### Example Scenarios

**Scenario 1: Main Event Winner**
```
Fighter: Israel Adesanya
Event: UFC 300
Position: Main Event
Result: Win by KO
Reward: 5 Fan Coins + 250 XP bonus
```

**Scenario 2: Preliminary Card Winner**
```
Fighter: Sean O'Malley  
Event: UFC Fight Night
Position: Preliminary Card
Result: Win by Decision
Reward: 2 Fan Coins + 100 XP bonus
```

**Scenario 3: Loss**
```
Fighter: Any fighter
Result: Loss
Reward: 0 Fan Coins (no penalty)
```

---

## 🏆 Leaderboard System

### Top 30 Rankings

The leaderboard displays the top 30 players ranked by:
1. **Primary:** Total Fan Coins (highest first)
2. **Tiebreaker:** Total XP (if Fan Coins are equal)

### Leaderboard Features

- **Real-time Rankings** - Updates after each processed event
- **Player Stats** - Shows Fan Coins, Level, Record, Prestige
- **Your Position** - Highlights your rank if you're logged in
- **Profile Display** - Shows player names and avatars
- **Top 3 Badges** - Special highlighting for podium positions

### Rank Badges

- 🥇 **#1** - Gold Crown badge
- 🥈 **#2** - Silver Medal badge  
- 🥉 **#3** - Bronze Medal badge
- **#4-10** - Purple gradient badge
- **#11-30** - Standard badge

### Personal Rank Display

When logged in, you'll see:
- Your current rank (e.g., #15)
- Total players (e.g., out of 500 players)
- Your percentile (e.g., Top 3%)
- Your Fan Coin count

---

## 📅 UFC Event Processing

### Event Lifecycle

```
1. Event Creation (Admin)
   ↓
2. Status: Upcoming
   ↓
3. Players transfer to fighters
   ↓
4. Event happens (Live)
   ↓
5. Results entered (Admin)
   ↓
6. Status: Completed
   ↓
7. Process Event (Admin triggers)
   ↓
8. Fan Coins awarded automatically
   ↓
9. Leaderboard updates
```

### Event Structure

Each UFC event includes:
- **Event Name** (e.g., "UFC 300")
- **Event Date** 
- **Location**
- **Fight Cards:**
  - Main Event fights
  - Co-Main Event fights
  - Main Card fights
  - Preliminary Card fights
  - Early Preliminary Card fights

### Fight Details

For each fight:
- **Fighter Names** (Fighter 1 vs Fighter 2)
- **Winner** (which fighter won)
- **Result** (win/loss/draw/no contest)
- **Method** (KO, Submission, Decision, etc.)
- **Processed** (coins awarded yes/no)

---

## 💳 Fan Coin Transactions

### Transaction History

Every Fan Coin transaction is logged with:
- **Amount** - Coins earned or spent
- **Type** - earned, spent, bonus, penalty
- **Source** - fight_win, transfer_bonus, daily_bonus, etc.
- **Fight Details** - Event name, fighter, card position
- **Balance After** - Your coin balance after transaction
- **Date/Time** - When transaction occurred

### Transaction Types

| Type | Description | Example |
|------|-------------|---------|
| `earned` | Coins earned from activity | Fighter win |
| `spent` | Coins spent on purchases | Energy refill (future) |
| `bonus` | Bonus coins awarded | Transfer completion |
| `penalty` | Coins deducted | (rarely used) |

### Viewing Transaction History

Access via:
- GET `/api/fancoins/transactions` (authenticated)
- Shows last 50 transactions by default
- Sorted by most recent first

---

## 🎮 Integration with Game System

### Fighter Transfer Bonus

When you complete 50 training sessions and transfer to a real fighter:
- **Immediate Bonus:** +100 Fan Coins
- **Future Earnings:** Eligible to earn coins from fights

### Fight Result Integration

When your fighter competes:
- **Win:** Earn coins based on card position + XP bonus
- **Loss:** No coins earned (no penalty)
- **Draw/No Contest:** No coins awarded

### Progression Bonuses

Fight wins also grant:
- **XP Bonus:** Coin value × 50 (e.g., 5 coins = 250 XP)
- **Prestige Points:** +10 for wins
- **Fight History:** Recorded in your game profile

---

## 📊 Backend API Endpoints

### Public Endpoints (No Auth Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fancoins/events/upcoming` | GET | List upcoming events |
| `/api/fancoins/events/completed` | GET | List past events |
| `/api/fancoins/events/:eventId` | GET | Get event details |
| `/api/fancoins/leaderboard` | GET | Top 30 leaderboard |

### Authenticated Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fancoins/transactions` | GET | User's transaction history |
| `/api/fancoins/leaderboard/my-rank` | GET | User's current rank |

### Admin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fancoins/events/create` | POST | Create new event |
| `/api/fancoins/process-event/:eventId` | POST | Award coins for event |

---

## 🔧 Admin Guide: Processing Events

### Step 1: Create Event

```javascript
POST /api/fancoins/events/create
{
  "eventName": "UFC 300",
  "eventDate": "2025-04-13T02:00:00Z",
  "location": "Las Vegas, NV",
  "fightCard": {
    "mainEvent": [
      {
        "fightId": "ufc300-main",
        "fighter1": "Alex Pereira",
        "fighter2": "Jamahal Hill",
        "winner": "",
        "result": "",
        "method": ""
      }
    ],
    // ... other cards
  }
}
```

### Step 2: Update Fight Results

After the event, update the event document with:
- Winner names
- Fight results
- Methods of victory

### Step 3: Process Event

```javascript
POST /api/fancoins/process-event/:eventId
```

This will:
1. Find all users with winning fighters
2. Calculate coins based on card position
3. Award coins to user balances
4. Create transaction records
5. Add to fight history
6. Mark fights as processed

### Processing Results

The endpoint returns:
```json
{
  "message": "Event processed successfully",
  "results": {
    "processed": 15,
    "skipped": 2,
    "errors": 0,
    "coinsByCard": {
      "mainEvent": 5,
      "coMainEvent": 8,
      "mainCard": 18,
      "preliminaryCard": 10,
      "earlyPreliminaryCard": 3
    }
  }
}
```

---

## 📱 Frontend Components

### Leaderboard Page (`/leaderboard`)

Features:
- Top 30 rankings table
- User's personal rank card (if logged in)
- "How to Earn" guide
- Rank badges and icons
- Player profiles with avatars
- Fan Coin counts with icons
- Level, Record, and Prestige stats

### Game Page Updates

Added section showing:
- Next 3 upcoming UFC events
- Event dates and names
- Coin earning opportunities per card
- Direct link to leaderboard
- Pro tips for maximizing earnings

---

## 💡 Strategy Guide

### Maximizing Fan Coins

**1. Choose Winners**
- Research fighter records
- Check recent form
- Consider matchup advantages

**2. Target High-Profile Fights**
- Main events worth 5 coins
- Co-main events worth 4 coins
- Balance risk vs reward

**3. Active Participation**
- Transfer before every major event
- Don't let opportunities expire
- Switch fighters between events

**4. Premium Benefits** (future)
- Early fighter selection
- Bonus coin multipliers
- Exclusive fighter access

### Leaderboard Climbing

**Path to Top 30:**
1. Transfer to a fighter (earn 100 coin bonus)
2. Win 10 main card fights (3 coins each = 30 coins)
3. Win 5 co-main events (4 coins each = 20 coins)
4. Win 2 main events (5 coins each = 10 coins)
5. **Total: ~160 coins = Top 30 range**

**Path to Top 10:**
- Consistently pick main event winners
- Participate in every major UFC event
- Maintain high win percentage

**Path to #1:**
- Win majority of main events over time
- Long-term consistency
- Strategic fighter selection

---

## 📈 Leaderboard Statistics

### Example Rankings (Hypothetical)

| Rank | Player | Fan Coins | Level | Record |
|------|--------|-----------|-------|--------|
| 🥇 1 | ChampMaker | 487 | 15 | 25-3 |
| 🥈 2 | UFCKing | 412 | 14 | 22-6 |
| 🥉 3 | FightPro | 389 | 13 | 20-5 |
| 4 | Striker99 | 345 | 12 | 18-7 |
| 5 | GroundGame | 322 | 11 | 19-4 |
| ... | ... | ... | ... | ... |
| 30 | NewbieJoe | 156 | 6 | 8-10 |

### Coin Distribution (Estimated)

- **Top 1%:** 400+ coins
- **Top 5%:** 250+ coins
- **Top 10%:** 180+ coins
- **Top 25%:** 120+ coins
- **Average:** 75 coins

---

## 🔮 Future Enhancements

### Phase 2
- [ ] In-app notifications for coin earnings
- [ ] Monthly leaderboard seasons
- [ ] Seasonal rewards for top players
- [ ] Achievement badges

### Phase 3
- [ ] Fan Coin marketplace
- [ ] Spend coins on energy refills
- [ ] Buy special training modes
- [ ] Unlock exclusive fighters early

### Phase 4
- [ ] Betting/wagering system
- [ ] Head-to-head challenges
- [ ] Tournament brackets
- [ ] Prize pools

---

## 🗄️ Database Collections

### UFCEvents Collection

```javascript
{
  _id: ObjectId,
  eventName: "UFC 300",
  eventDate: ISODate("2025-04-13T02:00:00Z"),
  location: "Las Vegas, NV",
  fightCard: {
    mainEvent: [...],
    coMainEvent: [...],
    mainCard: [...],
    preliminaryCard: [...],
    earlyPreliminaryCard: [...]
  },
  status: "completed",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### FanCoinTransactions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  firebaseUid: "abc123",
  amount: 5,
  type: "earned",
  source: "fight_win",
  fightDetails: {
    eventName: "UFC 300",
    eventId: ObjectId,
    fighterName: "Alex Pereira",
    fighterId: ObjectId,
    cardPosition: "mainEvent",
    result: "win"
  },
  balanceAfter: 125,
  description: "Won 5 Fan Coins - Alex Pereira victory...",
  createdAt: ISODate
}
```

---

## 🎯 Success Metrics

### User Engagement
- Event participation rate
- Average coins earned per user
- Leaderboard view frequency
- Fighter selection timing

### System Health
- Events processed per month
- Average processing time
- Transaction accuracy
- Coin distribution fairness

---

## 📞 Support & FAQ

**Q: When do I receive Fan Coins?**
A: Automatically after event results are processed (usually within 24-48 hours of event completion)

**Q: What if my fighter loses?**
A: No coins earned, but no penalty either. Try again with the next event!

**Q: Can I earn coins from multiple fights?**
A: Currently one fighter at a time, but you can switch between events

**Q: Do prelim fights count?**
A: Yes! All card positions earn coins, even early prelims (1 coin)

**Q: How often are events processed?**
A: Typically within 1-2 days after each UFC event

**Q: Can I lose Fan Coins?**
A: Not currently. Future marketplace features may allow spending coins

---

## 📝 Changelog

**Version 1.0.0** (November 2025)
- ✅ Initial Fan Coin system launch
- ✅ Top 30 leaderboard
- ✅ Event processing system
- ✅ Transaction history
- ✅ Fight card reward tiers

**Version 1.1.0** (Planned)
- [ ] Monthly season resets
- [ ] Marketplace for coin spending
- [ ] Enhanced event notifications
- [ ] Live event tracking

---

## 🎉 Conclusion

The Fan Coin system adds real-world UFC event integration to the game, rewarding players for strategic fighter selection and UFC knowledge. Climb the leaderboard, earn coins, and prove you're the ultimate UFC fan!

**Ready to dominate the leaderboard?** Start earning Fan Coins today! 🪙🏆

