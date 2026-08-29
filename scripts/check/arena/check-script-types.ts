/* The tooling answers to a compiler, which nothing under scripts/ did before. Two claims, not
 * one: the project compiles, and its globs reach every source on disk, because a tsconfig
 * matching nothing compiles nothing and reports clean, which is the one way a typecheck gate
 * passes over a tree it never opened. Both sides are compared as repo-relative posix, since
 * tsc answers in forward slashes on every host and a walk answers in the host's own, and
 * comparing them raw calls every file unreached on Windows. */

import path, { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { relPosix } from '../../utils/posix-path.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { verdictFor, zeroProjectProblems } from '../../lib/arena/typecheck.ts';

export const CHECKED_EXTENSIONS = ['.ts'];

export const PROJECTS = [
  {
    project: 'scripts/tsconfig.check.json',
    reaches: 'every script and every suite under scripts/, which is the whole of the tooling',
  },
];

export const node = {
  name: 'check:script-types',
  reads: ['scripts/**', 'scripts/tsconfig.check.json', 'package.json'],
  writes: [],
  feeds: [],
};

export function sourcesUnder(dir: string) {
  return sortedByCodeUnit(walkFiles(dir, (rel) => CHECKED_EXTENSIONS.some((ext) => rel.endsWith(ext)))
    .map((rel) => relPosix(root, join(dir, rel), path)));
}

export function unreachedProblems(onDisk: readonly string[], reached: readonly string[]) {
  const found = new Set(reached);
  return onDisk.filter((rel) => !found.has(rel))
    .map((rel) => `${rel} is on disk and the project's globs do not reach it, so it compiles nowhere`);
}

function main() {
  const empty = zeroProjectProblems(PROJECTS.length);
  if (empty.length) {
    for (const problem of empty) console.error(`check-script-types: ${problem}`);
    process.exit(1);
  }

  let counted = 0;
  for (const { project, reaches } of PROJECTS) {
    const onDisk = sourcesUnder(join(root, 'scripts'));
    const verdict = verdictFor(project, root);

    const unreached = unreachedProblems(onDisk, verdict.reach);
    if (unreached.length) {
      console.error(`check-script-types: ${project} leaves ${unreached.length} file(s) unchecked\n`);
      for (const problem of unreached) console.error(`  ${problem}`);
      process.exit(1);
    }

    if (verdict.status !== 0) {
      console.error(`check-script-types: ${project} does not typecheck, and it reaches ${reaches}\n`);
      console.error(verdict.output.trim());
      process.exit(1);
    }
    counted += onDisk.length;
  }

  console.log(`check-script-types: ${PROJECTS.length} project(s) typecheck over ${counted} source(s), `
    + 'each one reached by the project\'s own globs');
}

if (isMainModule(import.meta.url)) main();
