/* The Kotlin and Swift in the tree are what a fresh emit produces. This is the gate the whole
 * arrangement rests on: the emit is TRACKED so that a clone with no JS toolchain builds both
 * libraries, and a tracked emit nothing compares is a copy that drifts from its source with
 * every gate around it still green. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { TARGETS, emitAll, tokensOf } from '../../generate/arena/generate-tokens.ts';

export const node = {
  name: 'check:emit',
  reads: TARGETS,
  writes: [],
  feeds: [],
};

export function emitProblems(expected: Map<string, string>, onDisk: (target: string) => string | null) {
  const errs: string[] = [];
  for (const [target, body] of expected) {
    const found = onDisk(target);
    if (found === null) {
      errs.push(`${target} is not in the tree, and a native build compiles what is committed. Run generate:tokens`);
      continue;
    }
    if (found === body) continue;
    const mine = body.split('\n');
    const theirs = found.split('\n');
    const at = mine.findIndex((line, index) => line !== theirs[index]);
    errs.push(
      `${target} is not what a fresh emit produces. The first line that differs is ${at + 1}: `
      + `the tree has ${JSON.stringify(theirs[at] ?? '<end of file>')} and the emit produces `
      + `${JSON.stringify(mine[at] ?? '<end of file>')}. Run generate:tokens`,
    );
  }
  return errs;
}

function main() {
  const expected = emitAll(tokensOf(root));
  const errs = emitProblems(expected, (target) => {
    const full = join(root, target);
    return existsSync(full) ? readFileSync(full, 'utf8') : null;
  });
  if (errs.length) {
    console.error(`check-emit: ${errs.length} file(s) out of step with the pinned contract\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-emit: ${expected.size} generated file(s) equal to a fresh emit, byte for byte`);
}

if (isMainModule(import.meta.url)) main();
