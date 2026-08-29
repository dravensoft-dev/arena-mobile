import { test, expect } from 'bun:test';
import { readerFor, zeroDocProblem } from './check-doc-comments.ts';
import { apiKotlinDocs, apiSwiftDocs, docProblems, kotlinDocs, swiftDocs } from '../../lib/arena/doc-comments.ts';
import { API_TARGETS } from '../../generate/arena/generate-api-types.ts';
import { TARGETS } from '../../generate/arena/generate-tokens.ts';
import { flatten, kdoc, tripleSlash } from '../../lib/arena/emit.ts';

test('a doc comment is read back out of the file rather than assumed from the emitter', () => {
  const kotlin = ['public object X {', '    /** one line. */', '    public val a: Dp = 1.dp', '}'].join('\n');
  expect(kotlinDocs(kotlin)).toEqual(new Map([['a', 'one line.']]));
  const swift = ['public enum X {', '    /// one line.', '    public static let a: CGFloat = 1', '}'].join('\n');
  expect(swiftDocs(swift)).toEqual(new Map([['a', 'one line.']]));
});

test('a multi-line description survives the round trip with its whitespace flattened', () => {
  const description = 'first line\nsecond line';
  const kotlin = ['public object X {', ...kdoc(description, '    '), '    public val a: Dp = 1.dp', '}'].join('\n');
  expect(kotlinDocs(kotlin).get('a')).toBe(flatten(description));
  const swift = ['public enum X {', ...tripleSlash(description, '    '), '    public static let a: CGFloat = 1', '}'].join('\n');
  expect(swiftDocs(swift).get('a')).toBe(flatten(description));
});

test('a symbol with no description carries no doc, and one that does carries it', () => {
  expect(kdoc(undefined, '    ')).toEqual([]);
  expect(tripleSlash(undefined, '    ')).toEqual([]);
  expect(() => kdoc('closes early */ here', '    ')).toThrow('without altering it');
});

test('editing the text in the emitted file is what this refuses', () => {
  const owed = new Map([['a', 'the contract says this']]);
  expect(docProblems('X.kt', new Map([['a', 'the contract says this']]), owed)).toEqual([]);
  expect(docProblems('X.kt', new Map([['a', 'somebody typed this']]), owed)[0]).toContain('Edit the contract, not this file');
});

test('a doc on a symbol no contract names fails, and a missing one fails the same way', () => {
  expect(docProblems('X.kt', new Map([['b', 'x']]), new Map())[0]).toContain('which no contract names');
  expect(docProblems('X.kt', new Map(), new Map([['a', 'owed']]))[0]).toContain('with no doc comment');
  expect(docProblems('X.kt', new Map([['a', 'x']]), new Map([['a', '']]))[0]).toContain('no $description to derive it from');
});

test('reading no doc comment at all is a failure, not a file that documents nothing', () => {
  expect(zeroDocProblem(0)).toContain('0 doc comments');
  expect(zeroDocProblem(1)).toBeNull();
});

test('the API reader keys by type, because a flat key collides the moment two objects both carry a label', () => {
  const kotlin = [
    '/** the crumb. */',
    'public data class ArenaCrumb(',
    '    /** what it reads. */',
    '    public val label: String,',
    ')',
    '',
    '/** the option. */',
    'public data class ArenaSegmentOption(',
    '    /** what it selects. */',
    '    public val label: String,',
    ')',
  ].join('\n');
  expect(apiKotlinDocs(kotlin)).toEqual(new Map([
    ['ArenaCrumb', 'the crumb.'], ['ArenaCrumb.label', 'what it reads.'],
    ['ArenaSegmentOption', 'the option.'], ['ArenaSegmentOption.label', 'what it selects.'],
  ]));
});

test('a type-level doc is read as well as a member one, which the token emit has no instance of', () => {
  const swift = [
    '/// the tone.',
    'public enum ArenaTone: String, CaseIterable, Sendable {',
    '    case neutral = "neutral"',
    '}',
    '',
    '/// the crumb.',
    'public struct ArenaCrumb: Sendable {',
    '    /// what it reads.',
    '    public let label: String',
    '}',
  ].join('\n');
  expect(apiSwiftDocs(swift)).toEqual(new Map([
    ['ArenaTone', 'the tone.'], ['ArenaCrumb', 'the crumb.'], ['ArenaCrumb.label', 'what it reads.'],
  ]));
});

test('each emitted file is read by the reader for its own shape, and never by the other one', () => {
  expect(readerFor(TARGETS[0])).toBe(kotlinDocs);
  expect(readerFor(TARGETS[3])).toBe(swiftDocs);
  expect(readerFor(API_TARGETS[0])).toBe(apiKotlinDocs);
  expect(readerFor(API_TARGETS[1])).toBe(apiSwiftDocs);
});
