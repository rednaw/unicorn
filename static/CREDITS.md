# Placeholder content credits

This prototype uses **placeholder assets** generated and sourced automatically by
`scripts/fetch-assets.sh`. Swap them for real artist work when ready
(see the project README).

## Drawings (`/static/drawings/`)

Six **procedurally generated SVG line drawings** with paper-textured backgrounds,
themed to suggest famous public-domain works. The lines are simple schematic
illustrations — not reproductions of the originals.

| File | Suggests |
|---|---|
| `praying-hands.svg` | Albrecht Dürer, *Praying Hands* (1508) |
| `foetus-study.svg`  | Leonardo da Vinci, *Studies of the foetus in the womb* (c. 1511) |
| `seurat-concert.svg`| Georges Seurat, *Au Concert Européen* (1887) |
| `young-hare.svg`    | Albrecht Dürer, *Young Hare* (1502) |
| `horse-study.svg`   | Leonardo da Vinci, horse studies (c. 1490) |
| `kollwitz-self.svg` | Käthe Kollwitz, *Self-Portrait* (1934) |

The original works are **in the public domain worldwide**. Wikimedia Commons hosts
high-resolution scans if you want to replace these placeholders with the real thing.

## Audio (`/static/audio/`)

Three ~60-second excerpts sourced via `yt-dlp` from the **first YouTube search
result** for each piece, then trimmed with a 2-second fade-in / fade-out and
re-encoded to OGG Vorbis.

| File | Piece |
|---|---|
| `rachmaninov-prelude.ogg` | Sergei Rachmaninoff, *Prelude in C-sharp minor, Op. 3 No. 2* |
| `liszt-liebestraum.ogg`   | Franz Liszt, *Liebesträume No. 3 in A-flat major, S. 541* (middle section) |
| `chopin-polonaise.ogg`    | Frédéric Chopin, *Polonaise in A-flat major "Heroic", Op. 53* |

The **compositions** are in the public domain (Liszt died 1886, Chopin 1849,
Rachmaninoff 1943 — all PD in the EU under life + 70 years). The
**performance recordings** behind these excerpts are not chosen for licensing
clearance — they are temporary placeholders so the prototype can demonstrate
audio behaviour. For anything beyond a prototype, replace them with recordings
you have rights to (e.g. CC0 recordings from [Musopen](https://musopen.org) or
licensed performances).

To regenerate: `./scripts/fetch-assets.sh` (uses `jauderho/yt-dlp` and
`jrottenberg/ffmpeg` Docker images; idempotent).

## Poetry (`src/lib/content.ts`)

Inlined excerpts of **public-domain Dutch-language verse**:

| Author | Poem |
|---|---|
| Herman Gorter | *Mei* (opening, 1889) |
| Guido Gezelle | *Het schrijverke* (first stanza) |
| Hendrik Marsman | *Herinnering aan Holland* (first stanza, 1936) |
| J. H. Leopold | *Om mijn oud woonhuis peppels staan* (excerpt) |
| Henriette Roland Holst | *De zachte krachten zullen zeker winnen* (first quatrain, 1909) |

All authors died before 1955; their works are in the public domain in the EU
(life + 70 years) and elsewhere.
