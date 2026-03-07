import type { Level, GameState, Log, HippoObstacle } from './types';
import {
  initState, moveLog, moveHippoObstacle,
  logSlideRange, hippoObstacleSlideRange,
} from './gameState';

export type SolverMove =
  | { type: 'hippo'; dr: number; dc: number }
  | { type: 'log'; id: string; newRow: number; newCol: number }
  | { type: 'obstacle'; id: string; newRow: number; newCol: number };

export interface SolveResult {
  solvable: boolean;
  /** Number of log/obstacle slides in the solution (hippo steps not counted). */
  moves?: number;
  /** Full action sequence (hippo steps + slides) from start to win. */
  path?: SolverMove[];
  statesExplored: number;
}

/**
 * Flood-fill from startPos through free river cells, returning all reachable cells.
 */
function hippoReachable(
  level: Level,
  startPos: { row: number; col: number },
  logs: Log[],
  obstacles: HippoObstacle[],
): Set<string> {
  const { mamaPos, mamaWidth = 1, mamaHeight = 1, boulders, bleedTop = 0, bleedBottom = 0, rows, cols } = level;

  const blocked = new Set<string>();
  for (let ri = 0; ri < mamaHeight; ri++)
    for (let ci = 0; ci < mamaWidth; ci++)
      blocked.add(`${mamaPos.row + ri},${mamaPos.col + ci}`);
  for (const b of boulders ?? []) blocked.add(`${b.row},${b.col}`);
  for (const log of logs)
    for (let i = 0; i < log.length; i++)
      blocked.add(log.orientation === 'vertical' ? `${log.row + i},${log.col}` : `${log.row},${log.col + i}`);
  for (const obs of obstacles)
    for (let i = 0; i < 2; i++)
      blocked.add(obs.orientation === 'vertical' ? `${obs.row + i},${obs.col}` : `${obs.row},${obs.col + i}`);

  const isRiverCell = (r: number, c: number) => level.riverCells ? level.riverCells.has(`${r},${c}`) : true;

  const reachable = new Set<string>();
  const startKey = `${startPos.row},${startPos.col}`;
  if (blocked.has(startKey) || !isRiverCell(startPos.row, startPos.col)) return reachable;

  reachable.add(startKey);
  const q: Array<{ row: number; col: number }> = [startPos];
  let head = 0;
  while (head < q.length) {
    const { row, col } = q[head++];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = row + dr, nc = col + dc;
      if (nr < bleedTop || nr >= rows - bleedBottom || nc < 0 || nc >= cols) continue;
      if (!isRiverCell(nr, nc)) continue;
      const key = `${nr},${nc}`;
      if (blocked.has(key) || reachable.has(key)) continue;
      reachable.add(key);
      q.push({ row: nr, col: nc });
    }
  }
  return reachable;
}

/** Top-most then left-most cell in a reachable set — canonical identifier for the region. */
function canonicalPos(reachable: Set<string>): { row: number; col: number } {
  let bestRow = Infinity, bestCol = Infinity;
  for (const key of reachable) {
    const comma = key.indexOf(',');
    const r = Number(key.slice(0, comma));
    const c = Number(key.slice(comma + 1));
    if (r < bestRow || (r === bestRow && c < bestCol)) { bestRow = r; bestCol = c; }
  }
  return { row: bestRow, col: bestCol };
}

/**
 * Returns true if any cell in the reachable set satisfies the win condition
 * (adjacent to any mama cell in 8 directions, including diagonals).
 */
function anyWinCellInRegion(level: Level, reachable: Set<string>): boolean {
  const { mamaPos, mamaWidth = 1, mamaHeight = 1 } = level;
  const mr = mamaPos.row, mc = mamaPos.col;
  for (const key of reachable) {
    const comma = key.indexOf(',');
    const r = Number(key.slice(0, comma));
    const c = Number(key.slice(comma + 1));
    if (r >= mr - 1 && r <= mr + mamaHeight && c >= mc - 1 && c <= mc + mamaWidth) return true;
  }
  return false;
}

/**
 * BFS within the reachable region to find shortest hippo path from start to any win cell.
 */
