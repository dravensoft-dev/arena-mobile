import { test, expect } from 'bun:test';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { TSC_BIN, TSC_SPAWN, tscBin, zeroProjectProblems } from './typecheck.ts';
import { repoRoot } from './repo-root.ts';
import { isDeadline } from './deadline.ts';

test('the wait is a deadline carrying why it is that size, and never a bare number', () => {
  expect(isDeadline(TSC_SPAWN)).toBe(true);
  expect(TSC_SPAWN.why).toContain('9713');
});

test('the compiler is spawned by resolved path and never by a bare name', () => {
  expect(TSC_BIN).toBe('node_modules/typescript/lib/tsc.js');
  expect(existsSync(join(repoRoot, TSC_BIN))).toBe(true);
  expect(tscBin(repoRoot)).toBe(join(repoRoot, TSC_BIN));
});

test('a tree with no typescript installed is a fact this returns rather than a spawn that fails', () => {
  expect(tscBin('/nowhere')).toBeNull();
});

test('a run over no project reports clean by construction, so it is a failure', () => {
  expect(zeroProjectProblems(1)).toEqual([]);
  expect(zeroProjectProblems(0)).toHaveLength(1);
  expect(zeroProjectProblems(0)[0]).toContain('reports clean by construction');
});
