import type { GameState, Level } from './types';
import HIPPO_SVG from './hippo.svg?raw';
import ADULT_HIPPO_SVG from './adultHippo.svg?raw';
import MAMA_HIPPO_SVG from './mamaHippo.svg?raw';

let CELL_PX = 56; // computed in buildGrid from viewport; fallback default

function hippoPieceSvg(_size: number): string {
  return HIPPO_SVG;
}

function computeCellPx(visibleRows: number, cols: number): number {
  // The game-container fills whatever space CSS gives it (full width, remaining
  // height after the header). Measure it directly — no arithmetic needed.
  const container = document.getElementById('game-container')!;
  const w = container.clientWidth;
  const h = container.clientHeight;
  return Math.min(w / cols, h / visibleRows);
}

export function cellSize(): number {
  return CELL_PX;
}

// Build the static grid background (called once per level).
// visibleRows: the rows that should fit on screen (excludes bleed rows).
export function buildGrid(container: HTMLElement, rows: number, cols: number, riverCells?: Set<string>, visibleRows?: number): void {
  CELL_PX = computeCellPx(visibleRows ?? rows, cols);
  const grid = container.querySelector<HTMLElement>('#grid')!;
  grid.style.width = `${cols * CELL_PX}px`;
  grid.style.height = `${rows * CELL_PX}px`;
  grid.style.gridTemplateColumns = `repeat(${cols}, ${CELL_PX}px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${CELL_PX}px)`;

  // Clean up any lingering heart animation from previous level.
  const existingInterval = (grid as any)._heartInterval as number | undefined;
  if (existingInterval !== undefined) { clearInterval(existingInterval); delete (grid as any)._heartInterval; }
  grid.querySelector('#hearts-container')?.remove();

  grid.querySelectorAll('.cell').forEach(el => el.remove());

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      const terrain = (!riverCells || riverCells.has(`${r},${c}`)) ? 'river' : 'bank';
      const isBleed = visibleRows !== undefined && visibleRows < rows && (r === 0 || r === rows - 1);
      cell.className = `cell ${terrain}${isBleed ? ' bleed' : ''}`;
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
    const h = log.orientation === 'vertical' ? log.length * CELL_PX : CELL_PX;

    el.style.left = `${log.col * CELL_PX}px`;
    el.style.top = `${log.row * CELL_PX}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.zIndex = '2';

    grid.appendChild(el);
  }

  // Render hippo obstacles.
  for (const obstacle of state.hippoObstacles) {
    const el = document.createElement('div');
    el.className = `piece hippo-obstacle-${obstacle.orientation}`;
    el.dataset.id = obstacle.id;

    const w = obstacle.orientation === 'horizontal' ? 2 * CELL_PX : CELL_PX;
    const h = obstacle.orientation === 'vertical' ? 2 * CELL_PX : CELL_PX;

    el.style.left = `${obstacle.col * CELL_PX}px`;
    el.style.top = `${obstacle.row * CELL_PX}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.zIndex = '3';
    const letter = obstacle.id.replace('obstacle-', '');
    const letterNum = letter.charCodeAt(0) - 'a'.charCodeAt(0) + 1; // a=1, b=2, ...
    const flipped = letterNum % 2 === 0;

    if (obstacle.orientation === 'horizontal') {
      // Rotate SVG 90° clockwise into landscape viewBox.
      // Normal:  translate(200,0) rotate(90) → head faces right
      // Flipped: matrix(0,1,1,0,0,0) = reflect across y=x → head faces left
      const groupTransform = flipped ? 'matrix(0,1,1,0,0,0)' : 'translate(200,0) rotate(90)';
      const svg = ADULT_HIPPO_SVG
        .replace('viewBox="0 0 100 200"', 'viewBox="0 0 200 100"')
        .replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/, `$1<g transform="${groupTransform}">$2</g>$3`);
      el.innerHTML = svg;
    } else {
      // Normal: head at top. Flipped: translate(0,200) scale(1,-1) → head at bottom.
      const svg = flipped
        ? ADULT_HIPPO_SVG.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/, '$1<g transform="translate(0,200) scale(1,-1)">$2</g>$3')
        : ADULT_HIPPO_SVG;
      el.innerHTML = svg;
    }

    grid.appendChild(el);
  }

  // Render boulders.
  for (const boulder of state.level.boulders ?? []) {
    const el = document.createElement('div');
    el.className = 'piece boulder';
    el.style.left = `${boulder.col * CELL_PX}px`;
    el.style.top = `${boulder.row * CELL_PX}px`;
    el.style.width = `${CELL_PX}px`;
    el.style.height = `${CELL_PX}px`;
    el.style.zIndex = '2';
    grid.appendChild(el);
  }

  // Render hippo.
  const hippo = document.createElement('div');
  hippo.className = 'piece hippo';
  hippo.dataset.id = 'hippo';
  hippo.innerHTML = hippoPieceSvg(CELL_PX);
  hippo.style.left = `${state.hippoPos.col * CELL_PX}px`;
  hippo.style.top = `${state.hippoPos.row * CELL_PX}px`;
  hippo.style.width = `${CELL_PX}px`;
  hippo.style.height = `${CELL_PX}px`;
  hippo.style.zIndex = '5';
  grid.appendChild(hippo);

  // Render mama hippo — portrait, head facing down toward the baby.
  // translate(0,200) scale(1,-1) flips the SVG vertically so the head (originally
  // at y=0) ends up at the bottom of the viewBox (y=200), pointing toward baby.
  const mamaSvg = MAMA_HIPPO_SVG
    .replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/, '$1<g transform="translate(0,200) scale(1,-1)">$2</g>$3');
  const mama = document.createElement('div');
  mama.className = 'piece mama';
  mama.dataset.id = 'mama';
  mama.innerHTML = mamaSvg;
  mama.style.left = `${state.level.mamaPos.col * CELL_PX}px`;
  mama.style.top = `${state.level.mamaPos.row * CELL_PX}px`;
  mama.style.width = `${CELL_PX}px`;
  mama.style.height = `${(state.level.mamaHeight ?? 1) * CELL_PX}px`;
  mama.style.zIndex = '4';
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
  el.style.top = `${row * CELL_PX}px`;
}

