import { test, expect } from 'bun:test';
import {
  COLLAPSED, COMPOSITION, KOTLIN_CONSTANT, KOTLIN_RUNG, KOTLIN_RUNG_HEAD, KOTLIN_TARGET, RUNGS,
  SWIFT_CONSTANT, SWIFT_RUNG, SWIFT_RUNG_HEAD, SWIFT_TARGET, axisProblems, collapsedHere,
  compositionProblems, constantsIn, controlRoles, coverageProblems, missingSeamProblems,
  operandProblems, parityProblems, partitionProblems, rungProblems, rungsIn, targetIn,
  zeroMemberProblem, zeroRoleProblem, node,
} from './check-control.ts';

const emitted = new Map([['sp.3', 'sp3'], ['sp.2', 'sp2'], ['r.sm', 'rSm'], ['fw.semibold', 'fwSemibold'],
  ['dz.ctl-h', 'ctlH'], ['dz.ctl-h-sm', 'ctlHSm'], ['dz.ctl-h-lg', 'ctlHLg'], ['dz.text', 'text'], ['dz.text-md', 'textMd']]);

const kotlin = [
  '    public val padding: Dp = ArenaTokens.sp3',
  '    public fun height(size: ArenaControlSize, density: ArenaDensityScale): Dp = when (size) {',
  '        ArenaControlSize.Sm -> density.ctlHSm',
  '    }',
  '    public fun target(painted: Dp, floor: Dp): Dp = max(floor, painted)',
].join('\n');

const swift = [
  '    public static let padding: CGFloat = ArenaTokens.sp3',
  '    public static func height(_ size: ArenaControlSize, _ density: ArenaDensityScale) -> CGFloat {',
  '        case .sm: density.ctlHSm',
  '    }',
  '    public static func target(_ painted: CGFloat, floor: CGFloat) -> CGFloat { max(floor, painted) }',
].join('\n');

test('the seam is read out of both idioms into one vocabulary, and a Kotlin case folds to its Swift spelling', () => {
  expect(constantsIn(kotlin, KOTLIN_CONSTANT)).toEqual(new Map([['padding', 'sp3']]));
  expect(constantsIn(swift, SWIFT_CONSTANT)).toEqual(new Map([['padding', 'sp3']]));
  expect(rungsIn(kotlin, KOTLIN_RUNG_HEAD, KOTLIN_RUNG)).toEqual(new Map([['height.sm', 'ctlHSm']]));
  expect(rungsIn(swift, SWIFT_RUNG_HEAD, SWIFT_RUNG)).toEqual(new Map([['height.sm', 'ctlHSm']]));
});

test('the control roles come off the contract by the mark in their own names, never off a list here', () => {
  expect(controlRoles({ 'r-control': {}, 'r-field': {}, 'pad-control-x': {} })).toEqual(['pad-control-x', 'r-control']);
  expect(partitionProblems([...COLLAPSED.keys()])).toEqual([]);
  expect(partitionProblems([...COLLAPSED.keys(), 'grip-control'])[0]).toContain('neither answers nor refuses');
  expect(partitionProblems([...COLLAPSED.keys()].filter((role) => role !== 'lift-control'))[0])
    .toContain('declares no control role by that name');
});

test('a role this seam answers is a member on both layers, and a member answering no role is authored', () => {
  const carried = new Map(collapsedHere().map((role) => [COLLAPSED.get(role)?.member as string, 'x']));
  expect(coverageProblems(carried, 'Compose').filter((one) => one.includes('declares no'))).toEqual([]);
  expect(coverageProblems(new Map(), 'Compose')[0]).toContain('declares no');
  expect(coverageProblems(new Map([...carried, ['lift', 'x']]), 'Compose').at(-1)).toContain('grown a value this repository authored');
});

test('a step that looks right and is not is reported against the role that named it', () => {
  expect(operandProblems(new Map([['padding', 'sp3']]), emitted, 'Compose')).toEqual([]);
  expect(operandProblems(new Map([['padding', 'sp4']]), emitted, 'Compose')[0])
    .toContain('reads ArenaTokens.sp4 for padding');
});

