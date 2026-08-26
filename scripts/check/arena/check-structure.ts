/* Both layers partition their sources the same four ways, and a file's directory is decided by
 * what the file IS rather than by where someone put it: an emitted source sits at the path its
 * own generator declares, a stem the contract carries as a component sits in components/, and
 * everything else authored sits in tokens/ unless PLACED says otherwise with its reason. A file
 * loose in a layer's root, or under a fifth directory, is named rather than skipped, and the two
 * layers are held to the same answer for the same subject, because a tree that answers the
 * placement question twice is the directory nobody can read. */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest } from '../../lib/contracts/payload.ts';
import { COMPONENTS_PREFIX, componentNames } from '../../lib/contracts/api-types.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import { EXTENSIONS, PARTITIONS, ROOTS, dirFor, type Partition } from '../../lib/arena/layer-trees.ts';
import { TARGETS } from '../../generate/arena/generate-tokens.ts';
import { API_TARGETS } from '../../generate/arena/generate-api-types.ts';

export const node = {
  name: 'check:structure',
  reads: [
    `${CONTRACTS_DIR}/${MANIFEST}`,
    `${CONTRACTS_DIR}/${COMPONENTS_PREFIX}**`,
    ...LAYERS.map((layer) => `${ROOTS[layer]}/**`),
  ],
  writes: [],
  feeds: [],
};

export const GENERATED_INFIX = '.generated.';

export const PLACED = new Map<string, { partition: Partition; why: string }>([
  ['ArenaTheme', {
    partition: 'theme',
    why: 'what a consumer decides once about how Arena looks, and neither a value nor a component: it carries '
      + 'the composition locals on one layer and the environment keys on the other, and both are the channel '
      + 'the values reach a tree by rather than a value themselves',
  }],
]);

export function isPartition(name: string): name is Partition {
  return (PARTITIONS as readonly string[]).includes(name);
}

export function partitionOf(rel: string) {
  const cut = rel.indexOf('/');
  return cut === -1 ? null : rel.slice(0, cut);
}

export function stemOf(rel: string, extension: string) {
  const name = rel.slice(rel.lastIndexOf('/') + 1, -extension.length);
  const infix = name.indexOf(GENERATED_INFIX.slice(0, -1));
  return infix === -1 ? name : name.slice(0, infix);
}

export function emittedTargets(targets: readonly string[] = [...TARGETS, ...API_TARGETS]) {
  return new Map(targets.map((target) => [target.slice(target.lastIndexOf('/') + 1), target] as const));
}

export function expectedPartition(stem: string, components: ReadonlySet<string>): Partition {
  if (components.has(stem)) return 'components';
  return PLACED.get(stem)?.partition ?? 'tokens';
}

export function missingDirectoryProblems(present: (path: string) => boolean) {
  return sortedByCodeUnit(LAYERS.flatMap((layer) => PARTITIONS
    .filter((partition) => !present(dirFor(layer, partition)))
    .map((partition) => `${dirFor(layer, partition)} is not in the tree, so ${layer} does not carry the four `
      + 'directories both layers partition into and one of them answers the placement question with a silence')));
}

export function placementProblems(
  layer: Layer,
  files: readonly string[],
  components: ReadonlySet<string>,
  targets: ReadonlyMap<string, string>,
) {
  const extension = EXTENSIONS[layer];
  return sortedByCodeUnit(files.flatMap((rel) => {
    const at = `${ROOTS[layer]}/${rel}`;
    const name = rel.slice(rel.lastIndexOf('/') + 1);
    const found = partitionOf(rel);
    if (found === null) {
      return [`${at} sits loose in the root of the ${layer} tree, which is in none of the four partitions, so `
        + 'nothing about the path says what the file is'];
    }
    if (!isPartition(found)) {
      return [`${at} sits under ${found}, which names none of ${PARTITIONS.join(', ')}. A fifth directory is a `
        + 'partition this repository grew rather than the one both layers agreed on'];
    }
    if (name.includes(GENERATED_INFIX)) {
      const target = targets.get(name);
      if (target === undefined) {
        return [`${at} carries the generated infix and no generator declares a target by that name, so it is an `
          + 'emit nothing rewrites and nothing compares'];
      }
      return target === at ? [] : [`${at} is emitted and its generator writes ${target}. check:emit compares the `
        + 'target and never notices a second copy elsewhere, so a stray emit reads as current forever'];
    }
    const want = expectedPartition(stemOf(rel, extension), components);
    if (want === found) return [];
    return [`${at} sits in ${found}/ and what it is puts it in ${want}/: `
      + (want === 'components'
        ? 'the pinned contract carries a component of that name'
        : PLACED.get(stemOf(rel, extension))?.why ?? 'an authored source that is not a component is a value')];
  }));
}

export function crossLayerProblems(byLayer: ReadonlyMap<Layer, ReadonlyMap<string, string>>) {
  const errs: string[] = [];
  const [first, second] = LAYERS;
  const one = byLayer.get(first);
  const other = byLayer.get(second);
  if (!one || !other) return errs;
  for (const [stem, partition] of one) {
    const across = other.get(stem);
    if (across !== undefined && across !== partition) {
      errs.push(`${stem} sits in ${partition}/ on ${first} and in ${across}/ on ${second}, so one subject is two `
        + 'decisions and a reader who learned the tree on one layer is wrong on the other');
    }
  }
  return sortedByCodeUnit(errs);
}

export function stalePlacedProblems(stems: ReadonlySet<string>) {
  return sortedByCodeUnit([...PLACED].flatMap(([stem, placed]) => (stems.has(stem)
    ? []
    : [`PLACED puts ${stem} in ${placed.partition}/ and neither layer carries a source by that name. A placement `
      + `for a file that is gone places nothing: ${placed.why}`])));
}

export function zeroSourceProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked both layer roots and found no source at all, so every placement below holds over a tree this gate '
    + 'never opened';
}

function main() {
  const manifest = readManifest(root);
  const components = new Set(componentNames(manifest));
  const targets = emittedTargets();
  const byLayer = new Map<Layer, ReadonlyMap<string, string>>();
  const stems = new Set<string>();
  const errs: string[] = [...missingDirectoryProblems((path) => existsSync(join(root, path)))];
  let counted = 0;
  let emitted = 0;

  for (const layer of LAYERS) {
    const extension = EXTENSIONS[layer];
    const files = walkFiles(join(root, ROOTS[layer]), (rel) => rel.endsWith(extension));
    counted += files.length;
    emitted += files.filter((rel) => rel.includes(GENERATED_INFIX)).length;
    errs.push(...placementProblems(layer, files, components, targets));
    const placed = new Map<string, string>();
    for (const rel of files) {
      const partition = partitionOf(rel);
      const stem = stemOf(rel, extension);
      stems.add(stem);
      if (partition !== null) placed.set(stem, partition);
    }
    byLayer.set(layer, placed);
  }

  const zero = zeroSourceProblem(counted);
  errs.push(...(zero ? [zero] : []), ...crossLayerProblems(byLayer), ...stalePlacedProblems(stems));

  if (errs.length) {
    console.error(`check-structure: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-structure: ${counted} source(s) across ${LAYERS.length} layer(s), each in one of ${PARTITIONS.length} `
    + `director(ies) both layers carry, ${emitted} of them at the path their own generator declares, `
    + `${stems.size} subject(s) placed the same way on both sides, and ${PLACED.size} placement(s) with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
