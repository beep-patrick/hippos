# Hippo Puzzle Game

Browser-based sliding puzzle game for tablets (iPad 10th gen primary target). Rush Hour / Unblock Me style. Baby hippo must reach mama hippo by sliding logs out of the way.

## Tech Stack

- Vite + TypeScript (no framework)
- DOM rendering with CSS Grid + absolutely positioned piece divs
- Pointer events for touch + mouse (tablet-first)

## Key Files

- `src/types.ts` — Log, Level, GameState interfaces
- `src/gameState.ts` — initState, moveLog, moveHippo, logSlideRange, checkWin
- `src/renderer.ts` — buildGrid, renderPieces, updatePiecePosition, showWin/hideWin
- `src/input.ts` — attachInputHandlers (returns cleanup fn); uses AbortController
- `src/main.ts` — entry point, wires everything together
- `src/parseCsvLevel.ts` — CSV → Level parser
- `src/levels/*.csv` — level CSV files (one per level, the native format)
- `docs/levels.numbers` — Numbers spreadsheet source; exported to CSV files
- `docs/LEVEL_DESIGN.md` — level design guide and patterns
- `docs/templates/` — Rush Hour conversion templates
- `src/solver.ts` — BFS solver (optimal piece-slide count, full transcript)
- `scripts/test-level.ts` — parse + visualize + solve + verify a level
- `scripts/visualize-level.ts` — ASCII grid renderer
- `scripts/load-levels.ts` — shared helper to scan CSV level files

## Game Mechanics

- Baby hippo moves up/down/left/right through river cells only
- Logs slide along their axis (horizontal ↔, vertical ↕); can cross any terrain
- Hippo obstacles (enemy hippos) slide like logs but are river-only
- Win condition: hippo reaches adjacency (any of 8 surrounding cells) with mama hippo
- Row 0 = top of grid (win direction); rows are 0-indexed

## Level Format (CSV)

Each level is a `.csv` file in `src/levels/`. Levels can also be authored in `levels.numbers` and exported to CSV.

```
~      = river cell (hippo/obstacles can only move here)
H      = baby hippo start position
M      = mama hippo (1–2 adjacent cells; 2 → spans 2 cells)
A-Z    = log (same letter = one log; straight contiguous line, 2–50 cells)
a-z    = hippo obstacle (exactly 2 contiguous river cells)
*      = boulder (immovable)
(empty)= bank terrain
```

Parser auto-adds 1 bleed row at top and bottom (pieces can't enter bleed rows).

## Grid Sizing (iPad 10th gen, 820×1114px usable)

`cellPx = Math.min(820/cols, 1114/visibleRows)`

Always use height-binding configs so bleed rows stay hidden:

| cols | vis.rows | cell px |
|------|----------|---------|
| 10   | 14       | 79.6    |
| 11   | 15       | 74.3    |
| 12   | 16       | 69.6    |

## Patterns / Conventions

- `attachInputHandlers` returns a cleanup fn; call it before re-init on restart
- Pieces are re-rendered fully on restart (`.piece` elements removed and recreated)
- Static grid cells are built once per level load (not rebuilt on restart)
- Logs drag smoothly (sub-cell visual), snap to grid on release
- Hippo moves by swipe gesture: pointer down on hippo, pointer up with direction

## Workflow: Adding / Editing Levels

### From CSV (preferred)
1. Create/edit a `.csv` file in `src/levels/` (e.g. `12.csv`)
2. Test with `npx tsx scripts/test-level.ts 12` (or pass a file path)
3. Levels load automatically in the game — sorted numerically by filename

### From Numbers spreadsheet
1. Edit `docs/levels.numbers` in Numbers (each sheet = one level)
2. Run the `export-levels` skill to export sheets as individual CSV files
3. Test in browser at the relevant level URL (`/1`, `/2`, etc.)

See `docs/LEVEL_DESIGN.md` for level design principles and difficulty guidance.
