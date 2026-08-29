import { test, expect } from 'bun:test';
import {
  BANNED, contractedFamilies, EXEMPT, familyProblems, literalProblems, staleExemptProblems,
  zeroBannedFamilyProblem, zeroScanProblem,
} from './check-literals.ts';

const scan = (source: string) => literalProblems([{ file: 'compose/src/main/kotlin/X.kt', source }]);

test('EXEMPT is empty, and the emptiness is the claim', () => {
  expect(EXEMPT.size).toBe(0);
  expect(staleExemptProblems(new Set())).toEqual([]);
});

test('a length, a text unit, a hex colour and a component-wise colour are all refused', () => {
  expect(scan('val x = 16.dp')[0]).toContain('a length or a text unit');
  expect(scan('val x = 15.sp')).toHaveLength(1);
  expect(scan('val x = 0.22.em')).toHaveLength(1);
  expect(scan('val x = "#b52a20"')[0]).toContain('a hex colour');
  expect(scan('val x = Color(red = 1f, green = 0f, blue = 0f, alpha = 1f)')[0]).toContain('built from components');
  expect(scan('let x = Color(.sRGB, red: 1, green: 0, blue: 0, opacity: 1)')).toHaveLength(1);
  expect(scan('val x = FontWeight(600)')[0]).toContain('font weight');
});

test('arithmetic is not a design value and stays allowed', () => {
  expect(scan('const val CAP: Float = 2f')).toEqual([]);
  expect(scan('radius: shadow.blur / 2')).toEqual([]);
  expect(scan('min(text(floor), floor * cap)')).toEqual([]);
});

test('a ratio handed to an alpha is a design value and not arithmetic', () => {
  expect(scan('val muted = baseContent.copy(alpha = 0.62f)')[0]).toContain('a ratio held back from a colour');
  expect(scan('let muted = baseContent.opacity(0.62)')).toHaveLength(1);
  expect(scan('public fun Color.held(ratio: Float): Color = copy(alpha = alpha * ratio)')).toEqual([]);
  expect(scan('func held(_ ratio: CGFloat) -> Color { opacity(ratio) }')).toEqual([]);
});

test('a rule reaching nothing is a rule this gate cannot tell from a clean tree', () => {
  expect(zeroScanProblem(0)).toContain('0 hand-authored native sources');
  expect(zeroScanProblem(1)).toBeNull();
  expect(BANNED.length).toBeGreaterThan(0);
});

test('a family name is read out of the contract rather than listed in the gate', () => {
  const tokens = [
    { name: 'font.display', type: 'fontFamily', value: ['Archivo', 'system-ui', 'sans-serif'] },
    { name: 'fs.md', type: 'dimension', value: { value: 15, unit: 'px' } },
  ];
  expect(contractedFamilies(tokens)).toEqual(['Archivo']);
});

test('a family name typed into a hand-authored source is a design value like any other', () => {
  const clean = [{ file: 'a.kt', source: 'val face = FontFamily(Font(R.font.archivo))' }];
  expect(familyProblems(clean, ['Archivo'])).toEqual([]);
  const typed = [{ file: 'a.kt', source: 'val face = ArenaFonts(display = "Archivo")' }];
  const problems = familyProblems(typed, ['Archivo']);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('Archivo');
  expect(problems[0]).toContain('ArenaTokens');
});

test('a ban over no family at all fails rather than passing over every source', () => {
  expect(zeroBannedFamilyProblem(1)).toBeNull();
  expect(zeroBannedFamilyProblem(0)).toContain('0');
});
