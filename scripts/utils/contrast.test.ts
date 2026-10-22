import { test, expect } from 'bun:test';
import { contrast, luminance } from './contrast.ts';

const WHITE: [number, number, number] = [1, 1, 1];
const BLACK: [number, number, number] = [0, 0, 0];
const GREY: [number, number, number] = [0.5, 0.5, 0.5];

test('luminance is the WCAG one, so black is zero and white is one', () => {
  expect(luminance(BLACK)).toBeCloseTo(0, 10);
  expect(luminance(WHITE)).toBeCloseTo(1, 10);
});

test('contrast is symmetric and tops out at twenty-one to one', () => {
  expect(contrast(WHITE, BLACK)).toBeCloseTo(21, 6);
  expect(contrast(BLACK, WHITE)).toBeCloseTo(21, 6);
  expect(contrast(WHITE, WHITE)).toBeCloseTo(1, 10);
});

test('luminance is not the channel value, because the encoding is not linear', () => {
  expect(luminance(GREY)).toBeLessThan(0.25);
  expect(luminance(GREY)).toBeGreaterThan(0.2);
});
