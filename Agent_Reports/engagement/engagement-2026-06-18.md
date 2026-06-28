# 🎮 Engagement & Fun Scorecard — UFC Fan App (kurokuku.lol)

**Date:** 2026-06-18 · **Agent:** Engagement Tester (week 2) · **Method:** code + UX review of all pages and game components, reasoned across four personas (hardcore bettor, casual fan, competitive gamer, lapsed user). Compared against baseline `engagement-2026-06-16.md`.

## What changed since last week

One commit landed: **`1b97000` — "Harden coin economy + auth"** (Coder Agent, from the 2026-06-16 audit). It bounds and rate-limits client-reported coin deltas on slots/poker, fails auth closed in production, gates admin routes, and tightens CORS. This is real progress — the baseline flagged the exploitable economy as *undercutting the value of earning*, and that hole is now closed.

But it is a **backend-only, defensive** change. **None of the Top-5 engagement improvements from the baseline were built** — no daily-login streak, no missions, no notifications, no global leaderboard, no onboarding. So nearly every retention score is unchanged. The one bump is Reward/progression: coins now actually mean something because they can't be farmed.

**Timing note:** It is fight week. The social agent's 2026-06-18 pack confirms **UFC Vegas 119 (Kape vs. Horiguchi 2) lands Saturday June 20**, with a massive news cycle (Gaethje–Topuria upset) driving traffic *right now*. The app has nothing built to capture this spike. Improvement #3 (fight-week re-engagement) is no longer a nice-to-have — it's the single most time-sensitive miss this week.

## Scorecard

| Dimension | This week | Last week | Δ | Why |
|---|---|---|---|---|
| First-session hook | **6/10** | 6/10 | — | Home hero + countdown still strong; still no onboarding/tutorial and soft "why sign up now" payoff. No change shipped. |
| Core loop fun | **7/10** | 7/10 | — | Slots/Poker/Train-to-UFC remain the polished, best part of the app. Untouched this week. |
| Reward / progression | **7/10** | 6/10 | ▲ +1 | Economy is no longer exploitable (commit `1b97000`), so earned coins finally hold value. But there's still almost nothing meaningful to *spend* coins on. |
| Social / competition pull | **5/10** | 5/10 | — | Only Train-to-UFC has a leaderboard, and it's siloed (`/train-to-ufc/leaderboard`). No global ranking, friends, or challenges. Forums/chat still unrewarded. |
| Reasons to return tomorrow | **4/10** | 4/10 | — | **Still the weakest area.** Only Train-to-UFC's "come back tomorrow for 3 more sessions" energy reset nudges return. No global daily reward, missions, or push. |
| Friction / UX | **6/10** | 6/10 | — | Five games, no unifying goal or guided path. Unchanged. |

**Overall: ~5.8/10** (was ~5.7). The fix to the economy nudged Reward/progression up a point, but the retention engine the baseline prescribed still doesn't exist. The app remains a fun *destination* with weak *pull-back*.

## Feature-by-feature notes

- **Home (`pages/Home.jsx`)** — Still the best landing: live countdown, news, game tiles, coin balance in the greeting. But it's purely a launcher. No daily-reward claim, no streak counter, no missions. During fight week it shows the next event but offers no "lock your picks / fight-week bonus" hook. Highest-leverage surface to add a daily loop.
- **Slots / Poker (`UFCSlots.jsx`, `PokerGame.jsx`)** — Most "fun per second," and now the coin payouts can't be cheated. Keep as the hook for competitive gamers. No new reasons to return between sessions, though.
- **Train to UFC (`TrainToUFC.jsx`)** — Still the only feature with the right retention DNA: daily energy (`⚡ Daily Energy 3/3`, "Come back tomorrow…", line ~663) and a leaderboard tab. This pattern is *proven in your own codebase* — generalize it app-wide instead of letting it live in one game.
- **Predictions (`Prediction.jsx`, 682 lines)** — Confirmed: **zero coin/reward tie-in** (no `fanCoin`/`reward` references in the file). For the hardcore-bettor persona and for fight-week spikes this is the biggest wasted opportunity — there's still no reason to predict *every* event, and no payoff for being right. With a real card Saturday, this should be the #1 thing wired to rewards.
- **Forums / Live Chat (`Forums.jsx`, `LiveChat.jsx`)** — Confirmed: **no coin/reward tie-in**. Community exists but posting earns nothing, so casual fans have no incentive. Live Chat is the natural home for a fight-week event but isn't promoted or rewarded.
- **Profile (`Profile.jsx`)** — Shows Fan Coins, Wins/Losses, Level. Good base for progression, but **no streak, no daily-claim, no badges/achievements, and nothing to spend coins on** (only an "Upgrade to Premium" link). It's a stat sheet, not a progression hub.
- **Road to UFC / 4 mini-games** — Solid content depth; discoverability and a clear end-goal are still the risk. No cross-game meta-objective ties them together.

