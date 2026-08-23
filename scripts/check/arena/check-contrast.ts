/* One claim: the two layers answer the three cases contrast.css states, each over the contracted
 * operand the composition names. Arena writes that composition in a stylesheet the payload does
 * not carry, so CASES is hand-carried with a reason per entry and no OWED sits beside it: both
 * operands of every case are contracted and emitted, and what lives outside the payload is which
 * value answers which case. The axis is a parameter, so a test sets what no test can set on a
 * device. REFUSED is the fourth case, and it fails if a layer grows a member for it. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR } from '../../lib/contracts/payload.ts';
import { identifierFor } from '../../lib/arena/identifier.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const KOTLIN_SEAM = 'compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaContrast.kt';
export const SWIFT_SEAM = 'swiftui/Sources/ArenaTokens/ArenaContrast.swift';
export const EFFECTS = `${CONTRACTS_DIR}/contracts/design/effects.json`;
export const SPACING = `${CONTRACTS_DIR}/contracts/design/spacing.json`;

export const node = {
  name: 'check:contrast',
  reads: [EFFECTS, SPACING, KOTLIN_SEAM, SWIFT_SEAM],
  writes: [],
  feeds: [],
};

export const AXES = new Map<string, { param: string; why: string }>([
  ['contrast', {
    param: 'increased',
    why: 'whether the reader asked for a stronger interface, which is prefers-contrast on the web, '
      + 'the colorSchemeContrast environment value on SwiftUI and UiModeManager.getContrast on Compose. '
      + 'Android reports a float and states it from API 34 over a minSdk of 24, so the threshold and '
      + "the version guard are the caller's and never a library's",
  }],
  ['transparency', {
    param: 'reduced',
    why: 'whether the reader asked for less translucency, which the web folds into prefers-contrast '
      + 'because a browser offers one query. contrast.css names the setting itself, as what iOS calls '
      + 'Reduce Transparency, and off the web it is a separate switch a reader turns on alone. Android '
      + 'publishes no such setting, so on that layer the parameter has no instrument behind it and the '
      + 'member exists anyway: one a layer lacks offers a consumer two libraries from one contract',
  }],
]);

export type Case = { axis: string; standard: string; answer: string; why: string };

export const CASES = new Map<string, Case>([
  ['border', {
    axis: 'contrast',
    standard: 'bw',
    answer: 'bw-strong',
    why: "a boundary that carries meaning thickens, because WCAG 1.4.11 measures a control's boundary "
      + 'at 3:1 and a hairline is the first thing that reader is asking about. Arena moves six bw ROLES '
      + 'to one value and this repository carries no role tier: the six names are the tier asking a '
      + "boundary's question six times, and what a target without it answers is the question itself, "
      + 'which step a boundary takes. Both operands are contracted, so the collapse is a mapping and '
      + 'never a debt',
  }],
  ['focusWidth', {
    axis: 'contrast',
    standard: 'focus.width',
    answer: 'sp.1',
    why: "the focus ring widens, because it is drawn at an ordinary border's width and would otherwise "
      + 'stop standing out at the moment every border thickens. It takes the first step of the spacing '
      + 'grid rather than a width of its own, since a ring is a length and Arena has one ladder of those',
  }],
  ['scrimBlur', {
    axis: 'transparency',
    standard: 'scrim-blur',
    answer: 'sp.0',
    why: 'a translucent surface stops being translucent. scrim-blur IS the transparency effect, the '
      + 'backdrop blur a scrim paints the page through, and taking it to zero is what Reduce Transparency '
      + "asks for. The scrim's own colour is not touched, because how dark a product dims its page is a "
      + 'decision that tier owns',
  }],
]);

export const REFUSED = new Map<string, string>([
  ['accentInk', 'the fourth case. An accent drawn as ink is a style plugin\'s answer over a palette the '
    + 'kernel does not know, so Arena refuses to reassign it and this repository, which carries no plugin '
    + 'tier at all, refuses harder. A member here would be this repository authoring a skin it consumes. '
    + 'The Wave 4 entry on the style plugin tier is where it is reopened'],
]);

export const KOTLIN_MEMBER = /^\s*public fun (\w+)\((.*?)\): Dp = (.+)$/;
export const SWIFT_MEMBER = /^\s*public static func (\w+)\((.*?)\) -> CGFloat \{ (.+) \}$/;

export type Member = { params: string; body: string };

export function membersIn(source: string, pattern: RegExp) {
  const found = new Map<string, Member>();
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match?.[1] && match[2] !== undefined && match[3]) {
      found.set(match[1], { params: match[2], body: match[3].trim() });
    }
  }
  return found;
}

function operandsOf(one: Case) {
  return {
    answer: identifierFor(one.answer.split('.')),
    standard: identifierFor(one.standard.split('.')),
  };
}

export function expectedKotlin(member: string): Member | null {
  const one = CASES.get(member);
  const axis = one ? AXES.get(one.axis) : undefined;
  if (!one || !axis) return null;
  const { answer, standard } = operandsOf(one);
  return {
    params: `${axis.param}: Boolean`,
    body: `if (${axis.param}) ArenaTokens.${answer} else ArenaTokens.${standard}`,
  };
}

export function expectedSwift(member: string): Member | null {
  const one = CASES.get(member);
  const axis = one ? AXES.get(one.axis) : undefined;
  if (!one || !axis) return null;
  const { answer, standard } = operandsOf(one);
  return {
    params: `_ ${axis.param}: Bool`,
    body: `${axis.param} ? ArenaTokens.${answer} : ArenaTokens.${standard}`,
  };
}

export function coverageProblems(members: ReadonlyMap<string, Member>, layer: string) {
  return sortedByCodeUnit([
    ...[...CASES].filter(([name]) => !members.has(name)).map(([name, one]) => `${layer} declares no ${name} member, `
      + `and the composition layer states a case for it. A case the seam does not carry is one no consumer can answer: ${one.why}`),
    ...[...members.keys()]
      .filter((name) => !CASES.has(name) && !REFUSED.has(name))
      .map((name) => `${layer} declares a ${name} member and CASES names no case for it, `
        + 'so the seam has grown a case this repository authored and no composition reaches'),
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

export function shapeProblems(
  members: ReadonlyMap<string, Member>,
  expected: (member: string) => Member | null,
  layer: string,
) {
  return sortedByCodeUnit([...members].flatMap(([name, member]) => {
    const want = expected(name);
    if (want === null) return [];
    if (want.params !== member.params) {
      return [`${layer} takes ${JSON.stringify(member.params)} for ${name} and the case reads the `
        + `${CASES.get(name)?.axis} axis, which arrives as ${JSON.stringify(want.params)}. A case reading `
        + 'the wrong axis compiles, draws, and answers a reader who asked for something else'];
    }
    if (want.body !== member.body) {
      return [`${layer} composes ${name} as ${JSON.stringify(member.body)} and the composition is `
        + `${JSON.stringify(want.body)}. A step that looks right and is not is the copy no skin swap moves`];
    }
    return [];
  }));
}

export function refusedProblems(members: ReadonlyMap<string, Member>, layer: string) {
  return sortedByCodeUnit([...REFUSED]
    .filter(([name]) => members.has(name))
    .map(([name, why]) => `${layer} declares a ${name} member and this case is refused: ${why}`));
}

export function staleCaseProblems(tokens: readonly { name: string }[]) {
  const carried = new Set(tokens.map((token) => token.name));
  return sortedByCodeUnit([...CASES].flatMap(([name, one]) => [one.standard, one.answer]
    .filter((token) => !carried.has(token))
    .map((token) => `CASES answers ${name} with ${token}, which the pinned contract does not carry. `
      + `A case naming a token that is gone composes nothing: ${one.why}`)));
}

export function operandProblems(tokens: readonly { name: string; type?: string; userScale?: string }[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  return sortedByCodeUnit([...CASES].flatMap(([name, one]) => [one.standard, one.answer].flatMap((token) => {
    const found = byName.get(token);
    if (!found) return [];
    if (found.type !== 'dimension') {
      return [`${token} answers ${name} and the pinned contract types it ${found.type}, so a length is `
        + 'being read out of something that is not one'];
    }
    if (found.userScale !== 'scales') return [];
    return [`${token} answers ${name} and the pinned contract puts it on the scales axis. A boundary and `
      + "a ring are lengths that grow with no reader's text setting, so a scaling operand here is a width "
      + "that moves when nothing about the reader's contrast setting did"];
  })));
}

export function missingSeamProblems(present: (path: string) => boolean) {
  return [KOTLIN_SEAM, SWIFT_SEAM]
    .filter((path) => !present(path))
    .map((path) => `${path} is not in the tree, so every claim below would hold over a seam this gate never opened`);
}

export function zeroCaseProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 cases out of CASES, so this gate holds a seam to a composition it carries none of';
}

export function zeroMemberProblem(counted: number, layer: string) {
  if (counted > 0) return null;
  return `read 0 seam members out of ${layer}, so a layer carrying no seam at all reports a clean pass`;
}

function main() {
  const missing = missingSeamProblems((path) => existsSync(join(root, path)));
  if (missing.length) {
    console.error(`check-contrast: ${missing.length} problem(s)\n`);
    for (const problem of missing) console.error(`  ${problem}`);
    process.exit(1);
  }
  const tokens = tokensOf(root);
  const kotlin = membersIn(readFileSync(join(root, KOTLIN_SEAM), 'utf8'), KOTLIN_MEMBER);
  const swift = membersIn(readFileSync(join(root, SWIFT_SEAM), 'utf8'), SWIFT_MEMBER);
  const noCase = zeroCaseProblem(CASES.size);
  const noKotlin = zeroMemberProblem(kotlin.size, 'Compose');
  const noSwift = zeroMemberProblem(swift.size, 'SwiftUI');
  const errs = [
    ...(noCase ? [noCase] : []),
    ...(noKotlin ? [noKotlin] : []),
    ...(noSwift ? [noSwift] : []),
    ...coverageProblems(kotlin, 'Compose'),
    ...coverageProblems(swift, 'SwiftUI'),
    ...parityProblems(kotlin, swift),
    ...shapeProblems(kotlin, expectedKotlin, 'Compose'),
    ...shapeProblems(swift, expectedSwift, 'SwiftUI'),
    ...refusedProblems(kotlin, 'Compose'),
    ...refusedProblems(swift, 'SwiftUI'),
    ...staleCaseProblems(tokens),
    ...operandProblems(tokens),
  ];
  if (errs.length) {
    console.error(`check-contrast: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-contrast: ${CASES.size} case(s) answered by both seams over ${AXES.size} axis/axes, `
    + `each on a non-scaling length the pinned contract names, `
    + `${REFUSED.size} case(s) refused, `
    + `and ${kotlin.size + swift.size} member(s) read out of the two layers`,
  );
}

if (isMainModule(import.meta.url)) main();
