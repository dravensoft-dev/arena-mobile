/* No script assumes one operating system. Every rule is a ban with a named owner, so the
 * question is never whether a construct is correct but where it may live: a branch written
 * for macOS is testable from Linux only while the answer arrives as a parameter, and the
 * machine a contributor happens to own otherwise decides which half of the tooling is covered.
 * A suite may name a platform and a native path, because that is a suite doing its job. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export type Rule = { pattern: RegExp; owner: string | null; why: string };

export const RULES: Rule[] = [
  {
    pattern: /\bprocess\.platform\b/,
    owner: 'scripts/lib/arena/platform.ts',
    why: 'everywhere else takes the answer as a parameter, which is what makes a branch written for macOS testable from Linux',
  },
  {
    pattern: /\bspawnSync\(\s*['"`][a-z]/i,
    owner: 'scripts/lib/arena/host-binary.ts',
    why: 'a binary is spawned by resolved path, because there is no git on Windows, there is git.exe',
  },
  {
    pattern: /\blocaleCompare\(/,
    owner: null,
    why: 'localeCompare puts a before B under en-US and after it by code unit, so an emitter writes two different files on two machines and every workflow calls the second one an emit out of step. Use scripts/utils/compare.ts',
  },
  {
    pattern: /\bpath\.sep\b/,
    owner: 'scripts/utils/posix-path.ts',
    why: 'nothing else writes the host separator down; a path that leaves this process goes through toPosix',
  },
  {
    pattern: /\.slice\(\s*\w*(?:root|base|dir|prefix)\w*\.length/i,
    owner: null,
    why: 'a relative path computed by slicing the base length off an absolute one reads a native path as one segment on Windows and as a correct answer here. Use relPosix from scripts/utils/posix-path.ts',
  },
];

export const node = {
  name: 'check:portability',
  reads: ['scripts/**'],
  writes: [],
  feeds: [],
};

export function scanned(root_: string) {
  return sortedByCodeUnit(walkFiles(join(root_, 'scripts'), (rel) => rel.endsWith('.ts') && !rel.endsWith('.test.ts'))
    .map((rel) => `scripts/${rel}`));
}

export function ruleProblems(files: { file: string; source: string }[], rules = RULES) {
  const errs: string[] = [];
  for (const { file, source } of files) {
    for (const rule of rules) {
      if (file === rule.owner) continue;
      source.split('\n').forEach((line, index) => {
        if (!rule.pattern.test(line)) return;
        const where = rule.owner ? `It belongs to ${rule.owner}` : 'It belongs nowhere';
        errs.push(`${file} line ${index + 1}: ${JSON.stringify(line.trim())}. ${where}: ${rule.why}`);
      });
    }
  }
  return errs;
}

export function unownedRuleProblems(files: { file: string; source: string }[], rules = RULES) {
  const present = new Set(files.map((one) => one.file));
  return rules
    .filter((rule) => rule.owner !== null && !present.has(rule.owner))
    .map((rule) => `a rule names ${rule.owner} as its owner, and that file is not in the tree: ${rule.why}`);
}

export function zeroScanProblem(counted: number) {
  if (counted > 0) return null;
  return 'scanned 0 scripts, so every ban below holds over a tree this gate never opened';
}

function main() {
  const files = scanned(root).map((file) => ({ file, source: readFileSync(join(root, file), 'utf8') }));
  const zero = zeroScanProblem(files.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...ruleProblems(files),
    ...unownedRuleProblems(files),
  ];
  if (errs.length) {
    console.error(`check-portability: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-portability: ${files.length} script(s) held to ${RULES.length} ban(s), each one naming where it may live`);
}

if (isMainModule(import.meta.url)) main();
