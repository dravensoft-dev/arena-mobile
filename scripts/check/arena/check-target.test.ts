import { test, expect } from 'bun:test';
import {
  ARGUED, FLOORS, FLOOR_PATTERNS, UNBOXED, arguedProblems, clearances, decorativeProblems,
  floorIn, floorProblems, partitionProblems, staleUnboxedProblems, zeroComponentProblem,
  zeroMeasuredProblem, node,
} from './check-target.ts';

const rungs = [
  { name: 'dz.ctl-h-sm', density: 'base' as const, points: 32 },
  { name: 'dz.ctl-h', density: 'base' as const, points: 40 },
  { name: 'dz.ctl-h-sm', density: 'comfortable' as const, points: 44 },
  { name: 'dz.ctl-h', density: 'comfortable' as const, points: 48 },
];

test('the floor is read out of the suite that measures with it, in each idiom', () => {
  expect(floorIn('    private val TOUCH_FLOOR: Dp = 48.dp', FLOOR_PATTERNS.compose)).toBe(48);
  expect(floorIn('private let touchFloor: CGFloat = 44', FLOOR_PATTERNS.swiftui)).toBe(44);
  expect(floorIn('nothing here', FLOOR_PATTERNS.compose)).toBe(null);
});

test('one number written twice in two languages is held equal to what this gate says it is', () => {
  expect(floorProblems('compose', 48)).toEqual([]);
  expect(floorProblems('compose', 40)[0]).toContain('measures against 40');
  expect(floorProblems('compose', null)[0]).toContain('names no floor at all');
});

test('each floor is tied to the contracted rung whose own description argues it', () => {
  expect(arguedProblems(rungs)).toEqual([]);
  expect(arguedProblems(rungs.map((one) => (one.name === 'dz.ctl-h' && one.density === 'comfortable'
    ? { ...one, points: 40 } : one)))[0]).toContain('no longer clears');
  expect(arguedProblems(rungs.filter((one) => one.name !== 'dz.ctl-h-sm'))[0]).toContain('carries no rung');
});

test('a layer whose every rung already clears its floor makes the activation box ceremony', () => {
  expect(decorativeProblems(clearances(rungs))).toEqual([]);
  const tall = rungs.map((one) => ({ ...one, points: 96 }));
  expect(decorativeProblems(clearances(tall))).toHaveLength(2);
});

test('every component either tree draws is measured on both layers or excepted with a reason', () => {
  const measured = new Map([['compose', new Set(['ArenaButton'])], ['swiftui', new Set(['ArenaButton'])]]);
  expect(partitionProblems(['ArenaButton'], measured)).toEqual([]);
  expect(partitionProblems(['ArenaButton', 'ArenaSwitch'], measured)[0]).toContain('ArenaSwitch');
  expect(staleUnboxedProblems(['ArenaButton'])).toEqual([]);
});

test('an empty walk is a failure rather than a clean pass', () => {
  expect(zeroComponentProblem(1)).toBe(null);
  expect(zeroComponentProblem(0)).toContain('found no component');
  expect(zeroMeasuredProblem(0)).toContain('measured nothing');
});

test('UNBOXED is empty, and the emptiness is the claim', () => {
  expect(UNBOXED.size).toBe(0);
  expect(FLOORS.compose.points).toBe(48);
  expect(FLOORS.swiftui.points).toBe(44);
  expect(ARGUED.size).toBe(2);
  expect(node.writes).toEqual([]);
});
