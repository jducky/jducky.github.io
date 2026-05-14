# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static GitHub Pages site hosting **Jigsaw Link Puzzle** — a canvas-based HTML5 jigsaw game where correctly placed adjacent tiles automatically link and move together. Intended for Android WebView wrapping.

No build system, no npm, no bundler. Plain HTML/CSS/JS deployed directly to GitHub Pages.

## Development

**Run locally** — open in a browser. For pack manifest fetching to work (avoids CORS on `fetch`):

```bash
python3 -m http.server 8080
# then visit http://localhost:8080/image-puzzle/jigsaw_link_puzzle_prototype.html
```

**After adding/changing image packs:**

```bash
python3 image-puzzle/scripts/build_packs_manifest.py
```

This regenerates `image-puzzle/assets/packs/manifest.json`, which must be committed alongside the images.

## Architecture

### Entry points

- `image-puzzle/index.html` — immediate meta-refresh redirect to the prototype
- `image-puzzle/jigsaw_link_puzzle_prototype.html` — the actual app; loads scripts in order: `levels.js → storage.js → image-utils.js → game.js`
- Root `index.html` — redirects to `image-puzzle/jigsaw_link_puzzle_prototype.html`

### Script modules (no ES modules — all globals)

| File | Responsibility |
|---|---|
| `levels.js` | Data layer. Globals: `CATEGORIES`, `IMAGES`, `LEVELS`. `initializeLevelData()` fetches the pack manifest and builds all collections. `buildPlayLevels()` expands each image into 4 difficulty levels (3×3–6×6). |
| `storage.js` | localStorage persistence under key `jigsaw-link-mobile-progress-v1`. `normalizeProgress()` handles schema migration (legacy single `customImage` → `customImages[]` array). |
| `image-utils.js` | Canvas helpers. `createLevelArtwork()` generates a seeded procedural gradient when no real image exists. `createCanvasFromSource()` loads an image URL/dataURL into a square canvas with cover-crop. |
| `game.js` | All app logic. Screen state machine (`home` / `level` / `game`). Puzzle state, drag-and-drop (Pointer Events API), Union-Find group linking, snap logic, completion detection. |

### Core game mechanics

**Union-Find linking** — `computeLinks()` in `game.js` runs after every move. It rebuilds groups from scratch by unioning tiles whose relative board offset matches their relative correct-position offset. Tiles in groups > 1 are visually marked and dragged together.

**Snap targeting** — two modes decide where a dropped tile lands:
1. *Correct snap*: if the dragged tile is within `CORRECT_SNAP_THRESHOLD_RATIO × tileSize` of its correct position, it snaps there.
2. *Relative snap*: if the dragged group is within threshold of a position that would place it correctly relative to an already-correct neighbour, it snaps there (enables chain-building). This takes precedence.

Touch devices use `COARSE_*` threshold ratios (~10–15% larger) detected via `matchMedia("(pointer: coarse)")`.

**Group displacement** — when a dragged group overlaps other tiles, `tryMoveDraggedGroup()` uses backtracking (`findGroupRelocationPlan()`) to find free cells that preserve each blocker group's shape, falling back to scattering individual blocker tiles.

### Image pack system

Place images (`.jpg`, `.jpeg`, `.png`, `.webp`) under:

```
image-puzzle/assets/packs/<category-folder-name>/
```

Running the manifest script scans these folders and writes `manifest.json`. The app fetches this at boot via `loadPackManifest()`. Each image automatically generates levels for all four difficulty sizes.

### Cache busting

`APP_ASSET_VERSION` defined inline in `jigsaw_link_puzzle_prototype.html` is appended as `?v=` to every JS, CSS, and manifest URL. Bump this string (e.g. `"20260511-5"`) whenever deploying changed assets.

### Persistence schema (`localStorage`)

```
progress.levels[levelId] = { cleared, stars, bestMoves }
progress.ongoing = { levelId, moves, hintsUsed, shuffleSeed, tiles[] }
progress.customImages[] = { id, name, dataUrl, createdAt }
progress.recentLevelId
```

## Deployment

Push to `main` — GitHub Pages serves the repo root. The `CNAME` file sets the custom domain. No CI build step; committed files are served as-is.
