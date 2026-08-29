import { test, expect } from 'bun:test';
import { PACKAGE_MANIFEST, runScriptNames, scriptNames, undeclaredScriptProblems, zeroScriptProblem } from './package-scripts.ts';
import { repoRoot } from './repo-root.ts';

test('the manifest this tree carries declares the runner and every gate it registers', () => {
  const declared = scriptNames(repoRoot);
  expect(declared.has('check')).toBe(true);
  expect(declared.has('build:release')).toBe(true);
  expect(declared.has('test')).toBe(true);
  expect(declared.has('check:nothing')).toBe(false);
});

test('a name is read wherever bun run types it, and an argument after it is not the name', () => {
  expect(runScriptNames('- run: bun run check --domain=arena')).toEqual(['check']);
  expect(runScriptNames('bun run build:release\nbun run test')).toEqual(['build:release', 'test']);
  expect(runScriptNames('bun install --frozen-lockfile')).toEqual([]);
  expect(runScriptNames('bun scripts/ci/arena/run-suite.ts all')).toEqual([]);
});

test('a name the manifest does not declare is reported with where it was typed', () => {
  const declared = new Set(['check']);
  expect(undeclaredScriptProblems('pr.yml', ['check'], declared)).toEqual([]);
  const errs = undeclaredScriptProblems('pr.yml', ['check', 'chekc'], declared);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('pr.yml');
  expect(errs[0]).toContain('chekc');
  expect(errs[0]).toContain(PACKAGE_MANIFEST);
});

test('a manifest declaring nothing is a failure and never a run where every name is undeclared', () => {
  expect(zeroScriptProblem(new Set(['check']))).toBeNull();
  expect(zeroScriptProblem(new Set())).toContain(PACKAGE_MANIFEST);
});
