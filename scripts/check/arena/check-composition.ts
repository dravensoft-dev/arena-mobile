/* What the two native layers compose out of the emitted palette, measured over the grounds they
 * themselves name. The values come from the contract and the members from the hand-authored
 * sources, because the claim is about what those files draw and check:emit already holds the
 * committed emit equal to the payload. OWED is the other half: a ratio Arena has not contracted
 * yet, named with the token asked for, failing the moment a raised pin brings it in. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { contrast, type Rgb } from '../../utils/contrast.ts';
import { CONTRACTS_DIR, THEMES, type Theme } from '../../lib/contracts/payload.ts';
import { themeTokens } from '../../lib/arena/emit.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const KOTLIN_ROOT = 'compose/src/main/kotlin';
export const SWIFT_ROOT = 'swiftui/Sources';

export const node = {
  name: 'check:composition',
  reads: [
    `${CONTRACTS_DIR}/contracts/design/**`,
    `${KOTLIN_ROOT}/**`, `!${KOTLIN_ROOT}/**/*.generated.*`,
    `${SWIFT_ROOT}/**`, `!${SWIFT_ROOT}/**/*.generated.*`,
  ],
  writes: [],
  feeds: [],
};

export const KOTLIN_ALIAS = /^public val ArenaColorScheme\.(\w+): Color get\(\) = (\w+)$/;
export const SWIFT_ALIAS = /^\s*var (\w+): Color \{ (\w+) \}$/;

export type Role =
  | { kind: 'ground'; swept: boolean; why: string }
  | { kind: 'ink'; gate: number | null; why: string };

export const ROLES = new Map<string, Role>([
  ['bg', { kind: 'ground', swept: true, why: 'the page, and one of the two grounds Arena set its own bars against' }],
  ['surfaceCard', { kind: 'ground', swept: true, why: 'the elevated surface, and the other ground Arena set its bars against' }],
  ['surfaceRaised', { kind: 'ground', swept: false, why: 'base-300 is a panel rather than a reading surface, and Arena states no bar against it. One invented here would fail a palette this repository consumes rather than a mapping it wrote' }],
  ['surfaceInput', { kind: 'ground', swept: false, why: "a field's own fill, base-300 again, for the reason surfaceRaised carries" }],
  ['dangerFill', { kind: 'ground', swept: false, why: 'a fill with a content colour of its own, paired against error-content upstream, and never a ground body text is read on' }],
  ['border', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: a separator is not a control boundary. WCAG 1.4.11 measures the boundary of a control, this layer draws none yet, and Arena measures no border against a surface' }],
  ['borderStrong', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: the boundary that carries meaning, for the reason border carries' }],
  ['textStrong', { kind: 'ink', gate: 4.5, why: 'body text at full strength' }],
  ['accent', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: the brand, and a gate here would repaint Dravensoft rather than tighten a token' }],
  ['onAccent', { kind: 'ink', gate: null, why: 'measured against the accent it stands on rather than against a ground' }],
  ['focusRing', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: the brand, for the reason accent carries' }],
  ['danger', { kind: 'ink', gate: 4.5, why: 'the outline danger IS the text and the border, measured over the grounds Arena measures it over' }],
]);

export const PAIRS = [
  { ink: 'onAccent', fill: 'accent', gate: 4.5, why: "a button's label on the accent it stands on: the one pair this table creates rather than inherits" },
];

export const OWED = new Map<string, string>([
  ['level.ink-body', 'textBody, replacing --text-body and --bone-dim. Ask Arena for a number carrying cssUnit "%" beside tint in contracts/design/effects.json'],
  ['level.ink-quiet', 'textQuiet, which has no alias on the web at all: the component sheets spell it as an opacity modifier. Same shape as level.ink-body'],
  ['level.ink-muted', 'textMuted, replacing --text-muted and --mute. Same shape as level.ink-body'],
  ['level.disabled', 'textDisabled, exempt from the contrast bar under the WCAG 1.4.3 and 1.4.11 inactive-component carve-out and never raised to answer a report'],
  ['level.presence', 'statusOffline, a graphical object at 3:1 and never a disabled state'],
  ['soft.accent', 'accentSoft, replacing --crimson-soft and --accent-soft'],
  ['soft.danger', 'dangerSoft, the wash a danger control lightens with on hover'],
  ['soft.success', 'successSoft, the wash under a success status'],
  ['soft.warning', 'warningSoft, the wash under a warning status'],
  ['soft.info', 'infoSoft, the wash under an info status'],
]);

export function aliasesIn(source: string) {
  const found = new Map<string, string>();
  for (const line of source.split('\n')) {
    const match = KOTLIN_ALIAS.exec(line) ?? SWIFT_ALIAS.exec(line);
    if (match) found.set(match[1], match[2]);
  }
  return found;
}

export function parityProblems(kotlin: Map<string, string>, swift: Map<string, string>) {
  const errs: string[] = [];
  for (const [name, target] of kotlin) {
    if (!swift.has(name)) errs.push(`${name} is composed on Compose and not on SwiftUI, so one contract offers a consumer two libraries`);
    else if (swift.get(name) !== target) errs.push(`${name} reads ${target} on Compose and ${swift.get(name)} on SwiftUI`);
  }
  for (const name of swift.keys()) {
    if (!kotlin.has(name)) errs.push(`${name} is composed on SwiftUI and not on Compose, so one contract offers a consumer two libraries`);
  }
  return sortedByCodeUnit(errs);
}

export function resolutionProblems(aliases: Map<string, string>, members: Set<string>) {
  const errs: string[] = [];
  for (const [name, target] of aliases) {
    if (!members.has(target)) errs.push(`${name} points at ${target}, which ArenaColorScheme does not declare`);
    if (!ROLES.has(name)) errs.push(`${name} is composed and ROLES does not say whether it is ink or ground, so no bar reaches it`);
  }
  return sortedByCodeUnit(errs);
}

export function contrastProblems(aliases: Map<string, string>, colours: Record<string, Rgb>, theme: string) {
  const errs: string[] = [];
  const grounds = [...aliases].filter(([name]) => {
    const role = ROLES.get(name);
    return role?.kind === 'ground' && role.swept;
  });
  for (const [name, target] of aliases) {
    const role = ROLES.get(name);
    if (!role || role.kind !== 'ink' || role.gate === null) continue;
    const ink = colours[target];
    if (!ink) continue;
    for (const [ground, groundTarget] of grounds) {
      const under = colours[groundTarget];
      if (!under) continue;
      const ratio = contrast(ink, under);
      if (ratio >= role.gate) continue;
      errs.push(`${theme}: ${name} on ${ground} is ${ratio.toFixed(2)}:1 against a bar of ${role.gate}:1. ${role.why}`);
    }
  }
  return sortedByCodeUnit(errs);
}

export function measured(aliases: Map<string, string>) {
  const grounds = [...aliases.keys()].filter((name) => {
    const role = ROLES.get(name);
    return role?.kind === 'ground' && role.swept;
  });
  const inks = [...aliases.keys()].filter((name) => {
    const role = ROLES.get(name);
    return role?.kind === 'ink' && role.gate !== null;
  });
  return grounds.length * inks.length + PAIRS.length;
}

export function zeroMeasuredProblem(counted: number) {
  if (counted > 0) return null;
  return 'measured 0 inks against a bar, so ROLES has every member reported and none gated, and a gate that measures nothing passes over anything';
}

export function pairProblems(aliases: Map<string, string>, colours: Record<string, Rgb>, theme: string) {
  const errs: string[] = [];
  for (const { ink, fill, gate, why } of PAIRS) {
    const over = colours[aliases.get(fill) ?? ''];
    const on = colours[aliases.get(ink) ?? ''];
    if (!over || !on) {
      errs.push(`${theme}: PAIRS names ${ink} on ${fill}, and one of the two is not composed by either layer. ${why}`);
      continue;
    }
    const ratio = contrast(on, over);
    if (ratio >= gate) continue;
    errs.push(`${theme}: ${ink} on ${fill} is ${ratio.toFixed(2)}:1 against a bar of ${gate}:1. ${why}`);
  }
  return sortedByCodeUnit(errs);
}

export function staleOwedProblems(tokens: readonly { name: string }[]) {
  const carried = new Set(tokens.map((token) => token.name));
  return sortedByCodeUnit([...OWED].flatMap(([token, owed]) => (carried.has(token)
    ? [`OWED names ${token}, which is now carried by the pinned contract. Compose the member it names and delete the entry: ${owed}`]
    : [])));
}

export function zeroCompositionProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 composition members out of the two native layers, so every bar below holds over a layer this gate never opened';
}

function sourcesUnder(root_: string, tree: string, extension: string) {
  return walkFiles(join(root_, tree), (rel) => rel.endsWith(extension) && !rel.includes('.generated.'))
    .map((rel) => readFileSync(join(root_, tree, rel), 'utf8'))
    .join('\n');
}

function colourTable(tokens: ReturnType<typeof tokensOf>, theme: Theme) {
  const table: Record<string, Rgb> = {};
  for (const field of themeTokens(tokens, theme)) {
    const value = field.token.value as { components: number[] };
    table[field.identifier] = [value.components[0], value.components[1], value.components[2]];
  }
  return table;
}

function main() {
  const tokens = tokensOf(root);
  const kotlin = aliasesIn(sourcesUnder(root, KOTLIN_ROOT, '.kt'));
  const swift = aliasesIn(sourcesUnder(root, SWIFT_ROOT, '.swift'));
  const members = new Set(themeTokens(tokens, 'dark').map((field) => field.identifier));
  const zero = zeroCompositionProblem(kotlin.size + swift.size);
  const nothing = zeroMeasuredProblem(measured(kotlin));
  const errs = [
    ...(zero ? [zero] : []),
    ...(nothing ? [nothing] : []),
    ...parityProblems(kotlin, swift),
    ...resolutionProblems(kotlin, members),
    ...THEMES.flatMap((theme) => [
      ...contrastProblems(kotlin, colourTable(tokens, theme), theme),
      ...pairProblems(kotlin, colourTable(tokens, theme), theme),
    ]),
    ...staleOwedProblems(tokens),
  ];
  if (errs.length) {
    console.error(`check-composition: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-composition: ${kotlin.size} member(s) composed in both layers, `
    + `${measured(kotlin) * THEMES.length} ink(s) measured against a bar across ${THEMES.length} theme(s), `
    + `and ${OWED.size} ratio(s) waiting on a raised pin`,
  );
}

if (isMainModule(import.meta.url)) main();
