import { test, expect } from 'bun:test';
import {
  COMPONENTS_PREFIX, TYPES_PREFIX, apiSources, componentNameOf, componentNames, componentSources,
  isPrimitive, requiredFirst, structureProblems, typeSources, type ApiType,
} from './api-types.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.2', contracts });

const enumType = (over: Partial<ApiType> = {}): ApiType => ({ name: 'ArenaTone', kind: 'enum', values: ['a'], ...over });
const objectType = (fields: ApiType['fields']): ApiType => ({ name: 'ArenaCrumb', kind: 'object', fields });

test('the catalogue decides what is read, and the two prefixes are not the same question', () => {
  const all = manifest([
    `${COMPONENTS_PREFIX}ArenaButton.json`,
    `${TYPES_PREFIX}arena-tone.json`,
    'contracts/design/spacing.json',
  ]);
  expect(typeSources(all)).toEqual([`${TYPES_PREFIX}arena-tone.json`]);
  expect(apiSources(all)).toEqual([`${COMPONENTS_PREFIX}ArenaButton.json`, `${TYPES_PREFIX}arena-tone.json`]);
});

test('the component half of the catalogue reads out as names, and an entry naming no file throws', () => {
  const all = manifest([`${COMPONENTS_PREFIX}ArenaButton.json`, `${TYPES_PREFIX}arena-tone.json`]);
  expect(componentSources(all)).toEqual([`${COMPONENTS_PREFIX}ArenaButton.json`]);
  expect(componentNames(all)).toEqual(['ArenaButton']);
  expect(componentNameOf(`${COMPONENTS_PREFIX}ArenaButton.json`)).toBe('ArenaButton');
  expect(() => componentNameOf(`${COMPONENTS_PREFIX}ArenaButton`)).toThrow('naming no .json file');
});

test('a type is named, prefixed and declared once', () => {
  expect(structureProblems([enumType()])).toEqual([]);
  expect(structureProblems([enumType({ name: 'Tone' })])[0]).toContain('does not start with Arena');
  expect(structureProblems([enumType(), enumType()])[0]).toContain('declared twice');
  expect(structureProblems([{ kind: 'enum', values: ['a'] } as ApiType])[0]).toContain('declares no name');
  expect(structureProblems([enumType({ kind: 'union' })])[0]).toContain('unknown kind "union"');
});

test('an enum is a closed set, so declaring no values is a failure', () => {
  expect(structureProblems([enumType({ values: [] })])[0]).toContain('declares no values');
  expect(structureProblems([enumType({ values: undefined })])[0]).toContain('declares no values');
});

test('R1 is a refusal here rather than a shape: three field forms and nothing else', () => {
  expect(structureProblems([objectType({ label: { form: 'primitive', type: 'string' } })])).toEqual([]);
  expect(structureProblems([objectType({ n: { form: 'primitive', type: 'Date' } })])[0])
    .toContain('is none of string, number, boolean');
  expect(structureProblems([objectType({ v: { form: 'array', of: 'number' } })])).toEqual([]);
  expect(structureProblems([objectType({ v: { form: 'array', of: 'ArenaCrumb' } })])[0])
    .toContain('an array of objects reopens a nesting depth with no bottom');
  for (const form of ['object', 'consumerData', 'functionInput', 'slot', 'event']) {
    expect(structureProblems([objectType({ x: { form } })])[0]).toContain('This emit states no native shape for it');
  }
});

test('an enum field names a declared enum, and naming an object where an enum belongs is reported', () => {
  const declared = [enumType({ name: 'ArenaTone', values: ['a'] }), objectType({ tone: { form: 'enum', type: 'ArenaTone' } })];
  expect(structureProblems(declared)).toEqual([]);
  expect(structureProblems([objectType({ tone: { form: 'enum', type: 'ArenaGhost' } })])[0])
    .toContain('does not declare');
  const wrong = [objectType({ tone: { form: 'enum', type: 'ArenaOther' } }), { name: 'ArenaOther', kind: 'object', fields: {} } as ApiType];
  expect(structureProblems(wrong)[0]).toContain('is a object, used where an enum belongs');
});

test('required fields come first, because Kotlin binds a positional call to the wrong one otherwise', () => {
  const fields = {
    id: { form: 'primitive', type: 'string' },
    actor: { form: 'primitive', type: 'string', required: true },
    action: { form: 'primitive', type: 'string', required: true },
    tone: { form: 'primitive', type: 'string' },
  };
  expect(requiredFirst(fields).map(([name]) => name)).toEqual(['actor', 'action', 'id', 'tone']);
});

test('a primitive is one of three and nothing else is', () => {
  expect(isPrimitive('string')).toBe(true);
  expect(isPrimitive('number')).toBe(true);
  expect(isPrimitive('boolean')).toBe(true);
  expect(isPrimitive('ArenaTone')).toBe(false);
  expect(isPrimitive(undefined)).toBe(false);
});
