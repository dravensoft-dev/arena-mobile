/* Three claims about how a document and a source behave. Size, measured in characters and
 * never in bytes, because a document of multi-byte characters is hundreds over a limit it is
 * comfortably under when wc counts it. Punctuation, in prose only, so a fence and a code span
 * keep what the code they quote contains. And the comment rule, read by lexing, so a
 * slash-slash inside a string is never mistaken for one. SIZE_ALLOWANCE is empty and the
 * emptiness is the claim: a document falling back inside the shared limit fails. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { walkFiles } from '../../utils/walk-files.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { bodyAfterShebang, comments, fencesAndSpans, isPragma, lineCount } from '../../lib/arena/comments.ts';

export const MAX_DOCUMENT_CHARS = 60_000;
export const HEADER_MAX_LINES = 10;

export const SIZE_ALLOWANCE = new Map<string, { limit: number; reason: string }>([]);

export const BANNED_PUNCTUATION: [string, string][] = [['—', 'an em dash']];

export const SCANNED_TREES = ['scripts', 'compose', 'swiftui', '.github'];
export const SOURCE_EXTENSIONS = ['.ts', '.kt', '.kts', '.swift'];

export const COMMENT_RULE_SKIPS = new Map<string, string>([]);

export const REGEX_LITERALS = new Set(['.ts']);

export function limitFor(rel: string) {
  return SIZE_ALLOWANCE.get(rel)?.limit ?? MAX_DOCUMENT_CHARS;
}

export function allowsHeader(rel: string) {
  const parts = rel.split('/');
  return parts[0] === 'scripts' || parts.includes('test') || parts.includes('Tests') || rel.includes('.test.');
}

export function documents(root_: string) {
  return sortedByCodeUnit(walkFiles(root_, (rel) => rel.endsWith('.md')
    && !rel.startsWith('node_modules/')
    && !rel.startsWith('.contracts/')
    && !rel.startsWith('docs/')));
}

export function sources(root_: string) {
  return sortedByCodeUnit(SCANNED_TREES.flatMap((tree) => walkFiles(
    join(root_, tree),
    (rel) => SOURCE_EXTENSIONS.some((ext) => rel.endsWith(ext)) && !rel.includes('.generated.'),
  ).map((rel) => `${tree}/${rel}`)));
}

export function sizeProblems(found: { rel: string; size: number }[]) {
  return found
    .filter(({ rel, size }) => size > limitFor(rel))
    .map(({ rel, size }) => `${rel}: ${size} characters, over the ${limitFor(rel)} limit`);
}

export function staleAllowanceProblems(found: { rel: string; size: number }[]) {
  const byRel = new Map(found.map(({ rel, size }) => [rel, size]));
  return [...SIZE_ALLOWANCE].flatMap(([rel, { limit, reason }]) => {
    const size = byRel.get(rel);
    if (size === undefined) {
      return [`SIZE_ALLOWANCE raises ${rel} to ${limit}, and no document is there: ${reason}`];
    }
    if (size <= MAX_DOCUMENT_CHARS) {
      return [`SIZE_ALLOWANCE raises ${rel} to ${limit}, and it is ${size} characters, inside the ${MAX_DOCUMENT_CHARS} everything else holds to. Delete the allowance and let the shared limit apply: ${reason}`];
    }
    return [];
  });
}

export function punctuationProblems(rel: string, markdown: string) {
  const errs: string[] = [];
  fencesAndSpans(markdown).forEach((line, index) => {
    for (const [character, what] of BANNED_PUNCTUATION) {
      if (line.includes(character)) {
        errs.push(`${rel} line ${index + 1} carries ${what}. Prose punctuates with a colon, a comma, a semicolon or a full stop`);
      }
    }
  });
  return errs;
}

export function commentProblems(rel: string, source: string) {
  const extension = rel.slice(rel.lastIndexOf('.'));
  if (COMMENT_RULE_SKIPS.has(extension)) return [];
  const found = comments(bodyAfterShebang(source), REGEX_LITERALS.has(extension)).filter((one) => !isPragma(one.text));
  if (found.length === 0) return [];
  if (!allowsHeader(rel)) {
    return [`${rel} carries ${found.length} comment(s), and a hand-authored source under this tree carries none. The fact belongs in its layer's AGENTS.md`];
  }
  const errs: string[] = [];
  const [header, ...rest] = found;
  if (header === undefined) return errs;
  if (header.line !== 1 || !header.leading) {
    errs.push(`${rel} carries its one allowed comment at line ${header.line}, and the allowance is a file HEADER`);
  }
  if (lineCount(header.text) > HEADER_MAX_LINES) {
    errs.push(`${rel}'s header is ${lineCount(header.text)} lines, over the ${HEADER_MAX_LINES} allowed. What will not fit goes in a reason string a suite asserts on`);
  }
  for (const extra of rest) {
    errs.push(`${rel} line ${extra.line} carries a second comment, and the allowance is one`);
  }
  return errs;
}

export function staleSkipProblems(scanned: readonly string[]) {
  const present = new Set(scanned.map((rel) => rel.slice(rel.lastIndexOf('.'))));
  return [...COMMENT_RULE_SKIPS].flatMap(([extension, reason]) => (present.has(extension)
    ? []
    : [`COMMENT_RULE_SKIPS excuses ${extension}, and no scanned file carries it: ${reason}`]));
}

export function zeroScanProblems(found: readonly string[], scanned: readonly string[]) {
  const errs: string[] = [];
  if (found.length === 0) errs.push('found 0 documents, so every size and punctuation claim below holds over nothing');
  if (scanned.length === 0) errs.push('found 0 hand-authored sources, so the comment rule below is enforced over nothing');
  return errs;
}

export const node = {
  name: 'check:docs',
  reads: [
    '**/*.md', '!node_modules/**', '!.contracts/**', '!docs/**',
    ...SCANNED_TREES.map((tree) => `${tree}/**`),
    ...SCANNED_TREES.map((tree) => `!${tree}/**/*.generated.*`),
  ],
  writes: [],
  feeds: [],
};

function main() {
  const found = documents(root).map((rel) => ({ rel, source: readFileSync(join(root, rel), 'utf8') }));
  const measured = found.map(({ rel, source }) => ({ rel, size: source.length }));
  const scanned = sources(root);
  const errs = [
    ...zeroScanProblems(found.map((one) => one.rel), scanned),
    ...sizeProblems(measured),
    ...staleAllowanceProblems(measured),
    ...found.flatMap(({ rel, source }) => punctuationProblems(rel, source)),
    ...scanned.flatMap((rel) => commentProblems(rel, readFileSync(join(root, rel), 'utf8'))),
    ...staleSkipProblems(scanned),
  ];
  if (errs.length) {
    console.error(`check-docs: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-docs: ${found.length} document(s) under ${MAX_DOCUMENT_CHARS} characters with ${SIZE_ALLOWANCE.size} allowance(s), `
    + `and ${scanned.length} hand-authored source(s) holding to the comment rule`,
  );
}

if (isMainModule(import.meta.url)) main();
