import type { GameState } from './types';
import { moveLog, moveHippo, logSlideRange } from './gameState';
import { updatePiecePosition, updateMoveCount, cellSize } from './renderer';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPointer(e: PointerEvent): { x: number; y: number } {
  return { x: e.clientX, y: e.clientY };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Log dragging ────────────────────────────────────────────────────────────

interface DragState {
  logId: string;
  startPointer: { x: number; y: number };
  startRow: number;
  startCol: number;
  range: { min: number; max: number };
}

interface SwipeState {
  startPointer: { x: number; y: number };
}

// Module-level mutable pointers — one drag/swipe at a time.
let drag: DragState | null = null;
let swipe: SwipeState | null = null;

// ─── Public setup ────────────────────────────────────────────────────────────

// Returns a cleanup function that removes all listeners.
export function attachInputHandlers(
  container: HTMLElement,
  state: GameState,
  onWin: () => void,
): () => void {
  const grid = container.querySelector<HTMLElement>('#grid')!;
  const abort = new AbortController();
  const opts = { signal: abort.signal };

  // ── pointer down on pieces ──
  grid.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.piece');
    if (!target) return;
    const id = target.dataset.id ?? '';

    if (id === 'hippo') {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      swipe = { startPointer: getPointer(e) };
    } else {
      const log = state.logs.find(l => l.id === id);
      if (!log) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drag = {
        logId: id,
        startPointer: getPointer(e),
        startRow: log.row,
        startCol: log.col,
        range: logSlideRange(state, id),
      };
    }
  }, opts);

  // ── pointer move (global) ──
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    e.preventDefault();

    const log = state.logs.find(l => l.id === drag!.logId);
    if (!log) return;

    const CELL = cellSize();
    const dp = getPointer(e);
    const dx = dp.x - drag.startPointer.x;
    const dy = dp.y - drag.startPointer.y;
    const el = container.querySelector<HTMLElement>(`[data-id="${drag.logId}"]`);
    if (!el) return;

    if (log.orientation === 'horizontal') {
      const visual = clamp(drag.startCol + dx / CELL, drag.range.min, drag.range.max);
      el.style.left = `${visual * CELL}px`;
    } else {
      const visual = clamp(drag.startRow + dy / CELL, drag.range.min, drag.range.max);
      el.style.top = `${visual * CELL}px`;
    }
  }, opts);

  // ── pointer up (global) ──
  window.addEventListener('pointerup', (e) => {
    // Handle log release.
    if (drag) {
      e.preventDefault();
      const log = state.logs.find(l => l.id === drag!.logId);
      if (log) {
        const CELL = cellSize();
        const dp = getPointer(e);
        const dx = dp.x - drag.startPointer.x;
        const dy = dp.y - drag.startPointer.y;

        let newRow = drag.startRow;
        let newCol = drag.startCol;

        if (log.orientation === 'horizontal') {
          newCol = clamp(drag.startCol + Math.round(dx / CELL), drag.range.min, drag.range.max);
        } else {
          newRow = clamp(drag.startRow + Math.round(dy / CELL), drag.range.min, drag.range.max);
        }

        moveLog(state, drag.logId, newRow, newCol);
        updatePiecePosition(container, drag.logId, log.row, log.col);
        updateMoveCount(state.moves);
      }
      drag = null;
    }

    // Handle hippo swipe release.
    if (swipe) {
      e.preventDefault();
      const CELL = cellSize();
      const dp = getPointer(e);
      const dx = dp.x - swipe.startPointer.x;
      const dy = dp.y - swipe.startPointer.y;

      let dr = 0;
      let dc = 0;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) >= CELL * 0.3) dc = dx > 0 ? 1 : -1;
      } else {
        if (Math.abs(dy) >= CELL * 0.3) dr = dy > 0 ? 1 : -1;
      }

      if (dr !== 0 || dc !== 0) {
        const moved = moveHippo(state, dr, dc);
        if (moved) {
          updatePiecePosition(container, 'hippo', state.hippoPos.row, state.hippoPos.col);
          updateMoveCount(state.moves);
          if (state.won) onWin();
        }
      }

      swipe = null;
    }
  }, opts);

  return () => abort.abort();
}
