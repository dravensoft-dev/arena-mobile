/* The version the payload on disk carries is the version repo.config.json asks for. Three
 * sources rather than two: the field, the catalogue's own version, and the manifest npm
 * packed beside it. Each pair that nothing compares is a place the pin can move in silence,
 * and the one that moves quietly is the payload, because a stale .contracts/ still parses. */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { readJson } from '../../utils/read-json.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_VERSION_KEY, readRepoConfig, REPO_CONFIG, configProblems } from '../../lib/arena/repo-config.ts';
import { CONTRACTS_DIR, MANIFEST, PACKAGE_NAME, manifestPath, readManifest } from '../../lib/contracts/payload.ts';

export const node = {
  name: 'check:pin',
  reads: [REPO_CONFIG, `${CONTRACTS_DIR}/${MANIFEST}`, `${CONTRACTS_DIR}/package.json`],
  writes: [],
  feeds: [],
};

export function pinProblems(asked: string, catalogue: string, packed: string, name: string) {
  const errs: string[] = [];
  if (name !== PACKAGE_NAME) {
    errs.push(`the payload calls itself ${name}, and the pin is for ${PACKAGE_NAME}`);
  }
  if (catalogue !== asked) {
    errs.push(`${REPO_CONFIG} asks for ${asked} and ${MANIFEST} says ${catalogue}. Run generate:contracts`);
  }
  if (packed !== asked) {
    errs.push(`${REPO_CONFIG} asks for ${asked} and the payload's package.json says ${packed}`);
  }
  return errs;
}

function main() {
  const config = readRepoConfig(root);
  const shape = configProblems(config);
  if (shape.length) {
    console.error(`check-pin: ${shape.length} problem(s) in ${REPO_CONFIG}\n`);
    for (const problem of shape) console.error(`  ${problem}`);
    process.exit(1);
  }
  const asked = config[CONTRACTS_VERSION_KEY];
  if (!existsSync(manifestPath(root))) {
    console.error(`check-pin: no payload under ${CONTRACTS_DIR}/, so nothing here is pinned to anything. Run generate:contracts`);
    process.exit(1);
  }
  const manifest = readManifest(root);
  const packed = readJson<{ name: string; version: string }>(join(root, CONTRACTS_DIR, 'package.json'));
  const errs = pinProblems(asked, manifest.version, packed.version, packed.name);
  if (errs.length) {
    console.error(`check-pin: ${errs.length} version(s) out of step\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-pin: ${PACKAGE_NAME}@${asked} agreed by ${REPO_CONFIG}, ${MANIFEST} and the packed manifest`);
}

if (isMainModule(import.meta.url)) main();
