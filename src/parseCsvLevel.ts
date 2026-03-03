import type { Level, Log, HippoObstacle, Orientation } from './types';

/**
 * Parse a CSV grid string into a Level object.
 *
 * Each CSV cell encodes terrain and piece together:
 *   ~       — water/river terrain (no ~ = riverbank)
 *   H       — baby hippo start (capital only; always treated as river)
 *   M       — mama hippo (capital only; water if ~ also present)
 *   A-Z (except H, M) — log cell; same letter in a contiguous straight line = one log
 *   a-z     — obstacle hippo cell; must be exactly 2 contiguous cells, all on river (~)
 *   (empty) — bank, no piece
 *
 * Examples: "~A" = water + log A  |  "A" = bank + log A  |  "~a,~a" = two river cells with obstacle hippo a
 */
export function parseCsvLevel(id: string, label: string, csvStr: string): Level {
  // 1. Split into lines, trim, drop blank lines
  const lines = csvStr.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) throw new Error('parseCsvLevel: CSV is empty');

  // 2. Split each line on commas → 2D grid of cell strings
  const grid: string[][] = lines.map(line => line.split(',').map(c => c.trim()));

  // 3. Infer cols from widest row; pad shorter rows with empty strings.
  // This tolerates CSV editors that strip trailing empty cells.
  const cols = Math.max(...grid.map(row => row.length));
  for (const row of grid) {
    while (row.length < cols) row.push('');
  }
  const rows = grid.length;

  // 4. Scan cells
  const riverCells = new Set<string>();
  const boulders: Array<{ row: number; col: number }> = [];
  let hippoStart: { row: number; col: number } | null = null;
  const mamaCells: Array<{ row: number; col: number }> = [];
  const logLetterCells = new Map<string, Array<{ row: number; col: number }>>();
  const logLetterOrder: string[] = [];
  const obstacleCells = new Map<string, Array<{ row: number; col: number }>>();
  const obstacleOrder: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];

      if (cell.includes('~')) riverCells.add(`${r},${c}`);
      if (cell.includes('*')) { boulders.push({ row: r, col: c }); continue; }

      const letterMatch = cell.match(/[A-Za-z]/);
      if (!letterMatch) continue;
      const letter = letterMatch[0];

      if (letter === 'H') {
        if (hippoStart !== null) throw new Error('parseCsvLevel: multiple H cells found; only one hippo start is allowed');
        hippoStart = { row: r, col: c };
        riverCells.add(`${r},${c}`); // hippo always starts in water
      } else if (letter === 'M') {
        mamaCells.push({ row: r, col: c });
      } else if (letter === letter.toUpperCase()) {
        // uppercase = log
        if (!logLetterCells.has(letter)) {
          logLetterOrder.push(letter);
          logLetterCells.set(letter, []);
        }
        logLetterCells.get(letter)!.push({ row: r, col: c });
      } else {
        // lowercase = obstacle hippo
        if (!obstacleCells.has(letter)) {
          obstacleOrder.push(letter);
          obstacleCells.set(letter, []);
        }
        obstacleCells.get(letter)!.push({ row: r, col: c });
      }
    }
  }

  if (!hippoStart) throw new Error('parseCsvLevel: missing H (hippo start)');
  if (mamaCells.length === 0) throw new Error('parseCsvLevel: missing M (mama hippo)');
  if (mamaCells.length > 2) throw new Error('parseCsvLevel: too many M cells; mama can span at most 2 cells');

  let mamaPos: { row: number; col: number };
  let mamaWidth: number;
  let mamaHeight: number;
  if (mamaCells.length === 2) {
    const sameRow = mamaCells[0].row === mamaCells[1].row;
    const sameCol = mamaCells[0].col === mamaCells[1].col;
    if (!sameRow && !sameCol)
      throw new Error('parseCsvLevel: two M cells must be in the same row or same column');
    if (sameRow) {
      // Horizontal mama
      const [left, right] = mamaCells[0].col < mamaCells[1].col ? mamaCells : [mamaCells[1], mamaCells[0]];
      if (right.col - left.col !== 1)
        throw new Error('parseCsvLevel: two M cells must be adjacent (no gap)');
      mamaPos = { row: left.row, col: left.col };
      mamaWidth = 2;
      mamaHeight = 1;
    } else {
      // Vertical mama
      const [top, bottom] = mamaCells[0].row < mamaCells[1].row ? mamaCells : [mamaCells[1], mamaCells[0]];
      if (bottom.row - top.row !== 1)
        throw new Error('parseCsvLevel: two M cells must be adjacent (no gap)');
      mamaPos = { row: top.row, col: top.col };
      mamaWidth = 1;
      mamaHeight = 2;
    }
  } else {
    mamaPos = mamaCells[0];
    mamaWidth = 1;
    mamaHeight = 1;
  }

  // 5. Build Log objects
  const logs: Log[] = [];
  for (const letter of logLetterOrder) {
    const cells = logLetterCells.get(letter)!;
    const allSameRow = cells.every(c => c.row === cells[0].row);
    const allSameCol = cells.every(c => c.col === cells[0].col);
    if (!allSameRow && !allSameCol)
      throw new Error(`parseCsvLevel: log '${letter}' spans both rows and columns — logs must be straight lines`);

    const orientation: Orientation = allSameRow ? 'horizontal' : 'vertical';
    const sorted = [...cells].sort((a, b) =>
      orientation === 'horizontal' ? a.col - b.col : a.row - b.row
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], curr = sorted[i];
      const gap = orientation === 'horizontal' ? curr.col - prev.col : curr.row - prev.row;
      if (gap !== 1)
        throw new Error(`parseCsvLevel: log '${letter}' cells are non-contiguous`);
    }

    const length = sorted.length;
    if (length < 2 || length > 50)
      throw new Error(`parseCsvLevel: log '${letter}' has length ${length}; logs must be 2–50 cells`);

    logs.push({
      id: `log-${letter}`,
      orientation,
      row: sorted[0].row,
      col: sorted[0].col,
      length,
    });
  }

  // 6. Build HippoObstacle objects (lowercase letters)
  const hippoObstacles: HippoObstacle[] = [];
  for (const letter of obstacleOrder) {
    const cells = obstacleCells.get(letter)!;
    const allSameRow = cells.every(c => c.row === cells[0].row);
    const allSameCol = cells.every(c => c.col === cells[0].col);
    if (!allSameRow && !allSameCol)
      throw new Error(`parseCsvLevel: obstacle hippo '${letter}' spans both rows and columns — must be a straight line`);

    const orientation: Orientation = allSameRow ? 'horizontal' : 'vertical';
    const sorted = [...cells].sort((a, b) =>
      orientation === 'horizontal' ? a.col - b.col : a.row - b.row
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], curr = sorted[i];
      const gap = orientation === 'horizontal' ? curr.col - prev.col : curr.row - prev.row;
      if (gap !== 1)
        throw new Error(`parseCsvLevel: obstacle hippo '${letter}' cells are non-contiguous`);
    }

    if (sorted.length !== 2)
      throw new Error(`parseCsvLevel: obstacle hippo '${letter}' must be exactly 2 cells (got ${sorted.length})`);

    for (const cell of sorted) {
      if (!riverCells.has(`${cell.row},${cell.col}`))
        throw new Error(`parseCsvLevel: obstacle hippo '${letter}' at row ${cell.row}, col ${cell.col} is not a river cell — mark with ~`);
    }

    hippoObstacles.push({
      id: `obstacle-${letter}`,
      orientation,
      row: sorted[0].row,
      col: sorted[0].col,
    });
  }

  // Add 1 bleed row at top and bottom. Shift all piece positions down by 1, then
  // copy the terrain of the first/last real rows into the bleed rows.
  const bleedTop = 1;
  const bleedBottom = 1;

  hippoStart.row += 1;
  mamaPos.row    += 1;
  for (const l of logs)           l.row += 1;
  for (const h of hippoObstacles) h.row += 1;
  for (const b of boulders)       b.row += 1;

  // Rebuild riverCells: shift existing rows, then fill bleed rows from adjacent real rows.
  let finalRiverCells = riverCells;
  if (riverCells.size > 0) {
    const shifted = new Set<string>();
    for (const key of riverCells) {
      const [r, c] = key.split(',');
      shifted.add(`${Number(r) + 1},${c}`);
    }
    // Top bleed row (row 0) mirrors new row 1 (original row 0).
    for (let c = 0; c < cols; c++) {
      if (shifted.has(`1,${c}`)) shifted.add(`0,${c}`);
    }
    // Bottom bleed row mirrors new row `rows` (original last row).
    const newLastReal = rows; // rows not yet incremented
    for (let c = 0; c < cols; c++) {
      if (shifted.has(`${newLastReal},${c}`)) shifted.add(`${newLastReal + 1},${c}`);
    }
    finalRiverCells = shifted;
  }

  const finalRows = rows + 2;

  return { id, label, rows: finalRows, cols, logs, hippoObstacles, hippoStart, mamaPos, mamaWidth, mamaHeight, riverCells: finalRiverCells, boulders, bleedTop, bleedBottom };
}
