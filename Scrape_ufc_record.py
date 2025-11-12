import itertools
import re
import time
from typing import Dict, Iterable, List, Optional

import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient

# -----------------------
# 1. MongoDB CONNECTION
# -----------------------
MONGO_URI = (
    "mongodb+srv://yingsan1987:Qq2202612fundb@cluster0.gyljnee.mongodb.net/"
    "?retryWrites=true&w=majority&appName=Cluster0"
)
client = MongoClient(MONGO_URI)
db = client["test"]
collection = db["fighter_weight_record"]

# -----------------------
# 2. SCRAPING CONSTANTS
# -----------------------
BASE_LIST_URL = "http://ufcstats.com/statistics/fighters"
LIST_CHARACTERS = list("abcdefghijklmnopqrstuvwxyz") + ["other"]
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}
REQUEST_TIMEOUT = 30
DELAY_BETWEEN_LIST_REQUESTS = 1.5
DELAY_BETWEEN_DETAIL_REQUESTS = 1.0


# -----------------------
# 3. HELPER UTILITIES
# -----------------------
def clean_text(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def chunked(iterable: Iterable, size: int) -> Iterable[List]:
    iterator = iter(iterable)
    while True:
        batch = list(itertools.islice(iterator, size))
        if not batch:
            break
        yield batch


def fetch_soup(url: str) -> Optional[BeautifulSoup]:
    try:
        response = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            print(f"  ⚠️ Request to {url} failed with status {response.status_code}")
            return None
        return BeautifulSoup(response.text, "html.parser")
    except requests.RequestException as exc:
        print(f"  ❌ Request to {url} raised {exc}")
        return None


def parse_info_list(items: Iterable) -> Dict[str, str]:
    data = {}
    for item in items:
        text_parts = list(item.stripped_strings)
        if len(text_parts) < 2:
            continue

        key = clean_text(text_parts[0]).rstrip(":").lower()
        value = clean_text(" ".join(text_parts[1:]))
        if key and value:
            data[key] = value
    return data


def parse_career_statistics(section: BeautifulSoup) -> Dict[str, str]:
    stats = {}
    for item in section.select(".b-list__box-list-item"):
        strings = list(item.stripped_strings)
        if not strings:
            continue

        label = clean_text(strings[0]).rstrip(":").lower()
        value = clean_text(strings[1]) if len(strings) > 1 else ""
        if label and value:
            stats[label] = value

    return stats


def parse_fight_history(soup: BeautifulSoup) -> List[Dict[str, str]]:
    rows = soup.select("table.b-fight-details__table tr.b-fight-details__table-row")
    history = []
    for row in rows:
        columns = [clean_text(col.get_text()) for col in row.select("td")]
        if len(columns) < 10:
            continue
        history.append(
            {
                "result": columns[0],
                "opponent": columns[1],
                "kd": columns[2],
                "str": columns[3],
                "td": columns[4],
                "sub": columns[5],
                "event": columns[6],
                "method": columns[7],
                "round": columns[8],
                "time": columns[9],
            }
        )
    return history


def scrape_fighter_detail(detail_url: str) -> Optional[Dict]:
    soup = fetch_soup(detail_url)
    if not soup:
        return None

    name = clean_text(
        soup.select_one(".b-content__title-highlight").get_text()
        if soup.select_one(".b-content__title-highlight")
        else ""
    )
    nickname = clean_text(
        soup.select_one(".b-content__Nickname").get_text()
        if soup.select_one(".b-content__Nickname")
        else ""
    )
    record = clean_text(
        soup.select_one("span.b-content__title-record").get_text()
        if soup.select_one("span.b-content__title-record")
        else ""
    ).replace("Record:", "").strip()

    info_section = soup.select_one(".b-list__info-box-left")
    career_section = soup.select_one(".b-list__info-box-right")

    stats = parse_info_list(info_section.select(".b-list__box-list-item")) if info_section else {}
    career_stats = parse_career_statistics(career_section) if career_section else {}
    fight_history = parse_fight_history(soup)

    return {
        "name": name,
        "nickname": nickname,
        "record": record,
        "stats": stats,
        "career_statistics": career_stats,
        "fight_history": fight_history,
        "profile_url": detail_url,
        "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def scrape_fighter_list_page(char: str) -> List[Dict[str, str]]:
    url = f"{BASE_LIST_URL}?char={char}&page=all"
    soup = fetch_soup(url)
    if not soup:
        return []

    rows = soup.select("table.b-statistics__table tbody tr")
    fighters = []
    for row in rows:
        columns = row.select("td")
        if len(columns) < 8:
            continue

        link_tag = columns[0].select_one("a")
        detail_url = link_tag["href"] if link_tag and link_tag.get("href") else ""
        list_record = {
            "name": clean_text(columns[0].get_text()),
            "nickname": clean_text(columns[1].get_text()),
            "height": clean_text(columns[2].get_text()),
            "weight": clean_text(columns[3].get_text()),
            "reach": clean_text(columns[4].get_text()),
            "stance": clean_text(columns[5].get_text()),
            "wins": clean_text(columns[6].get_text()),
            "losses": clean_text(columns[7].get_text()),
            "draws": clean_text(columns[8].get_text()) if len(columns) > 8 else "",
        }

        fighters.append(
            {
                "detail_url": detail_url,
                "list_record": list_record,
            }
        )

    return fighters


# -----------------------
# 4. SCRAPE ALL FIGHTERS
# -----------------------
def main():
    fighters: List[Dict] = []
    total_fighters = 0

    print("🔍 Fetching fighter roster from UFCStats.com...")
    for char in LIST_CHARACTERS:
        print(f"\n📄 Scraping roster segment '{char.upper()}'")
        list_entries = scrape_fighter_list_page(char)
        print(f"   ➜ Found {len(list_entries)} fighters in segment '{char}'")
        total_fighters += len(list_entries)

        for batch in chunked(list_entries, 20):
            for entry in batch:
                detail_url = entry["detail_url"]
                if not detail_url:
                    continue

                fighter_data = scrape_fighter_detail(detail_url)
                if not fighter_data:
                    continue

                fighters.append(
                    {
                        **fighter_data,
                        "list_overview": entry["list_record"],
                    }
                )
                print(f"  ✅ Scraped {fighter_data['name']} ({detail_url})")
                time.sleep(DELAY_BETWEEN_DETAIL_REQUESTS)

            time.sleep(DELAY_BETWEEN_LIST_REQUESTS)

    print(f"\n✅ Completed scraping. Total fighters discovered: {total_fighters}")
    print(f"🗂️ Total detailed fighter records collected: {len(fighters)}")

    if not fighters:
        print("⚠️ No fighter data collected. Skipping MongoDB upload.")
        return

    print("💾 Uploading data into MongoDB collection test.fighter_weight_record ...")
    try:
        collection.delete_many({})
        collection.insert_many(fighters)
        print(f"📤 Uploaded {len(fighters)} fighter records into MongoDB successfully.")
    except Exception as exc:
        print(f"❌ MongoDB write failed: {exc}")


if __name__ == "__main__":
    main()
