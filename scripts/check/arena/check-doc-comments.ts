/* Every doc comment in an emitted source is that token's own $description, read back out of
 * the file rather than assumed from the generator that wrote it. One documented symbol no
 * contract names fails, and one contract carrying a $description that reached no symbol fails
 * the same way. Editing the text in the emitted file edits the wrong file: the fix is the
 * contract, and the comment follows on the next emit. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { flatten, densityTokens, scaleTokens, themeTokens } from '../../lib/arena/emit.ts';
import { docProblems, kotlinDocs, swiftDocs } from '../../lib/arena/doc-comments.ts';
import { TARGETS, tokensOf } from '../../generate/arena/generate-tokens.ts';
import type { Emitted } from '../../lib/arena/bridge.ts';

export const node = {
  name: 'check:doc-comments',
  reads: TARGETS,
  writes: [],
  feeds: [],
};

function owedFrom(fields: Emitted[]) {
  return new Map(fields.map((field) => [field.identifier, flatten(field.token.description)]));
}

export function owedByFile(tokens: ReturnType<typeof tokensOf>) {
  const scales = owedFrom(scaleTokens(tokens));
  const colors = owedFrom(themeTokens(tokens, 'dark'));
  const density = owedFrom(densityTokens(tokens, 'base'));
  return new Map([
    [TARGETS[0], scales], [TARGETS[1], colors], [TARGETS[2], density],
    [TARGETS[3], scales], [TARGETS[4], colors], [TARGETS[5], density],
  ]);
}

export function zeroDocProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 doc comments out of the emitted sources, which is what this gate looks like when the reader stops matching what the emitter writes';
}

function main() {
  const tokens = tokensOf(root);
  const owed = owedByFile(tokens);
  const errs: string[] = [];
  let counted = 0;
  for (const [target, expected] of owed) {
    const source = readFileSync(join(root, target), 'utf8');
    const found = target.endsWith('.kt') ? kotlinDocs(source) : swiftDocs(source);
    counted += found.size;
    errs.push(...docProblems(target, found, expected));
  }
  const zero = zeroDocProblem(counted);
  if (zero) errs.unshift(zero);
  if (errs.length) {
    console.error(`check-doc-comments: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-doc-comments: ${counted} doc comment(s) across ${owed.size} emitted file(s), each equal to its contract's $description`);
}

if (isMainModule(import.meta.url)) main();
