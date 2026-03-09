import { parseCsvLevel } from './parseCsvLevel';
import { initState } from './gameState';
import { buildGrid, renderPieces, updateMoveCount, showWin, hideWin, startHeartAnimation, stopHeartAnimation } from './renderer';
import { attachInputHandlers } from './input';
import hippoSoundUrl from './sounds/hippo.mp3?url';

// Load all CSV level files from src/levels/. Vite resolves these at build time.
const csvModules = import.meta.glob('./levels/*.csv', { eager: true, query: '?raw', import: 'default' });

// Sort by numeric name (1.csv, 2.csv, ..., 11.csv, draft-level-12.csv, ...)
const levelEntries = Object.entries(csvModules)
  .map(([path, csv]) => {
    const filename = path.split('/').pop()!.replace('.csv', '');
    return { name: filename, csv: csv as string };
  })
  .sort((a, b) => {
    const na = parseInt(a.name, 10), nb = parseInt(b.name, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return a.name.localeCompare(b.name);
  });

const levels = levelEntries.map(({ name, csv }) =>
  parseCsvLevel(name.toLowerCase().replace(/\s+/g, '-'), name, csv)
);

if (levels.length === 0) throw new Error('No level CSV files found in src/levels/');

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
  if (labelEl) labelEl.textContent = /^\d+$/.test(level.label) ? `Level ${level.label}` : level.label;

  hideWin(container);
  const allWater = level.riverCells !== undefined && level.riverCells.size === level.rows * level.cols;
  document.body.style.background = allWater ? '#3a7bbf' : '#4a7a30';
  const visibleRows = level.rows - (level.bleedTop ?? 0) - (level.bleedBottom ?? 0);
  buildGrid(container, level.rows, level.cols, level.riverCells, visibleRows);
  renderPieces(container, state);
  updateMoveCount(0);

  cleanupInput = attachInputHandlers(container, state, () => {
    const audio = new Audio(hippoSoundUrl);
    startHeartAnimation(container);
    audio.play();
    audio.addEventListener('ended', () => {
      stopHeartAnimation(container);
      const hasNext = currentLevelIndex + 1 < levels.length;
      if (hasNext) {
        navigateTo(currentLevelIndex + 1);
      } else {
        showWin(container, 'You finished the game!<br>Ask your dad for more levels :)');
      }
    });
  });
}

// Base path of the app, e.g. '/hippos' on GitHub Pages and in local dev.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function getLevelFromUrl(): number {
  const match = window.location.pathname.match(/\/([^/]+)$/);
  if (match) {
    const name = match[1];
    const index = levelEntries.findIndex(e => e.name === name);
    if (index !== -1) return index;
  }
  return 0;
}

function navigateTo(index: number): void {
  history.pushState({ levelIndex: index }, '', `${basePath}/${levelEntries[index].name}`);
  startGame(index);
}

window.addEventListener('popstate', (e) => {
  startGame(e.state?.levelIndex ?? getLevelFromUrl());
});

restartBtn.addEventListener('click', () => {
  hideWin(container);
  window.location.href = basePath + '/';
});

const initialIndex = getLevelFromUrl();
history.replaceState({ levelIndex: initialIndex }, '', `${basePath}/${levelEntries[initialIndex].name}`);
startGame(initialIndex);
