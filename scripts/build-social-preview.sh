#!/usr/bin/env bash
# Rebuild the shared 1200 × 630 sharing card from the site's existing brand mark.
# ImageMagick and DejaVu Sans are only needed to regenerate it, not to serve it.
set -euo pipefail
cd "$(dirname "$0")/.."
font=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
bold=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
magick -size 1200x630 xc:'#14233B' \
  -fill '#1C324F' -draw 'roundrectangle 44,44 1156,586 32,32' \
  -fill '#DE3411' -draw 'roundrectangle 80,80 148,86 3,3' \
  \( assets/favicon.png -resize 130x130 \) -geometry +74+140 -composite \
  -font "$bold" -pointsize 52 -fill white \
  -annotate +232+205 'Ingenuity Systems' \
  -font "$font" -pointsize 23 -fill '#D4DCE8' \
  -annotate +234+249 'Software engineering. Intelligent systems.' \
  -font "$bold" -pointsize 45 -fill white \
  -annotate +80+372 'AI. Automation. Software.' \
  -annotate +80+431 'Connected to your business.' \
  -font "$font" -pointsize 22 -fill '#D4DCE8' \
  -annotate +80+531 'ingenuitysys.com' \
  -strip PNG24:assets/social-preview.png
