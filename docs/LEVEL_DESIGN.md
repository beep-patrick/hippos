# Level Design Guide

## Grid Size Reference (iPad 10th gen, 820×1114px usable)

| cols | vis.rows | cell px | notes |
|------|----------|---------|-------|
| 10   | 14       | 79.6    | spacious, good for early levels |
| 11   | 15       | 74.3    | near-perfect fit |
| 12   | 16       | 69.6    | good balance |

Always use height-binding configs (extra/edge = 0) so bleed rows stay hidden.

---

## Difficulty Tiers

| Tier     | Move count | Log count | Pattern                      |
|----------|-----------|-----------|------------------------------|
| Beginner | 2–5       | 2–4       | 1 direct blocker             |
| Easy     | 5–8       | 4–6       | 2 sequential blockers        |
| Medium   | 8–15      | 6–10      | chain dependencies           |
| Hard     | 15–25     | 8–14      | cascades + obstacle hippos   |
| Expert   | 25+       | 10–20     | loops, backtracking required |

---

## Core Blocking Patterns

### 1. Direct Blocker (Beginner)
One log perpendicular to hippo's path. Slide it → path clear.

### 2. Sequential Chain
Log A blocks hippo. Log B blocks log A. Solve: B → A → win.
Keep chains to 2–3 links at beginner, 4–5 at advanced.

### 3. Cascade Unlock
Move X → space for Y → space for Z → path open.
The "aha moment" of satisfying puzzles.

### 4. Loop / Deadlock (Expert)
3+ pieces mutually blocking. Player must find the one breakable link.

### 5. Terrain Funnel
River channels force hippo along a narrow route — obstacles become unavoidable.
Use river/bank patterns to constrain the solution space.

### 6. Obstacle Hippo Shuffle
Enemy hippo blocks path. Moving it requires first clearing space for it.
Adds "move the mover" meta-layer.

---

## Minimalism Principle
Every piece must be load-bearing. Test: remove each piece — if puzzle is trivially solvable without it, remove it. No dead weight.

---

## Design Process

1. Place mama near top (row 0–2), usually centered
2. Place hippo near bottom center
3. Trace the intended solution path (what sequence of moves solves it?)
4. Place blockers along that path in reverse order (last blocker first)
5. Add noise pieces sparingly to obscure the solution — but keep minimalism rule
6. Verify: solution exists and no shorter solution exists
7. Playtest: can a child solve it in a reasonable time?

---

## Common Mistakes

- **Impossible configs**: always verify solvable (BFS solver would help — not yet built)
- **Too many pieces**: >15 logs becomes visually overwhelming
- **Obvious solutions**: if first try works, it's too easy
- **Arbitrary moves**: if solution steps feel random, redesign
- **Terrain inconsistency**: obstacle hippos MUST sit on river (`~`) cells; logs can be anywhere

---

## CSV Format Reference

```
~      = river cell
H      = baby hippo start position
M      = mama hippo (1–2 adjacent cells)
A-Z    = log (same letter = one log; straight contiguous line, 2–50 cells)
a-z    = hippo obstacle (lowercase; exactly 2 contiguous river cells)
*      = boulder (immovable)
(empty)= bank terrain, no piece
```

- Row 0 = top (win direction). Rows are 0-indexed.
- Parser auto-adds 1 bleed row at top and bottom.
- Hippo and obstacle hippos can only move through river (`~`) cells.
- Logs can move through any terrain.
- Two adjacent `M` cells → mama spans 2 cells (horizontal if same row, vertical if same column).
