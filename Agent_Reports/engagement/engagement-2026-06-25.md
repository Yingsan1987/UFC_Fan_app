# 🎮 Engagement & Fun Scorecard — UFC Fan App (kurokuku.lol)

**Date:** 2026-06-25 · **Agent:** Engagement Tester (week 3) · **Method:** code + UX review of all pages and game components, reasoned across four personas (hardcore bettor, casual fan, competitive gamer, lapsed user). Compared against `engagement-2026-06-18.md` and the `2026-06-16` baseline.

## What changed since last week

**Nothing shipped.** The latest commit in the repo is still `1b97000` (June 17, "Harden coin economy + auth") — the same one the week-2 report already credited. No commits landed in the last seven days. I verified the absence of every prescribed feature directly in the code:

- **Daily-login streak / daily reward:** no `dailyReward`, `daily-login`, `claimDaily`, or `streak`-based earn type anywhere in `backend/routes/fancoins.js`. The only `streak` references remain in-game (slots/Train-to-UFC), not a global return loop.
- **Daily missions:** none. Every `mission` hit in the codebase is the substring in *sub**mission*** (the MMA move) — there is no missions feature.
- **Predictions reward tie-in:** `Prediction.jsx` still has **zero** `coin`/`reward`/`fancoin` references. Predicting earns nothing.
- **Notifications / push:** `firebase.js` imports `getAuth` and `GoogleAuthProvider` only — it's auth, not messaging. No FCM, no web-push, no email re-engagement.
- **Onboarding:** no `onboarding`/`tutorial`/`walkthrough` anywhere in the frontend.
- **Global leaderboard:** still siloed to `train-to-ufc/leaderboard`. No app-wide ranking.

### The fight-week window closed unused

Last week's report made one time-sensitive call: ship a minimal reward-tied prediction for **UFC Vegas 119 (Saturday, June 20)** to ride a traffic spike that was already arriving. **That experiment was not shipped, and the event has now passed.** The single most leverage-positive, calendar-driven opportunity of the cycle was missed with no code change. This is the most important fact in this week's report: the app didn't get worse, but it spent its biggest natural traffic event with nothing built to capture it.

This reframes the priority list. The recommendations below are no longer "nice retention upgrades" — they are a backlog that has now survived two reports without a single item being built. The bottleneck is not knowing *what* to build; it's shipping velocity on engagement work.

## Scorecard

| Dimension | This week | Last week | Δ | Why |
|---|---|---|---|---|
| First-session hook | **6/10** | 6/10 | — | Home hero + live countdown still strong. Still no onboarding, still soft "why sign up now." No change shipped. |
| Core loop fun | **7/10** | 7/10 | — | Slots / Poker / Train-to-UFC remain the polished best of the app. Untouched. |
| Reward / progression | **7/10** | 7/10 | — | Economy is still exploit-resistant (good), but there's still almost nothing to *spend* coins on and no out-of-game progression. No change. |
| Social / competition pull | **5/10** | 5/10 | — | Only Train-to-UFC has a leaderboard, still siloed. No global ranking, friends, or challenges. Forums/chat still unrewarded. |
| Reasons to return tomorrow | **4/10** | 4/10 | — | **Still the weakest area, and now the most frustrating.** A full fight week passed with no return hook built. Only Train-to-UFC's energy reset nudges return. |
| Friction / UX | **6/10** | 6/10 | — | Five games, no unifying goal or guided path. Unchanged. |

**Overall: ~5.8/10** (flat vs. last week). Scores measure the app's state, and the code is unchanged, so the numbers hold. But the *trajectory* worsened: three consecutive reports now show a strong destination with no return engine, and the one dated opportunity to test the fix went by unused.

## Feature-by-feature notes

