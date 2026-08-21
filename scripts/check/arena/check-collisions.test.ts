import { test, expect } from 'bun:test';
import { zeroNamespaceProblem } from './check-collisions.ts';
import { identifierFor, identifierProblems, RESERVED, typeNameFor } from '../../lib/arena/identifier.ts';

test('a path is mangled to a bare identifier and never taken as one', () => {
  expect(identifierFor(['sp', '0'])).toBe('sp0');
  expect(identifierFor(['r', '2xl'])).toBe('r2xl');
  expect(identifierFor(['shadow', '1'])).toBe('shadow1');
  expect(identifierFor(['dz', 'text-2xs'])).toBe('dzText2xs');
  expect(identifierFor(['ls', 'uppercase-status'])).toBe('lsUppercaseStatus');
  expect(typeNameFor(['color', 'base-100'])).toBe('ColorBase100');
});

test('a collision is reported, because the emitted file compiles with one member overwriting the other', () => {
  const errs = identifierProblems([
    { name: 'a.b-c', identifier: 'aBC' },
    { name: 'a.b.c', identifier: 'aBC' },
  ]);
  expect(errs[0]).toContain('both mangle to aBC');
  expect(errs[0]).toContain('silently overwrites');
});

test('a leading digit and a keyword are refused in either language', () => {
  expect(identifierProblems([{ name: 'x', identifier: '2xl' }]).join(' ')).toContain('starts with a digit');
  expect(identifierProblems([{ name: 'x', identifier: 'object' }])[0]).toContain('keyword');
  expect(identifierProblems([{ name: 'x', identifier: 'struct' }])[0]).toContain('keyword');
  expect(RESERVED.has('val')).toBe(true);
  expect(RESERVED.has('let')).toBe(true);
});

test('an empty namespace set is a failure and not a set with no collisions', () => {
  expect(zeroNamespaceProblem(0)).toContain('0 identifiers');
  expect(zeroNamespaceProblem(1)).toBeNull();
});
