#!/usr/bin/env node
/**
 * Extracts level data from src/levels/*.numbers files using osascript (macOS + Numbers.app required).
 * Writes the result to src/levels/levels.generated.json.
 *
 * Run this locally whenever you update the .numbers file, then commit the generated JSON.
 *   npm run export-levels
 */

import { execSync } from 'child_process';
import { writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const levelsDir = resolve(__dirname, '../src/levels');
const outPath = resolve(levelsDir, 'levels.generated.json');

const JXA_TEMPLATE = `
function run() {
  var filePath = __FILE_PATH__;
  var app = Application('Numbers');
  var doc = app.open(Path(filePath));
  var result = [];
  var numSheets = doc.sheets.length;
  for (var s = 0; s < numSheets; s++) {
    var sheet = doc.sheets[s];
    var table = sheet.tables[0];
    var numRows = table.rowCount();
    var numCols = table.columnCount();
    var rows = [];
    for (var r = 0; r < numRows; r++) {
      var cells = [];
      for (var c = 0; c < numCols; c++) {
        var cell = table.rows[r].cells[c];
        var val = cell.value();
        var bg = cell.backgroundColor();
        var valStr = (val === null || val === undefined) ? '' : String(val);
        var isWhite = bg !== null && bg[0] > 0.95 && bg[1] > 0.95 && bg[2] > 0.95;
        var isWater = bg !== null && !isWhite;
        cells.push(isWater ? '~' + valStr : valStr);
      }
      rows.push(cells.join(','));
    }
    result.push({ name: sheet.name(), csv: rows.join('\\n') });
  }
  return JSON.stringify(result);
}
`;

const numbersFiles = readdirSync(levelsDir)
  .filter(f => f.endsWith('.numbers'))
  .sort()
  .map(f => resolve(levelsDir, f));

if (numbersFiles.length === 0) {
  console.error('No .numbers files found in src/levels/');
  process.exit(1);
}

const allSheets = [];
for (const filePath of numbersFiles) {
  console.log(`Processing: ${filePath}`);
  const script = JXA_TEMPLATE.replace('__FILE_PATH__', JSON.stringify(filePath));
  const tmpPath = '/tmp/hippos_export_levels.jxa';
  writeFileSync(tmpPath, script);
  const json = execSync(`osascript -l JavaScript ${tmpPath}`).toString().trim();
  const sheets = JSON.parse(json);
  allSheets.push(...sheets);
}

writeFileSync(outPath, JSON.stringify(allSheets, null, 2));
console.log(`Written ${allSheets.length} levels to ${outPath}`);
