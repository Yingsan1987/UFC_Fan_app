# 🛠️ Code Audit — UFC Fan App (kurokuku.lol)

**Date:** 2026-06-22 · **Agent:** Coder (weekly run) · **Scope:** `frontend/src` (~15.6k LOC) + `backend/` routes, middleware, utils

## Summary

Last week's top findings have largely been addressed: the unverified-token auth fallback now fails closed in production, CORS reads an allow-list, a `requireAdmin` middleware was added and wired onto the admin coin/event endpoints, and the slots/poker coin endpoints now run through `utils/coinGuard.js` for bounding and rate-limiting. Good progress. This week's highest-impact find is a **route-ordering bug that makes `GET /api/fighters/images` permanently unreachable** (it's shadowed by `/:id`), which breaks fighter images on the Events page. After that, the main themes are a forum-list endpoint that does N+1 queries *and writes to the DB during a GET*, a couple of fail-open admin checks, missing input validation on user-generated forum content, and the still-monolithic frontend bundle (no route splitting). I applied two safe fixes this run (the route-ordering bug and removal of two bogus npm dependencies); everything else is proposed for review.

## Issues

| # | Severity | Area | Issue | Status |
|---|----------|------|-------|--------|
| 1 | 🟠 High | Bug | `GET /api/fighters/images` shadowed by `/:id` → endpoint unreachable, fighter images break | ✅ Fixed this run |
| 2 | 🟠 High | Perf/Correctness | Forum list GET does N+1 comment-count queries **and writes to DB on a read** | Proposed |
| 3 | 🟡 Medium | Security | `POST /api/news/refresh` fails **open** when `ADMIN_TOKEN` is unset | Proposed |
| 4 | 🟡 Medium | Security/Validation | Forum post + comment creation use `optionalAuth`, no length caps, spoofable `author` | Proposed |
| 5 | 🟡 Medium | Perf | No route-level code splitting — entire app (incl. 1.9k/1.6k/1.0k-line pages) in one bundle | Proposed |
| 6 | 🟡 Medium | Dependency hygiene | Bogus `fs` + `path` npm deps in `backend/package.json` (they're Node built-ins) | ✅ Fixed this run |
| 7 | 🟢 Low | Perf | Four ~580 KB PNGs (2.3 MB) statically imported into the JS bundle | Proposed |
| 8 | 🟢 Low | Dead code / tests | Unused files + 19 ad-hoc `test-*/debug-*` scripts in `backend/` root; no real test suite | Proposed |

---

## Detailed findings

### 1. 🟠 Route shadowing makes `/api/fighters/images` unreachable — `backend/routes/fighters.js` *(FIXED)*

The `/images` route was registered **after** the dynamic `/:id` route:

```js
router.get('/:id',    ...)   // line ~1175 (registered first)
router.get('/images', ...)   // line ~1222 (never reached)
```

Express matches in registration order, so a request to `GET /api/fighters/images` is captured by `/:id` with `req.params.id === "images"`. That calls `Fighter.findById("images")`, which throws a Mongoose `CastError` and returns **500** — the images endpoint can never run. The Events page that depends on it silently loses fighter images.

**Fix applied:** moved the `/images` handler above `/:id`, added an explanatory comment, and removed a stray debug `console.log` in the `/:id` handler (`"This should NOT happen for api-status!"`). Verified with `node --check`. Route order is now `/images` (1177) → `/:id` (1188).

### 2. 🟠 N+1 queries and a write-on-read in the forum list — `backend/routes/forums.js` (~line 36)

```js
const forumsWithUserState = await Promise.all(items.map(async forum => {
  const forumObj = forum.toObject();
  const actualCommentCount = await ForumComment.countDocuments({ forumId: forum._id });   // N+1
  forumObj.commentCount = actualCommentCount;
  if (forum.commentCount !== actualCommentCount) {
    await Forum.findByIdAndUpdate(forum._id, { commentCount: actualCommentCount });        // ⚠️ write during GET
  }
  ...
}));
```

For a 10-item page this fires up to **10 `countDocuments` reads + up to 10 `findByIdAndUpdate` writes** on every list load. Writing inside a GET makes the endpoint non-idempotent, adds latency, and can race under concurrent loads. It's also the hottest endpoint on the Forums page.

**Proposed fix:** compute all counts in one aggregation and drop the write entirely (let counts be reconciled on comment create/delete instead):

```js
const ids = items.map(f => f._id);
const counts = await ForumComment.aggregate([
  { $match: { forumId: { $in: ids } } },
  { $group: { _id: '$forumId', n: { $sum: 1 } } },
]);
const countMap = new Map(counts.map(c => [String(c._id), c.n]));
// ...forumObj.commentCount = countMap.get(String(forum._id)) || 0;  // no DB write here
```

### 3. 🟡 News refresh fails open without an admin token — `backend/routes/news.js` (~line 210)

```js
const adminToken = req.headers['x-admin-token'];
if (ADMIN_TOKEN && adminToken !== ADMIN_TOKEN) {   // skipped entirely if ADMIN_TOKEN is unset
  return res.status(403).json({ error: 'Forbidden' });
}
```

If `ADMIN_TOKEN` isn't set in the environment, the guard is bypassed and **anyone** can `POST /api/news/refresh` with `force:true`, repeatedly burning the (rate-limited, paid) NewsAPI quota. Same fail-open shape that finding #2 from last week's auth middleware had — worth fixing consistently.

**Proposed fix:** fail closed when the token is missing in production:

```js
if (!ADMIN_TOKEN) {
  if (process.env.NODE_ENV === 'production')
    return res.status(503).json({ error: 'Admin token not configured' });
} else if (adminToken !== ADMIN_TOKEN) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 4. 🟡 Forum content: open posting, no length limits, spoofable author — `backend/routes/forums.js` (~line 9)

`POST /api/forums` and the comment endpoints use `optionalAuth`, so unauthenticated clients can create content (spam vector). `title`/`content` are only checked for presence — no max length, so a client can store arbitrarily large documents. For anonymous posts the `author` string is taken straight from the request body and trusted.

React escapes rendered text by default and I found **no `dangerouslySetInnerHTML`** in the frontend, so stored XSS isn't currently exploitable — but the abuse/DoS surface remains.

**Proposed fix:** require auth for creation (swap `optionalAuth` → `requireAuth`), cap lengths (e.g. title ≤ 150, content ≤ 10 000), and stop reading `author` from the body for authenticated users (already derived from `req.user.displayName`).

### 5. 🟡 No route-level code splitting — `frontend/src/App.jsx`

Every page is statically imported at the top of `App.jsx` (no `React.lazy` / `Suspense` anywhere in `frontend/src`). The three largest pages alone — `Game.jsx` (1,944 lines), `UFCSlots.jsx` (1,627), `PokerGame.jsx` (1,052) — plus `framer-motion`, `firebase`, `html2canvas`, and `emoji-picker-react` all land in the initial bundle, so a user hitting the Home page downloads the slots and poker engines too.

**Proposed fix:** lazy-load route components and wrap `<Routes>` in `<Suspense>`:

```js
const Game = React.lazy(() => import('./pages/Game'));
const UFCSlots = React.lazy(() => import('./pages/UFCSlots'));
const PokerGame = React.lazy(() => import('./pages/PokerGame'));
// <Suspense fallback={<Spinner/>}><Routes>...</Routes></Suspense>
```

Pair with Vite `build.rollupOptions.output.manualChunks` to split vendor libs, and `esbuild.drop: ['console']` to strip the **108 `console.*` calls** in `frontend/src` from production builds.

### 6. 🟡 Bogus `fs` / `path` npm dependencies — `backend/package.json` *(FIXED)*

```json
"fs": "0.0.1-security",
"path": "^0.12.7",
```

`fs` and `path` are Node **built-in** modules; the code correctly does `require('fs')` / `require('path')`. The npm packages of the same name are unnecessary — `fs@0.0.1-security` is a namespace placeholder, and depending on a public `path` package is a known supply-chain footgun (typo/shadow risk).

**Fix applied:** removed both lines from `dependencies`. `package.json` re-validated as JSON. (Run `npm install` to refresh the lockfile when convenient.)

### 7. 🟢 Large unoptimized images bundled — `frontend/src/assets/images/fighter_game/`

Four PNGs (~568–593 KB each, **2.3 MB total**) are imported as ES modules, so they're processed into the build output. **Proposed:** convert to WebP/AVIF (typically 70–90% smaller) and/or serve from `public/` or a CDN rather than importing into the JS graph.

### 8. 🟢 Dead code, clutter, and no real test suite — `backend/`, `frontend/src/`

`frontend/src/pages/TrainToUFC_FULL.jsx` (761 lines), `frontend/src/App-NoAuth.jsx` (380), and `frontend/src/test-firebase.js` are not imported anywhere — safe to delete after a glance. In `backend/` root there are **19** `test-*.js` / `debug-*.js` scripts; these are ad-hoc integration scripts that hit live/deployed endpoints (not unit tests), `npm test` isn't even defined, and they error immediately on a clean checkout (`Cannot find module 'axios'` before install). They're stale artifacts — move to `backend/scripts/` or delete to shrink the deploy surface.

---

## Fixes applied this run

1. **#1 — `backend/routes/fighters.js`:** reordered `GET /images` above `GET /:id` so the images endpoint is reachable again; removed a stray debug `console.log`. Verified with `node --check`.
2. **#6 — `backend/package.json`:** removed the bogus `fs` and `path` dependencies. Re-validated as JSON.

Neither touches auth, payments, Firebase rules, or deployment config. Changes are left in the working tree — **not committed or pushed.** No auth/economy code was modified this run; those findings (#2–#4) are flagged for your review.

## Recommended next steps (in order)

1. **This week:** Fix #2 (forum N+1 + write-on-read) — easy win, real latency reduction on a hot path.
2. Close the two fail-open gaps: #3 (news refresh) and #4 (forum auth + length caps) in one small PR; confirm `ADMIN_TOKEN` is set on Render.
3. **Quick wins:** lazy-load routes + drop console logs in the Vite build (#5); convert the four game PNGs to WebP (#7).
4. **Cleanup:** delete the unused `TrainToUFC_FULL.jsx` / `App-NoAuth.jsx` / `test-firebase.js`, and relocate the 19 `test-*/debug-*` scripts out of `backend/` root (#8).
5. Run `npm install` in `backend/` to refresh the lockfile after the dependency removal.

*Generated by the Coder Agent. Next scheduled run: next Monday.*
