# 🛠️ Code Audit — UFC Fan App (kurokuku.lol)

**Date:** 2026-06-29 · **Agent:** Coder (weekly run) · **Scope:** `backend/` (routes, middleware, utils — ~5.3k LOC) + `frontend/src` (~11.9k LOC in pages)

## Summary

The auth and economy hardening from prior runs is holding up well: `requireAuth` fails closed in production, `requireAdmin` is wired onto the admin coin/event endpoints, the slots/poker result endpoints run through `utils/coinGuard.js`, and last week's `/api/fighters/images` route-ordering fix is still in place. The working tree is clean (prior fixes were committed). This week's highest-impact finding is a **per-fight full-collection scan in the admin `process-event` coin payout** that grows as O(fights × all users) and re-runs the same query for every fight — it will get slow and DB-heavy as the user base grows. Beyond that, three findings from last week are still open and worth closing: the **forum list's N+1 + write-on-read** (which I fixed this run), the **news `/refresh` fail-open** when `ADMIN_TOKEN` is unset, and **missing validation/spoofable author on forum posts**. Rounding out the list: verbose PII logging on hot game endpoints, no frontend route code-splitting (plus 64 `console.log`s and no minify config shipping to prod), and lingering dead code. I applied two safe fixes this run (forum N+1/write-on-read, and a PII-leaking debug log); everything else is proposed for review.

## Issues

| # | Severity | Area | Issue | Status |
|---|----------|------|-------|--------|
| 1 | 🟠 High | Perf/Scale | `process-event` payout scans **all** `GameProgress` docs **per fight** (O(fights × users)), repeated populate | Proposed |
| 2 | 🟠 High | Perf/Correctness | Forum list GET did N+1 comment-count queries **and wrote to the DB on a read** | ✅ Fixed this run |
| 3 | 🟡 Medium | Security | `POST /api/news/refresh` fails **open** when `ADMIN_TOKEN` is unset | Proposed |
| 4 | 🟡 Medium | Security/Validation | Forum post + comment creation use `optionalAuth`, no length caps, spoofable `author` | Proposed |
| 5 | 🟡 Medium | Security/Hygiene | Verbose logging of full `req.user` (email/PII) + bodies on hot game endpoints | ✅ Partially fixed this run |
| 6 | 🟡 Medium | Perf | No route code-splitting; 64 `console.log`s + no Vite minify/drop config ship to prod | Proposed |
| 7 | 🟢 Low | Dead code | `TrainToUFC_FULL.jsx`, `App-NoAuth.jsx`, `test-firebase.js` unused; 17 stale `test-*.js` | Proposed |
| 8 | 🟢 Low | Perf | Four ~580 KB game PNGs (2.3 MB) statically imported into the JS bundle | Proposed |

---

## Detailed findings

### 1. 🟠 `process-event` does a full-collection scan per fight — `backend/routes/fancoins.js` (~line 107)

For each fight on a card, the admin payout handler queries **every** `GameProgress` document and `.populate()`s the fighter, then loops over all of them in JS to find matches:

```js
for (const fight of fights) {                 // ~per fight
  const usersWithWinner = await GameProgress.find({
    'currentFighter.isPlaceholder': false,
    'currentFighter.realFighterId': { $exists: true }
  }).populate('currentFighter.realFighterId');   // loads ALL users, every fight

  for (const gameProgress of usersWithWinner) {  // O(users) in JS
    const fighter = gameProgress.currentFighter.realFighterId;
    if (fighter && fighter.name === fight.winner) { /* award */ }
  }
}
```

A full PPV card has ~13 fights, so this is ~13 full table scans + 13× populate on the entire `GameProgress` collection, with name-matching done in application code. It's admin-only and infrequent, so it's not a live hot path — but it scales as O(fights × users) and will slow down (and spike Mongo load) as the user base grows. The match is also by `fighter.name` string equality, which is fragile.

**Why it matters:** Severity **High** for scalability/cost. One mistimed payout on a busy night could stall the event-processing request and hammer the DB.

