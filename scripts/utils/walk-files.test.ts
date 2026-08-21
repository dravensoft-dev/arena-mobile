import { test, expect } from 'bun:test';
import { join } from 'node:path';
import { walkFiles } from './walk-files.ts';
import { isMainModule } from './main-module.ts';
import { readJson } from './read-json.ts';
import { repoRoot } from '../lib/arena/repo-root.ts';

test('a walk answers in posix, repository-relative, and reaches any depth', () => {
  const found = walkFiles(join(repoRoot, 'scripts', 'utils'), (rel) => rel.endsWith('.ts'));
  expect(found).toContain('walk-files.ts');
  expect(found.every((rel) => !rel.includes('\\'))).toBe(true);
});

test('a directory that is not there answers empty, which is why every caller pairs it with a zero-result failure', () => {
  expect(walkFiles(join(repoRoot, 'nowhere-at-all'), () => true)).toEqual([]);
});

test('importing a script is not running it', () => {
  expect(isMainModule('file:///a/b.ts', '/a/b.ts')).toBe(true);
  expect(isMainModule('file:///a/b.ts', '/a/c.ts')).toBe(false);
  expect(isMainModule('file:///a/b.ts', undefined)).toBe(false);
});

test('a JSON read answers the parsed document', () => {
  expect(readJson<{ version: string }>(join(repoRoot, 'repo.config.json')).version).toMatch(/^\d+\.\d+\.\d+$/);
});
