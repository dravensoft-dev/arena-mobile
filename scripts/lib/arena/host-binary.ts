/* A binary is spawned by resolved path, never a bare name. There is no `git` on Windows,
 * there is `git.exe`, and a bare name resolves through whatever PATH the shell happened to
 * export. Resolving first is also what lets a gate say "this host cannot run me" as a fact
 * rather than as a failed spawn nobody can read. */

import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { hostOf, type Host } from './platform.ts';

export function candidatesFor(name: string, which: Host, path = process.env.PATH ?? '') {
  const suffixes = which === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  const dirs = path.split(delimiter).filter(Boolean);
  return dirs.flatMap((dir) => suffixes.map((suffix) => join(dir, `${name}${suffix}`)));
}

export function findHostBinary(name: string, which = hostOf(), path = process.env.PATH ?? '') {
  return candidatesFor(name, which, path).find((candidate) => existsSync(candidate)) ?? null;
}
