import { readdirSync } from 'node:fs';
import path, { join } from 'node:path';
import { relPosix } from './posix-path.ts';

export function walkFiles(dir: string, keep: (rel: string) => boolean, base = dir): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkFiles(full, keep, base));
      continue;
    }
    const rel = relPosix(base, full, path);
    if (keep(rel)) found.push(rel);
  }
  return found;
}
