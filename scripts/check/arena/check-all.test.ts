import { test, expect } from 'bun:test';
import { GATES, DOMAINS, TEST_STEP, countsByDomain, domainOf, domainProblems, selected, summaryLine, unknownArguments, verdictFor, wantsTests } from './check-all.ts';
import type { Domain } from './check-all.ts';

test('GATES is asserted by literal value, so the array and this case move in one commit', () => {
  expect(GATES.map((gate) => gate.name)).toEqual([
    'check:pin',
    'check:catalogue',
    'check:user-scale',
    'check:emit',
    'check:coverage',
    'check:api-types',
    'check:behaviour',
    'check:collisions',
    'check:literals',
    'check:members',
    'check:composition',
    'check:fonts',
    'check:environment',
    'check:contrast',
    'check:control',
    'check:motion',
    'check:structure',
    'check:seams',
    'check:suites',
    'check:affordances',
    'check:doc-comments',
    'check:docs',
    'check:citations',
    'check:generated',
    'check:community',
    'check:workflow',
    'check:agents',
    'check:deadlines',
    'check:graph',
    'check:portability',
    'check:script-types',
    'check:kotlin',
    'check:swift',
  ]);
});

test('the table in scripts/check/AGENTS.md is these numbers', () => {
  const counts = countsByDomain();
  expect(counts.get('contracts')).toBe(3);
  expect(counts.get('arena')).toBe(28);
  expect(counts.get('compose')).toBe(1);
  expect(counts.get('swiftui')).toBe(1);
  expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(GATES.length);
});

test('every gate names a domain, so the job partition reaches all of them', () => {
  expect(domainProblems()).toEqual([]);
  for (const gate of GATES) {
    const domain = domainOf(gate);
    expect(domain).not.toBeNull();
    expect(DOMAINS).toContain(domain as Domain);
  }
});

test('the last two gates are the native ones, so a new gate is inserted rather than appended', () => {
  expect(GATES.slice(-2).map((gate) => gate.name)).toEqual(['check:kotlin', 'check:swift']);
});

test('narrowing by domain narrows the run and every gate stays in exactly one', () => {
  const partition = DOMAINS.flatMap((domain) => selected(GATES, domain));
  expect(partition).toHaveLength(GATES.length);
  expect(selected(GATES, null)).toHaveLength(GATES.length);
});

test('exit 2 is a skip and never a pass', () => {
  expect(verdictFor(0)).toBe('PASS');
  expect(verdictFor(2)).toBe('SKIP');
  expect(verdictFor(1)).toBe('FAIL');
});

test('a run carrying a skip says INCOMPLETE rather than collapsing the count', () => {
  const line = summaryLine([{ verdict: 'PASS' }, { verdict: 'SKIP' }]);
  expect(line).toContain('INCOMPLETE');
  expect(line).toContain('2');
  expect(summaryLine([{ verdict: 'PASS' }])).not.toContain('INCOMPLETE');
  expect(summaryLine([{ verdict: 'FAIL' }])).toContain('failed');
});

test('a full sweep runs the suites, and a narrowed one leaves them to the job that owns them', () => {
  expect(wantsTests([])).toBe(true);
  expect(wantsTests(['--domain=arena'])).toBe(false);
  expect(wantsTests(['--no-tests'])).toBe(false);
  expect(wantsTests(['--domain=arena', '--no-tests'])).toBe(false);
});

test('the suite runner is spawned by path and is not a gate, so it names no domain', () => {
  expect(TEST_STEP.name).toBe('test');
  expect(TEST_STEP.script).toBe('scripts/ci/arena/run-suite.ts');
  expect(GATES.some((gate) => gate.script === TEST_STEP.script)).toBe(false);
  expect(domainOf(TEST_STEP)).toBeNull();
});

test('an argument nobody recognises fails, because --no-test silently ignored runs the tests', () => {
  expect(unknownArguments(['--domain=arena', '--no-tests'])).toEqual([]);
  expect(unknownArguments(['--no-test'])).toHaveLength(1);
  expect(unknownArguments(['--no-test'])[0]).toContain('--no-test');
});
