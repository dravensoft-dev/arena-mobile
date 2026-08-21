import { test, expect } from 'bun:test';
import { reachProblems, zeroCatalogueProblem, zeroDesignProblem } from './check-catalogue.ts';
import { NOT_A_VALUE, DESIGN_PREFIX, staleNotAValueProblems, staleScopeProblems, SCOPES } from '../../lib/contracts/payload.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.0', contracts });

test('an empty catalogue is a failure and not a payload that verifies against itself', () => {
  expect(zeroCatalogueProblem(manifest([]))).toContain('0 contracts');
  expect(zeroCatalogueProblem(manifest([`${DESIGN_PREFIX}spacing.json`]))).toBeNull();
});

test('a catalogue with no design file is a failure, because every value comes from there', () => {
  expect(zeroDesignProblem(manifest(['contracts/api/components/ArenaBadge.json']))).toContain(DESIGN_PREFIX);
});

test('a payload that lost a file and one that gained a file are both reported', () => {
  const declared = manifest([`${DESIGN_PREFIX}a.json`, `${DESIGN_PREFIX}b.json`]);
  expect(reachProblems(declared, [`${DESIGN_PREFIX}a.json`, `${DESIGN_PREFIX}b.json`])).toEqual([]);
  expect(reachProblems(declared, [`${DESIGN_PREFIX}a.json`])[0]).toContain('is in the catalogue and not in the payload');
  expect(reachProblems(declared, [`${DESIGN_PREFIX}a.json`, `${DESIGN_PREFIX}b.json`, `${DESIGN_PREFIX}c.json`])[0])
    .toContain('is in the payload and not in the catalogue');
});

test('NOT_A_VALUE and SCOPES each carry a reason and fail when what they name is gone', () => {
  for (const [, why] of NOT_A_VALUE) expect(why.length).toBeGreaterThan(40);
  expect(NOT_A_VALUE.has(`${DESIGN_PREFIX}roles.json`)).toBe(true);
  expect(staleNotAValueProblems(manifest([]))[0]).toContain('roles.json');
  expect(staleScopeProblems(manifest([...SCOPES.keys()]))).toEqual([]);
  expect(staleScopeProblems(manifest([]))).toHaveLength(SCOPES.size);
});
