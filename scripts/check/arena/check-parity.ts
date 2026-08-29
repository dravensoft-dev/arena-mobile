/* One claim: each layer, over the enumeration both of them share, DRAWS the value its own seam
 * computes. The two renders never meet, because neither toolkit is the other's authority, and
 * what makes that an agreement is transitive: check:members holds one surface, the composition
 * gates hold one value behind it, and this holds each layer's drawing against that value. The
 * matrix is derived from the contract's own enum members rather than written here, both suites
 * carry it as a literal, and AXES names the claim the two of them spell alike beside the
 * authority it measures against. A claim found in a source is one that is WRITTEN and never one
 * applied to the right node, which is the admission check:behaviour makes about a symbol; what
 * closes the gap is that the measuring runs inside check:kotlin and check:swift. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { readJson } from '../../utils/read-json.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST } from '../../lib/contracts/payload.ts';
import { COMPONENTS_PREFIX, TYPES_PREFIX, type ApiType, type ComponentMember } from '../../lib/contracts/api-types.ts';
import { apiTypesOf } from '../../generate/arena/generate-api-types.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import { dirFor, suiteFor } from '../../lib/arena/layer-trees.ts';
import { MEMBERS, isAnswered } from '../../lib/arena/component-members.ts';
import { enumCases } from '../../lib/arena/api-emit.ts';
import { carries } from '../../lib/arena/native-symbol.ts';
import { componentsIn } from './check-target.ts';

export type Axis = { claim: string; authority: string; why: string };

export const CONSIDERED = [
  'activation box', 'boundary ink', 'boundary width', 'corner radius', 'focus ring', 'ground ink',
  'label baseline', 'label ink', 'label width', 'painted height', 'platform dispatch', 'reader text setting',
] as const;

export const AXES = new Map<string, Axis>([
  ['painted height', {
    claim: 'paintedHeight',
    authority: 'ArenaControl.height',
    why: 'the run of painted pixels down the column at the middle of the render, which is what says the drawing '
      + 'keeps the height the density scale names rather than the one a floor asks for. It renders on the base '
      + 'ladder with a floor passed, because a rung already above the floor grows by nothing and a control that '
      + 'took the box as its own minimum would draw the same pixels',
  }],
  ['activation box', {
    claim: 'activationBox',
    authority: 'ArenaControl.target',
    why: 'the height the host measures, with a floor and without one, as an equality rather than the inequality a '
      + 'control satisfies by growing. It is the one axis the fixture also renders at the base ladder, because no '
      + 'comfortable rung sits below the floor SwiftUI states and a floor that never binds asserts an identity',
  }],
  ['ground ink', {
    claim: 'groundInk',
    authority: 'ArenaButtonPaint.fill',
    why: 'the pixel at half the horizontal padding into the rectangle, at its vertical middle, which is past the '
      + 'boundary and short of the label. Where the fill is transparent it reads the declared ground, and that '
      + 'negative reading is what says a ghost draws none',
  }],
  ['boundary width', {
    claim: 'boundaryWidth',
    authority: 'ArenaContrast.border',
    why: 'the run of edge-coloured pixels inward from the first column of the rectangle, at its vertical middle, '
      + 'over both values of the increased contrast axis, because a boundary that ignores its argument draws one '
      + 'width for both and that is the defect WCAG 1.4.11 is about',
  }],
  ['boundary ink', {
    claim: 'boundaryInk',
    authority: 'ArenaButtonPaint.edge',
    why: 'the pixel at the middle of that run, or the first column itself where the run is empty, which is the '
      + 'other negative reading: a ghost draws no boundary either, and it is asserted rather than excused',
  }],
  ['corner radius', {
    claim: 'cornerRadius',
    authority: 'ArenaControl.radius',
    why: 'the unpainted deficit at the top row of the rectangle counted inward from its left edge, which is the '
      + 'one probe reading a curve rather than a length',
  }],
]);

const FACE_DECIDES = 'a face decides it and the two layers resolve different faces, because ArenaFonts takes the '
  + 'family from the consumer and a suite here falls back to whatever the platform registers. An equal reading '
  + 'would be a coincidence and an unequal one names no defect';

export const UNREACHED = new Map<string, string>([
  ['label ink', FACE_DECIDES],
  ['label width', FACE_DECIDES],
  ['label baseline', FACE_DECIDES],
  ['reader text setting', 'a linear multiply against a scale the caller passes on one layer and UIFontMetrics on '
    + 'the other, by design and for the reason each layer own page states. What the two share is the cap, and '
    + 'check:seams already holds it equal by the name each language spells it with'],
  ['focus ring', 'focus is a property of a live window and the SwiftUI instrument renders a detached view, so a '
    + 'fixture asking for it would assert the absence of a mechanism rather than the presence of a ring. '
    + 'check:affordances holds that both layers name the symbols that draw it'],
  ['platform dispatch', 'what the platform own hit test does with the box, which is already out in check:target '
    + 'with its reason: the Compose instrument answers the toolkit hit-test surface and a simulator hit test is '
    + "UIKit's own, so the two would be measuring two different things"],
]);

const GHOST_PAINTS_NOTHING = 'a ghost paints neither ground nor boundary, so no painted pixel bounds the column '
  + 'and none sits at the corner. What is drawn there is the label, whose extent a face decides';

const PRIMARY_EDGE_IS_ITS_FILL = 'a primary edge and its fill are one colour, so a run counted inward from the '
  + 'first column does not end where the boundary does';

export const UNDECIDABLE = new Map<string, string>([
  ['ghost.sm:paintedHeight', GHOST_PAINTS_NOTHING],
  ['ghost.md:paintedHeight', GHOST_PAINTS_NOTHING],
  ['ghost.lg:paintedHeight', GHOST_PAINTS_NOTHING],
  ['ghost.sm:cornerRadius', GHOST_PAINTS_NOTHING],
  ['ghost.md:cornerRadius', GHOST_PAINTS_NOTHING],
  ['ghost.lg:cornerRadius', GHOST_PAINTS_NOTHING],
  ['primary.sm:boundaryWidth', PRIMARY_EDGE_IS_ITS_FILL],
  ['primary.md:boundaryWidth', PRIMARY_EDGE_IS_ITS_FILL],
  ['primary.lg:boundaryWidth', PRIMARY_EDGE_IS_ITS_FILL],
]);

export const UNENUMERATED = new Map<string, string>([]);

export const CASE_BLOCKS: Record<Layer, { opens: RegExp; closes: RegExp; reference: RegExp }> = {
  compose: { opens: /^\s*private val CASES\b.*\($/, closes: /^\s*\)/, reference: /\b\w+\.([A-Z]\w*)\b/g },
  swiftui: { opens: /^\s*private let cases\b.*\[$/, closes: /^\s*\]/, reference: /\.([a-z]\w*)\b/g },
};

export const UNITS: Record<Layer, { pattern: RegExp; why: string }> = {
  compose: {
    pattern: /\bwith\(compose\.density\)/,
    why: 'the Compose suite converts through the rule own Density rather than assuming one pixel is one dp, and a '
      + 'suite that stops declaring it goes on passing while measuring in a unit the seam does not speak',
  },
  swiftui: {
    pattern: /\brenderer\.scale = renderScale\b/,
    why: 'the SwiftUI suite rasterises at the scale it declares and multiplies every contracted length by it, '
      + 'because a boundary one point wide is a run a one-pixel tolerance cannot tell from an absent one',
  },
};

export const node = {
  name: 'check:parity',
  reads: [
    `${CONTRACTS_DIR}/${MANIFEST}`,
    `${CONTRACTS_DIR}/${COMPONENTS_PREFIX}**`,
    `${CONTRACTS_DIR}/${TYPES_PREFIX}**`,
    ...LAYERS.flatMap((layer) => [
      `${dirFor(layer, 'components')}/**`,
      ...componentsIn(layer).map((component) => suiteFor(layer, component)),
    ]),
  ],
  writes: [],
  feeds: [],
};

export type Case = ReturnType<typeof enumCases>[number];
export type EnumAxis = { member: string; type: string; cases: Case[] };

export function memberFieldsOf(contract: { api?: Record<string, ComponentMember> }) {
  return new Map(Object.entries(contract.api ?? {}));
}

export function enumAxesOf(
  component: string,
  fields: ReadonlyMap<string, ComponentMember>,
  types: readonly ApiType[],
): EnumAxis[] {
  const answers = MEMBERS.get(component) ?? new Map();
  return [...answers].flatMap(([member, answer]) => {
    if (!isAnswered(answer)) return [];
    const field = fields.get(member);
    if (!field || field.form !== 'enum') return [];
    const type = types.find((one) => one.name === field.type);
    if (!type) return [];
    return [{ member, type: type.name, cases: enumCases(type) }];
  });
}

export function matrixOf(axes: readonly EnumAxis[]) {
  return axes.reduce<Case[][]>(
    (rows, axis) => rows.flatMap((row) => axis.cases.map((one) => [...row, one])),
    [[]],
  );
}

export function keyOf(row: readonly Case[]) {
  return row.map((one) => String(one.value)).join('.');
}

export function spellingOf(one: Case, layer: Layer) {
  return layer === 'compose' ? one.kotlin : one.swift;
}

export function caseLinesIn(source: string, block: { opens: RegExp; closes: RegExp }) {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => block.opens.test(line));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => block.closes.test(line));
  if (end < 0) return null;
  return rest.map((line) => line.trim()).slice(0, end).filter((line) => line.length > 0);
}

export function tupleOf(line: string, axes: readonly EnumAxis[], layer: Layer, blocks = CASE_BLOCKS) {
  const spellings = [...line.matchAll(blocks[layer].reference)].map((found) => found[1]);
  if (spellings.length !== axes.length) return null;
  const values = axes.map((axis, at) => axis.cases.find((one) => spellingOf(one, layer) === spellings[at])?.value);
  if (values.some((one) => one === undefined)) return null;
  return values.map((one) => String(one)).join('.');
}

export function matrixProblems(
  layer: Layer,
  component: string,
  lines: readonly string[],
  axes: readonly EnumAxis[],
  matrix: readonly Case[][],
) {
  const suite = suiteFor(layer, component);
  const errs: string[] = [];
  const found = new Set<string>();
  for (const line of lines) {
    const key = tupleOf(line, axes, layer);
    if (key === null) {
      errs.push(`${suite} spells a case this gate cannot resolve against the ${axes.length} enum member(s) the `
        + `contract crosses: ${JSON.stringify(line)}. A case list the gate reads as noise is a matrix nobody holds`);
      continue;
    }
    found.add(key);
  }
  const wanted = matrix.map(keyOf);
  errs.push(...wanted.filter((key) => !found.has(key)).map((key) => `${suite} enumerates no ${key}, and the pinned `
    + 'contract crosses it. A variant the payload adds has to enter the matrix rather than land in a silence'));
  errs.push(...[...found].filter((key) => !wanted.includes(key)).map((key) => `${suite} enumerates ${key}, and the `
    + 'pinned contract crosses no such case, so the suite measures a control this repository invented'));
  return sortedByCodeUnit(errs);
}

export function claimProblems(layer: Layer, component: string, source: string, axes = AXES) {
  const suite = suiteFor(layer, component);
  return sortedByCodeUnit([...axes].flatMap(([axis, one]) => [
    ...(carries(source, one.claim) ? [] : [`${suite} carries no ${one.claim} claim, so the ${axis} is drawn on this `
      + `layer and measured by nobody: ${one.why}`]),
    ...(carries(source, one.authority) ? [] : [`${suite} spells ${one.claim} and never ${one.authority}, so the `
      + `${axis} is measured against a number this repository did not compute: ${one.why}`]),
  ]));
}

export function unitProblems(layer: Layer, component: string, source: string, units = UNITS) {
  const { pattern, why } = units[layer];
  if (pattern.test(source)) return [];
  return [`${suiteFor(layer, component)} declares no unit, so a run it counts in pixels answers a contracted `
    + `length only by luck: ${why}`];
}

export function partitionProblems(axes = AXES, unreached = UNREACHED, considered: readonly string[] = CONSIDERED) {
  const errs = considered.flatMap((axis) => {
    const measured = axes.has(axis);
    const excused = unreached.has(axis);
    if (measured && excused) {
      return [`${axis} is measured by AXES and excused by UNREACHED, and a partition answering one axis twice is `
        + 'one going soft'];
    }
    if (!measured && !excused) {
      return [`${axis} is an axis of a render this gate declares, and neither AXES measures it nor UNREACHED `
        + 'excuses it. Silence over an axis is the ambiguity this partition exists to end'];
    }
    return [];
  });
  const declared = new Set(considered);
  errs.push(...[...axes.keys(), ...unreached.keys()].filter((axis) => !declared.has(axis))
    .map((axis) => `${axis} is answered and CONSIDERED does not declare it, so the two halves partition a set `
      + 'neither of them agrees on'));
  return sortedByCodeUnit(errs);
}

export function staleUndecidableProblems(
  cases: readonly string[],
  axes = AXES,
  undecidable = UNDECIDABLE,
) {
  const crossed = new Set(cases);
  const claims = new Set([...axes.values()].map((one) => one.claim));
  return sortedByCodeUnit([...undecidable].flatMap(([entry, why]) => {
    const at = entry.lastIndexOf(':');
    const one = entry.slice(0, at);
    const claim = entry.slice(at + 1);
    if (!crossed.has(one)) {
      return [`UNDECIDABLE excuses ${entry} and the derived matrix crosses no ${one}, so the exception outlived `
        + `the case it excused: ${why}`];
    }
    if (!claims.has(claim)) {
      return [`UNDECIDABLE excuses ${entry} and AXES measures no ${claim}, so the exception excuses an axis `
        + `nothing asks for: ${why}`];
    }
    return [];
  }));
}

export function enumerationProblems(
  components: readonly string[],
  enumerated: ReadonlyMap<string, ReadonlySet<string>>,
  unenumerated = UNENUMERATED,
) {
  return sortedByCodeUnit(components.flatMap((component) => {
    if (unenumerated.has(component)) return [];
    return LAYERS.filter((layer) => !(enumerated.get(layer) ?? new Set<string>()).has(component))
      .map((layer) => `${component} is drawn and ${suiteFor(layer, component)} carries no case list, so what this `
        + 'layer draws is held over no enumeration at all and UNENUMERATED excuses none');
  }));
}

export function staleUnenumeratedProblems(components: readonly string[], unenumerated = UNENUMERATED) {
  const drawn = new Set(components);
  return sortedByCodeUnit([...unenumerated].filter(([component]) => !drawn.has(component))
    .map(([component, why]) => `UNENUMERATED excuses ${component} and neither tree draws it, so the exception `
      + `outlived what it excused: ${why}`));
}

export function zeroComponentProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked both component directories and found no component at all, so every claim below closes over '
    + 'nothing while reporting a clean pass';
}

export function zeroAxisProblem(counted: number) {
  if (counted > 0) return null;
  return 'AXES measures nothing, so both suites are held to carrying no claim and a render nobody probes passes';
}

export function zeroMatrixProblem(component: string, counted: number) {
  if (counted > 0) return null;
  return `${component} crosses no enum member at all, so its matrix is one empty case and every suite below is `
    + 'held against it';
}

export function zeroCaseProblem(counted: number) {
  if (counted > 0) return null;
  return 'read no case out of any suite, so the enumeration both layers are held to is the empty one';
}

function main() {
  const types = apiTypesOf(root);
  const components = sortedByCodeUnit([...new Set(LAYERS.flatMap((layer) => componentsIn(layer)))]);
  const noComponent = zeroComponentProblem(components.length);
  const noAxis = zeroAxisProblem(AXES.size);
  const errs: string[] = [
    ...partitionProblems(),
    ...(noComponent ? [noComponent] : []),
    ...(noAxis ? [noAxis] : []),
  ];

  const enumerated = new Map<string, Set<string>>(LAYERS.map((layer) => [layer, new Set<string>()]));
  const crossed = new Set<string>();
  let read = 0;

  for (const component of components) {
    const at = join(root, CONTRACTS_DIR, `${COMPONENTS_PREFIX}${component}.json`);
    const contract = readJson(at) as { api?: Record<string, ComponentMember> };
    const axes = enumAxesOf(component, memberFieldsOf(contract), types);
    const empty = zeroMatrixProblem(component, axes.length);
    if (empty) { errs.push(empty); continue; }
    const matrix = matrixOf(axes);
    for (const row of matrix) crossed.add(keyOf(row));

    for (const layer of LAYERS) {
      const path = join(root, suiteFor(layer, component));
      const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
      const lines = caseLinesIn(source, CASE_BLOCKS[layer]);
      if (lines === null || lines.length === 0) continue;
      enumerated.get(layer)?.add(component);
      read += lines.length;
      errs.push(
        ...matrixProblems(layer, component, lines, axes, matrix),
        ...claimProblems(layer, component, source),
        ...unitProblems(layer, component, source),
      );
    }
  }

  const noCase = zeroCaseProblem(read);
  errs.push(
    ...enumerationProblems(components, enumerated),
    ...staleUnenumeratedProblems(components),
    ...staleUndecidableProblems([...crossed]),
    ...(noCase ? [noCase] : []),
  );

  if (errs.length) {
    console.error(`check-parity: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(
    `check-parity: ${components.length} component(s) enumerated on both layers over ${crossed.size} contracted `
    + `case(s) and ${AXES.size} axis(es), ${read} case(s) read out of the suites, with ${UNREACHED.size} axis(es) `
    + `out of reach and ${UNDECIDABLE.size} case-axis pair(s) undecidable, each with its reason`,
  );
  console.log(
    '  (A green run says the claim exists over the enumeration both layers share, against the authority the map\n'
    + '   names, never that a suite measured the right node.)',
  );
}

if (isMainModule(import.meta.url)) main();