function hippoPathToWin(level: Level, start: { row: number; col: number }, reachable: Set<string>): SolverMove[] {
  const { mamaPos, mamaWidth = 1, mamaHeight = 1 } = level;
  const mr = mamaPos.row, mc = mamaPos.col;
  const isWin = (r: number, c: number) => r >= mr - 1 && r <= mr + mamaHeight && c >= mc - 1 && c <= mc + mamaWidth;

  if (isWin(start.row, start.col)) return [];

  type Entry = { row: number; col: number; parentIdx: number; dr: number; dc: number };
  const q: Entry[] = [{ row: start.row, col: start.col, parentIdx: -1, dr: 0, dc: 0 }];
  const vis = new Set<string>([`${start.row},${start.col}`]);

  for (let head = 0; head < q.length; head++) {
    const { row, col } = q[head];
    if (isWin(row, col)) {
      const steps: SolverMove[] = [];
      let cur = head;
      while (q[cur].parentIdx !== -1) {
        steps.unshift({ type: 'hippo', dr: q[cur].dr, dc: q[cur].dc });
        cur = q[cur].parentIdx;
      }
      return steps;
    }
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = row + dr, nc = col + dc;
      const key = `${nr},${nc}`;
      if (!reachable.has(key) || vis.has(key)) continue;
      vis.add(key);
      q.push({ row: nr, col: nc, parentIdx: head, dr, dc });
    }
  }
  return [];
}

function stateKey(state: GameState, reachable: Set<string>): string {
  const { row, col } = canonicalPos(reachable);
  const logParts = state.logs.map(l => l.orientation === 'horizontal' ? l.col : l.row);
  const obsParts = state.hippoObstacles.map(o => o.orientation === 'horizontal' ? o.col : o.row);
  return `${row},${col}|${logParts.join(',')}|${obsParts.join(',')}`;
}

function cloneState(state: GameState): GameState {
  return {
    level: state.level,
    logs: state.logs.map(l => ({ ...l })),
    hippoObstacles: state.hippoObstacles.map(h => ({ ...h })),
    hippoPos: { ...state.hippoPos },
    moves: state.moves,
    won: state.won,
  };
}

/**
 * After a piece move, find one representative cell per connected sub-region
 * that the hippo could occupy. A piece move can split the hippo's old region
 * into multiple disconnected parts; we return one cell per part so the BFS
 * explores all of them.
 */
function findHippoStarts(
  oldRegion: Set<string>,
  state: GameState,
): Array<{ row: number; col: number }> {
  const blocked = new Set<string>();
  const { mamaPos, mamaWidth = 1, mamaHeight = 1, boulders } = state.level;
  for (let ri = 0; ri < mamaHeight; ri++)
    for (let ci = 0; ci < mamaWidth; ci++)
      blocked.add(`${mamaPos.row + ri},${mamaPos.col + ci}`);
  for (const b of boulders ?? []) blocked.add(`${b.row},${b.col}`);
  for (const log of state.logs)
    for (let i = 0; i < log.length; i++)
      blocked.add(log.orientation === 'vertical' ? `${log.row + i},${log.col}` : `${log.row},${log.col + i}`);
  for (const obs of state.hippoObstacles)
    for (let i = 0; i < 2; i++)
      blocked.add(obs.orientation === 'vertical' ? `${obs.row + i},${obs.col}` : `${obs.row},${obs.col + i}`);

  // Collect free cells still in the old region.
  const free = new Set<string>();
  for (const key of oldRegion) {
    if (!blocked.has(key)) free.add(key);
  }

  // BFS within `free` to find connected components; return one rep per component.
  const visited = new Set<string>();
  const reps: Array<{ row: number; col: number }> = [];

  for (const key of free) {
    if (visited.has(key)) continue;
    const comma = key.indexOf(',');
    reps.push({ row: Number(key.slice(0, comma)), col: Number(key.slice(comma + 1)) });
    const bfsQ = [key];
    visited.add(key);
    let bfsHead = 0;
    while (bfsHead < bfsQ.length) {
      const cell = bfsQ[bfsHead++];
      const ci = cell.indexOf(',');
      const r = Number(cell.slice(0, ci)), c = Number(cell.slice(ci + 1));
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const nk = `${r + dr},${c + dc}`;
        if (free.has(nk) && !visited.has(nk)) { visited.add(nk); bfsQ.push(nk); }
      }
    }
  }

  return reps;
}

/** Only piece moves — hippo moves always stay within the same connected region,
 *  so they never change the state key and are handled via anyWinCellInRegion.
 *
 *  The hippo is excluded from collision checks: in the actual game the player
 *  can always move the hippo out of a piece's path before sliding it. */
