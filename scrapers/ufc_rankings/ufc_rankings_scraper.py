#!/usr/bin/env python3
"""
UFC Rankings scraper -> MongoDB
================================
Scrapes https://www.ufc.com/rankings and upserts the result into the MongoDB
`rankings` collection in the exact shape the UFC Fan App backend serves:

    { key: "ufc_rankings",
      rankings: [
        { name: "lightweight",
          competitor_rankings: [
            { rank: 0,  movement: 0, competitor: { name, image_url } },   # champion
            { rank: 1,  movement: 2, competitor: { name, image_url } },   # #1 contender
            ...
          ] } ],
      updatedAt: <utc datetime> }

Champion is stored with rank == 0 so the app can show the belt/trophy, and
contenders keep their true UFC rank (1..15).

Run on PythonAnywhere as a scheduled task. Requires env var:
    MONGO_URI   (or MONGODB_URI)  -> your MongoDB connection string
Optional:
    MONGO_DB    -> database name (only needed if the URI has no default db)

See README.md for setup + scheduling instructions.
"""

import os
import re
import sys
import datetime

import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient

UFC_RANKINGS_URL = "https://www.ufc.com/rankings"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}
REQUEST_TIMEOUT = 30


def log(msg):
    print(f"[{datetime.datetime.now().isoformat(timespec='seconds')}] {msg}", flush=True)


def normalize_division(raw):
    """'Women's Strawweight' -> 'womens_strawweight';
    'Light Heavyweight' -> 'light_heavyweight';
    \"Men's Pound-for-Pound Top Rank\" -> 'mens_pound_for_pound'."""
    n = raw.lower().strip()
    n = n.replace("pound-for-pound", "pound_for_pound")
    n = n.replace("top rank", "")
    n = n.replace("’", "").replace("'", "")   # curly + straight apostrophes
    n = re.sub(r"[^a-z0-9]+", "_", n).strip("_")
    return n


def parse_movement(cell):
    """Return signed int: positive=moved up, negative=moved down, 0=no change."""
    if cell is None:
        return 0
    classes = " ".join(cell.get("class", [])).lower()
    text = cell.get_text(strip=True) if cell else ""
    m = re.search(r"\d+", text or "")
    magnitude = int(m.group()) if m else 0
    if magnitude == 0:
        return 0
    if "increase" in classes or "up" in classes:
        return magnitude
    if "decrease" in classes or "down" in classes:
        return -magnitude
    return 0


def first_img_src(node):
    if node is None:
        return None
    img = node.select_one("img")
    if not img:
        return None
    # UFC lazy-loads images; check common attributes.
    for attr in ("src", "data-src", "data-srcset"):
        val = img.get(attr)
        if val:
            return val.split()[0] if " " in val else val
    return None


def scrape_rankings():
    log(f"Fetching {UFC_RANKINGS_URL}")
    resp = requests.get(UFC_RANKINGS_URL, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    groupings = soup.select("div.view-grouping")
    log(f"Found {len(groupings)} division groupings")

    rankings = []
    for g in groupings:
        header = g.select_one("div.view-grouping-header")
        if not header:
            continue
        div_name = normalize_division(header.get_text())
        competitor_rankings = []

        # --- Champion (rank 0) ---
        champ_block = g.select_one(".rankings--athlete--champion")
        champ_name_el = None
        if champ_block:
            champ_name_el = champ_block.select_one("h5 a") or champ_block.select_one("h5")
        if champ_name_el:
            competitor_rankings.append({
                "rank": 0,
                "movement": 0,
                "competitor": {
                    "name": champ_name_el.get_text(strip=True),
                    "image_url": first_img_src(champ_block),
                },
            })

        # --- Ranked contenders (1..15) ---
        for row in g.select("table tbody tr"):
            name_el = (
                row.select_one("td.views-field-title a")
                or row.select_one("td.views-field-title")
                or row.select_one("a")
            )
            if not name_el:
                continue
            rank_cell = row.select_one("td.views-field-weight-class-rank")
            change_cell = (
                row.select_one("td.views-field-weight-class-rank-change")
                or row.select_one("td.views-field-rank-change")
                or row.select_one(".views-field-weight-class-rank-change")
            )
            rank_txt = rank_cell.get_text(strip=True) if rank_cell else ""
            rm = re.search(r"\d+", rank_txt)
            rank = int(rm.group()) if rm else len(competitor_rankings)

            competitor_rankings.append({
                "rank": rank,
                "movement": parse_movement(change_cell),
                "competitor": {
                    "name": name_el.get_text(strip=True),
                    "image_url": first_img_src(row),
                },
            })

        if competitor_rankings:
            rankings.append({"name": div_name, "competitor_rankings": competitor_rankings})
            log(f"  {div_name}: {len(competitor_rankings)} athletes")

    return rankings


def save_to_mongo(rankings):
    uri = os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI")
    if not uri:
        log("ERROR: set MONGO_URI (or MONGODB_URI) in the environment.")
        sys.exit(1)

    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = None
    try:
        db = client.get_default_database()
    except Exception:
        db = None
    if db is None:
        db = client[os.environ.get("MONGO_DB", "ufc_fan_app")]

    result = db.rankings.update_one(
        {"key": "ufc_rankings"},
        {"$set": {
            "key": "ufc_rankings",
            "rankings": rankings,
            "source": UFC_RANKINGS_URL,
            "updatedAt": datetime.datetime.utcnow(),
        }},
        upsert=True,
    )
    log(f"Upserted into '{db.name}.rankings' "
        f"(matched={result.matched_count}, upserted={result.upserted_id is not None})")


def main():
    try:
        rankings = scrape_rankings()
    except Exception as exc:
        log(f"ERROR while scraping: {exc}")
        sys.exit(1)

    total = sum(len(r["competitor_rankings"]) for r in rankings)
    log(f"Parsed {len(rankings)} divisions / {total} athletes total")

    # Safety: never overwrite good data with an empty scrape (UFC HTML changed).
    if not rankings or total == 0:
        log("No athletes parsed — UFC.com markup may have changed. "
            "Leaving existing MongoDB data untouched.")
        sys.exit(2)

    save_to_mongo(rankings)
    log("Done.")


if __name__ == "__main__":
    main()
