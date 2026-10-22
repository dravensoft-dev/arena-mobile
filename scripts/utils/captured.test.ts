import { test, expect } from 'bun:test';
import { captured } from './captured.ts';

test('a group the pattern guarantees comes back as a string and never as a maybe', () => {
  const found = /^(\w+)=(\w+)$/.exec('size=md');
  expect(captured(found)).toBe('size');
  expect(captured(found, 2)).toBe('md');
});

test('a match that never happened fails at the read rather than three functions downstream', () => {
  expect(() => captured(null)).toThrow('never happened');
});

test('a pattern that lost its group names the group and what did match', () => {
  const found = /^(?:(a)|b)$/.exec('b');
  expect(() => captured(found)).toThrow('did not capture');
  expect(() => captured(found)).toThrow('"b"');
});
