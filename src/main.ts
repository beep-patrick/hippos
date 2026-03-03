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

function startGame(index: number): void {
  currentLevelIndex = index;
  const level = levels[index];

  // Tear down previous input handlers.
  cleanupInput?.();

  const state = initState(level);

  const labelEl = document.getElementById('level-label');
  if (labelEl) labelEl.textContent = level.label;

  hideWin(container);
  const allWater = level.riverCells !== undefined && level.riverCells.size === level.rows * level.cols;
  document.body.style.background = allWater ? '#3a7bbf' : '#4a7a30';
  const visibleRows = level.rows - (level.bleedTop ?? 0) - (level.bleedBottom ?? 0);
  buildGrid(container, level.rows, level.cols, level.riverCells, visibleRows);
  renderPieces(container, state);
  updateMoveCount(0);

  cleanupInput = attachInputHandlers(container, state, () => {
    new Audio(hippoSoundUrl).play();
    const hasNext = currentLevelIndex + 1 < levels.length;
    restartBtn.textContent = hasNext ? 'Next Level' : 'Play Again';
    showWin(container);
  });
}

function getLevelFromUrl(): number {
  const match = window.location.pathname.match(/\/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= levels.length) return num - 1;
  }
  return 0;
}

function navigateTo(index: number): void {
  history.pushState({ levelIndex: index }, '', `/${index + 1}`);
  startGame(index);
}

window.addEventListener('popstate', (e) => {
  startGame(e.state?.levelIndex ?? getLevelFromUrl());
});

restartBtn.addEventListener('click', () => {
  const hasNext = currentLevelIndex + 1 < levels.length;
  navigateTo(hasNext ? currentLevelIndex + 1 : 0);
});

const initialIndex = getLevelFromUrl();
history.replaceState({ levelIndex: initialIndex }, '', `/${initialIndex + 1}`);
startGame(initialIndex);
