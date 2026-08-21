/* The set of steps, collected by importing every script under the two phases that declare one
 * and keeping what exports a node. Importing rather than reading the text is what lets a
 * declaration reuse the constants the script already has: a target list written twice drifts
 * the first time one of them gains an entry. NEVER_SUBSCRIBES says what is out and why. */

import { join } from 'node:path';
import { walkFiles } from '../utils/walk-files.ts';
import { sortedByCodeUnit } from '../utils/compare.ts';
import { repoRoot } from '../lib/arena/repo-root.ts';

export type Node = { name: string; reads: string[]; writes: string[]; feeds: string[] };

export const PHASES = ['generate', 'check'];

export const NEVER_SUBSCRIBES = new Map<string, string>([
  [
    'scripts/check/arena/check-all.ts',
    'the runner rather than a step: collecting it would have it import itself while it is importing everything else',
  ],
  [
    'scripts/check/arena/check-graph.ts',
    'nothing in it is imported at all, because collecting it would have it import itself while its own main is running, and a top-level await on a module already being evaluated never resolves',
  ],
  [
    'scripts/check/arena/check-release.ts',
    'run by path and never from GATES, because between releases the tag for the current version does not exist and a node for it would redden every push that is not a release',
  ],
]);

export const NOT_YET_SUBSCRIBED = new Map<string, string>([]);

export function collectedScripts(root = repoRoot) {
  return sortedByCodeUnit(PHASES.flatMap((phase) => walkFiles(
    join(root, 'scripts', phase),
    (rel) => rel.endsWith('.ts') && !rel.endsWith('.test.ts'),
  ).map((rel) => `scripts/${phase}/${rel}`)));
}

export function staleExclusionProblems(present: readonly string[]) {
  const found = new Set(present);
  return [...NEVER_SUBSCRIBES, ...NOT_YET_SUBSCRIBED].flatMap(([file, why]) => (found.has(file)
    ? []
    : [`${file} is excluded from the graph and is not in the tree: ${why}`]));
}

export async function allNodes(root = repoRoot) {
  const found: { file: string; node: Node }[] = [];
  for (const file of collectedScripts(root)) {
    if (NEVER_SUBSCRIBES.has(file) || NOT_YET_SUBSCRIBED.has(file)) continue;
    const module = await import(join(root, file)) as { node?: Node };
    if (module.node) found.push({ file, node: module.node });
  }
  return found;
}
