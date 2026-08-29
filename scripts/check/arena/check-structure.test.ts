import { test, expect } from 'bun:test';
import {
  PLACED, crossLayerProblems, emittedTargets, expectedPartition, isPartition,
  missingDirectoryProblems, partitionOf, placementProblems, stalePlacedProblems, stemOf,
  zeroSourceProblem,
} from './check-structure.ts';
import { PARTITIONS, ROOTS } from '../../lib/arena/layer-trees.ts';
import type { Layer } from '../../lib/arena/behaviour-obligations.ts';
import { TARGETS } from '../../generate/arena/generate-tokens.ts';
import { API_TARGETS } from '../../generate/arena/generate-api-types.ts';

const NOTHING = new Set<string>();
const BUTTON = new Set(['ArenaButton']);

test('PLACED carries the one subject a walk cannot decide, with its reason', () => {
  expect([...PLACED.keys()]).toEqual(['ArenaTheme']);
  expect(PLACED.get('ArenaTheme')?.partition).toBe('theme');
  expect(PLACED.get('ArenaTheme')?.why).toContain('the channel');
});

test('a file loose in the root is in no partition at all', () => {
  expect(partitionOf('ArenaScale.swift')).toBeNull();
  expect(partitionOf('tokens/ArenaScale.swift')).toBe('tokens');
});

test('a fifth directory names none of the four', () => {
  for (const partition of PARTITIONS) expect(isPartition(partition)).toBe(true);
  expect(isPartition('helpers')).toBe(false);
});

test('a stem drops the generated infix, so an emitted subject is the subject it emits', () => {
  expect(stemOf('tokens/ArenaTokens.generated.swift', '.swift')).toBe('ArenaTokens');
  expect(stemOf('components/ArenaButton.swift', '.swift')).toBe('ArenaButton');
});

test('what a file IS decides its directory, and tokens is what an authored value defaults to', () => {
  expect(expectedPartition('ArenaButton', BUTTON)).toBe('components');
  expect(expectedPartition('ArenaTheme', BUTTON)).toBe('theme');
  expect(expectedPartition('ArenaScale', BUTTON)).toBe('tokens');
  expect(expectedPartition('ArenaButton', NOTHING)).toBe('tokens');
});

test('every emitted target is reachable by its own file name', () => {
  const targets = emittedTargets();
  expect(targets.size).toBe(TARGETS.length + API_TARGETS.length);
  expect(targets.get('ArenaApi.generated.swift')).toBe(`${ROOTS.swiftui}/api/ArenaApi.generated.swift`);
});

test('a layer missing one of the four directories is a named failure', () => {
  expect(missingDirectoryProblems(() => true)).toEqual([]);
  expect(missingDirectoryProblems(() => false)).toHaveLength(PARTITIONS.length * 2);
});

test('a source in the wrong directory is reported with what it is', () => {
  const targets = emittedTargets();
  expect(placementProblems('swiftui', ['components/ArenaButton.swift'], BUTTON, targets)).toEqual([]);
  const misplaced = placementProblems('swiftui', ['tokens/ArenaButton.swift'], BUTTON, targets);
  expect(misplaced).toHaveLength(1);
  expect(misplaced[0]).toContain('components/');
  expect(placementProblems('swiftui', ['ArenaScale.swift'], BUTTON, targets)[0]).toContain('loose in the root');
  expect(placementProblems('swiftui', ['helpers/ArenaScale.swift'], BUTTON, targets)[0]).toContain('fifth directory');
});

test('a stray emit is reported where check:emit cannot see it', () => {
  const targets = emittedTargets();
  expect(placementProblems('swiftui', ['tokens/ArenaTokens.generated.swift'], NOTHING, targets)).toEqual([]);
  const stray = placementProblems('swiftui', ['theme/ArenaTokens.generated.swift'], NOTHING, targets);
  expect(stray[0]).toContain('a second copy elsewhere');
  const orphan = placementProblems('swiftui', ['tokens/ArenaGhost.generated.swift'], NOTHING, targets);
  expect(orphan[0]).toContain('no generator declares a target');
});

test('one subject placed two ways across the layers is the tree answering twice', () => {
  const agreeing = new Map<Layer, ReadonlyMap<string, string>>([
    ['compose', new Map([['ArenaScale', 'tokens']])],
    ['swiftui', new Map([['ArenaScale', 'tokens']])],
  ]);
  expect(crossLayerProblems(agreeing)).toEqual([]);
  const split = new Map<Layer, ReadonlyMap<string, string>>([
    ['compose', new Map([['ArenaScale', 'tokens']])],
    ['swiftui', new Map([['ArenaScale', 'theme']])],
  ]);
  expect(crossLayerProblems(split)).toHaveLength(1);
  expect(crossLayerProblems(split)[0]).toContain('ArenaScale');
});

test('a placement for a file that is gone places nothing', () => {
  expect(stalePlacedProblems(new Set(['ArenaTheme']))).toEqual([]);
  expect(stalePlacedProblems(new Set())).toHaveLength(1);
});

test('an empty walk is a claim and not a pass', () => {
  expect(zeroSourceProblem(0)).not.toBeNull();
  expect(zeroSourceProblem(1)).toBeNull();
});
