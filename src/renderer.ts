import type { GameState, Level } from './types';
import HIPPO_SVG from './hippo.svg?raw';

let CELL_PX = 56; // computed in buildGrid from viewport; fallback default

function hippoPieceSvg(_size: number): string {
  return HIPPO_SVG;
}

const GRID_PADDING = 48; // total left+right margin around the grid
const UI_HEIGHT    = 80; // #ui bar + margins above the grid

function computeCellPx(rows: number, cols: number): number {
  // Use visualViewport when available — on Safari it correctly excludes
  // the address bar and toolbar from the available height.
  const vw = window.visualViewport?.width  ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const maxW = Math.floor((vw - GRID_PADDING) / cols);
  const maxH = Math.floor((vh - UI_HEIGHT)    / rows);
  return Math.max(40, Math.min(maxW, maxH));
}

export function cellSize(): number {
  return CELL_PX;
}

// Build the static grid background (called once).
export function buildGrid(container: HTMLElement, rows: number, cols: number, riverCells?: Set<string>): void {
  CELL_PX = computeCellPx(rows, cols);
  const grid = container.querySelector<HTMLElement>('#grid')!;
  grid.style.width = `${cols * CELL_PX}px`;
  grid.style.height = `${rows * CELL_PX}px`;
  grid.style.gridTemplateColumns = `repeat(${cols}, ${CELL_PX}px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${CELL_PX}px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      const terrain = (!riverCells || riverCells.has(`${r},${c}`)) ? 'river' : 'bank';
      cell.className = `cell ${terrain}`;
      grid.appendChild(cell);
    }
  }
}

// Update terrain classes on existing cell divs (for level switching).
export function updateTerrainClasses(container: HTMLElement, level: Level): void {
  const grid = container.querySelector<HTMLElement>('#grid')!;
  grid.querySelectorAll<HTMLElement>('.cell').forEach(cell => {
    const isRiver = !level.riverCells || level.riverCells.has(`${cell.dataset.row},${cell.dataset.col}`);
    cell.classList.toggle('river', isRiver);
    cell.classList.toggle('bank', !isRiver);
  });
}


// Render (or re-render) all game pieces onto the grid.
export function renderPieces(container: HTMLElement, state: GameState): void {
  const grid = container.querySelector<HTMLElement>('#grid')!;

  // Remove all existing pieces.
  grid.querySelectorAll('.piece').forEach(el => el.remove());

  // Render logs.
  for (const log of state.logs) {
    const el = document.createElement('div');
    el.className = `piece ${log.orientation === 'horizontal' ? 'log-horizontal' : 'log-vertical'}`;
    el.dataset.id = log.id;

    const w = log.orientation === 'horizontal' ? log.length * CELL_PX : CELL_PX;
    const h = log.orientation === 'vertical'   ? log.length * CELL_PX : CELL_PX;

    el.style.left   = `${log.col * CELL_PX}px`;
    el.style.top    = `${log.row * CELL_PX}px`;
    el.style.width  = `${w}px`;
    el.style.height = `${h}px`;
    el.style.zIndex = '2';

    grid.appendChild(el);
  }

  // Render hippo obstacles (grey logs for now; real art TBD).
  for (const obstacle of state.hippoObstacles) {
    const el = document.createElement('div');
    el.className = `piece hippo-obstacle-${obstacle.orientation}`;
    el.dataset.id = obstacle.id;

    const w = obstacle.orientation === 'horizontal' ? 2 * CELL_PX : CELL_PX;
    const h = obstacle.orientation === 'vertical'   ? 2 * CELL_PX : CELL_PX;

    el.style.left   = `${obstacle.col * CELL_PX}px`;
    el.style.top    = `${obstacle.row * CELL_PX}px`;
    el.style.width  = `${w}px`;
    el.style.height = `${h}px`;
    el.style.zIndex = '3';

    grid.appendChild(el);
  }

  // Render hippo.
  const hippo = document.createElement('div');
  hippo.className = 'piece hippo';
  hippo.dataset.id = 'hippo';
  hippo.innerHTML = hippoPieceSvg(CELL_PX);
  hippo.style.left   = `${state.hippoPos.col * CELL_PX}px`;
  hippo.style.top    = `${state.hippoPos.row * CELL_PX}px`;
  hippo.style.width  = `${CELL_PX}px`;
  hippo.style.height = `${CELL_PX}px`;
  hippo.style.zIndex = '5';
  grid.appendChild(hippo);

  // Render mama hippo at her position in the terrain.
  const mama = document.createElement('div');
  mama.className = 'piece mama';
  mama.dataset.id = 'mama';
  mama.textContent = '🦛';
  mama.style.left     = `${state.level.mamaPos.col * CELL_PX}px`;
  mama.style.top      = `${state.level.mamaPos.row * CELL_PX - Math.round(CELL_PX * 0.2)}px`;
  mama.style.width    = `${(state.level.mamaWidth ?? 1) * CELL_PX}px`;
  mama.style.height   = `${CELL_PX}px`;
  mama.style.fontSize = `${Math.round(CELL_PX * 1.85)}px`;
  mama.style.zIndex   = '4';
  grid.appendChild(mama);
}

// Update only the position of a single piece element (faster than full re-render).
export function updatePiecePosition(
  container: HTMLElement,
  id: string,
  row: number,
  col: number,
): void {
  const grid = container.querySelector<HTMLElement>('#grid')!;
  const el = grid.querySelector<HTMLElement>(`[data-id="${id}"]`);
  if (!el) return;
  el.style.left = `${col * CELL_PX}px`;
  el.style.top  = `${row * CELL_PX}px`;
}

export function updateMoveCount(count: number): void {
  const el = document.getElementById('move-count');
  if (el) el.textContent = String(count);
}

export function showWin(container: HTMLElement): void {
  container.querySelector('#win-overlay')?.classList.add('show');
}

export function hideWin(container: HTMLElement): void {
  container.querySelector('#win-overlay')?.classList.remove('show');
}
