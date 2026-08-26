/* One claim: a component this repository draws presents the members its contract declares, and
 * nothing else it authored. The two directions are separate questions and both are asked. Every
 * member is answered by a native parameter or excepted with a reason, and every parameter either
 * answers a member or is named in BEYOND with the reason it is not one. Which components are
 * asked about is decided by walking the two source trees rather than by a list here, so a
 * component that lands and is not registered is a failure and never a silence. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { readJson } from '../../utils/read-json.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest } from '../../lib/contracts/payload.ts';
import { COMPONENTS_PREFIX, componentNames } from '../../lib/contracts/api-types.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import {
  MEMBERS, parameterProblems, partitionProblems, staleComponentProblems, staleExtraProblems,
} from '../../lib/arena/component-members.ts';

export const KOTLIN_COMPONENTS = 'compose/src/main/kotlin/org/dravensoft/arena/components';
export const SWIFT_COMPONENTS = 'swiftui/Sources/ArenaTokens';

export const TREES: Record<Layer, { dir: string; extension: string }> = {
  compose: { dir: KOTLIN_COMPONENTS, extension: '.kt' },
  swiftui: { dir: SWIFT_COMPONENTS, extension: '.swift' },
};

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
    parameter: /^\s{4}(\w+):\s/,
  },
  swiftui: {
    opens: () => /^\s*public init\($/,
    parameter: /^\s*(?:_\s+)?(\w+):\s/,
  },
};

export function parametersIn(source: string, opens: RegExp, parameter: RegExp) {
  const found = new Set<string>();
  let open = false;
  for (const line of source.split('\n')) {
    if (!open) { open = opens.test(line); continue; }
    if (/^\s*\)/.test(line)) break;
    const match = parameter.exec(line);
    if (match?.[1]) found.add(match[1]);
  }
  return found;
}

export function sourcesIn(root_: string, layer: Layer, components: readonly string[]) {
  const { dir, extension } = TREES[layer];
  const named = new Set(components);
  return new Map(walkFiles(join(root_, dir), (rel) => rel.endsWith(extension) && !rel.includes('.generated.'))
    .map((rel) => [rel.slice(rel.lastIndexOf('/') + 1, -extension.length), rel] as const)
    .filter(([stem]) => named.has(stem))
    .map(([stem, rel]) => [stem, join(root_, dir, rel)] as const));
}

export function drawnComponents(byLayer: ReadonlyMap<Layer, ReadonlyMap<string, string>>) {
  return sortedByCodeUnit([...new Set([...byLayer.values()].flatMap((found) => [...found.keys()]))]);
}

export function layerCoverageProblems(component: string, byLayer: ReadonlyMap<Layer, ReadonlyMap<string, string>>) {
  return LAYERS.filter((layer) => !byLayer.get(layer)?.has(component))
    .map((layer) => `${component} is drawn on ${LAYERS.filter((other) => other !== layer).join(' and ')} and not on `
      + `${layer}, so one contract offers a consumer two libraries`);
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
  const byLayer = new Map<Layer, ReadonlyMap<string, string>>(
    LAYERS.map((layer) => [layer, sourcesIn(root, layer, carried)] as const),
  );
  const drawn = drawnComponents(byLayer);
  const zero = zeroDrawnProblem(drawn.length + MEMBERS.size);

  const errs: string[] = [...(zero ? [zero] : []), ...staleComponentProblems(drawn)];
  let members = 0;
  for (const component of drawn) {
    const declared = memberNamesOf(readJson(join(root, CONTRACTS_DIR, `${COMPONENTS_PREFIX}${component}.json`)));
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
      parameters.set(layer, found);
      errs.push(...parameterProblems(component, found, layer));
    }
    errs.push(...staleExtraProblems(component, parameters));
  }

  if (errs.length) {
    console.error(`check-members: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-members: ${drawn.length} component(s) drawn by both layers, ${members} contracted member(s) each `
    + 'answered by a native parameter or excepted with a reason, and every parameter beyond the contract named with one.\n'
    + '  (A green run says the surface matches the contract, never that the component draws what the contract describes.)',
  );
}

if (isMainModule(import.meta.url)) main();
