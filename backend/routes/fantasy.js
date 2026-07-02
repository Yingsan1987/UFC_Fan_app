const express = require('express');
const router = express.Router();
const FantasyEntry    = require('../models/FantasyEntry');
const UpcomingEvent   = require('../models/UpcomingEvent');
const UFCEvent        = require('../models/UFCEvent');
const GameProgress    = require('../models/GameProgress');
const FanCoinTransaction = require('../models/FanCoinTransaction');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// ── helpers ──────────────────────────────────────────────────────────────────

const METHODS = ['KO/TKO', 'Submission', 'Decision'];

// Normalize any free-text result method into one of our 3 buckets.
function normalizeMethod(method = '') {
  const m = String(method).toLowerCase();
  if (!m) return '';
  if (m.includes('tko') || m.includes('ko') || m.includes('knockout') || m.includes('punch') || m.includes('kick') || m.includes('strike')) return 'KO/TKO';
  if (m.includes('sub') || m.includes('tap') || m.includes('choke') || m.includes('lock') || m.includes('bar') || m.includes('triangle')) return 'Submission';
  if (m.includes('dec') || m.includes('points') || m.includes('unanimous') || m.includes('split') || m.includes('majority')) return 'Decision';
  return '';
}

// Legacy card-mode scoring (winner only, points vary by actual finish method).
function scoreMethodLegacy(method = '') {
  const m = method.toLowerCase();
  if (m.includes('ko') || m.includes('tko')) return 15;
  if (m.includes('submis'))                  return 13;
  return 10;
}

// New single-fight scoring: base 10 for the right winner, +5 for the right
// method, all multiplied by the player's confidence (1–5). Max 75 per fight.
function scorePick(pick, actualMethod) {
  const base = 10;
  const methodCorrect = !!pick.pickedMethod && normalizeMethod(actualMethod) === pick.pickedMethod;
  const conf = Math.min(5, Math.max(1, pick.confidence || 1));
  const points = (base + (methodCorrect ? 5 : 0)) * conf;
  return { points, methodCorrect };
}

// Entry-level coin payout, tuned for the confidence-scaled points.
function coinsFromPoints(points, totalPicks, correctPicks) {
  let coins = 0;
  if      (points >= 75) coins = 50;
  else if (points >= 55) coins = 35;
  else if (points >= 40) coins = 20;
  else if (points >= 25) coins = 12;
  else if (points >= 15) coins = 6;
  else if (points >= 10) coins = 3;
  if (correctPicks === totalPicks && totalPicks >= 3) coins += 25; // perfect card bonus
  return coins;
}

function pickKey(f1, f2) { return `${f1}||${f2}`; }

// Community pick split across every fight anyone has picked.
async function getCommunityMap() {
  const agg = await FantasyEntry.aggregate([
    { $unwind: '$picks' },
    { $group: {
        _id: { f1: '$picks.fighter1', f2: '$picks.fighter2' },
        total:   { $sum: 1 },
        f1votes: { $sum: { $cond: [{ $eq: ['$picks.pickedFighter', '$picks.fighter1'] }, 1, 0] } },
    }},
  ]);
  const map = {};
  agg.forEach(a => {
    if (!a._id.f1 || !a._id.f2) return;
    map[pickKey(a._id.f1, a._id.f2)] = { total: a.total, f1votes: a.f1votes };
  });
  return map;
}

// Badge definitions — derived from a user's cumulative stats.
const BADGE_DEFS = [
  { id: 'first_blood', emoji: '🩸', name: 'First Blood',  desc: 'Land your first correct pick', target: s => 1,  value: s => s.correct },
  { id: 'sharp',       emoji: '🎯', name: 'Sharpshooter', desc: '10 correct picks',            target: s => 10, value: s => s.correct },
  { id: 'oracle',      emoji: '🔮', name: 'Oracle',       desc: '25 correct picks',            target: s => 25, value: s => s.correct },
  { id: 'finisher',    emoji: '💥', name: 'Finisher',     desc: 'Nail the finish method 5×',   target: s => 5,  value: s => s.methodHits },
  { id: 'hot',         emoji: '🔥', name: 'Hot Streak',   desc: '3 correct in a row',          target: s => 3,  value: s => s.best },
  { id: 'onfire',      emoji: '🚀', name: 'On Fire',      desc: '5 correct in a row',          target: s => 5,  value: s => s.best },
  { id: 'unstoppable', emoji: '👑', name: 'Unstoppable',  desc: '10 correct in a row',         target: s => 10, value: s => s.best },
];

