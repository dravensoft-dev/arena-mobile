/* A dp and a point are both defined as one CSS pixel at 1x, so a fixed dimension crosses
 * numerically 1:1 and that is stated here once. Every other row is asymmetric in some way, and
 * every mistake in one of them compiles: the screen draws and the sizes are wrong by a ratio
 * nobody measured, which is why this file asserts the emitted literal and not just the type. */

import { test, expect } from 'bun:test';
import { CSS_GENERIC_FAMILIES, bridge, familyHead, kotlinColor, num, swiftColor } from './bridge.ts';
import type { Token } from '../contracts/payload.ts';

const token = (over: Partial<Token>): Token => ({
  path: ['x'], name: 'x', file: 'contracts/design/effects.json', scope: 'base',
  type: 'dimension', value: { value: 1, unit: 'px' }, ...over,
});

test('a fixed dimension is Dp and points, at the same number', () => {
  const one = bridge(token({ userScale: 'fixed', value: { value: 16, unit: 'px' } }), 'sp4');
  expect(one.kotlinType).toBe('Dp');
  expect(one.kotlinLiteral).toBe('16.dp');
  expect(one.swiftType).toBe('CGFloat');
  expect(one.swiftLiteral).toBe('16');
});

test('a scaling dimension is sp and never dp, which no compiler can tell apart', () => {
  const one = bridge(token({ userScale: 'scales', value: { value: 15, unit: 'px' } }), 'fsMd');
  expect(one.kotlinLiteral).toBe('15.sp');
  expect(one.kotlinType).toBe('TextUnit');
});

test('a colour comes from components and never from hex, because hex is gone when alpha is there', () => {
  const solid = { colorSpace: 'srgb', components: [0.7098, 0.1647, 0.1255], hex: '#b52a20' };
  expect(kotlinColor(solid, 'x')).toBe('Color(red = 0.7098f, green = 0.1647f, blue = 0.1255f, alpha = 1f)');
  expect(swiftColor(solid, 'x')).toBe('Color(.sRGB, red: 0.7098, green: 0.1647, blue: 0.1255, opacity: 1)');
  const scrim = { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.6 };
  expect(kotlinColor(scrim, 'x')).toContain('alpha = 0.6f');
  expect(() => kotlinColor({ colorSpace: 'display-p3', components: [0, 0, 0] }, 'x')).toThrow('stated for srgb');
});

test('a duration is milliseconds on Compose and seconds on SwiftUI, which is a declared transform', () => {
  const one = bridge(token({ type: 'duration', value: { value: 120, unit: 'ms' } }), 'durFast');
  expect(one.kotlinLiteral).toBe('120');
  expect(one.swiftLiteral).toBe('0.12');
  expect(one.swiftType).toBe('TimeInterval');
});

test('a tracking number is an em on Compose and a bare ratio on SwiftUI, applied two different ways', () => {
  const one = bridge(token({ type: 'number', value: -0.02, cssUnit: 'em', userScale: 'follows' }), 'lsTight');
  expect(one.kotlinLiteral).toBe('(-0.02).em');
  expect(one.swiftLiteral).toBe('-0.02');
});

test('a percentage is emitted as the fraction both platforms multiply by, which is declared and not silent', () => {
  const one = bridge(token({ type: 'number', value: 12, cssUnit: '%' }), 'tintSoft');
  expect(one.kotlinLiteral).toBe('0.12f');
  expect(one.swiftLiteral).toBe('0.12');
  expect(() => bridge(token({ type: 'number', value: 1, cssUnit: 'ch' }), 'x')).toThrow('the bridge does not state');
});

test('a plain number is a floating value on both, because zIndex takes one on either toolkit', () => {
  const one = bridge(token({ type: 'number', value: 900 }), 'zModal');
  expect(one.kotlinLiteral).toBe('900f');
  expect(one.swiftLiteral).toBe('900');
});

test('a font family takes the head and drops the CSS generic tail, which names nothing off the web', () => {
  expect(familyHead(['Archivo', 'system-ui', 'sans-serif'])).toBe('Archivo');
  expect(familyHead(['Spline Sans Mono', 'ui-monospace', 'monospace'])).toBe('Spline Sans Mono');
  expect(CSS_GENERIC_FAMILIES.has('system-ui')).toBe(true);
  expect(() => familyHead(['sans-serif'])).toThrow('names anything on either platform');
});

test('a font weight is exact on Compose and a named case on SwiftUI', () => {
  const one = bridge(token({ type: 'fontWeight', value: 600 }), 'fwSemibold');
  expect(one.kotlinLiteral).toBe('FontWeight(600)');
  expect(one.swiftLiteral).toBe('.semibold');
  expect(() => bridge(token({ type: 'fontWeight', value: 550 }), 'x')).toThrow('Font.Weight does not name');
});

test('a shadow crosses without its spread, and a member no map names stops the emit', () => {
  const value = {
    offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' },
    blur: { value: 6, unit: 'px' }, spread: { value: -2, unit: 'px' },
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 },
  };
  const one = bridge(token({ type: 'shadow', name: 'shadow.1', value }), 'shadow1');
  expect(one.kotlinLiteral).toContain('blur = 6.dp');
  expect(one.kotlinLiteral).not.toContain('spread');
  expect(() => bridge(token({ type: 'shadow', name: 'shadow.9', value }), 'shadow9')).toThrow('UNMAPPED does not name it');
});

test('a type the bridge does not state stops the emit rather than passing through', () => {
  expect(() => bridge(token({ type: 'gradient', value: [] }), 'x')).toThrow('Add the row or record it in UNMAPPED');
});

test('a number is emitted the same way on every machine', () => {
  expect(num(16)).toBe('16');
  expect(num(0.12)).toBe('0.12');
  expect(num(-0.02)).toBe('-0.02');
  expect(() => num(Number.NaN)).toThrow('not a finite number');
});
