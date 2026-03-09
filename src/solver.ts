import type { Level, Log, HippoObstacle } from './types';

export type SolverMove =
  | { type: 'hippo'; dr: number; dc: number }
  | { type: 'log'; id: string; newRow: number; newCol: number }
  | { type: 'obstacle'; id: string; newRow: number; newCol: number };

/** Human-readable transcript entry. */
export interface TranscriptEntry {
  /** 'slide' for piece moves, 'hippo' for hippo repositioning */
  action: 'slide' | 'hippo';
  /** Piece id (e.g. 'log-J', 'obstacle-a') or 'hippo' */
  piece: string;
  /** Direction: 'left'|'right'|'up'|'down' */
  direction: string;
  /** Number of cells moved */
  distance: number;
  /** Target cell (row, col) */
  target: { row: number; col: number };
}

export interface SolveResult {
  solvable: boolean;
  /** Number of piece slides in the optimal solution (hippo steps not counted). */
  moves?: number;
  /** Full transcript: hippo steps interleaved with piece slides. */
  path?: SolverMove[];
  /** Human-readable transcript with directions and distances. */
  transcript?: TranscriptEntry[];
  statesExplored: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIRS: ReadonlyArray<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function ck(r: number, c: number): string { return `${r},${c}`; }

function pk(key: string): [number, number] {
  const i = key.indexOf(',');
  return [+key.slice(0, i), +key.slice(i + 1)];
}

function isRiver(level: Level, r: number, c: number): boolean {
  return !level.riverCells || level.riverCells.has(ck(r, c));
}

function inPlay(r: number, c: number, level: Level): boolean {
  return r >= (level.bleedTop ?? 0) && r < level.rows - (level.bleedBottom ?? 0)
    && c >= 0 && c < level.cols;
}

/** Set of all cells blocked by pieces + mama + boulders. Optionally exclude one piece. */
function blocked(level: Level, logs: Log[], obs: HippoObstacle[], excludeId?: string): Set<string> {
  const s = new Set<string>();
  const mw = level.mamaWidth ?? 1, mh = level.mamaHeight ?? 1;
  for (let ri = 0; ri < mh; ri++)
    for (let ci = 0; ci < mw; ci++)
      s.add(ck(level.mamaPos.row + ri, level.mamaPos.col + ci));
  for (const b of level.boulders ?? []) s.add(ck(b.row, b.col));
  for (const log of logs) {
    if (log.id === excludeId) continue;
    for (let i = 0; i < log.length; i++)
      s.add(log.orientation === 'vertical' ? ck(log.row + i, log.col) : ck(log.row, log.col + i));
  }
  for (const o of obs) {
    if (o.id === excludeId) continue;
    for (let i = 0; i < 2; i++)
      s.add(o.orientation === 'vertical' ? ck(o.row + i, o.col) : ck(o.row, o.col + i));
  }
  return s;
}

/** Flood-fill reachable river cells from a start position. */
function flood(level: Level, sr: number, sc: number, blk: Set<string>): Set<string> {
  const sk = ck(sr, sc);
  if (blk.has(sk) || !isRiver(level, sr, sc)) return new Set();
  const region = new Set<string>([sk]);
  const q: [number, number][] = [[sr, sc]];
  let h = 0;
  while (h < q.length) {
    const [r, c] = q[h++];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (!inPlay(nr, nc, level) || !isRiver(level, nr, nc)) continue;
      const k = ck(nr, nc);
      if (blk.has(k) || region.has(k)) continue;
      region.add(k);
      q.push([nr, nc]);
    }
  }
  return region;
}

/** Canonical cell of a region (top-left). */
function canon(region: Set<string>): string {
  let br = Infinity, bc = Infinity;
  for (const k of region) {
    const [r, c] = pk(k);
    if (r < br || (r === br && c < bc)) { br = r; bc = c; }
  }
  return ck(br, bc);
}

