/* Never read a spawned child's output through a pipe. A child that writes its results and
 * then calls exit -- every compiler here does -- exits before the tail of stdout has drained,
 * and spawnSync reports that short read as a whole one: status 0, no error, output simply
 * missing its last lines. The loss is a race, so it survives locally and lands in CI. */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type ChildResult = { status: number; output: string };

export function runCapturing(binary: string, args: string[], cwd: string, timeoutMs: number): ChildResult {
  const dir = mkdtempSync(join(tmpdir(), 'arena-mobile-'));
  const file = join(dir, 'child.log');
  const fd = openSync(file, 'w');
  try {
    const child = spawnSync(binary, args, { cwd, timeout: timeoutMs, stdio: ['ignore', fd, fd] });
    closeSync(fd);
    return { status: child.status ?? 1, output: readFileSync(file, 'utf8') };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
