import { test, expect } from 'bun:test';
import { SPANS_AS_DATA, WAIT_IMPLEMENTATIONS, bareSpanProblems, budgetProblems, staleMapProblems, zeroScanProblem } from './check-deadlines.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { BUDGET_SLACK, budgetFor, deadline, isDeadline } from '../../lib/arena/deadline.ts';

test('a deadline carries a name, a span that can expire, and the reason it is that size', () => {
  const one = deadline('a', 10, 'because');
  expect(isDeadline(one)).toBe(true);
  expect(() => deadline('', 10, 'because')).toThrow('the name is what an expiry reports');
  expect(() => deadline('a', 0, 'because')).toThrow('cannot expire detects no hang');
  expect(() => deadline('a', 10, '')).toThrow('gets copied rather than argued with');
});

test('a budget is derived from the deadlines it names and never written by hand', () => {
  expect(budgetFor(deadline('a', 10, 'x'), deadline('b', 20, 'y'))).toBe(30 * BUDGET_SLACK);
  expect(() => budgetFor()).toThrow('hand-written number wearing a call');
});

test('a bare span in a wait position is refused outside the files that own one', () => {
  expect(bareSpanProblems([{ file: 'scripts/x.ts', source: 'spawnSync(a, b, { timeout: 5000 })' }])[0])
    .toContain('deadline(name, ms, why)');
  expect(bareSpanProblems([{ file: 'scripts/x.ts', source: 'spawnSync(a, b, { timeout: SPAN.ms })' }])).toEqual([]);
  for (const [file] of WAIT_IMPLEMENTATIONS) {
    expect(bareSpanProblems([{ file, source: 'setTimeout(f, 5000)' }])).toEqual([]);
  }
});

test('a suite declaring a deadline derives a budget from it', () => {
  expect(budgetProblems([{ file: 'scripts/x.test.ts', source: "const D = deadline('a', 1, 'x');" }])[0])
    .toContain('abandoned with its child still running');
  expect(budgetProblems([{ file: 'scripts/x.test.ts', source: "const D = deadline('a', 1, 'x');\nconst B = budgetFor(D);" }]))
    .toEqual([]);
  expect(budgetProblems([{ file: 'scripts/x.test.ts', source: 'const B = budgetFor();' }])[0])
    .toContain('hand-written number wearing a call');
});

test('the suite that feeds this gate its fixtures is named in SPANS_AS_DATA, so the rule is tested and not only asserted', () => {
  expect(SPANS_AS_DATA.has('scripts/check/arena/check-deadlines.test.ts')).toBe(true);
});

test('both maps carry a reason per entry and fail when what they name is gone', () => {
  for (const [, why] of [...WAIT_IMPLEMENTATIONS, ...SPANS_AS_DATA]) expect(why.length).toBeGreaterThan(40);
  expect(staleMapProblems(new Set(WAIT_IMPLEMENTATIONS.keys()), repoRoot)).toEqual([]);
  expect(staleMapProblems(new Set(), repoRoot)[0]).toContain('WAIT_IMPLEMENTATIONS names');
});

test('scanning nothing is a failure and not a tree with no bare span in it', () => {
  expect(zeroScanProblem(0)).toContain('0 scripts');
  expect(zeroScanProblem(1)).toBeNull();
});
