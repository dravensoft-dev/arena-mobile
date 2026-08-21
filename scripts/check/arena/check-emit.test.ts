import { test, expect } from 'bun:test';
import { emitProblems } from './check-emit.ts';
import { TARGETS } from '../../generate/arena/generate-tokens.ts';

test('the emit reaches both layers, and every target carries the infix', () => {
  expect(TARGETS.filter((one) => one.startsWith('compose/'))).not.toHaveLength(0);
  expect(TARGETS.filter((one) => one.startsWith('swiftui/'))).not.toHaveLength(0);
  for (const target of TARGETS) expect(target).toContain('.generated.');
});

test('a file that is not in the tree is reported as absent rather than as different', () => {
  const errs = emitProblems(new Map([['a.kt', 'x\n']]), () => null);
  expect(errs[0]).toContain('is not in the tree');
  expect(errs[0]).toContain('generate:tokens');
});

test('a file that differs names the first line that does, so the diff is readable without one', () => {
  const errs = emitProblems(new Map([['a.kt', 'one\ntwo\n']]), () => 'one\nTWO\n');
  expect(errs[0]).toContain('line that differs is 2');
  expect(errs[0]).toContain('"TWO"');
});

test('a file that matches byte for byte is not reported', () => {
  expect(emitProblems(new Map([['a.kt', 'one\n']]), () => 'one\n')).toEqual([]);
});
