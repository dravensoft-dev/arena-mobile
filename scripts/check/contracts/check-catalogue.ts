/* The payload is exactly what its own catalogue says it is, in both directions, and every
 * map that excludes part of it still covers something. A generator iterates the catalogue
 * rather than globbing a directory, so a file the package stops carrying goes on being read
 * from a stale checkout with nothing reporting it. Zero contracts is a failure and not a
 * clean pass over a tree this gate never opened. */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import {
  CONTRACTS_DIR, DESIGN_PREFIX, MANIFEST, NOT_A_VALUE, designSources, manifestPath,
  readManifest, staleNotAValueProblems, staleScopeProblems, type ContractManifest,
} from '../../lib/contracts/payload.ts';

export const node = {
  name: 'check:catalogue',
  reads: [`${CONTRACTS_DIR}/${MANIFEST}`, `${CONTRACTS_DIR}/contracts/**`],
  writes: [],
  feeds: [],
};

export function zeroCatalogueProblem(manifest: ContractManifest) {
  if (manifest.contracts.length > 0) return null;
  return 'the catalogue names 0 contracts, so every comparison below is an empty set against an empty set';
}

export function zeroDesignProblem(manifest: ContractManifest) {
  if (designSources(manifest).length > 0) return null;
  return `the catalogue names no file under ${DESIGN_PREFIX}, and every value this repository emits comes from there`;
}

export function reachProblems(manifest: ContractManifest, onDisk: string[]) {
  const declared = new Set(manifest.contracts);
  const present = new Set(onDisk);
  return [
    ...sortedByCodeUnit(manifest.contracts).filter((path) => !present.has(path))
      .map((path) => `${path} is in the catalogue and not in the payload`),
    ...sortedByCodeUnit(onDisk).filter((path) => !declared.has(path))
      .map((path) => `${path} is in the payload and not in the catalogue`),
  ];
}

function main() {
  if (!existsSync(manifestPath(root))) {
    console.error(`check-catalogue: no ${MANIFEST} under ${CONTRACTS_DIR}/. Run generate:contracts`);
    process.exit(1);
  }
  const manifest = readManifest(root);
  const onDisk = walkFiles(join(root, CONTRACTS_DIR), (rel) => rel.startsWith('contracts/') && rel.endsWith('.json'));
  const errs = [
    zeroCatalogueProblem(manifest),
    zeroDesignProblem(manifest),
    ...reachProblems(manifest, onDisk),
    ...staleNotAValueProblems(manifest),
    ...staleScopeProblems(manifest),
  ].filter((one): one is string => one !== null);
  if (errs.length) {
    console.error(`check-catalogue: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-catalogue: ${manifest.contracts.length} contract file(s), of which ${designSources(manifest).length} `
    + `under ${DESIGN_PREFIX} and ${NOT_A_VALUE.size} excluded from the value set with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
