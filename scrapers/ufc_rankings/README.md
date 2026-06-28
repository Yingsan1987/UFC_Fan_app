# UFC Rankings Pipeline (PythonAnywhere → MongoDB → App)

Scheduled job that scrapes **https://www.ufc.com/rankings** and writes the result
into your MongoDB `rankings` collection. The backend route
`GET /api/sportradar/rankings` reads that collection first (and only falls back to
SportRadar/mock if it's empty), so the app's Rankings page reflects live UFC data.

## How the pieces fit

```
PythonAnywhere (daily)            MongoDB                    Backend (Render)            Frontend
ufc_rankings_scraper.py  ──►  rankings collection  ──►  GET /api/sportradar/rankings  ──►  Ranking.jsx
   scrapes ufc.com/rankings      { key:"ufc_rankings",       reads Mongo first,             renders divisions
                                   rankings:[...] }           adds fighter images
```

Data shape written (and served) — champion is `rank: 0`, contenders keep ranks 1..15:

```json
{ "key": "ufc_rankings",
  "rankings": [
    { "name": "lightweight",
      "competitor_rankings": [
        { "rank": 0, "movement": 0, "competitor": { "name": "Islam Makhachev", "image_url": null } },
        { "rank": 1, "movement": 2, "competitor": { "name": "Arman Tsarukyan", "image_url": null } }
      ] } ],
  "updatedAt": "2026-06-27T..." }
```

## One-time setup on PythonAnywhere

1. Create a free account at https://www.pythonanywhere.com (the free tier is enough;
   note: free accounts can only reach **allow-listed** sites — `ufc.com` and MongoDB
   Atlas connections work on paid tiers reliably. If on the free tier and the request
   is blocked, upgrade to the $5 "Hacker" plan, which removes the proxy restriction).
2. Open a **Bash console** and upload these files (Files tab) to e.g. `~/ufc_rankings/`:
   - `ufc_rankings_scraper.py`
   - `requirements.txt`
3. Install dependencies:
   ```bash
   pip3 install --user -r ~/ufc_rankings/requirements.txt
   ```
4. Set your MongoDB connection string as an environment variable for the scheduled
   task. The simplest reliable way on PythonAnywhere is to put it at the top of the
   schedule command (step 6). **Do not commit your real URI to git.**

## Test it manually first

In a Bash console:
```bash
MONGO_URI="your-mongodb-connection-string" python3 ~/ufc_rankings/ufc_rankings_scraper.py
```
You should see lines like `lightweight: 16 athletes` and finally
`Upserted into '<db>.rankings'`. If you see *"No athletes parsed — UFC.com markup may
have changed"*, the page structure shifted — send me the console output and I'll
adjust the selectors (the script intentionally refuses to overwrite good data with an
empty result).

## Schedule it (daily)

1. Go to the **Tasks** tab on PythonAnywhere.
2. Add a **Scheduled task**. UFC updates rankings roughly weekly (usually Tuesdays),
   but a daily run is cheap and keeps movement fresh. Set the time (UTC) and command:
   ```bash
   MONGO_URI="your-mongodb-connection-string" python3 /home/YOURUSER/ufc_rankings/ufc_rankings_scraper.py
   ```
   (Replace `YOURUSER` and the URI. Free accounts allow one daily scheduled task.)

That's it — once it runs, reload your app's Rankings page and it will serve the
scraped data. No backend redeploy is needed for subsequent scrapes; only the
**first** deploy of the backend changes (the new `models/Ranking.js` + the updated
`routes/sportradar.js`) needs to ship.

## Notes
- The same `MONGO_URI` the backend uses must be used here so both read/write the same DB.
- Fighter headshots: the scraper stores whatever image it finds; if missing, the
  backend fuzzy-matches from your `FighterImages` collection, so photos still appear.
- The script is safe to re-run; it upserts a single document (`key: "ufc_rankings"`).
