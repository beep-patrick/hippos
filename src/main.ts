import { parseCsvLevel } from './parseCsvLevel';
import { initState } from './gameState';
import { buildGrid, renderPieces, updateMoveCount, showWin, hideWin, startHeartAnimation, stopHeartAnimation } from './renderer';
import { attachInputHandlers } from './input';
import hippoSoundUrl from './sounds/hippo.mp3?url';

// Load all CSV level files from src/levels/. Vite resolves these at build time.
const csvModules = import.meta.glob('./levels/*.csv', { eager: true, query: '?raw', import: 'default' });

// Split levels into main (numeric names) and bonus (bonus-N names)
const allEntries = Object.entries(csvModules)
  .map(([path, csv]) => {
    const filename = path.split('/').pop()!.replace('.csv', '');
    return { name: filename, csv: csv as string };
  });

const mainEntries = allEntries
  .filter(e => /^\d+$/.test(e.name))
  .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

const bonusEntries = allEntries
  .filter(e => e.name.startsWith('bonus-'))
  .sort((a, b) => {
    const na = parseInt(a.name.replace('bonus-', ''), 10);
    const nb = parseInt(b.name.replace('bonus-', ''), 10);
    return na - nb;
  });

const levelEntries = [...mainEntries, ...bonusEntries];

const levels = levelEntries.map(({ name, csv }) =>
  parseCsvLevel(name.toLowerCase().replace(/\s+/g, '-'), name, csv)
);

const mainLevelCount = mainEntries.length;

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
  if (labelEl) {
    const bonusMatch = level.label.match(/^bonus-(\d+)$/);
    if (bonusMatch) labelEl.textContent = `Bonus ${bonusMatch[1]}`;
    else if (/^\d+$/.test(level.label)) labelEl.textContent = `Level ${level.label}`;
    else labelEl.textContent = level.label;
  }

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
      const justFinishedMain = currentLevelIndex + 1 === mainLevelCount;
      if (justFinishedMain) {
        showWin(container, 'Congratulations! You finished the game!');
      } else if (hasNext) {
        navigateTo(currentLevelIndex + 1);
      } else {
        showWin(container, 'You finished all the bonus levels too!');
      }
    });
  });
}

// Base path of the app, e.g. '/hippos' on GitHub Pages and in local dev.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function getLevelFromUrl(): number {
  // Match /bonus-N or /N or /name
  const match = window.location.pathname.match(/\/([^/]+)$/);
  if (match) {
    const slug = match[1];
    // Try bonus path: /bonus/N → bonus-N
    const bonusMatch = slug === 'bonus' ? null : window.location.pathname.match(/\/bonus\/(\d+)$/);
    const name = bonusMatch ? `bonus-${bonusMatch[1]}` : slug;
    const index = levelEntries.findIndex(e => e.name === name);
    if (index !== -1) return index;
  }
  return 0;
}

function levelUrl(index: number): string {
  const name = levelEntries[index].name;
  // bonus-N → /bonus/N
  const bonusMatch = name.match(/^bonus-(\d+)$/);
  return bonusMatch ? `${basePath}/bonus/${bonusMatch[1]}` : `${basePath}/${name}`;
}

function navigateTo(index: number): void {
  history.pushState({ levelIndex: index }, '', levelUrl(index));
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
history.replaceState({ levelIndex: initialIndex }, '', levelUrl(initialIndex));
startGame(initialIndex);
