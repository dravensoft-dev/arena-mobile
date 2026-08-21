import { test, expect } from 'bun:test';
import {
  CONTRIBUTING, OUTWARD, POLICY, configProblems, missingProblems, policyProblems,
  securityProblems, templateProblems, zeroScanProblem,
} from './check-community.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';

test('every outward-facing file is named with the reason it exists', () => {
  expect(missingProblems(repoRoot)).toEqual([]);
  for (const [, why] of OUTWARD) expect(why.length).toBeGreaterThan(20);
  expect(missingProblems('/nowhere')).toHaveLength(OUTWARD.size);
});

test('the policy is stated once, and a second home is what the gate exists to refuse', () => {
  const read = (rel: string) => (rel === CONTRIBUTING ? `arena-mobile ${POLICY}.` : 'nothing');
  expect(policyProblems([CONTRIBUTING, 'README.md'], read)).toEqual([]);
  expect(policyProblems(['README.md'], () => 'nothing')[0]).toContain('is not written down');
  expect(policyProblems([CONTRIBUTING, 'README.md'], () => `x ${POLICY} y`)[0]).toContain('goes stale in the other');
});

test('a template routes to the policy rather than restating it', () => {
  expect(templateProblems(`see ${CONTRIBUTING}`)).toEqual([]);
  expect(templateProblems('we take external pull requests')[0]).toContain('restates the policy');
});

test('the security page names the private route, because a public issue is world-readable', () => {
  expect(securityProblems('Use GitHub private vulnerability reporting.')).toEqual([]);
  expect(securityProblems('Email us.')[0]).toContain('world-readable');
});

test('a blank issue is off, so a report cannot arrive with none of the fields a template asks for', () => {
  expect(configProblems('blank_issues_enabled: false\n')).toEqual([]);
  expect(configProblems('blank_issues_enabled: true\n')[0]).toContain('none of the fields');
});

test('scanning nothing is a failure, not a tree where the policy is stated once', () => {
  expect(zeroScanProblem([])).toContain('0 documents');
  expect(zeroScanProblem(['a.md'])).toBeNull();
});
