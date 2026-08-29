import { test, expect } from 'bun:test';
import {
  CLASSES, coverageProblems, KOTLIN_MEMBER, membersIn, missingSeamProblems, operandProblems,
  parityProblems, shapeProblems, staleClassProblems, SWIFT_MEMBER, zeroClassProblem,
  zeroMemberProblem,
} from './check-motion.ts';

const KOTLIN = [
  'public object ArenaMotion {',
  '    public fun working(loop: Int, reduced: Boolean, slowed: Int = ArenaTokens.loopReduced): Int = if (reduced) slowed else loop',
  '    public fun decorative(reduced: Boolean): Boolean = !reduced',
  '    public fun travel(distance: Dp, reduced: Boolean): Dp = if (reduced) ArenaTokens.sp0 else distance',
  '}',
].join('\n');

const SWIFT = [
  'public enum ArenaMotion {',
  '    public static func working(_ loop: TimeInterval, reduced: Bool, slowed: TimeInterval = ArenaTokens.loopReduced) -> TimeInterval { reduced ? slowed : loop }',
  '    public static func decorative(_ reduced: Bool) -> Bool { !reduced }',
  '    public static func travel(_ distance: CGFloat, reduced: Bool) -> CGFloat { reduced ? ArenaTokens.sp0 : distance }',
  '}',
].join('\n');

const TOKENS = [
  { name: 'loop.reduced', type: 'duration', userScale: undefined },
  { name: 'loop.brand-reduced', type: 'duration', userScale: undefined },
  { name: 'sp.0', type: 'dimension', userScale: undefined },
];

test('a member is its parameter list, its return type and the expression it composes', () => {
  expect(membersIn(KOTLIN, KOTLIN_MEMBER).get('decorative')).toEqual({
    params: 'reduced: Boolean',
    returns: 'Boolean',
    body: '!reduced',
  });
  expect(membersIn(SWIFT, SWIFT_MEMBER).get('travel')).toEqual({
    params: '_ distance: CGFloat, reduced: Bool',
    returns: 'CGFloat',
    body: 'reduced ? ArenaTokens.sp0 : distance',
  });
});

test('both layers carry every class and neither grows one of its own', () => {
  expect(coverageProblems(membersIn(KOTLIN, KOTLIN_MEMBER), 'Compose')).toEqual([]);
  expect(coverageProblems(membersIn(SWIFT, SWIFT_MEMBER), 'SwiftUI')).toEqual([]);
  const short = membersIn(KOTLIN.split('\n').filter((line) => !line.includes(' travel(')).join('\n'), KOTLIN_MEMBER);
  expect(coverageProblems(short, 'Compose')).toHaveLength(1);
});

test('the policy is the body, and a class answering it differently is a named failure', () => {
  expect(shapeProblems(membersIn(KOTLIN, KOTLIN_MEMBER), 'Compose', 'kotlin')).toEqual([]);
  expect(shapeProblems(membersIn(SWIFT, SWIFT_MEMBER), 'SwiftUI', 'swift')).toEqual([]);
  const frozen = membersIn(KOTLIN.replace('if (reduced) slowed else loop', 'if (reduced) 0 else loop'), KOTLIN_MEMBER);
  expect(shapeProblems(frozen, 'Compose', 'kotlin')).toHaveLength(1);
});

test('a slowed step that is not a default is a named failure', () => {
  const pinned = membersIn(
    KOTLIN.replace('slowed: Int = ArenaTokens.loopReduced', 'slowed: Int'),
    KOTLIN_MEMBER,
  );
  expect(shapeProblems(pinned, 'Compose', 'kotlin')).toHaveLength(1);
});

test('the two layers offer one library', () => {
  expect(parityProblems(membersIn(KOTLIN, KOTLIN_MEMBER), membersIn(SWIFT, SWIFT_MEMBER))).toEqual([]);
  const short = membersIn(SWIFT.split('\n').filter((line) => !line.includes(' decorative(')).join('\n'), SWIFT_MEMBER);
  expect(parityProblems(membersIn(KOTLIN, KOTLIN_MEMBER), short)).toHaveLength(1);
});

test('every operand is the type its class needs and none of them scales', () => {
  expect(operandProblems(TOKENS)).toEqual([]);
  expect(operandProblems(TOKENS.map((token) => (token.name === 'sp.0' ? { ...token, type: 'duration' } : token)))).toHaveLength(1);
  expect(operandProblems(TOKENS.map((token) => (token.name === 'loop.reduced' ? { ...token, userScale: 'scales' } : token)))).toHaveLength(1);
});

test("the rotor's own slowed step is held even though no member names it", () => {
  expect(CLASSES.get('working')?.tokens).toContain('loop.brand-reduced');
  expect(staleClassProblems(TOKENS)).toEqual([]);
  expect(staleClassProblems(TOKENS.filter((token) => token.name !== 'loop.brand-reduced'))).toHaveLength(1);
});

test('every class carries a reason', () => {
  for (const [, one] of CLASSES) expect(one.why.length).toBeGreaterThan(0);
});

test('a gate that read nothing fails rather than passing over nothing', () => {
  expect(zeroClassProblem(0)).not.toBeNull();
  expect(zeroClassProblem(CLASSES.size)).toBeNull();
  expect(zeroMemberProblem(0, 'SwiftUI')).not.toBeNull();
  expect(zeroMemberProblem(3, 'SwiftUI')).toBeNull();
  expect(missingSeamProblems(() => false)).toHaveLength(2);
  expect(missingSeamProblems(() => true)).toEqual([]);
});
