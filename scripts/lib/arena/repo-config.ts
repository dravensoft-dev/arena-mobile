/* repo.config.json is the authority for two numbers and the single source of each: this
 * repository's own version, and the contract version every emit is generated from. A
 * constant here repeating either would be a second copy that can disagree with it. */

import { join } from 'node:path';
import { readJson } from '../../utils/read-json.ts';
import { repoRoot } from './repo-root.ts';

export const REPO_CONFIG = 'repo.config.json';
export const CONTRACTS_VERSION_KEY = 'arena-contracts-version';

export type RepoConfig = {
  version: string;
  [CONTRACTS_VERSION_KEY]: string;
};

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function configProblems(config: Partial<RepoConfig>) {
  const errs: string[] = [];
  for (const key of ['version', CONTRACTS_VERSION_KEY] as const) {
    const value = config[key];
    if (value === undefined) {
      errs.push(`${REPO_CONFIG} declares no ${key}, and every gate that compares a version reads it from there`);
      continue;
    }
    if (typeof value !== 'string' || !SEMVER.test(value)) {
      errs.push(`${REPO_CONFIG}'s ${key} is ${JSON.stringify(value)}, which is not a semantic version`);
    }
  }
  const extra = Object.keys(config).filter((key) => key !== 'version' && key !== CONTRACTS_VERSION_KEY);
  for (const key of extra) {
    errs.push(`${REPO_CONFIG} carries ${key}, which no reader knows about: a field nothing reads is a field nothing holds true`);
  }
  return errs;
}

export function readRepoConfig(root = repoRoot) {
  return readJson<RepoConfig>(join(root, REPO_CONFIG));
}

export function contractsVersion(root = repoRoot) {
  return readRepoConfig(root)[CONTRACTS_VERSION_KEY];
}

export function repoVersion(root = repoRoot) {
  return readRepoConfig(root).version;
}
