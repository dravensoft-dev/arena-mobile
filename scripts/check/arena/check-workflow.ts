/* The first gate here that reads .yml. Four claims about what a runner is told to do: a bun run
 * name is a script package.json declares, a script run by path is in the tree, a --domain=
 * names one of the four, and every job a workflow declares is in the needs of that workflow's
 * gate job. The gate job is the one carrying if: always(), because a job a routing decision can
 * skip reports success to branch protection and its result stands for nothing. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import {
  PACKAGE_MANIFEST, runScriptNames, scriptNames, undeclaredScriptProblems, zeroScriptProblem,
} from '../../lib/arena/package-scripts.ts';
import { DOMAINS } from './check-all.ts';

export const WORKFLOWS = '.github/workflows';
export const GATE_CONDITION = 'always()';

export const SCRIPT_PATH = /\bbun\s+([A-Za-z0-9_./-]+\.ts)\b/g;
export const DOMAIN_ARGUMENT = /--domain=([A-Za-z0-9-]+)/g;

export const NO_GATE = new Map<string, string>([
  [
    'maven-publish.yml',
    'it runs on workflow_run after the main workflow reports success, which is an event branch protection cannot require, and it declares the one job that publishes. A gate job here would wait on that job alone and require nothing of it',
  ],
  [
    'release.yml',
    'it runs on workflow_run after the main workflow reports success and declares the one job that writes the release page. It guards nothing, because the tag is already pushed by the time it starts',
  ],
]);

export const node = {
  name: 'check:workflow',
  reads: [`${WORKFLOWS}/*.yml`, PACKAGE_MANIFEST],
  writes: [],
  feeds: [],
};

export type Job = { name: string; needs: string[]; gate: boolean; runs: string[] };

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function names(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  return Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string') : [];
}

export function workflows(root_: string) {
  return sortedByCodeUnit(walkFiles(join(root_, WORKFLOWS), (rel) => rel.endsWith('.yml')));
}

export function jobsOf(yaml: string): Job[] {
  const parsed = record(Bun.YAML.parse(yaml));
  return Object.entries(record(parsed.jobs)).map(([name, raw]) => {
    const job = record(raw);
    const steps = Array.isArray(job.steps) ? job.steps : [];
    return {
      name,
      needs: names(job.needs),
      gate: typeof job.if === 'string' && job.if.trim() === GATE_CONDITION,
      runs: steps.map((step) => record(step).run).filter((one): one is string => typeof one === 'string'),
    };
  });
}

export function scriptProblems(rel: string, jobs: readonly Job[], declared: ReadonlySet<string>) {
  return sortedByCodeUnit(jobs.flatMap((job) => job.runs.flatMap((run) => undeclaredScriptProblems(
    `${WORKFLOWS}/${rel} job ${job.name}`,
    runScriptNames(run),
    declared,
  ))));
}

export function pathProblems(rel: string, jobs: readonly Job[], present: (path: string) => boolean) {
  return sortedByCodeUnit(jobs.flatMap((job) => job.runs.flatMap((run) => [...run.matchAll(SCRIPT_PATH)]
    .map((match) => captured(match))
    .filter((path) => !present(path))
    .map((path) => `${WORKFLOWS}/${rel} job ${job.name} runs ${path} by path, and that file is not in the tree`))));
}

export function domainArgumentProblems(rel: string, jobs: readonly Job[], domains: readonly string[]) {
  return sortedByCodeUnit(jobs.flatMap((job) => job.runs.flatMap((run) => [...run.matchAll(DOMAIN_ARGUMENT)]
    .map((match) => captured(match))
    .filter((domain) => !domains.includes(domain))
    .map((domain) => `${WORKFLOWS}/${rel} job ${job.name} narrows by --domain=${domain}, which names none of ${domains.join(', ')}, so the runner refuses it`))));
}

export function gateProblems(rel: string, jobs: readonly Job[]) {
  const gates = jobs.filter((job) => job.gate);
  if (gates.length > 1) {
    return [`${WORKFLOWS}/${rel} declares more than one job carrying if: ${GATE_CONDITION}, and two gates that can disagree leave no single result standing for the run`];
  }
  const [gate] = gates;
  if (gate === undefined) {
    return NO_GATE.has(rel)
      ? []
      : [`${WORKFLOWS}/${rel} declares no job carrying if: ${GATE_CONDITION}, so nothing in it waits on every other job and a job added here runs while branch protection requires nobody`];
  }
  const listed = new Set(gate.needs);
  return sortedByCodeUnit(jobs
    .filter((job) => job.name !== gate.name && !listed.has(job.name))
    .map((job) => `${WORKFLOWS}/${rel} declares ${job.name} and ${gate.name} does not need it, so that job runs and is not required`));
}

export function staleNoGateProblems(byWorkflow: ReadonlyMap<string, Job[]>) {
  return sortedByCodeUnit([...NO_GATE].flatMap(([rel, why]) => {
    const jobs = byWorkflow.get(rel);
    if (jobs === undefined) {
      return [`NO_GATE excuses ${WORKFLOWS}/${rel}, which is not in the tree: ${why}`];
    }
    if (jobs.length > 1) {
      return [`NO_GATE excuses ${WORKFLOWS}/${rel} and it declares more than one job, so there is a fan-out for a gate job to wait on: ${why}`];
    }
    if (jobs.some((job) => job.gate)) {
      return [`NO_GATE excuses ${WORKFLOWS}/${rel} and it carries a job with if: ${GATE_CONDITION}: ${why}`];
    }
    return [];
  }));
}

export function zeroWorkflowProblem(counted: number) {
  if (counted > 0) return null;
  return `walked ${WORKFLOWS} and found no .yml at all, so every claim below holds over a directory this gate never opened`;
}

function main() {
  const found = workflows(root);
  const declared = scriptNames(root);
  const byWorkflow = new Map<string, Job[]>(found.map((rel) => [
    rel,
    jobsOf(readFileSync(join(root, WORKFLOWS, rel), 'utf8')),
  ]));
  const zero = zeroWorkflowProblem(found.length);
  const zeroScripts = zeroScriptProblem(declared);
  const errs = [
    ...(zero ? [zero] : []),
    ...(zeroScripts ? [zeroScripts] : []),
    ...found.flatMap((rel) => {
      const jobs = byWorkflow.get(rel) ?? [];
      return [
        ...scriptProblems(rel, jobs, declared),
        ...pathProblems(rel, jobs, (path) => existsSync(join(root, path))),
        ...domainArgumentProblems(rel, jobs, DOMAINS),
        ...gateProblems(rel, jobs),
      ];
    }),
    ...staleNoGateProblems(byWorkflow),
  ];
  if (errs.length) {
    console.error(`check-workflow: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  const jobs = [...byWorkflow.values()].flat();
  const runs = jobs.flatMap((job) => job.runs);
  console.log(
    `check-workflow: ${found.length} workflow(s) declaring ${jobs.length} job(s), `
    + `${runs.flatMap(runScriptNames).length} bun run name(s) ${PACKAGE_MANIFEST} declares, `
    + `${runs.flatMap((run) => [...run.matchAll(SCRIPT_PATH)]).length} script(s) run by a path in the tree, `
    + `${runs.flatMap((run) => [...run.matchAll(DOMAIN_ARGUMENT)]).length} --domain= argument(s) naming a domain, `
    + `and ${found.length - NO_GATE.size} gate job(s) needing every job beside them, `
    + `beside ${NO_GATE.size} workflow(s) carrying none with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
