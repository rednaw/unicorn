#!/usr/bin/env bash
# Optional helper to fetch audio into /static/audio via yt-dlp (Docker).
# Drawings are real artist assets — add them manually under static/drawings/
# and wire them up in src/lib/content.ts.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p static/audio

echo "Audio (excerpts from YouTube via yt-dlp + ffmpeg)..."

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
fetch_audio chopin-polonaise.ogg "Chopin Polonaise A flat major Op 53 Heroic piano solo" "30-90"

echo ""
echo "Done."
echo "Audio: $(ls -1 static/audio | wc -l | tr -d ' ') files"
