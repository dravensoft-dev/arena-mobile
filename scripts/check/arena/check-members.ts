/* One claim: a component this repository draws presents the members its contract declares, with
 * the type and the default the contract declares for each, and nothing else it authored. The two
 * directions are separate questions and both are asked. The type and the default are DERIVED from
 * the contract rather than retyped beside the parameter name, because the API emitter already
 * answers both for every form the contract types by type, and a second copy drifts the first time
 * a form changes. Which components are asked about is decided by walking the two source trees, so
 * a component that lands and is not registered is a failure and never a silence. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { readJson } from '../../utils/read-json.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest } from '../../lib/contracts/payload.ts';
import {
  COMPONENTS_PREFIX, componentNames, type ApiType, type ComponentMember,
} from '../../lib/contracts/api-types.ts';
import { apiTypesOf } from '../../generate/arena/generate-api-types.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import {
  KOTLIN_COMPONENTS, SWIFT_COMPONENTS, drawnComponents, layerCoverageProblems, sourcesByLayer,
} from '../../lib/arena/component-sources.ts';
import {
  DERIVED_DEFAULT, MEMBERS, isAnswered, parameterProblems, partitionProblems, shapeProblems,
  staleComponentProblems, staleDerivedProblems, staleExtraProblems, type Parameter,
} from '../../lib/arena/component-members.ts';

export const node = {
  name: 'check:members',
  reads: [
    `${CONTRACTS_DIR}/${MANIFEST}`,
    `${CONTRACTS_DIR}/${COMPONENTS_PREFIX}**`,
    `${KOTLIN_COMPONENTS}/**`,
    `${SWIFT_COMPONENTS}/**`, `!${SWIFT_COMPONENTS}/**/*.generated.*`,
  ],
  writes: [],
  feeds: [],
};

export const SIGNATURES: Record<Layer, { opens: (component: string) => RegExp; parameter: RegExp }> = {
  compose: {
    opens: (component) => new RegExp(`^public fun ${component}\\($`),
    parameter: /^\s{4}(\w+):\s*([^=,]+?)\s*(?:=\s*(.+?))?,?$/,
  },
  swiftui: {
    opens: () => /^\s*public init\($/,
    parameter: /^\s*(?:_\s+)?(\w+):\s*([^=,]+?)\s*(?:=\s*(.+?))?,?$/,
  },
};

export function parametersIn(source: string, opens: RegExp, parameter: RegExp) {
  const found = new Map<string, Parameter>();
  let open = false;
  for (const line of source.split('\n')) {
    if (!open) { open = opens.test(line); continue; }
    if (/^\s*\)/.test(line)) break;
    const match = parameter.exec(line);
    if (match?.[1] && match[2]) found.set(match[1], { type: match[2], default: match[3] ?? null });
  }
  return found;
}

export function memberFieldsOf(contract: { api?: Record<string, ComponentMember> }) {
  return new Map(Object.entries(contract.api ?? {}));
}

export function memberShapeProblems(
  component: string,
  fields: ReadonlyMap<string, ComponentMember>,
  parameters: ReadonlyMap<string, Parameter>,
  types: readonly ApiType[],
  layer: Layer,
) {
  const answers = MEMBERS.get(component) ?? new Map();
  return sortedByCodeUnit([...answers].flatMap(([member, answer]) => {
    if (!isAnswered(answer)) return [];
    const field = fields.get(member);
    const parameter = parameters.get(answer.parameter);
    if (!field || !parameter) return [];
    return shapeProblems(component, member, field, parameter, types, layer);
  }));
}

export function memberNamesOf(contract: { api?: Record<string, unknown> }) {
  return sortedByCodeUnit(Object.keys(contract.api ?? {}));
}

export function zeroDrawnProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked both source trees and found no component at all, so this partition holds over a repository that '
    + 'draws nothing while reporting a clean pass. MEMBERS is what should be empty in that case, and it is not';
}

export function zeroMemberProblem(component: string, counted: number) {
  if (counted > 0) return null;
  return `${component} declares 0 members in the pinned contract, so its partition closes by answering nothing`;
}

function main() {
  const manifest = readManifest(root);
  const carried = componentNames(manifest);
  const types = apiTypesOf(root);
  const byLayer = sourcesByLayer(root, carried);
  const drawn = drawnComponents(byLayer);
  const zero = zeroDrawnProblem(drawn.length + MEMBERS.size);

  const errs: string[] = [...(zero ? [zero] : []), ...staleComponentProblems(drawn)];
  const everyMember = new Set<string>();
  let members = 0;
  let shapes = 0;
  for (const component of drawn) {
    const at = join(root, CONTRACTS_DIR, `${COMPONENTS_PREFIX}${component}.json`);
    const contract = readJson(at) as { api?: Record<string, ComponentMember> };
    const declared = memberNamesOf(contract);
    const fields = memberFieldsOf(contract);
    for (const member of declared) everyMember.add(member);
    const empty = zeroMemberProblem(component, declared.length);
    if (empty) errs.push(empty);
    members += declared.length;
    errs.push(...layerCoverageProblems(component, byLayer));
    errs.push(...partitionProblems(component, declared));
    const parameters = new Map<Layer, ReadonlySet<string>>();
    for (const layer of LAYERS) {
      const path = byLayer.get(layer)?.get(component);
      if (path === undefined) continue;
      const { opens, parameter } = SIGNATURES[layer];
      const found = parametersIn(readFileSync(path, 'utf8'), opens(component), parameter);
      parameters.set(layer, new Set(found.keys()));
      errs.push(...parameterProblems(component, new Set(found.keys()), layer));
      errs.push(...memberShapeProblems(component, fields, found, types, layer));
      shapes += found.size;
    }
    errs.push(...staleExtraProblems(component, parameters));
  }
  errs.push(...staleDerivedProblems(everyMember));

  if (errs.length) {
    console.error(`check-members: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-members: ${drawn.length} component(s) drawn by both layers, ${members} contracted member(s) each `
    + 'answered by a native parameter or excepted with a reason, and every parameter beyond the contract named with one; '
    + `${shapes} parameter(s) read across the two layers, each carrying the type and the default the contract derives, `
    + `and ${DERIVED_DEFAULT.size} default(s) reached through a constant with a reason.\n`
    + '  (A green run says the surface matches the contract, never that the component draws what the contract describes.)',
  );
}

if (isMainModule(import.meta.url)) main();
