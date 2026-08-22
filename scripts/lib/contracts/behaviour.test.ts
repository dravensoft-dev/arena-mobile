import { test, expect } from 'bun:test';
import {
  BEHAVIOUR_PREFIX, elementRoles, patternSources, requirementKeys, structureProblems, type Pattern,
} from './behaviour.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.2', contracts });

const pattern = (over: Partial<Pattern> = {}): Pattern => ({
  name: 'switch', source: 'https://example.invalid/', description: 'a two-state control',
  element: 'switch', requires: { 'roles.element': 'switch' }, ...over,
});

test('the catalogue decides what is read, and behaviour is not the design tier', () => {
  const all = manifest([`${BEHAVIOUR_PREFIX}switch.json`, 'contracts/design/spacing.json', 'contracts/api/types/x.json']);
  expect(patternSources(all)).toEqual([`${BEHAVIOUR_PREFIX}switch.json`]);
});

test('a pattern is named, described, and carries a requires map', () => {
  expect(structureProblems([pattern()])).toEqual([]);
  expect(structureProblems([pattern({ name: undefined })])[0]).toContain('declares no name');
  expect(structureProblems([pattern(), pattern()])[0]).toContain('declared twice');
  expect(structureProblems([pattern({ requires: undefined })])[0]).toContain('declares no requires map');
});

test('a requirement is a dotted key, because a flat map is what stops one exception excusing three', () => {
  expect(structureProblems([pattern({ element: undefined, requires: { element: 'switch' } })])[0]).toContain('is not a dotted key');
});

test('a pattern requiring roles.element names that role as a field of its own', () => {
  expect(structureProblems([pattern({ element: undefined })])[0]).toContain('names no element field');
  expect(structureProblems([pattern({ requires: {}, element: 'switch' })])[0])
    .toContain('names an element field and requires no roles.element');
});

test('additive is present and true, or absent, and never present and something else', () => {
  const additive = pattern({ name: 'structured-data', element: undefined, additive: true, requires: { 'alternative.jsonLd': 'a serialisation' } });
  expect(structureProblems([additive])).toEqual([]);
  expect(structureProblems([{ ...additive, additive: false as unknown as true }])[0]).toContain('present and not true');
  expect(structureProblems([{ ...additive, requires: { 'roles.element': 'x' } }])[0])
    .toContain('an additive pattern requires nothing in the roles family');
  expect(structureProblems([{ ...additive, description: undefined }])[0]).toContain('carries no description');
});

test('the key set and the role set are derived from the field and never from the prose', () => {
  const patterns = new Map([
    ['switch', pattern()],
    ['dialog-modal', pattern({ name: 'dialog-modal', element: 'dialog', requires: { 'roles.element': 'dialog', 'keyboard.Escape': 'close' } })],
  ]);
  expect(requirementKeys(patterns)).toEqual(['keyboard.Escape', 'roles.element']);
  expect(elementRoles(patterns)).toEqual(['dialog', 'switch']);
});