## Top 5 improvements (prioritized)

The priority list is essentially carried over from the baseline because **none of it was built** — but it's now re-ordered to put the time-sensitive fight-week lever first, since a live card is 2 days away.

1. **Fight-week prediction event + re-engagement — effort M, impact High. (MOVED UP — ship before Saturday if possible.)**
   *Problem:* a major card (UFC Vegas 119, Jun 20) and a huge news cycle are driving traffic *this week*, and the app captures none of it. *Design:* a temporary "Fight Week" banner on `Home.jsx` linking to `Prediction.jsx`, with predictions that **award fan coins** (base for picking, bonus for correct after `process-event` resolves) and a boosted-reward multiplier during the event window. Add web push/email ("UFC Vegas 119 is tomorrow — lock your picks"). *Impact:* directly monetizes the biggest natural traffic spike on the calendar. *Files:* `Home.jsx`, `Prediction.jsx`, backend `fancoins` + event resolution.

2. **Global daily-login streak + reward — effort S, impact High.**
   Escalating reward for consecutive days (Day 1: 50 → Day 7: 500 + bonus) with a streak counter in the header/Home greeting. Single biggest return-rate lever; coin plumbing already exists and is now exploit-resistant. Keep it server-authoritative. *Solves "Reasons to return" = 4/10.* *Files:* `Home.jsx`, `Profile.jsx`, new backend route.

3. **Daily missions board — effort M, impact High.**
   3 rotating cross-feature tasks ("make 1 prediction," "spin slots 5×," "post in a forum") that pay coins. Forces discovery of the whole app and finally gives Forums/Predictions a reason to be touched. *Solves the "scattered 5 games" friction.* *Files:* `Home.jsx`, backend missions route.

4. **Coin sink + global season leaderboard — effort M/L, impact Med-High.**
   Now that coins are protected, give them a *purpose*: cosmetics, fighter-card packs, or profile flair to spend on, plus one global, monthly-resetting leaderboard (generalize the existing `train-to-ufc/leaderboard` to an app-wide score). Adds bragging rights and makes earning matter. *Files:* generalize `TrainToUFC.jsx` leaderboard pattern; `Profile.jsx` for cosmetics.

5. **First-session onboarding — effort S/M, impact Med.**
   3-step guided tour ending in an instant coin grant + the user's first prediction, converting one-time SEO/social visitors into signed-up returnees. *Raises First-session hook + signup conversion.* *Files:* `Home.jsx`, `AuthModal.jsx`.

## 🧪 Experiment of the week

**Ship a minimal Fight-Week Prediction reward for UFC Vegas 119 (Saturday, Jun 20) and measure prediction submissions + return visits over the weekend.**

Rationale: it's the smallest slice of improvement #1 that can plausibly ship before a live event, it rides traffic that's *already arriving* from the news cycle, and it gives a clean read on whether reward-tied predictions move behavior — data that de-risks the bigger daily-streak/missions build. Concretely: add a "Predict UFC Vegas 119 → earn coins" CTA on `Home.jsx`, grant coins on submission, and grant a bonus after the event resolves. Hand to the Coder Agent; keep coin grants server-authoritative (the `coinGuard.js` from this week's commit is the right place to enforce it).

---
*Generated by the Engagement Tester. Cross-references: Coder audit (2026-06-16) #1 — its fix raised Reward/progression this week; Social pack (2026-06-18) — confirms the live fight-week window driving improvement #1. Next scheduled run: next Thursday — it will check whether any of the Top-5 finally shipped.*
