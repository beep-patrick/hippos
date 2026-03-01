import type { Level, Log, Orientation } from './types';

/**
 * Parse an ASCII grid string into a Level object.
 *
 * Supported tokens:
 *   .   — empty cell
 *   H   — hippo start position (exactly one required)
 *   M   — mama hippo / win destination on row 0 (exactly one required)
 *   A-Z (except H, M) — log cells; consecutive identical letters in the
 *         same row = horizontal log; same column = vertical log.
 *
 * Grid format is auto-detected from the first line:
 *   Spaced:  ". . A A . M . . . ."  (tokens separated by whitespace)
 *   Compact: "..AA.M...."           (one character per token, no spaces)
 */
export function parseLevel(id: string, label: string, ascii: string): Level {
  // 1. Split + normalize lines (trim whitespace, drop blank lines)
  const rawLines = ascii.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (rawLines.length === 0) throw new Error('parseLevel: grid is empty');

  // 2. Detect format from first line
  const isSpaced = rawLines[0].includes(' ');

  // 3. Tokenize into 2D grid
  const grid: string[][] = rawLines.map((line, i) => {
    if (isSpaced) return line.split(/\s+/);
    const tokens = [...line];
    for (const t of tokens) {
      if (!/^[.A-Z]$/.test(t))
        throw new Error(`parseLevel: unexpected character '${t}' on row ${i}`);
    }
    return tokens;
  });

  // 4. Validate consistent row widths
  const cols = grid[0].length;
  for (let r = 1; r < grid.length; r++) {
    if (grid[r].length !== cols)
      throw new Error(
        `parseLevel: row ${r} has ${grid[r].length} cells but row 0 has ${cols}` +
        ` — all rows must be the same width`
      );
  }
  const rows = grid.length;

  // 5. Locate H and M
  let hippoStart: { row: number; col: number } | null = null;
  let mamaPos: { row: number; col: number } | null = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c];
      if (t === 'H') {
        if (hippoStart !== null) throw new Error('parseLevel: multiple H tokens found; only one hippo start is allowed');
        hippoStart = { row: r, col: c };
      }
      if (t === 'M') {
        if (mamaPos !== null) throw new Error('parseLevel: multiple M tokens found; only one mama hippo is allowed');
        mamaPos = { row: r, col: c };
      }
    }
  }

  if (!hippoStart) throw new Error('parseLevel: missing H (hippo start) in grid');
  if (!mamaPos)   throw new Error('parseLevel: missing M (mama hippo) in grid');
  if (mamaPos.row !== 0)
    throw new Error(`parseLevel: M (mama hippo) must be on row 0, found on row ${mamaPos.row}`);

  const mamaCol = mamaPos.col;

  // 6. Collect log cells in top-to-bottom, left-to-right order
  const letterOrder: string[] = [];
  const letterCells = new Map<string, Array<{ row: number; col: number }>>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c];
      if (t === '.' || t === 'H' || t === 'M') continue;
      if (!letterCells.has(t)) { letterOrder.push(t); letterCells.set(t, []); }
      letterCells.get(t)!.push({ row: r, col: c });
    }
  }

  // 7. Build Log objects
  const logs: Log[] = [];
  for (const letter of letterOrder) {
    const cells = letterCells.get(letter)!;
    const allSameRow = cells.every(c => c.row === cells[0].row);
    const allSameCol = cells.every(c => c.col === cells[0].col);
    if (!allSameRow && !allSameCol)
      throw new Error(`parseLevel: log '${letter}' spans both rows and columns — logs must be straight lines`);

    const orientation: Orientation = allSameRow ? 'horizontal' : 'vertical';
    const sorted = [...cells].sort((a, b) =>
      orientation === 'horizontal' ? a.col - b.col : a.row - b.row
    );

    // Validate contiguity
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], curr = sorted[i];
      const gap = orientation === 'horizontal' ? curr.col - prev.col : curr.row - prev.row;
      if (gap !== 1)
        throw new Error(`parseLevel: log '${letter}' cells are non-contiguous`);
    }

    const length = sorted.length;
    if (length < 2 || length > 5)
      throw new Error(`parseLevel: log '${letter}' has length ${length}; logs must be 2–5 cells`);

    logs.push({
      id: `log-${letter.toLowerCase()}`,
      orientation,
      row: sorted[0].row,
      col: sorted[0].col,
      length,
    });
  }

  return { id, label, rows, cols, logs, hippoStart, mamaCol };
}
