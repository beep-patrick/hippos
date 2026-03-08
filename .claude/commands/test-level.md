---
description: Test a level CSV — parse, visualize, solve, verify, and assess difficulty
allowed-tools: Bash(npx tsx scripts/test-level.ts:*), Read, Write
---

Run `npx tsx scripts/test-level.ts <target>` where target is one of:
- A path to a CSV file (e.g. `test-puzzle.csv`)
- An existing level name (e.g. `3`)
- `all` to test all existing levels

Optionally pass a second argument for max states (default 500,000).

This will:
1. Parse the CSV into a Level
2. Show an ASCII grid visualization with coordinates
3. Run the BFS solver to find the optimal solution
4. Assess difficulty (tier, pieces moved, interleave count)
5. Print the full move transcript
6. Verify the transcript by replaying through the game engine

Use this to iterate on level designs: write CSV → test → adjust → re-test.
