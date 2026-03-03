import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import type { Plugin } from 'vite';

/**
 * Vite plugin that loads Apple Numbers (.numbers) files as level data.
 *
 * Each sheet in the Numbers file becomes one level. Cell encoding:
 *   - Cell value   → piece code (H, M, A–Z, or empty)
 *   - Any non-default background color → water tile (prepends ~)
 *
 * So a blue-shaded cell with value "A" produces "~A";
 * a blue-shaded empty cell produces "~"; a plain cell with "A" produces "A".
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
        cells.push(bg !== null ? '~' + valStr : valStr);
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
