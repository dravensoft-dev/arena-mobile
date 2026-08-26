import { test, expect } from 'bun:test';
import {
  HELD_BY, HELD_HERE, KOTLIN_CONSTANT, SWIFT_CONSTANT, constantProblems, constantsIn, normalised,
  parityProblems, partitionProblems, staleHeldByProblems, staleHeldHereProblems, zeroConstantProblem,
  zeroSubjectProblem,
} from './check-seams.ts';
import { GATES } from './check-all.ts';
import type { Layer } from '../../lib/arena/behaviour-obligations.ts';

const CARRIED = new Set([...HELD_BY.keys(), ...HELD_HERE.keys()]);

test('the two maps partition the value tier and share no subject', () => {
  for (const subject of HELD_BY.keys()) expect(HELD_HERE.has(subject)).toBe(false);
  expect(partitionProblems(CARRIED)).toEqual([]);
});

test('a seam in neither map is the silence this gate exists to end', () => {
  const problems = partitionProblems(new Set([...CARRIED, 'ArenaGhost']));
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('ArenaGhost');
});

test('a seam in both maps is the partition going soft', () => {
  const gated = new Map([['ArenaScale', { gate: 'check:contrast', why: 'invented for this case' }]]);
  const problems = partitionProblems(new Set(['ArenaScale']), gated, HELD_HERE);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('held by a gate or held here');
});

test('every gate HELD_BY names is one GATES registers', () => {
  expect(staleHeldByProblems(CARRIED)).toEqual([]);
  const registered = new Set(GATES.map((gate) => gate.name));
  for (const held of HELD_BY.values()) expect(registered.has(held.gate)).toBe(true);
});

test('a seam handed to a gate no sweep runs is a claim made by nobody', () => {
  const problems = staleHeldByProblems(CARRIED, [{ name: 'check:pin' }]);
  expect(problems.length).toBe(HELD_BY.size);
  expect(problems[0]).toContain('GATES does not register');
});

test('an entry for a file that is gone holds nothing', () => {
  expect(staleHeldByProblems(new Set())).toHaveLength(HELD_BY.size);
  expect(staleHeldHereProblems(new Set())).toHaveLength(HELD_HERE.size);
  expect(staleHeldHereProblems(CARRIED)).toEqual([]);
});

test('a seam one layer carries alone offers a consumer two libraries', () => {
  const both = new Map<Layer, ReadonlySet<string>>([
    ['compose', new Set(['ArenaScale'])],
    ['swiftui', new Set(['ArenaScale'])],
  ]);
  expect(parityProblems(both)).toEqual([]);
  const lopsided = new Map<Layer, ReadonlySet<string>>([
    ['compose', new Set(['ArenaScale', 'ArenaGhost'])],
    ['swiftui', new Set(['ArenaScale'])],
  ]);
  expect(parityProblems(lopsided)).toHaveLength(1);
  expect(parityProblems(lopsided)[0]).toContain('ArenaGhost');
});

test('a constant is read by the name each language spells it with', () => {
  expect(normalised('CAP')).toBe('cap');
  expect(normalised('cap')).toBe('cap');
  expect(normalised('MAX_STEPS')).toBe('maxsteps');
});

test('each pattern reads its own language and skips a token read off the emit', () => {
  const kotlin = constantsIn('    public const val CAP: Float = 2f', KOTLIN_CONSTANT);
  expect(kotlin.get('cap')).toEqual({ spelling: 'CAP', value: 2 });
  const swift = constantsIn('    public static let cap: CGFloat = 2', SWIFT_CONSTANT);
  expect(swift.get('cap')).toEqual({ spelling: 'cap', value: 2 });
  expect(constantsIn('    public static let padding: CGFloat = ArenaTokens.sp3', SWIFT_CONSTANT).size).toBe(0);
  expect(constantsIn('    public val padding: Dp = ArenaTokens.sp3', KOTLIN_CONSTANT).size).toBe(0);
});

test('a constant on one layer alone, and one with two values, are both reported', () => {
  const equal = new Map<Layer, ReadonlyMap<string, { spelling: string; value: number }>>([
    ['compose', new Map([['cap', { spelling: 'CAP', value: 2 }]])],
    ['swiftui', new Map([['cap', { spelling: 'cap', value: 2 }]])],
  ]);
  expect(constantProblems(equal)).toEqual([]);

  const apart = new Map<Layer, ReadonlyMap<string, { spelling: string; value: number }>>([
    ['compose', new Map([['cap', { spelling: 'CAP', value: 2 }]])],
    ['swiftui', new Map([['cap', { spelling: 'cap', value: 3 }]])],
  ]);
  expect(constantProblems(apart)).toHaveLength(1);
  expect(constantProblems(apart)[0]).toContain('two libraries from one contract');

  const alone = new Map<Layer, ReadonlyMap<string, { spelling: string; value: number }>>([
    ['compose', new Map([['cap', { spelling: 'CAP', value: 2 }]])],
    ['swiftui', new Map()],
  ]);
  expect(constantProblems(alone)).toHaveLength(1);
  const other = new Map<Layer, ReadonlyMap<string, { spelling: string; value: number }>>([
    ['compose', new Map()],
    ['swiftui', new Map([['cap', { spelling: 'cap', value: 2 }]])],
  ]);
  expect(constantProblems(other)).toHaveLength(1);
});

test('an empty walk and an empty comparison are each a claim', () => {
  expect(zeroSubjectProblem(0)).not.toBeNull();
  expect(zeroSubjectProblem(1)).toBeNull();
  expect(zeroConstantProblem(0)).not.toBeNull();
  expect(zeroConstantProblem(1)).toBeNull();
});
