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
 * Compute the set of all cells a piece sweeps through during a slide.
 * The hippo must not be in any of these cells when the slide happens.
 */
function computeSweep(state: GameState, move: SolverMove): Set<string> {
  const sweep = new Set<string>();
  if (move.type === 'log') {
    const log = state.logs.find(l => l.id === move.id);
    if (!log) return sweep;
    if (log.orientation === 'horizontal') {
      const minCol = Math.min(log.col, move.newCol);
      const maxCol = Math.max(log.col, move.newCol) + log.length - 1;
      for (let c = minCol; c <= maxCol; c++) sweep.add(`${log.row},${c}`);
    } else {
      const minRow = Math.min(log.row, move.newRow);
      const maxRow = Math.max(log.row, move.newRow) + log.length - 1;
      for (let r = minRow; r <= maxRow; r++) sweep.add(`${r},${log.col}`);
    }
  } else if (move.type === 'obstacle') {
    const obs = state.hippoObstacles.find(h => h.id === move.id);
    if (!obs) return sweep;
    if (obs.orientation === 'horizontal') {
      const minCol = Math.min(obs.col, move.newCol);
      const maxCol = Math.max(obs.col, move.newCol) + 1; // length 2: +1 for tail
      for (let c = minCol; c <= maxCol; c++) sweep.add(`${obs.row},${c}`);
    } else {
      const minRow = Math.min(obs.row, move.newRow);
      const maxRow = Math.max(obs.row, move.newRow) + 1; // length 2: +1 for tail
      for (let r = minRow; r <= maxRow; r++) sweep.add(`${r},${obs.col}`);
    }
  }
  return sweep;
}

/**
 * After a piece move, find one representative cell per connected sub-region
 * that the hippo could validly occupy.
 *
 * The hippo must have been somewhere NOT in the piece's sweep path when the
 * slide happened. We find connected components among old-region cells that
 * are: (a) not in the sweep path, (b) not blocked by the piece's new position.
 * Each component is a valid "where the hippo was during the slide" region,
 * and we return one representative per component.
 */
function findHippoStarts(
  oldRegion: Set<string>,
  state: GameState,    // state AFTER the piece move
  sweep: Set<string>,  // all cells the piece swept through
): Array<{ row: number; col: number }> {
  // Build blocked set from the new piece positions.
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

  // Safe cells: in old region, not blocked by new piece position, not in sweep path.
  const safe = new Set<string>();
  for (const key of oldRegion) {
    if (!blocked.has(key) && !sweep.has(key)) safe.add(key);
  }

  if (safe.size === 0) return []; // hippo had nowhere to stand — move impossible

  // BFS within `safe` to find connected components; return one rep per component.
  const visited = new Set<string>();
  const reps: Array<{ row: number; col: number }> = [];

  for (const key of safe) {
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
        if (safe.has(nk) && !visited.has(nk)) { visited.add(nk); bfsQ.push(nk); }
      }
    }
  }

  return reps;
}

/** Only piece moves — hippo moves always stay within the same connected region,
 *  so they never change the state key and are handled via anyWinCellInRegion.
 *
 *  The hippo is excluded from collision checks: in the actual game the player
 *  can always move the hippo out of a piece's path before sliding it (as long
 *  as the hippo is not completely surrounded by the sweep path). */
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
  // Exclude hippo from collision so the piece's range isn't artificially limited.
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
 * adjacent to mama.
 *
 * Correctness: before a piece slides, the hippo must be at a cell that is not
 * in the piece's sweep path. We compute the sweep and exclude those cells when
 * re-anchoring the hippo after each piece move.
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
      // Compute sweep BEFORE applying the move (uses old piece positions).
      const sweep = computeSweep(state, move);

      const next = cloneState(state);
      if (!applyPieceMove(next, move)) continue;

      // Find valid hippo positions: old-region cells not in the sweep path,
      // grouped by connected component. Each component is a separate next-state.
      const starts = findHippoStarts(oldReachable, next, sweep);
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
