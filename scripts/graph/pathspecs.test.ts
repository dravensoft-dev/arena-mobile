import { test, expect } from 'bun:test';
import { coversPath, literalPrefix, matchesSpec, meetsReads, overlap, resolveSpecs, specsMeet } from './pathspecs.ts';

test('a double star reaches any depth, in the middle and at the end', () => {
  expect(matchesSpec('compose/src/**', 'compose/src/main/kotlin/X.kt')).toBe(true);
  expect(matchesSpec('compose/**/*.generated.*', 'compose/src/main/X.generated.kt')).toBe(true);
  expect(matchesSpec('.contracts/contracts/design/**', '.contracts/arena.contracts.json')).toBe(false);
});

test('a single star stops at a separator', () => {
  expect(matchesSpec('a/*.kt', 'a/X.kt')).toBe(true);
  expect(matchesSpec('a/*.kt', 'a/b/X.kt')).toBe(false);
});

test('a spec with no glob names a file or a directory', () => {
  expect(matchesSpec('repo.config.json', 'repo.config.json')).toBe(true);
  expect(matchesSpec('gradle', 'gradle/libs.versions.toml')).toBe(true);
  expect(matchesSpec('gradle', 'gradle-evil/x')).toBe(false);
});

test('an exclusion wins wherever it applies, and the order is the declaration order', () => {
  const specs = ['a/**', '!a/**/*.generated.*'];
  expect(coversPath(specs, 'a/b/X.kt')).toBe(true);
  expect(coversPath(specs, 'a/b/X.generated.kt')).toBe(false);
  expect([...resolveSpecs(specs, ['a/b/X.kt', 'a/b/X.generated.kt'])]).toEqual(['a/b/X.kt']);
});

test('both sides of a meet may be globs, so overlap compares against a literal prefix', () => {
  expect(literalPrefix('.contracts/contracts/design/**')).toBe('.contracts/contracts/design');
  expect(literalPrefix('repo.config.json')).toBe('repo.config.json');
  expect(overlap('.contracts/**', '.contracts/contracts/design/**')).toBe(true);
  expect(overlap('.contracts/**', 'compose/**')).toBe(false);
  expect(specsMeet(['.contracts/**'], ['.contracts/arena.contracts.json'])).toBe(true);
});

test('a gate that excludes what a generator writes declares no edge over it', () => {
  const reads = ['compose/src/main/kotlin/**', '!compose/src/main/kotlin/**/*.generated.*'];
  expect(meetsReads('compose/src/main/kotlin/org/X.generated.kt', reads)).toBe(false);
  expect(meetsReads('compose/src/main/kotlin/org/ArenaTheme.kt', reads)).toBe(true);
});
