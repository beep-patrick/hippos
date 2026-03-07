import { parseCsvLevel } from './parseCsvLevel';
import { initState } from './gameState';
import { buildGrid, renderPieces, updateMoveCount, showWin, hideWin, startHeartAnimation, stopHeartAnimation } from './renderer';
import { attachInputHandlers } from './input';
import hippoSoundUrl from './sounds/hippo.mp3?url';

import rawLevels from './levels/levels.generated.json';

const levels = (rawLevels as Array<{ name: string; csv: string }>).map(({ name, csv }) =>
  parseCsvLevel(name.toLowerCase().replace(/\s+/g, '-'), name, csv)
);

if (levels.length === 0) throw new Error('No levels found in levels.generated.json');

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
  const match = window.location.pathname.match(/\/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= levels.length) return num - 1;
  }
  return 0;
}

function navigateTo(index: number): void {
  history.pushState({ levelIndex: index }, '', `${basePath}/${index + 1}`);
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
history.replaceState({ levelIndex: initialIndex }, '', `${basePath}/${initialIndex + 1}`);
startGame(initialIndex);
