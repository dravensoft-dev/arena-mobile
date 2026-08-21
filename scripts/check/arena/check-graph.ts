/* Every script under a phase that declares steps declares one, or is named in a list with the
 * reason it does not; every declared edge meets in both directions; no artifact has two
 * writers; and no gate declares writes. An edge is declared downstream only, so a producer
 * naming what it feeds is the whole subscription and everything reading the other direction
 * derives it. A feeds entry no artifact carries is the same defect read backwards. */

import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { allNodes, collectedScripts, NEVER_SUBSCRIBES, NOT_YET_SUBSCRIBED, staleExclusionProblems } from '../../graph/nodes.ts';
import { duplicateWriters, subscriptionProblems, topoOrder } from '../../graph/graph.ts';

export function undeclaredProblems(scripts: readonly string[], declared: Set<string>) {
  return scripts
    .filter((file) => !declared.has(file))
    .filter((file) => !NEVER_SUBSCRIBES.has(file) && !NOT_YET_SUBSCRIBED.has(file))
    .map((file) => `${file} sits under a phase that declares steps and exports no node, and neither list says why not`);
}

export function cycleProblems(unresolved: readonly string[]) {
  return unresolved.length === 0
    ? []
    : [`${sortedByCodeUnit([...unresolved]).join(', ')} sit in a cycle, so no order exists and the build has nothing to derive`];
}

export function zeroNodeProblem(counted: number) {
  if (counted > 0) return null;
  return 'collected 0 nodes, so every edge below holds over an empty graph';
}

async function main() {
  const scripts = collectedScripts(root);
  const collected = await allNodes(root);
  const declared = collected.map(({ node: one }) => one);
  const { unresolved } = topoOrder(declared);
  const zero = zeroNodeProblem(collected.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...undeclaredProblems(scripts, new Set(collected.map(({ file }) => file))),
    ...subscriptionProblems(declared),
    ...duplicateWriters(declared),
    ...cycleProblems(unresolved),
    ...staleExclusionProblems(scripts),
  ];
  if (errs.length) {
    console.error(`check-graph: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const edges = declared.reduce((total, one) => total + one.feeds.length, 0);
  console.log(
    `check-graph: ${collected.length} declared node(s) over ${scripts.length} collected script(s), ${edges} edge(s) `
    + `meeting in both directions, and ${NEVER_SUBSCRIBES.size + NOT_YET_SUBSCRIBED.size} exclusion(s) with a reason`,
  );
}

if (isMainModule(import.meta.url)) await main();
