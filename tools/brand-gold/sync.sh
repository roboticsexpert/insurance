#!/usr/bin/env bash
# Copy the Bime Gold logo package into the apps that serve it.
#   tools/brand-gold/sync.sh
# Run by tools/brand-gold/build.sh; the apps' public/brand/ folders are generated,
# do not hand-edit them.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$ROOT/brand/bime-gold/traced"

for app in web docs; do
  DEST="$ROOT/apps/$app/public/brand"
  rm -rf "$DEST"
  mkdir -p "$DEST"
  cp "$SRC"/svg/logo.svg              "$DEST/logo.svg"
  cp "$SRC"/svg/logo-on-dark.svg      "$DEST/logo-on-dark.svg"
  cp "$SRC"/svg/logo-stacked.svg      "$DEST/logo-stacked.svg"
  cp "$SRC"/svg/mark.svg              "$DEST/mark.svg"
  cp "$SRC"/svg/mark-on-dark.svg      "$DEST/mark-on-dark.svg"
  cp "$SRC"/svg/favicon.svg           "$DEST/favicon.svg"
  cp "$SRC"/favicon.ico               "$DEST/favicon.ico"
  cp "$SRC"/png/apple-touch-icon-180.png  "$DEST/apple-touch-icon.png"
  cp "$SRC"/png/icon-192.png              "$DEST/icon-192.png"
  cp "$SRC"/png/icon-512.png              "$DEST/icon-512.png"
  cp "$SRC"/png/icon-maskable-512.png     "$DEST/icon-maskable-512.png"
  cat > "$DEST/README.md" <<MD
# Generated — do not edit

Copied from \`brand/bime-gold/traced/\` by \`tools/brand-gold/sync.sh\`.
Change the artwork there and re-run \`tools/brand-gold/build.sh\`.
MD
  echo "synced -> apps/$app/public/brand"
done

# The web app inlines the mark as a React component -- see emit_tsx.py.
"$ROOT/tools/brand-gold/.venv/bin/python" "$ROOT/tools/brand-gold/emit_tsx.py"

# The docs site also serves a bare /favicon.ico
cp "$SRC/favicon.ico" "$ROOT/apps/docs/public/favicon.ico"
echo "synced -> apps/docs/public/favicon.ico"
