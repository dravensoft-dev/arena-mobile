import { test, expect } from 'bun:test';
import { cycleProblems, undeclaredProblems, zeroNodeProblem } from './check-graph.ts';
import { NEVER_SUBSCRIBES, NOT_YET_SUBSCRIBED, collectedScripts, staleExclusionProblems } from '../../graph/nodes.ts';
import { duplicateWriters, needsOf, subscriptionProblems, topoOrder } from '../../graph/graph.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';

const node = (name: string, reads: string[], writes: string[], feeds: string[]) => ({ name, reads, writes, feeds });

test('NOT_YET_SUBSCRIBED is empty, and it stays that way', () => {
  expect(NOT_YET_SUBSCRIBED.size).toBe(0);
  for (const [, why] of NEVER_SUBSCRIBES) expect(why.length).toBeGreaterThan(40);
  expect(staleExclusionProblems(collectedScripts(repoRoot))).toEqual([]);
  expect(staleExclusionProblems([])).toHaveLength(NEVER_SUBSCRIBES.size);
});

test('an edge is declared downstream, and a missing one fails', () => {
  const meets = [node('a', [], ['x/y.kt'], ['b']), node('b', ['x/**'], [], [])];
  expect(subscriptionProblems(meets)).toEqual([]);
  const undeclared = [node('a', [], ['x/y.kt'], []), node('b', ['x/**'], [], [])];
  expect(subscriptionProblems(undeclared)[0]).toContain('does not list it in feeds');
});

test('an edge nobody maintains is the same defect read backwards', () => {
  const invented = [node('a', [], ['q/y.kt'], ['b']), node('b', ['x/**'], [], [])];
  expect(subscriptionProblems(invented)[0]).toContain('nothing it writes meets');
});

test('an exclusion in reads counts, so a gate that skips a directory declares no edge over it', () => {
  const skipped = [
    node('a', [], ['x/y.generated.kt'], []),
    node('b', ['x/**', '!x/**/*.generated.*'], [], []),
  ];
  expect(subscriptionProblems(skipped)).toEqual([]);
});

test('a gate that emits is refused, because a sweep then stops reporting every problem in one pass', () => {
  expect(subscriptionProblems([node('check:x', [], ['out.txt'], [])])[0]).toContain('A gate that emits');
});

test('two writers of one artifact means the order decides what it holds', () => {
  expect(duplicateWriters([node('a', [], ['x'], []), node('b', [], ['x'], [])])[0]).toContain('the order decides');
});

test('the order is derived and a cycle has none', () => {
  const chain = [node('b', ['x/**'], [], []), node('a', [], ['x/y'], ['b'])];
  expect(topoOrder(chain).order.map((one) => one.name)).toEqual(['a', 'b']);
  expect(needsOf(chain).get('b')).toEqual(new Set(['a']));
  const loop = [node('a', [], [], ['b']), node('b', [], [], ['a'])];
  expect(cycleProblems(topoOrder(loop).unresolved)[0]).toContain('sit in a cycle');
});

test('a script under a collected phase declares a node or says why not', () => {
  expect(undeclaredProblems(['scripts/check/arena/mystery.ts'], new Set())[0]).toContain('neither list says why not');
  expect(undeclaredProblems([...NEVER_SUBSCRIBES.keys()], new Set())).toEqual([]);
});

test('collecting nothing is a failure and not an empty graph with no bad edges', () => {
  expect(zeroNodeProblem(0)).toContain('0 nodes');
  expect(zeroNodeProblem(1)).toBeNull();
});
