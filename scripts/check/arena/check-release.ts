/* The version agrees everywhere it is stated, and the tag for it exists. Run by path and never
 * from GATES: between releases the tag for the current version does not exist yet, so a gate
 * for it would redden every push that is not a release. Three places and no more, because
 * Gradle reads repo.config.json rather than holding a copy and Package.swift carries no
 * version at all: SwiftPM reads the tag, which is why the tag and the field disagreeing is
 * the one failure nothing downstream would ever report. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { readRepoConfig, REPO_CONFIG, configProblems } from '../../lib/arena/repo-config.ts';

export const README = 'README.md';
export const README_HEADING = '## Latest project artifacts';
export const README_LINE = /^- \*\*arena-mobile\*\*: (\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/m;

export function tagFor(version: string) {
  return `v${version}`;
}

export function readmeProblems(readme: string, version: string) {
  if (!readme.includes(README_HEADING)) {
    return [`${README} carries no "${README_HEADING}" heading, and the gate finds the version line under it by exact match`];
  }
  const found = README_LINE.exec(readme);
  if (!found) {
    return [`${README} carries no "- **arena-mobile**: x.y.z" line, and the label is the part that must not be reworded`];
  }
  if (found[1] !== version) {
    return [`${README} says ${found[1]} and ${REPO_CONFIG} says ${version}`];
  }
  return [];
}

export function packageSwiftProblems(source: string) {
  return /\bversion\s*:/.test(source)
    ? ['Package.swift states a version. SwiftPM reads the git tag, so a second number here is one nothing resolves and everything can disagree with']
    : [];
}

export function tagProblems(version: string, tags: readonly string[]) {
  const tag = tagFor(version);
  return tags.includes(tag)
    ? []
    : [`the tag ${tag} does not exist. Create it with: git tag -a ${tag} -m "arena-mobile ${version}"`];
}

function main() {
  const git = findHostBinary('git');
  if (!git) cannotRun('check-release', 'this host supplies no git, and the tag is git\'s answer');

  const config = readRepoConfig(root);
  const shape = configProblems(config);
  if (shape.length) {
    console.error(`check-release: ${shape.length} problem(s) in ${REPO_CONFIG}\n`);
    for (const problem of shape) console.error(`  ${problem}`);
    process.exit(1);
  }

  const version = config.version;
  const listed = spawnSync(git as string, ['tag', '--list'], { cwd: root, encoding: 'utf8' });
  const tags = listed.stdout.split('\n').map((one) => one.trim()).filter(Boolean);
  const errs = [
    ...readmeProblems(readFileSync(join(root, README), 'utf8'), version),
    ...packageSwiftProblems(readFileSync(join(root, 'Package.swift'), 'utf8')),
    ...tagProblems(version, tags),
  ];
  if (errs.length) {
    console.error(`check-release: ${errs.length} problem(s) for ${version}\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-release: ${version} agreed by ${REPO_CONFIG}, ${README} and the tag ${tagFor(version)}`);
}

if (isMainModule(import.meta.url)) main();