test('every rung is answered, off the density member the contract names', () => {
  const all = new Map([...RUNGS].map(([key, rung]) => [key, emitted.get(rung.token) as string]));
  expect(rungProblems(all, emitted, 'Compose')).toEqual([]);
  expect(rungProblems(new Map(), emitted, 'Compose')[0]).toContain('answers no height.lg rung');
  expect(rungProblems(new Map([...all, ['height.xl', 'ctlH']]), emitted, 'Compose').at(-1))
    .toContain('RUNGS names no density token for it');
  expect(rungProblems(new Map([...all, ['height.sm', 'ctlH']]), emitted, 'Compose')[0])
    .toContain('reads density.ctlH for height.sm');
});

test('a length is geometry and a label is type, so each is held to its own axis', () => {
  const tokens = [
    { name: 'sp.3', type: 'dimension', userScale: 'fixed' },
    { name: 'dz.text', type: 'dimension', userScale: 'scales' },
  ];
  expect(axisProblems(tokens).filter((one) => one.includes('sp.3'))).toEqual([]);
  expect(axisProblems([{ name: 'sp.3', type: 'dimension', userScale: 'scales' }])
    .find((one) => one.startsWith('pad-control-x')))
    .toContain('on the scales axis where this seam needs fixed');
  expect(axisProblems([])[0]).toContain('which the pinned contract does not carry');
});

test('the activation box is a max, and a default floor is the one value this library would author', () => {
  expect(compositionProblems({ defaulted: false, body: COMPOSITION }, 'Compose')).toEqual([]);
  expect(compositionProblems(null, 'Compose')[0]).toContain('declares no target member');
  expect(compositionProblems({ defaulted: true, body: COMPOSITION }, 'Compose')[0]).toContain('default floor');
  expect(compositionProblems({ defaulted: false, body: 'painted' }, 'SwiftUI')[0]).toContain('composes the activation box as');
});

test('the target is read with its default, so one written in is seen rather than skipped', () => {
  expect(targetIn(kotlin, KOTLIN_TARGET)).toEqual({ defaulted: false, body: COMPOSITION });
  expect(targetIn(swift, SWIFT_TARGET)).toEqual({ defaulted: false, body: COMPOSITION });
  expect(targetIn('    public fun target(painted: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, painted)', KOTLIN_TARGET))
    .toEqual({ defaulted: true, body: COMPOSITION });
});

test('one contract offers one library, so a member on one layer alone is reported from either side', () => {
  expect(parityProblems(new Map([['padding', 'sp3']]), new Map([['padding', 'sp3']]), 'collapsed role')).toEqual([]);
  expect(parityProblems(new Map([['padding', 'sp3']]), new Map(), 'collapsed role')[0]).toContain('not on SwiftUI');
  expect(parityProblems(new Map(), new Map([['padding', 'sp3']]), 'collapsed role')[0]).toContain('not on Compose');
  expect(parityProblems(new Map([['padding', 'sp3']]), new Map([['padding', 'sp4']]), 'collapsed role')[0])
    .toContain('answer one role twice');
});

test('zero is a failure, because a gate that walked nothing reports no gaps behind a plausible line', () => {
  expect(zeroRoleProblem(0)).toContain('found none of');
  expect(zeroRoleProblem(1)).toBeNull();
  expect(zeroMemberProblem(0, 'Compose')).toContain('reports a clean pass');
  expect(zeroMemberProblem(1, 'Compose')).toBeNull();
  expect(missingSeamProblems(() => false)).toHaveLength(2);
  expect(missingSeamProblems(() => true)).toEqual([]);
});

test('the gate declares no writes, because a gate that emits stops a sweep reporting every problem', () => {
  expect(node.writes).toEqual([]);
  expect(node.feeds).toEqual([]);
  expect(node.name).toBe('check:control');
});
