/**
 * Shared helper: load all level CSV files from src/levels/.
 * Used by CLI scripts (solve, test, visualize).
 */
import { readdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const levelsDir = resolve(__dirname, '../src/levels');

export interface LevelEntry {
  name: string;
  csv: string;
}

export function loadAllLevels(): LevelEntry[] {
  return readdirSync(levelsDir)
    .filter(f => f.endsWith('.csv'))
    .map(f => ({
      name: f.replace('.csv', ''),
      csv: readFileSync(resolve(levelsDir, f), 'utf-8'),
    }))
    .sort((a, b) => {
      const na = parseInt(a.name, 10), nb = parseInt(b.name, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return a.name.localeCompare(b.name);
    });
}

export function findLevel(nameOrPath: string): LevelEntry | null {
  // Check if it's a file path
  if (nameOrPath.endsWith('.csv')) {
    try {
      const csv = readFileSync(nameOrPath, 'utf-8');
      return { name: 'custom', csv };
    } catch {
      return null;
    }
  }
  // Look up by name
  const levels = loadAllLevels();
  return levels.find(l => l.name === nameOrPath) ?? null;
}

export { levelsDir };
