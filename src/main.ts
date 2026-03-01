import { parseCsvLevel } from './parseCsvLevel';
import { initState } from './gameState';
import { buildGrid, renderPieces, updateMoveCount, showWin, hideWin } from './renderer';
import { attachInputHandlers } from './input';

const rawCsvs = import.meta.glob('./levels/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const levels = Object.entries(rawCsvs)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, content]) => {
    const stem = path.split('/').pop()!.replace('.csv', '');
    const label = stem.replace(/([A-Za-z])(\d)/g, '$1 $2').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return parseCsvLevel(stem, label, content);
  });

if (levels.length === 0) throw new Error('No CSV levels found in src/levels/');
const level = levels[0];

const container = document.getElementById('game-container')!;

// Build the static grid once.
buildGrid(container, level.rows, level.cols, level.riverCells);

let cleanupInput: (() => void) | null = null;

function startGame(): void {
  // Tear down previous input handlers.
  cleanupInput?.();

  const state = initState(level);

  const labelEl = document.getElementById('level-label');
  if (labelEl) labelEl.textContent = level.label;

  hideWin(container);
  renderPieces(container, state);
  updateMoveCount(0);

  cleanupInput = attachInputHandlers(container, state, () => {
    showWin(container);
  });
}

document.getElementById('restart-btn')?.addEventListener('click', startGame);

startGame();
