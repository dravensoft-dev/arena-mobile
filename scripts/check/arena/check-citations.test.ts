import { test, expect } from 'bun:test';
import { citationsIn, lineNumberProblems, pathProblems, resolveFrom, zeroCitationProblem } from './check-citations.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';

test('a citation is a code span or a link, and an external URL is neither', () => {
  const found = citationsIn('X.md', 'see `scripts/utils/compare.ts:byCodeUnit(a, b)` and [it](./AGENTS.md) and [there](https://x.test/a.md)');
  expect(found.map((one) => one.path)).toEqual(['scripts/utils/compare.ts', './AGENTS.md']);
  expect(found[0].member).toBe('byCodeUnit');
});

test('a relative link resolves against the document that carries it', () => {
  expect(resolveFrom('scripts/AGENTS.md', './check/AGENTS.md')).toBe('scripts/check/AGENTS.md');
  expect(resolveFrom('scripts/utils/AGENTS.md', '../check/AGENTS.md')).toBe('scripts/check/AGENTS.md');
  expect(resolveFrom('AGENTS.md', 'scripts/AGENTS.md')).toBe('scripts/AGENTS.md');
});

test('a path that is not in the tree fails', () => {
  expect(pathProblems([{ rel: 'X.md', path: 'nowhere/at/all.ts', kind: 'span' }], repoRoot)[0])
    .toContain('is not in the tree');
});

test('the member half is what goes wrong quietly, so it is checked against the file it names', () => {
  expect(pathProblems([{ rel: 'X.md', path: 'scripts/utils/compare.ts', member: 'byCodeUnit', kind: 'span' }], repoRoot))
    .toEqual([]);
  expect(pathProblems([{ rel: 'X.md', path: 'scripts/utils/compare.ts', member: 'walkFiles', kind: 'span' }], repoRoot)[0])
    .toContain('declares no walkFiles');
});

test('a line number is refused, because a line moves under the next edit', () => {
  expect(lineNumberProblems('X.md', 'see `scripts/utils/compare.ts:12`')[0]).toContain('never a line number');
  expect(lineNumberProblems('X.md', 'see `scripts/utils/compare.ts:byCodeUnit`')).toEqual([]);
});

test('finding no citation at all is a failure, not a document that cites nothing', () => {
  expect(zeroCitationProblem(0)).toContain('0 citations');
  expect(zeroCitationProblem(1)).toBeNull();
});
