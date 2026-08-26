/* Two halves of one claim over the authored value tier. The first partitions every authored
 * source under each layer's tokens/ and theme/ into one a named gate already holds, saying which,
 * or one held here across the two layers; a file in neither is the silence this gate exists to
 * end, and a file one layer carries alone is one contract offering two libraries. The second
 * holds every hand-declared numeric constant equal on both sides, by the name each layer spells
 * it with. That is Arena's duplicate-constants read for two languages with no shared text: what
 * crosses between Kotlin and Swift is the name and the value, and never the body. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import { EXTENSIONS, dirFor } from '../../lib/arena/layer-trees.ts';
import { GATES } from './check-all.ts';

export const HELD_PARTITIONS = ['theme', 'tokens'] as const;

export const node = {
  name: 'check:seams',
  reads: LAYERS.flatMap((layer) => HELD_PARTITIONS.flatMap((partition) => [
    `${dirFor(layer, partition)}/**`,
    `!${dirFor(layer, partition)}/**/*.generated.*`,
  ])),
  writes: [],
  feeds: [],
};

export const HELD_BY = new Map<string, { gate: string; why: string }>([
  ['ArenaComposition', {
    gate: 'check:composition',
    why: 'the aliases both layers compose out of the emitted palette, measured over the grounds Arena set its bars against',
  }],
  ['ArenaContrast', {
    gate: 'check:contrast',
    why: 'the three cases increased contrast and reduced transparency answer, each over the contracted operand the composition names',
  }],
  ['ArenaControl', {
    gate: 'check:control',
    why: "a control's geometry, collapsed onto the contracted step each role states it is born at",
  }],
  ['ArenaFonts', {
    gate: 'check:fonts',
    why: 'the face a consumer hands over, and the generic each contracted family falls back to',
  }],
  ['ArenaMotion', {
    gate: 'check:motion',
    why: 'the three classes of motion the reduced-motion policy states, and what each returns',
  }],
  ['ArenaSafeArea', {
    gate: 'check:environment',
    why: "the device's own geometry, composed with the floor each edge carries",
  }],
]);

export const HELD_HERE = new Map<string, string>([
  ['ArenaScale', 'the cap and the two asymmetric conversions. No seam gate reads it, and it is where a value read '
    + 'off the other layer compiles and is wrong by a factor of the font size, so the constant half below is what '
    + 'holds the cap equal'],
  ['ArenaSupport', 'the composite types the emit constructs and the shadow modifier. They carry a shape rather than '
    + 'composing a contracted value, so no seam gate has a composition to hold them to'],
  ['ArenaTheme', 'the channel colors, density and fonts reach a tree by. It composes no contracted value at all, '
    + 'which is why no seam gate reads it and why what it owes is a member on both layers rather than a body'],
]);

export const KOTLIN_CONSTANT = /^\s*public const val (\w+): (?:Float|Double|Int|Long) = (-?\d+(?:\.\d+)?)[fL]?$/;
export const SWIFT_CONSTANT = /^\s*public static let (\w+): (?:CGFloat|Double|Int|TimeInterval) = (-?\d+(?:\.\d+)?)$/;

export const PATTERNS: Record<Layer, RegExp> = { compose: KOTLIN_CONSTANT, swiftui: SWIFT_CONSTANT };

export function normalised(name: string) {
  return name.replace(/_/g, '').toLowerCase();
}

export function constantsIn(source: string, pattern: RegExp) {
  const found = new Map<string, { spelling: string; value: number }>();
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (!match) continue;
    found.set(normalised(captured(match)), { spelling: captured(match), value: Number(captured(match, 2)) });
  }
  return found;
}

export function partitionProblems(
  subjects: ReadonlySet<string>,
  gated_ = HELD_BY,
  here_ = HELD_HERE,
) {
  const errs: string[] = [];
  for (const subject of subjects) {
    const gated = gated_.get(subject);
    const here = here_.get(subject);
    if (gated && here !== undefined) {
      errs.push(`${subject} is named in HELD_BY and in HELD_HERE, and a seam is held by a gate or held here. `
        + 'Two answers for one file is the partition going soft');
    }
    if (!gated && here === undefined) {
      errs.push(`${subject} is an authored source of the value tier and neither HELD_BY nor HELD_HERE names it, so `
        + 'no gate anywhere reads it and nothing fails when the two layers stop agreeing about what it says');
    }
  }
  return sortedByCodeUnit(errs);
}

export function staleHeldByProblems(subjects: ReadonlySet<string>, gates: readonly { name: string }[] = GATES) {
  const registered = new Set(gates.map((gate) => gate.name));
  return sortedByCodeUnit([...HELD_BY].flatMap(([subject, held]) => {
    if (!subjects.has(subject)) {
      return [`HELD_BY hands ${subject} to ${held.gate} and neither layer carries a source by that name: ${held.why}`];
    }
    if (!registered.has(held.gate)) {
      return [`HELD_BY hands ${subject} to ${held.gate}, which GATES does not register, so the seam is handed to a `
        + 'gate no sweep runs and the claim is made by nobody'];
    }
    return [];
  }));
}

export function staleHeldHereProblems(subjects: ReadonlySet<string>) {
  return sortedByCodeUnit([...HELD_HERE].flatMap(([subject, why]) => (subjects.has(subject)
    ? []
    : [`HELD_HERE names ${subject} and neither layer carries a source by that name: ${why}`])));
}

export function parityProblems(byLayer: ReadonlyMap<Layer, ReadonlySet<string>>) {
  return sortedByCodeUnit(LAYERS.flatMap((layer) => {
    const mine = byLayer.get(layer) ?? new Set<string>();
    const others = LAYERS.filter((one) => one !== layer);
    return [...mine]
      .filter((subject) => others.some((other) => !(byLayer.get(other) ?? new Set<string>()).has(subject)))
      .map((subject) => `${subject} is an authored seam on ${layer} and not on ${others.join(' and ')}, so one `
        + 'contract offers a consumer two libraries');
  }));
}

export function constantProblems(byLayer: ReadonlyMap<Layer, ReadonlyMap<string, { spelling: string; value: number }>>) {
  const errs: string[] = [];
  const [first, second] = LAYERS;
  const one = byLayer.get(first) ?? new Map();
  const other = byLayer.get(second) ?? new Map();
  for (const [name, mine] of one) {
    const across = other.get(name);
    if (across === undefined) {
      errs.push(`${first} declares ${mine.spelling} by hand and ${second} declares no constant of that name. A value `
        + 'written in one language and not the other is the cap this repository must state and states once');
      continue;
    }
    if (across.value !== mine.value) {
      errs.push(`${mine.spelling} is ${mine.value} on ${first} and ${across.spelling} is ${across.value} on ${second}. `
        + 'A constant changed on one layer alone compiles, passes that layer\'s own suite, and ships two libraries '
        + 'from one contract');
    }
  }
  for (const [name, across] of other) {
    if (!one.has(name)) {
      errs.push(`${second} declares ${across.spelling} by hand and ${first} declares no constant of that name. A value `
        + 'written in one language and not the other is the cap this repository must state and states once');
    }
  }
  return sortedByCodeUnit(errs);
}

export function zeroSubjectProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked the value tier of both layers and found no authored source at all, so this partition closes by '
    + 'naming nothing and every seam below is held over a tree this gate never opened';
}

export function zeroConstantProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 hand-declared numeric constants out of either layer, which is what this gate looks like when the two '
    + 'patterns stop matching how a constant is declared, and a comparison over an empty set compares nothing';
}

function main() {
  const byLayer = new Map<Layer, Set<string>>();
  const constants = new Map<Layer, Map<string, { spelling: string; value: number }>>();
  const subjects = new Set<string>();

  for (const layer of LAYERS) {
    const extension = EXTENSIONS[layer];
    const mine = new Set<string>();
    const found = new Map<string, { spelling: string; value: number }>();
    for (const partition of HELD_PARTITIONS) {
      const dir = dirFor(layer, partition);
      for (const rel of walkFiles(join(root, dir), (one) => one.endsWith(extension) && !one.includes('.generated.'))) {
        mine.add(rel.slice(rel.lastIndexOf('/') + 1, -extension.length));
        for (const [name, one] of constantsIn(readFileSync(join(root, dir, rel), 'utf8'), PATTERNS[layer])) {
          found.set(name, one);
        }
      }
    }
    for (const subject of mine) subjects.add(subject);
    byLayer.set(layer, mine);
    constants.set(layer, found);
  }

  const counted = [...constants.values()].reduce((total, found) => total + found.size, 0);
  const noSubject = zeroSubjectProblem(subjects.size);
  const noConstant = zeroConstantProblem(counted);
  const errs = [
    ...(noSubject ? [noSubject] : []),
    ...(noConstant ? [noConstant] : []),
    ...partitionProblems(subjects),
    ...staleHeldByProblems(subjects),
    ...staleHeldHereProblems(subjects),
    ...parityProblems(byLayer),
    ...constantProblems(constants),
  ];

  if (errs.length) {
    console.error(`check-seams: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-seams: ${subjects.size} authored seam(s) carried by both layers, ${HELD_BY.size} of them handed to a `
    + `registered gate with the reason and ${HELD_HERE.size} held here, and `
    + `${(constants.get('compose') ?? new Map()).size} hand-declared constant(s) equal across the two languages by `
    + 'the name each one spells them with',
  );
}

if (isMainModule(import.meta.url)) main();
