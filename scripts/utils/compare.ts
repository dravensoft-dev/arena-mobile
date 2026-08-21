/* Ordering that reaches a file is by code unit. localeCompare puts `a` before `B` under
 * en-US and after it by code unit, so a generator emits two different files on two machines
 * and the `git diff --exit-code` in every workflow calls the second one an emit out of step. */

export function byCodeUnit(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function sortedByCodeUnit(values: readonly string[]) {
  return [...values].sort(byCodeUnit);
}
