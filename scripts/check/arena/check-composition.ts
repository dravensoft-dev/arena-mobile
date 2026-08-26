/* What the two native layers compose out of the emitted palette, measured over the grounds they
 * themselves name. The values come from the contract and the members from the hand-authored
 * sources, because the claim is about what those files draw and check:emit already holds the
 * committed emit equal to the payload. OWED is the other half: a ratio Arena has not contracted
 * yet, named with the token asked for, failing the moment a raised pin brings it in. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
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

export const COMPOSED = new Map<string, Role>([
  ['bg', { kind: 'ground', swept: true, why: 'the page, and one of the two grounds Arena set its own bars against' }],
  ['surfaceCard', { kind: 'ground', swept: true, why: 'the elevated surface, and the other ground Arena set its bars against' }],
  ['surfaceRaised', { kind: 'ground', swept: false, why: 'base-300 is a panel rather than a reading surface, and Arena states no bar against it. One invented here would fail a palette this repository consumes rather than a mapping it wrote' }],
  ['surfaceInput', { kind: 'ground', swept: false, why: "a field's own fill, base-300 again, for the reason surfaceRaised carries" }],
  ['dangerFill', { kind: 'ground', swept: false, why: 'a fill with a content colour of its own, paired against error-content upstream, and never a ground body text is read on' }],
  ['border', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: a separator is not a control boundary, so WCAG 1.4.11 does not reach it, and Arena measures no border against a surface' }],
  ['borderStrong', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: the boundary that carries meaning, which a control now draws, so 1.4.11 does reach it. UNMET is where that bar and the ratio the palette answers it with are recorded' }],
  ['textStrong', { kind: 'ink', gate: 4.5, why: 'body text at full strength' }],
  ['accent', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: the brand, and a gate here would repaint Dravensoft rather than tighten a token' }],
  ['onAccent', { kind: 'ink', gate: null, why: 'measured against the accent it stands on rather than against a ground' }],
  ['focusRing', { kind: 'ink', gate: null, why: 'REPORTED AND NOT GATED: the brand, for the reason accent carries' }],
  ['danger', { kind: 'ink', gate: 4.5, why: 'the outline danger IS the text and the border, measured over the grounds Arena measures it over' }],
]);

export const PAIRS = [
  { ink: 'onAccent', fill: 'accent', gate: 4.5, why: "a button's label on the accent it stands on: the one pair this table creates rather than inherits" },
];

export const UNMET = new Map<string, { gate: number; why: string }>([
  ['borderStrong', {
    gate: 3,
    why: 'the boundary of a control, which WCAG 1.4.11 measures at 3:1 against what sits behind it. neutral answers '
      + 'it below that bar over both grounds in both themes. The bar is not raised here, because raising it means '
      + 'repainting a palette this repository consumes rather than tightening a mapping it wrote, which is the reason '
      + 'surfaceRaised already carries. The remedy is a contract change upstream and this entry dies with it',
  }],
  ['accent', {
    gate: 3,
    why: "the primary control's own boundary, which is the fill it stands on. The light palette clears the bar and the "
      + 'dark one does not, so the entry stays until both do. Same remedy as borderStrong, and the same refusal to '
      + 'invent a hue here',
  }],
]);

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
    if (match) found.set(captured(match), captured(match, 2));
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
    if (!COMPOSED.has(name)) errs.push(`${name} is composed and COMPOSED does not say whether it is ink or ground, so no bar reaches it`);
  }
  return sortedByCodeUnit(errs);
}

export function contrastProblems(aliases: Map<string, string>, colours: Record<string, Rgb>, theme: string) {
  const errs: string[] = [];
  const grounds = [...aliases].filter(([name]) => {
    const role = COMPOSED.get(name);
    return role?.kind === 'ground' && role.swept;
  });
  for (const [name, target] of aliases) {
    const role = COMPOSED.get(name);
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
    const role = COMPOSED.get(name);
    return role?.kind === 'ground' && role.swept;
  });
  const inks = [...aliases.keys()].filter((name) => {
    const role = COMPOSED.get(name);
    return role?.kind === 'ink' && role.gate !== null;
  });
  return grounds.length * inks.length + PAIRS.length;
}

export function zeroMeasuredProblem(counted: number) {
  if (counted > 0) return null;
  return 'measured 0 inks against a bar, so COMPOSED has every member reported and none gated, and a gate that measures nothing passes over anything';
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

export function staleComposedProblems(aliases: Map<string, string>) {
  return sortedByCodeUnit([...COMPOSED].flatMap(([name, role]) => (aliases.has(name)
    ? []
    : [`COMPOSED names ${name}, which neither layer composes. An entry outliving its member carries `
      + `a bar over nothing and a reason nobody can act on: ${role.why}`])));
}

export function unmetProblems(aliases: Map<string, string>, byTheme: Record<string, Record<string, Rgb>>) {
  return sortedByCodeUnit([...UNMET].flatMap(([name, unmet]) => {
    const target = aliases.get(name);
    if (target === undefined) {
      return [`UNMET names ${name}, which neither layer composes, so a bar is recorded over nothing: ${unmet.why}`];
    }
    const grounds = [...aliases].filter(([other]) => {
      const role = COMPOSED.get(other);
      return role?.kind === 'ground' && role.swept;
    });
    const measured = Object.entries(byTheme).flatMap(([, colours]) => grounds.flatMap(([, groundTarget]) => {
      const ink = colours[target];
      const under = colours[groundTarget];
      return ink && under ? [contrast(ink, under)] : [];
    }));
    if (measured.length === 0 || measured.some((ratio) => ratio < unmet.gate)) return [];
    return [`UNMET records ${name} below a bar of ${unmet.gate}:1, and the pinned palette now clears it over every `
      + `swept ground in every theme. Gate it in COMPOSED and delete the entry: ${unmet.why}`];
  }));
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
    const [r, g, b] = value.components;
    if (r === undefined || g === undefined || b === undefined) {
      throw new Error(`${field.token.name} declares ${value.components.length} colour component(s), and a ratio is measured over three`);
    }
    table[field.identifier] = [r, g, b];
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
    ...staleComposedProblems(kotlin),
    ...THEMES.flatMap((theme) => [
      ...contrastProblems(kotlin, colourTable(tokens, theme), theme),
      ...pairProblems(kotlin, colourTable(tokens, theme), theme),
    ]),
    ...unmetProblems(kotlin, Object.fromEntries(THEMES.map((theme) => [theme, colourTable(tokens, theme)]))),
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
    + `${UNMET.size} bar(s) the pinned palette does not clear, each with the reason it is not raised here, `
    + `and ${OWED.size} ratio(s) waiting on a raised pin`,
  );
}

if (isMainModule(import.meta.url)) main();