**Proposed fix:** load candidate users **once** before the fight loop, indexed by fighter id, then resolve winners from that map. Better still, resolve `fight.winner` to a fighter `_id` and query by id rather than by name:

```js
// Once, before the loop:
const allProgress = await GameProgress.find({
  'currentFighter.isPlaceholder': false,
  'currentFighter.realFighterId': { $exists: true }
}).populate('currentFighter.realFighterId');

const byFighterName = new Map();        // name -> [gameProgress, ...]
for (const gp of allProgress) {
  const f = gp.currentFighter.realFighterId;
  if (f?.name) (byFighterName.get(f.name) || byFighterName.set(f.name, []).get(f.name)).push(gp);
}
// In the fight loop, just: (byFighterName.get(fight.winner) || []).forEach(award)
```

Touches coin-award logic, so flagged for human review rather than auto-applied.

### 2. 🟠 Forum list N+1 + write-on-read — `backend/routes/forums.js` (~line 47) *(FIXED)*

The forum list GET previously ran a `ForumComment.countDocuments()` **per forum** (N+1) and, worse, issued a `Forum.findByIdAndUpdate(...)` **on a GET** whenever the stored count differed — turning a read into N writes under concurrent traffic.

**Fix applied:** replaced the per-item recount with a single `ForumComment.aggregate([... $group ...])` over the whole page's forum ids, and removed the write entirely. The stored `commentCount` is already kept current by the add-comment handler's `$inc` (line ~230), so the read no longer needs to self-heal. One aggregation instead of N queries, zero writes on the read path. Verified with `node --check`.

```js
const forumIds = items.map(f => f._id);
const countAgg = await ForumComment.aggregate([
  { $match: { forumId: { $in: forumIds } } },
  { $group: { _id: '$forumId', count: { $sum: 1 } } },
]);
const countMap = new Map(countAgg.map(c => [String(c._id), c.count]));
// forumObj.commentCount = countMap.get(String(forum._id)) || 0;
```

### 3. 🟡 News `/refresh` fails open when `ADMIN_TOKEN` is unset — `backend/routes/news.js` (~line 210)

```js
const adminToken = req.headers['x-admin-token'];
if (ADMIN_TOKEN && adminToken !== ADMIN_TOKEN) {   // skipped entirely if ADMIN_TOKEN is falsy
  return res.status(403).json({ error: 'Forbidden' });
}
```

If `ADMIN_TOKEN` isn't set in the environment, the guard short-circuits and **anyone** can POST `/api/news/refresh` to force NewsAPI syncs — burning your NewsAPI quota and allowing arbitrary `query` injection. The intent ("protected by x-admin-token") silently degrades to "open."

**Proposed fix:** fail closed when the token is missing.

```js
if (!ADMIN_TOKEN) {
  console.error('🚨 /api/news/refresh disabled: ADMIN_TOKEN not configured');
  return res.status(503).json({ error: 'Refresh disabled — ADMIN_TOKEN not configured' });
}
if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

Confirm `ADMIN_TOKEN` is set on Render. Flagged for review (security/config-adjacent).

### 4. 🟡 Forum content: no validation, spoofable author — `backend/routes/forums.js` (POST `/` and `/:id/comments`)

Both creation endpoints use `optionalAuth`, accept an arbitrary client-supplied `author` string when no user is attached, and impose **no length limits** on `title`/`content`. A script can post unbounded payloads under any display name:

```js
author: req.user ? req.user.displayName : (author || 'Anonymous'),
// no maxlength on title/content; no rate limit
```

**Why it matters:** spam/impersonation vector and a storage-bloat / abuse risk on user-generated content.

**Proposed fix:** cap lengths (e.g. title ≤ 200, content ≤ 10 000 chars), trim, reject empties, and **never** trust a client `author` — fall back to `'Anonymous'` only, never to a user-supplied name. Consider a lightweight rate limit per IP/uid.

### 5. 🟡 Verbose PII logging on hot game endpoints — `backend/routes/game.js` *(PARTIALLY FIXED)*

`POST /api/game/train` (and a few siblings) logged the **entire `req.user` object** (including `email`) and request bodies on every call — PII in logs plus log-volume noise on a hot path.

**Fix applied:** removed `console.log('User:', req.user)` / the request-body dump at the top of `/train`. Other handlers in `game.js` and `train-to-ufc.js` still carry similar `console.log('Body:', req.body)` / user dumps — **proposed** to strip those too (or gate behind `if (process.env.NODE_ENV !== 'production')`).

### 6. 🟡 No frontend code-splitting; console logs + no minify config in prod build — `frontend/src/App.jsx`, `frontend/vite.config.js`

`App.jsx` statically imports all ~20 pages (including `Game.jsx` 1 944, `UFCSlots.jsx` 1 627, `PokerGame.jsx` 1 052 lines), so the entire app ships in one chunk — no `React.lazy`/`Suspense` anywhere. `vite.config.js` has no build tuning, and there are **64 `console.log`s** across `src` that ship to production.

**Proposed fix:** lazy-load route components and drop console in the build:

```js
// App.jsx
const Game = React.lazy(() => import('./pages/Game'));
// ...wrap <Routes> in <Suspense fallback={<Spinner/>}>

