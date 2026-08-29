/* The shape both source trees hold, in one place: a directory named here is the one the
 * generators write into, the walks read from and check:structure holds. A root written twice
 * drifts the first time one of them moves, which is the defect this module exists to stop. */

import type { Layer } from './behaviour-obligations.ts';

export const PARTITIONS = ['api', 'components', 'theme', 'tokens'] as const;
export type Partition = (typeof PARTITIONS)[number];

export const ROOTS: Record<Layer, string> = {
  compose: 'compose/src/main/kotlin/org/dravensoft/arena',
  swiftui: 'swiftui/Sources/ArenaTokens',
};

export const SUITE_ROOTS: Record<Layer, string> = {
  compose: 'compose/src/test/kotlin/org/dravensoft/arena',
  swiftui: 'swiftui/Tests/ArenaTokensTests',
};

export const EXTENSIONS: Record<Layer, string> = { compose: '.kt', swiftui: '.swift' };

export const SUITE_SUFFIXES: Record<Layer, string> = { compose: 'Test', swiftui: 'Tests' };

export function dirFor(layer: Layer, partition: Partition) {
  return `${ROOTS[layer]}/${partition}`;
}

export function suiteFor(layer: Layer, component: string) {
  return `${SUITE_ROOTS[layer]}/${component}${SUITE_SUFFIXES[layer]}${EXTENSIONS[layer]}`;
}