export function updateMoveCount(count: number): void {
  const el = document.getElementById('move-count');
  if (el) el.textContent = String(count);
}

export function showWin(container: HTMLElement, message: string): void {
  const overlay = container.querySelector('#win-overlay')!;
  const h2 = overlay.querySelector<HTMLElement>('#win-message');
  if (h2) h2.innerHTML = message;
  overlay.classList.add('show');
}

export function hideWin(container: HTMLElement): void {
  container.querySelector('#win-overlay')?.classList.remove('show');
}

const HEART_EMOJIS = ['❤️', '💕', '💗'];

export function startHeartAnimation(container: HTMLElement): void {
  const grid = container.querySelector<HTMLElement>('#grid')!;

  // Remove any previous hearts.
  const existingInterval = (grid as any)._heartInterval as number | undefined;
  if (existingInterval !== undefined) { clearInterval(existingInterval); delete (grid as any)._heartInterval; }
  grid.querySelector('#hearts-container')?.remove();

  const hippoEl = grid.querySelector<HTMLElement>('[data-id="hippo"]');
  const mamaEl = grid.querySelector<HTMLElement>('[data-id="mama"]');
  if (!hippoEl || !mamaEl) return;

  const hippoCX = parseFloat(hippoEl.style.left) + CELL_PX / 2;
  const hippoCY = parseFloat(hippoEl.style.top) + CELL_PX / 2;
  const mamaCX = parseFloat(mamaEl.style.left) + CELL_PX / 2;
  const mamaCY = parseFloat(mamaEl.style.top) + CELL_PX / 2;

  const heartsEl = document.createElement('div');
  heartsEl.id = 'hearts-container';
  heartsEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;overflow:visible;';
  grid.appendChild(heartsEl);

  function spawnHeart(): void {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    const t = Math.random();
    const spread = CELL_PX * 0.9;
    const x = hippoCX + (mamaCX - hippoCX) * t + (Math.random() - 0.5) * spread;
    const y = hippoCY + (mamaCY - hippoCY) * t + (Math.random() - 0.5) * spread * 0.4;
    const size = CELL_PX * (0.35 + Math.random() * 0.35);
    const dur = 1.8 + Math.random() * 0.9;
    heart.style.left = `${x - size / 2}px`;
    heart.style.top = `${y - size / 2}px`;
    heart.style.fontSize = `${size}px`;
    heart.style.setProperty('--dur', `${dur}s`);
    heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
    heartsEl.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
  }

  // Initial burst then steady stream.
  for (let i = 0; i < 4; i++) setTimeout(() => spawnHeart(), i * 130);
  (grid as any)._heartInterval = window.setInterval(spawnHeart, 360);
}

export function stopHeartAnimation(container: HTMLElement): void {
  const grid = container.querySelector<HTMLElement>('#grid')!;
  const interval = (grid as any)._heartInterval as number | undefined;
  if (interval !== undefined) { clearInterval(interval); delete (grid as any)._heartInterval; }
  grid.querySelector('#hearts-container')?.remove();
}
