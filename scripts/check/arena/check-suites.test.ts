import { test, expect } from 'bun:test';
import {
  COVERED_ELSEWHERE, OUTSIDE, SUBJECT_PARTITIONS, coverageProblems, keyFor, namingProblems,
  staleCoverProblems, staleOutsideProblems, subjectOfSuite, symmetryProblems, zeroSubjectProblem,
  zeroSuiteProblem,
} from './check-suites.ts';
import { PARTITIONS } from '../../lib/arena/layer-trees.ts';
import type { Layer } from '../../lib/arena/behaviour-obligations.ts';

const BOTH = new Map<Layer, ReadonlySet<string>>([
  ['compose', new Set(['ArenaScale', 'ArenaButton'])],
  ['swiftui', new Set(['ArenaScale', 'ArenaButton'])],
]);

test('OUTSIDE names every partition that carries no subject, and only those', () => {
  expect(staleOutsideProblems()).toEqual([]);
  const owed = PARTITIONS.filter((one) => !SUBJECT_PARTITIONS.includes(one));
  expect([...OUTSIDE.keys()].sort()).toEqual([...owed].sort());
  expect(OUTSIDE.get('api')).toContain('assert the emitter twice');
  expect(OUTSIDE.get('theme')).toContain('UI test harness');
});

test('a partition added and never decided about is a failure rather than a silence', () => {
  const short = new Map(OUTSIDE);
  short.delete('theme');
  expect(staleOutsideProblems(short)).toHaveLength(1);
  expect(staleOutsideProblems(short)[0]).toContain('nobody decided');
  expect(staleOutsideProblems(OUTSIDE, ['components', 'tokens', 'theme'])).toHaveLength(1);
  expect(staleOutsideProblems(OUTSIDE, ['components', 'tokens', 'theme'])[0]).toContain('both');
});

test('COVERED_ELSEWHERE carries a file per entry and a reason per entry', () => {
  expect([...COVERED_ELSEWHERE.keys()]).toEqual(['ArenaScale:compose', 'ArenaScale:swiftui']);
  for (const entry of COVERED_ELSEWHERE.values()) {
    expect(entry.by.length).toBeGreaterThan(0);
    expect(entry.why.length).toBeGreaterThan(0);
  }
});

test('a suite says what it covers by its own suffix, per layer', () => {
  expect(subjectOfSuite('ArenaDensityTest.kt', 'compose')).toBe('ArenaDensity');
  expect(subjectOfSuite('ArenaDensityTests.swift', 'swiftui')).toBe('ArenaDensity');
  expect(subjectOfSuite('ArenaDensity.kt', 'compose')).toBeNull();
});

test('a suite whose stem carries no suffix is named rather than skipped', () => {
  expect(namingProblems('compose', ['ArenaDensityTest.kt'])).toEqual([]);
  const problems = namingProblems('compose', ['Helpers.kt']);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('reads as uncovered');
});

test('a subject with no suite and no entry is what this gate exists to report', () => {
  expect(coverageProblems(BOTH, BOTH, COVERED_ELSEWHERE)).toEqual([]);
  const missing = new Map<Layer, ReadonlySet<string>>([
    ['compose', new Set(['ArenaButton'])],
    ['swiftui', new Set()],
  ]);
  const problems = coverageProblems(BOTH, missing, new Map());
  expect(problems).toHaveLength(3);
  expect(problems.some((one) => one.includes(keyFor('ArenaScale', 'swiftui')))).toBe(true);
});

test('an entry covers a subject that would otherwise be reported', () => {
  const missing = new Map<Layer, ReadonlySet<string>>([['compose', new Set()], ['swiftui', new Set()]]);
  const covered = new Map([
    ['ArenaScale:compose', { by: 'anywhere.kt', why: 'because' }],
    ['ArenaScale:swiftui', { by: 'anywhere.swift', why: 'because' }],
  ]);
  const problems = coverageProblems(BOTH, missing, covered);
  expect(problems.every((one) => one.includes('ArenaButton'))).toBe(true);
});

test('a suite on one layer with no counterpart is the invisible half', () => {
  expect(symmetryProblems(BOTH)).toEqual([]);
  const lopsided = new Map<Layer, ReadonlySet<string>>([
    ['compose', new Set(['ArenaDensity'])],
    ['swiftui', new Set()],
  ]);
  expect(symmetryProblems(lopsided)).toHaveLength(1);
  expect(symmetryProblems(lopsided)[0]).toContain('ArenaDensity');
});

test('an entry goes stale three ways, and each one fails', () => {
  const none = new Map<Layer, ReadonlySet<string>>([['compose', new Set()], ['swiftui', new Set()]]);
  const covered = new Map([['ArenaScale:compose', { by: 'anywhere.kt', why: 'because' }]]);
  expect(staleCoverProblems(new Set(['ArenaScale']), none, () => true, covered)).toEqual([]);

  expect(staleCoverProblems(new Set(), none, () => true, covered)[0]).toContain('carries a subject by that name');
  expect(staleCoverProblems(new Set(['ArenaScale']), none, () => false, covered)[0]).toContain('not in the tree');

  const owned = new Map<Layer, ReadonlySet<string>>([['compose', new Set(['ArenaScale'])], ['swiftui', new Set()]]);
  expect(staleCoverProblems(new Set(['ArenaScale']), owned, () => true, covered)[0]).toContain('outlived');

  const wrong = new Map([['ArenaScale:android', { by: 'anywhere.kt', why: 'because' }]]);
  expect(staleCoverProblems(new Set(['ArenaScale']), none, () => true, wrong)[0]).toContain('names neither layer');
});

test('an empty walk on either side is a claim and not a pass', () => {
  expect(zeroSubjectProblem(0)).not.toBeNull();
  expect(zeroSubjectProblem(1)).toBeNull();
  expect(zeroSuiteProblem(0)).not.toBeNull();
  expect(zeroSuiteProblem(1)).toBeNull();
});
