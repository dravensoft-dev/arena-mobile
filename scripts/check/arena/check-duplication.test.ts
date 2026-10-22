import { test, expect } from 'bun:test';
import {
  MINIMUM_WORDS, SECOND_HOME, duplicationProblems, indexOf, isPointer, normalise, prose,
  sentencesIn, staleSecondHomeProblems, zeroSentenceProblem,
} from './check-duplication.ts';

const LONG = 'A concept stated in the same words in two documents has two homes.';
const POINTER = 'What the three cases are is stated once on [`../AGENTS.md`](../AGENTS.md).';

test('a fenced block, a heading and a link target are cut before anything is compared', () => {
  const cut = prose(['# A heading of more than eight words in it', '', 'Body.', '', '```bash', 'echo one', '```', ''].join('\n'));
  expect(cut).not.toContain('heading');
  expect(cut).not.toContain('echo one');
  expect(cut).toContain('Body.');
  expect(prose('See [`../AGENTS.md`](../AGENTS.md).')).toBe('See ../AGENTS.md.');
});

test('normalising leaves words alone, so two spellings of one sentence are one key', () => {
  expect(normalise('**A debt is paid**, or made loud, before it is written down.'))
    .toBe('a debt is paid or made loud before it is written down');
});

test('a sentence shorter than the minimum is not a unit', () => {
  expect(sentencesIn('a.md', 'Short one.')).toEqual([]);
  const found = sentencesIn('a.md', LONG);
  expect(found).toHaveLength(1);
  expect(found[0]?.key.split(' ').length).toBeGreaterThanOrEqual(MINIMUM_WORDS);
  expect(found[0]?.key).toBe('a concept stated in the same words in two documents has two homes');
});

test('a sentence naming another document is a pointer, and one naming its own page is not', () => {
  expect(isPointer('swiftui/AGENTS.md', 'stated once on ../AGENTS.md')).toBe(true);
  expect(isPointer('AGENTS.md', 'stated once on AGENTS.md')).toBe(false);
  expect(isPointer('AGENTS.md', LONG)).toBe(false);
});

test('a sentence in one document is not a duplicate, whatever it says', () => {
  const index = indexOf([...sentencesIn('a.md', LONG), ...sentencesIn('a.md', LONG)]);
  expect(duplicationProblems(index)).toEqual([]);
});

test('the same sentence in two documents, naming no page, is a second home', () => {
  const index = indexOf([...sentencesIn('a.md', LONG), ...sentencesIn('b.md', LONG)]);
  const errs = duplicationProblems(index);
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('a.md');
  expect(errs[0]).toContain('b.md');
});

test('the same sentence in two documents, each naming a third, is a pointer and passes', () => {
  const index = indexOf([
    ...sentencesIn('compose/AGENTS.md', POINTER),
    ...sentencesIn('swiftui/AGENTS.md', POINTER),
  ]);
  expect(duplicationProblems(index)).toEqual([]);
});

test('SECOND_HOME is empty, and the emptiness is the claim', () => {
  expect(SECOND_HOME.size).toBe(0);
});

test('an excuse holds while the sentence sits on two pages and goes stale when it does not', () => {
  const key = normalise(LONG);
  const excused = new Map([[key, 'a reason this repository does not need']]);
  const two = indexOf([...sentencesIn('a.md', LONG), ...sentencesIn('b.md', LONG)]);
  expect(duplicationProblems(two, excused)).toEqual([]);
  expect(staleSecondHomeProblems(two, excused)).toEqual([]);
  const one = indexOf(sentencesIn('a.md', LONG));
  expect(staleSecondHomeProblems(one, excused)).toHaveLength(1);
  expect(staleSecondHomeProblems(indexOf([]), excused)[0]).toContain('0 document(s)');
});

test('finding no sentence at all is a failure rather than a tree with no repetition', () => {
  expect(zeroSentenceProblem(1)).toBeNull();
  expect(zeroSentenceProblem(0)).toContain('0');
});
