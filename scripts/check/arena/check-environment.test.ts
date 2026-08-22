import { test, expect } from 'bun:test';
import {
  axisProblems, compositionProblems, coverageProblems, FLOORS, floorProblems, KOTLIN_COMPOSITION,
  KOTLIN_MEMBER, membersIn, missingSeamProblems, parityProblems, staleFloorProblems,
  SWIFT_COMPOSITION, SWIFT_MEMBER, zeroEdgeProblem, zeroMemberProblem,
} from './check-environment.ts';

const KOTLIN = [
  'public object ArenaSafeArea {',
  '    public fun top(inset: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, inset)',
  '    public fun end(inset: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, inset)',
  '    public fun bottom(inset: Dp, floor: Dp = ArenaTokens.sp3): Dp = max(floor, inset)',
  '    public fun start(inset: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, inset)',
  '}',
].join('\n');

const SWIFT = [
  'public enum ArenaSafeArea {',
  '    public static func top(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp0) -> CGFloat { max(floor, inset) }',
  '    public static func end(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp0) -> CGFloat { max(floor, inset) }',
  '    public static func bottom(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp3) -> CGFloat { max(floor, inset) }',
  '    public static func start(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp0) -> CGFloat { max(floor, inset) }',
  '}',
].join('\n');

const TOKENS = [
  { name: 'sp.0', path: ['sp', '0'], type: 'dimension', userScale: 'fixed' },
  { name: 'sp.3', path: ['sp', '3'], type: 'dimension', userScale: 'fixed' },
  { name: 'fs.md', path: ['fs', 'md'], type: 'dimension', userScale: 'scales' },
];

test('a member is its edge, the token its floor names and the expression it composes', () => {
  expect(membersIn(KOTLIN, KOTLIN_MEMBER)).toEqual(new Map([
    ['top', { floor: 'sp0', body: 'max(floor, inset)' }],
    ['end', { floor: 'sp0', body: 'max(floor, inset)' }],
    ['bottom', { floor: 'sp3', body: 'max(floor, inset)' }],
    ['start', { floor: 'sp0', body: 'max(floor, inset)' }],
  ]));
  expect([...membersIn(SWIFT, SWIFT_MEMBER).keys()].sort()).toEqual(['bottom', 'end', 'start', 'top']);
});

test('every edge FLOORS names is declared, and no layer grows one of its own', () => {
  expect(coverageProblems(membersIn(KOTLIN, KOTLIN_MEMBER), 'Compose')).toEqual([]);
  const short = membersIn(KOTLIN.split('\n').filter((line) => !line.includes(' start(')).join('\n'), KOTLIN_MEMBER);
  expect(coverageProblems(short, 'Compose')).toHaveLength(1);
  expect(coverageProblems(short, 'Compose')[0]).toContain('start');
  const invented = new Map([...membersIn(KOTLIN, KOTLIN_MEMBER), ['middle', { floor: 'sp0', body: 'max(floor, inset)' }]]);
  expect(coverageProblems(invented, 'Compose')[0]).toContain('middle');
});

test('the two seams carry the same edges over the same floors', () => {
  expect(parityProblems(membersIn(KOTLIN, KOTLIN_MEMBER), membersIn(SWIFT, SWIFT_MEMBER))).toEqual([]);
  const drifted = new Map(membersIn(SWIFT, SWIFT_MEMBER));
  drifted.set('bottom', { floor: 'sp0', body: 'max(floor, inset)' });
  const errs = parityProblems(membersIn(KOTLIN, KOTLIN_MEMBER), drifted);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('sp3');
});

test('a floor resolves to the emitted identifier of the token FLOORS names', () => {
  expect(floorProblems(membersIn(KOTLIN, KOTLIN_MEMBER), 'Compose')).toEqual([]);
  const wrong = new Map(membersIn(KOTLIN, KOTLIN_MEMBER));
  wrong.set('bottom', { floor: 'sp4', body: 'max(floor, inset)' });
  expect(floorProblems(wrong, 'Compose')[0]).toContain('sp3');
});

test('a floor that started scaling with the reader is a failure', () => {
  expect(axisProblems(TOKENS)).toEqual([]);
  const scaled = TOKENS.map((one) => (one.name === 'sp.3' ? { ...one, userScale: 'scales' } : one));
  expect(axisProblems(scaled)[0]).toContain('sp.3');
});

test('the body composes and never replaces', () => {
  expect(compositionProblems(membersIn(KOTLIN, KOTLIN_MEMBER), KOTLIN_COMPOSITION, 'Compose')).toEqual([]);
  expect(compositionProblems(membersIn(SWIFT, SWIFT_MEMBER), SWIFT_COMPOSITION, 'SwiftUI')).toEqual([]);
  const replaced = new Map(membersIn(KOTLIN, KOTLIN_MEMBER));
  replaced.set('bottom', { floor: 'sp3', body: 'inset' });
  expect(compositionProblems(replaced, KOTLIN_COMPOSITION, 'Compose')[0]).toContain('bottom');
});

test('a floor the pinned contract stops carrying fails the map that names it', () => {
  expect(staleFloorProblems(TOKENS)).toEqual([]);
  expect(staleFloorProblems(TOKENS.filter((one) => one.name !== 'sp.3'))[0]).toContain('sp.3');
});

test('a seam that moves is a named failure and never an empty scan', () => {
  expect(missingSeamProblems(() => true)).toEqual([]);
  expect(missingSeamProblems(() => false)).toHaveLength(2);
});

test('finding nothing is a failure and not a pass', () => {
  expect(zeroEdgeProblem(FLOORS.size)).toBeNull();
  expect(zeroEdgeProblem(0)).toContain('0 edge');
  expect(zeroMemberProblem(1, 'Compose')).toBeNull();
  expect(zeroMemberProblem(0, 'Compose')).toContain('Compose');
});

test('FLOORS carries a reason per entry, because a bar with no reason is a number', () => {
  for (const [edge, floor] of FLOORS) {
    expect(floor.token).toMatch(/^sp\./);
    expect(floor.why.length).toBeGreaterThan(40);
    expect(edge).not.toBe('');
  }
});
