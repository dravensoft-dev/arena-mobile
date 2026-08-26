import { test, expect } from 'bun:test';
import {
  affordancesOf, node, passLine, zeroAffordanceProblem, zeroAnswerProblem, zeroComponentProblem,
} from './check-affordances.ts';
import { SWIFT_COMPONENTS } from '../../lib/arena/component-sources.ts';

test('the gate reads the two component trees and no emitted source', () => {
  expect(node.writes).toEqual([]);
  expect(node.feeds).toEqual([]);
  expect(node.reads).toContain(`!${SWIFT_COMPONENTS}/**/*.generated.*`);
});

test('a contract that declares no affordances answers an empty list rather than throwing', () => {
  expect(affordancesOf({ affordances: ['press', 'focus'] })).toEqual(['focus', 'press']);
  expect(affordancesOf({})).toEqual([]);
  expect(affordancesOf({ affordances: 'focus' })).toEqual([]);
});

test('an empty contract, an empty vocabulary and an all-absent register are each a claim', () => {
  expect(zeroComponentProblem(0)).not.toBeNull();
  expect(zeroComponentProblem(1)).toBeNull();
  expect(zeroAffordanceProblem(0)).not.toBeNull();
  expect(zeroAffordanceProblem(1)).toBeNull();
  expect(zeroAnswerProblem(0)).not.toBeNull();
  expect(zeroAnswerProblem(1)).toBeNull();
});

test('the pass line says what a green run does not prove', () => {
  const line = passLine({ components: 73, affordances: 3, drawn: 1, excepted: 2, symbols: 2 });
  expect(line).toContain('never that a reader sees anything');
  expect(line).toContain('never one applied to the right node');
});
