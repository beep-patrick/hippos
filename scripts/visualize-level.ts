/**
 * ASCII-render a level from levels.generated.json or a raw CSV file.
 *
 * Usage:
 *   npx tsx scripts/visualize-level.ts 3              # level by name
 *   npx tsx scripts/visualize-level.ts path/to/file.csv  # raw CSV file
 *   npx tsx scripts/visualize-level.ts all             # all levels
 */
import { parseCsvLevel } from '../src/parseCsvLevel.js';
import type { Level } from '../src/types.js';
import { readFileSync, existsSync } from 'fs';
import levelsJson from '../src/levels/levels.generated.json' assert { type: 'json' };

// ---------------------------------------------------------------------------
// ASCII renderer
// ---------------------------------------------------------------------------

export function renderAscii(level: Level): string {
  const { rows, cols, logs, hippoObstacles, hippoStart, mamaPos, boulders, bleedTop = 0, bleedBottom = 0 } = level;
  const mw = level.mamaWidth ?? 1, mh = level.mamaHeight ?? 1;

  // Build grid: each cell gets a 2-char label
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      if (r < bleedTop || r >= rows - bleedBottom) {
        row.push('##');  // bleed row
      } else if (level.riverCells && !level.riverCells.has(`${r},${c}`)) {
        row.push('  ');  // bank (empty)
      } else {
        row.push('~~');  // river
      }
    }
    grid.push(row);
  }

  // Boulders
  for (const b of boulders ?? []) {
    grid[b.row][b.col] = '**';
  }

  // Mama
  for (let ri = 0; ri < mh; ri++)
    for (let ci = 0; ci < mw; ci++)
      grid[mamaPos.row + ri][mamaPos.col + ci] = 'MM';

  // Logs
  for (const log of logs) {
    const label = log.id.replace('log-', '');
    for (let i = 0; i < log.length; i++) {
      const r = log.orientation === 'vertical' ? log.row + i : log.row;
      const c = log.orientation === 'horizontal' ? log.col + i : log.col;
      const isRiver = !level.riverCells || level.riverCells.has(`${r},${c}`);
      grid[r][c] = isRiver ? `~${label}` : ` ${label}`;
    }
  }

  // Hippo obstacles
  for (const obs of hippoObstacles) {
    const label = obs.id.replace('obstacle-', '');
    for (let i = 0; i < 2; i++) {
      const r = obs.orientation === 'vertical' ? obs.row + i : obs.row;
      const c = obs.orientation === 'horizontal' ? obs.col + i : obs.col;
      grid[r][c] = `~${label}`;
    }
  }

  // Baby hippo
  grid[hippoStart.row][hippoStart.col] = 'HH';

  // Render with row numbers
  const lines: string[] = [];
  const colHeader = '    ' + Array.from({ length: cols }, (_, i) => String(i).padStart(2)).join(' ');
  lines.push(colHeader);
  lines.push('    ' + '--'.repeat(cols) + '-');

  for (let r = 0; r < rows; r++) {
    const rowLabel = String(r).padStart(2);
    const isBleed = r < bleedTop || r >= rows - bleedBottom;
    const prefix = isBleed ? '  ' : '  ';
    lines.push(`${rowLabel} |${grid[r].join(' ')}|`);
  }

  lines.push('    ' + '--'.repeat(cols) + '-');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Level info summary
// ---------------------------------------------------------------------------

export function levelInfo(level: Level): string {
  const bt = level.bleedTop ?? 0, bb = level.bleedBottom ?? 0;
  const visRows = level.rows - bt - bb;
  const totalRiver = level.riverCells?.size ?? level.rows * level.cols;
  const hLogs = level.logs.filter(l => l.orientation === 'horizontal').length;
  const vLogs = level.logs.filter(l => l.orientation === 'vertical').length;
  const hObs = level.hippoObstacles.filter(o => o.orientation === 'horizontal').length;
  const vObs = level.hippoObstacles.filter(o => o.orientation === 'vertical').length;

  const parts = [
    `${visRows} rows x ${level.cols} cols (${level.rows} total with bleed)`,
    `${level.logs.length} logs (${hLogs}H ${vLogs}V)`,
    `${level.hippoObstacles.length} obstacle hippos (${hObs}H ${vObs}V)`,
    `${level.boulders?.length ?? 0} boulders`,
    `${totalRiver} river cells`,
    `Hippo start: (${level.hippoStart.row},${level.hippoStart.col})`,
    `Mama: (${level.mamaPos.row},${level.mamaPos.col}) ${level.mamaWidth ?? 1}x${level.mamaHeight ?? 1}`,
  ];
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function showLevel(name: string, level: Level) {
  console.log(`\n=== Level ${name} ===`);
  console.log(levelInfo(level));
  console.log();
  console.log(renderAscii(level));
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npx tsx scripts/visualize-level.ts <level-name|path.csv|all>');
  process.exit(1);
}

const levels = levelsJson as Array<{ name: string; csv: string }>;

if (arg === 'all') {
  for (const entry of levels) {
    const level = parseCsvLevel(entry.name, entry.name, entry.csv);
    showLevel(entry.name, level);
  }
} else if (existsSync(arg)) {
  // Raw CSV file
  const csv = readFileSync(arg, 'utf-8');
  const level = parseCsvLevel('custom', 'Custom', csv);
  showLevel('Custom', level);
} else {
  // Level name from generated JSON
  const entry = levels.find(l => l.name === arg);
  if (!entry) { console.error(`Level "${arg}" not found. Available: ${levels.map(l => l.name).join(', ')}`); process.exit(1); }
  const level = parseCsvLevel(entry.name, entry.name, entry.csv);
  showLevel(entry.name, level);
}
