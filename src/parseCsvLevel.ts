import type { Level, Log, Orientation } from './types';

/**
 * Parse a CSV grid string into a Level object.
 *
 * Each CSV cell encodes terrain and piece together:
 *   ~       — water/river terrain (no ~ = riverbank)
 *   H       — baby hippo start (capital only; always treated as river)
 *   M       — mama hippo (capital only; water if ~ also present)
 *   a-z / A-Z (except H, M) — log cell; same letter in a contiguous straight line = one log
 *   (empty) — bank, no piece
 *
 * Examples: "~A" = water + log A  |  "A" = bank + log A  |  "~H" = water + hippo
 */
export function parseCsvLevel(id: string, label: string, csvStr: string): Level {
  // 1. Split into lines, trim, drop blank lines
  const lines = csvStr.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) throw new Error('parseCsvLevel: CSV is empty');

  // 2. Split each line on commas → 2D grid of cell strings
  const grid: string[][] = lines.map(line => line.split(',').map(c => c.trim()));

  // 3. Validate consistent column count
  const cols = grid[0].length;
  for (let r = 1; r < grid.length; r++) {
    if (grid[r].length !== cols)
      throw new Error(
        `parseCsvLevel: row ${r} has ${grid[r].length} cells but row 0 has ${cols} — all rows must be the same width`
      );
  }
  const rows = grid.length;

  // 4. Scan cells
  const riverCells = new Set<string>();
  let hippoStart: { row: number; col: number } | null = null;
  let mamaPos: { row: number; col: number } | null = null;
  const logLetterCells = new Map<string, Array<{ row: number; col: number }>>();
  const letterOrder: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];

      if (cell.includes('~')) riverCells.add(`${r},${c}`);

      const letterMatch = cell.match(/[A-Za-z]/);
      if (!letterMatch) continue;
      const letter = letterMatch[0];

      if (letter === 'H') {
        if (hippoStart !== null) throw new Error('parseCsvLevel: multiple H cells found; only one hippo start is allowed');
        hippoStart = { row: r, col: c };
        riverCells.add(`${r},${c}`); // hippo always starts in water
      } else if (letter === 'M') {
        if (mamaPos !== null) throw new Error('parseCsvLevel: multiple M cells found; only one mama hippo is allowed');
        mamaPos = { row: r, col: c };
      } else {
        if (!logLetterCells.has(letter)) {
          letterOrder.push(letter);
          logLetterCells.set(letter, []);
        }
        logLetterCells.get(letter)!.push({ row: r, col: c });
      }
    }
  }

  if (!hippoStart) throw new Error('parseCsvLevel: missing H (hippo start)');
  if (!mamaPos)   throw new Error('parseCsvLevel: missing M (mama hippo)');

  // 5. Build Log objects
  const logs: Log[] = [];
  for (const letter of letterOrder) {
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

  return { id, label, rows, cols, logs, hippoStart, mamaPos, riverCells };
}
