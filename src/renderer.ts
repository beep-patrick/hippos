import type { GameState, Level } from './types';

let CELL_PX = 56; // computed in buildGrid from viewport; fallback default

const HIPPO_SVG = `<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100" style="display:block;width:100%;height:100%">
  <defs>
    <filter id="hippo-outline" x="-5%" y="-5%" width="110%" height="110%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="expanded"/>
      <feFlood flood-color="#4A6FA5" result="color"/>
      <feComposite in="color" in2="expanded" operator="in" result="stroke"/>
      <feMerge>
        <feMergeNode in="stroke"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#hippo-outline)">
    <!-- <rect x="16" y="36" width="68" height="61" rx="16" ry="16" fill="#7B9FD4" /> -->
    <rect x="26" y="4" width="48" height="38" rx="10" ry="10" fill="#7B9FD4" />
    <!-- ears -->
    <ellipse cx="28" cy="42" rx="7" ry="9" transform="rotate(15,28,42)" fill="#7B9FD4" />
    <ellipse cx="72" cy="42" rx="7" ry="9" transform="rotate(-15,72,42)" fill="#7B9FD4" />
  </g>
  <!-- inner ears -->
  <ellipse cx="28" cy="42" rx="3.5" ry="5" transform="rotate(15,28,42)" fill="#9BB8D8" />
  <ellipse cx="72" cy="42" rx="3.5" ry="5" transform="rotate(-15,72,42)" fill="#9BB8D8" />
  <!-- nostrils -->
  <ellipse cx="40" cy="14" rx="5" ry="3.5" fill="#5A7EB5" />
  <ellipse cx="60" cy="14" rx="5" ry="3.5" fill="#5A7EB5" />
  <!-- eyes: semicircular arc strokes, kawaii style -->
  <path d="M 33,27 A 7,7 0 0,0 47,27" fill="none" stroke="#3A5888" stroke-width="2.5" stroke-linecap="round" />
  <path d="M 53,27 A 7,7 0 0,0 67,27" fill="none" stroke="#3A5888" stroke-width="2.5" stroke-linecap="round" />
</svg>`;

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
