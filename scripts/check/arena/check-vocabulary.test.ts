import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BLOCK, ILLUSTRATIVE, SHELL, bashBlocks, blockProblems, runnable, staleIllustrativeProblems,
  zeroBlockProblem,
} from './check-vocabulary.ts';
import { isDeadline } from '../../lib/arena/deadline.ts';
import { documents } from './check-docs.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';

const PAGE = [
  '# A page',
  '',
  'Derive it:',
  '',
  '```bash',
  'echo one',
  '```',
  '',
  'And this one is indented:',
  '',
  '  ```bash',
  '  grep -rn something scripts/',
  '  ```',
  '',
  '```',
  'not a bash fence',
  '```',
  '',
].join('\n');

function found() {
  return documents(repoRoot).flatMap((rel) => bashBlocks(rel, readFileSync(join(repoRoot, rel), 'utf8')));
}

test('a block is addressed by its document and its position, and an unmarked fence is not one', () => {
  const blocks = bashBlocks('a.md', PAGE);
  expect(blocks.map((block) => block.at)).toEqual(['a.md#1', 'a.md#2']);
  expect(blocks[0]?.opens).toBe('echo one');
  expect(blocks[0]?.body).toBe('echo one');
});

test('an indented fence is dedented, so what runs is what the reader would paste', () => {
  const blocks = bashBlocks('a.md', PAGE);
  expect(blocks[1]?.opens).toBe('grep -rn something scripts/');
  expect(blocks[1]?.body).toBe('grep -rn something scripts/');
});

test('ILLUSTRATIVE carries the four blocks that write, ask the network or carry a placeholder', () => {
  expect([...ILLUSTRATIVE.keys()]).toEqual([
    'CONTRIBUTING.md#1',
    'versioning_steps.md#1',
    'versioning_steps.md#2',
    'versioning_steps.md#3',
  ]);
  for (const entry of ILLUSTRATIVE.values()) expect(entry.why.length).toBeGreaterThan(0);
});

test('every excused block is at the address it names and opens with the command it names', () => {
  expect(staleIllustrativeProblems(found())).toEqual([]);
  expect(staleIllustrativeProblems([])).toHaveLength(ILLUSTRATIVE.size);
});

test('an excuse that has drifted onto another command excuses the wrong one', () => {
  const drifted = found().map((block) => (ILLUSTRATIVE.has(block.at)
    ? { ...block, opens: 'echo something else' }
    : block));
  expect(staleIllustrativeProblems(drifted)).toHaveLength(ILLUSTRATIVE.size);
});

test('what is run is every block the map does not excuse', () => {
  const blocks = found();
  expect(runnable(blocks)).toHaveLength(blocks.length - ILLUSTRATIVE.size);
  expect(runnable(blocks).some((block) => ILLUSTRATIVE.has(block.at))).toBe(false);
});

test('a block that errors is reported with what it printed', () => {
  const block = { rel: 'a.md', at: 'a.md#1', opens: 'echo one', body: 'echo one' };
  expect(blockProblems(block, { status: 0, output: 'one\n' })).toEqual([]);
  const errs = blockProblems(block, { status: 127, output: 'sh: nope: not found' });
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('127');
  expect(errs[0]).toContain('not found');
});

test('exiting zero and printing nothing is a failure, which is the silence this gate is for', () => {
  const block = { rel: 'a.md', at: 'a.md#1', opens: 'echo one', body: 'echo one' };
  const errs = blockProblems(block, { status: 0, output: '  \n' });
  expect(errs).toHaveLength(1);
  expect(errs[0]).toContain('prints nothing');
});

test('finding no block at all is a failure, and the shell is named where a host lacks one', () => {
  expect(zeroBlockProblem(1)).toBeNull();
  expect(zeroBlockProblem(0)).toContain('bash');
  expect(SHELL).toBe('sh');
});

test('the wait is a deadline carrying its reason and never a bare span', () => {
  expect(isDeadline(BLOCK)).toBe(true);
  expect(BLOCK.name).toContain('check-vocabulary');
  expect(BLOCK.why).toContain('hang');
});
