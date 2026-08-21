import { test, expect } from 'bun:test';
import { byCodeUnit, sortedByCodeUnit } from './compare.ts';

test('ordering is by code unit, because localeCompare answers differently per locale', () => {
  expect(sortedByCodeUnit(['a', 'B'])).toEqual(['B', 'a']);
  expect(byCodeUnit('a', 'a')).toBe(0);
  expect(byCodeUnit('a', 'b')).toBe(-1);
  expect(byCodeUnit('b', 'a')).toBe(1);
});

test('sorting does not move the array it was handed', () => {
  const given = ['b', 'a'];
  expect(sortedByCodeUnit(given)).toEqual(['a', 'b']);
  expect(given).toEqual(['b', 'a']);
});
