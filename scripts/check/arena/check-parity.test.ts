import { test, expect } from 'bun:test';
import {
  AXES, CASE_BLOCKS, CONSIDERED, UNDECIDABLE, UNENUMERATED, UNITS, UNREACHED, caseLinesIn, claimProblems,
  enumAxesOf, enumerationProblems, keyOf, matrixOf, matrixProblems, node, partitionProblems,
  staleUndecidableProblems, staleUnenumeratedProblems, tupleOf, unitProblems, zeroAxisProblem,
  zeroCaseProblem, zeroComponentProblem, zeroMatrixProblem, type EnumAxis,
} from './check-parity.ts';

const variant = {
  member: 'variant',
  type: 'ArenaButtonVariant',
  cases: [
    { value: 'primary', stem: 'primary', kotlin: 'Primary', swift: 'primary', literal: '"primary"' },
    { value: 'ghost', stem: 'ghost', kotlin: 'Ghost', swift: 'ghost', literal: '"ghost"' },
  ],
} satisfies EnumAxis;

const size = {
  member: 'size',
  type: 'ArenaControlSize',
  cases: [{ value: 'sm', stem: 'sm', kotlin: 'Sm', swift: 'sm', literal: '"sm"' }],
} satisfies EnumAxis;

const axes = [variant, size];
const matrix = matrixOf(axes);

test('the matrix is the cross product of the contract own enum members and nothing else', () => {
  expect(matrix.map(keyOf)).toEqual(['primary.sm', 'ghost.sm']);
  const fields = new Map([
    ['variant', { form: 'enum', type: 'ArenaButtonVariant' }],
    ['size', { form: 'enum', type: 'ArenaControlSize' }],
    ['full', { form: 'primitive', type: 'boolean' }],
  ]);
  const types = [
    { name: 'ArenaButtonVariant', kind: 'enum', values: ['primary', 'ghost'] },
    { name: 'ArenaControlSize', kind: 'enum', values: ['sm'] },
  ];
  expect(enumAxesOf('ArenaButton', fields, types).map((one) => one.member)).toEqual(['variant', 'size']);
  expect(enumAxesOf('ArenaButton', fields, types)[1]?.cases.map((one) => one.value)).toEqual(['sm']);
});

test('a case list is read out of each suite in its own idiom', () => {
  const kotlin = ['private val CASES = listOf(', '    ArenaButtonVariant.Primary to ArenaControlSize.Sm,', ')'].join('\n');
  const swift = ['private let cases: [(ArenaButtonVariant, ArenaControlSize)] = [', '    (.primary, .sm),', ']'].join('\n');
  expect(caseLinesIn(kotlin, CASE_BLOCKS.compose)).toEqual(['ArenaButtonVariant.Primary to ArenaControlSize.Sm,']);
  expect(caseLinesIn(swift, CASE_BLOCKS.swiftui)).toEqual(['(.primary, .sm),']);
  expect(caseLinesIn('nothing here', CASE_BLOCKS.compose)).toBe(null);
});

test('a case spelled in either language resolves to the contract own value', () => {
  expect(tupleOf('ArenaButtonVariant.Ghost to ArenaControlSize.Sm,', axes, 'compose')).toBe('ghost.sm');
  expect(tupleOf('(.ghost, .sm),', axes, 'swiftui')).toBe('ghost.sm');
  expect(tupleOf('(.ghost),', axes, 'swiftui')).toBe(null);
  expect(tupleOf('(.ghost, .xl),', axes, 'swiftui')).toBe(null);
});

test('both directions of the matrix are asked of every suite', () => {
  expect(matrixProblems('compose', 'ArenaButton', ['ArenaButtonVariant.Primary to ArenaControlSize.Sm',
    'ArenaButtonVariant.Ghost to ArenaControlSize.Sm'], axes, matrix)).toEqual([]);
  expect(matrixProblems('compose', 'ArenaButton', ['ArenaButtonVariant.Primary to ArenaControlSize.Sm'],
    axes, matrix)[0]).toContain('enumerates no ghost.sm');
  expect(matrixProblems('swiftui', 'ArenaButton', ['(.primary, .sm)', '(.ghost, .sm)', '(.ghost, .sm, .lg)'],
    axes, matrix)[0]).toContain('cannot resolve');
});

