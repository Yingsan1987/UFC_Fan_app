#!/usr/bin/env python3
"""
Sync News Script for PythonAnywhere Cron Job

This script calls the backend API to trigger a news sync from NewsAPI.
It's designed to be run as a scheduled task on PythonAnywhere.

HOW IT WORKS:
-------------
1. This Python script makes an HTTP POST request to your backend API
2. The backend API (Node.js on Render) has NEWSAPI_KEY in its environment variables
3. The backend calls NewsAPI.org using that key to fetch articles
4. The backend stores the articles in MongoDB
5. This script just triggers the process - it doesn't need NEWSAPI_KEY itself

This architecture keeps your API key secure on the backend server and allows
the Python script to be a simple HTTP client.

Usage:
    python3 scripts/syncNews.py

Environment variables required (set in PythonAnywhere):
    - API_URL: Your backend API URL (e.g., https://ufc-fan-app-backend.onrender.com/api)
    - ADMIN_TOKEN: Admin token matching your backend ADMIN_TOKEN env var
    
NOTE: NEWSAPI_KEY is NOT needed here - it's stored on your Render backend server!

To set up as PythonAnywhere Scheduled Task:
    1. Go to PythonAnywhere Dashboard > Tasks
    2. Create new scheduled task
    3. Command: python3 /home/yourusername/UFC_Fan_app/backend/scripts/syncNews.py
    4. Schedule: e.g., "0 */6 * * *" (every 6 hours)
    5. Set environment variables in the task settings (API_URL and ADMIN_TOKEN only)
"""

import os
import sys
from datetime import datetime


from dotenv import load_dotenv
from pathlib import Path

# Load env vars from ~/.env
env_path = Path("/home/YingHe/ufc_app/.env")
load_dotenv(env_path)

# Optional debug (temporary)
print("Loaded .env from:", env_path)
print("ADMIN_TOKEN loaded?", bool(os.environ.get("ADMIN_TOKEN")))

# Check if requests is available
try:
    import requests
except ImportError:
    print('❌ ERROR: requests library is not installed')
    print('   Install it with: pip3 install requests')
    print('   Or in PythonAnywhere: pip3.10 install --user requests')
    sys.exit(1)

# Configuration
API_URL = os.environ.get('API_URL', 'https://ufc-fan-app-backend.onrender.com/api')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')

def main():
    """Main function to sync news via API"""
    try:
        print(f'🚀 Starting news sync script at {datetime.now().isoformat()}')
        
        if not ADMIN_TOKEN:
            print('❌ ERROR: ADMIN_TOKEN environment variable is not set')
            print('   Set it in PythonAnywhere Dashboard > Tasks > Environment variables')
            sys.exit(1)
        
        if not API_URL:
            print('❌ ERROR: API_URL environment variable is not set')
            sys.exit(1)
        
        # Construct the refresh endpoint URL
        refresh_url = f'{API_URL}/news/refresh'
        
        print(f'📡 Calling backend API: {refresh_url}')
        print(f'   (Backend will use NEWSAPI_KEY from Render environment to fetch from NewsAPI)')
        
        # Make POST request with admin token
        # The backend will handle the actual NewsAPI fetch using its NEWSAPI_KEY
        headers = {
            'Content-Type': 'application/json',
            'x-admin-token': ADMIN_TOKEN
        }
        
        response = requests.post(
            refresh_url,
            headers=headers,
            timeout=60  # 60 second timeout
        )
        
        # Check response
        if response.status_code == 200:
            data = response.json()
            print('✅ News sync completed successfully')
            print(f'📊 Results:')
            print(f'   - Inserted: {data.get("insertedCount", 0)}')
            print(f'   - Updated: {data.get("updatedCount", 0)}')
            print(f'   - Total Fetched: {data.get("totalFetched", 0)}')
            
            if data.get('skipped'):
                print(f'   - Status: {data.get("message", "Skipped")}')
            
            print('✨ Script completed successfully')
            sys.exit(0)
        elif response.status_code == 403:
            print('❌ ERROR: Authentication failed (403 Forbidden)')
            print('   Check that ADMIN_TOKEN matches your backend ADMIN_TOKEN env var')
            sys.exit(1)
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            error_msg = error_data.get('message', response.text or f'HTTP {response.status_code}')
            print(f'❌ ERROR: API request failed ({response.status_code})')
            print(f'   Message: {error_msg}')
            sys.exit(1)
            
    except requests.exceptions.Timeout:
        print('❌ ERROR: Request timed out (60 seconds)')
        print('   The API may be slow or unresponsive')
        sys.exit(1)
    except requests.exceptions.ConnectionError as e:
        print(f'❌ ERROR: Could not connect to API')
        print(f'   Check that API_URL is correct: {API_URL}')
        print(f'   Error: {str(e)}')
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f'❌ ERROR: Request failed: {str(e)}')
        sys.exit(1)
    except Exception as e:
        print(f'❌ ERROR: Unexpected error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
