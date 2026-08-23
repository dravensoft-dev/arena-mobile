/* One claim: the two layers answer the three classes the reduced-motion policy states, each over
 * the token the policy names. This is not a composition-layer stylesheet: the policy is prose in
 * Scales.md over tokens the payload carries whole, and the policy is the half that travels, which
 * is why it survives a platform with no media query. The three classes return three kinds of
 * answer, so the expected shape is per class and per layer rather than one expression. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR } from '../../lib/contracts/payload.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const KOTLIN_SEAM = 'compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaMotion.kt';
export const SWIFT_SEAM = 'swiftui/Sources/ArenaTokens/ArenaMotion.swift';
export const EFFECTS = `${CONTRACTS_DIR}/contracts/design/effects.json`;
export const SPACING = `${CONTRACTS_DIR}/contracts/design/spacing.json`;

export const node = {
  name: 'check:motion',
  reads: [EFFECTS, SPACING, KOTLIN_SEAM, SWIFT_SEAM],
  writes: [],
  feeds: [],
};

export type Shape = { params: string; returns: string; body: string };
export type Klass = { tokens: string[]; type: string | null; kotlin: Shape; swift: Shape; why: string };

export const CLASSES = new Map<string, Klass>([
  ['working', {
    tokens: ['loop.reduced', 'loop.brand-reduced'],
    type: 'duration',
    kotlin: {
      params: 'loop: Int, reduced: Boolean, slowed: Int = ArenaTokens.loopReduced',
      returns: 'Int',
      body: 'if (reduced) slowed else loop',
    },
    swift: {
      params: '_ loop: TimeInterval, reduced: Bool, slowed: TimeInterval = ArenaTokens.loopReduced',
      returns: 'TimeInterval',
      body: 'reduced ? slowed : loop',
    },
    why: 'motion that reports work in progress slows and is never frozen, because a stopped spinner '
      + 'reads as a hung process, which is the opposite of the truth. The slowed step is a DEFAULT and '
      + "not a constant: loop.brand-reduced is the brand mark's own step, three times slower again, and "
      + 'it reaches the seam as an argument rather than as a fourth member, because the rotor is a call '
      + 'site and the policy has three classes',
  }],
  ['decorative', {
    tokens: [],
    type: null,
    kotlin: { params: 'reduced: Boolean', returns: 'Boolean', body: '!reduced' },
    swift: { params: '_ reduced: Bool', returns: 'Bool', body: '!reduced' },
    why: 'purely decorative motion stops outright and the surface falls back to flat, since there is '
      + 'nothing left to report once it stops. This is the one member here that states policy rather '
      + 'than composing a value, and the reason is arithmetic: a duration of zero over an infinite loop '
      + 'is not a flat surface, it is a loop with no period, and the time axis carries no contracted '
      + 'zero the way the length axis carries sp.0',
  }],
  ['travel', {
    tokens: ['sp.0'],
    type: 'dimension',
    kotlin: { params: 'distance: Dp, reduced: Boolean', returns: 'Dp', body: 'if (reduced) ArenaTokens.sp0 else distance' },
    swift: { params: '_ distance: CGFloat, reduced: Bool', returns: 'CGFloat', body: 'reduced ? ArenaTokens.sp0 : distance' },
    why: 'an entrance keeps its fade and drops its travel, because the movement is the vestibular '
      + 'trigger and the fade is the meaning. The fade is not a member: an unchanged value returned by '
      + 'a composition composes nothing, which is the same clause the policy gives an opacity-only '
      + 'animation when it says there is nothing to reduce',
  }],
]);

export const KOTLIN_MEMBER = /^\s*public fun (\w+)\((.*?)\): (\w+) = (.+)$/;
export const SWIFT_MEMBER = /^\s*public static func (\w+)\((.*?)\) -> (\w+) \{ (.+) \}$/;

export type Member = Shape;

export function membersIn(source: string, pattern: RegExp) {
  const found = new Map<string, Member>();
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match?.[1] && match[2] !== undefined && match[3] && match[4]) {
      found.set(match[1], { params: match[2], returns: match[3], body: match[4].trim() });
    }
  }
  return found;
}

export function coverageProblems(members: ReadonlyMap<string, Member>, layer: string) {
  return sortedByCodeUnit([
    ...[...CLASSES].filter(([name]) => !members.has(name)).map(([name, one]) => `${layer} declares no ${name} member, `
      + `and the policy states a class for it. A class the seam does not carry is one no consumer can answer: ${one.why}`),
    ...[...members.keys()].filter((name) => !CLASSES.has(name)).map((name) => `${layer} declares a ${name} member `
      + 'and CLASSES names no class for it, so the seam has grown a class this repository authored and no policy reaches'),
  ]);
}

export function parityProblems(kotlin: ReadonlyMap<string, Member>, swift: ReadonlyMap<string, Member>) {
  return sortedByCodeUnit([
    ...[...kotlin.keys()].filter((name) => !swift.has(name))
      .map((name) => `${name} is a seam member on Compose and not on SwiftUI, so one contract offers a consumer two libraries`),
    ...[...swift.keys()].filter((name) => !kotlin.has(name))
      .map((name) => `${name} is a seam member on SwiftUI and not on Compose, so one contract offers a consumer two libraries`),
  ]);
}

export function shapeProblems(members: ReadonlyMap<string, Member>, layer: string, side: 'kotlin' | 'swift') {
  return sortedByCodeUnit([...members].flatMap(([name, member]) => {
    const one = CLASSES.get(name);
    if (!one) return [];
    const want = one[side];
    const errs: string[] = [];
    if (want.params !== member.params) {
      errs.push(`${layer} takes ${JSON.stringify(member.params)} for ${name} and the policy arrives as `
        + `${JSON.stringify(want.params)}: ${one.why}`);
    }
    if (want.returns !== member.returns) {
      errs.push(`${layer} returns ${member.returns} from ${name} and the class answers with ${want.returns}. `
        + `The three classes do not return the same kind of answer and the seam does not pretend they do: ${one.why}`);
    }
    if (want.body !== member.body) {
      errs.push(`${layer} composes ${name} as ${JSON.stringify(member.body)} and the policy is `
        + `${JSON.stringify(want.body)}: ${one.why}`);
    }
    return errs;
  }));
}

export function staleClassProblems(tokens: readonly { name: string }[]) {
  const carried = new Set(tokens.map((token) => token.name));
  return sortedByCodeUnit([...CLASSES].flatMap(([name, one]) => one.tokens
    .filter((token) => !carried.has(token))
    .map((token) => `CLASSES answers ${name} over ${token}, which the pinned contract does not carry. `
      + `A class naming a token that is gone composes nothing: ${one.why}`)));
}

export function operandProblems(tokens: readonly { name: string; type?: string; userScale?: string }[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  return sortedByCodeUnit([...CLASSES].flatMap(([name, one]) => one.tokens.flatMap((token) => {
    const found = byName.get(token);
    if (!found || one.type === null) return [];
    if (found.type !== one.type) {
      return [`${token} answers ${name} and the pinned contract types it ${found.type}, and the class `
        + `composes a ${one.type}. A value of the wrong kind compiles and animates nothing`];
    }
    if (found.userScale !== 'scales') return [];
    return [`${token} answers ${name} and the pinned contract puts it on the scales axis. Motion grows `
      + "with no reader's text setting, so a scaling operand here is a duration that moves when nothing "
      + "about the reader's motion setting did"];
  })));
}

export function missingSeamProblems(present: (path: string) => boolean) {
  return [KOTLIN_SEAM, SWIFT_SEAM]
    .filter((path) => !present(path))
    .map((path) => `${path} is not in the tree, so every claim below would hold over a seam this gate never opened`);
}

export function zeroClassProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 classes out of CLASSES, so this gate holds a seam to a policy it carries none of';
}

export function zeroMemberProblem(counted: number, layer: string) {
  if (counted > 0) return null;
  return `read 0 seam members out of ${layer}, so a layer carrying no seam at all reports a clean pass`;
}

function main() {
  const missing = missingSeamProblems((path) => existsSync(join(root, path)));
  if (missing.length) {
    console.error(`check-motion: ${missing.length} problem(s)\n`);
    for (const problem of missing) console.error(`  ${problem}`);
    process.exit(1);
  }
  const tokens = tokensOf(root);
  const kotlin = membersIn(readFileSync(join(root, KOTLIN_SEAM), 'utf8'), KOTLIN_MEMBER);
  const swift = membersIn(readFileSync(join(root, SWIFT_SEAM), 'utf8'), SWIFT_MEMBER);
  const noClass = zeroClassProblem(CLASSES.size);
  const noKotlin = zeroMemberProblem(kotlin.size, 'Compose');
  const noSwift = zeroMemberProblem(swift.size, 'SwiftUI');
  const errs = [
    ...(noClass ? [noClass] : []),
    ...(noKotlin ? [noKotlin] : []),
    ...(noSwift ? [noSwift] : []),
    ...coverageProblems(kotlin, 'Compose'),
    ...coverageProblems(swift, 'SwiftUI'),
    ...parityProblems(kotlin, swift),
    ...shapeProblems(kotlin, 'Compose', 'kotlin'),
    ...shapeProblems(swift, 'SwiftUI', 'swift'),
    ...staleClassProblems(tokens),
    ...operandProblems(tokens),
  ];
  if (errs.length) {
    console.error(`check-motion: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-motion: ${CLASSES.size} class(es) answered by both seams, each over the token the policy `
    + `names, and ${kotlin.size + swift.size} member(s) read out of the two layers`,
  );
}

if (isMainModule(import.meta.url)) main();
