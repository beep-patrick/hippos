import type { GameState, Level, Log, HippoObstacle } from './types';

function isRiver(level: Level, row: number, col: number): boolean {
  if (!level.riverCells) return true;
  return level.riverCells.has(`${row},${col}`);
}

export function initState(level: Level): GameState {
  return {
    level,
    logs: level.logs.map(l => ({ ...l })),
    hippoObstacles: level.hippoObstacles.map(h => ({ ...h })),
    hippoPos: { ...level.hippoStart },
    moves: 0,
    won: false,
  };
}

// Build a Set of occupied "row,col" strings for quick lookup.
// excludeId: the id of the piece currently being moved (excluded from the set).
function occupiedCells(
  logs: Log[],
  hippoObstacles: HippoObstacle[],
  excludeId: string | null,
  hippoPos: { row: number; col: number } | null,
  mamaPos?: { row: number; col: number },
  mamaWidth?: number,
  mamaHeight?: number,
  boulders?: Array<{ row: number; col: number }>,
): Set<string> {
  const cells = new Set<string>();

  for (const b of boulders ?? []) {
    cells.add(`${b.row},${b.col}`);
  }

  for (const log of logs) {
    if (log.id === excludeId) continue;
    for (let i = 0; i < log.length; i++) {
      const r = log.orientation === 'vertical' ? log.row + i : log.row;
      const c = log.orientation === 'horizontal' ? log.col + i : log.col;
      cells.add(`${r},${c}`);
    }
  }

  for (const h of hippoObstacles) {
    if (h.id === excludeId) continue;
    for (let i = 0; i < 2; i++) {
      const r = h.orientation === 'vertical' ? h.row + i : h.row;
      const c = h.orientation === 'horizontal' ? h.col + i : h.col;
      cells.add(`${r},${c}`);
    }
  }

  if (hippoPos) {
    cells.add(`${hippoPos.row},${hippoPos.col}`);
  }

  if (mamaPos) {
    const w = mamaWidth ?? 1;
    const h = mamaHeight ?? 1;
    for (let ri = 0; ri < h; ri++) {
      for (let ci = 0; ci < w; ci++) {
        cells.add(`${mamaPos.row + ri},${mamaPos.col + ci}`);
      }
    }
  }

  return cells;
}

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

function isBleedRow(row: number, level: Level): boolean {
  return row < (level.bleedTop ?? 0) || row >= level.rows - (level.bleedBottom ?? 0);
}

// Try to move a log to a new anchor position.
// Returns true and mutates the log if valid.
export function moveLog(state: GameState, logId: string, newRow: number, newCol: number): boolean {
  const log = state.logs.find(l => l.id === logId);
  if (!log || state.won) return false;

  if (log.orientation === 'horizontal' && newRow !== log.row) return false;
  if (log.orientation === 'vertical' && newCol !== log.col) return false;

  const { rows, cols } = state.level;
  const newCells = logCells(log, newRow, newCol);
  if (!newCells.every(c => inBounds(c.row, c.col, rows, cols))) return false;
  if (newCells.some(c => isBleedRow(c.row, state.level))) return false;

  const blocked = occupiedCells(state.logs, state.hippoObstacles, logId, state.hippoPos, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);
  if (newCells.some(c => blocked.has(`${c.row},${c.col}`))) return false;

  log.row = newRow;
  log.col = newCol;
  state.moves += 1;
  return true;
}

// Try to move a hippo obstacle to a new anchor position.
// Returns true and mutates the obstacle if valid.
// Obstacle hippos can only occupy river cells.
export function moveHippoObstacle(state: GameState, obstacleId: string, newRow: number, newCol: number): boolean {
  const obstacle = state.hippoObstacles.find(h => h.id === obstacleId);
  if (!obstacle || state.won) return false;

  if (obstacle.orientation === 'horizontal' && newRow !== obstacle.row) return false;
  if (obstacle.orientation === 'vertical' && newCol !== obstacle.col) return false;

  const { rows, cols } = state.level;
  const newCells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < 2; i++) {
    newCells.push({
      row: obstacle.orientation === 'vertical' ? newRow + i : newRow,
      col: obstacle.orientation === 'horizontal' ? newCol + i : newCol,
    });
  }

  if (!newCells.every(c => inBounds(c.row, c.col, rows, cols))) return false;
  if (newCells.some(c => isBleedRow(c.row, state.level))) return false;
  if (!newCells.every(c => isRiver(state.level, c.row, c.col))) return false;

  const blocked = occupiedCells(state.logs, state.hippoObstacles, obstacleId, state.hippoPos, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);
  if (newCells.some(c => blocked.has(`${c.row},${c.col}`))) return false;

  obstacle.row = newRow;
  obstacle.col = newCol;
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
  if (isBleedRow(newRow, state.level)) return false;
  if (!isRiver(state.level, newRow, newCol)) return false;

  const blocked = occupiedCells(state.logs, state.hippoObstacles, null, null, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);
  if (blocked.has(`${newRow},${newCol}`)) return false;

  state.hippoPos = { row: newRow, col: newCol };
  return true;
}

// Check whether the hippo's current position triggers the win condition.
// Wins when the hippo is adjacent to any mama cell (above, below, or to the side).
// Mama cells themselves are always in occupiedCells so the hippo can never enter them,
// making this effectively an adjacency check from any direction.
export function checkWin(state: GameState): boolean {
  const { row, col } = state.hippoPos;
  const { row: mr, col: mc } = state.level.mamaPos;
  const mw = state.level.mamaWidth ?? 1;
  const mh = state.level.mamaHeight ?? 1;
  if (row >= mr - 1 && row <= mr + mh && col >= mc - 1 && col <= mc + mw) {
    state.won = true;
  }
  return state.won;
}

