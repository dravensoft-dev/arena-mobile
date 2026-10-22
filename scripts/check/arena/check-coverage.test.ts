import { test, expect } from 'bun:test';
import { zeroTokenProblem } from './check-coverage.ts';
import { UNMAPPED, staleUnmappedProblems } from '../../lib/arena/bridge.ts';
import type { Token } from '../../lib/contracts/payload.ts';

const shadow = (name: string, members: Record<string, unknown>): Token => ({
  path: name.split('.'), name, file: 'contracts/design/effects.json', scope: 'base',
  type: 'shadow', value: members,
});

test('zero tokens is a failure, not a set where every token has a counterpart', () => {
  expect(zeroTokenProblem(0)).toContain('0 tokens');
  expect(zeroTokenProblem(1)).toBeNull();
});

test('UNMAPPED names a composite member that exists, and each entry carries its reason', () => {
  expect(UNMAPPED.size).toBeGreaterThan(0);
  for (const [key, why] of UNMAPPED) {
    expect(key).toContain('#');
    expect(why).toContain('spread');
  }
});

const nameOf = (key: string) => (key.includes('#') ? key.slice(0, key.indexOf('#')) : key);

test('an UNMAPPED entry outliving the member it excuses fails the gate that reads it', () => {
  const carried = [...UNMAPPED.keys()].map((key) => shadow(nameOf(key), { spread: { value: -2, unit: 'px' } }));
  expect(staleUnmappedProblems(carried)).toEqual([]);
  const without = [...UNMAPPED.keys()].map((key) => shadow(nameOf(key), {}));
  expect(staleUnmappedProblems(without)[0]).toContain('carries no spread member');
  expect(staleUnmappedProblems([])[0]).toContain('the payload carries no token');
});
