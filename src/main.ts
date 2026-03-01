import { level1 } from './levels/level1';
import { initState } from './gameState';
import { buildGrid, renderPieces, updateMoveCount, showWin, hideWin } from './renderer';
import { attachInputHandlers } from './input';

const container = document.getElementById('game-container')!;

// Build the static grid once.
buildGrid(container, level1.rows, level1.cols, level1.riverCells);

let cleanupInput: (() => void) | null = null;

function startGame(): void {
  // Tear down previous input handlers.
  cleanupInput?.();

  const state = initState(level1);

  const labelEl = document.getElementById('level-label');
  if (labelEl) labelEl.textContent = level1.label;

  hideWin(container);
  renderPieces(container, state);
  updateMoveCount(0);

  cleanupInput = attachInputHandlers(container, state, () => {
    showWin(container);
  });
}

document.getElementById('restart-btn')?.addEventListener('click', startGame);

startGame();
