/* Runs every generator in the order the graph derives, so the order is a consequence of what
 * each step declares rather than a list kept in step by hand. It runs the generators only: a
 * gate declares no writes, so nothing downstream of a build depends on one having run, and
 * `bun run check` is the separate sweep. There is no fingerprint cache here yet and
 * graph/AGENTS.md says why, so --force is accepted and changes nothing. */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { isMainModule } from '../utils/main-module.ts';
import { repoRoot } from '../lib/arena/repo-root.ts';
import { allNodes } from './nodes.ts';
import { duplicateWriters, subscriptionProblems, topoOrder } from './graph.ts';

export function generators(nodes: Awaited<ReturnType<typeof allNodes>>) {
  return nodes.filter(({ node }) => node.writes.length > 0);
}

async function main() {
  const collected = await allNodes();
  const declared = collected.map(({ node }) => node);
  const problems = [...subscriptionProblems(declared), ...duplicateWriters(declared)];
  if (problems.length) {
    console.error(`run-build: ${problems.length} problem(s) in the declared graph, so no order can be derived\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  const { order, unresolved } = topoOrder(declared);
  if (unresolved.length) {
    console.error(`run-build: ${unresolved.join(', ')} sit in a cycle, so no order exists`);
    process.exit(1);
  }

  const running = order.filter((node) => node.writes.length > 0);
  const byName = new Map(collected.map(({ file, node }) => [node.name, file]));
  for (const node of running) {
    const file = byName.get(node.name);
    if (!file) continue;
    console.log(`run-build: ${node.name}`);
    const child = spawnSync(process.execPath, [join(repoRoot, file)], { cwd: repoRoot, stdio: 'inherit' });
    if (child.status !== 0) {
      console.error(`run-build: ${node.name} exited ${child.status}, so every step downstream of it is not run`);
      process.exit(child.status ?? 1);
    }
  }
  console.log(`run-build: ${running.length} generator(s) run, in the order ${declared.length} declared node(s) derive`);
}

if (isMainModule(import.meta.url)) await main();
