/* Every path a document names resolves, and every member it names is declared by the file it
 * names. The member half is the one that goes wrong quietly: a citation naming the wrong file
 * with the right member sends a reader somewhere confident and empty, and nothing about the
 * sentence carrying it looks wrong. A line number is not a citation and is refused, because a
 * line moves under the next edit and takes every pointer to it with it in silence. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { documents } from './check-docs.ts';

export const CITED_EXTENSIONS = ['ts', 'kt', 'kts', 'swift', 'json', 'md', 'toml', 'yml'];

const SPAN = new RegExp(
  `\`([A-Za-z0-9_./-]+\\.(?:${CITED_EXTENSIONS.join('|')}))(?::([A-Za-z0-9_]+))?(?:\\([^)]*\\))?\``,
  'g',
);
const LINK = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g;
const LINE_CITATION = new RegExp(`\`[A-Za-z0-9_./-]+\\.(?:${CITED_EXTENSIONS.join('|')}):\\d+`, 'g');

const DECLARES = (member: string) => new RegExp(
  `(?:function|const|let|var|class|interface|type|enum|object|val|struct|extension|func|protocol|case)\\s+${member}\\b`
  + `|^\\s*${member}\\s*[:(]`
  + `|"${member}"`,
  'm',
);

export const node = {
  name: 'check:citations',
  reads: ['**/*.md', '!node_modules/**', '!.contracts/**', '!docs/**'],
  writes: [],
  feeds: [],
};

export function citationsIn(rel: string, markdown: string) {
  const found: { rel: string; path: string; member?: string; kind: 'span' | 'link' }[] = [];
  for (const match of markdown.matchAll(SPAN)) {
    found.push({ rel, path: match[1], member: match[2], kind: 'span' });
  }
  for (const match of markdown.matchAll(LINK)) {
    const target = match[1];
    if (/^[a-z]+:/.test(target) || target.startsWith('//')) continue;
    found.push({ rel, path: target, kind: 'link' });
  }
  return found;
}

export function resolveFrom(rel: string, path: string) {
  if (path.startsWith('./') || path.startsWith('../')) {
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    return join(dir, path).replace(/\\/g, '/');
  }
  return path;
}

export function pathProblems(found: ReturnType<typeof citationsIn>, root_: string) {
  const errs: string[] = [];
  for (const one of found) {
    const resolved = resolveFrom(one.rel, one.path);
    if (!existsSync(join(root_, resolved))) {
      if (one.kind === 'link') {
        errs.push(`${one.rel} links ${one.path}, which resolves to ${resolved} and is not in the tree`);
      } else {
        errs.push(`${one.rel} cites ${one.path}, which is not in the tree`);
      }
      continue;
    }
    if (!one.member) continue;
    const source = readFileSync(join(root_, resolved), 'utf8');
    if (!DECLARES(one.member).test(source)) {
      errs.push(`${one.rel} cites ${one.path}:${one.member}, and that file declares no ${one.member}`);
    }
  }
  return sortedByCodeUnit(errs);
}

export function lineNumberProblems(rel: string, markdown: string) {
  return [...markdown.matchAll(LINE_CITATION)]
    .map((match) => `${rel} cites ${match[0].slice(1)}, and a citation carries a member and never a line number`);
}

export function zeroCitationProblem(counted: number) {
  if (counted > 0) return null;
  return 'found 0 citations across every document, which is what this gate looks like when the patterns it reads by stop matching how a citation is written';
}

function main() {
  const found = documents(root).map((rel) => ({ rel, markdown: readFileSync(join(root, rel), 'utf8') }));
  const cited = found.flatMap(({ rel, markdown }) => citationsIn(rel, markdown));
  const zero = zeroCitationProblem(cited.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...pathProblems(cited, root),
    ...found.flatMap(({ rel, markdown }) => lineNumberProblems(rel, markdown)),
  ];
  if (errs.length) {
    console.error(`check-citations: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const members = cited.filter((one) => one.member).length;
  console.log(
    `check-citations: ${cited.length} citation(s) across ${found.length} document(s), each path in the tree, `
    + `and ${members} of them naming a member the cited file declares`,
  );
}

if (isMainModule(import.meta.url)) main();
