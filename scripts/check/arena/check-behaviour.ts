/* Every requirement the pinned contract declares reaches a native obligation on both layers,
 * every component it carries declares what it binds, and every binding closes over its
 * pattern. Nothing here renders: what it holds is that the declarations partition the
 * contract, never that a component behaves. Zero patterns, zero keys and zero components are
 * each a failure, since a gate that walked nothing reports no gaps behind a plausible line. */

import { isMainModule } from '../../utils/main-module.ts';
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
} from '../../lib/arena/behaviour-bindings.ts';

export const node = {
  name: 'check:behaviour',
  reads: [
    `${CONTRACTS_DIR}/${MANIFEST}`,
    `${CONTRACTS_DIR}/${BEHAVIOUR_PREFIX}**`,
    `${CONTRACTS_DIR}/${COMPONENTS_PREFIX}**`,
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

export function passLine(
  { patterns, keys, roles, components, published, absences }:
  { patterns: number; keys: number; roles: number; components: number; published: number; absences: number },
) {
  return `check-behaviour: ${patterns} pattern(s) from the pinned contract, ${keys} requirement key(s) and ${roles} role(s), `
    + `every one reaching a native obligation on both layers; ${components} component(s) declared, `
    + `${published} published and ${absences} recorded absence(s), every binding partitioning its pattern.\n`
    + '  (A green run says the declarations partition the contract, never that any component behaves,\n'
    + '   and a symbol a binding NAMES is not a symbol anything here compiled.)';
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
  for (const [component, entry] of BINDINGS) {
    errs.push(...bindingProblems(component, entry, patterns));
    errs.push(...crossLayerProblems(component, entry));
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
  }));
}

if (isMainModule(import.meta.url)) main();
