/* A spec is a posix glob over repository-relative paths, with a double star reaching any depth
 * and a leading bang excluding. It is deliberately smaller than git's pathspec language: what
 * it has to answer is whether one node's writes meet another's reads, and a spec nobody can
 * evaluate in one function is a spec two readers evaluate differently. Both sides may be
 * globs, so a meet is decided by overlap and not by matching a path; and an exclusion counts,
 * because a gate that skips a directory has to exclude it in reads or the declaration invents
 * an edge over a tree the gate never visits. */

const SPECIAL = /[.+^${}()|[\]\\]/g;

export function patternFor(body: string) {
  return body
    .replace(SPECIAL, '\\$&')
    .split('**/')
    .map((part) => part.split('**').map((leaf) => leaf.replace(/\*/g, '[^/]*')).join('.*'))
    .join('(?:.*/)?');
}

export function bodyOf(spec: string) {
  return spec.startsWith('!') ? spec.slice(1) : spec;
}

export function literalPrefix(spec: string) {
  const parts = bodyOf(spec).split('/');
  const first = parts.findIndex((part) => part.includes('*'));
  return first === -1 ? parts.join('/') : parts.slice(0, first).join('/');
}

export function matchesSpec(spec: string, path: string) {
  const body = bodyOf(spec);
  if (new RegExp(`^${patternFor(body)}$`).test(path)) return true;
  if (body.includes('*')) return false;
  return path === body || path.startsWith(`${body}/`);
}

export function overlap(one: string, other: string) {
  return matchesSpec(one, literalPrefix(other)) || matchesSpec(other, literalPrefix(one));
}

export function coversPath(specs: readonly string[], path: string) {
  let kept = false;
  for (const spec of specs) {
    if (!matchesSpec(spec, path)) continue;
    kept = !spec.startsWith('!');
  }
  return kept;
}

export function resolveSpecs(specs: readonly string[], paths: readonly string[]) {
  return new Set(paths.filter((path) => coversPath(specs, path)));
}

export function meetsReads(written: string, reads: readonly string[]) {
  let kept = false;
  for (const spec of reads) {
    if (!overlap(written, bodyOf(spec))) continue;
    kept = !spec.startsWith('!');
  }
  return kept;
}

export function specsMeet(writes: readonly string[], reads: readonly string[]) {
  return writes.some((written) => meetsReads(written, reads));
}
