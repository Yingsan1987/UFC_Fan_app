# load_to_mongo.py
import pandas as pd
from pymongo import MongoClient
import os
# MongoDB Atlas connection string
MONGO_URI = "mongodb+srv://yingsan1987:<db_password>@cluster0.gyljnee.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client['ufc_db']
# Folder where your CSVs are generated
csv_folder = "/home/YingHe/ufc_app/scrape_ufc_stats/"
# Example: loading all CSVs in folder
for file_name in os.listdir(csv_folder):
    if file_name.endswith(".csv"):
        file_path = os.path.join(csv_folder, file_name)
        collection_name = file_name.replace(".csv", "")
        df = pd.read_csv(file_path)
        # Convert DataFrame to dicts and insert into MongoDB
        records = df.to_dict(orient="records")
        if records:
            col = db[collection_name]
            # Optional: remove old records first
            col.delete_many({})
            col.insert_many(records)
            print(f"Inserted {len(records)} records into {collection_name}")