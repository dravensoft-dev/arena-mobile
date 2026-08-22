/* The runner. It runs every gate unconditionally, so one sweep reports every problem rather
 * than the first, and it reports a skip as a skip: exit 2 is a gate that could not run here,
 * and a run carrying one is INCOMPLETE rather than green. That distinction is the whole reason
 * this repository declares itself not strict; CI sets CI=true, cannotRun turns the 2 into a 1,
 * and the same absence that is a skip on a laptop is a failure in a workflow. */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { isStrict, SKIP_EXIT_CODE } from '../../lib/arena/check-vars.ts';

export type Gate = { name: string; script: string };

export const DOMAINS = ['contracts', 'arena', 'compose', 'swiftui'] as const;
export type Domain = (typeof DOMAINS)[number];

export const GATES: Gate[] = [
  { name: 'check:pin', script: 'scripts/check/contracts/check-pin.ts' },
  { name: 'check:catalogue', script: 'scripts/check/contracts/check-catalogue.ts' },
  { name: 'check:user-scale', script: 'scripts/check/contracts/check-user-scale.ts' },
  { name: 'check:emit', script: 'scripts/check/arena/check-emit.ts' },
  { name: 'check:coverage', script: 'scripts/check/arena/check-coverage.ts' },
  { name: 'check:api-types', script: 'scripts/check/arena/check-api-types.ts' },
  { name: 'check:behaviour', script: 'scripts/check/arena/check-behaviour.ts' },
  { name: 'check:collisions', script: 'scripts/check/arena/check-collisions.ts' },
  { name: 'check:literals', script: 'scripts/check/arena/check-literals.ts' },
  { name: 'check:composition', script: 'scripts/check/arena/check-composition.ts' },
  { name: 'check:doc-comments', script: 'scripts/check/arena/check-doc-comments.ts' },
  { name: 'check:docs', script: 'scripts/check/arena/check-docs.ts' },
  { name: 'check:citations', script: 'scripts/check/arena/check-citations.ts' },
  { name: 'check:generated', script: 'scripts/check/arena/check-generated.ts' },
  { name: 'check:community', script: 'scripts/check/arena/check-community.ts' },
  { name: 'check:agents', script: 'scripts/check/arena/check-agents.ts' },
  { name: 'check:deadlines', script: 'scripts/check/arena/check-deadlines.ts' },
  { name: 'check:graph', script: 'scripts/check/arena/check-graph.ts' },
  { name: 'check:portability', script: 'scripts/check/arena/check-portability.ts' },
  { name: 'check:kotlin', script: 'scripts/check/compose/check-kotlin.ts' },
  { name: 'check:swift', script: 'scripts/check/swiftui/check-swift.ts' },
];

export function domainOf(gate: Gate): Domain | null {
  const found = DOMAINS.find((domain) => gate.script.startsWith(`scripts/check/${domain}/`));
  return found ?? null;
}

export function domainProblems(gates = GATES) {
  return gates
    .filter((gate) => domainOf(gate) === null)
    .map((gate) => `${gate.name} sits at ${gate.script}, which names none of the four domains, so no job partition reaches it`);
}

export function countsByDomain(gates = GATES) {
  return new Map(DOMAINS.map((domain) => [domain, gates.filter((gate) => domainOf(gate) === domain).length]));
}

export function selected(gates: Gate[], domain: string | null) {
  return domain === null ? gates : gates.filter((gate) => domainOf(gate) === domain);
}

export function domainArgument(argv: readonly string[]) {
  const found = argv.find((one) => one.startsWith('--domain='));
  return found ? found.slice('--domain='.length) : null;
}

export type Verdict = 'PASS' | 'FAIL' | 'SKIP';

export function verdictFor(status: number): Verdict {
  if (status === 0) return 'PASS';
  if (status === SKIP_EXIT_CODE) return 'SKIP';
  return 'FAIL';
}

export function summaryLine(results: { verdict: Verdict }[]) {
  const failed = results.filter((one) => one.verdict === 'FAIL').length;
  const skipped = results.filter((one) => one.verdict === 'SKIP').length;
  if (failed > 0) {
    return `check-all: ${failed} of ${results.length} step(s) failed, and ${skipped} could not run here`;
  }
  if (skipped > 0) {
    return `check-all: INCOMPLETE. ${results.length - skipped} of ${results.length} step(s) passed and ${skipped} could not run on this host, so this run proves less than a green one`;
  }
  return `check-all: all ${results.length} step(s) passed`;
}

function main() {
  const domain = domainArgument(process.argv.slice(2));
  const bad = domainProblems();
  if (bad.length) {
    console.error(`check-all: ${bad.length} gate(s) outside the domain grid\n`);
    for (const problem of bad) console.error(`  ${problem}`);
    process.exit(1);
  }
  if (domain !== null && !(DOMAINS as readonly string[]).includes(domain)) {
    console.error(`check-all: --domain=${domain} names none of ${DOMAINS.join(', ')}`);
    process.exit(1);
  }

  const running = selected(GATES, domain);
  const results = running.map((gate) => {
    const child = spawnSync(process.execPath, [join(root, gate.script)], { cwd: root, stdio: 'inherit' });
    const verdict = verdictFor(child.status ?? 1);
    console.log(`  ${verdict.padEnd(5)} ${gate.name}`);
    return { gate, verdict };
  });

  console.log('');
  console.log(summaryLine(results));
  if (results.some((one) => one.verdict === 'FAIL')) process.exit(1);
  if (results.some((one) => one.verdict === 'SKIP') && isStrict()) process.exit(1);
}

if (isMainModule(import.meta.url)) main();