function getPieceMoves(state: GameState): SolverMove[] {
  // Shadow hippo position with an out-of-bounds cell so it doesn't limit slide ranges.
  const s: GameState = { ...state, hippoPos: { row: -999, col: -999 } };
  const moves: SolverMove[] = [];

  for (const log of state.logs) {
    const { min, max } = logSlideRange(s, log.id);
    if (log.orientation === 'horizontal') {
      for (let col = min; col <= max; col++) {
        if (col !== log.col) moves.push({ type: 'log', id: log.id, newRow: log.row, newCol: col });
      }
    } else {
      for (let row = min; row <= max; row++) {
        if (row !== log.row) moves.push({ type: 'log', id: log.id, newRow: row, newCol: log.col });
      }
    }
  }

  for (const obs of state.hippoObstacles) {
    const { min, max } = hippoObstacleSlideRange(s, obs.id);
    if (obs.orientation === 'horizontal') {
      for (let col = min; col <= max; col++) {
        if (col !== obs.col) moves.push({ type: 'obstacle', id: obs.id, newRow: obs.row, newCol: col });
      }
    } else {
      for (let row = min; row <= max; row++) {
        if (row !== obs.row) moves.push({ type: 'obstacle', id: obs.id, newRow: row, newCol: obs.col });
      }
    }
  }

  return moves;
}

function applyPieceMove(state: GameState, move: SolverMove): boolean {
  // Exclude hippo from collision so pieces can slide past its current cell
  // (the hippo steps aside first in actual play).
  const savedHippo = state.hippoPos;
  state.hippoPos = { row: -999, col: -999 };
  let ok: boolean;
  if (move.type === 'log') ok = moveLog(state, move.id, move.newRow, move.newCol);
  else if (move.type === 'obstacle') ok = moveHippoObstacle(state, move.id, move.newRow, move.newCol);
  else ok = false;
  state.hippoPos = savedHippo;
  return ok;
}

const DEFAULT_MAX_STATES = 500_000;

/**
 * BFS solver for a hippo puzzle level.
 *
 * State: (piece configuration, hippo's connected river region). All hippo
 * positions within the same region are equivalent — the hippo can move freely
 * between piece slides.
 *
 * Win detection: checks whether any cell in the hippo's reachable region is
 * adjacent to mama, rather than checking only the hippo's anchor cell.
 *
 * Pieces may slide past the hippo's current cell (the hippo steps aside first).
 * If a piece move splits the hippo's region, one next-state is enqueued per
 * resulting sub-region so all reachable configurations are explored.
 *
 * @param options.maxStates  Stop after exploring this many states (default 500,000).
 */
export function solveLevel(level: Level, options?: { maxStates?: number }): SolveResult {
  const maxStates = options?.maxStates ?? DEFAULT_MAX_STATES;
  const initial = initState(level);

  const initialReachable = hippoReachable(initial.level, initial.hippoPos, initial.logs, initial.hippoObstacles);
  if (anyWinCellInRegion(initial.level, initialReachable)) {
    const path = hippoPathToWin(initial.level, initial.hippoPos, initialReachable);
    return { solvable: true, moves: 0, path, statesExplored: 0 };
  }

  // BFS queue: state + its reachable region + back-pointer for path reconstruction.
  const queue: Array<{ state: GameState; reachable: Set<string>; parentIdx: number; move: SolverMove | null }> = [
    { state: initial, reachable: initialReachable, parentIdx: -1, move: null },
  ];
  const visited = new Map<string, number>(); // stateKey → queue index
  visited.set(stateKey(initial, initialReachable), 0);

  let head = 0;
  while (head < queue.length) {
    if (visited.size >= maxStates) {
      return { solvable: false, statesExplored: visited.size };
    }

    const { state, reachable: oldReachable } = queue[head];

    for (const move of getPieceMoves(state)) {
      const next = cloneState(state);
      if (!applyPieceMove(next, move)) continue;

      // A piece move may split the hippo's old region into disconnected parts.
      // Enumerate one representative per sub-region and enqueue each separately.
      const starts = findHippoStarts(oldReachable, next);
      if (starts.length === 0) continue;

      for (const start of starts) {
        const candidate = cloneState(next);
        candidate.hippoPos = start;

        const reachable = hippoReachable(candidate.level, start, candidate.logs, candidate.hippoObstacles);

        if (anyWinCellInRegion(candidate.level, reachable)) {
          const path: SolverMove[] = [move];
          let cur = head;
          while (queue[cur].move !== null) {
            path.unshift(queue[cur].move!);
            cur = queue[cur].parentIdx;
          }
          for (const step of hippoPathToWin(candidate.level, start, reachable)) {
            path.push(step);
          }
          return { solvable: true, moves: candidate.moves, path, statesExplored: visited.size };
        }

        const key = stateKey(candidate, reachable);
        if (!visited.has(key)) {
          visited.set(key, queue.length);
          queue.push({ state: candidate, reachable, parentIdx: head, move });
        }
      }
    }

    head++;
  }

  return { solvable: false, statesExplored: visited.size };
}
