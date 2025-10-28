import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import re
import time

load_dotenv()

MONGO_URI = "mongodb+srv://yingsan1987:Qq2202612fundb@cluster0.gyljnee.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["test"]
collection = db["fighter_images"]

base_url = "https://www.ufc.com"
athletes_url = f"{base_url}/athletes/all"

headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
}

def slugify_name(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', name.strip().lower())

all_fighters = []
page = 0

print("🔍 Fetching fighter list from UFC.com...")

while True:
    url = f"{athletes_url}?page={page}"
    response = requests.get(url, headers=headers, timeout=30)
    if response.status_code != 200:
        print(f"⚠️ Page {page} returned status {response.status_code}, stopping.")
        break

    soup = BeautifulSoup(response.text, "html.parser")
    fighter_cards = soup.find_all("div", class_="c-listing-athlete-flipcard__inner")

    if not fighter_cards:
        print(f"✅ No fighters found on page {page}, scraping complete.")
        break

    print(f"📄 Page {page} - Found {len(fighter_cards)} fighters.")
    for card in fighter_cards:
        name_tag = card.find("span", class_="c-listing-athlete__name")
        link_tag = card.find("a", href=True)
        img_tag = card.find("img", src=True)

        if name_tag and link_tag and img_tag:
            full_name = name_tag.get_text(strip=True)
            profile_url = base_url + link_tag["href"]
            image_url = img_tag["src"]
            indicator = slugify_name(full_name)

            all_fighters.append({
                "name": full_name,
                "indicator": indicator,
                "profile_url": profile_url,
                "image_url": image_url
            })

    page += 1
    time.sleep(1)  # polite delay to avoid blocking

print(f"✅ Total fighters scraped: {len(all_fighters)}")

# Upload to MongoDB
if all_fighters:
    try:
        collection.delete_many({})
        collection.insert_many(all_fighters)
        print(f"📤 Uploaded {len(all_fighters)} records into test.fighter_images.")
    except Exception as e:
        print("❌ MongoDB write failed:", e)
else:
    print("⚠️ No fighter data collected.")