test('a claim and the authority it measures against are both read out of the suite', () => {
  const source = [...AXES.values()].map((one) => `${one.claim} ${one.authority}`).join('\n');
  expect(claimProblems('compose', 'ArenaButton', source)).toEqual([]);
  expect(claimProblems('compose', 'ArenaButton', source.replace('cornerRadius', 'roundness'))
    .some((one) => one.includes('cornerRadius'))).toBe(true);
  expect(claimProblems('compose', 'ArenaButton', '')).toHaveLength(AXES.size * 2);
});

test('the unit a suite counts in is declared in the suite and read here', () => {
  expect(unitProblems('compose', 'ArenaButton', 'with(compose.density) { }')).toEqual([]);
  expect(unitProblems('swiftui', 'ArenaButton', 'renderer.scale = 1')).toEqual([]);
  expect(unitProblems('swiftui', 'ArenaButton', 'renderer.scale = 2')[0]).toContain('declares no unit');
});

test('AXES and UNREACHED partition the declared set of axes, disjointly', () => {
  expect(partitionProblems()).toEqual([]);
  expect(partitionProblems(AXES, new Map([...UNREACHED, ['corner radius', 'excused twice']])))
    .toHaveLength(1);
  expect(partitionProblems(AXES, UNREACHED, [...CONSIDERED, 'shadow'])[0]).toContain('shadow');
  expect(AXES.size + UNREACHED.size).toBe(CONSIDERED.length);
});

test('UNDECIDABLE is live, over the derived matrix and the axes that are measured', () => {
  const crossed = ['ghost.sm', 'ghost.md', 'ghost.lg', 'primary.sm', 'primary.md', 'primary.lg'];
  expect(staleUndecidableProblems(crossed)).toEqual([]);
  expect(staleUndecidableProblems(crossed.filter((one) => one !== 'ghost.md'))[0]).toContain('crosses no ghost.md');
  expect(staleUndecidableProblems(crossed, AXES, new Map([['ghost.sm:labelInk', 'a reason']]))[0])
    .toContain('measures no labelInk');
});

test('every component either tree draws is enumerated on both layers or excepted', () => {
  const enumerated = new Map([['compose', new Set(['ArenaButton'])], ['swiftui', new Set(['ArenaButton'])]]);
  expect(enumerationProblems(['ArenaButton'], enumerated)).toEqual([]);
  expect(enumerationProblems(['ArenaButton', 'ArenaSwitch'], enumerated)[0]).toContain('ArenaSwitch');
  expect(staleUnenumeratedProblems(['ArenaButton'])).toEqual([]);
  expect(staleUnenumeratedProblems([], new Map([['ArenaSwitch', 'a reason']]))[0]).toContain('outlived');
});

test('nothing closes over nothing', () => {
  expect(zeroComponentProblem(1)).toBe(null);
  expect(zeroComponentProblem(0)).toContain('found no component');
  expect(zeroAxisProblem(0)).toContain('AXES measures nothing');
  expect(zeroMatrixProblem('ArenaButton', 0)).toContain('crosses no enum member');
  expect(zeroCaseProblem(0)).toContain('read no case');
});

test('UNENUMERATED is empty, and the emptiness is the claim', () => {
  expect(UNENUMERATED.size).toBe(0);
  expect(UNDECIDABLE.size).toBeGreaterThan(0);
  expect(Object.keys(UNITS)).toEqual(['compose', 'swiftui']);
  expect(node.writes).toEqual([]);
  expect(node.reads).toContain('.contracts/arena.contracts.json');
});
