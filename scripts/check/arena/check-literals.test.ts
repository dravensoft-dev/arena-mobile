import { test, expect } from 'bun:test';
import { BANNED, EXEMPT, literalProblems, staleExemptProblems, zeroScanProblem } from './check-literals.ts';

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

test('a rule reaching nothing is a rule this gate cannot tell from a clean tree', () => {
  expect(zeroScanProblem(0)).toContain('0 hand-authored native sources');
  expect(zeroScanProblem(1)).toBeNull();
  expect(BANNED.length).toBeGreaterThan(0);
});
