/* One claim: every control either tree draws offers the box its caller's floor asks for, measured
 * on a render by the suite beside it rather than here. What this gate holds is the half a render
 * cannot: the platform floor written by hand in two languages is the number FLOORS states, each
 * floor is tied to the contracted rung whose own description argues it, and every component the
 * walk finds is measured on both layers or excepted in UNBOXED with its reason. A suite named here
 * is a suite that exists, never one that measured the right node, which is the admission
 * check:behaviour makes about a symbol found in a source; what closes the gap is that the
 * measuring runs inside check:kotlin and check:swift. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import { EXTENSIONS, SUITE_ROOTS, dirFor } from '../../lib/arena/layer-trees.ts';
import { CONTRACTS_DIR, DENSITIES, type Density } from '../../lib/contracts/payload.ts';
import { densityTokens } from '../../lib/arena/emit.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';
import { RUNGS } from './check-control.ts';

export const FLOORS: Record<Layer, { points: number; why: string }> = {
  compose: {
    points: 48,
    why: 'the 48dp Android asks for a tappable area, which is a constant of that platform rather than a value any '
      + 'contract carries, so it is written by hand here and in the suite that measures with it and nowhere else',
  },
  swiftui: {
    points: 44,
    why: 'the 44 points Apple asks for a tappable area, for the reason the Compose floor carries, and the two '
      + 'differ because the platforms do',
  },
};

export const FLOOR_PATTERNS: Record<Layer, RegExp> = {
  compose: /^\s*private val TOUCH_FLOOR: Dp = (\d+)\.dp$/,
  swiftui: /^\s*private let touchFloor: CGFloat = (\d+)$/,
};

export const SUITES: Record<Layer, string> = {
  compose: `${SUITE_ROOTS.compose}/ArenaButtonTest.kt`,
  swiftui: `${SUITE_ROOTS.swiftui}/ArenaButtonTests.swift`,
};

export const HEIGHT_MARK = 'height.';

export const ARGUED = new Map<Layer, { token: string; density: Density; why: string }>([
  ['compose', {
    token: 'dz.ctl-h',
    density: 'comfortable',
    why: 'the floor is a number here and the density it is measured against is a number in a token file, and '
      + 'nothing but this entry makes them one claim. The comfortable ladder argues its own control height against '
      + 'exactly this figure, so a rung that drops below it stops answering the floor this repository measures against',
  }],
  ['swiftui', {
    token: 'dz.ctl-h-sm',
    density: 'comfortable',
    why: 'the same tie one rung down, because the comfortable file argues that its SMALLEST control clears what a '
      + 'thumb needs, and that rung is what stands level with this platform floor rather than above it',
  }],
]);

export const UNBOXED = new Map<string, string>([]);

export const node = {
  name: 'check:target',
  reads: [
    `${CONTRACTS_DIR}/contracts/design/spacing.json`,
    `${CONTRACTS_DIR}/contracts/design/density.compact.json`,
    `${CONTRACTS_DIR}/contracts/design/density.comfortable.json`,
    ...LAYERS.flatMap((layer) => [`${dirFor(layer, 'components')}/**`, SUITES[layer]]),
  ],
  writes: [],
  feeds: [],
};

export type Rung = { name: string; density: Density; points: number };

export function floorIn(source: string, pattern: RegExp) {
  for (const line of source.split('\n')) {
    const match = pattern.exec(line);
    if (match) return Number(captured(match));
  }
  return null;
}

export function floorProblems(layer: Layer, read: number | null, floors = FLOORS, suites = SUITES) {
  const floor = floors[layer];
  if (read === null) {
    return [`${suites[layer]} names no floor at all, so the suite that measures the activation box measures it `
      + `against nothing this gate can read: ${floor.why}`];
  }
  if (read !== floor.points) {
    return [`${suites[layer]} measures against ${read} and this gate states ${floor.points}, so one number is `
      + `written twice in two places and the two disagree: ${floor.why}`];
  }
  return [];
}

export function clearances(rungs: readonly Rung[], floors = FLOORS) {
  return LAYERS.flatMap((layer) => rungs.map((rung) => ({
    layer, ...rung, clears: rung.points >= floors[layer].points,
  })));
}

export function decorativeProblems(rows: ReturnType<typeof clearances>, floors = FLOORS) {
  return sortedByCodeUnit(LAYERS.flatMap((layer) => {
    const mine = rows.filter((row) => row.layer === layer);
    if (mine.length === 0 || mine.some((row) => !row.clears)) return [];
    return [`every rung the pinned contract carries already clears the ${floors[layer].points} this layer floors `
      + 'at, so the activation box composes a floor nothing ever reaches and the seam is ceremony. Either the '
      + 'floor moved or the ladder did, and one of the two is wrong'];
  }));
}

export function arguedProblems(rungs: readonly Rung[], argued = ARGUED, floors = FLOORS) {
  return sortedByCodeUnit([...argued].flatMap(([layer, tie]) => {
    const rung = rungs.find((one) => one.name === tie.token && one.density === tie.density);
    if (!rung) {
      return [`ARGUED ties the ${layer} floor to ${tie.token} in the ${tie.density} density, and the pinned `
        + `contract carries no rung by that name there: ${tie.why}`];
    }
    if (rung.points < floors[layer].points) {
      return [`${tie.token} is ${rung.points} in the ${tie.density} density and the ${layer} floor is `
        + `${floors[layer].points}, so the rung that argues this floor no longer clears it: ${tie.why}`];
    }
    return [];
  }));
}

export function partitionProblems(
  components: readonly string[],
  measured: ReadonlyMap<string, ReadonlySet<string>>,
  unboxed = UNBOXED,
  suites = SUITES,
) {
  return sortedByCodeUnit(components.flatMap((component) => {
    if (unboxed.has(component)) return [];
    return LAYERS.filter((layer) => !(measured.get(layer) ?? new Set<string>()).has(component))
      .map((layer) => `${component} is drawn and ${suites[layer]} measures no activation box for it, and UNBOXED `
        + 'excuses none. A control whose target is held on one layer and not the other offers a thumb two libraries');
  }));
}

export function staleUnboxedProblems(components: readonly string[], unboxed = UNBOXED) {
  const drawn = new Set(components);
  return sortedByCodeUnit([...unboxed].filter(([component]) => !drawn.has(component))
    .map(([component, why]) => `UNBOXED excuses ${component} and neither tree draws it, so the exception outlived `
      + `what it excused: ${why}`));
}

export function zeroComponentProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked both component directories and found no component at all, so every claim below closes over '
    + 'nothing while reporting a clean pass';
}

export function zeroMeasuredProblem(counted: number) {
  if (counted > 0) return null;
  return 'measured nothing, because no suite named a floor, so the two floors below were compared against a '
    + 'render nobody made';
}

export function heightTokens(rungs = RUNGS) {
  return sortedByCodeUnit([...new Set([...rungs]
    .filter(([key]) => key.startsWith(HEIGHT_MARK))
    .map(([, rung]) => rung.token))]);
}

export function pxOf(value: unknown) {
  const length = value as { value?: unknown; unit?: unknown };
  if (typeof length?.value !== 'number' || length.unit !== 'px') return null;
  return length.value;
}

export function rungsOf(all: ReturnType<typeof tokensOf>, wanted = heightTokens()) {
  return DENSITIES.flatMap((density) => densityTokens(all, density).flatMap((field) => {
    if (!wanted.includes(field.token.name)) return [];
    const points = pxOf(field.token.value);
    return points === null ? [] : [{ name: field.token.name, density, points }];
  }));
}

export function componentsIn(layer: Layer, present = root) {
  const dir = join(present, dirFor(layer, 'components'));
  return walkFiles(dir, (rel) => rel.endsWith(EXTENSIONS[layer]) && !rel.includes('.generated.'), dir)
    .map((rel) => rel.slice(rel.lastIndexOf('/') + 1, -EXTENSIONS[layer].length));
}

function main() {
  const tokens = tokensOf(root);
  const rungs = rungsOf(tokens);
  const components = sortedByCodeUnit([...new Set(LAYERS.flatMap((layer) => componentsIn(layer)))]);
  const measured = new Map<string, ReadonlySet<string>>();
  const errs: string[] = [];
  let floorsRead = 0;

  for (const layer of LAYERS) {
    const path = join(root, SUITES[layer]);
    const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const floor = floorIn(source, FLOOR_PATTERNS[layer]);
    if (floor !== null) floorsRead += 1;
    errs.push(...floorProblems(layer, floor));
    measured.set(layer, new Set(components.filter((component) => source.includes(component))));
  }

  const noComponent = zeroComponentProblem(components.length);
  const noMeasure = zeroMeasuredProblem(floorsRead);
  errs.push(
    ...(noComponent ? [noComponent] : []),
    ...(noMeasure ? [noMeasure] : []),
    ...arguedProblems(rungs),
    ...decorativeProblems(clearances(rungs)),
    ...partitionProblems(components, measured),
    ...staleUnboxedProblems(components),
  );

  if (errs.length) {
    console.error(`check-target: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }

  const below = clearances(rungs).filter((row) => !row.clears);
  console.log(
    `check-target: ${components.length} component(s) drawn and measured on both layers over `
    + `${rungs.length} rung(s), against ${FLOORS.compose.points} on Compose and ${FLOORS.swiftui.points} on `
    + `SwiftUI, each tied to the rung arguing it; ${below.length} rung(s) sit below a floor and are what the `
    + `activation box is for, and ${UNBOXED.size} geometry(ies) are excepted with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
