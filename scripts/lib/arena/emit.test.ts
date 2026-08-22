import { test, expect } from 'bun:test';
import {
  COMMAND, REPHRASED, banner, densityTokens, docTextFor, flatten, scaleTokens, shapeProblems,
  staleRephrasedProblems, themeTokens,
} from './emit.ts';
import type { Token } from '../contracts/payload.ts';

const px = (value: number) => ({ value, unit: 'px' });
const base = (name: string, value = 1): Token => ({
  path: name.split('.'), name, file: 'contracts/design/spacing.json', scope: 'base',
  type: 'dimension', value: px(value), userScale: 'fixed',
});
const colour = (name: string, scope: 'dark' | 'light'): Token => ({
  path: ['color', name], name: `color.${name}`, file: `contracts/design/palette.${scope}.json`, scope,
  type: 'color', value: { colorSpace: 'srgb', components: [0, 0, 0] },
});

test('every banner names the command that writes it', () => {
  expect(banner('/*')).toContain(COMMAND);
  expect(banner('//').split('\n').every((line) => line.startsWith('// '))).toBe(true);
});

test('the dz ladder leaves the token object, because three files declare it for three densities', () => {
  const tokens = [base('sp.4', 16), base('dz.ctl-h', 40)];
  expect(scaleTokens(tokens).map((one) => one.identifier)).toEqual(['sp4']);
  expect(densityTokens(tokens, 'base').map((one) => one.identifier)).toEqual(['ctlH']);
});

test('a density file overrides a subset of the base ladder and inherits the rest', () => {
  const tokens: Token[] = [
    base('dz.ctl-h', 40), base('dz.stack', 12),
    { ...base('dz.ctl-h', 48), file: 'contracts/design/density.comfortable.json', scope: 'comfortable' },
  ];
  const comfortable = densityTokens(tokens, 'comfortable');
  expect(comfortable.find((one) => one.identifier === 'ctlH')?.kotlinLiteral).toBe('48.dp');
  expect(comfortable.find((one) => one.identifier === 'stack')?.kotlinLiteral).toBe('12.dp');
});

test('the two themes are one shape, and a member missing from either fails', () => {
  const paired = [colour('primary', 'dark'), colour('primary', 'light')];
  expect(shapeProblems(paired)).toEqual([]);
  expect(themeTokens(paired, 'dark').map((one) => one.identifier)).toEqual(['primary']);
  expect(shapeProblems([colour('primary', 'dark')])[0]).toContain('not for light');
  expect(shapeProblems([colour('primary', 'light')])[0]).toContain('not for dark');
});

test('a density member overriding nothing in the base ladder fails', () => {
  const stray: Token = { ...base('dz.invented', 1), file: 'contracts/design/density.compact.json', scope: 'compact' };
  expect(shapeProblems([base('dz.ctl-h'), stray])[0]).toContain('nothing it overrides exists');
});

test('a doc comparison flattens whitespace, so rewrapping a description is not a failure', () => {
  expect(flatten('one\n  two   three')).toBe('one two three');
  expect(flatten(undefined)).toBe('');
});

const BAR = REPHRASED.get('layout.bar');

test('a rephrased description is what the emitter writes, and every other one crosses unchanged', () => {
  expect(docTextFor('layout.bar', BAR?.was)).toBe(BAR?.text);
  expect(docTextFor('sp.1', 'Script-readable.')).toBe('Script-readable.');
  expect(docTextFor('sp.0', undefined)).toBeUndefined();
});

test('a replacement states no web mechanism, which is the whole reason it exists', () => {
  for (const [, entry] of REPHRASED) {
    expect(entry.was).toContain('--pad-safe-bottom');
    expect(entry.text).not.toContain('var(--');
    expect(entry.text).not.toContain('contracts/design/');
    expect(entry.why.length).toBeGreaterThan(40);
  }
});

test('a description reworded upstream fails the entry rather than passing under it', () => {
  const carried = [...REPHRASED].map(([name, entry]) => ({ name, description: entry.was }));
  expect(staleRephrasedProblems(carried)).toEqual([]);
  expect(staleRephrasedProblems([])).toHaveLength(REPHRASED.size);
  const moved = carried.map((one) => ({ ...one, description: `${one.description} And one more clause.` }));
  expect(staleRephrasedProblems(moved)).toHaveLength(REPHRASED.size);
});
