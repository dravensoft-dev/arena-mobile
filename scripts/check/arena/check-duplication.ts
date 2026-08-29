/* A concept has one home. The unit is a normalised sentence of eight words or more, compared
 * across every pair of documents through an index, with a fenced block and a heading cut before
 * anything is compared: a heading names a section, and two pages answering one question for two
 * layers name their sections alike on purpose. A sentence naming another document is a pointer
 * to a home and passes. What this cannot tell is whether the page a pointer names is where the
 * thing is stated, which is the admission check:behaviour makes about a symbol in a source. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { documents } from './check-docs.ts';
import { resolveFrom } from './check-citations.ts';

export const MINIMUM_WORDS = 8;
export const DOCUMENT_NAMES = /[A-Za-z0-9_./-]+\.md\b/g;

export type Sentence = { rel: string; raw: string; key: string };

export const SECOND_HOME = new Map<string, string>([]);

export const node = {
  name: 'check:duplication',
  reads: ['**/*.md', '!node_modules/**', '!.contracts/**', '!docs/**'],
  writes: [],
  feeds: [],
};

export function prose(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, '\n\n')
    .replace(/^#+.*$/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>|]/g, '')
    .replace(/^\s*[-+]\s+/gm, '');
}

export function normalise(raw: string) {
  return raw.replace(/[^A-Za-z0-9 ]/g, ' ').toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

export function sentencesIn(rel: string, markdown: string): Sentence[] {
  return prose(markdown)
    .split(/(?<=[.:;?])\s+|\n\n+/)
    .map((raw) => raw.replace(/\s+/g, ' ').trim())
    .map((raw) => ({ rel, raw, key: normalise(raw) }))
    .filter((one) => one.key !== '' && one.key.split(' ').length >= MINIMUM_WORDS);
}

export function isPointer(rel: string, raw: string) {
  return [...raw.matchAll(DOCUMENT_NAMES)].some((match) => resolveFrom(rel, match[0]) !== rel);
}

export function indexOf(found: readonly Sentence[]) {
  const index = new Map<string, Sentence[]>();
  for (const one of found) index.set(one.key, [...(index.get(one.key) ?? []), one]);
  return index;
}

export function duplicationProblems(index: ReadonlyMap<string, Sentence[]>, excused: ReadonlyMap<string, string> = SECOND_HOME) {
  return sortedByCodeUnit([...index].flatMap(([key, where]) => {
    const pages = sortedByCodeUnit([...new Set(where.map((one) => one.rel))]);
    if (pages.length < 2) return [];
    if (where.every((one) => isPointer(one.rel, one.raw))) return [];
    if (excused.has(key)) return [];
    const [first] = where;
    if (first === undefined) return [];
    return [`${pages.join(' and ')} each state "${first.raw}", and none of them names where it is stated once. A concept has one home: leave it on the page that owns it, and let the other name that page`];
  }));
}

export function staleSecondHomeProblems(index: ReadonlyMap<string, Sentence[]>, excused: ReadonlyMap<string, string> = SECOND_HOME) {
  return sortedByCodeUnit([...excused].flatMap(([key, why]) => {
    const where = index.get(key) ?? [];
    const pages = new Set(where.map((one) => one.rel));
    return pages.size > 1
      ? []
      : [`SECOND_HOME excuses a sentence that now sits in ${pages.size} document(s), so the second home is gone and the excuse outlives it: ${why}`];
  }));
}

export function zeroSentenceProblem(counted: number) {
  if (counted > 0) return null;
  return 'found 0 sentences across every document, which is what this gate looks like when the shape it splits prose by stops matching how a document is written';
}

function main() {
  const found = documents(root);
  const sentences = found.flatMap((rel) => sentencesIn(rel, readFileSync(join(root, rel), 'utf8')));
  const index = indexOf(sentences);
  const zero = zeroSentenceProblem(sentences.length);
  const errs = [
    ...(zero ? [zero] : []),
    ...duplicationProblems(index),
    ...staleSecondHomeProblems(index),
  ];
  if (errs.length) {
    console.error(`check-duplication: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const repeated = [...index.values()].filter((where) => new Set(where.map((one) => one.rel)).size > 1);
  console.log(
    `check-duplication: ${index.size} sentence(s) of ${MINIMUM_WORDS} word(s) or more across ${found.length} document(s), `
    + `${repeated.length} of them written on more than one page and each naming the page that states it once, `
    + `and ${SECOND_HOME.size} excused with a reason`,
  );
}

if (isMainModule(import.meta.url)) main();
