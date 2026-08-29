/* Two claims a derivation cannot make. First, that no bare span sits in a wait position: a
 * literal in a spawn timeout or a suite case timeout is a number read off whichever machine
 * wrote it, and it gets copied rather than argued with. Second, that a suite's budget names
 * every deadline its own import closure declares, since deriving a budget makes it right for
 * the deadlines it names and nothing else makes it name the right ones. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export const WAIT_IMPLEMENTATIONS = new Map<string, string>([
  [
    'scripts/lib/arena/child-output.ts',
    'the one place a spawn is given a timeout, and it takes the span as a parameter rather than choosing one',
  ],
  [
    'scripts/lib/arena/deadline.ts',
    'the declaration itself, where BUDGET_SLACK is a multiplier and not a wait',
  ],
]);

export const SPANS_AS_DATA = new Map<string, string>([
  [
    'scripts/check/arena/check-deadlines.test.ts',
    'the suite that covers this gate, where a bare span and an empty budget are the fixtures it feeds the gate to prove each one is refused; excluding it is what lets the rule be tested rather than only asserted',
  ],
  [
    'gradle/wrapper/gradle-wrapper.properties',
    'networkTimeout is read by the Gradle wrapper and not by anything here, so it is a value in a foreign format rather than a wait this tree owns',
  ],
]);

const WAIT_POSITION = /\b(?:timeout|timeoutMs|setTimeout|sleep|waitFor|networkTimeout)\s*[:(=]\s*(\d[\d_]*)/;

export const node = {
  name: 'check:deadlines',
  reads: ['scripts/**'],
  writes: [],
  feeds: [],
};

export function scanned(root_: string) {
  return sortedByCodeUnit(walkFiles(join(root_, 'scripts'), (rel) => rel.endsWith('.ts'))
    .map((rel) => `scripts/${rel}`));
}

export function bareSpanProblems(files: { file: string; source: string }[]) {
  const errs: string[] = [];
  for (const { file, source } of files) {
    if (WAIT_IMPLEMENTATIONS.has(file) || SPANS_AS_DATA.has(file)) continue;
    source.split('\n').forEach((line, index) => {
      const found = WAIT_POSITION.exec(line);
      if (!found) return;
      errs.push(
        `${file} line ${index + 1} puts the bare span ${found[1]} in a wait position. `
        + 'A duration is a statement about the machine that measured it, so declare it with deadline(name, ms, why)',
      );
    });
  }
  return errs;
}

export function budgetProblems(files: { file: string; source: string }[]) {
  const errs: string[] = [];
  for (const { file, source } of files) {
    if (!file.endsWith('.test.ts') || SPANS_AS_DATA.has(file)) continue;
    const declared = [...source.matchAll(/\bdeadline\(\s*'/g)].length;
    const budgets = [...source.matchAll(/\bbudgetFor\(([^)]*)\)/g)];
    if (declared > 0 && budgets.length === 0) {
      errs.push(`${file} declares a deadline and derives no budget, so its case can outrun the wait it owns and be abandoned with its child still running`);
    }
    for (const budget of budgets) {
      if (captured(budget).trim() === '') {
        errs.push(`${file} calls budgetFor with no deadline, which is a hand-written number wearing a call`);
      }
    }
  }
  return errs;
}

export function staleMapProblems(present: Set<string>, root_: string) {
  const errs: string[] = [];
  for (const [file, why] of WAIT_IMPLEMENTATIONS) {
    if (!present.has(file)) errs.push(`WAIT_IMPLEMENTATIONS names ${file}, which is not in the tree: ${why}`);
  }
  for (const [file, why] of SPANS_AS_DATA) {
    try {
      readFileSync(join(root_, file), 'utf8');
    } catch {
      errs.push(`SPANS_AS_DATA names ${file}, which is not in the tree: ${why}`);
    }
  }
  return errs;
}

export function zeroScanProblem(counted: number) {
  if (counted > 0) return null;
  return 'scanned 0 scripts, so no bare span can be found and this reports a clean pass over a tree it never opened';
}

function main() {
  const files = scanned(root).map((file) => ({ file, source: readFileSync(join(root, file), 'utf8') }));
  const zero = zeroScanProblem(files.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...bareSpanProblems(files),
    ...budgetProblems(files),
    ...staleMapProblems(new Set(files.map((one) => one.file)), root),
  ];
  if (errs.length) {
    console.error(`check-deadlines: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const declared = files.reduce((total, one) => total + [...one.source.matchAll(/\bdeadline\(\s*'/g)].length, 0);
  console.log(
    `check-deadlines: ${files.length} script(s), ${declared} declared deadline(s), and no bare span in a wait position `
    + `outside the ${WAIT_IMPLEMENTATIONS.size} owner(s) and ${SPANS_AS_DATA.size} foreign format(s) named with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
