import { test, expect } from 'bun:test';
import { zeroDocProblem } from './check-doc-comments.ts';
import { docProblems, kotlinDocs, swiftDocs } from '../../lib/arena/doc-comments.ts';
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
