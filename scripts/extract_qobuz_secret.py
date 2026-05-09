"""
Extract a working Qobuz app_id and app_secret using qobuz-dl's bundle parser.

Usage:
  pip install qobuz-dl requests
  export QOBUZ_USER_AUTH_TOKEN="..."   # see DEPLOY.md for how to obtain
  python scripts/extract_qobuz_secret.py

Prints the app_id and the first secret that successfully signs a getFileUrl
request. Copy the values into your QOBUZ_APP_ID and QOBUZ_APP_SECRET
environment variables.

The Qobuz secret rotates every few months. When stream URLs start failing
with HTTP 400 errors, run this script again.
"""

import hashlib
import os
import sys
import time

import requests
from qobuz_dl.bundle import Bundle

TEST_TRACK_ID = "24393154"   # any valid public track works
TEST_FORMAT_ID = "27"        # FLAC Hi-Res

user_token = os.environ.get("QOBUZ_USER_AUTH_TOKEN")
if not user_token:
    print("Error: QOBUZ_USER_AUTH_TOKEN environment variable is required.")
    print("See DEPLOY.md for how to obtain it.")
    sys.exit(1)


def build_signature(track_id, timestamp, secret):
    data = (
        "trackgetFileUrl"
        + "format_id" + TEST_FORMAT_ID
        + "intent" + "stream"
        + "track_id" + track_id
        + str(timestamp)
        + secret
    )
    return hashlib.md5(data.encode()).hexdigest()


bundle = Bundle()
app_id = bundle.get_app_id()
secrets = list(bundle.get_secrets().values())

print(f"App ID: {app_id}")
print(f"Found {len(secrets)} candidate secrets, testing each...\n")

for idx, secret in enumerate(secrets, start=1):
    timestamp = int(time.time())
    signature = build_signature(TEST_TRACK_ID, timestamp, secret)

    response = requests.get(
        "https://www.qobuz.com/api.json/0.2/track/getFileUrl",
        params={
            "request_ts": timestamp,
            "request_sig": signature,
            "track_id": TEST_TRACK_ID,
            "format_id": TEST_FORMAT_ID,
            "intent": "stream",
        },
        headers={
            "X-App-Id": app_id,
            "X-User-Auth-Token": user_token,
        },
        timeout=15,
    )

    if response.status_code == 200:
        print(f"Working secret found (#{idx}): {secret}\n")
        print("Set these in your environment:")
        print(f"  QOBUZ_APP_ID={app_id}")
        print(f"  QOBUZ_APP_SECRET={secret}")
        sys.exit(0)
    else:
        print(f"Secret #{idx}: HTTP {response.status_code} (skipped)")

print("\nNo working secret found. The bundle may have rotated; try:")
print("  pip install --upgrade qobuz-dl")
sys.exit(1)