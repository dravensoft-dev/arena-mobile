/* Three answers about a path, all taking the path module, because `relative` answers in the
 * host separator and a string prefix is wrong in one of two directions: without a separator
 * boundary it lets /repo-evil pass as /repo, and with a hardcoded '/' it refuses every nested
 * path on Windows. Nothing else in this tree writes the host separator down, slices a base's
 * length off an absolute path, or hunts a path's last slash by hand. */

import type { PlatformPath } from 'node:path';

export function toPosix(value: string) {
  return value.replace(/\\/g, '/');
}

export function relPosix(from: string, to: string, path: PlatformPath) {
  return toPosix(path.relative(from, to));
}

export function isInside(base: string, candidate: string, path: PlatformPath) {
  const rel = path.relative(base, candidate);
  return rel.length > 0 && !rel.startsWith('..') && !path.isAbsolute(rel);
}
