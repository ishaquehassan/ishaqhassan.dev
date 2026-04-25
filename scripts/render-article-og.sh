#!/usr/bin/env bash
# Render each /assets/articles/cover-<slug>.svg into a 1200x630 OG-ready
# .jpg under /assets/articles/og-<slug>.jpg via Chrome headless.
# JPG over PNG: ~45 KB each vs ~120 KB with PNG8, and social platforms (FB,
# LinkedIn, Slack, Twitter, Discord) all accept JPG. Bundle size matters for
# crawl/share-card load time.
set -e

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT/assets/articles"
OUT_DIR="$ROOT/assets/articles"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Wrapper HTML pegs the SVG to exactly 1200x630 with object-fit:cover so the
# 1200x675 viewBox is sliced to standard OG aspect (1.91:1). One file rendered
# at a time so Chrome can flush between runs.
write_wrapper() {
  local svg_path="$1"
  cat >"$TMP_DIR/wrap.html" <<EOF
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body { margin: 0; padding: 0; background: #0b1120; }
  .frame { width: 1200px; height: 630px; overflow: hidden; }
  .frame img { width: 1200px; height: 630px; object-fit: cover; display: block; }
</style>
</head>
<body>
<div class="frame"><img src="file://$svg_path" alt=""></div>
</body>
</html>
EOF
}

render_one() {
  local svg="$1"
  local slug
  slug="$(basename "$svg" .svg)"
  slug="${slug#cover-}"
  local out_png="$TMP_DIR/$slug.png"
  local out_jpg="$OUT_DIR/og-$slug.jpg"
  write_wrapper "$svg"
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1200,630 \
    --screenshot="$out_png" \
    --default-background-color=0b1120ff \
    "file://$TMP_DIR/wrap.html" 2>/dev/null
  magick "$out_png" -strip -quality 88 -interlace JPEG "$out_jpg"
  printf "%-40s %s\n" "$slug" "$(du -h "$out_jpg" | cut -f1)"
}

for svg in "$SRC_DIR"/cover-*.svg; do
  render_one "$svg"
done

echo
echo "Done. Output files:"
ls -la "$OUT_DIR"/og-*.jpg | awk '{print $9, $5}'
