#!/usr/bin/env bash
# Regenerate every Bime Gold brand asset in brand/bime-gold/.
#   tools/brand-gold/build.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/brand/bime-gold"
SVG="$OUT/svg"
PNG="$OUT/png"
PY="$ROOT/tools/brand-gold/.venv/bin/python"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$PY" "$ROOT/tools/brand-gold/build.py" > /dev/null
"$PY" "$ROOT/tools/brand-gold/trace.py" > /dev/null

# PNG raster exports
rsvg-convert -h 256  "$SVG/logo-en.svg"       -o "$PNG/logo-en-256.png"
rsvg-convert -h 512  "$SVG/logo-en.svg"       -o "$PNG/logo-en-512.png"
rsvg-convert -h 1024 "$SVG/logo-en.svg"       -o "$PNG/logo-en-1024.png"
rsvg-convert -h 256  "$SVG/logo-en-dark.svg"  -o "$PNG/logo-en-dark-256.png"
rsvg-convert -h 512  "$SVG/logo-en-dark.svg"  -o "$PNG/logo-en-dark-512.png"
rsvg-convert -h 256  "$SVG/logo-stacked-en.svg" -o "$PNG/logo-stacked-en-256.png"
rsvg-convert -w 512 -h 512 "$SVG/icon-tile.svg"     -o "$PNG/icon-512.png"
rsvg-convert -w 192 -h 192 "$SVG/icon-tile.svg"     -o "$PNG/icon-192.png"
rsvg-convert -w 512 -h 512 "$SVG/icon-maskable.svg" -o "$PNG/icon-maskable-512.png"
rsvg-convert -w 180 -h 180 "$SVG/icon-apple.svg"    -o "$PNG/apple-touch-icon-180.png"
rsvg-convert -w 64  -h 64  "$SVG/mark.svg"         -o "$PNG/mark-64.png"

# Package-root shortcuts come from traced/ -- that set is the real logo.
cp "$OUT/traced/png/logo-512.png"           "$OUT/logo.png"
cp "$OUT/traced/png/logo-on-dark-512.png"   "$OUT/logo-on-dark.png"
cp "$OUT/traced/png/apple-touch-icon-180.png" "$OUT/apple-touch-icon.png"
cp "$OUT/traced/svg/logo.svg"               "$OUT/logo.svg"
cp "$OUT/traced/svg/favicon.svg"            "$OUT/favicon.svg"
cp "$OUT/traced/favicon.ico"                "$OUT/favicon.ico"

"$ROOT/tools/brand-gold/sync.sh"

# the public brand book at brand.bimegold.com is another consumer of this package
"$PY" "$ROOT/tools/brand-gold/site.py"

echo "Bime Gold brand package written to $OUT"
find "$OUT" -type f -not -path "*/.tmp/*" | sort
