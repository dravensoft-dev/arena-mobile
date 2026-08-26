/* One claim: the control tier the role set asks for is answered by both layers, member for
 * member, over the contracted step each role states it is born at. roles.json carries a $type
 * and a $description and no $value, so nothing here can be emitted; what crosses is the
 * collapse, and COLLAPSED partitions every control role the payload declares into one this
 * seam answers and one answered elsewhere or refused, with the reason. The rungs are the other
 * half: a height and a text step come off the density scale, so a control re-densifies without
 * the seam saying so. The seams are read by path, so one that moves is a named failure. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR } from '../../lib/contracts/payload.ts';
import { readJson } from '../../utils/read-json.ts';
import { densityTokens, scaleTokens } from '../../lib/arena/emit.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const KOTLIN_SEAM = 'compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaControl.kt';
export const SWIFT_SEAM = 'swiftui/Sources/ArenaTokens/ArenaControl.swift';
export const ROLES = `${CONTRACTS_DIR}/contracts/design/roles.json`;
export const CONTROL_MARK = 'control';

export const node = {
  name: 'check:control',
  reads: [ROLES, `${CONTRACTS_DIR}/contracts/design/spacing.json`, KOTLIN_SEAM, SWIFT_SEAM],
  writes: [],
  feeds: [],
};

export type Collapse = { member?: string; token?: string; why: string };

export const COLLAPSED = new Map<string, Collapse>([
  ['pad-control-x', {
    member: 'padding',
    token: 'sp.3',
    why: 'the role states it is born at sp.3, and a target with no role tier answers the question the '
      + 'name asks rather than the name. Arena spends a literal at two of its three rungs, which is a '
      + 'stylesheet the payload does not carry, so every rung here takes the contracted step',
  }],
  ['pad-control-y', {
    why: 'the down axis is the rung and not a padding: a control stands at the height the density scale '
      + 'names and its content is centred in it, so a second answer here would fight the one dz already gives',
  }],
  ['gap-control', {
    member: 'gap',
    token: 'sp.2',
    why: 'the role states it is born at sp.2, and it is the distance inside one control rather than between two',
  }],
  ['r-control', {
    member: 'radius',
    token: 'r.sm',
    why: 'the role states that a control and a field are both r.sm today, and the cut between them is a '
      + 'question a style plugin answers rather than a length this layer carries twice',
  }],
  ['r-control-sm', {
    why: 'the same question one step down, for a control whose whole body is barely larger than its own '
      + 'corner. Nothing published here is that small, and the step lands with the control that asks it',
  }],
  ['fw-control', {
    member: 'weight',
    token: 'fw.semibold',
    why: 'the role states it is born at fw.semibold, which eighteen slots upstream already spell by name',
  }],
  ['bw-control', {
    why: 'answered by ArenaContrast.border(increased), which is the boundary collapse this repository already '
      + 'made: six bw roles reach one contracted ladder, and check:contrast is what holds it',
  }],
  ['edge-control', {
    why: 'answered by the borderStrong alias in ArenaComposition, which names the job a colour does rather '
      + 'than its position in the palette, and check:composition is what holds it',
  }],
  ['edge-control-quiet', {
    why: 'the edge of a control that is present and not offering itself. No quiet control is published here, '
      + 'and an alias for one would name a job nothing does',
  }],
  ['shadow-control-rest', {
    why: 'the role states its own default is none, and a control that paints no depth at rest is what this '
      + 'layer draws. The property exists upstream so a style plugin can re-value it, and there is none here',
  }],
  ['shadow-control-raised', {
    why: 'what a control rises to under a pointer, which is a hover response rather than a resting value. It '
      + 'lands with the affordance that draws one and never as a constant of the tier',
  }],
  ['lift-control', {
    why: 'the role states its own default is nowhere, for the reason shadow-control-rest carries',
  }],
]);

export type Rung = { token: string; axis: string; why: string };

export const RUNGS = new Map<string, Rung>([
  ['height.sm', { token: 'dz.ctl-h-sm', axis: 'fixed', why: 'the small rung of the control ladder' }],
  ['height.md', { token: 'dz.ctl-h', axis: 'fixed', why: 'the rung the ladder is named for' }],
  ['height.lg', { token: 'dz.ctl-h-lg', axis: 'fixed', why: 'the large rung' }],
  ['text.sm', {
    token: 'dz.text-md',
    axis: 'scales',
    why: 'the small rung drops a text step, which is what Arena spends at its own small control',
  }],
  ['text.md', { token: 'dz.text', axis: 'scales', why: 'the control text step' }],
  ['text.lg', {
    token: 'dz.text',
    axis: 'scales',
    why: 'the large rung shares the control text step, because a taller control is more air and not larger type',
  }],
]);

export const KOTLIN_CONSTANT = /^\s*public val (\w+): [\w.]+ = ArenaTokens\.(\w+)$/;
export const SWIFT_CONSTANT = /^\s*public static let (\w+): [\w.]+ = ArenaTokens\.(\w+)$/;
export const KOTLIN_RUNG_HEAD = /^\s*public fun (\w+)\(size: ArenaControlSize/;
export const SWIFT_RUNG_HEAD = /^\s*public static func (\w+)\(_ size: ArenaControlSize/;
export const KOTLIN_RUNG = /^\s*ArenaControlSize\.(\w+) -> density\.(\w+)$/;
export const SWIFT_RUNG = /^\s*case \.(\w+): density\.(\w+)$/;
export const KOTLIN_TARGET = /^\s*public fun target\(painted: Dp, floor: Dp(.*)\): Dp = (.+)$/;
export const SWIFT_TARGET = /^\s*public static func target\(_ painted: CGFloat, floor: CGFloat(.*)\) -> CGFloat \{ (.+) \}$/;

export const COMPOSITION = 'max(floor, painted)';

export function constantsIn(source: string, pattern: RegExp) {
  const found = new Map<string, string>();
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match?.[1] && match[2]) found.set(match[1], match[2]);
  }
  return found;
}

export function rungsIn(source: string, head: RegExp, rung: RegExp) {
  const found = new Map<string, string>();
  let member: string | null = null;
  for (const line of source.split('\n')) {
    const opened = head.exec(line);
    if (opened?.[1]) { member = opened[1]; continue; }
    const match = rung.exec(line);
    if (member && match?.[1] && match[2]) found.set(`${member}.${match[1].toLowerCase()}`, match[2]);
  }
  return found;
}

export function targetIn(source: string, pattern: RegExp) {
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match) return { defaulted: captured(match).trim().length > 0, body: captured(match, 2).trim() };
  }
  return null;
}

export function collapsedHere() {
  return sortedByCodeUnit([...COLLAPSED]
    .filter(([, collapse]) => collapse.member !== undefined)
    .map(([role]) => role));
}

export function controlRoles(roles: Record<string, unknown>) {
  return sortedByCodeUnit(Object.keys(roles).filter((role) => role.includes(CONTROL_MARK)));
}

export function partitionProblems(roles: readonly string[]) {
  return sortedByCodeUnit([
    ...roles.filter((role) => !COLLAPSED.has(role)).map((role) => `${role} is a control role the pinned contract `
      + 'declares and COLLAPSED neither answers nor refuses. Silence over a role is the ambiguity this partition exists to end'),
    ...[...COLLAPSED].filter(([role]) => !roles.includes(role)).map(([role, collapse]) => `COLLAPSED names ${role}, `
      + `and the pinned contract declares no control role by that name: ${collapse.why}`),
  ]);
}

export function emittedNames(tokens: ReturnType<typeof tokensOf>) {
  return new Map([...scaleTokens(tokens), ...densityTokens(tokens, 'base')]
    .map((field) => [field.token.name, field.identifier]));
}

export function coverageProblems(constants: ReadonlyMap<string, string>, layer: string) {
  const owed = [...COLLAPSED].filter(([, collapse]) => collapse.member !== undefined);
  return sortedByCodeUnit([
    ...owed.filter(([, collapse]) => !constants.has(collapse.member as string))
      .map(([role, collapse]) => `${layer} declares no ${collapse.member} member, and ${role} collapses onto `
        + `${collapse.token} here. A role this seam answers on one layer and not on the other offers a consumer two libraries: ${collapse.why}`),
    ...[...constants.keys()].filter((member) => !owed.some(([, collapse]) => collapse.member === member))
      .map((member) => `${layer} declares a ${member} member and COLLAPSED names no role it answers, so the seam `
        + 'has grown a value this repository authored over a tier it consumes'),
  ]);
}

export function operandProblems(constants: ReadonlyMap<string, string>, emitted: ReadonlyMap<string, string>, layer: string) {
  return sortedByCodeUnit([...COLLAPSED].flatMap(([role, collapse]) => {
    if (collapse.member === undefined || collapse.token === undefined) return [];
    const read = constants.get(collapse.member);
    if (read === undefined) return [];
    const expected = emitted.get(collapse.token);
    if (read === expected) return [];
    return [`${layer} reads ArenaTokens.${read} for ${collapse.member}, and ${role} collapses onto ${collapse.token}, `
      + `which emits as ${expected}. A step that looks right and is not is the copy no pin raise moves`];
  }));
}

export function rungProblems(rungs: ReadonlyMap<string, string>, emitted: ReadonlyMap<string, string>, layer: string) {
  const tokenIdentifier = (key: string) => {
    const rung = RUNGS.get(key);
    return rung ? emitted.get(rung.token) : null;
  };
  return sortedByCodeUnit([
    ...[...RUNGS.keys()].filter((key) => !rungs.has(key)).map((key) => `${layer} answers no ${key} rung, `
      + `and the density scale states one: ${RUNGS.get(key)?.why}`),
    ...[...rungs].flatMap(([key, read]) => {
      if (!RUNGS.has(key)) return [`${layer} answers a ${key} rung and RUNGS names no density token for it`];
      const expected = tokenIdentifier(key);
      return read === expected ? [] : [`${layer} reads density.${read} for ${key}, and RUNGS names `
        + `${RUNGS.get(key)?.token}, which emits as ${expected}`];
    }),
  ]);
}

export function axisProblems(tokens: readonly { name: string; type?: string; userScale?: string }[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  const named = [
    ...[...COLLAPSED].flatMap(([role, collapse]) => (collapse.token ? [{ where: role, token: collapse.token, axis: 'fixed' }] : [])),
    ...[...RUNGS].map(([key, rung]) => ({ where: key, token: rung.token, axis: rung.axis })),
  ];
  return sortedByCodeUnit(named.flatMap(({ where, token, axis }) => {
    const carried = byName.get(token);
    if (!carried) {
      return [`${where} names ${token}, which the pinned contract does not carry. A collapse onto a token that is gone collapses onto nothing`];
    }
    if (carried.userScale === undefined || carried.userScale === axis) return [];
    return [`${where} names ${token}, and the pinned contract puts it on the ${carried.userScale} axis where this seam `
      + `needs ${axis}. A control's air is geometry and its label is type, and reading one off the other's axis moves the wrong half `
      + "when a reader raises their text setting"];
  }));
}

export function compositionProblems(target: { defaulted: boolean; body: string } | null, layer: string) {
  if (target === null) {
    return [`${layer} declares no target member of the shape this gate reads, so the activation box is either absent `
      + 'or has grown a default. The floor a platform asks for is a constant of that platform and never a value the contract carries'];
  }
  const errs: string[] = [];
  if (target.defaulted) {
    errs.push(`${layer} gives the activation box a default floor. The floor is 48dp on Android and 44pt on iOS, `
      + 'and a library reading every other length from the emit does not write one of them by hand');
  }
  if (target.body !== COMPOSITION) {
    errs.push(`${layer} composes the activation box as ${JSON.stringify(target.body)} and the composition is `
      + `${JSON.stringify(COMPOSITION)}. Returning either half alone compiles, draws, and is wrong at every rung the other one answers`);
  }
  return sortedByCodeUnit(errs);
}

export function parityProblems(kotlin: ReadonlyMap<string, string>, swift: ReadonlyMap<string, string>, what: string) {
  const errs: string[] = [];
  for (const [member, read] of kotlin) {
    const other = swift.get(member);
    if (other === undefined) errs.push(`${member} is a ${what} on Compose and not on SwiftUI, so one contract offers a consumer two libraries`);
    else if (other !== read) errs.push(`${member} reads ${read} on Compose and ${other} on SwiftUI, so the two layers answer one role twice`);
  }
  for (const member of swift.keys()) {
    if (!kotlin.has(member)) errs.push(`${member} is a ${what} on SwiftUI and not on Compose, so one contract offers a consumer two libraries`);
  }
  return sortedByCodeUnit(errs);
}

export function missingSeamProblems(present: (path: string) => boolean) {
  return [KOTLIN_SEAM, SWIFT_SEAM]
    .filter((path) => !present(path))
    .map((path) => `${path} is not in the tree, so every claim below would hold over a seam this gate never opened`);
}

export function zeroRoleProblem(counted: number) {
  if (counted > 0) return null;
  return `read 0 control roles out of ${ROLES}, so this partition covers a tier it found none of and passes by naming nothing`;
}

export function zeroMemberProblem(counted: number, layer: string) {
  if (counted > 0) return null;
  return `read 0 seam members out of ${layer}, so a layer carrying no control tier at all reports a clean pass`;
}

function main() {
  const missing = missingSeamProblems((path) => existsSync(join(root, path)));
  if (missing.length) {
    console.error(`check-control: ${missing.length} problem(s)\n`);
    for (const problem of missing) console.error(`  ${problem}`);
    process.exit(1);
  }
  const tokens = tokensOf(root);
  const emitted = emittedNames(tokens);
  const roles = controlRoles(readJson<Record<string, unknown>>(join(root, ROLES)));
  const kotlinSource = readFileSync(join(root, KOTLIN_SEAM), 'utf8');
  const swiftSource = readFileSync(join(root, SWIFT_SEAM), 'utf8');
  const kotlin = constantsIn(kotlinSource, KOTLIN_CONSTANT);
  const swift = constantsIn(swiftSource, SWIFT_CONSTANT);
  const kotlinRungs = rungsIn(kotlinSource, KOTLIN_RUNG_HEAD, KOTLIN_RUNG);
  const swiftRungs = rungsIn(swiftSource, SWIFT_RUNG_HEAD, SWIFT_RUNG);
  const noRole = zeroRoleProblem(roles.length);
  const noKotlin = zeroMemberProblem(kotlin.size + kotlinRungs.size, 'Compose');
  const noSwift = zeroMemberProblem(swift.size + swiftRungs.size, 'SwiftUI');

  const errs = [
    ...(noRole ? [noRole] : []),
    ...(noKotlin ? [noKotlin] : []),
    ...(noSwift ? [noSwift] : []),
    ...partitionProblems(roles),
    ...coverageProblems(kotlin, 'Compose'),
    ...coverageProblems(swift, 'SwiftUI'),
    ...operandProblems(kotlin, emitted, 'Compose'),
    ...operandProblems(swift, emitted, 'SwiftUI'),
    ...rungProblems(kotlinRungs, emitted, 'Compose'),
    ...rungProblems(swiftRungs, emitted, 'SwiftUI'),
    ...parityProblems(kotlin, swift, 'collapsed role'),
    ...parityProblems(kotlinRungs, swiftRungs, 'rung'),
    ...axisProblems(tokens),
    ...compositionProblems(targetIn(kotlinSource, KOTLIN_TARGET), 'Compose'),
    ...compositionProblems(targetIn(swiftSource, SWIFT_TARGET), 'SwiftUI'),
  ];
  if (errs.length) {
    console.error(`check-control: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-control: ${roles.length} control role(s) partitioned, ${collapsedHere().length} of them collapsed onto a `
    + `contracted step by both seams, ${RUNGS.size} rung(s) read off the density scale, and `
    + `${kotlin.size + swift.size + kotlinRungs.size + swiftRungs.size} member(s) read out of the two layers`,
  );
}

if (isMainModule(import.meta.url)) main();
