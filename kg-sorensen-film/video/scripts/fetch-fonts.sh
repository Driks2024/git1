#!/usr/bin/env bash
# Downloads the two brand families (Inter variable with the optical-size axis,
# JetBrains Mono variable) as woff2 from Google Fonts into video/public/fonts.
# Only the latin + latin-ext subsets plus a tiny symbol subset (≈ → µ ✓).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../public/fonts" && pwd)"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
API="https://fonts.googleapis.com/css2"

grab() { # $1 css url, $2 subset comment, $3 out file
  local url
  url=$(curl -fsSL -A "$UA" "$1" | awk -v s="/* $2 */" 'index($0,s){f=1} f && /src: url/ {match($0,/https:[^)]+/); print substr($0,RSTART,RLENGTH); exit}')
  [ -n "$url" ] || { echo "subset $2 not found" >&2; exit 1; }
  curl -fsSL -A "$UA" "$url" -o "$DIR/$3"
  echo "$3 <- $url"
}
grab_text() { # $1 css url (with &text=), $2 out file
  local url
  url=$(curl -fsSL -A "$UA" "$1" | grep -o 'https://fonts.gstatic.com[^)]*' | head -1)
  curl -fsSL -A "$UA" "$url" -o "$DIR/$2"
  echo "$2 <- $url"
}

INTER="$API?family=Inter:opsz,wght@14..32,100..900&display=swap"
MONO="$API?family=JetBrains+Mono:wght@300..800&display=swap"
grab "$INTER" "latin" inter-latin.woff2
grab "$INTER" "latin-ext" inter-latin-ext.woff2
grab "$MONO" "latin" jetbrains-mono-latin.woff2
grab "$MONO" "latin-ext" jetbrains-mono-latin-ext.woff2
SYM="%E2%89%88%E2%86%92%C2%B5%E2%9C%93%E2%86%93%E2%86%91"
grab_text "$API?family=Inter:opsz,wght@14..32,100..900&text=$SYM" inter-symbols.woff2
grab_text "$API?family=JetBrains+Mono:wght@300..800&text=$SYM" jetbrains-mono-symbols.woff2
ls -la "$DIR"
