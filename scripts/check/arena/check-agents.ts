/* Every AGENTS.md is reachable by a chain of links from the root one. The agents.md convention
 * resolves a page by proximity, so the closest to the file being edited wins; proximity hands
 * an agent the closest page and hands a reader nothing, and a level nobody links is a level
 * only an agent already standing in the right directory ever sees. DEPARTURES carries each
 * place this tree deliberately answers the convention differently, with its reason. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { resolveFrom } from './check-citations.ts';

export const ROUTER = 'AGENTS.md';
export const DISAMBIGUATOR = 'CLAUDE.md';

export const DEPARTURES = new Map<string, string>([
  [
    DISAMBIGUATOR,
    'the convention fixes AGENTS.md and says nothing about a harness that loads CLAUDE.md alone. This tree carries a real file rather than a symlink, and it carries no rule of its own, so the two cannot disagree',
  ],
  [
    'one branch',
    'Arena routes a builder and a contributor and says why two routers that can disagree are worse than one. This repository has no consumer branch until it has consumers, so it has one router and the departure is that there is nothing to route between',
  ],
]);

export const node = {
  name: 'check:agents',
  reads: ['**/AGENTS.md', ROUTER, DISAMBIGUATOR, '!node_modules/**', '!.contracts/**'],
  writes: [],
  feeds: [],
};

const LINK = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g;

export function levels(root_: string) {
  return sortedByCodeUnit(walkFiles(root_, (rel) => rel.endsWith(ROUTER)
    && !rel.startsWith('node_modules/')
    && !rel.startsWith('.contracts/')));
}

export function linksFrom(rel: string, markdown: string) {
  return [...markdown.matchAll(LINK)]
    .map((match) => captured(match))
    .filter((target) => !/^[a-z]+:/.test(target) && !target.startsWith('//'))
    .map((target) => resolveFrom(rel, target));
}

export function reachable(from: string, read: (rel: string) => string | null) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift() as string;
    const markdown = read(here);
    if (markdown === null) continue;
    for (const target of linksFrom(here, markdown)) {
      if (seen.has(target) || !target.endsWith('.md')) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  return seen;
}

export function reachProblems(found: readonly string[], seen: Set<string>) {
  return found
    .filter((rel) => !seen.has(rel))
    .map((rel) => `${rel} is a level no chain of links from ${ROUTER} reaches, so only an agent already standing in that directory ever sees it`);
}

export function disambiguatorProblems(markdown: string) {
  const errs: string[] = [];
  if (!markdown.includes(`(./${ROUTER})`)) {
    errs.push(`${DISAMBIGUATOR} does not link ${ROUTER}, and it exists for no other purpose`);
  }
  if (markdown.length > 1_000) {
    errs.push(`${DISAMBIGUATOR} is ${markdown.length} characters, which is long enough to be carrying a rule. It carries none: two routers that can disagree are worse than one`);
  }
  return errs;
}

export function zeroLevelProblem(found: readonly string[]) {
  if (found.length > 1) return null;
  return `found ${found.length} level(s), so reachability below is a claim about the root page and nothing else`;
}

function main() {
  const found = levels(root);
  const read = (rel: string) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), 'utf8') : null);
  const zero = zeroLevelProblem(found);
  const errs = [
    ...(zero ? [zero] : []),
    ...reachProblems(found, reachable(ROUTER, read)),
    ...disambiguatorProblems(read(DISAMBIGUATOR) ?? ''),
  ];
  if (errs.length) {
    console.error(`check-agents: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-agents: ${found.length} level(s), every one reachable by a chain of links from ${ROUTER}, `
    + `with ${DEPARTURES.size} declared departure(s) from the convention`,
  );
}

if (isMainModule(import.meta.url)) main();
