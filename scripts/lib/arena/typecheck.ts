/* Spawning tsc over a project, and asking which files it read. It sits in lib/ because a gate
 * importing another gate would make the domain grid a lie, and it is `arena` by the vocabulary
 * rule: a tsconfig belongs to no single layer. projectFiles() is here so a gate can prove its
 * project matched something, since a tsconfig whose globs match nothing compiles nothing and
 * reports clean, which is the one way a typecheck gate passes over a tree it never opened.
 * The compiler is read through runCapturing and never a pipe, for the reason stated there. */

import { existsSync } from 'node:fs';
import path, { join } from 'node:path';
import { runCapturing } from './child-output.ts';
import { repoRoot } from './repo-root.ts';
import { deadline, type Deadline } from './deadline.ts';
import { relPosix } from '../../utils/posix-path.ts';

export const TSC_BIN = 'node_modules/typescript/lib/tsc.js';

export const TSC_SPAWN: Deadline = deadline(
  'typecheck:spawn',
  120_000,
  'one spawn over scripts/ measured 9442ms, 9933ms and 9713ms warm on an otherwise idle '
  + 'machine, reaching 108 files; a shared runner is several times that on a cold cache, and '
  + 'the span is for ending a hang rather than for policing the compiler',
);

export type Verdict = { reach: string[]; status: number; output: string };

export function tscBin(root = repoRoot) {
  const bin = join(root, TSC_BIN);
  return existsSync(bin) ? bin : null;
}

function run(args: string[], root: string) {
  const bin = tscBin(root);
  if (bin === null) {
    throw new Error(`typecheck: no compiler at ${join(root, TSC_BIN)}, so run \`bun install\` before a typecheck gate`);
  }
  return runCapturing(process.execPath, [bin, ...args], root, TSC_SPAWN.ms);
}

export function typecheck(project: string, root = repoRoot) {
  return run(['--noEmit', '-p', join(root, project)], root);
}

export function projectFiles(project: string, root = repoRoot) {
  const { status, output } = run(['-p', join(root, project), '--listFilesOnly'], root);
  if (status !== 0) throw new Error(`typecheck: tsc could not read ${project}:\n${output.trim()}`);
  return output.split('\n').map((line) => line.trim()).filter((line) => line !== '');
}

export function verdictFor(project: string, root = repoRoot): Verdict {
  const reach = projectFiles(project, root).map((full) => relPosix(root, full, path));
  const { status, output } = typecheck(project, root);
  return { reach, status, output };
}

export function zeroProjectProblems(count: number) {
  if (count > 0) return [];
  return ['0 project(s) to typecheck, and a gate that compiles nothing reports clean by construction'];
}
