/**
 * Verify solver solutions by replaying transcripts step-by-step on the game engine.
 */
import { parseCsvLevel } from '../src/parseCsvLevel.js';
import { initState, moveLog, moveHippo, moveHippoObstacle, checkWin } from '../src/gameState.js';
import { solveLevel } from '../src/solver.js';
import { loadAllLevels } from './load-levels.js';

const levels = loadAllLevels();
let allOk = true;

for (const entry of levels) {
  const level = parseCsvLevel(entry.name, `Level ${entry.name}`, entry.csv);
  const result = solveLevel(level);

  if (!result.solvable) {
    console.log(`Level ${entry.name}: FAIL - solver says not solvable`);
    allOk = false;
    continue;
  }

  const state = initState(level);
  let ok = true;
  let stepIdx = 0;

  for (const move of result.path!) {
    stepIdx++;
    if (move.type === 'hippo') {
      if (!moveHippo(state, move.dr, move.dc)) {
        console.log(`Level ${entry.name}: FAIL at step ${stepIdx} - hippo move rejected`);
        ok = false;
        break;
      }
    } else if (move.type === 'log') {
      if (!moveLog(state, move.id, move.newRow, move.newCol)) {
        console.log(`Level ${entry.name}: FAIL at step ${stepIdx} - log ${move.id} rejected`);
        ok = false;
        break;
      }
    } else {
      if (!moveHippoObstacle(state, move.id, move.newRow, move.newCol)) {
        console.log(`Level ${entry.name}: FAIL at step ${stepIdx} - obstacle ${move.id} rejected`);
        ok = false;
        break;
      }
    }
  }

  if (ok) {
    const won = checkWin(state);
    if (won) {
      console.log(`Level ${entry.name}: OK (${result.moves} slides, ${result.path!.length} total steps)`);
    } else {
      console.log(`Level ${entry.name}: FAIL - win condition not met`);
      ok = false;
    }
  }

  if (!ok) allOk = false;
}

console.log(allOk ? '\nAll levels verified!' : '\nSome levels FAILED verification');
process.exit(allOk ? 0 : 1);
