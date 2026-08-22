/* Two distinct declarations never mangle to one identifier, and no identifier starts with a
 * digit or is a keyword in either language. A path is not an identifier: sp.0, r.2xl and
 * dz.text-2xs each carry a leading digit or a hyphen, and so do the contract values 2xl and
 * datetime-local. A collision is the dangerous half, because the emitted file compiles with one
 * member silently overwriting the other and every other gate stays green. The API tier is
 * walked once per language, since a case is spelled in each one's own idiom. */

import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { DENSITIES, THEMES } from '../../lib/contracts/payload.ts';
import { TYPES_PREFIX, fieldEntries, type ApiType } from '../../lib/contracts/api-types.ts';
import { identifierProblems } from '../../lib/arena/identifier.ts';
import { enumCases } from '../../lib/arena/api-emit.ts';
import { densityTokens, scaleTokens, themeTokens } from '../../lib/arena/emit.ts';
import { TARGETS, tokensOf } from '../../generate/arena/generate-tokens.ts';
import { API_TARGETS, apiTypesOf } from '../../generate/arena/generate-api-types.ts';

export const node = {
  name: 'check:collisions',
  reads: [...TARGETS, ...API_TARGETS],
  writes: [],
  feeds: [],
};

export type Namespace = { where: string; named: { name: string; identifier: string }[] };

export function namespaces(tokens: ReturnType<typeof tokensOf>): Namespace[] {
  const from = (fields: ReturnType<typeof scaleTokens>) => fields
    .map((field) => ({ name: field.token.name, identifier: field.identifier }));
  return [
    { where: 'ArenaTokens', named: from(scaleTokens(tokens)) },
    ...THEMES.map((theme) => ({ where: `ArenaColorScheme (${theme})`, named: from(themeTokens(tokens, theme)) })),
    ...DENSITIES.map((density) => ({ where: `ArenaDensityScale (${density})`, named: from(densityTokens(tokens, density)) })),
  ];
}

export function apiNamespaces(types: ApiType[]): Namespace[] {
  const enums = types.filter((type) => type.kind === 'enum');
  const objects = types.filter((type) => type.kind === 'object');
  return [
    { where: TYPES_PREFIX, named: types.map((type) => ({ name: type.name, identifier: type.name })) },
    ...enums.flatMap((type) => {
      const cases = enumCases(type);
      const named = (spelling: 'kotlin' | 'swift') => cases
        .map((one) => ({ name: `${type.name}.${one.value}`, identifier: one[spelling] }));
      return [
        { where: `${type.name} (Kotlin)`, named: named('kotlin') },
        { where: `${type.name} (Swift)`, named: named('swift') },
      ];
    }),
    ...objects.map((type) => ({
      where: type.name,
      named: fieldEntries(type.fields).map(([field]) => ({ name: `${type.name}.${field}`, identifier: field })),
    })),
  ];
}

export function zeroNamespaceProblem(counted: number) {
  if (counted > 0) return null;
  return 'found 0 identifiers to compare, which is what a collision gate looks like when the emit it reads has moved';
}

function main() {
  const sets = [...namespaces(tokensOf(root)), ...apiNamespaces(apiTypesOf(root))];
  const counted = sets.reduce((total, one) => total + one.named.length, 0);
  const zero = zeroNamespaceProblem(counted);
  const errs = [
    ...(zero ? [zero] : []),
    ...sets.flatMap(({ where, named }) => identifierProblems(named).map((problem) => `${where}: ${problem}`)),
  ];
  if (errs.length) {
    console.error(`check-collisions: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-collisions: ${counted} identifier(s) across ${sets.length} namespace(s), each one distinct, bare and not a keyword`);
}

if (isMainModule(import.meta.url)) main();
