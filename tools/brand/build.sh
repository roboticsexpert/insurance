#!/usr/bin/env bash
# Regenerate every brand asset in apps/web/public/brand/.
#   tools/brand/build.sh
# Needs: python with fonttools + uharfbuzz + brotli, rsvg-convert, ImageMagick.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/apps/web/public/brand"
PY="${BRAND_PYTHON:-python3}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BRAND="#0b7c7c"

"$PY" "$ROOT/tools/brand/build.py" > /dev/null

rsvg-convert -w 512 -h 512 "$OUT/icon-tile.svg"     -o "$OUT/icon-512.png"
rsvg-convert -w 192 -h 192 "$OUT/icon-tile.svg"     -o "$OUT/icon-192.png"
rsvg-convert -w 512 -h 512 "$OUT/icon-maskable.svg" -o "$OUT/icon-maskable-512.png"
rsvg-convert -w 180 -h 180 "$OUT/icon-apple.svg"    -o "$OUT/apple-touch-icon.png"

# favicon.ico: the solid mark, transparent, at the three sizes Windows and Safari ask for.
sed "s/currentColor/$BRAND/g" "$OUT/mark-solid.svg" > "$TMP/solid.svg"
for s in 16 32 48; do rsvg-convert -w $s -h $s "$TMP/solid.svg" -o "$TMP/i$s.png"; done
magick "$TMP/i16.png" "$TMP/i32.png" "$TMP/i48.png" "$OUT/favicon.ico"

# Flat PNG exports of the lockups, for anywhere SVG is not an option.
for f in logo-fa logo-en logo-stacked-fa; do
  sed "s/currentColor/$BRAND/g" "$OUT/$f.svg" > "$TMP/$f.svg"
  rsvg-convert -h 256 "$TMP/$f.svg" -o "$OUT/$f.png"
done

# The docs site serves the same identity; mirror only what its <head> asks for.
DOCS="$ROOT/apps/docs/public"
mkdir -p "$DOCS/brand"
cp "$OUT/favicon.ico" "$DOCS/favicon.ico"
for f in favicon.svg apple-touch-icon.png icon-192.png icon-512.png icon-maskable-512.png mark.svg logo-fa.svg; do
  cp "$OUT/$f" "$DOCS/brand/$f"
done

echo "brand assets written to $OUT"
ls -1 "$OUT"
