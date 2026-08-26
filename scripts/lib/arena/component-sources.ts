/* Where a drawn component lives, per layer, decided by walking rather than by a list. A file is
 * a component's when its stem is a component name the pinned contract carries, which is why the
 * SwiftUI tree can hold values, the API vocabulary and a component at once without a roster
 * telling them apart. Absence is decided by the walk, so "this layer does not draw it" and "this
 * gate could not find it" stop being one value. */

import { join } from 'node:path';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { LAYERS, type Layer } from './behaviour-obligations.ts';

export const KOTLIN_COMPONENTS = 'compose/src/main/kotlin/org/dravensoft/arena/components';
export const SWIFT_COMPONENTS = 'swiftui/Sources/ArenaTokens';

export const TREES: Record<Layer, { dir: string; extension: string }> = {
  compose: { dir: KOTLIN_COMPONENTS, extension: '.kt' },
  swiftui: { dir: SWIFT_COMPONENTS, extension: '.swift' },
};

export function sourcesIn(root: string, layer: Layer, components: readonly string[]) {
  const { dir, extension } = TREES[layer];
  const named = new Set(components);
  return new Map(walkFiles(join(root, dir), (rel) => rel.endsWith(extension) && !rel.includes('.generated.'))
    .map((rel) => [rel.slice(rel.lastIndexOf('/') + 1, -extension.length), rel] as const)
    .filter(([stem]) => named.has(stem))
    .map(([stem, rel]) => [stem, join(root, dir, rel)] as const));
}

export function sourcesByLayer(root: string, components: readonly string[]) {
  return new Map<Layer, ReadonlyMap<string, string>>(
    LAYERS.map((layer) => [layer, sourcesIn(root, layer, components)] as const),
  );
}

export function drawnComponents(byLayer: ReadonlyMap<Layer, ReadonlyMap<string, string>>) {
  return sortedByCodeUnit([...new Set([...byLayer.values()].flatMap((found) => [...found.keys()]))]);
}

export function layerCoverageProblems(component: string, byLayer: ReadonlyMap<Layer, ReadonlyMap<string, string>>) {
  return LAYERS.filter((layer) => !byLayer.get(layer)?.has(component))
    .map((layer) => `${component} is drawn on ${LAYERS.filter((other) => other !== layer).join(' and ')} and not on `
      + `${layer}, so one contract offers a consumer two libraries`);
}