// Compute how far up/down the hippo can move from a given cell.
export function hippoVerticalRangeAt(state: GameState, row: number, col: number): { min: number; max: number } {
  const { rows } = state.level;
  const bleedTop = state.level.bleedTop ?? 0;
  const bleedBottom = state.level.bleedBottom ?? 0;
  const blocked = occupiedCells(state.logs, state.hippoObstacles, null, null, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);
  let min = row;
  for (let r = row - 1; r >= bleedTop; r--) {
    if (blocked.has(`${r},${col}`) || !isRiver(state.level, r, col)) break;
    min = r;
  }
  let max = row;
  for (let r = row + 1; r < rows - bleedBottom; r++) {
    if (blocked.has(`${r},${col}`) || !isRiver(state.level, r, col)) break;
    max = r;
  }
  return { min, max };
}

// Compute how far left/right the hippo can slide from a given cell.
export function hippoSlideRangeAt(state: GameState, row: number, col: number): { min: number; max: number } {
  const { cols } = state.level;
  const blocked = occupiedCells(state.logs, state.hippoObstacles, null, null, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);
  let min = col;
  for (let c = col - 1; c >= 0; c--) {
    if (blocked.has(`${row},${c}`) || !isRiver(state.level, row, c)) break;
    min = c;
  }
  let max = col;
  for (let c = col + 1; c < cols; c++) {
    if (blocked.has(`${row},${c}`) || !isRiver(state.level, row, c)) break;
    max = c;
  }
  return { min, max };
}

export function hippoVerticalRange(state: GameState): { min: number; max: number } {
  return hippoVerticalRangeAt(state, state.hippoPos.row, state.hippoPos.col);
}

export function hippoSlideRange(state: GameState): { min: number; max: number } {
  return hippoSlideRangeAt(state, state.hippoPos.row, state.hippoPos.col);
}

// Compute the range a log can slide to (min and max anchor position along its axis).
export function logSlideRange(state: GameState, logId: string): { min: number; max: number } {
  const log = state.logs.find(l => l.id === logId);
  if (!log) return { min: 0, max: 0 };

  const { rows, cols } = state.level;
  const blocked = occupiedCells(state.logs, state.hippoObstacles, logId, state.hippoPos, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);

  const bleedTop = state.level.bleedTop ?? 0;
  const bleedBottom = state.level.bleedBottom ?? 0;

  if (log.orientation === 'horizontal') {
    let min = log.col;
    for (let c = log.col - 1; c >= 0; c--) {
      if (blocked.has(`${log.row},${c}`)) break;
      min = c;
    }
    let max = log.col;
    for (let c = log.col + 1; c + log.length - 1 < cols; c++) {
      if (blocked.has(`${log.row},${c + log.length - 1}`)) break;
      max = c;
    }
    return { min, max };
  } else {
    let min = log.row;
    for (let r = log.row - 1; r >= bleedTop; r--) {
      if (blocked.has(`${r},${log.col}`)) break;
      min = r;
    }
    let max = log.row;
    for (let r = log.row + 1; r + log.length - 1 < rows - bleedBottom; r++) {
      if (blocked.has(`${r + log.length - 1},${log.col}`)) break;
      max = r;
    }
    return { min, max };
  }
}

// Compute the range a hippo obstacle can slide to (river cells only).
export function hippoObstacleSlideRange(state: GameState, obstacleId: string): { min: number; max: number } {
  const obstacle = state.hippoObstacles.find(h => h.id === obstacleId);
  if (!obstacle) return { min: 0, max: 0 };

  const { rows, cols } = state.level;
  const blocked = occupiedCells(state.logs, state.hippoObstacles, obstacleId, state.hippoPos, state.level.mamaPos, state.level.mamaWidth, state.level.mamaHeight, state.level.boulders);

  const bleedTop = state.level.bleedTop ?? 0;
  const bleedBottom = state.level.bleedBottom ?? 0;

  if (obstacle.orientation === 'horizontal') {
    let min = obstacle.col;
    for (let c = obstacle.col - 1; c >= 0; c--) {
      if (blocked.has(`${obstacle.row},${c}`)) break;
      if (!isRiver(state.level, obstacle.row, c)) break;
      min = c;
    }
    let max = obstacle.col;
    for (let c = obstacle.col + 1; c + 1 < cols; c++) {
      if (blocked.has(`${obstacle.row},${c + 1}`)) break;
      if (!isRiver(state.level, obstacle.row, c + 1)) break;
      max = c;
    }
    return { min, max };
  } else {
    let min = obstacle.row;
    for (let r = obstacle.row - 1; r >= bleedTop; r--) {
      if (blocked.has(`${r},${obstacle.col}`)) break;
      if (!isRiver(state.level, r, obstacle.col)) break;
      min = r;
    }
    let max = obstacle.row;
    for (let r = obstacle.row + 1; r + 1 < rows - bleedBottom; r++) {
      if (blocked.has(`${r + 1},${obstacle.col}`)) break;
      if (!isRiver(state.level, r + 1, obstacle.col)) break;
      max = r;
    }
    return { min, max };
  }
}
