/* Every subject the two source trees carry has a suite on both layers, and absence is decided by
 * walking both sides rather than by a list. A subject is an authored source of the value tier or
 * a component either tree draws; an emitted source is not one, because check:emit holds it against
 * a fresh emit and a suite for it would assert the emitter twice. OUTSIDE says which partitions
 * carry no subject and why, and its keys have to complement the ones that do. COVERED_ELSEWHERE
 * carries a subject whose assertions live in another suite, with the file that carries them, and
 * a stale entry of either fails. */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { LAYERS, type Layer } from '../../lib/arena/behaviour-obligations.ts';
import {
  EXTENSIONS, PARTITIONS, SUITE_ROOTS, SUITE_SUFFIXES, dirFor, type Partition,
} from '../../lib/arena/layer-trees.ts';

export const SUBJECT_PARTITIONS: readonly Partition[] = ['components', 'tokens'];

export const node = {
  name: 'check:suites',
  reads: LAYERS.flatMap((layer) => [
    ...SUBJECT_PARTITIONS.flatMap((partition) => [
      `${dirFor(layer, partition)}/**`,
      `!${dirFor(layer, partition)}/**/*.generated.*`,
    ]),
    `${SUITE_ROOTS[layer]}/**`,
  ]),
  writes: [],
  feeds: [],
};

export const OUTSIDE = new Map<Partition, string>([
  ['api', 'the emitted API vocabulary, held by check:emit against a fresh emit and by check:api-types against the '
    + 'contract that declares it. A suite here would assert the emitter twice and fail for the emitter\'s reasons'],
  ['theme', 'the channel the values reach a tree by: a composition local is read inside a running composition and an '
    + 'environment key inside a view, and neither layer\'s build carries a UI test harness, so a suite here needs a '
    + 'dependency this repository does not take'],
]);

export const COVERED_ELSEWHERE = new Map<string, { by: string; why: string }>([
  ['ArenaScale:compose', {
    by: 'compose/src/test/kotlin/org/dravensoft/arena/ArenaDensityTest.kt',
    why: 'the cap bounds the geometry derived from a control floor and leaves the text alone, so it is asserted '
      + 'beside the rungs it bounds rather than on a surface of its own',
  }],
  ['ArenaScale:swiftui', {
    by: 'swiftui/Tests/ArenaTokensTests/ArenaDensityTests.swift',
    why: 'the same claim on the same file for the same reason, which is what makes the two layers read as one '
      + 'decision rather than two habits',
  }],
]);

export function keyFor(subject: string, layer: Layer) {
  return `${subject}:${layer}`;
}

export function subjectOfSuite(rel: string, layer: Layer) {
  const stem = rel.slice(rel.lastIndexOf('/') + 1, -EXTENSIONS[layer].length);
  const suffix = SUITE_SUFFIXES[layer];
  return stem.endsWith(suffix) ? stem.slice(0, -suffix.length) : null;
}

export function namingProblems(layer: Layer, files: readonly string[]) {
  return sortedByCodeUnit(files
    .filter((rel) => subjectOfSuite(rel, layer) === null)
    .map((rel) => `${SUITE_ROOTS[layer]}/${rel} is a suite whose stem does not end in ${SUITE_SUFFIXES[layer]}, so `
      + 'this gate cannot say what it covers and a subject it holds reads as uncovered'));
}

export function coverageProblems(
  byLayer: ReadonlyMap<Layer, ReadonlySet<string>>,
  suitesByLayer: ReadonlyMap<Layer, ReadonlySet<string>>,
  covered = COVERED_ELSEWHERE,
) {
  return sortedByCodeUnit(LAYERS.flatMap((layer) => [...(byLayer.get(layer) ?? new Set<string>())]
    .filter((subject) => !(suitesByLayer.get(layer) ?? new Set<string>()).has(subject))
    .filter((subject) => !covered.has(keyFor(subject, layer)))
    .map((subject) => `${keyFor(subject, layer)} is a subject that layer draws and no suite beside it covers, and `
      + 'COVERED_ELSEWHERE names no file that does. With one component the asymmetry is noise and with thirty it is '
      + 'the default failure mode')));
}

export function symmetryProblems(suitesByLayer: ReadonlyMap<Layer, ReadonlySet<string>>) {
  return sortedByCodeUnit(LAYERS.flatMap((layer) => {
    const others = LAYERS.filter((one) => one !== layer);
    return [...(suitesByLayer.get(layer) ?? new Set<string>())]
      .filter((subject) => others.some((other) => !(suitesByLayer.get(other) ?? new Set<string>()).has(subject)))
      .map((subject) => `${subject} carries a suite on ${layer} and none on ${others.join(' and ')}. Both layers are `
        + 'green either way, which is exactly what makes the missing half invisible');
  }));
}

