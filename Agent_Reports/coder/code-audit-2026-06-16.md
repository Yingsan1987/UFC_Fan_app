# 🛠️ Code Audit — UFC Fan App (kurokuku.lol)

**Date:** 2026-06-16 · **Agent:** Coder (first pass) · **Scope:** `frontend/src` (~15.5k LOC) + `backend/`

## Summary

The app is feature-rich and well-organized at the routing level, but the **fan-coin economy is not server-authoritative** — the two highest-impact findings let a user mint unlimited coins and (depending on production config) impersonate any account. Because fan coins are sold via Stripe, these are direct revenue/integrity risks and should be fixed before any growth push. None of the top issues were auto-fixed this run: all sit in auth/payments/economy code, which this agent flags for human review rather than editing. Lower-severity cleanup (logging, dead code, oversized components) is safe to tackle anytime.

## Issues

| # | Severity | Area | Issue |
|---|---|---|---|
| 1 | 🔴 Critical | Economy | Client controls `coinDelta` on poker/slots results → unlimited coins |
| 2 | 🔴 Critical | Auth | `requireAuth` trusts **unverified** JWT if Firebase Admin env var is missing |
| 3 | 🟠 High | Authz | "Admin" endpoints (`process-event`, `events/create`) have no admin check |
| 4 | 🟠 High | Config | Socket.IO `origin: "*"`; Express CORS falls back to `"*"` with credentials |
| 5 | 🟡 Medium | Leak | `firebase.js` logs the API key value to the browser console |
| 6 | 🟡 Medium | Perf/Maint | Oversized page components (Game.jsx 1,944 lines, UFCSlots 1,627, Poker 1,052) |
| 7 | 🟢 Low | Dead code | `TrainToUFC.jsx` + `TrainToUFC_FULL.jsx` duplication; ~28 debug/test scripts in `backend/` root |

---

## Detailed findings

### 1. 🔴 Client-controlled coin balance — `backend/routes/fancoins.js`

`/poker-result`, `/slots-result` (and `/poker-rebuy`) take a `coinDelta` straight from the request body and add it to the balance:

```js
// routes/fancoins.js  (~line 326 & 362)
const { coinDelta } = req.body;
if (typeof coinDelta !== 'number' || isNaN(coinDelta)) { return res.status(400)... }
gameProgress.fanCoin = Math.max(0, oldBalance + coinDelta);   // ⚠️ trusts the client
```

Any logged-in user can `POST /api/fancoins/slots-result {"coinDelta": 1000000}` and instantly own a million coins — devaluing the Stripe-purchased currency.

**Fix (make the server authoritative):** the client should send only the *play action* (bet amount, spin seed/round id), and the server computes the outcome and the delta. Minimum viable hardening now:
- Cap and validate per-request delta server-side (e.g. reject `|coinDelta|` above the max possible for one round).
- Verify a bet was actually placed/deducted first (atomic debit on bet, credit on resolved result).
- Rate-limit these endpoints per user.

### 2. 🔴 Unverified token fallback — `backend/middleware/authMiddleware.js`

```js
// requireAuth, when firebaseInitialized === false:
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
req.user = { uid: payload.user_id || payload.sub, email: payload.email, ... }; // ⚠️ no signature check
```

If `FIREBASE_SERVICE_ACCOUNT` is not set in the Render production env, every protected route accepts a **forged** token — an attacker just base64-encodes `{"user_id":"<victim>"}`. Combined with #1, that's full account + economy compromise.

**Fix:** make the unverified path refuse to run unless `NODE_ENV !== 'production'`; in production, fail closed (`return res.status(401)`) when Firebase Admin isn't initialized. Then confirm `FIREBASE_SERVICE_ACCOUNT` is actually set on Render.

### 3. 🟠 Missing admin authorization — `backend/routes/fancoins.js`

`POST /process-event/:eventId` (awards coins for a whole event) and `POST /events/create` are commented "Admin endpoint" but are gated only by `requireAuth`. Any authenticated user can trigger event processing/coin payouts or create events.

**Fix:** add an `isAdmin` check (custom Firebase claim or an allow-list of admin UIDs) as a second middleware on these routes.

### 4. 🟠 Permissive CORS — `backend/server.js`

```js
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors({ origin: (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*'), credentials: true }));
```

`origin: "*"` on the socket server, and an Express fallback to `"*"` *with* `credentials: true`, is both insecure and (for the credentialed case) browser-rejected.

**Fix:** require `FRONTEND_URL` in production and reuse the same allow-list for Socket.IO; never pair `"*"` with `credentials: true`.

### 5. 🟡 API key logged to console — `frontend/src/config/firebase.js`

Lines ~17–18 print `firebaseConfig.apiKey` to the console. (A Firebase web API key is not strictly secret, but logging it is noise and a bad signal in a public app.) Part of a broader **65 `console.log` calls in `frontend/src`** that should be stripped from production builds (e.g. Vite `esbuild.drop: ['console']`).

### 6. 🟡 Oversized components

`Game.jsx` (1,944), `UFCSlots.jsx` (1,627), `PokerGame.jsx` (1,052) are large enough to hurt re-render performance and maintainability. Recommend extracting sub-components and memoizing hot paths. These also dominate the JS bundle — candidates for `React.lazy` route-splitting.

### 7. 🟢 Dead code & repo clutter

`TrainToUFC.jsx` and `TrainToUFC_FULL.jsx` appear to be two versions of the same page — confirm which is live and delete the other. ~28 `test-*.js` / `debug-*.js` scripts live in `backend/` root; move to `backend/scripts/` or remove to keep the deploy surface clean.

---

## Fixes applied this run

**None.** Every top finding (1–4) lives in authentication, payments, or the coin economy — areas this agent is instructed to flag for your review rather than edit automatically. Items 5–7 are safe and I can apply them next run (or now) if you say go.

## Recommended next steps (in order)

1. **This week:** Fix #1 and #2 together — they compound. Confirm `FIREBASE_SERVICE_ACCOUNT` is set on Render.
2. Add the admin check (#3) and tighten CORS (#4) in the same PR.
3. **Quick wins:** drop console logs in the Vite build (#5), remove the duplicate Train page (#7).
4. **Backlog:** split the three big game components (#6) — hand to the Coder Agent as a focused task.

*Generated by the Coder Agent. Next scheduled run: Monday 8am.*
