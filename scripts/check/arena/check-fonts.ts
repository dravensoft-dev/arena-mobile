/* One claim: the type seam matches the contract on both layers. The families come from the
 * pinned payload and the members from the two hand-authored seams, so a family added upstream
 * reaches both layers or fails here. The default is not chosen in this repository: a fontFamily
 * value carries a CSS generic tail the emit drops, and that tail is the only statement anywhere
 * about which system face a family falls back to. The seams are read by path rather than by a
 * walk, so a seam that moves is a named failure instead of an empty scan. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { byCodeUnit, sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { dirFor } from '../../lib/arena/layer-trees.ts';
import { CONTRACTS_DIR, type Token } from '../../lib/contracts/payload.ts';
import { CSS_GENERIC_FAMILIES } from '../../lib/arena/bridge.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const KOTLIN_SEAM = 'compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaFonts.kt';
export const SWIFT_SEAM = `${dirFor('swiftui', 'tokens')}/ArenaFonts.swift`;
export const TYPOGRAPHY = `${CONTRACTS_DIR}/contracts/design/typography.json`;

export const node = {
  name: 'check:fonts',
  reads: [TYPOGRAPHY, KOTLIN_SEAM, SWIFT_SEAM],
  writes: [],
  feeds: [],
};

export const MONOSPACE_GENERICS = new Set(['ui-monospace', 'monospace']);

export const KOTLIN_GENERIC = new Map([['system', 'Default'], ['monospaced', 'Monospace']]);
export const SWIFT_GENERIC = new Map([['system', 'system'], ['monospaced', 'monospaced']]);

export const KOTLIN_MEMBER = /^\s*public val (\w+): FontFamily,?$/;
export const SWIFT_MEMBER = /^\s*public let (\w+): ArenaFontFace$/;
export const KOTLIN_DEFAULT = /^\s*(\w+) = FontFamily\.(\w+),?$/;
export const SWIFT_DEFAULT = /^\s*(\w+): \.(\w+),?$/;

export const OWED = new Map<string, string>([
  ['font.display', 'the weight range this family covers, so a consumer registering static cuts installs the ones the design draws rather than the whole fw scale. Ask Arena for a weights extension under com.dravensoft.arena beside the token in contracts/design/typography.json, which scripts/generate/core/fetch-fonts.ts:weightRange(weights) already computes and writes into a file the payload does not carry'],
  ['font.body', 'the weight range this family covers, and the entry where the absence already costs: the fw scale names weights above what a body family carries, so a heading drawn in it is synthesised by the platform with nothing to say so. Same shape as font.display'],
  ['font.mono', 'the weight range this family covers. Same shape as font.display'],
]);

export type Family = { member: string; name: string; generic: 'system' | 'monospaced' };

export function familiesOf(tokens: readonly Pick<Token, 'name' | 'path' | 'type' | 'value'>[]): Family[] {
  return tokens
    .filter((token) => token.type === 'fontFamily')
    .map((token) => {
      const list = (Array.isArray(token.value) ? token.value : [token.value]).map(String);
      const named = list.filter((one) => !CSS_GENERIC_FAMILIES.has(one));
      return {
        member: token.path[token.path.length - 1] ?? '',
        name: named[0] ?? '',
        generic: list.some((one) => MONOSPACE_GENERICS.has(one)) ? 'monospaced' as const : 'system' as const,
      };
    })
    .sort((a, b) => byCodeUnit(a.member, b.member));
}

export function membersIn(source: string, pattern: RegExp) {
  const found: string[] = [];
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match?.[1]) found.push(match[1]);
  }
  return found.sort(byCodeUnit);
}

export function defaultsIn(source: string, pattern: RegExp) {
  const found = new Map<string, string>();
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match?.[1] && match[2]) found.set(match[1], match[2]);
  }
  return found;
}

export function coverageProblems(families: readonly Family[], members: readonly string[], layer: string) {
  const declared = new Set(members);
  const contracted = new Set(families.map((family) => family.member));
  return sortedByCodeUnit([
    ...families
      .filter((family) => !declared.has(family.member))
      .map((family) => `${layer} declares no ${family.member} member, and the contract names a family for it. A family the seam does not carry is one no consumer can hand a face to`),
    ...members
      .filter((member) => !contracted.has(member))
      .map((member) => `${layer} declares a ${member} member and no fontFamily token names it, so the seam has grown a family this repository authored`),
  ]);
}

export function parityProblems(kotlin: readonly string[], swift: readonly string[]) {
  const inSwift = new Set(swift);
  const inKotlin = new Set(kotlin);
  return sortedByCodeUnit([
    ...kotlin.filter((member) => !inSwift.has(member))
      .map((member) => `${member} is a seam member on Compose and not on SwiftUI, so one contract offers a consumer two libraries`),
    ...swift.filter((member) => !inKotlin.has(member))
      .map((member) => `${member} is a seam member on SwiftUI and not on Compose, so one contract offers a consumer two libraries`),
  ]);
}

export function defaultProblems(
  families: readonly Family[],
  defaults: ReadonlyMap<string, string>,
  generics: ReadonlyMap<string, string>,
  layer: string,
) {
  const errs: string[] = [];
  for (const family of families) {
    const expected = generics.get(family.generic);
    const actual = defaults.get(family.member);
    if (actual === undefined) {
      errs.push(`${layer} states no system default for ${family.member}, so the fallback a consumer who registers nothing gets is unmeasured`);
      continue;
    }
    if (actual === expected) continue;
    errs.push(`${layer} falls ${family.member} back to ${actual} and its contracted tail names a ${family.generic} generic, which is the only statement anywhere about the face it falls back to`);
  }
  return sortedByCodeUnit(errs);
}

export function fixedSizeProblems(source: string) {
  return sortedByCodeUnit(source
    .split('\n')
    .filter((line) => line.includes('.custom(') && !line.includes('fixedSize:'))
    .map((line) => `${SWIFT_SEAM} resolves a named face with ${JSON.stringify(line.trim())}. Font.custom(_:size:) scales with Dynamic Type on its own and a size arriving here has already been through ArenaScale.text, so the type scale scales twice on this layer and once on Compose. Spell it fixedSize:`));
}

export function missingSeamProblems(present: (path: string) => boolean) {
  return [KOTLIN_SEAM, SWIFT_SEAM]
    .filter((path) => !present(path))
    .map((path) => `${path} is not in the tree, so every claim below would hold over a seam this gate never opened`);
}

export function zeroFamilyProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 fontFamily tokens out of the pinned contract, so every claim below holds over a contract this gate never opened';
}

export function zeroMemberProblem(counted: number, layer: string) {
  if (counted > 0) return null;
  return `read 0 seam members out of ${layer}, so a layer carrying no seam at all reports a clean pass`;
}

export function staleOwedProblems(tokens: readonly { name: string; weights?: unknown }[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  return sortedByCodeUnit([...OWED].flatMap(([name, owed]) => (byName.get(name)?.weights === undefined
    ? []
    : [`OWED names ${name}, for which the pinned contract now carries a weight range. Carry it into the seam and delete the entry: ${owed}`])));
}

function main() {
  const missing = missingSeamProblems((path) => existsSync(join(root, path)));
  if (missing.length) {
    console.error(`check-fonts: ${missing.length} problem(s)\n`);
    for (const problem of missing) console.error(`  ${problem}`);
    process.exit(1);
  }
  const tokens = tokensOf(root);
  const families = familiesOf(tokens);
  const kotlin = readFileSync(join(root, KOTLIN_SEAM), 'utf8');
  const swift = readFileSync(join(root, SWIFT_SEAM), 'utf8');
  const kotlinMembers = membersIn(kotlin, KOTLIN_MEMBER);
  const swiftMembers = membersIn(swift, SWIFT_MEMBER);
  const noFamily = zeroFamilyProblem(families.length);
  const noKotlin = zeroMemberProblem(kotlinMembers.length, 'Compose');
  const noSwift = zeroMemberProblem(swiftMembers.length, 'SwiftUI');
  const errs = [
    ...(noFamily ? [noFamily] : []),
    ...(noKotlin ? [noKotlin] : []),
    ...(noSwift ? [noSwift] : []),
    ...coverageProblems(families, kotlinMembers, 'Compose'),
    ...coverageProblems(families, swiftMembers, 'SwiftUI'),
    ...parityProblems(kotlinMembers, swiftMembers),
    ...defaultProblems(families, defaultsIn(kotlin, KOTLIN_DEFAULT), KOTLIN_GENERIC, 'Compose'),
    ...defaultProblems(families, defaultsIn(swift, SWIFT_DEFAULT), SWIFT_GENERIC, 'SwiftUI'),
    ...fixedSizeProblems(swift),
    ...staleOwedProblems(tokens),
  ];
  if (errs.length) {
    console.error(`check-fonts: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-fonts: ${families.length} contracted family/families carried by both seams, `
    + `each falling back to the generic its own contracted tail names, `
    + `and ${OWED.size} weight range(s) waiting on a raised pin`,
  );
}

if (isMainModule(import.meta.url)) main();
