import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import type { Plugin } from 'vite';

/**
 * Vite plugin that loads Apple Numbers (.numbers) files as level data.
 *
 * Each sheet in the Numbers file becomes one level. Cell encoding:
 *   - Cell value        → piece code (H, M, A–Z, or empty)
 *   - White background or no fill → bank/shoreline (no prefix)
 *   - Colored background (e.g. blue) → water tile (prepends ~)
 *
 * Examples: blue cell + "A" → "~A"; blue empty → "~"; white/plain cell → no prefix.
 *
 * Requires macOS with Numbers.app installed.
 */

const JXA_SCRIPT_TEMPLATE = `
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
        // bg is [r, g, b] with components 0–1.
        //   null or white (all > 0.95) → bank/shoreline: output valStr as-is
        //   any other color (e.g. blue) → water: prepend '~'
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

export function numbersPlugin(): Plugin {
  return {
    name: 'numbers-level',
    load(id) {
      if (!id.endsWith('.numbers')) return;
      const script = JXA_SCRIPT_TEMPLATE.replace('__FILE_PATH__', JSON.stringify(id));
      const tmpPath = '/tmp/hippos_numbers_extract.jxa';
      writeFileSync(tmpPath, script);
      const json = execSync(`osascript -l JavaScript ${tmpPath}`).toString().trim();
      return `export default ${json}`;
    },
  };
}
