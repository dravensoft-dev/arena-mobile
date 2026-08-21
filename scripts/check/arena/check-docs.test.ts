import { test, expect } from 'bun:test';
import {
  BANNED_PUNCTUATION, COMMENT_RULE_SKIPS, HEADER_MAX_LINES, MAX_DOCUMENT_CHARS, SIZE_ALLOWANCE,
  allowsHeader, commentProblems, limitFor, punctuationProblems, sizeProblems,
  staleAllowanceProblems, staleSkipProblems, zeroScanProblems,
} from './check-docs.ts';

test('SIZE_ALLOWANCE is empty, and the emptiness is the claim', () => {
  expect(SIZE_ALLOWANCE.size).toBe(0);
  expect(limitFor('AGENTS.md')).toBe(MAX_DOCUMENT_CHARS);
  expect(staleAllowanceProblems([])).toEqual([]);
});

test('an allowance is not an exemption: one that falls back inside the shared limit fails', () => {
  SIZE_ALLOWANCE.set('BIG.md', { limit: 80_000, reason: 'a worked example' });
  try {
    expect(staleAllowanceProblems([{ rel: 'BIG.md', size: 100 }])[0]).toContain('Delete the allowance');
    expect(staleAllowanceProblems([])[0]).toContain('no document is there');
    expect(sizeProblems([{ rel: 'BIG.md', size: 90_000 }])).toHaveLength(1);
    expect(sizeProblems([{ rel: 'BIG.md', size: 70_000 }])).toEqual([]);
  } finally {
    SIZE_ALLOWANCE.delete('BIG.md');
  }
});

test('punctuation reaches prose only, so a fence and a code span keep what they quote', () => {
  expect(BANNED_PUNCTUATION[0][0]).toBe('—');
  expect(punctuationProblems('X.md', 'a dash — here')[0]).toContain('em dash');
  expect(punctuationProblems('X.md', '```\na dash — here\n```')).toEqual([]);
  expect(punctuationProblems('X.md', 'a span `—` here')).toEqual([]);
});

test('a hand-authored native source carries no comment at all', () => {
  expect(allowsHeader('compose/src/main/kotlin/X.kt')).toBe(false);
  expect(commentProblems('compose/src/main/kotlin/X.kt', 'val x = 1\n')).toEqual([]);
  expect(commentProblems('compose/src/main/kotlin/X.kt', '// why\nval x = 1\n')[0]).toContain('carries none');
});

test('a script and a test carry one header, and a second comment fails', () => {
  expect(allowsHeader('scripts/check/arena/check-docs.ts')).toBe(true);
  expect(allowsHeader('swiftui/Tests/ArenaTokensTests/X.swift')).toBe(true);
  expect(commentProblems('scripts/x.ts', '/* one */\nconst x = 1;\n')).toEqual([]);
  expect(commentProblems('scripts/x.ts', '/* one */\nconst x = 1;\n// two\n')[0]).toContain('second comment');
  expect(commentProblems('scripts/x.ts', 'const x = 1;\n/* late */\n')[0]).toContain('file HEADER');
  const long = `/*${'\n *'.repeat(HEADER_MAX_LINES + 1)} */\nconst x = 1;\n`;
  expect(commentProblems('scripts/x.ts', long)[0]).toContain(`over the ${HEADER_MAX_LINES}`);
});

test('a slash inside a string or a regex is not a comment', () => {
  expect(commentProblems('scripts/x.ts', "const x = 'a // b';\n")).toEqual([]);
  expect(commentProblems('scripts/x.ts', "const x = y.replace(/^\\//, '');\n")).toEqual([]);
  expect(commentProblems('scripts/x.ts', 'const x = `file://${y}`;\n')).toEqual([]);
});

test('a walk that opens nothing is a failure and not a clean pass', () => {
  expect(zeroScanProblems([], ['a.ts'])[0]).toContain('0 documents');
  expect(zeroScanProblems(['a.md'], [])[0]).toContain('0 hand-authored sources');
  expect(zeroScanProblems(['a.md'], ['a.ts'])).toEqual([]);
  expect(COMMENT_RULE_SKIPS.size).toBe(0);
  expect(staleSkipProblems(['a.ts'])).toEqual([]);
});
