/* Every dimension resolves an axis after the group-to-leaf inheritance, no token takes a word
 * outside the closed set, no axis in the set is left without a case, and each axis produces
 * the unit that axis obliges. The last claim is the one a compiler cannot make: sp and dp are
 * both lengths, so a scaling size emitted as dp compiles, draws, and stops answering the
 * reader's text setting with nothing reporting it. */

import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, USER_SCALE_AXES, dimensions, type Token } from '../../lib/contracts/payload.ts';
import { identifierFor } from '../../lib/arena/identifier.ts';
import { bridge } from '../../lib/arena/bridge.ts';
import { tokensOf } from '../../generate/arena/generate-tokens.ts';

export const node = {
  name: 'check:user-scale',
  reads: [`${CONTRACTS_DIR}/contracts/design/**`],
  writes: [],
  feeds: [],
};

export const AXIS_UNITS = new Map<string, { kotlin: string; suffix: string }>([
  ['scales', { kotlin: 'TextUnit', suffix: '.sp' }],
  ['fixed', { kotlin: 'Dp', suffix: '.dp' }],
]);

export function zeroDimensionProblem(all: Token[]) {
  if (dimensions(all).length > 0) return null;
  return 'found 0 dimensions, so every claim below holds over an empty set';
}

export function axisProblems(all: Token[]) {
  const errs: string[] = [];
  const taken = new Set<string>();
  for (const token of all) {
    if (token.userScale === undefined) {
      if (token.type === 'dimension') {
        errs.push(`${token.name} is a dimension resolving no userScale, and the axis is what decides sp from dp`);
      }
      continue;
    }
    if (!(USER_SCALE_AXES as readonly string[]).includes(token.userScale)) {
      errs.push(`${token.name} takes userScale ${token.userScale}, which is outside the closed set`);
      continue;
    }
    taken.add(token.userScale);
  }
  for (const axis of USER_SCALE_AXES) {
    if (!taken.has(axis)) {
      errs.push(`no token takes the ${axis} axis, so the set has outlived its cases and one of the three means nothing`);
    }
  }
  return errs;
}

export function unitProblems(all: Token[]) {
  const errs: string[] = [];
  for (const token of dimensions(all)) {
    const owed = AXIS_UNITS.get(token.userScale ?? '');
    if (!owed) {
      errs.push(`${token.name} is a dimension on the ${token.userScale} axis, and AXIS_UNITS states no unit for it`);
      continue;
    }
    const emitted = bridge(token, identifierFor(token.path));
    if (emitted.kotlinType !== owed.kotlin || !emitted.kotlinLiteral.includes(owed.suffix)) {
      errs.push(
        `${token.name} is on the ${token.userScale} axis, which obliges ${owed.kotlin} and ${owed.suffix}, `
        + `and it emits ${emitted.kotlinType} as ${emitted.kotlinLiteral}`,
      );
    }
  }
  return sortedByCodeUnit(errs);
}

function main() {
  const all = tokensOf(root);
  const zero = zeroDimensionProblem(all);
  const errs = [...(zero ? [zero] : []), ...axisProblems(all), ...unitProblems(all)];
  if (errs.length) {
    console.error(`check-user-scale: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  const counts = USER_SCALE_AXES.map((axis) => `${all.filter((token) => token.userScale === axis).length} ${axis}`);
  console.log(`check-user-scale: ${dimensions(all).length} dimension(s), every one resolving an axis, and ${counts.join(', ')} across every type`);
}

if (isMainModule(import.meta.url)) main();