- **Home (`pages/Home.jsx`)** — Still a launcher, not a hub. No daily-reward claim, no streak counter, no missions, no fight-week banner. Confirmed: no `streak`/`daily`/`mission`/`fight-week`/`claim` strings in the file. This remains the highest-leverage surface to add a daily loop and it's still empty.
- **Predictions (`pages/Prediction.jsx`)** — Confirmed again: **no reward tie-in at all.** For the hardcore-bettor persona this is still the biggest wasted feature, and it's the one that should have been wired to UFC Vegas 119. There's a backend `predictions.js` route to build against, so the plumbing path is clear.
- **Slots / Poker (`UFCSlots.jsx`, `PokerGame.jsx`)** — Still the most "fun per second," still the strongest hook for competitive gamers, still exploit-resistant after the June 17 commit. No between-session return reason added.
- **Train to UFC (`pages/TrainToUFC.jsx`)** — Still the only feature with correct retention DNA: daily energy reset + a leaderboard tab (`fetchLeaderboard`, line ~387, hitting `train-to-ufc/leaderboard`). The proven pattern is *in your own codebase* and still hasn't been generalized app-wide.
- **Forums / Live Chat (`Forums.jsx`, `LiveChat.jsx`)** — Still no coin/reward tie-in. Posting earns nothing; casual fans have no incentive. Live Chat is the obvious home for a live fight-night event and is still neither promoted nor rewarded.
- **Profile (`pages/Profile.jsx`)** — Confirmed: no `streak`/`daily`/`claim`/`badge`/`achievement`. Still a stat sheet (coins, W/L, level), not a progression hub. No coin sink.
- **Road to UFC / 4 mini-games** — Content depth is fine; still no cross-game meta-objective tying them together, so discoverability and a clear end-goal remain the churn risk.

## Top 5 improvements (prioritized)

The list is largely the same because none of it was built — but the framing has shifted from "here's the roadmap" to "here's the smallest thing that breaks the zero-ship streak." Effort estimates are deliberately biased toward what one focused session can land.

1. **Global daily-login streak + reward — effort S, impact High. (NOW #1 — smallest build, biggest lever, no event dependency.)**
   *Problem:* "Reasons to return" = 4/10 and nothing nudges daily return outside one game. *Design:* server-authoritative escalating reward (Day 1: 50 → Day 7: 500 + bonus) with a streak counter in the Home greeting/header. *Why first:* it has no calendar dependency (so it can't be "missed" like the fight-week window was), the coin plumbing already exists and is exploit-resistant, and it's the single highest return-rate lever. *Files:* `Home.jsx`, `Profile.jsx`, new earn type in `backend/routes/fancoins.js`.

2. **Reward-tied predictions + a reusable fight-week event mode — effort M, impact High.**
   *Problem:* `Prediction.jsx` pays nothing and the June 20 card was monetized at zero. *Design:* award coins on submitting a pick (base) and a bonus once the event resolves, plus a boosted-multiplier window flag that any upcoming card can switch on. Build it as a **reusable event mode**, not a one-off, so the *next* card isn't missed too. *Files:* `Prediction.jsx`, `Home.jsx` (banner), `backend/routes/predictions.js` + `fancoins.js`.

3. **Daily missions board — effort M, impact High.**
   3 rotating cross-feature tasks ("make 1 prediction," "spin slots 5×," "post in a forum") that pay coins, surfaced on `Home.jsx`. Forces discovery of the whole app and finally gives Forums + Predictions a reason to be touched. *Files:* `Home.jsx`, new `backend/routes/missions.js`.

4. **Coin sink + global season leaderboard — effort M/L, impact Med-High.**
   Give protected coins a *purpose* (cosmetics / fighter-card packs / profile flair) and add one global, monthly-resetting leaderboard by generalizing the existing `train-to-ufc/leaderboard`. *Files:* generalize `TrainToUFC.jsx` leaderboard pattern; `Profile.jsx` for cosmetics.

5. **First-session onboarding — effort S/M, impact Med.**
   3-step guided tour ending in an instant coin grant + the user's first prediction, converting one-time SEO/social visitors into signed-up returnees. *Files:* `Home.jsx`, `AuthModal.jsx`.

## 🧪 Experiment of the week

**Ship the global daily-login streak (#1) this week — and treat "did any engagement feature ship at all" as the real metric.**

Rationale: last week's experiment was correct but had a calendar dependency, and when the build didn't happen the window closed and the test never ran. The daily-streak has **no event dependency**, so it can't expire — it's the smallest build that produces a clean D1/D7 retention read and it directly attacks the 4/10 "reasons to return." Concretely: add a server-authoritative `claim-daily` earn type to `fancoins.js`, a streak counter + claim button in the `Home.jsx` greeting, and persist `lastClaim`/`streakCount` on the user. Hand to the Coder Agent. Keep grants server-side (the `coinGuard` from the June 17 commit is the right enforcement point).

If only one thing ships before next Thursday, it should be this — because the headline of this report is that, for a third week running, the retention engine still doesn't exist.

---
*Generated by the Engagement Tester. Cross-references: week-2 report (2026-06-18) — its fight-week experiment was not shipped and the event has passed; latest commit `1b97000` (2026-06-17) remains HEAD. Note: I did not run a live browser; this is a code + UX reasoning pass. Next scheduled run: next Thursday — it will check whether the daily-streak (or anything) finally shipped.*
