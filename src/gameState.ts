import type { GameState, Level, Log } from './types';

export function initState(level: Level): GameState {
  return {
    level,
    logs: level.logs.map(l => ({ ...l })), // mutable copies
    hippoPos: { ...level.hippoStart },
    moves: 0,
    won: false,
  };
}

// Build a Set of occupied "row,col" strings for quick lookup.
// Excludes a specific piece so it can check its own future positions.
function occupiedCells(
  logs: Log[],
  excludeLogId: string | null,
  hippoPos: { row: number; col: number } | null,
): Set<string> {
  const cells = new Set<string>();

  for (const log of logs) {
    if (log.id === excludeLogId) continue;
    for (let i = 0; i < log.length; i++) {
      const r = log.orientation === 'vertical' ? log.row + i : log.row;
      const c = log.orientation === 'horizontal' ? log.col + i : log.col;
      cells.add(`${r},${c}`);
    }
  }

  if (hippoPos) {
    cells.add(`${hippoPos.row},${hippoPos.col}`);
  }

  return cells;
}

// Returns cells occupied by a log at a given position.
function logCells(log: Log, row: number, col: number): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < log.length; i++) {
    cells.push({
      row: log.orientation === 'vertical' ? row + i : row,
      col: log.orientation === 'horizontal' ? col + i : col,
    });
  }
  return cells;
}

function inBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

// Try to move a log to a new anchor position.
// Returns true and mutates the log if valid.
export function moveLog(state: GameState, logId: string, newRow: number, newCol: number): boolean {
  const log = state.logs.find(l => l.id === logId);
  if (!log || state.won) return false;

  // Constrain movement to the log's axis.
  if (log.orientation === 'horizontal' && newRow !== log.row) return false;
  if (log.orientation === 'vertical' && newCol !== log.col) return false;

  const { rows, cols } = state.level;

  // Check all new cells are in bounds.
  const newCells = logCells(log, newRow, newCol);
  if (!newCells.every(c => inBounds(c.row, c.col, rows, cols))) return false;

  // Check no collision (exclude this log, include hippo).
  const blocked = occupiedCells(state.logs, logId, state.hippoPos);
  if (newCells.some(c => blocked.has(`${c.row},${c.col}`))) return false;

  log.row = newRow;
  log.col = newCol;
  state.moves += 1;
  return true;
}

// Try to move the hippo by (dr, dc).
// Returns true and mutates if valid.
export function moveHippo(state: GameState, dr: number, dc: number): boolean {
  if (state.won) return false;

  const { row, col } = state.hippoPos;
  const newRow = row + dr;
  const newCol = col + dc;

  const { rows, cols } = state.level;
  if (!inBounds(newRow, newCol, rows, cols)) return false;

  const blocked = occupiedCells(state.logs, null, null);
  if (blocked.has(`${newRow},${newCol}`)) return false;

  state.hippoPos = { row: newRow, col: newCol };
  state.moves += 1;

  if (newRow === 0 && newCol === state.level.mamaCol) {
    state.won = true;
  }

  return true;
}

// Compute the range a log can slide to (min and max anchor position along its axis).
export function logSlideRange(state: GameState, logId: string): { min: number; max: number } {
  const log = state.logs.find(l => l.id === logId);
  if (!log) return { min: 0, max: 0 };

  const { rows, cols } = state.level;
  const blocked = occupiedCells(state.logs, logId, state.hippoPos);

  if (log.orientation === 'horizontal') {
    // Slide left
    let min = log.col;
    for (let c = log.col - 1; c >= 0; c--) {
      if (blocked.has(`${log.row},${c}`)) break;
      min = c;
    }
    // Slide right
    let max = log.col;
    for (let c = log.col + 1; c + log.length - 1 < cols; c++) {
      if (blocked.has(`${log.row},${c + log.length - 1}`)) break;
      max = c;
    }
    return { min, max };
  } else {
    // Slide up
    let min = log.row;
    for (let r = log.row - 1; r >= 0; r--) {
      if (blocked.has(`${r},${log.col}`)) break;
      min = r;
    }
    // Slide down
    let max = log.row;
    for (let r = log.row + 1; r + log.length - 1 < rows; r++) {
      if (blocked.has(`${r + log.length - 1},${log.col}`)) break;
      max = r;
    }
    return { min, max };
  }
}
