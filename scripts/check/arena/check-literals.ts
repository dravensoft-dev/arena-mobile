/* No design value sits as a literal in a hand-authored native source. A dp, an sp, an em, a
 * hex colour and a component-wise Color constructor are all values the contract owns, and one
 * written by hand is a second copy of a token that no longer moves when the token does. What
 * is NOT a design value stays allowed: a cap, a divisor and a ratio are arithmetic, and the
 * one place their reason can sit is the header a test file is granted. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export const KOTLIN_ROOT = 'compose/src/main/kotlin';
export const SWIFT_ROOT = 'swiftui/Sources';

export const node = {
  name: 'check:literals',
  reads: [
    `${KOTLIN_ROOT}/**`, `!${KOTLIN_ROOT}/**/*.generated.*`,
    `${SWIFT_ROOT}/**`, `!${SWIFT_ROOT}/**/*.generated.*`,
  ],
  writes: [],
  feeds: [],
};

export const EXEMPT = new Map<string, string>([]);

export const BANNED = [
  { pattern: /\b\d+(?:\.\d+)?\.(?:dp|sp|em)\b/, what: 'a length or a text unit written as a literal' },
  { pattern: /#[0-9a-fA-F]{6}\b/, what: 'a hex colour' },
  { pattern: /\bColor\s*\(\s*(?:red\s*=|\.sRGB|red:)/, what: 'a colour built from components' },
  { pattern: /\bFontWeight\s*\(\s*\d/, what: 'a font weight written as a literal' },
];

export function literalProblems(files: { file: string; source: string }[]) {
  const errs: string[] = [];
  for (const { file, source } of files) {
    if (EXEMPT.has(file)) continue;
    source.split('\n').forEach((line, index) => {
      for (const { pattern, what } of BANNED) {
        if (!pattern.test(line)) continue;
        errs.push(`${file} carries ${what}: ${JSON.stringify(line.trim())}. The value belongs to the contract, and this file reads it from ArenaTokens`);
      }
    });
  }
  return sortedByCodeUnit(errs);
}

export function staleExemptProblems(present: Set<string>) {
  return [...EXEMPT].flatMap(([file, why]) => (present.has(file)
    ? []
    : [`EXEMPT names ${file}, which is not in the tree. An allowance for a file that has moved allows nothing: ${why}`]));
}

export function zeroScanProblem(counted: number) {
  if (counted > 0) return null;
  return 'scanned 0 hand-authored native sources, so this gate reports a clean pass over a tree it never opened';
}

export function scanned(root_: string) {
  return [
    ...walkFiles(join(root_, KOTLIN_ROOT), (rel) => rel.endsWith('.kt') && !rel.includes('.generated.'))
      .map((rel) => `${KOTLIN_ROOT}/${rel}`),
    ...walkFiles(join(root_, SWIFT_ROOT), (rel) => rel.endsWith('.swift') && !rel.includes('.generated.'))
      .map((rel) => `${SWIFT_ROOT}/${rel}`),
  ].sort();
}

function main() {
  const files = scanned(root).map((file) => ({ file, source: readFileSync(join(root, file), 'utf8') }));
  const zero = zeroScanProblem(files.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...literalProblems(files),
    ...staleExemptProblems(new Set(files.map((one) => one.file))),
  ];
  if (errs.length) {
    console.error(`check-literals: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-literals: ${files.length} hand-authored native source(s), none carrying a design value, and ${EXEMPT.size} allowance(s)`);
}

if (isMainModule(import.meta.url)) main();
