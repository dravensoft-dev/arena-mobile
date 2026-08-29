/* Every requirement the pinned contract declares reaches a native obligation on both layers,
 * every component it carries declares what it binds, and every binding closes over its pattern.
 * For a component this repository draws, a symbol a binding names as met is also a symbol that
 * layer's source carries: the last member of the symbol, at a word boundary, because a use site
 * spells `contentDescription` where the obligation names the property that holds it. Nothing
 * here renders, so what a present symbol says is that it is written and never that it is applied
 * to the right node. Zero patterns, keys or components are each a failure. */

import { readFileSync } from 'node:fs';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest } from '../../lib/contracts/payload.ts';
import { COMPONENTS_PREFIX, componentNames } from '../../lib/contracts/api-types.ts';
import {
  BEHAVIOUR_PREFIX, elementRoles, loadPatterns, requirementKeys, structureProblems,
} from '../../lib/contracts/behaviour.ts';
import {
  staleObligationProblems, staleRoleProblems, unmappedRoleProblems, untranslatedProblems,
} from '../../lib/arena/behaviour-obligations.ts';
import {
  BINDINGS, REASONLESS_PATTERNS, bindingLayers, bindingProblems, componentProblems, crossLayerProblems,
  isPublished, type Entry,
} from '../../lib/arena/behaviour-bindings.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import {
  KOTLIN_COMPONENTS, SWIFT_COMPONENTS, sourcesByLayer,
} from '../../lib/arena/component-sources.ts';
import { carries } from '../../lib/arena/native-symbol.ts';

export const node = {
  name: 'check:behaviour',
  reads: [
    `${CONTRACTS_DIR}/${MANIFEST}`,
    `${CONTRACTS_DIR}/${BEHAVIOUR_PREFIX}**`,
    `${CONTRACTS_DIR}/${COMPONENTS_PREFIX}**`,
    `${KOTLIN_COMPONENTS}/**`,
    `${SWIFT_COMPONENTS}/**`, `!${SWIFT_COMPONENTS}/**/*.generated.*`,
  ],
  writes: [],
  feeds: [],
};

export function zeroProblems({ patterns, keys, components }: { patterns: number; keys: number; components: number }) {
  const errs: string[] = [];
  if (patterns === 0) errs.push(`found 0 patterns under ${BEHAVIOUR_PREFIX}, so every claim below holds over a contract this gate never read`);
  if (keys === 0) errs.push('found 0 requirement keys, so every binding partitions an empty set and closes by meeting nothing');
  if (components === 0) errs.push(`found 0 components under ${COMPONENTS_PREFIX}, so the register is complete by naming nothing`);
  return errs;
}

export function symbolProblems(component: string, entry: Entry, layer: Layer, source: string | null) {
  if (source === null) {
    return [`${component} is published by the register and ${layer} carries no source for it, so every symbol its `
      + 'binding names would be held against a file this gate never opened'];
  }
  const binding = bindingLayers(entry).find((one) => one.layer === layer);
  const met = { ...binding?.met, ...Object.assign({}, ...(binding?.also ?? []).map((added) => added.met ?? {})) };
  return sortedByCodeUnit(Object.entries(met as Record<string, Partial<Record<Layer, string>>>)
    .flatMap(([key, answers]) => {
      const symbol = answers[layer];
      if (symbol === undefined || carries(source, symbol)) return [];
      return [`${component}:${layer} claims ${key} met by ${symbol}, and that source carries no such symbol. `
        + 'A requirement a browser met by rendering an element is applied by hand here, so a binding naming one '
        + 'nothing wrote is the silent hole this register exists to stop'];
    }));
}

export function publishedCount() {
  return [...BINDINGS.values()].filter(isPublished).length;
}

export function passLine(
  { patterns, keys, roles, components, published, absences, symbols }:
  { patterns: number; keys: number; roles: number; components: number; published: number; absences: number; symbols: number },
) {
  return `check-behaviour: ${patterns} pattern(s) from the pinned contract, ${keys} requirement key(s) and ${roles} role(s), `
    + `every one reaching a native obligation on both layers; ${components} component(s) declared, `
    + `${published} published and ${absences} recorded absence(s), every binding partitioning its pattern, `
    + `and ${symbols} symbol(s) found in the source of the layer that names them.\n`
    + '  (A green run says the declarations partition the contract, never that any component behaves,\n'
    + '   and a symbol found in a source is a symbol WRITTEN, never one applied to the right node.)';
}

function main() {
  const manifest = readManifest(root);
  const patterns = loadPatterns(root, manifest);
  const components = componentNames(manifest);
  const keys = requirementKeys(patterns);

  const errs = [
    ...zeroProblems({ patterns: patterns.size, keys: keys.length, components: components.length }),
    ...structureProblems([...patterns.values()]),
    ...untranslatedProblems(patterns),
    ...staleObligationProblems(patterns),
    ...unmappedRoleProblems(patterns),
    ...staleRoleProblems(patterns),
    ...componentProblems(components),
  ];
  const byLayer = sourcesByLayer(root, components);
  let symbols = 0;
  for (const [component, entry] of BINDINGS) {
    errs.push(...bindingProblems(component, entry, patterns));
    errs.push(...crossLayerProblems(component, entry));
    if (!isPublished(entry)) continue;
    for (const layer of LAYERS) {
      const path = byLayer.get(layer)?.get(component) ?? null;
      errs.push(...symbolProblems(component, entry, layer, path === null ? null : readFileSync(path, 'utf8')));
      const binding = bindingLayers(entry).find((one) => one.layer === layer);
      symbols += Object.keys(binding?.met ?? {}).length;
    }
  }

  if (errs.length) {
    console.error(`check-behaviour: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }

  const absences = [...BINDINGS.values()]
    .filter((entry) => bindingLayers(entry).every((binding) => REASONLESS_PATTERNS.includes(binding.pattern ?? ''))).length;
  console.log(passLine({
    patterns: patterns.size,
    keys: keys.length,
    roles: elementRoles(patterns).length,
    components: components.length,
    published: BINDINGS.size - absences,
    absences,
    symbols,
  }));
}

if (isMainModule(import.meta.url)) main();