export function staleCoverProblems(
  subjects: ReadonlySet<string>,
  suitesByLayer: ReadonlyMap<Layer, ReadonlySet<string>>,
  present: (path: string) => boolean,
  covered = COVERED_ELSEWHERE,
) {
  return sortedByCodeUnit([...covered].flatMap(([key, entry]) => {
    const cut = key.lastIndexOf(':');
    const subject = key.slice(0, cut);
    const layer = key.slice(cut + 1) as Layer;
    if (!LAYERS.includes(layer)) {
      return [`COVERED_ELSEWHERE keys ${key} and ${layer} names neither layer, so the entry covers nothing`];
    }
    if (!subjects.has(subject)) {
      return [`COVERED_ELSEWHERE covers ${key} and neither layer carries a subject by that name: ${entry.why}`];
    }
    if ((suitesByLayer.get(layer) ?? new Set<string>()).has(subject)) {
      return [`COVERED_ELSEWHERE covers ${key} and ${subject} now carries a suite of its own on ${layer}. `
        + `The entry outlived the asymmetry it recorded, so delete it: ${entry.why}`];
    }
    if (!present(entry.by)) {
      return [`COVERED_ELSEWHERE covers ${key} with ${entry.by}, which is not in the tree: ${entry.why}`];
    }
    return [];
  }));
}

export function staleOutsideProblems(outside = OUTSIDE, subjects = SUBJECT_PARTITIONS) {
  const owed = PARTITIONS.filter((partition) => !subjects.includes(partition));
  return sortedByCodeUnit([
    ...owed.filter((partition) => !outside.has(partition))
      .map((partition) => `${partition}/ carries no subject and OUTSIDE does not say why, so a partition was added `
        + 'and nobody decided whether what sits in it owes a suite'),
    ...[...outside.keys()].filter((partition) => subjects.includes(partition))
      .map((partition) => `OUTSIDE excludes ${partition}/ and SUBJECT_PARTITIONS walks it, so one directory is both `
        + 'a source of subjects and exempt from owing suites'),
  ]);
}

export function zeroSubjectProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked both source trees and found no subject at all, so every coverage claim below closes by covering '
    + 'nothing while reporting a clean pass';
}

export function zeroSuiteProblem(counted: number) {
  if (counted > 0) return null;
  return 'walked both test trees and found no suite at all, which is what this gate looks like when the two roots '
    + 'move and the walks keep answering empty';
}

function main() {
  const byLayer = new Map<Layer, ReadonlySet<string>>();
  const suitesByLayer = new Map<Layer, ReadonlySet<string>>();
  const subjects = new Set<string>();
  const errs: string[] = [...staleOutsideProblems()];
  let suiteFiles = 0;

  for (const layer of LAYERS) {
    const extension = EXTENSIONS[layer];
    const mine = new Set<string>();
    for (const partition of SUBJECT_PARTITIONS) {
      const dir = dirFor(layer, partition);
      for (const rel of walkFiles(join(root, dir), (one) => one.endsWith(extension) && !one.includes('.generated.'))) {
        mine.add(rel.slice(rel.lastIndexOf('/') + 1, -extension.length));
      }
    }
    for (const subject of mine) subjects.add(subject);
    byLayer.set(layer, mine);

    const files = walkFiles(join(root, SUITE_ROOTS[layer]), (one) => one.endsWith(extension));
    suiteFiles += files.length;
    errs.push(...namingProblems(layer, files));
    suitesByLayer.set(layer, new Set(files.flatMap((rel) => {
      const subject = subjectOfSuite(rel, layer);
      return subject === null ? [] : [subject];
    })));
  }

  const noSubject = zeroSubjectProblem(subjects.size);
  const noSuite = zeroSuiteProblem(suiteFiles);
  errs.push(
    ...(noSubject ? [noSubject] : []),
    ...(noSuite ? [noSuite] : []),
    ...coverageProblems(byLayer, suitesByLayer),
    ...symmetryProblems(suitesByLayer),
    ...staleCoverProblems(subjects, suitesByLayer, (path) => existsSync(join(root, path))),
  );

  if (errs.length) {
    console.error(`check-suites: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-suites: ${subjects.size} subject(s) out of ${SUBJECT_PARTITIONS.length} partition(s) per layer, each `
    + `covered on both, over ${suiteFiles} suite file(s) whose subjects match across the two layers; `
    + `${COVERED_ELSEWHERE.size} subject(s) covered by a named file elsewhere and ${OUTSIDE.size} partition(s) that `
    + 'owe no suite, each with its reason',
  );
}

if (isMainModule(import.meta.url)) main();
