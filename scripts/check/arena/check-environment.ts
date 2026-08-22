/* One claim: the geometry seam composes the edges the composition layer states, each over the
 * floor the contract names. Arena writes that composition in a stylesheet the payload does not
 * carry, so FLOORS is hand-carried here with a reason per entry, the way the colour aliases are
 * in check-composition.ts, and no OWED sits beside it: the floors themselves are contracted and
 * what lives outside the payload is the mapping. The seams are read by path rather than by a
 * walk, so a seam that moves is a named failure instead of an empty scan. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR } from '../../lib/contracts/payload.ts';
import { identifierFor } from '../../lib/arena/identifier.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const KOTLIN_SEAM = 'compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaSafeArea.kt';
export const SWIFT_SEAM = 'swiftui/Sources/ArenaTokens/ArenaSafeArea.swift';
export const SPACING = `${CONTRACTS_DIR}/contracts/design/spacing.json`;

export const node = {
  name: 'check:environment',
  reads: [SPACING, KOTLIN_SEAM, SWIFT_SEAM],
  writes: [],
  feeds: [],
};

export const FLOORS = new Map<string, { token: string; why: string }>([
  ['bottom', {
    token: 'sp.3',
    why: 'the home indicator and the gesture bar, and the one edge Arena states a step for: a bar '
      + 'sitting flush against the foot of the screen is unreachable rather than merely tight',
  }],
  ['end', {
    token: 'sp.0',
    why: 'a cutout in landscape and nothing otherwise. Arena states no step here, and a floor of '
      + 'nothing is the statement that this edge owes nothing when the device reports nothing, '
      + 'never an absence: a step invented here would pad a phone Arena leaves flush',
  }],
  ['start', {
    token: 'sp.0',
    why: 'the mirror of end, for the reason end carries',
  }],
  ['top', {
    token: 'sp.0',
    why: 'the status bar and the notch, which the device reports in full, so Arena adds nothing '
      + 'beneath them. A component wanting a gutter above its own content raises the floor at '
      + 'the call site, which is what ArenaSkipLink does upstream',
  }],
]);

export const KOTLIN_MEMBER = /^\s*public fun (\w+)\(inset: Dp, floor: Dp = ArenaTokens\.(\w+)\): Dp = (.+)$/;
export const SWIFT_MEMBER = /^\s*public static func (\w+)\(_ inset: CGFloat, floor: CGFloat = ArenaTokens\.(\w+)\) -> CGFloat \{ (.+) \}$/;

export const KOTLIN_COMPOSITION = 'max(floor, inset)';
export const SWIFT_COMPOSITION = 'max(floor, inset)';

export type Member = { floor: string; body: string };

export function membersIn(source: string, pattern: RegExp) {
  const found = new Map<string, Member>();
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match?.[1] && match[2] && match[3]) found.set(match[1], { floor: match[2], body: match[3].trim() });
  }
  return found;
}

export function expectedFloor(edge: string) {
  const floor = FLOORS.get(edge);
  return floor ? identifierFor(floor.token.split('.')) : null;
}

export function coverageProblems(members: ReadonlyMap<string, Member>, layer: string) {
  return sortedByCodeUnit([
    ...[...FLOORS].filter(([edge]) => !members.has(edge)).map(([edge, floor]) => `${layer} declares no ${edge} member, `
      + `and the composition layer states an edge for it. An edge the seam does not carry is one no consumer can compose: ${floor.why}`),
    ...[...members.keys()].filter((edge) => !FLOORS.has(edge)).map((edge) => `${layer} declares a ${edge} member and FLOORS names no edge for it, `
      + 'so the seam has grown an edge this repository authored and no floor reaches'),
  ]);
}

export function parityProblems(kotlin: ReadonlyMap<string, Member>, swift: ReadonlyMap<string, Member>) {
  const errs: string[] = [];
  for (const [edge, member] of kotlin) {
    const other = swift.get(edge);
    if (!other) errs.push(`${edge} is a seam member on Compose and not on SwiftUI, so one contract offers a consumer two libraries`);
    else if (other.floor !== member.floor) errs.push(`${edge} floors at ${member.floor} on Compose and ${other.floor} on SwiftUI, so the two layers compose two expressions`);
  }
  for (const edge of swift.keys()) {
    if (!kotlin.has(edge)) errs.push(`${edge} is a seam member on SwiftUI and not on Compose, so one contract offers a consumer two libraries`);
  }
  return sortedByCodeUnit(errs);
}

export function floorProblems(members: ReadonlyMap<string, Member>, layer: string) {
  return sortedByCodeUnit([...members].flatMap(([edge, member]) => {
    const expected = expectedFloor(edge);
    if (expected === null || member.floor === expected) return [];
    return [`${layer} floors ${edge} at ArenaTokens.${member.floor}, and the composition layer states ${FLOORS.get(edge)?.token} for it, `
      + `which emits as ${expected}. A floor that looks right and is not is the copy no skin swap moves`];
  }));
}

export function axisProblems(tokens: readonly { name: string; type?: string; userScale?: string }[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  return sortedByCodeUnit([...FLOORS].flatMap(([edge, floor]) => {
    const token = byName.get(floor.token);
    if (!token) return [];
    if (token.type !== 'dimension') {
      return [`${floor.token} floors ${edge} and the pinned contract types it ${token.type}, so a length is being read out of something that is not one`];
    }
    if (token.userScale === 'fixed') return [];
    return [`${floor.token} floors ${edge} and the pinned contract puts it on the ${token.userScale} axis. `
      + "A safe-area gutter is device geometry and grows with no reader's text setting, so a scaling floor here is a gutter that moves when nothing about the device did"];
  }));
}

export function compositionProblems(members: ReadonlyMap<string, Member>, expected: string, layer: string) {
  return sortedByCodeUnit([...members].flatMap(([edge, member]) => (member.body === expected
    ? []
    : [`${layer} composes ${edge} as ${JSON.stringify(member.body)} and the composition is ${JSON.stringify(expected)}. `
      + 'The device reports the inset and Arena states the floor, so returning either half alone compiles, draws, '
      + 'and is wrong on every device that reports the other'])));
}

export function staleFloorProblems(tokens: readonly { name: string }[]) {
  const carried = new Set(tokens.map((token) => token.name));
  return sortedByCodeUnit([...FLOORS].flatMap(([edge, floor]) => (carried.has(floor.token)
    ? []
    : [`FLOORS floors ${edge} at ${floor.token}, which the pinned contract does not carry. `
      + `A floor naming a token that is gone floors nothing: ${floor.why}`])));
}

export function missingSeamProblems(present: (path: string) => boolean) {
  return [KOTLIN_SEAM, SWIFT_SEAM]
    .filter((path) => !present(path))
    .map((path) => `${path} is not in the tree, so every claim below would hold over a seam this gate never opened`);
}

export function zeroEdgeProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 edges out of FLOORS, so this gate holds a seam to a composition it carries none of';
}

export function zeroMemberProblem(counted: number, layer: string) {
  if (counted > 0) return null;
  return `read 0 seam members out of ${layer}, so a layer carrying no seam at all reports a clean pass`;
}

function main() {
  const missing = missingSeamProblems((path) => existsSync(join(root, path)));
  if (missing.length) {
    console.error(`check-environment: ${missing.length} problem(s)\n`);
    for (const problem of missing) console.error(`  ${problem}`);
    process.exit(1);
  }
  const tokens = tokensOf(root);
  const kotlin = membersIn(readFileSync(join(root, KOTLIN_SEAM), 'utf8'), KOTLIN_MEMBER);
  const swift = membersIn(readFileSync(join(root, SWIFT_SEAM), 'utf8'), SWIFT_MEMBER);
  const noEdge = zeroEdgeProblem(FLOORS.size);
  const noKotlin = zeroMemberProblem(kotlin.size, 'Compose');
  const noSwift = zeroMemberProblem(swift.size, 'SwiftUI');
  const errs = [
    ...(noEdge ? [noEdge] : []),
    ...(noKotlin ? [noKotlin] : []),
    ...(noSwift ? [noSwift] : []),
    ...coverageProblems(kotlin, 'Compose'),
    ...coverageProblems(swift, 'SwiftUI'),
    ...parityProblems(kotlin, swift),
    ...floorProblems(kotlin, 'Compose'),
    ...floorProblems(swift, 'SwiftUI'),
    ...axisProblems(tokens),
    ...compositionProblems(kotlin, KOTLIN_COMPOSITION, 'Compose'),
    ...compositionProblems(swift, SWIFT_COMPOSITION, 'SwiftUI'),
    ...staleFloorProblems(tokens),
  ];
  if (errs.length) {
    console.error(`check-environment: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-environment: ${FLOORS.size} edge(s) composed by both seams, `
    + `each over a fixed-axis floor the pinned contract names, `
    + `and ${kotlin.size + swift.size} member(s) read out of the two layers`,
  );
}

if (isMainModule(import.meta.url)) main();
