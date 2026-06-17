// coinGuard.js
// Defense-in-depth for the client-reported coin result endpoints (slots/poker).
//
// Context: /slots-result and /poker-result historically added a client-supplied
// `coinDelta` straight to the user's balance, so a crafted request could mint
// unlimited coins (see Agent_Reports/coder/code-audit-2026-06-16.md, finding #1).
//
// This module bounds and rate-limits those deltas so the endpoints can no longer
// be abused for runaway gains, while remaining backward-compatible with the
// existing frontend (it still POSTs { coinDelta }).
//
// NOTE: This is a mitigation, not a full fix. The recommended follow-up is a
// server-authoritative bet/result model where the server computes outcomes.
//
// Limits are intentionally generous so normal play is never blocked. Tune via env:
//   COIN_MAX_PER_REQUEST  (default 100000)
//   COIN_DAILY_NET_CAP    (default 500000)
//   COIN_RATE_MAX         (default 120 requests / minute / game / user)

const MAX_PER_REQUEST = parseInt(process.env.COIN_MAX_PER_REQUEST || '100000', 10);
const DAILY_NET_GAIN_CAP = parseInt(process.env.COIN_DAILY_NET_CAP || '500000', 10);
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = parseInt(process.env.COIN_RATE_MAX || '120', 10);

// In-memory state. Adequate for a single-instance deployment (current Render setup).
// For multi-instance scaling, back these with Redis.
const rateBuckets = new Map(); // `${game}:${uid}` -> { count, resetAt }
const dailyGain = new Map();   // uid -> { net, resetAt }

function withinRate(game, uid) {
  const key = `${game}:${uid}`;
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(key, b);
  }
  b.count += 1;
  return b.count <= RATE_MAX;
}

function withinDailyGain(uid, delta) {
  const now = Date.now();
  let d = dailyGain.get(uid);
  if (!d || now > d.resetAt) {
    d = { net: 0, resetAt: now + 24 * 60 * 60 * 1000 };
    dailyGain.set(uid, d);
  }
  if (delta <= 0) return true; // only positive gains count toward the cap
  if (d.net + delta > DAILY_NET_GAIN_CAP) return false;
  d.net += delta;
  return true;
}

/**
 * Validate a client-reported coin delta for a game.
 * @param {string} game  'slots' | 'poker'
 * @param {string} uid   authenticated user id (req.user.uid)
 * @param {*} raw        client-supplied coinDelta
 * @returns {{ok: true, delta: number} | {ok: false, status: number, message: string}}
 */
function validateCoinDelta(game, uid, raw) {
  if (!uid) return { ok: false, status: 401, message: 'Authentication required' };
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return { ok: false, status: 400, message: 'Invalid coinDelta' };
  }
  const delta = Math.trunc(raw); // coins are whole numbers
  if (Math.abs(delta) > MAX_PER_REQUEST) {
    return { ok: false, status: 400, message: 'coinDelta exceeds the per-request limit' };
  }
  if (!withinRate(game, uid)) {
    return { ok: false, status: 429, message: 'Too many requests — slow down' };
  }
  if (!withinDailyGain(uid, delta)) {
    return { ok: false, status: 429, message: 'Daily coin limit reached' };
  }
  return { ok: true, delta };
}

module.exports = { validateCoinDelta };
