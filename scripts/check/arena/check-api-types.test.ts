import { test, expect } from 'bun:test';
import { counted, coverageProblems, sourceProblems, zeroTypeProblem } from './check-api-types.ts';
import { COMPONENTS_PREFIX, TYPES_PREFIX, type ApiType } from '../../lib/contracts/api-types.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.2', contracts });

test('an empty vocabulary is a failure and not a set with nothing missing from it', () => {
  expect(zeroTypeProblem(0)).toContain('never read');
  expect(zeroTypeProblem(1)).toBeNull();
});

test('every API contract is read or excluded with a reason, and a third answer is reported', () => {
  expect(sourceProblems(manifest([`${TYPES_PREFIX}arena-tone.json`, `${COMPONENTS_PREFIX}ArenaButton.json`]))).toEqual([]);
  expect(sourceProblems(manifest(['contracts/api/behaviour/ArenaX.json']))[0])
    .toContain('neither reads nor excludes with a reason');
  expect(sourceProblems(manifest(['contracts/design/spacing.json']))).toEqual([]);
});

test('coverage collects every refusal rather than throwing on the first, so one sweep reports them all', () => {
  const types: ApiType[] = [
    { name: 'ArenaGhost', kind: 'enum', values: ['2xl', 9] },
    { name: 'ArenaBag', kind: 'object', fields: { one: { form: 'consumerData' }, two: { form: 'array', of: 'ArenaGhost' } } },
  ];
  const errs = coverageProblems(types);
  expect(errs).toHaveLength(5);
  expect(errs.join(' ')).toContain('Name it in CASE_NAMES');
  expect(errs.join(' ')).toContain('reaches no native shape');
  expect(errs.join(' ')).toContain('a raw type is one type in both languages');
});

test('a vocabulary that resolves reports nothing, which is the only case a pass may be reported for', () => {
  expect(coverageProblems([
    { name: 'ArenaTone', kind: 'enum', values: ['neutral', 'accent'] },
    { name: 'ArenaCrumb', kind: 'object', fields: { label: { form: 'primitive', type: 'string', required: true } } },
  ])).toEqual([]);
});

test('the pass line names what was looked at, per node kind', () => {
  expect(counted([
    { name: 'ArenaTone', kind: 'enum', values: ['a', 'b', 'c'] },
    { name: 'ArenaCrumb', kind: 'object', fields: { label: { form: 'primitive', type: 'string' }, href: { form: 'primitive', type: 'string' } } },
  ])).toEqual({ types: 2, values: 3, fields: 2 });
});
