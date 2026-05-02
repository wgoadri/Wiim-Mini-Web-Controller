#!/usr/bin/env bash
set -euo pipefail

# Read VITE_WIIM_HOST from .env.local if present, otherwise fall back
if [ -f .env.local ]; then
  HOST=$(grep -E '^VITE_WIIM_HOST=' .env.local | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
fi
HOST="${HOST:-${VITE_WIIM_HOST:-https://192.168.1.13}}"

echo "Smoke testing Wiim at $HOST"
echo

check() {
  local cmd="$1"
  printf "  %-20s ... " "$cmd"
  if response=$(curl -sk --max-time 3 "$HOST/httpapi.asp?command=$cmd"); then
    if [ -n "$response" ]; then
      echo "OK"
    else
      echo "FAIL (empty response)"
      exit 1
    fi
  else
    echo "FAIL (network)"
    exit 1
  fi
}

# Read-only commands only — these never change device state
check "getStatusEx"
check "getPlayerStatus"
check "getShutdown"

echo
echo "All smoke checks passed."