/** Does any cell in region satisfy win adjacency to mama? */
function wins(level: Level, region: Set<string>): boolean {
  const mr = level.mamaPos.row, mc = level.mamaPos.col;
  const mw = level.mamaWidth ?? 1, mh = level.mamaHeight ?? 1;
  for (const k of region) {
    const [r, c] = pk(k);
    if (r >= mr - 1 && r <= mr + mh && c >= mc - 1 && c <= mc + mw) return true;
  }
  return false;
}

/** Win cells in a region. */
function winCells(level: Level, region: Set<string>): Set<string> {
  const mr = level.mamaPos.row, mc = level.mamaPos.col;
  const mw = level.mamaWidth ?? 1, mh = level.mamaHeight ?? 1;
  const s = new Set<string>();
  for (const k of region) {
    const [r, c] = pk(k);
    if (r >= mr - 1 && r <= mr + mh && c >= mc - 1 && c <= mc + mw) s.add(k);
  }
  return s;
}

/** BFS state key. */
function skey(logs: Log[], obs: HippoObstacle[], regionCanon: string): string {
  const p: number[] = [];
  for (const l of logs) p.push(l.orientation === 'horizontal' ? l.col : l.row);
  for (const o of obs) p.push(o.orientation === 'horizontal' ? o.col : o.row);
  return `${regionCanon}|${p.join(',')}`;
}

// ---------------------------------------------------------------------------
// Piece move generation (hippo excluded from blocking)
// ---------------------------------------------------------------------------

type PieceMove =
  | { type: 'log'; id: string; newRow: number; newCol: number }
  | { type: 'obstacle'; id: string; newRow: number; newCol: number };

function genPieceMoves(level: Level, logs: Log[], obs: HippoObstacle[]): PieceMove[] {
  const moves: PieceMove[] = [];
  const bt = level.bleedTop ?? 0, bb = level.bleedBottom ?? 0;

  for (const log of logs) {
    const blk = blocked(level, logs, obs, log.id);
    if (log.orientation === 'horizontal') {
      let min = log.col;
      for (let c = log.col - 1; c >= 0; c--) { if (blk.has(ck(log.row, c))) break; min = c; }
      let max = log.col;
      for (let c = log.col + 1; c + log.length - 1 < level.cols; c++) {
        if (blk.has(ck(log.row, c + log.length - 1))) break; max = c;
      }
      for (let c = min; c <= max; c++)
        if (c !== log.col) moves.push({ type: 'log', id: log.id, newRow: log.row, newCol: c });
    } else {
      let min = log.row;
      for (let r = log.row - 1; r >= bt; r--) { if (blk.has(ck(r, log.col))) break; min = r; }
      let max = log.row;
      for (let r = log.row + 1; r + log.length - 1 < level.rows - bb; r++) {
        if (blk.has(ck(r + log.length - 1, log.col))) break; max = r;
      }
      for (let r = min; r <= max; r++)
        if (r !== log.row) moves.push({ type: 'log', id: log.id, newRow: r, newCol: log.col });
    }
  }

  for (const o of obs) {
    const blk = blocked(level, logs, obs, o.id);
    if (o.orientation === 'horizontal') {
      let min = o.col;
      for (let c = o.col - 1; c >= 0; c--) {
        if (blk.has(ck(o.row, c)) || !isRiver(level, o.row, c)) break; min = c;
      }
      let max = o.col;
      for (let c = o.col + 1; c + 1 < level.cols; c++) {
        if (blk.has(ck(o.row, c + 1)) || !isRiver(level, o.row, c + 1)) break; max = c;
      }
      for (let c = min; c <= max; c++)
        if (c !== o.col) moves.push({ type: 'obstacle', id: o.id, newRow: o.row, newCol: c });
    } else {
      let min = o.row;
      for (let r = o.row - 1; r >= bt; r--) {
        if (blk.has(ck(r, o.col)) || !isRiver(level, r, o.col)) break; min = r;
      }
      let max = o.row;
      for (let r = o.row + 1; r + 1 < level.rows - bb; r++) {
        if (blk.has(ck(r + 1, o.col)) || !isRiver(level, r + 1, o.col)) break; max = r;
      }
      for (let r = min; r <= max; r++)
        if (r !== o.row) moves.push({ type: 'obstacle', id: o.id, newRow: r, newCol: o.col });
    }
  }

  return moves;
}

