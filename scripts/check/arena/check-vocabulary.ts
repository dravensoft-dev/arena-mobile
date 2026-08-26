/* Every fenced bash block a document hands a reader either runs here and answers, or is named
 * in ILLUSTRATIVE with the reason it cannot: it writes, it asks the network, or it carries a
 * placeholder. Exiting zero is not enough, because a derivation that stops matching what it
 * reads prints nothing and exits zero, and the page around it keeps reading as current. The
 * other half is the vocabulary: a bun run name a document types is a name the tree answers to. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { captured } from '../../utils/captured.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { runCapturing } from '../../lib/arena/child-output.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { deadline } from '../../lib/arena/deadline.ts';
import {
  PACKAGE_MANIFEST, runScriptNames, scriptNames, undeclaredScriptProblems, zeroScriptProblem,
} from '../../lib/arena/package-scripts.ts';
import { documents } from './check-docs.ts';

export const BLOCK = deadline(
  'check-vocabulary:block',
  60_000,
  'a fenced derivation spawns bun, which imports a generator and reads the pinned payload off a cold disk; the slowest one here measures under a fifth of a second, and the span is generous because its job is to end a hang rather than to time one',
);

export const SHELL = 'sh';
export const OPENING = /^([ \t]*)```bash[ \t]*$/;

export type Block = { rel: string; at: string; opens: string; body: string };

export const ILLUSTRATIVE = new Map<string, { opens: string; why: string }>([
  ['CONTRIBUTING.md#1', {
    opens: 'bun install',
    why: 'the three commands a contributor types before opening a pull request. The first writes node_modules and the second fetches the pinned payload over HTTPS, so a gate running them installs packages and reaches the network',
  }],
  ['versioning_steps.md#1', {
    opens: 'bun run build:release',
    why: 'the release rehearsal. build:release forces a full emit and writes into both layers, so a gate running it checks the tree it has just rewritten',
  }],
  ['versioning_steps.md#2', {
    opens: 'git tag -a vx.y.z -m "arena-mobile vx.y.z"',
    why: 'vx.y.z is a placeholder a reader substitutes, and the block tags and pushes. What it hands a reader is the shape of a release rather than a command to run',
  }],
  ['versioning_steps.md#3', {
    opens: 'curl -s "https://keyserver.ubuntu.com/pks/lookup?op=get&options=mr&search=0x<fingerprint>" \\',
    why: 'it asks a keyserver over the network about a fingerprint a reader substitutes, so it answers about a key this repository does not carry',
  }],
]);

export const node = {
  name: 'check:vocabulary',
  reads: ['**/*.md', '!node_modules/**', '!.contracts/**', '!docs/**', PACKAGE_MANIFEST],
  writes: [],
  feeds: [],
};

export function bashBlocks(rel: string, markdown: string): Block[] {
  const found: Block[] = [];
  let indent: string | null = null;
  let body: string[] = [];
  for (const line of markdown.split('\n')) {
    if (indent === null) {
      const opening = OPENING.exec(line);
      if (opening) {
        indent = captured(opening);
        body = [];
      }
      continue;
    }
    const margin = indent;
    if (new RegExp(`^${margin}\`\`\`\\s*$`).test(line)) {
      const [first] = body;
      indent = null;
      if (first === undefined) continue;
      found.push({
        rel,
        at: `${rel}#${found.length + 1}`,
        opens: first.trim(),
        body: body.map((one) => (one.startsWith(margin) ? one.slice(margin.length) : one)).join('\n'),
      });
      continue;
    }
    body.push(line);
  }
  return found;
}

export function runnable(blocks: readonly Block[]) {
  return blocks.filter((block) => !ILLUSTRATIVE.has(block.at));
}

export function staleIllustrativeProblems(blocks: readonly Block[]) {
  const byAddress = new Map(blocks.map((block) => [block.at, block] as const));
  return sortedByCodeUnit([...ILLUSTRATIVE].flatMap(([at, { opens, why }]) => {
    const block = byAddress.get(at);
    if (block === undefined) {
      return [`ILLUSTRATIVE excuses ${at}, and no fenced bash block sits at that address: ${why}`];
    }
    if (block.opens !== opens) {
      return [`ILLUSTRATIVE excuses ${at} as the block opening "${opens}", and the block there opens "${block.opens}". An excuse that has drifted onto another command excuses the wrong one: ${why}`];
    }
    return [];
  }));
}

export function blockProblems(block: Block, result: { status: number; output: string }) {
  if (result.status !== 0) {
    return [`${block.at} opens "${block.opens}" and exits ${result.status}, so this page hands a reader a command that errors:\n${result.output.trim()}`];
  }
  if (result.output.trim() === '') {
    return [`${block.at} opens "${block.opens}", exits 0 and prints nothing. A derivation that stops matching what it reads is silent rather than red, which is the failure a page derives a figure rather than writing it down in order to avoid`];
  }
  return [];
}

export function zeroBlockProblem(counted: number) {
  if (counted > 0) return null;
  return 'found no fenced bash block in any document, so every command below is held by there being none';
}

function main() {
  const shell = findHostBinary(SHELL);
  if (!shell) {
    cannotRun('check-vocabulary', `this host supplies no ${SHELL}, and a fenced block is a pipeline written for a POSIX shell`);
  }
  const found = documents(root).map((rel) => ({ rel, markdown: readFileSync(join(root, rel), 'utf8') }));
  const blocks = found.flatMap(({ rel, markdown }) => bashBlocks(rel, markdown));
  const declared = scriptNames(root);
  const zero = zeroBlockProblem(blocks.length);
  const zeroScripts = zeroScriptProblem(declared);
  const running = runnable(blocks);
  const errs = [
    ...(zero ? [zero] : []),
    ...(zeroScripts ? [zeroScripts] : []),
    ...staleIllustrativeProblems(blocks),
    ...found.flatMap(({ rel, markdown }) => undeclaredScriptProblems(rel, runScriptNames(markdown), declared)),
    ...running.flatMap((block) => blockProblems(
      block,
      runCapturing(shell as string, ['-c', block.body], root, BLOCK.ms),
    )),
  ];
  if (errs.length) {
    console.error(`check-vocabulary: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const typed = found.flatMap(({ markdown }) => runScriptNames(markdown));
  const carrying = new Set(blocks.map((block) => block.rel));
  console.log(
    `check-vocabulary: ${running.length} fenced command(s) across ${carrying.size} document(s), `
    + `each exiting 0 with an answer, beside ${ILLUSTRATIVE.size} that cannot be run here with a reason, `
    + `and ${typed.length} bun run name(s) ${PACKAGE_MANIFEST} declares over ${found.length} document(s)`,
  );
}

if (isMainModule(import.meta.url)) main();