// vite.config.js
build: { outDir: 'dist', minify: 'esbuild' },
esbuild: { drop: ['console', 'debugger'] },
```

### 7. 🟢 Dead code + stale test scripts — `frontend/src/`, `backend/`

`frontend/src/pages/TrainToUFC_FULL.jsx` (761 lines), `frontend/src/App-NoAuth.jsx`, and `frontend/src/test-firebase.js` are **not imported anywhere** (verified by grep). I attempted to delete them this run but the sandbox lacks delete permission on the mounted folder, and an unattended run shouldn't trigger a delete-approval prompt — so this is left as a recommendation: remove them manually. Separately, the 17 `backend/test-*.js` scripts are **stale** — they're ad-hoc integration scripts (not unit tests), `npm test` isn't defined, and they error immediately on a clean checkout (`Cannot find module 'axios'` — `backend/node_modules` isn't present). Relocate to `backend/scripts/` or delete.

### 8. 🟢 Large unoptimized game images bundled — `frontend/src/assets/images/fighter_game/`

Four PNGs (~568–593 KB each, **2.3 MB total**) are imported as ES modules and processed into the build. **Proposed:** convert to WebP/AVIF (typically 70–90% smaller) and/or serve from `public/` or a CDN instead of the JS graph.

---

## Fixes applied this run

1. **#2 — `backend/routes/forums.js`:** replaced the N+1 `countDocuments()` per forum with a single `ForumComment.aggregate` over the page, and **removed the write-on-read** (`findByIdAndUpdate` on a GET). One query, zero writes on the read path. Verified with `node --check`.
2. **#5 — `backend/routes/game.js`:** removed the `console.log('User:', req.user)` / request-body dump at the top of `POST /train` that leaked email/PII into logs on every training request. Verified with `node --check`.

Neither touches auth, payments, Firebase rules, or deployment config. Changes are left in the working tree — **not committed or pushed.**

## Recommended next steps (in order)

1. **This week:** Fix #1 (`process-event` per-fight full scan) — load users once into a map; biggest scalability win. Review #3 (news `/refresh` fail-open) and confirm `ADMIN_TOKEN` is set on Render — small, high-value security close.
2. Add input validation + drop client-supplied `author` on forum create/comment (#4).
3. **Quick wins:** lazy-load routes + add `esbuild drop console` and `minify` to `vite.config.js` (#6); strip remaining PII/body logs in `game.js` / `train-to-ufc.js` (#5).
4. **Cleanup:** delete `TrainToUFC_FULL.jsx` / `App-NoAuth.jsx` / `test-firebase.js` and relocate the 17 `test-*.js` scripts out of `backend/` root (#7); convert game PNGs to WebP (#8).

*Generated by the Coder Agent. Next scheduled run: next Monday.*
