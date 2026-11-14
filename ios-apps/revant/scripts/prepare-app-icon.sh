#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SOURCE="$REPO_ROOT/public/images/logo-revant-app-512.png"
ASSET_DIR="$SCRIPT_DIR/../Revant/Assets.xcassets/AppIcon.appiconset"

if [[ ! -f "$SOURCE" ]]; then
  echo "Approved Revant app logo not found: $SOURCE" >&2
  exit 1
fi

mkdir -p "$ASSET_DIR"
sips -z 1024 1024 "$SOURCE" --out "$ASSET_DIR/AppIcon-1024.png" >/dev/null

cat > "$ASSET_DIR/Contents.json" <<'JSON'
{
  "images": [
    {
      "filename": "AppIcon-1024.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
JSON

echo "Prepared 1024x1024 AppIcon from the existing Revant logo."
