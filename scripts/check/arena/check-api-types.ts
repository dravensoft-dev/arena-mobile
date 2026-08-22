/* Every type, value and field the pinned contract declares reaches a native name in both
 * layers, and no exception outlives what it excepts. It compares the contract against what the
 * emitter resolves and never opens the emitted files, because check:emit is what holds those
 * equal to a fresh emit: the two together are the whole chain from a JSON to a compiled symbol,
 * and either one alone leaves half of it unasserted. Zero types is a failure, since a gate that
 * walks nothing reports no gaps behind a line of output that reads like a pass. */

import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest, type ContractManifest } from '../../lib/contracts/payload.ts';
import {
  API_PREFIX, NOT_YET_READ, apiSources, fieldEntries, staleNotYetReadProblems, structureProblems,
  typeSources, type ApiType,
} from '../../lib/contracts/api-types.ts';
import {
  CASE_NAMES, REPHRASED, caseStemFor, fieldTypes, kotlinCase, rawTypes, staleCaseNameProblems,
  staleRephrasedProblems, swiftCase,
} from '../../lib/arena/api-emit.ts';
import { apiTypesOf } from '../../generate/arena/generate-api-types.ts';

export const node = {
  name: 'check:api-types',
  reads: [`${CONTRACTS_DIR}/${MANIFEST}`, `${CONTRACTS_DIR}/${API_PREFIX}**`],
  writes: [],
  feeds: [],
};

export function zeroTypeProblem(counted: number) {
  if (counted > 0) return null;
  return `found 0 types under ${API_PREFIX}types, so every claim below holds over a vocabulary this gate never read`;
}

export function sourceProblems(manifest: ContractManifest) {
  const read = new Set(typeSources(manifest));
  const excluded = [...NOT_YET_READ.keys()];
  return sortedByCodeUnit(apiSources(manifest)
    .filter((source) => !read.has(source))
    .filter((source) => !excluded.some((prefix) => source.startsWith(prefix)))
    .map((source) => `${source} is an API contract this emit neither reads nor excludes with a reason`));
}

export function coverageProblems(types: ApiType[]) {
  const errs: string[] = [];
  const note = (resolve: () => unknown) => {
    try { resolve(); } catch (error) { errs.push((error as Error).message); }
  };
  for (const type of types) {
    if (type.kind === 'enum') {
      note(() => rawTypes(type));
      for (const value of type.values ?? []) {
        note(() => {
          const stem = caseStemFor(type.name, value);
          return [kotlinCase(stem), swiftCase(stem)];
        });
      }
      continue;
    }
    for (const [field, spec] of fieldEntries(type.fields)) {
      note(() => fieldTypes(spec, `${type.name}.${field}`));
    }
  }
  return sortedByCodeUnit(errs);
}

export function counted(types: ApiType[]) {
  return {
    types: types.length,
    values: types.reduce((total, type) => total + (type.values ?? []).length, 0),
    fields: types.reduce((total, type) => total + fieldEntries(type.fields).length, 0),
  };
}

function main() {
  const manifest = readManifest(root);
  const types = apiTypesOf(root);
  const zero = zeroTypeProblem(types.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...structureProblems(types),
    ...sourceProblems(manifest),
    ...coverageProblems(types),
    ...staleNotYetReadProblems(manifest),
    ...staleCaseNameProblems(types),
    ...staleRephrasedProblems(types),
  ];
  if (errs.length) {
    console.error(`check-api-types: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const size = counted(types);
  console.log(
    `check-api-types: ${size.types} type(s) from the pinned contract, ${size.values} enum value(s) and `
    + `${size.fields} field(s), every one reaching a native name in both layers, with `
    + `${NOT_YET_READ.size} contract directory(ies) excluded with a reason, ${CASE_NAMES.size} case name(s) `
    + `and ${REPHRASED.size} description(s) named with theirs`,
  );
}

if (isMainModule(import.meta.url)) main();
