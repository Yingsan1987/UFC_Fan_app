# 🥊 kurokuku.lol — Agent Team Roster

Your automated team for improving the UFC Fan App. Each agent runs on its own schedule, does its work without you, and drops a dated report into `Agent_Reports/<role>/`. All output is **draft / advisory** — nothing is published or deployed without you.

> Scheduled tasks run **while the Claude app is open**. If the app is closed when one is due, it runs the next time you open the app. Manage, pause, or "Run now" any agent from the **Scheduled** section in the sidebar.

---

## The team

| Agent | Runs | What it does | Output folder |
|---|---|---|---|
| 🛠️ **Coder** | Weekly — Mon 8am | Audits the codebase for bugs, performance, security, a11y; proposes top fixes with code, and may apply 1–2 small safe ones (never auth/payments/deploy). Does not commit or push. | `Agent_Reports/coder/` |
| 📊 **Market Research** | Monthly — 1st, 9am | Researches the MMA/UFC fan-app market, competitors, trends, and prioritized growth/monetization opportunities. Cited sources. | `Agent_Reports/market_research/` |
| ✍️ **SEO Blog** | Tue & Fri 7am | Writes one timely, SEO-optimized UFC blog post (keywords + meta + CTA) to pull in organic search traffic. | `Agent_Reports/seo_blog/` |
| 📱 **Social Content** | Weekdays 8am | Daily content pack for X, Reddit, and TikTok/Shorts tied to current UFC news, with CTAs back to the app. | `Agent_Reports/social/` |
| 🎮 **Engagement Tester** | Weekly — Thu 10am | Scores how *fun* and sticky the app is across all features and recommends retention/gamification improvements + a weekly experiment. | `Agent_Reports/engagement/` |

---

## How the team works together

- **Engagement Tester** finds *what* would make the app stickier → **Coder** implements it.
- **Market Research** finds *where the market is going* → feeds the Engagement Tester and your roadmap.
- **SEO Blog + Social** drive new visitors; both reference the app's real features so traffic converts.
- Everything lands in `Agent_Reports/` so you have a running history to compare week over week.

## Recommended: pre-approve tools

Several agents use web search (Market Research, SEO, Social). To avoid them pausing on a permission prompt mid-run, open the **Scheduled** sidebar and hit **Run now** once on each — approvals are saved and reused on future runs.

## Cadence at a glance

```
Mon 08:00  🛠️ Coder audit
Tue 07:00  ✍️ SEO blog post
Tue 08:00  📱 Social pack
Wed 08:00  📱 Social pack
Thu 08:00  📱 Social pack
Thu 10:00  🎮 Engagement scorecard
Fri 07:00  ✍️ SEO blog post
Fri 08:00  📱 Social pack
1st of month 09:00  📊 Market research report
```

## Tuning the team

Tell me any of these and I'll adjust:
- **Change frequency** (e.g., social 3×/week instead of daily, blog once a week).
- **Auto-publish** — wire up a connector so Social/SEO posts go out automatically instead of as drafts (needs the relevant account connected).
- **Let the Coder open PRs** instead of editing the working tree.
- **Add agents** — e.g., a community/forum-moderation agent, an analytics-reporting agent, or a fight-week "event hype" agent.
- **Pause** any agent during slow periods.

---
*Set up June 16, 2026. Each agent run starts fresh with no memory of previous runs except the report files in its folder — so the folders are the team's shared memory. Don't delete them.*
