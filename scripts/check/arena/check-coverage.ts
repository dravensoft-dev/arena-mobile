/* Every token the pinned contract carries reaches a native symbol, or is named with its
 * reason in a map this gate reads. This is the question check:dtcg cannot ask, because the
 * contracts arrive conformant and what is open here is whether anything was dropped on the
 * way across. Zero tokens found is a failure: a gate that walks nothing reports no gaps. */

import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, NOT_A_VALUE, designSources, readManifest, valueSources } from '../../lib/contracts/payload.ts';
import { UNMAPPED, staleUnmappedProblems } from '../../lib/arena/bridge.ts';
import { DENSITIES, THEMES } from '../../lib/contracts/payload.ts';
import { densityTokens, scaleTokens, shapeProblems, themeTokens } from '../../lib/arena/emit.ts';
import { TARGETS, tokensOf } from '../../generate/arena/generate-tokens.ts';

export const node = {
  name: 'check:coverage',
  reads: [`${CONTRACTS_DIR}/contracts/design/**`, ...TARGETS],
  writes: [],
  feeds: [],
};

export function zeroTokenProblem(counted: number) {
  if (counted > 0) return null;
  return 'found 0 tokens in the pinned contract, so every token below has a counterpart by having no tokens';
}

export function reachedNames(tokens: ReturnType<typeof tokensOf>) {
  const reached = new Set<string>();
  for (const field of scaleTokens(tokens)) reached.add(field.token.name);
  for (const theme of THEMES) for (const field of themeTokens(tokens, theme)) reached.add(field.token.name);
  for (const density of DENSITIES) for (const field of densityTokens(tokens, density)) reached.add(field.token.name);
  return reached;
}

export function coverageProblems(tokens: ReturnType<typeof tokensOf>) {
  const reached = reachedNames(tokens);
  return sortedByCodeUnit(tokens
    .filter((token) => !reached.has(token.name))
    .map((token) => `${token.name} is carried by the pinned contract and reaches no native symbol, and no map names it with a reason`));
}

export function sourceProblems(root_: string) {
  const manifest = readManifest(root_);
  const covered = new Set([...valueSources(manifest), ...NOT_A_VALUE.keys()]);
  return designSources(manifest)
    .filter((source) => !covered.has(source))
    .map((source) => `${source} is a design contract this emit neither reads nor excludes with a reason`);
}

function main() {
  const tokens = tokensOf(root);
  const zero = zeroTokenProblem(tokens.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...coverageProblems(tokens),
    ...sourceProblems(root),
    ...shapeProblems(tokens),
    ...staleUnmappedProblems(tokens),
  ];
  if (errs.length) {
    console.error(`check-coverage: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-coverage: ${tokens.length} token(s) from the pinned contract, every one reaching a native symbol, `
    + `with ${NOT_A_VALUE.size} contract file(s) and ${UNMAPPED.size} composite member(s) excluded with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
