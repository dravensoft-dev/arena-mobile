/* Every doc comment in an emitted source is its contract's own text, read back out of the file
 * rather than assumed from the generator that wrote it. One documented symbol no contract names
 * fails, and one contract carrying a description that reached no symbol fails the same way.
 * Editing the text in the emitted file edits the wrong file: the fix is the contract, and the
 * comment follows on the next emit. Where REPHRASED names a description, what is owed is the
 * replacement that map declares, and the map is what holds that decision to the contract. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { docTextFor, flatten, densityTokens, scaleTokens, staleRephrasedProblems, themeTokens } from '../../lib/arena/emit.ts';
import { apiKotlinDocs, apiSwiftDocs, docProblems, kotlinDocs, swiftDocs } from '../../lib/arena/doc-comments.ts';
import { TARGETS, tokensOf } from '../../generate/arena/generate-tokens.ts';
import { API_TARGETS, apiTypesOf } from '../../generate/arena/generate-api-types.ts';
import { owedDocs } from '../../lib/arena/api-emit.ts';
import type { Emitted } from '../../lib/arena/bridge.ts';

export const node = {
  name: 'check:doc-comments',
  reads: [...TARGETS, ...API_TARGETS],
  writes: [],
  feeds: [],
};

function owedFrom(fields: Emitted[]) {
  return new Map(fields.map((field) => [
    field.identifier,
    flatten(docTextFor(field.token.name, field.token.description)),
  ]));
}

export function owedByFile(tokens: ReturnType<typeof tokensOf>, types: ReturnType<typeof apiTypesOf>) {
  const scales = owedFrom(scaleTokens(tokens));
  const colors = owedFrom(themeTokens(tokens, 'dark'));
  const density = owedFrom(densityTokens(tokens, 'base'));
  const api = new Map([...owedDocs(types)].map(([key, text]) => [key, flatten(text)]));
  return new Map([
    [TARGETS[0], scales], [TARGETS[1], colors], [TARGETS[2], density],
    [TARGETS[3], scales], [TARGETS[4], colors], [TARGETS[5], density],
    [API_TARGETS[0], api], [API_TARGETS[1], api],
  ]);
}

export function readerFor(target: string) {
  const api = API_TARGETS.includes(target);
  if (target.endsWith('.kt')) return api ? apiKotlinDocs : kotlinDocs;
  return api ? apiSwiftDocs : swiftDocs;
}

export function zeroDocProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 doc comments out of the emitted sources, which is what this gate looks like when the reader stops matching what the emitter writes';
}

function main() {
  const owed = owedByFile(tokensOf(root), apiTypesOf(root));
  const errs: string[] = [];
  let counted = 0;
  for (const [target, expected] of owed) {
    const source = readFileSync(join(root, target), 'utf8');
    const found = readerFor(target)(source);
    counted += found.size;
    errs.push(...docProblems(target, found, expected));
  }
  errs.push(...staleRephrasedProblems(tokensOf(root)));
  const zero = zeroDocProblem(counted);
  if (zero) errs.unshift(zero);
  if (errs.length) {
    console.error(`check-doc-comments: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-doc-comments: ${counted} doc comment(s) across ${owed.size} emitted file(s), each equal to what its contract owes`);
}

if (isMainModule(import.meta.url)) main();
