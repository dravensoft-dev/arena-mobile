import { test, expect } from 'bun:test';
import { GATES, DOMAINS, countsByDomain, domainOf, domainProblems, selected, summaryLine, verdictFor } from './check-all.ts';

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
    'check:composition',
    'check:fonts',
    'check:doc-comments',
    'check:docs',
    'check:citations',
    'check:generated',
    'check:community',
    'check:agents',
    'check:deadlines',
    'check:graph',
    'check:portability',
    'check:kotlin',
    'check:swift',
  ]);
});

test('the table in scripts/check/AGENTS.md is these numbers', () => {
  const counts = countsByDomain();
  expect(counts.get('contracts')).toBe(3);
  expect(counts.get('arena')).toBe(17);
  expect(counts.get('compose')).toBe(1);
  expect(counts.get('swiftui')).toBe(1);
  expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(GATES.length);
});

test('every gate names a domain, so the job partition reaches all of them', () => {
  expect(domainProblems()).toEqual([]);
  for (const gate of GATES) expect(DOMAINS).toContain(domainOf(gate));
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
