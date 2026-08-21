import { test, expect } from 'bun:test';
import { RULES, ruleProblems, unownedRuleProblems, zeroScanProblem } from './check-portability.ts';
import { candidatesFor, findHostBinary } from '../../lib/arena/host-binary.ts';
import { hostOf, isMac } from '../../lib/arena/platform.ts';
import { isInside, relPosix, toPosix } from '../../utils/posix-path.ts';
import path from 'node:path';

test('every ban names where it may live, or that it may live nowhere', () => {
  for (const rule of RULES) expect(rule.why.length).toBeGreaterThan(40);
  expect(unownedRuleProblems(RULES.filter((r) => r.owner).map((r) => ({ file: r.owner as string, source: '' })))).toEqual([]);
  expect(unownedRuleProblems([])).toHaveLength(RULES.filter((r) => r.owner !== null).length);
});

test('a construct in its owner is allowed and the same construct elsewhere is not', () => {
  const rule = RULES.find((one) => one.owner === 'scripts/lib/arena/platform.ts');
  expect(rule).toBeDefined();
  expect(ruleProblems([{ file: rule!.owner as string, source: 'process.platform' }], [rule!])).toEqual([]);
  expect(ruleProblems([{ file: 'scripts/x.ts', source: 'process.platform' }], [rule!])[0]).toContain('It belongs to');
});

test('localeCompare belongs nowhere, because two machines then emit two different files', () => {
  const rule = RULES.find((one) => one.pattern.source.includes('localeCompare'));
  expect(rule?.owner).toBeNull();
  expect(ruleProblems([{ file: 'scripts/x.ts', source: 'a.localeCompare(b)' }], [rule!])[0]).toContain('It belongs nowhere');
});

test('the host is answered as a parameter, which is what makes a macOS branch testable from Linux', () => {
  expect(hostOf('darwin')).toBe('darwin');
  expect(hostOf('sunos')).toBe('other');
  expect(isMac('darwin')).toBe(true);
  expect(isMac('linux')).toBe(false);
});

test('a binary is resolved before it is spawned, and Windows carries a suffix', () => {
  expect(candidatesFor('git', 'win32', '/a')).toContain('/a/git.exe');
  expect(candidatesFor('git', 'linux', '/a')).toEqual(['/a/git']);
  expect(findHostBinary('this-binary-does-not-exist')).toBeNull();
});

test('a path comparison uses a separator boundary rather than a string prefix', () => {
  expect(toPosix('a\\b')).toBe('a/b');
  expect(relPosix('/repo', '/repo/a/b', path)).toBe('a/b');
  expect(isInside('/repo', '/repo/a', path)).toBe(true);
  expect(isInside('/repo', '/repo-evil/a', path)).toBe(false);
  expect(isInside('/repo', '/repo', path)).toBe(false);
});

test('scanning nothing is a failure and not a tree that holds to every ban', () => {
  expect(zeroScanProblem(0)).toContain('0 scripts');
  expect(zeroScanProblem(1)).toBeNull();
});
