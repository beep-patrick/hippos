---
description: ASCII-render a level to see the grid layout
allowed-tools: Bash(npx tsx scripts/visualize-level.ts:*), Read
---

Run `npx tsx scripts/visualize-level.ts <target>` where target is one of:
- A path to a CSV file (e.g. `test-puzzle.csv`)
- An existing level name (e.g. `3`)
- `all` to visualize all existing levels

Shows:
- Level info (dimensions, piece counts, river cells, hippo/mama positions)
- ASCII grid with row/column numbers, where:
  - `~~` = river, `  ` = bank, `##` = bleed row
  - `MM` = mama, `HH` = baby hippo
  - `~A` = log A on river, ` A` = log A on bank
  - `~a` = obstacle hippo a, `**` = boulder
