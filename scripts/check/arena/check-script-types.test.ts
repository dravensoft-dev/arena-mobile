import { test, expect } from 'bun:test';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { CHECKED_EXTENSIONS, PROJECTS, node, sourcesUnder, unreachedProblems } from './check-script-types.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { zeroProjectProblems } from '../../lib/arena/typecheck.ts';

test('the project it names is in the tree, and it carries the reason it is there', () => {
  expect(PROJECTS).toHaveLength(1);
  const [only] = PROJECTS;
  expect(only?.project).toBe('scripts/tsconfig.check.json');
  expect(existsSync(join(repoRoot, only?.project ?? ''))).toBe(true);
  expect(only?.reaches).toContain('scripts/');
});

test('a run over no project reports clean by construction, so it is a failure', () => {
  expect(zeroProjectProblems(PROJECTS.length)).toEqual([]);
  expect(zeroProjectProblems(0)).toHaveLength(1);
});

test('a file on disk the project does not reach is named, and one it reaches is not', () => {
  const onDisk = ['scripts/a.ts', 'scripts/b.ts'];
  expect(unreachedProblems(onDisk, ['scripts/a.ts', 'scripts/b.ts'])).toEqual([]);
  const missed = unreachedProblems(onDisk, ['scripts/a.ts']);
  expect(missed).toHaveLength(1);
  expect(missed[0]).toContain('scripts/b.ts');
  expect(missed[0]).toContain('globs do not reach it');
});

test('the walk finds what the compiler is asked to read, and nothing outside it', () => {
  const found = sourcesUnder(join(repoRoot, 'scripts'));
  expect(found.length).toBeGreaterThan(0);
  expect(found.every((rel) => CHECKED_EXTENSIONS.some((ext) => rel.endsWith(ext)))).toBe(true);
});

test('the gate judges and does not emit, which is what check:graph fails a gate for', () => {
  expect(node.name).toBe('check:script-types');
  expect(node.writes).toEqual([]);
  expect(node.reads).toContain('scripts/tsconfig.check.json');
});
