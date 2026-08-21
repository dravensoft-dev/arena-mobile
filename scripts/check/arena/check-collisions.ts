/* Two distinct token paths never mangle to one identifier, and no identifier starts with a
 * digit or is a keyword in either language. A path is not an identifier: sp.0, r.2xl,
 * shadow.1 and dz.text-2xs each carry a leading digit or a hyphen. A collision is the
 * dangerous half, because the emitted file compiles with one member silently overwriting the
 * other and every other gate stays green. */

import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { DENSITIES, THEMES } from '../../lib/contracts/payload.ts';
import { identifierProblems } from '../../lib/arena/identifier.ts';
import { densityTokens, scaleTokens, themeTokens } from '../../lib/arena/emit.ts';
import { TARGETS, tokensOf } from '../../generate/arena/generate-tokens.ts';

export const node = {
  name: 'check:collisions',
  reads: TARGETS,
  writes: [],
  feeds: [],
};

export function namespaces(tokens: ReturnType<typeof tokensOf>) {
  return [
    { where: 'ArenaTokens', fields: scaleTokens(tokens) },
    ...THEMES.map((theme) => ({ where: `ArenaColorScheme (${theme})`, fields: themeTokens(tokens, theme) })),
    ...DENSITIES.map((density) => ({ where: `ArenaDensityScale (${density})`, fields: densityTokens(tokens, density) })),
  ];
}

export function zeroNamespaceProblem(counted: number) {
  if (counted > 0) return null;
  return 'found 0 identifiers to compare, which is what a collision gate looks like when the emit it reads has moved';
}

function main() {
  const tokens = tokensOf(root);
  const sets = namespaces(tokens);
  const counted = sets.reduce((total, one) => total + one.fields.length, 0);
  const zero = zeroNamespaceProblem(counted);
  const errs = [
    ...(zero ? [zero] : []),
    ...sets.flatMap(({ where, fields }) => identifierProblems(
      fields.map((field) => ({ name: field.token.name, identifier: field.identifier })),
    ).map((problem) => `${where}: ${problem}`)),
  ];
  if (errs.length) {
    console.error(`check-collisions: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-collisions: ${counted} identifier(s) across ${sets.length} namespace(s), each one distinct, bare and not a keyword`);
}

if (isMainModule(import.meta.url)) main();
