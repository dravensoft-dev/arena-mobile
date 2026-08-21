/* The guard asks two questions in order. Is the version in repo.config.json already on Maven
 * Central? Then there is nothing to do, which is almost every push. Otherwise, has anything
 * the artifact carries moved since the tag of the version that IS published? The baseline is
 * that tag rather than the previous commit, because a layer can change in one commit and the
 * bump land in another, so asking only about this push would mean the change is never
 * published at all. An empty list of paths stops the run: git reads no pathspec as every path,
 * so a guard whose own query died would answer "everything moved" and republish a tree
 * nothing touched. */

import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { runCapturing } from '../../lib/arena/child-output.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { deadline } from '../../lib/arena/deadline.ts';
import { repoVersion } from '../../lib/arena/repo-config.ts';

export const LOOKUP = deadline(
  'publish-guard:central',
  60_000,
  'one HTTPS request to Maven Central search from a runner whose egress may be proxied, and the answer decides whether a publish runs at all, so it is worth waiting out a slow response rather than assuming the version is new',
);

export const GROUP = 'org.dravensoft.arena';
export const ARTIFACT = 'arena-compose';

export const PACKAGE_INPUTS = [
  'compose/**',
  'gradle/**',
  'settings.gradle.kts',
  'gradle.properties',
  'repo.config.json',
];

export function metadataUrl(group = GROUP, artifact = ARTIFACT) {
  return `https://repo1.maven.org/maven2/${group.replace(/\./g, '/')}/${artifact}/maven-metadata.xml`;
}

export function publishedVersions(metadata: string) {
  return [...metadata.matchAll(/<version>([^<]+)<\/version>/g)].map((match) => match[1]);
}

export function decide(version: string, published: readonly string[], movedPaths: readonly string[]) {
  if (published.includes(version)) {
    return { publish: false, why: `${version} is already on Maven Central, so there is nothing to publish` };
  }
  if (published.length === 0) {
    return { publish: true, why: `no version of ${GROUP}:${ARTIFACT} is published, so this is the first release and the trusted publisher is configured by hand` };
  }
  if (movedPaths.length === 0) {
    return {
      publish: false,
      why: `nothing the artifact carries has moved since the tag of ${published[published.length - 1]}, so it keeps its version while the repository moves on`,
    };
  }
  return { publish: true, why: `${movedPaths.length} path(s) the artifact carries have moved since the tag of ${published[published.length - 1]}` };
}

export function movedSince(git: string, baseline: string, paths: readonly string[]) {
  if (paths.length === 0) {
    throw new Error('an empty list of paths stops the run: git reads no pathspec as every path, so this would answer "everything moved"');
  }
  const child = spawnSync(git, ['diff', '--name-only', baseline, 'HEAD', '--', ...paths], { cwd: root, encoding: 'utf8' });
  if (child.status !== 0) {
    throw new Error(`git diff against ${baseline} exited ${child.status}, and a guard that cannot answer must not answer yes`);
  }
  return child.stdout.split('\n').filter(Boolean);
}

function report(lines: string[]) {
  for (const line of lines) console.log(line);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) appendFileSync(summary, `${lines.join('\n')}\n`);
}

function main() {
  const curl = findHostBinary('curl');
  const git = findHostBinary('git');
  if (!curl || !git) cannotRun('publish-guard', 'this host supplies no curl or no git, and the guard needs both to answer either question');

  const version = repoVersion(root);
  const fetched = runCapturing(curl as string, ['--fail', '--location', '--silent', '--show-error', metadataUrl()], root, LOOKUP.ms);
  const published = fetched.status === 0 ? publishedVersions(fetched.output) : [];

  let moved: string[] = [];
  if (published.length > 0 && !published.includes(version)) {
    moved = movedSince(git as string, `v${published[published.length - 1]}`, PACKAGE_INPUTS);
  }

  const decision = decide(version, published, moved);
  report([
    `### ${GROUP}:${ARTIFACT}`,
    '',
    `- on the registry: ${published.length ? published[published.length - 1] : 'nothing published yet'}`,
    `- in this tree: ${version}`,
    `- decision: ${decision.publish ? 'publish' : 'no publish'}`,
    `- because: ${decision.why}`,
  ]);

  const output = process.env.GITHUB_OUTPUT;
  if (output) appendFileSync(output, `publish=${decision.publish}\nversion=${version}\n`);
}

if (isMainModule(import.meta.url)) main();
