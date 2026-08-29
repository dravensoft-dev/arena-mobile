import { test, expect } from 'bun:test';
import {
  GATE_CONDITION, NO_GATE, WORKFLOWS, domainArgumentProblems, gateProblems, jobsOf,
  pathProblems, scriptProblems, staleNoGateProblems, workflows, zeroWorkflowProblem,
} from './check-workflow.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { DOMAINS } from './check-all.ts';

const FANNED = `
name: sample
on:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: bun run build:release
  test-tooling:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: bun run check --domain=arena
      - run: bun scripts/ci/arena/run-suite.ts all
  sample-gate:
    if: always()
    needs: [build, test-tooling]
    runs-on: ubuntu-latest
    steps:
      - run: echo done
`;

test('NO_GATE excuses the two workflows that guard nothing, each with its reason', () => {
  expect([...NO_GATE.keys()]).toEqual(['maven-publish.yml', 'release.yml']);
  for (const why of NO_GATE.values()) expect(why).toContain('workflow_run');
});

test('a job is its needs, its condition and every run string its steps carry', () => {
  const jobs = jobsOf(FANNED);
  expect(jobs.map((job) => job.name)).toEqual(['build', 'test-tooling', 'sample-gate']);
  expect(jobs[1]?.needs).toEqual(['build']);
  expect(jobs[2]?.needs).toEqual(['build', 'test-tooling']);
  expect(jobs[2]?.gate).toBe(true);
  expect(jobs[0]?.gate).toBe(false);
  expect(jobs[1]?.runs).toHaveLength(2);
});

test('the gate job is the one carrying the condition no routing decision can skip', () => {
  expect(GATE_CONDITION).toBe('always()');
  expect(gateProblems('sample.yml', jobsOf(FANNED))).toEqual([]);
});

test('a job the gate job does not need runs and is required by nobody', () => {
  const jobs = jobsOf(FANNED.replace('needs: [build, test-tooling]', 'needs: [build]'));
  const errs = gateProblems('sample.yml', jobs);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('test-tooling');
  expect(errs[0]).toContain('sample-gate');
});

test('a workflow with no gate job and no excuse is reported, and one with two is as well', () => {
  const none = jobsOf(FANNED.replace('    if: always()\n', ''));
  expect(gateProblems('sample.yml', none)).toHaveLength(1);
  expect(gateProblems('release.yml', none)).toEqual([]);
  const two = jobsOf(FANNED.replace('  build:\n', '  build:\n    if: always()\n'));
  expect(gateProblems('sample.yml', two)[0]).toContain(GATE_CONDITION);
});

test('a bun run name a job types is a script the manifest declares', () => {
  expect(scriptProblems('sample.yml', jobsOf(FANNED), new Set(['build:release', 'check']))).toEqual([]);
  const errs = scriptProblems('sample.yml', jobsOf(FANNED), new Set(['check']));
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('build:release');
});

test('a script a job runs by path is in the tree, and bun -e is not a path', () => {
  expect(pathProblems('sample.yml', jobsOf(FANNED), () => true)).toEqual([]);
  const errs = pathProblems('sample.yml', jobsOf(FANNED), () => false);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('scripts/ci/arena/run-suite.ts');
  const inline = jobsOf(FANNED.replace('bun scripts/ci/arena/run-suite.ts all', 'bun -e "console.log(1)"'));
  expect(pathProblems('sample.yml', inline, () => false)).toEqual([]);
});

test('every --domain= a job types names one of the four', () => {
  expect(domainArgumentProblems('sample.yml', jobsOf(FANNED), DOMAINS)).toEqual([]);
  const wrong = jobsOf(FANNED.replace('--domain=arena', '--domain=android'));
  const errs = domainArgumentProblems('sample.yml', wrong, DOMAINS);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('android');
});

test('an excuse for a workflow that is gone, or that has grown a fan-out, is stale', () => {
  const present = new Map([...NO_GATE.keys()].map((rel) => [rel, jobsOf('jobs:\n  one:\n    steps: []\n')]));
  expect(staleNoGateProblems(present)).toEqual([]);
  expect(staleNoGateProblems(new Map())).toHaveLength(NO_GATE.size);
  const fanned = new Map([...present].map(([rel]) => [rel, jobsOf(FANNED)] as const));
  expect(staleNoGateProblems(fanned)).toHaveLength(NO_GATE.size);
});

test('the walk finds the workflows on disk, and finding none is a failure', () => {
  const found = workflows(repoRoot);
  expect(found.length).toBeGreaterThan(0);
  expect(found).toContain('pr.yml');
  expect(zeroWorkflowProblem(found.length)).toBeNull();
  expect(zeroWorkflowProblem(0)).toContain(WORKFLOWS);
});
