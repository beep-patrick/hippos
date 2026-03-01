import type { GameState } from './types';
import { moveLog, moveHippo, logSlideRange, hippoSlideRange } from './gameState';
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
  startCol: number;
  slideRange: { min: number; max: number };
}

// Module-level mutable pointers — one drag/swipe at a time.
let drag: DragState | null = null;
let swipe: SwipeState | null = null;

// ─── Auto-advance ────────────────────────────────────────────────────────────

// Move the hippo up (dr = -1) as many steps as possible, then animate the DOM.
// Returns true if the hippo moved at all.
function autoAdvanceHippo(
  container: HTMLElement,
  state: GameState,
  onWin: () => void,
): boolean {
  let steps = 0;
  while (moveHippo(state, -1, 0)) {
    steps++;
    if (state.won) break;
  }
  if (steps === 0) return false;

  updateMoveCount(state.moves);

  const CELL = cellSize();
  const grid = container.querySelector<HTMLElement>('#grid')!;
  const el = grid.querySelector<HTMLElement>('[data-id="hippo"]');
  if (!el) return true;

  // ~0.2 s per row so a full 10-row advance takes ~2 s.
  const duration = Math.max(0.6, steps * 0.4);
  el.style.transition = `top ${duration}s ease-in-out`;
  el.style.top = `${state.hippoPos.row * CELL}px`;

  el.addEventListener('transitionend', () => {
    el.style.transition = '';
    if (state.won) onWin();
  }, { once: true });

  return true;
}

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
      swipe = { startPointer: getPointer(e), startCol: state.hippoPos.col, slideRange: hippoSlideRange(state) };
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
    if (!drag && !swipe) return;
    e.preventDefault();

    const CELL = cellSize();

    if (drag) {
      const log = state.logs.find(l => l.id === drag!.logId);
      if (!log) return;
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
    }

    if (swipe) {
      const dp = getPointer(e);
      const dx = dp.x - swipe.startPointer.x;
      const dy = dp.y - swipe.startPointer.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        const el = container.querySelector<HTMLElement>('[data-id="hippo"]');
        if (el) {
          const visual = clamp(swipe.startCol + dx / CELL, swipe.slideRange.min, swipe.slideRange.max);
          el.style.left = `${visual * CELL}px`;
        }
      }
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
        autoAdvanceHippo(container, state, onWin);
      }
      drag = null;
    }

    // Handle hippo release.
    if (swipe) {
      e.preventDefault();
      const CELL = cellSize();
      const dp = getPointer(e);
      const dx = dp.x - swipe.startPointer.x;
      const dy = dp.y - swipe.startPointer.y;
      const hippoEl = container.querySelector<HTMLElement>('[data-id="hippo"]');

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal drag: snap to nearest reachable column.
        const targetCol = clamp(
          swipe.startCol + Math.round(dx / CELL),
          swipe.slideRange.min,
          swipe.slideRange.max,
        );
        const dir = Math.sign(targetCol - swipe.startCol);
        if (dir !== 0) {
          for (let i = 0; i < Math.abs(targetCol - swipe.startCol); i++) {
            if (!moveHippo(state, 0, dir)) break;
          }
          updateMoveCount(state.moves);
          autoAdvanceHippo(container, state, onWin);
        }
        // Snap left to final grid column (autoAdvanceHippo only touches top).
        if (hippoEl) hippoEl.style.left = `${state.hippoPos.col * CELL}px`;
      } else {
        // Vertical swipe.
        if (Math.abs(dy) >= CELL * 0.3) {
          const dr = dy > 0 ? 1 : -1;
          const moved = moveHippo(state, dr, 0);
          if (moved) {
            updatePiecePosition(container, 'hippo', state.hippoPos.row, state.hippoPos.col);
            updateMoveCount(state.moves);
            if (state.won) { onWin(); }
            else { autoAdvanceHippo(container, state, onWin); }
          }
        } else {
          // No significant movement — snap visual back to grid.
          if (hippoEl) hippoEl.style.left = `${state.hippoPos.col * CELL}px`;
        }
      }

      swipe = null;
    }
  }, opts);

  return () => abort.abort();
}