// ---------------------------------------------------------------------------
// Sweep & safe-cell logic
// ---------------------------------------------------------------------------

function sweep(
  orient: string, row: number, col: number, len: number, newRow: number, newCol: number,
): Set<string> {
  const s = new Set<string>();
  if (orient === 'horizontal') {
    const lo = Math.min(col, newCol), hi = Math.max(col, newCol) + len - 1;
    for (let c = lo; c <= hi; c++) s.add(ck(row, c));
  } else {
    const lo = Math.min(row, newRow), hi = Math.max(row, newRow) + len - 1;
    for (let r = lo; r <= hi; r++) s.add(ck(r, col));
  }
  return s;
}

/** Apply a piece move, returning new arrays. */
function apply(logs: Log[], obs: HippoObstacle[], m: PieceMove): { logs: Log[]; obs: HippoObstacle[] } {
  if (m.type === 'log') {
    return {
      logs: logs.map(l => l.id === m.id ? { ...l, row: m.newRow, col: m.newCol } : l),
      obs,
    };
  }
  return {
    logs,
    obs: obs.map(o => o.id === m.id ? { ...o, row: m.newRow, col: m.newCol } : o),
  };
}

/**
 * After a piece move, find connected components of "safe" cells in the old region.
 * Safe = in old region, not in sweep path, not blocked by new piece positions.
 * Returns one representative per component (for flood-filling the new region).
 */
function safeReps(
  level: Level,
  oldRegion: Set<string>,
  sw: Set<string>,
  newLogs: Log[],
  newObs: HippoObstacle[],
): [number, number][] {
  const newBlk = blocked(level, newLogs, newObs);
  const safe = new Set<string>();
  for (const k of oldRegion) {
    if (!sw.has(k) && !newBlk.has(k)) safe.add(k);
  }
  if (safe.size === 0) return [];

  const visited = new Set<string>();
  const reps: [number, number][] = [];
  for (const k of safe) {
    if (visited.has(k)) continue;
    reps.push(pk(k));
    const q = [k]; visited.add(k);
    let h = 0;
    while (h < q.length) {
      const [r, c] = pk(q[h++]);
      for (const [dr, dc] of DIRS) {
        const nk = ck(r + dr, c + dc);
        if (safe.has(nk) && !visited.has(nk)) { visited.add(nk); q.push(nk); }
      }
    }
  }
  return reps;
}

// ---------------------------------------------------------------------------
// BFS path within a region (for hippo movement)
// ---------------------------------------------------------------------------

