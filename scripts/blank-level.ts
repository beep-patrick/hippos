/**
 * Generate a blank all-river level CSV template.
 *
 * Usage:
 *   npx tsx scripts/blank-level.ts              # default 6x10
 *   npx tsx scripts/blank-level.ts 6 10         # custom cols x visible rows
 *   npx tsx scripts/blank-level.ts 6 10 out.csv # write to file
 *
 * Generates an all-river grid with mama centered at top and hippo centered at bottom.
 * Pipe to a file and fill in pieces.
 */
import { writeFileSync } from 'fs';

const cols = Number(process.argv[2] ?? 6);
const visRows = Number(process.argv[3] ?? 10);
const outFile = process.argv[4];

// Mama at row 0, centered. Hippo at last row, centered.
const mamaCol = Math.floor(cols / 2);
const hippoCol = Math.floor(cols / 2);
const hippoRow = visRows - 1;

const rows: string[] = [];
for (let r = 0; r < visRows; r++) {
  const cells: string[] = [];
  for (let c = 0; c < cols; c++) {
    if (r === 0 && c === mamaCol) {
      cells.push('~M');
    } else if (r === 1 && c === mamaCol) {
      cells.push('~M');
    } else if (r === hippoRow && c === hippoCol) {
      cells.push('~H');
    } else {
      cells.push('~');
    }
  }
  rows.push(cells.join(','));
}

const csv = rows.join('\n');

if (outFile) {
  writeFileSync(outFile, csv + '\n');
  console.log(`Wrote ${cols}x${visRows} blank level to ${outFile}`);
} else {
  console.log(csv);
}

// Show grid summary
const bt = 1, bb = 1;
const totalRows = visRows + 2;
const cellPx = Math.min(820 / cols, 1114 / visRows);
const binding = (1114 / visRows) < (820 / cols) ? 'height' : 'width';
console.log(`\n# ${cols} cols x ${visRows} visible rows (${totalRows} total with bleed)`);
console.log(`# Cell size: ${cellPx.toFixed(1)}px (${binding}-binding)`);
console.log(`# Bleed hidden: ${binding === 'height' ? 'yes' : 'NO — consider adjusting'}`);
console.log(`# Mama at row 0-1 col ${mamaCol}, Hippo at row ${hippoRow} col ${hippoCol}`);
console.log(`# All river — fill in pieces using A-Z (logs) and a-z (obstacle hippos)`);
