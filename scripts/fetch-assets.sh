#!/usr/bin/env bash
# Generates placeholder assets into /static. Idempotent.
# Drawings: visually-distinct SVG line drawings on paper-textured backgrounds.
# Audio:    short procedural piano-like tones via ffmpeg (Docker).
#
# Replace these with real artist work by dropping real files into /static and
# updating src/lib/content.ts. The README has a swap-in guide.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p static/drawings static/audio

PAPER_DEFS='<defs>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 0.92  0 0 0 0 0.89  0 0 0 0 0.82  0 0 0 1 0"/>
    </filter>
    <filter id="pencil">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="1.2"/>
    </filter>
  </defs>'

write_svg() {
	local out="$1"; local label="$2"; local body="$3"
	cat > "static/drawings/$out" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet">
  ${PAPER_DEFS}
  <rect width="800" height="1000" fill="#f1ece1"/>
  <rect width="800" height="1000" filter="url(#paper)" opacity="0.55"/>
  <g stroke="#3a2e22" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.82" filter="url(#pencil)">
${body}
  </g>
  <text x="50%" y="92%" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="32" text-anchor="middle" fill="#3a2e22">${label}</text>
</svg>
SVG
	echo "drawing  $out"
}

echo "Drawings (SVG placeholders)..."

write_svg praying-hands.svg "Figuurstudie, naar Dürer" '    <path d="M340 720 C 320 600, 320 460, 360 360 Q 380 320, 400 360 C 420 460, 420 600, 400 720 Z"/>
    <path d="M400 720 C 380 600, 380 460, 420 360 Q 440 320, 460 360 C 500 460, 500 600, 460 720 Z"/>
    <path d="M360 380 Q 400 340, 440 380"/>
    <path d="M340 560 L 460 560"/>
    <path d="M335 600 L 465 600"/>
    <path d="M330 640 L 470 640"/>'

write_svg foetus-study.svg "Anatomische studie" '    <ellipse cx="400" cy="500" rx="220" ry="280"/>
    <path d="M360 380 C 320 420, 320 500, 360 540 C 400 580, 460 580, 500 540 C 540 500, 540 420, 500 380 C 460 340, 400 340, 360 380 Z"/>
    <path d="M380 540 C 380 600, 360 660, 340 700"/>
    <path d="M420 540 C 440 600, 460 640, 480 680"/>
    <path d="M620 300 L 680 280" stroke-dasharray="4 4"/>
    <path d="M620 500 L 700 500" stroke-dasharray="4 4"/>
    <path d="M620 700 L 680 720" stroke-dasharray="4 4"/>
    <text x="690" y="290" font-family="Cormorant Garamond, Georgia, serif" font-size="18" font-style="italic" fill="#3a2e22">cranium</text>
    <text x="710" y="510" font-family="Cormorant Garamond, Georgia, serif" font-size="18" font-style="italic" fill="#3a2e22">cor</text>
    <text x="690" y="730" font-family="Cormorant Garamond, Georgia, serif" font-size="18" font-style="italic" fill="#3a2e22">pedes</text>'

write_svg seurat-concert.svg "Op het concert" '    <path d="M80 800 L 720 800"/>
    <ellipse cx="200" cy="600" rx="60" ry="180"/>
    <circle cx="200" cy="440" r="44"/>
    <ellipse cx="340" cy="620" rx="58" ry="160"/>
    <circle cx="340" cy="470" r="40"/>
    <ellipse cx="480" cy="600" rx="60" ry="180"/>
    <circle cx="480" cy="440" r="44"/>
    <ellipse cx="620" cy="640" rx="55" ry="140"/>
    <circle cx="620" cy="490" r="38"/>
    <path d="M120 800 L 680 800 L 640 200 L 160 200 Z" opacity="0.4"/>
    <path d="M300 240 L 500 240 L 480 320 L 320 320 Z" opacity="0.5"/>'

write_svg young-hare.svg "Haas in een veld" '    <path d="M260 580 C 240 480, 280 380, 360 360 C 420 350, 480 380, 500 440 C 520 500, 520 580, 480 640 C 440 700, 320 700, 260 580 Z"/>
    <path d="M320 340 C 300 240, 340 180, 360 200 C 380 220, 380 320, 360 360"/>
    <path d="M380 340 C 380 240, 420 180, 440 200 C 460 220, 440 320, 400 360"/>
    <circle cx="360" cy="440" r="6" fill="#3a2e22"/>
    <path d="M340 480 L 380 490 L 360 510 Z" fill="#3a2e22"/>
    <path d="M280 540 L 320 550" stroke-width="1"/>
    <path d="M280 560 L 320 570" stroke-width="1"/>
    <path d="M460 620 L 500 660 Q 520 680, 540 660"/>
    <path d="M100 720 Q 200 700, 280 720" stroke-width="1"/>
    <path d="M520 720 Q 620 700, 720 720" stroke-width="1"/>'

write_svg horse-study.svg "Paardenstudie" '    <path d="M180 720 C 160 600, 200 480, 280 420 C 320 400, 360 420, 380 380 C 400 320, 380 240, 420 200 C 460 180, 500 220, 520 280 C 540 340, 540 400, 520 440 C 540 480, 600 520, 620 580 C 640 640, 600 720, 540 720"/>
    <path d="M420 200 C 460 180, 500 160, 520 200" />
    <circle cx="470" cy="240" r="4" fill="#3a2e22"/>
    <path d="M460 280 L 480 290"/>
    <path d="M200 720 L 200 920" stroke-width="2"/>
    <path d="M260 720 L 260 880" stroke-width="2"/>
    <path d="M520 720 L 520 920" stroke-width="2"/>
    <path d="M580 720 L 580 880" stroke-width="2"/>
    <path d="M600 360 Q 640 340, 680 380" stroke-dasharray="3 3"/>
    <path d="M620 600 Q 700 620, 740 600" stroke-dasharray="3 3"/>'

write_svg kollwitz-self.svg "Zelfportret, 1934" '    <path d="M280 220 C 240 240, 220 320, 240 400 C 260 480, 320 540, 400 540 C 480 540, 540 480, 560 400 C 580 320, 560 240, 520 220 C 480 200, 320 200, 280 220 Z"/>
    <path d="M280 380 C 260 460, 280 540, 320 600 L 480 600 C 520 540, 540 460, 520 380"/>
    <path d="M300 360 Q 340 380, 380 360" stroke-width="2"/>
    <path d="M420 360 Q 460 380, 500 360" stroke-width="2"/>
    <path d="M390 440 Q 400 460, 410 440"/>
    <path d="M340 480 C 360 500, 440 500, 460 480"/>
    <path d="M240 600 C 200 660, 200 760, 240 820 L 560 820 C 600 760, 600 660, 560 600" stroke-width="1.4"/>
    <path d="M260 700 L 540 700" stroke-width="0.8" opacity="0.4"/>
    <path d="M270 740 L 530 740" stroke-width="0.8" opacity="0.4"/>'

echo ""
echo "Audio (1-min excerpts from YouTube via yt-dlp + ffmpeg)..."

# Fetch a ~60s audio excerpt of a YouTube search result, normalised to OGG
# Vorbis with fade-in / fade-out. Idempotent — skips files that already exist.
# Third arg is the in-video section to grab (e.g. "5-65" or "150-210").
fetch_audio() {
	local out="$1"; local query="$2"; local section="${3:-5-65}"
	local target="static/audio/$out"
	if [[ -s "$target" ]]; then
		echo "skip     $out (already present)"
		return 0
	fi
	if docker run --rm -v "$PWD/static/audio:/work" -w /work jauderho/yt-dlp:latest \
		--no-warnings --no-playlist --quiet \
		--download-sections "*${section}" \
		-x --audio-format vorbis --audio-quality 5 \
		--postprocessor-args "ffmpeg:-af afade=t=in:st=0:d=2,afade=t=out:st=58:d=2" \
		-o "${out%.ogg}.%(ext)s" \
		"ytsearch1:$query" 2>&1 >/dev/null; then
		echo "audio    $out"
	else
		echo "fail     $out  ($query)"
		return 1
	fi
}

# Section windows chosen to land on each piece's full / dense passages.
fetch_audio rachmaninov-prelude.ogg "Rachmaninoff Prelude C sharp minor Op 3 No 2 piano solo"        "5-65"
fetch_audio liszt-liebestraum.ogg   "Liszt Liebestraum No 3 piano solo"                              "150-210"
fetch_audio chopin-polonaise.ogg    "Chopin Polonaise A flat major Op 53 Heroic piano solo"          "30-90"

echo ""
echo "Done."
echo "Drawings: $(ls -1 static/drawings | wc -l | tr -d ' ') files"
echo "Audio:    $(ls -1 static/audio    | wc -l | tr -d ' ') files"
