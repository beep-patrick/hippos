import type { GameState } from './types';
import { moveLog, moveHippo, logSlideRange, hippoSlideRangeAt, hippoVerticalRangeAt } from './gameState';
import { updatePiecePosition, updateMoveCount, cellSize } from './renderer';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPointer(e: PointerEvent): { x: number; y: number } {
  return { x: e.clientX, y: e.clientY };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Walk the hippo one step toward (targetRow, targetCol), trying the axis with
// more distance remaining first. Returns false when fully blocked.
function stepHippoToward(
  state: GameState,
  targetRow: number,
  targetCol: number,
): boolean {
  const dr = Math.sign(targetRow - state.hippoPos.row);
  const dc = Math.sign(targetCol - state.hippoPos.col);
  const rowDist = Math.abs(targetRow - state.hippoPos.row);
  const colDist = Math.abs(targetCol - state.hippoPos.col);

  if (rowDist >= colDist) {
    if (dr !== 0 && moveHippo(state, dr, 0)) return true;
    if (dc !== 0 && moveHippo(state, 0, dc)) return true;
  } else {
    if (dc !== 0 && moveHippo(state, 0, dc)) return true;
    if (dr !== 0 && moveHippo(state, dr, 0)) return true;
  }
  return false;
}

// ─── Drag state ──────────────────────────────────────────────────────────────

interface LogDrag {
  kind: 'log';
  logId: string;
  startPointer: { x: number; y: number };
  startRow: number;
  startCol: number;
  range: { min: number; max: number };
}

interface HippoDrag {
  kind: 'hippo';
  startPointer: { x: number; y: number };
  startRow: number;
  startCol: number;
}

let active: LogDrag | HippoDrag | null = null;

// ─── Public setup ────────────────────────────────────────────────────────────

export function attachInputHandlers(
  container: HTMLElement,
  state: GameState,
  onWin: () => void,
): () => void {
  const grid = container.querySelector<HTMLElement>('#grid')!;
  const abort = new AbortController();
  const opts = { signal: abort.signal };

  // ── pointer down ──
  grid.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.piece');
    if (!target) return;
    const id = target.dataset.id ?? '';
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (id === 'hippo') {
      active = {
        kind: 'hippo',
        startPointer: getPointer(e),
        startRow: state.hippoPos.row,
        startCol: state.hippoPos.col,
      };
    } else {
      const log = state.logs.find(l => l.id === id);
      if (!log) return;
      active = {
        kind: 'log',
        logId: id,
        startPointer: getPointer(e),
        startRow: log.row,
        startCol: log.col,
        range: logSlideRange(state, id),
      };
    }
  }, opts);

  // ── pointer move ──
  window.addEventListener('pointermove', (e) => {
    if (!active) return;
    e.preventDefault();
    const CELL = cellSize();
    const dp = getPointer(e);

    if (active.kind === 'log') {
      const a = active;
      const log = state.logs.find(l => l.id === a.logId);
      if (!log) return;
      const dx = dp.x - a.startPointer.x;
      const dy = dp.y - a.startPointer.y;
      const el = container.querySelector<HTMLElement>(`[data-id="${a.logId}"]`);
      if (!el) return;
      if (log.orientation === 'horizontal') {
        el.style.left = `${clamp(a.startCol + dx / CELL, a.range.min, a.range.max) * CELL}px`;
      } else {
        el.style.top = `${clamp(a.startRow + dy / CELL, a.range.min, a.range.max) * CELL}px`;
      }
    }

    if (active.kind === 'hippo') {
      const a = active;
      const dx = dp.x - a.startPointer.x;
      const dy = dp.y - a.startPointer.y;
      const el = container.querySelector<HTMLElement>('[data-id="hippo"]');
      if (!el) return;
      const { rows, cols } = state.level;

      // Step state to the nearest logical cell the finger is over.
      const targetRow = clamp(Math.round(a.startRow + dy / CELL), 0, rows - 1);
      const targetCol = clamp(Math.round(a.startCol + dx / CELL), 0, cols - 1);
      while (state.hippoPos.row !== targetRow || state.hippoPos.col !== targetCol) {
        if (!stepHippoToward(state, targetRow, targetCol)) break;
        if (state.won) break;
      }

      // Fresh ranges from current logical cell — corners are navigable.
      const hRange = hippoSlideRangeAt(state, state.hippoPos.row, state.hippoPos.col);
      const vRange = hippoVerticalRangeAt(state, state.hippoPos.row, state.hippoPos.col);

      // Visual follows finger, sub-cell smooth, clamped by obstacles.
      el.style.left = `${clamp(a.startCol + dx / CELL, hRange.min, hRange.max) * CELL}px`;
      el.style.top  = `${clamp(a.startRow + dy / CELL, vRange.min, vRange.max) * CELL}px`;
    }
  }, opts);

  // ── pointer up ──
  window.addEventListener('pointerup', (e) => {
    if (!active) return;
    e.preventDefault();
    const CELL = cellSize();
    const dp = getPointer(e);

    if (active.kind === 'log') {
      const a = active;
      const log = state.logs.find(l => l.id === a.logId);
      if (log) {
        const dx = dp.x - a.startPointer.x;
        const dy = dp.y - a.startPointer.y;
        let newRow = a.startRow;
        let newCol = a.startCol;
        if (log.orientation === 'horizontal') {
          newCol = clamp(Math.round(a.startCol + dx / CELL), a.range.min, a.range.max);
        } else {
          newRow = clamp(Math.round(a.startRow + dy / CELL), a.range.min, a.range.max);
        }
        moveLog(state, a.logId, newRow, newCol);
        updatePiecePosition(container, a.logId, log.row, log.col);
        updateMoveCount(state.moves);
      }
    }

    if (active.kind === 'hippo') {
      const a = active;
      const dx = dp.x - a.startPointer.x;
      const dy = dp.y - a.startPointer.y;
      const { rows, cols } = state.level;

      const targetRow = clamp(Math.round(a.startRow + dy / CELL), 0, rows - 1);
      const targetCol = clamp(Math.round(a.startCol + dx / CELL), 0, cols - 1);

      // Walk toward target, stopping at any log.
      while (state.hippoPos.row !== targetRow || state.hippoPos.col !== targetCol) {
        if (!stepHippoToward(state, targetRow, targetCol)) break;
        if (state.won) break;
      }

      // Snap to final logical position.
      const hippoEl = container.querySelector<HTMLElement>('[data-id="hippo"]');
      if (hippoEl) {
        hippoEl.style.left = `${state.hippoPos.col * CELL}px`;
        hippoEl.style.top  = `${state.hippoPos.row * CELL}px`;
      }
      updateMoveCount(state.moves);
      if (state.won) onWin();
    }

    active = null;
  }, opts);

  return () => abort.abort();
}
