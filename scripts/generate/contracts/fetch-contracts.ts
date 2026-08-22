/* Brings the contract payload into .contracts/ over plain HTTPS, at the version
 * repo.config.json names. A published tarball is an ordinary URL, so no package manager is
 * in this path and no JS client is either. The integrity the registry publishes for that
 * exact version is verified before anything is extracted, and the extracted tree is then
 * compared against its own catalogue in both directions, because a payload that lost a file
 * and a payload that gained one are the same defect read from opposite ends. */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { readJson } from '../../utils/read-json.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { contractsVersion, REPO_CONFIG } from '../../lib/arena/repo-config.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { runCapturing } from '../../lib/arena/child-output.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { deadline } from '../../lib/arena/deadline.ts';
import {
  CONTRACTS_DIR,
  MANIFEST,
  PACKAGE_NAME,
  type ContractManifest,
} from '../../lib/contracts/payload.ts';

const DOWNLOAD = deadline(
  'fetch-contracts:download',
  120_000,
  'two HTTPS round trips to registry.npmjs.org from a runner whose egress may be proxied; the payload is under a megabyte, so the span is latency and not size',
);

const EXTRACT = deadline(
  'fetch-contracts:extract',
  60_000,
  'tar over a few hundred small JSON files, on a runner whose disk is shared with every other job on the host',
);

export const REGISTRY = 'https://registry.npmjs.org';

export const node = {
  name: 'generate:contracts',
  reads: [REPO_CONFIG],
  writes: [`${CONTRACTS_DIR}/**`],
  feeds: [
    'generate:tokens', 'generate:api-types',
    'check:pin', 'check:catalogue', 'check:coverage', 'check:api-types', 'check:user-scale',
    'check:behaviour', 'check:composition',
  ],
};

export function metadataUrl(version: string, registry = REGISTRY) {
  return `${registry}/${PACKAGE_NAME}/${version}`;
}

export function integrityProblems(expected: string, tarball: Buffer) {
  const [algorithm, digest] = expected.split('-', 2);
  if (!algorithm || !digest) {
    return [`the registry published the integrity as ${JSON.stringify(expected)}, which is not <algorithm>-<base64>`];
  }
  const actual = createHash(algorithm).update(tarball).digest('base64');
  if (actual === digest) return [];
  return [
    `the tarball hashes to ${algorithm}-${actual} and the registry publishes ${expected}. `
    + 'Nothing downstream can tell a corrupted transfer from a substituted payload, so this stops here',
  ];
}

export function payloadProblems(manifest: ContractManifest, onDisk: string[], version: string) {
  const errs: string[] = [];
  if (manifest.version !== version) {
    errs.push(`${REPO_CONFIG} asks for ${version} and the payload's own catalogue says ${manifest.version}`);
  }
  const declared = new Set(manifest.contracts);
  const present = new Set(onDisk);
  for (const path of sortedByCodeUnit(manifest.contracts)) {
    if (!present.has(path)) errs.push(`${path} is in the catalogue and not in the payload`);
  }
  for (const path of sortedByCodeUnit(onDisk)) {
    if (!declared.has(path)) errs.push(`${path} is in the payload and not in the catalogue`);
  }
  if (manifest.contracts.length === 0) {
    errs.push('the catalogue names 0 contracts, and an empty catalogue verifies an empty payload against itself');
  }
  return errs;
}

function fetchBuffer(curl: string, url: string, cwd: string, ms: number) {
  const out = join(cwd, '.contracts-download');
  const child = runCapturing(curl, ['--fail', '--location', '--silent', '--show-error', '--output', out, url], cwd, ms);
  if (child.status !== 0) {
    console.error(`fetch-contracts: curl exited ${child.status} for ${url}\n${child.output}`);
    process.exit(1);
  }
  const body = readFileSync(out);
  rmSync(out, { force: true });
  return body;
}

async function main() {
  const root = repoRoot;
  const curl = findHostBinary('curl');
  const tar = findHostBinary('tar');
  if (!curl) cannotRun('fetch-contracts', 'this host supplies no curl, and the payload arrives over HTTPS');
  if (!tar) cannotRun('fetch-contracts', 'this host supplies no tar, and the payload arrives as a tarball');

  const version = contractsVersion(root);
  const meta = JSON.parse(fetchBuffer(curl, metadataUrl(version), root, DOWNLOAD.ms).toString('utf8'));
  const dist = meta?.dist ?? {};
  if (typeof dist.tarball !== 'string' || typeof dist.integrity !== 'string') {
    console.error(`fetch-contracts: the registry document for ${PACKAGE_NAME}@${version} carries no dist.tarball and dist.integrity pair`);
    process.exit(1);
  }

  const tarball = fetchBuffer(curl, dist.tarball, root, DOWNLOAD.ms);
  const bad = integrityProblems(dist.integrity, tarball);
  if (bad.length) {
    console.error(`fetch-contracts: ${bad.length} integrity problem(s)\n`);
    for (const problem of bad) console.error(`  ${problem}`);
    process.exit(1);
  }

  const target = join(root, CONTRACTS_DIR);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const archive = join(target, 'payload.tgz');
  await Bun.write(archive, tarball);
  const untar = runCapturing(tar, ['-xzf', archive, '--strip-components=1', '-C', target], root, EXTRACT.ms);
  rmSync(archive, { force: true });
  if (untar.status !== 0) {
    console.error(`fetch-contracts: tar exited ${untar.status}\n${untar.output}`);
    process.exit(1);
  }

  const manifestPath = join(target, MANIFEST);
  if (!existsSync(manifestPath)) {
    console.error(`fetch-contracts: the payload carries no ${MANIFEST}, which is the entry point and the catalogue at once`);
    process.exit(1);
  }
  const manifest = readJson<ContractManifest>(manifestPath);
  const onDisk = walkFiles(target, (rel) => rel.startsWith('contracts/') && rel.endsWith('.json'));
  const problems = payloadProblems(manifest, onDisk, version);
  if (problems.length) {
    console.error(`fetch-contracts: ${problems.length} payload problem(s)\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(
    `fetch-contracts: ${PACKAGE_NAME}@${version} verified against its published ${dist.integrity.split('-')[0]} `
    + `integrity, and ${manifest.contracts.length} contract file(s) extracted into ${CONTRACTS_DIR}/, `
    + 'each one named by the catalogue and each catalogue entry present',
  );
}

if (isMainModule(import.meta.url)) await main();
