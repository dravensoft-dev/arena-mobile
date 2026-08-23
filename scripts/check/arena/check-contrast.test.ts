import { test, expect } from 'bun:test';
import {
  AXES, CASES, coverageProblems, expectedKotlin, expectedSwift, KOTLIN_MEMBER, membersIn,
  missingSeamProblems, operandProblems, parityProblems, REFUSED, refusedProblems, shapeProblems,
  staleCaseProblems, SWIFT_MEMBER, zeroCaseProblem, zeroMemberProblem,
} from './check-contrast.ts';

const KOTLIN = [
  'public object ArenaContrast {',
  '    public fun border(increased: Boolean): Dp = if (increased) ArenaTokens.bwStrong else ArenaTokens.bw',
  '    public fun focusWidth(increased: Boolean): Dp = if (increased) ArenaTokens.sp1 else ArenaTokens.focusWidth',
  '    public fun scrimBlur(reduced: Boolean): Dp = if (reduced) ArenaTokens.sp0 else ArenaTokens.scrimBlur',
  '}',
].join('\n');

const SWIFT = [
  'public enum ArenaContrast {',
  '    public static func border(_ increased: Bool) -> CGFloat { increased ? ArenaTokens.bwStrong : ArenaTokens.bw }',
  '    public static func focusWidth(_ increased: Bool) -> CGFloat { increased ? ArenaTokens.sp1 : ArenaTokens.focusWidth }',
  '    public static func scrimBlur(_ reduced: Bool) -> CGFloat { reduced ? ArenaTokens.sp0 : ArenaTokens.scrimBlur }',
  '}',
].join('\n');

const TOKENS = [
  { name: 'bw', type: 'dimension', userScale: 'fixed' },
  { name: 'bw-strong', type: 'dimension', userScale: 'fixed' },
  { name: 'scrim-blur', type: 'dimension', userScale: 'fixed' },
  { name: 'focus.width', type: 'dimension', userScale: undefined },
  { name: 'sp.0', type: 'dimension', userScale: undefined },
  { name: 'sp.1', type: 'dimension', userScale: undefined },
];

test('a member is its parameter list and the expression it composes', () => {
  expect(membersIn(KOTLIN, KOTLIN_MEMBER)).toEqual(new Map([
    ['border', { params: 'increased: Boolean', body: 'if (increased) ArenaTokens.bwStrong else ArenaTokens.bw' }],
    ['focusWidth', { params: 'increased: Boolean', body: 'if (increased) ArenaTokens.sp1 else ArenaTokens.focusWidth' }],
    ['scrimBlur', { params: 'reduced: Boolean', body: 'if (reduced) ArenaTokens.sp0 else ArenaTokens.scrimBlur' }],
  ]));
  expect([...membersIn(SWIFT, SWIFT_MEMBER).keys()].sort()).toEqual(['border', 'focusWidth', 'scrimBlur']);
});

test('the expected member is derived from CASES and AXES rather than written twice', () => {
  expect(expectedKotlin('scrimBlur')).toEqual({
    params: 'reduced: Boolean',
    body: 'if (reduced) ArenaTokens.sp0 else ArenaTokens.scrimBlur',
  });
  expect(expectedSwift('border')).toEqual({
    params: '_ increased: Bool',
    body: 'increased ? ArenaTokens.bwStrong : ArenaTokens.bw',
  });
  expect(expectedKotlin('accentInk')).toBeNull();
});

test('both layers carry every case and neither grows one of its own', () => {
  expect(coverageProblems(membersIn(KOTLIN, KOTLIN_MEMBER), 'Compose')).toEqual([]);
  expect(coverageProblems(membersIn(SWIFT, SWIFT_MEMBER), 'SwiftUI')).toEqual([]);
  const short = membersIn(KOTLIN.split('\n').filter((line) => !line.includes(' scrimBlur(')).join('\n'), KOTLIN_MEMBER);
  expect(coverageProblems(short, 'Compose')).toHaveLength(1);
});

test('a layer answering a case with the wrong step is a named failure', () => {
  const wrong = membersIn(KOTLIN.replace('ArenaTokens.bwStrong', 'ArenaTokens.bw'), KOTLIN_MEMBER);
  expect(shapeProblems(wrong, expectedKotlin, 'Compose')).toHaveLength(1);
  expect(shapeProblems(membersIn(KOTLIN, KOTLIN_MEMBER), expectedKotlin, 'Compose')).toEqual([]);
  expect(shapeProblems(membersIn(SWIFT, SWIFT_MEMBER), expectedSwift, 'SwiftUI')).toEqual([]);
});

test('a case reading the wrong axis is a named failure', () => {
  const wrong = membersIn(
    KOTLIN.replace('scrimBlur(reduced: Boolean): Dp = if (reduced)', 'scrimBlur(increased: Boolean): Dp = if (increased)'),
    KOTLIN_MEMBER,
  );
  expect(shapeProblems(wrong, expectedKotlin, 'Compose')).toHaveLength(1);
});

test('the two layers offer one library', () => {
  expect(parityProblems(membersIn(KOTLIN, KOTLIN_MEMBER), membersIn(SWIFT, SWIFT_MEMBER))).toEqual([]);
  const short = membersIn(SWIFT.split('\n').filter((line) => !line.includes(' border(')).join('\n'), SWIFT_MEMBER);
  expect(parityProblems(membersIn(KOTLIN, KOTLIN_MEMBER), short)).toHaveLength(1);
});

test('the fourth case is refused, and a member for it fails rather than passing quietly', () => {
  expect([...REFUSED.keys()]).toEqual(['accentInk']);
  expect(refusedProblems(membersIn(KOTLIN, KOTLIN_MEMBER), 'Compose')).toEqual([]);
  const grown = membersIn(
    `${KOTLIN}\n    public fun accentInk(increased: Boolean): Dp = if (increased) ArenaTokens.bw else ArenaTokens.bw`,
    KOTLIN_MEMBER,
  );
  expect(refusedProblems(grown, 'Compose')).toHaveLength(1);
});

test('every operand is a length the reader text setting does not move', () => {
  expect(operandProblems(TOKENS)).toEqual([]);
  expect(operandProblems(TOKENS.map((token) => (token.name === 'sp.1' ? { ...token, userScale: 'scales' } : token)))).toHaveLength(1);
  expect(operandProblems(TOKENS.map((token) => (token.name === 'bw' ? { ...token, type: 'number' } : token)))).toHaveLength(1);
});

test('a case naming a token the payload dropped fails', () => {
  expect(staleCaseProblems(TOKENS)).toEqual([]);
  expect(staleCaseProblems(TOKENS.filter((token) => token.name !== 'bw-strong'))).toHaveLength(1);
});

test('every map carries a reason and no entry is silent', () => {
  for (const [, one] of CASES) expect(one.why.length).toBeGreaterThan(0);
  for (const [, one] of AXES) expect(one.why.length).toBeGreaterThan(0);
  for (const [, why] of REFUSED) expect(why.length).toBeGreaterThan(0);
});

test('a gate that read nothing fails rather than passing over nothing', () => {
  expect(zeroCaseProblem(0)).not.toBeNull();
  expect(zeroCaseProblem(CASES.size)).toBeNull();
  expect(zeroMemberProblem(0, 'Compose')).not.toBeNull();
  expect(zeroMemberProblem(3, 'Compose')).toBeNull();
  expect(missingSeamProblems(() => false)).toHaveLength(2);
  expect(missingSeamProblems(() => true)).toEqual([]);
});