function computeBadges(stats) {
  return BADGE_DEFS.map(b => {
    const target = b.target(stats);
    const value  = b.value(stats);
    return {
      id: b.id, emoji: b.emoji, name: b.name, desc: b.desc,
      earned: value >= target,
      progress: Math.min(value, target),
      target,
    };
  });
}

// ── GET /api/fantasy/next-fight ───────────────────────────────────────────────
// The star of the show: the soonest upcoming fights, enriched with community
// pick % and (if signed in) whether the user has already picked each one.
router.get('/next-fight', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 30);

    const fights = await UpcomingEvent.find({
      status: { $ne: 'completed' },
      'red_fighter.name':  { $exists: true, $nin: [null, ''] },
      'blue_fighter.name': { $exists: true, $nin: [null, ''] },
    }).lean();

    // Sort by event date ascending (soonest first); string dates parsed leniently.
    fights.sort((a, b) => {
      const da = new Date(a.event_date).getTime() || Infinity;
      const db = new Date(b.event_date).getTime() || Infinity;
      return da - db;
    });

    const community = await getCommunityMap();

    // Which fights has this user already picked?
    let pickedSet = new Set();
    if (req.user) {
      const entries = await FantasyEntry.find({ firebaseUid: req.user.uid }).lean();
      entries.forEach(e => (e.picks || []).forEach(p => pickedSet.add(pickKey(p.fighter1, p.fighter2))));
    }

    const out = fights.slice(0, limit).map(f => {
      const f1 = f.red_fighter?.name || '';
      const f2 = f.blue_fighter?.name || '';
      const c = community[pickKey(f1, f2)] || { total: 0, f1votes: 0 };
      const f1Pct = c.total ? Math.round((c.f1votes / c.total) * 100) : 50;
      return {
        eventName:   f.event_title || 'UFC Event',
        eventDate:   f.event_date  || '',
        location:    f.event_location || '',
        fighter1:    f1,
        fighter2:    f2,
        weightClass: f.weight_class || 'Catchweight',
        red_profile:  f.red_fighter?.profile_link  || null,
        blue_profile: f.blue_fighter?.profile_link || null,
        community: { total: c.total, f1Pct, f2Pct: 100 - f1Pct },
        alreadyPicked: pickedSet.has(pickKey(f1, f2)),
      };
    });

    res.json({ fights: out });
  } catch (err) {
    console.error('Fantasy next-fight error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/fantasy/pick ────────────────────────────────────────────────────
// Submit (or update, before the fight resolves) a single-fight prediction:
// { eventName, eventDate, fighter1, fighter2, weightClass, pickedFighter, pickedMethod, confidence }
router.post('/pick', requireAuth, async (req, res) => {
  try {
    const {
      eventName, eventDate, fighter1, fighter2, weightClass,
      pickedFighter, pickedMethod, confidence,
    } = req.body;

    if (!eventName || !fighter1 || !fighter2 || !pickedFighter) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (![fighter1, fighter2].includes(pickedFighter)) {
      return res.status(400).json({ error: 'pickedFighter must be one of the two fighters' });
    }

    const method = METHODS.includes(pickedMethod) ? pickedMethod : '';
    const conf   = Math.min(5, Math.max(1, parseInt(confidence) || 3));

    let entry = await FantasyEntry.findOne({ firebaseUid: req.user.uid, eventName });
    if (!entry) {
      entry = new FantasyEntry({
        firebaseUid: req.user.uid, eventName, eventDate: eventDate || '',
        picks: [], status: 'pending',
      });
    }

    const existing = entry.picks.find(p => p.fighter1 === fighter1 && p.fighter2 === fighter2);
    if (existing) {
      if (existing.result !== 'pending') {
        return res.status(400).json({ error: 'This fight has already been scored' });
      }
      existing.pickedFighter = pickedFighter;
      existing.pickedMethod  = method;
      existing.confidence    = conf;
      if (weightClass) existing.weightClass = weightClass;
    } else {
      entry.picks.push({
        fighter1, fighter2,
        weightClass: weightClass || '',
        pickedFighter, pickedMethod: method, confidence: conf,
        result: 'pending', pointsEarned: 0,
      });
    }

    if (entry.status === 'scored') entry.status = 'partial';
    await entry.save();
    res.json({ ok: true, entry });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Duplicate entry' });
    console.error('Fantasy pick error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fantasy/stats ────────────────────────────────────────────────────
// Streak, best streak, accuracy, coins, and badge progress for the signed-in user.
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const gp = await GameProgress.findOne({ firebaseUid: uid }).lean();
    const entries = await FantasyEntry.find({ firebaseUid: uid }).lean();

    let total = 0, correct = 0, methodHits = 0, pending = 0, coins = 0;
    entries.forEach(e => {
      coins += e.fanCoinsEarned || 0;
      (e.picks || []).forEach(p => {
        if (p.result === 'pending') { pending++; return; }
        total++;
        if (p.result === 'correct') correct++;
        if (p.methodCorrect) methodHits++;
      });
    });

    const stats = {
      currentStreak: gp?.fantasyStreak || 0,
      bestStreak:    gp?.fantasyBestStreak || 0,
      totalScored:   total,
      correct,
      methodHits,
      pending,
      coins,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
    };
    stats.badges = computeBadges({ correct, methodHits, best: stats.bestStreak });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fantasy/contests ─────────────────────────────────────────────────
// Full-card mode (secondary): upcoming events merged from both event collections.
router.get('/contests', async (req, res) => {
  try {
    const eventMap = {};

    const fights = await UpcomingEvent.find().lean();
    fights.forEach(fight => {
      const key = fight.event_title;
      if (!key) return;
      if (!eventMap[key]) {
        eventMap[key] = {
          eventName: key, eventDate: fight.event_date, location: fight.event_location,
          fights: [], totalFights: 0, completedFights: 0,
        };
      }
      eventMap[key].fights.push({
        fighter1:    fight.red_fighter?.name  || '',
        fighter2:    fight.blue_fighter?.name || '',
        weightClass: fight.weight_class       || '',
        status:      fight.status             || 'upcoming',
        winner:      fight.winner             || null,
        method:      fight.method             || null,
      });
      eventMap[key].totalFights++;
      if (fight.status === 'completed') eventMap[key].completedFights++;
    });

    const ufcEvents = await UFCEvent.find().lean();
    ufcEvents.forEach(event => {
      const key = event.eventName;
      if (!key || eventMap[key]) return;
      const cardSections = [
        ...(event.fightCard?.mainEvent            || []),
        ...(event.fightCard?.coMainEvent          || []),
        ...(event.fightCard?.mainCard             || []),
        ...(event.fightCard?.preliminaryCard      || []),
        ...(event.fightCard?.earlyPreliminaryCard || []),
      ];
      if (cardSections.length === 0) return;
      const mapped = cardSections
        .filter(f => f.fighter1 || f.fighter2)
        .map(f => ({
          fighter1:    f.fighter1 || '',
          fighter2:    f.fighter2 || '',
          weightClass: f.weightClass || '',
          status:      f.winner ? 'completed' : (event.status || 'upcoming'),
          winner:      f.winner  || null,
          method:      f.method  || null,
        }));
      if (mapped.length === 0) return;
      const dateStr = event.eventDate
        ? (event.eventDate instanceof Date ? event.eventDate.toISOString().split('T')[0] : String(event.eventDate))
        : '';
      eventMap[key] = {
        eventName: key, eventDate: dateStr, location: event.location || '',
        fights: mapped, totalFights: mapped.length,
        completedFights: mapped.filter(f => f.status === 'completed').length,
      };
    });

    const events = Object.values(eventMap)
      .filter(e => e.fights.length > 0)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    res.json(events);
  } catch (err) {
    console.error('Fantasy contests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fantasy/my-entries ───────────────────────────────────────────────
router.get('/my-entries', requireAuth, async (req, res) => {
  try {
    const entries = await FantasyEntry.find({ firebaseUid: req.user.uid })
      .sort({ submittedAt: -1 })
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/fantasy/submit ──────────────────────────────────────────────────
// Full-card mode submit (winner-only picks, min 3). Kept for the secondary flow.
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { eventName, eventDate, picks } = req.body;
    if (!eventName || !Array.isArray(picks) || picks.length < 3) {
      return res.status(400).json({ error: 'Must pick at least 3 fights' });
    }
    const existing = await FantasyEntry.findOne({ firebaseUid: req.user.uid, eventName });
    if (existing) {
      return res.status(400).json({ error: 'You already submitted picks for this event' });
    }
    const entry = new FantasyEntry({
      firebaseUid: req.user.uid, eventName, eventDate,
      picks: picks.map(p => ({
        fighter1: p.fighter1, fighter2: p.fighter2, pickedFighter: p.pickedFighter,
        weightClass: p.weightClass || '',
        pickedMethod: METHODS.includes(p.pickedMethod) ? p.pickedMethod : '',
        confidence: Math.min(5, Math.max(1, parseInt(p.confidence) || 1)),
        result: 'pending', pointsEarned: 0,
      })),
      status: 'pending',
    });
    await entry.save();
    res.json(entry);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Already submitted picks for this event' });
    console.error('Fantasy submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/fantasy/score ───────────────────────────────────────────────────
// Scores any pending picks against completed fight results, updates streak,
// and pays out Fan Coins as each entry's picks all resolve.
router.post('/score', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const pendingEntries = await FantasyEntry.find({
      firebaseUid: uid,
      status: { $in: ['pending', 'partial'] },
    });

    // Load streak state once; update as picks resolve.
    let gp = await GameProgress.findOne({ firebaseUid: uid });
    let streak     = gp?.fantasyStreak || 0;
    let bestStreak = gp?.fantasyBestStreak || 0;

    let totalCoinsAwarded = 0;
    const results = [];

    for (const entry of pendingEntries) {
      let pendingCount = 0;

      for (const pick of entry.picks) {
        if (pick.result !== 'pending') continue;

        const fight = await UpcomingEvent.findOne({
          'red_fighter.name':  pick.fighter1,
          'blue_fighter.name': pick.fighter2,
          status: 'completed',
          winner: { $exists: true, $nin: [null, ''] },
        }).lean();

        if (!fight || !fight.winner) { pendingCount++; continue; }

        const winner = fight.winner;
        pick.method = fight.method;

        if (winner === pick.pickedFighter) {
          pick.result = 'correct';
          if (pick.pickedMethod) {
            const { points, methodCorrect } = scorePick(pick, fight.method);
            pick.pointsEarned  = points;
            pick.methodCorrect = methodCorrect;
          } else {
            pick.pointsEarned = scoreMethodLegacy(fight.method); // legacy card pick
          }
          streak += 1;
          if (streak > bestStreak) bestStreak = streak;
        } else if ((winner || '').toLowerCase().includes('draw') || fight.result === 'draw') {
          pick.result = 'draw';
          pick.pointsEarned = 2;
          // draws don't break or extend a streak
        } else {
          pick.result = 'incorrect';
          pick.pointsEarned = 0;
          streak = 0;
        }
      }

      entry.totalPoints = entry.picks.reduce((s, p) => s + (p.pointsEarned || 0), 0);
      const correctPicks = entry.picks.filter(p => p.result === 'correct').length;

      if (pendingCount === 0) {
        entry.status = 'scored';
        const coins = coinsFromPoints(entry.totalPoints, entry.picks.length, correctPicks);
        if (coins > 0 && gp) {
          gp.fanCoin = (gp.fanCoin || 0) + coins;
          await new FanCoinTransaction({
            userId: gp.userId, firebaseUid: uid, amount: coins,
            type: 'earned', source: 'other', balanceAfter: gp.fanCoin,
            description: `Fantasy Picks: ${entry.eventName} — ${entry.totalPoints} pts`,
          }).save();
          entry.fanCoinsEarned = coins;
          totalCoinsAwarded += coins;
        }
      } else {
        entry.status = 'partial';
      }

      await entry.save();
      results.push(entry.toObject());
    }

    // Persist updated streak + any coin gains.
    if (gp) {
      gp.fantasyStreak = streak;
      gp.fantasyBestStreak = bestStreak;
      await gp.save();
    }

    res.json({
      scored: results.length,
      totalCoinsAwarded,
      currentStreak: streak,
      bestStreak,
      entries: results,
    });
  } catch (err) {
    console.error('Fantasy score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fantasy/leaderboard/:eventName ───────────────────────────────────
router.get('/leaderboard/:eventName', async (req, res) => {
  try {
    const eventName = decodeURIComponent(req.params.eventName);
    const entries = await FantasyEntry.find({ eventName, status: 'scored' })
      .sort({ totalPoints: -1 })
      .limit(20)
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
