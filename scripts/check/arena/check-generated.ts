/* Four claims about what a machine wrote. A generated file carries the infix, so no reader
 * has to open it to know whose it is. One that can carry neither the infix nor a banner is
 * named in UNMARKED with the reason it can carry neither. What is git-ignored is named in
 * UNTRACKED with the reason, and here that list is short on purpose: the emit is tracked so a
 * clone with no JS toolchain builds both libraries. And no tracked text file carries a CR,
 * which is the other half of what .gitattributes declares. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { CONTRACTS_DIR } from '../../lib/contracts/payload.ts';
import { COMMAND } from '../../lib/arena/emit.ts';
import { TARGETS } from '../../generate/arena/generate-tokens.ts';

export const UNMARKED = new Map<string, string>([
  [
    'gradle/wrapper/gradle-wrapper.jar',
    'a binary, so it can carry neither the infix nor a banner, and it is fetched from the Gradle distribution at the version gradle/wrapper/gradle-wrapper.properties names rather than produced by anything here',
  ],
]);

export const UNTRACKED = new Map<string, string>([
  [
    `${CONTRACTS_DIR}/`,
    'the contract payload, reproducible from the pin over HTTPS and verified against the digest the registry publishes, so committing it would be a second copy of a version that already has a single authority',
  ],
]);

export const BINARY_EXTENSIONS = ['.jar', '.png', '.woff2', '.ttf', '.otf', '.zip', '.tgz', '.pdf'];

export const GITATTRIBUTES = '.gitattributes';

export const node = {
  name: 'check:generated',
  reads: [GITATTRIBUTES, '.gitignore', ...TARGETS],
  writes: [],
  feeds: [],
};

export function trackedFiles(root_: string, git: string) {
  const child = spawnSync(git, ['ls-files', '-z'], { cwd: root_, encoding: 'utf8' });
  if (child.status !== 0) return null;
  return child.stdout.split('\0').filter(Boolean);
}

export function namingProblems(targets: readonly string[]) {
  return targets
    .filter((target) => !/\.generated\.[A-Za-z0-9]+$/.test(target))
    .map((target) => `${target} is written by a generator and its name does not say so, and it is not in UNMARKED`);
}

export function bannerProblems(targets: readonly string[], read: (target: string) => string) {
  return targets.flatMap((target) => {
    const first = read(target).split('\n', 1)[0];
    return first.includes(COMMAND)
      ? []
      : [`${target} does not name the command that writes it on its first line, so a reader has to guess`];
  });
}

export function trackingProblems(targets: readonly string[], tracked: Set<string>) {
  return targets
    .filter((target) => !tracked.has(target))
    .map((target) => `${target} is emitted and not tracked, and UNTRACKED does not name it. A clone with no JS toolchain then has nothing to compile`);
}

export function staleUnmarkedProblems(tracked: Set<string>) {
  return [...UNMARKED].flatMap(([path, why]) => (tracked.has(path)
    ? []
    : [`UNMARKED names ${path}, which is not tracked: ${why}`]));
}

export function staleUntrackedProblems(tracked: Set<string>) {
  return [...UNTRACKED].flatMap(([prefix, why]) => {
    const hit = [...tracked].find((path) => path === prefix || path.startsWith(prefix));
    return hit ? [`UNTRACKED names ${prefix} and ${hit} is tracked: ${why}`] : [];
  });
}

export function crlfPatterns(gitattributes: string) {
  return gitattributes
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#') && /\beol=crlf\b/.test(line))
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

export function matchesAttribute(pattern: string, path: string) {
  const body = pattern.includes('/') ? pattern : `**/${pattern}`;
  const expression = body
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .split('**/')
    .map((part) => part.replace(/\*/g, '[^/]*'))
    .join('(?:.*/)?');
  return new RegExp(`^${expression}$`).test(path);
}

export function declaredCrlf(tracked: readonly string[], gitattributes: string) {
  const patterns = crlfPatterns(gitattributes);
  return new Set(tracked.filter((path) => patterns.some((pattern) => matchesAttribute(pattern, path))));
}

export function carriageReturnProblems(tracked: readonly string[], read: (path: string) => Buffer, allowed = new Set<string>()) {
  return tracked
    .filter((path) => !BINARY_EXTENSIONS.some((ext) => path.endsWith(ext)))
    .filter((path) => !allowed.has(path))
    .filter((path) => read(path).includes(0x0d))
    .map((path) => `${path} is a tracked text file carrying a carriage return, and ${GITATTRIBUTES} declares it LF`);
}

export function staleCrlfProblems(tracked: readonly string[], gitattributes: string) {
  return crlfPatterns(gitattributes)
    .filter((pattern) => !tracked.some((path) => matchesAttribute(pattern, path)))
    .map((pattern) => `${GITATTRIBUTES} declares ${pattern} as CRLF, and no tracked file matches it. An exception covering nothing excepts nothing`);
}

export function zeroTrackedProblem(tracked: readonly string[]) {
  if (tracked.length > 0) return null;
  return 'git reports 0 tracked files, so every claim below holds over a tree this gate never opened';
}

function main() {
  const git = findHostBinary('git');
  if (!git) cannotRun('check-generated', 'this host supplies no git, and what is tracked is git\'s answer');
  const tracked = trackedFiles(root, git as string);
  if (tracked === null) {
    console.error('check-generated: git ls-files failed, so this is not a repository and nothing here is tracked');
    process.exit(1);
  }
  const set = new Set(tracked);
  const gitattributes = readFileSync(join(root, GITATTRIBUTES), 'utf8');
  const crlf = declaredCrlf(tracked, gitattributes);
  const zero = zeroTrackedProblem(tracked);
  const errs = [
    ...(zero ? [zero] : []),
    ...namingProblems(TARGETS),
    ...bannerProblems(TARGETS, (target) => readFileSync(join(root, target), 'utf8')),
    ...trackingProblems(TARGETS, set),
    ...staleUnmarkedProblems(set),
    ...staleUntrackedProblems(set),
    ...carriageReturnProblems(tracked, (path) => readFileSync(join(root, path)), crlf),
    ...staleCrlfProblems(tracked, gitattributes),
  ];
  if (errs.length) {
    console.error(`check-generated: ${errs.length} problem(s)\n`);
    for (const problem of sortedByCodeUnit(errs)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-generated: ${TARGETS.length} emitted file(s) named, bannered and tracked, `
    + `${UNMARKED.size} file(s) that can carry neither with a reason, ${UNTRACKED.size} ignored output(s) with a reason, `
    + `and ${tracked.length - crlf.size} tracked text file(s) carrying no carriage return beside the `
    + `${crlf.size} ${GITATTRIBUTES} declares CRLF`,
  );
}

if (isMainModule(import.meta.url)) main();
