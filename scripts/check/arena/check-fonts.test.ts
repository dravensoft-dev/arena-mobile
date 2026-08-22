import { test, expect } from 'bun:test';
import {
  coverageProblems, defaultProblems, defaultsIn, familiesOf, fixedSizeProblems, KOTLIN_DEFAULT,
  KOTLIN_GENERIC, KOTLIN_MEMBER, membersIn, missingSeamProblems, OWED, parityProblems,
  staleOwedProblems, SWIFT_DEFAULT, SWIFT_GENERIC, SWIFT_MEMBER, zeroFamilyProblem,
  zeroMemberProblem,
} from './check-fonts.ts';

const TOKENS = [
  { name: 'font.display', path: ['font', 'display'], type: 'fontFamily', value: ['Archivo', 'system-ui', 'sans-serif'] },
  { name: 'font.mono', path: ['font', 'mono'], type: 'fontFamily', value: ['Spline Sans Mono', 'ui-monospace', 'monospace'] },
  { name: 'fs.md', path: ['fs', 'md'], type: 'dimension', value: { value: 15, unit: 'px' } },
];

const KOTLIN = [
  'public data class ArenaFonts(',
  '    public val display: FontFamily,',
  '    public val mono: FontFamily,',
  ') {',
  '    public companion object {',
  '        public val System: ArenaFonts = ArenaFonts(',
  '            display = FontFamily.Default,',
  '            mono = FontFamily.Monospace,',
  '        )',
].join('\n');

const SWIFT = [
  'public struct ArenaFonts: Equatable, Sendable {',
  '    public let display: ArenaFontFace',
  '    public let mono: ArenaFontFace',
  '    public static let system = ArenaFonts(',
  '        display: .system,',
  '        mono: .monospaced',
  '    )',
].join('\n');

test('a family is its member name, its head name and the generic its tail names', () => {
  expect(familiesOf(TOKENS)).toEqual([
    { member: 'display', name: 'Archivo', generic: 'system' },
    { member: 'mono', name: 'Spline Sans Mono', generic: 'monospaced' },
  ]);
});

test('both idioms read as the same member set', () => {
  expect(membersIn(KOTLIN, KOTLIN_MEMBER)).toEqual(['display', 'mono']);
  expect(membersIn(SWIFT, SWIFT_MEMBER)).toEqual(['display', 'mono']);
});

test('a family the contract names and a layer does not declare fails', () => {
  expect(coverageProblems(familiesOf(TOKENS), ['display', 'mono'], 'Compose')).toEqual([]);
  const missing = coverageProblems(familiesOf(TOKENS), ['display'], 'Compose');
  expect(missing).toHaveLength(1);
  expect(missing[0]).toContain('mono');
});

test('a member no fontFamily token names fails, so a seam cannot grow a family of its own', () => {
  const invented = coverageProblems(familiesOf(TOKENS), ['display', 'mono', 'reading'], 'Compose');
  expect(invented).toHaveLength(1);
  expect(invented[0]).toContain('reading');
});

test('a member one layer offers and the other does not is the failure nothing else reports', () => {
  expect(parityProblems(['display', 'mono'], ['display', 'mono'])).toEqual([]);
  const uneven = parityProblems(['display', 'mono'], ['display']);
  expect(uneven).toHaveLength(1);
  expect(uneven[0]).toContain('mono');
});

test('a default that is not the generic its own contracted tail names fails', () => {
  const families = familiesOf(TOKENS);
  expect(defaultProblems(families, defaultsIn(KOTLIN, KOTLIN_DEFAULT), KOTLIN_GENERIC, 'Compose')).toEqual([]);
  expect(defaultProblems(families, defaultsIn(SWIFT, SWIFT_DEFAULT), SWIFT_GENERIC, 'SwiftUI')).toEqual([]);
  const wrong = defaultProblems(families, new Map([['display', 'Monospace'], ['mono', 'Monospace']]), KOTLIN_GENERIC, 'Compose');
  expect(wrong).toHaveLength(1);
  expect(wrong[0]).toContain('display');
});

test('a family with no default at all fails rather than passing unmeasured', () => {
  const none = defaultProblems(familiesOf(TOKENS), new Map(), KOTLIN_GENERIC, 'Compose');
  expect(none).toHaveLength(2);
});

test('a named face resolved at a scaling size fails, because the size already scaled once', () => {
  expect(fixedSizeProblems('            return .custom(name, fixedSize: size)')).toEqual([]);
  const twice = fixedSizeProblems('            return .custom(name, size: size)');
  expect(twice).toHaveLength(1);
  expect(twice[0]).toContain('fixedSize');
});

test('a seam this gate cannot open is a failure and never an empty pass', () => {
  expect(missingSeamProblems(() => true)).toEqual([]);
  expect(missingSeamProblems(() => false)).toHaveLength(2);
});

test('reading no family and reading no member are both explicit failures', () => {
  expect(zeroFamilyProblem(1)).toBeNull();
  expect(zeroFamilyProblem(0)).toContain('0');
  expect(zeroMemberProblem(1, 'Compose')).toBeNull();
  expect(zeroMemberProblem(0, 'Compose')).toContain('Compose');
});

test('OWED names a family token, and an entry the pin now carries fails', () => {
  for (const name of OWED.keys()) expect(name.startsWith('font.')).toBe(true);
  expect(staleOwedProblems([{ name: 'font.display' }])).toEqual([]);
  const arrived = staleOwedProblems([{ name: 'font.display', weights: [400, 900] }]);
  expect(arrived).toHaveLength(1);
  expect(arrived[0]).toContain('font.display');
});