function bfsPathInRegion(
  sr: number, sc: number, targets: Set<string>, walkable: Set<string>,
): SolverMove[] {
  const sk = ck(sr, sc);
  if (targets.has(sk)) return [];
  const parent = new Map<string, { from: string; dr: number; dc: number }>();
  parent.set(sk, { from: '', dr: 0, dc: 0 });
  const q: [number, number][] = [[sr, sc]];
  let h = 0;
  while (h < q.length) {
    const [r, c] = q[h++];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      const nk = ck(nr, nc);
      if (!walkable.has(nk) || parent.has(nk)) continue;
      parent.set(nk, { from: ck(r, c), dr, dc });
      if (targets.has(nk)) {
        const path: SolverMove[] = [];
        let cur = nk;
        while (cur !== sk) { const p = parent.get(cur)!; path.unshift({ type: 'hippo', dr: p.dr, dc: p.dc }); cur = p.from; }
        return path;
      }
      q.push([nr, nc]);
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main solver
// ---------------------------------------------------------------------------

const DEFAULT_MAX = 500_000;

export function solveLevel(level: Level, options?: { maxStates?: number }): SolveResult {
  const maxStates = options?.maxStates ?? DEFAULT_MAX;

  const logs0 = level.logs.map(l => ({ ...l }));
  const obs0 = level.hippoObstacles.map(o => ({ ...o }));
  const blk0 = blocked(level, logs0, obs0);
  const region0 = flood(level, level.hippoStart.row, level.hippoStart.col, blk0);

  if (region0.size === 0) return { solvable: false, statesExplored: 0 };

  // Check immediate win
  if (wins(level, region0)) {
    const wc = winCells(level, region0);
    const path = bfsPathInRegion(level.hippoStart.row, level.hippoStart.col, wc, region0);
    return { solvable: true, moves: 0, path, statesExplored: 0 };
  }

  // BFS on (piece positions, hippo region)
  // anchor = a cell the hippo occupies in this state (used for transcript)
  interface Node {
    logs: Log[];
    obs: HippoObstacle[];
    rcanon: string;
    parentIdx: number;
    move: PieceMove | null;
    anchor: [number, number];  // hippo position in this state's region
  }

  const c0 = canon(region0);
  const k0 = skey(logs0, obs0, c0);
  const queue: Node[] = [{
    logs: logs0, obs: obs0, rcanon: c0, parentIdx: -1, move: null,
    anchor: [level.hippoStart.row, level.hippoStart.col],
  }];
  const visited = new Set<string>([k0]);

  let head = 0;
  while (head < queue.length) {
    if (visited.size >= maxStates) return { solvable: false, statesExplored: visited.size };

    const nd = queue[head];

    // Recompute region from canonical cell
    const [cr, cc] = pk(nd.rcanon);
    const blk = blocked(level, nd.logs, nd.obs);
    const region = flood(level, cr, cc, blk);

    for (const move of genPieceMoves(level, nd.logs, nd.obs)) {
      // Identify piece being moved
      let orient: string, pRow: number, pCol: number, len: number;
      if (move.type === 'log') {
        const l = nd.logs.find(x => x.id === move.id)!;
        orient = l.orientation; pRow = l.row; pCol = l.col; len = l.length;
      } else {
        const o = nd.obs.find(x => x.id === move.id)!;
        orient = o.orientation; pRow = o.row; pCol = o.col; len = 2;
      }

      const sw = sweep(orient, pRow, pCol, len, move.newRow, move.newCol);
      const { logs: nLogs, obs: nObs } = apply(nd.logs, nd.obs, move);
      const reps = safeReps(level, region, sw, nLogs, nObs);

      for (const [rr, rc] of reps) {
        const nBlk = blocked(level, nLogs, nObs);
        const nRegion = flood(level, rr, rc, nBlk);
        if (nRegion.size === 0) continue;

        const nc = canon(nRegion);
        const nk = skey(nLogs, nObs, nc);
        if (visited.has(nk)) continue;
        visited.add(nk);

        if (wins(level, nRegion)) {
          // Reconstruct step sequence with anchors
          const steps: { move: PieceMove; anchor: [number, number] }[] =
            [{ move, anchor: [rr, rc] }];
          let cur = head;
          while (queue[cur].move !== null) {
            steps.unshift({ move: queue[cur].move!, anchor: queue[cur].anchor });
            cur = queue[cur].parentIdx;
          }
          const startAnchor = queue[cur].anchor;
          const { path, transcript } = buildTranscript(level, steps, startAnchor);
          return { solvable: true, moves: steps.length, path, transcript, statesExplored: visited.size };
        }

        queue.push({
          logs: nLogs, obs: nObs, rcanon: nc, parentIdx: head, move,
          anchor: [rr, rc],
        });
      }
    }
    head++;
  }

  return { solvable: false, statesExplored: visited.size };
}

// ---------------------------------------------------------------------------
// Transcript: replay piece moves and fill in hippo steps
// ---------------------------------------------------------------------------

function buildTranscript(
  level: Level,
  steps: { move: PieceMove; anchor: [number, number] }[],
  startAnchor: [number, number],
): { path: SolverMove[]; transcript: TranscriptEntry[] } {
  const out: SolverMove[] = [];
  const transcript: TranscriptEntry[] = [];
  let logs = level.logs.map(l => ({ ...l }));
  let obs = level.hippoObstacles.map(o => ({ ...o }));
  let hr = startAnchor[0], hc = startAnchor[1];

  function addHippoMove(toR: number, toC: number) {
    if (hr === toR && hc === toC) return;
    const dr = toR - hr, dc = toC - hc;
    // Pick primary direction for the transcript
    let direction: string;
    if (Math.abs(dr) >= Math.abs(dc)) direction = dr > 0 ? 'down' : 'up';
    else direction = dc > 0 ? 'right' : 'left';
    const distance = Math.abs(dr) + Math.abs(dc);
    transcript.push({ action: 'hippo', piece: 'hippo', direction, distance, target: { row: toR, col: toC } });
  }

  for (const { move: m, anchor } of steps) {
    const blk = blocked(level, logs, obs);
    const region = flood(level, hr, hc, blk);

    // Walk hippo to anchor
    const [ar, ac] = anchor;
    if (hr !== ar || hc !== ac) {
      const target = new Set<string>([ck(ar, ac)]);
      const hippoSteps = bfsPathInRegion(hr, hc, target, region);
      for (const s of hippoSteps) {
        out.push(s);
        if (s.type === 'hippo') { hr += s.dr; hc += s.dc; }
      }
      addHippoMove(ar, ac);
    }

    // Sweep fallback
    let orient: string, pRow: number, pCol: number, len: number;
    if (m.type === 'log') {
      const l = logs.find(x => x.id === m.id)!;
      orient = l.orientation; pRow = l.row; pCol = l.col; len = l.length;
    } else {
      const o = obs.find(x => x.id === m.id)!;
      orient = o.orientation; pRow = o.row; pCol = o.col; len = 2;
    }
    const sw = sweep(orient, pRow, pCol, len, m.newRow, m.newCol);
    if (sw.has(ck(hr, hc))) {
      const safeTgts = new Set<string>();
      for (const k of region) if (!sw.has(k)) safeTgts.add(k);
      const hippoSteps = bfsPathInRegion(hr, hc, safeTgts, region);
      const prevR = hr, prevC = hc;
      for (const s of hippoSteps) {
        out.push(s);
        if (s.type === 'hippo') { hr += s.dr; hc += s.dc; }
      }
      if (hr !== prevR || hc !== prevC) addHippoMove(hr, hc);
    }

    // Piece slide: compute direction and distance
    let slideDir: string, slideDist: number;
    if (orient === 'horizontal') {
      slideDist = Math.abs(m.newCol - pCol);
      slideDir = m.newCol > pCol ? 'right' : 'left';
    } else {
      slideDist = Math.abs(m.newRow - pRow);
      slideDir = m.newRow > pRow ? 'down' : 'up';
    }
    transcript.push({
      action: 'slide', piece: m.id,
      direction: slideDir, distance: slideDist,
      target: { row: m.newRow, col: m.newCol },
    });

    out.push(m);
    const res = apply(logs, obs, m);
    logs = res.logs; obs = res.obs;
  }

  // Walk hippo to win cell
  const blk = blocked(level, logs, obs);
  const region = flood(level, hr, hc, blk);
  const wc = winCells(level, region);
  const hippoSteps = bfsPathInRegion(hr, hc, wc, region);
  const prevR = hr, prevC = hc;
  for (const s of hippoSteps) {
    out.push(s);
    if (s.type === 'hippo') { hr += s.dr; hc += s.dc; }
  }
  if (hr !== prevR || hc !== prevC) addHippoMove(hr, hc);

  return { path: out, transcript };
}
