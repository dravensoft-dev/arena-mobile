/* Runs the suites under scripts/, which are the ones that cover a gate's pure functions and
 * its reason-carrying maps by name. The native suites are not here: they run inside Gradle and
 * inside xcodebuild, so check:kotlin and check:swift are what report them, and a runner that
 * tried to own all three would report a green it had no way to earn on a host with neither. */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export const SUITES = ['scripts'];

export function suiteFiles(root_: string, tree: string) {
  return sortedByCodeUnit(walkFiles(join(root_, tree), (rel) => rel.endsWith('.test.ts'))
    .map((rel) => `${tree}/${rel}`));
}

export function zeroSuiteProblem(counted: number) {
  if (counted > 0) return null;
  return 'found 0 suites, and a runner that reports a green over no test at all is the loudest vacuous pass in the tree';
}

function main() {
  const files = SUITES.flatMap((tree) => suiteFiles(root, tree));
  const zero = zeroSuiteProblem(files.length);
  if (zero) {
    console.error(`run-suite: ${zero}`);
    process.exit(1);
  }
  const child = spawnSync(process.execPath, ['test', ...files], { cwd: root, stdio: 'inherit' });
  if (child.status !== 0) process.exit(child.status ?? 1);
  console.log(`run-suite: ${files.length} suite(s) under ${SUITES.join(', ')}`);
}

if (isMainModule(import.meta.url)) main();
