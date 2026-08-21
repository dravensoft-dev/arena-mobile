import { test, expect } from 'bun:test';
import { AXIS_UNITS, axisProblems, unitProblems, zeroDimensionProblem } from './check-user-scale.ts';
import { USER_SCALE_AXES, type Token } from '../../lib/contracts/payload.ts';

const px = (value: number) => ({ value, unit: 'px' });
const token = (over: Partial<Token>): Token => ({
  path: ['fs', 'md'], name: 'fs.md', file: 'contracts/design/typography.json', scope: 'base',
  type: 'dimension', value: px(15), ...over,
});

const everyAxis = USER_SCALE_AXES.map((axis, index) => token({
  name: `t.${axis}`, path: ['t', axis], userScale: axis, value: px(index + 1),
}));

test('an empty token set is a failure and not a set where every claim holds', () => {
  expect(zeroDimensionProblem([])).toContain('0 dimensions');
  expect(zeroDimensionProblem(everyAxis)).toBeNull();
});

test('a dimension resolving no axis fails, because the axis is what decides sp from dp', () => {
  expect(axisProblems([...everyAxis, token({ name: 'fs.lg', userScale: undefined })])[0])
    .toContain('resolving no userScale');
});

test('an axis no token takes fails, so the closed set cannot outlive its cases', () => {
  const errs = axisProblems([token({ userScale: 'fixed' })]);
  expect(errs.some((one) => one.includes('scales'))).toBe(true);
  expect(errs.some((one) => one.includes('follows'))).toBe(true);
  expect(axisProblems(everyAxis)).toEqual([]);
});

test('a word outside the set fails rather than passing through as a new axis', () => {
  expect(axisProblems([...everyAxis, token({ name: 'x', userScale: 'grows' as never })])[0])
    .toContain('outside the closed set');
});

test('each axis produces the unit it obliges, which no compiler can check', () => {
  expect(AXIS_UNITS.get('scales')).toEqual({ kotlin: 'TextUnit', suffix: '.sp' });
  expect(AXIS_UNITS.get('fixed')).toEqual({ kotlin: 'Dp', suffix: '.dp' });
  expect(unitProblems([token({ userScale: 'scales' }), token({ name: 'sp.4', path: ['sp', '4'], userScale: 'fixed' })])).toEqual([]);
});
