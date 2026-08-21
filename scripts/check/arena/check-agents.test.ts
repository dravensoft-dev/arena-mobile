import { test, expect } from 'bun:test';
import { DEPARTURES, ROUTER, disambiguatorProblems, linksFrom, reachProblems, reachable, zeroLevelProblem } from './check-agents.ts';

test('a level is reachable by a chain of links and not only by being nearest', () => {
  const pages = new Map([
    [ROUTER, '[a](./a/AGENTS.md)'],
    ['a/AGENTS.md', '[b](./b/AGENTS.md)'],
    ['a/b/AGENTS.md', 'no links'],
    ['orphan/AGENTS.md', 'nobody links this'],
  ]);
  const seen = reachable(ROUTER, (rel) => pages.get(rel) ?? null);
  expect(seen.has('a/b/AGENTS.md')).toBe(true);
  const errs = reachProblems([...pages.keys()], seen);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('orphan/AGENTS.md');
  expect(errs[0]).toContain('already standing in that directory');
});

test('an external URL is not a link into this tree', () => {
  expect(linksFrom(ROUTER, '[a](https://x.test/AGENTS.md) [b](./b.md)')).toEqual(['b.md']);
});

test('the disambiguator links the router and carries no rule of its own', () => {
  expect(disambiguatorProblems('see [AGENTS.md](./AGENTS.md)')).toEqual([]);
  expect(disambiguatorProblems('nothing here')[0]).toContain('does not link');
  expect(disambiguatorProblems(`[x](./${ROUTER}) ${'long '.repeat(300)}`)[0]).toContain('carrying a rule');
});

test('each departure from the published convention is written down with its reason', () => {
  expect(DEPARTURES.size).toBeGreaterThan(0);
  for (const [, why] of DEPARTURES) expect(why.length).toBeGreaterThan(60);
});

test('one level is no claim about reachability', () => {
  expect(zeroLevelProblem([ROUTER])).toContain('1 level');
  expect(zeroLevelProblem([ROUTER, 'a/AGENTS.md'])).toBeNull();
});
