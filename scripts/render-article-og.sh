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
  # CSS background-image handles SVG sizing reliably (background-size:cover
  # works as expected with SVG viewBox). <img src=svg> with object-fit gave
  # an unreliable render where Chrome left a ~130px black gap below the
  # SVG content. Render at native 1200x675, then centre-crop to 1200x630.
  cat >"$TMP_DIR/wrap.html" <<EOF
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body { margin: 0; padding: 0; background: #0b1120; }
  .frame {
    width: 1200px;
    height: 675px;
    background-image: url('file://$svg_path');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
</style>
</head>
<body>
<div class="frame"></div>
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
  # Chrome headless with --window-size=1200,675 leaves ~75px black at the
  # bottom of the rendered SVG (Chrome doesn't give the document the full
  # window height when sizes match exactly). Render in a 1200x800 viewport
  # so the SVG has headroom, then ImageMagick crops the top 1200x630 strip
  # which contains the actual SVG content (since it sits at y=0..675).
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1200,800 \
    --screenshot="$out_png" \
    --default-background-color=0b1120ff \
    "file://$TMP_DIR/wrap.html" 2>/dev/null
  # Crop the 1200x800 render: take the top 1200x630 (sliced from SVG's
  # 1200x675 — drops bottom 45px which is dark gradient anyway).
  magick "$out_png" -crop 1200x630+0+0 +repage \
    -strip -quality 88 -interlace JPEG "$out_jpg"
  printf "%-40s %s\n" "$slug" "$(du -h "$out_jpg" | cut -f1)"
}

for svg in "$SRC_DIR"/cover-*.svg; do
  render_one "$svg"
done

echo
echo "Done. Output files:"
ls -la "$OUT_DIR"/og-*.jpg | awk '{print $9, $5}'
