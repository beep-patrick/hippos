import { parseCsvLevel } from './parseCsvLevel';
import { initState } from './gameState';
import { buildGrid, renderPieces, updateMoveCount, showWin, hideWin } from './renderer';
import { attachInputHandlers } from './input';
import hippoSoundUrl from './sounds/hippo.mp3?url';

const rawCsvs = import.meta.glob('./levels/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const levels = Object.entries(rawCsvs)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, content]) => {
    const stem = path.split('/').pop()!.replace('.csv', '');
    const label = stem.replace(/([A-Za-z])(\d)/g, '$1 $2').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return parseCsvLevel(stem, label, content);
  });

if (levels.length === 0) throw new Error('No CSV levels found in src/levels/');

const container = document.getElementById('game-container')!;
const restartBtn = document.getElementById('restart-btn')!;

let currentLevelIndex = 0;
let cleanupInput: (() => void) | null = null;

// Build the static grid once.
buildGrid(container, levels[0].rows, levels[0].cols, levels[0].riverCells);

function startGame(index: number): void {
  currentLevelIndex = index;
  const level = levels[index];

  // Tear down previous input handlers.
  cleanupInput?.();

  const state = initState(level);

  const labelEl = document.getElementById('level-label');
  if (labelEl) labelEl.textContent = level.label;

  hideWin(container);
  renderPieces(container, state);
  updateMoveCount(0);

  cleanupInput = attachInputHandlers(container, state, () => {
    new Audio(hippoSoundUrl).play();
    const hasNext = currentLevelIndex + 1 < levels.length;
    restartBtn.textContent = hasNext ? 'Next Level' : 'Play Again';
    showWin(container);
  });
}

restartBtn.addEventListener('click', () => {
  const hasNext = currentLevelIndex + 1 < levels.length;
  startGame(hasNext ? currentLevelIndex + 1 : 0);
});

startGame(0);
