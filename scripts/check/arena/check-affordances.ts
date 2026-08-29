/* Every affordance a component contract declares is drawn, naming the native symbol that draws it,
 * or excepted with its reason, on both layers. Arena gets focus, hover and press from a browser
 * rendering an element and neither toolkit renders one, so each is an explicit obligation here and
 * a register that partitions is the only shape that says so. Keyed by the contract rather than by
 * what this repository publishes, so a component the payload gains is a hole rather than a
 * silence. Nothing here renders: a symbol found in a source is one that is WRITTEN, never one
 * applied to the right node. */

import { readFileSync } from 'node:fs';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { readJson } from '../../utils/read-json.ts';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest } from '../../lib/contracts/payload.ts';
import { COMPONENTS_PREFIX, componentNames } from '../../lib/contracts/api-types.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import { KOTLIN_COMPONENTS, SWIFT_COMPONENTS, sourcesByLayer } from '../../lib/arena/component-sources.ts';
import {
  AFFORDANCES, DRAWN, answersOf, componentProblems, isDrawn, partitionProblems, presenceProblems,
  symbolProblems, vocabularyProblems,
} from '../../lib/arena/affordance-bindings.ts';

export const node = {
  name: 'check:affordances',
  reads: [
    `${CONTRACTS_DIR}/${MANIFEST}`,
    `${CONTRACTS_DIR}/${COMPONENTS_PREFIX}**`,
    `${KOTLIN_COMPONENTS}/**`,
    `${SWIFT_COMPONENTS}/**`, `!${SWIFT_COMPONENTS}/**/*.generated.*`,
  ],
  writes: [],
  feeds: [],
};

export function affordancesOf(contract: { affordances?: unknown }) {
  const declared = contract.affordances;
  return Array.isArray(declared) ? sortedByCodeUnit(declared.map(String)) : [];
}

export function zeroComponentProblem(counted: number) {
  if (counted > 0) return null;
  return `found 0 components under ${COMPONENTS_PREFIX}, so this register is complete by naming nothing`;
}

export function zeroAffordanceProblem(counted: number) {
  if (counted > 0) return null;
  return 'read 0 affordances out of every component contract, which is what this gate looks like when the field it '
    + 'partitions stops being written, and a partition over an empty set closes by answering nothing';
}

export function zeroAnswerProblem(counted: number) {
  if (counted > 0) return null;
  return 'no component in DRAWN answers an affordance at all, so every entry is a recorded absence and this gate '
    + 'holds a claim about nothing this repository draws';
}

export function passLine(
  { components, affordances, drawn, excepted, symbols }:
  { components: number; affordances: number; drawn: number; excepted: number; symbols: number },
) {
  return `check-affordances: ${components} component(s) declared by the pinned contract, each with an entry, over `
    + `${affordances} affordance(s) this repository states a capability for; ${drawn} drawn by a named native symbol `
    + `and ${excepted} excepted with a reason, and ${symbols} symbol(s) found in the source of the layer that names them.\n`
    + '  (A green run says the register partitions the contract, never that a reader sees anything,\n'
    + '   and a symbol found in a source is a symbol WRITTEN, never one applied to the right node.)';
}

function main() {
  const manifest = readManifest(root);
  const components = componentNames(manifest);
  const byLayer = sourcesByLayer(root, components);

  const declared = new Map<string, string[]>(components.map((component) => [
    component,
    affordancesOf(readJson(join(root, CONTRACTS_DIR, `${COMPONENTS_PREFIX}${component}.json`))),
  ]));
  const vocabulary = sortedByCodeUnit([...new Set([...declared.values()].flat())]);

  const errs: string[] = [
    ...componentProblems(components),
    ...vocabularyProblems(vocabulary),
  ];
  let drawn = 0;
  let excepted = 0;
  let symbols = 0;

  for (const [component, entry] of DRAWN) {
    const asked = declared.get(component) ?? [];
    errs.push(...partitionProblems(component, entry, asked));
    const drawnBy = new Set(LAYERS.filter((layer) => byLayer.get(layer)?.has(component)));
    errs.push(...presenceProblems(component, entry, drawnBy));
    for (const answer of Object.values(answersOf(entry))) {
      if (isDrawn(answer)) drawn += 1;
      else excepted += 1;
    }
    for (const layer of drawnBy) {
      const path = byLayer.get(layer)?.get(component) ?? null;
      const source = path === null ? null : readFileSync(path, 'utf8');
      errs.push(...symbolProblems(component, entry, layer, source));
      symbols += Object.values(answersOf(entry)).filter(isDrawn).length;
    }
  }

  const noComponent = zeroComponentProblem(components.length);
  const noAffordance = zeroAffordanceProblem(vocabulary.length);
  const noAnswer = zeroAnswerProblem(drawn + excepted);
  errs.push(
    ...(noComponent ? [noComponent] : []),
    ...(noAffordance ? [noAffordance] : []),
    ...(noAnswer ? [noAnswer] : []),
  );

  if (errs.length) {
    console.error(`check-affordances: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(passLine({ components: components.length, affordances: AFFORDANCES.size, drawn, excepted, symbols }));
}

if (isMainModule(import.meta.url)) main();
