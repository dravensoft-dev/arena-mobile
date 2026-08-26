import { test, expect } from 'bun:test';
import { excludedIn, publishedIn, surfaceProblems } from './component-surface.ts';
import { ABSENT_REASON, absenceReasonOf, isPublished, publishedComponents, type Entry } from './behaviour-bindings.ts';
import { COMPONENTS_PREFIX } from '../contracts/api-types.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.2', contracts });

const absent: Entry = { pattern: 'absent', reason: ABSENT_REASON };
const published: Entry = { pattern: 'button', met: {}, exceptions: {} };

const register = new Map<string, Entry>([['ArenaButton', published], ['ArenaCard', absent]]);
const catalogue = manifest([
  `${COMPONENTS_PREFIX}ArenaButton.json`,
  `${COMPONENTS_PREFIX}ArenaCard.json`,
  'contracts/api/types/arena-tone.json',
]);

test('the register decides which half is read, and neither half is a prefix', () => {
  expect(publishedIn(catalogue, register)).toEqual([`${COMPONENTS_PREFIX}ArenaButton.json`]);
  expect(excludedIn(catalogue, register)).toEqual([`${COMPONENTS_PREFIX}ArenaCard.json`]);
});

test('an exclusion inherits the register reason rather than restating one of its own', () => {
  expect(absenceReasonOf('ArenaCard', register)).toBe(ABSENT_REASON);
  expect(absenceReasonOf('ArenaButton', register)).toBeNull();
  expect(isPublished(published)).toBe(true);
  expect(isPublished(absent)).toBe(false);
  expect(publishedComponents(register)).toEqual(['ArenaButton']);
});

test('a published component whose members nothing opens is the failure that says the reading is owed', () => {
  expect(surfaceProblems(catalogue, register)[0]).toContain('no reader on this side opens');
  expect(surfaceProblems(catalogue, new Map([['ArenaButton', absent], ['ArenaCard', absent]]))).toEqual([]);
});

test('a component the register does not name is sent to the register and never answered here', () => {
  expect(surfaceProblems(catalogue, new Map([['ArenaCard', absent]]))[0])
    .toContain('the behaviour register does not name');
});
