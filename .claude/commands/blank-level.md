---
description: Generate a blank all-river level CSV template (default 6x10)
allowed-tools: Bash(npx tsx scripts/blank-level.ts:*)
---

Run `npx tsx scripts/blank-level.ts [cols] [visRows] [outFile]` to generate a blank all-river CSV template.

Defaults: 6 cols x 10 visible rows (111px cells, height-binding, bleed hidden on iPad).

- No arguments: prints CSV to stdout
- With file path: writes CSV to file

Mama is placed centered at rows 0-1, hippo centered at the bottom row.
Fill in pieces using A-Z (logs) and a-z (obstacle hippos).
