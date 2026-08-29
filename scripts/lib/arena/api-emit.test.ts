import { test, expect } from 'bun:test';
import {
  CASE_NAMES, REPHRASED, caseStemFor, docTextFor, enumCases, fieldTypes, kotlinCase, literalFor,
  owedDocs, rawTypes, staleCaseNameProblems, staleRephrasedProblems, swiftCase,
} from './api-emit.ts';
import type { ApiType } from '../contracts/api-types.ts';

const anEnum = (name: string, values: (string | number)[]): ApiType => ({ name, kind: 'enum', values });

test('CASE_NAMES is asserted by literal value, so the map and this case move in one commit', () => {
  expect([...CASE_NAMES.keys()]).toEqual([
    'ArenaCatSlot.1', 'ArenaCatSlot.2', 'ArenaCatSlot.3', 'ArenaCatSlot.4',
    'ArenaCatSlot.5', 'ArenaCatSlot.6', 'ArenaCatSlot.7', 'ArenaCatSlot.8',
    'ArenaSwitchSize.2xl',
  ]);
  for (const [, { name, why }] of CASE_NAMES) {
    expect(name).toMatch(/^[a-z][A-Za-z0-9]*$/);
    expect(why).toContain('the emitter refuses to invent one');
  }
});

test('REPHRASED is asserted by literal value, and every entry carries the contract text it replaces', () => {
  expect([...REPHRASED.keys()]).toEqual([
    'ArenaActivityItem.dateTime', 'ArenaCatSlot', 'ArenaCommand.route', 'ArenaControlSize',
    'ArenaCrumb.href', 'ArenaHeadingLevel', 'ArenaKeyValueRow.term', 'ArenaKeyValueRow.value',
    'ArenaMenuItem.icon', 'ArenaOnboardingAnchor', 'ArenaTableColumn.width', 'ArenaTableSlice',
    'ArenaTableSlice.offset', 'ArenaTableSlice.total', 'ArenaTableSort',
  ]);
  for (const [, { was, text, why }] of REPHRASED) {
    expect(was.length).toBeGreaterThan(20);
    expect(text).not.toBe(was);
    expect(why.length).toBeGreaterThan(40);
  }
});

test('a value that mangles to no identifier is named, and one that is not named fails the emit', () => {
  expect(caseStemFor('ArenaAlertTone', 'danger')).toBe('danger');
  expect(caseStemFor('ArenaInputType', 'datetime-local')).toBe('datetimeLocal');
  expect(caseStemFor('ArenaSwitchSize', '2xl')).toBe('size2xl');
  expect(caseStemFor('ArenaCatSlot', 1)).toBe('slot1');
  expect(() => caseStemFor('ArenaGhost', '2xl')).toThrow(/Name it in CASE_NAMES/);
  expect(() => caseStemFor('ArenaGhost', 7)).toThrow(/compiles in neither language/);
});

test('a case is spelled in each language its own way, from one stem', () => {
  expect(kotlinCase('datetimeLocal')).toBe('DatetimeLocal');
  expect(swiftCase('datetimeLocal')).toBe('datetimeLocal');
  const cases = enumCases(anEnum('ArenaAlertTone', ['info', 'danger']));
  expect(cases.map((one) => one.kotlin)).toEqual(['Info', 'Danger']);
  expect(cases.map((one) => one.swift)).toEqual(['info', 'danger']);
  expect(cases.map((one) => one.literal)).toEqual(['"info"', '"danger"']);
});

test('a raw type is one type, and a set mixing the two is refused rather than picked between', () => {
  expect(rawTypes(anEnum('A', ['x']))).toEqual({ kotlin: 'String', swift: 'String' });
  expect(rawTypes(anEnum('B', [1, 2]))).toEqual({ kotlin: 'Int', swift: 'Int' });
  expect(() => rawTypes(anEnum('C', [1, 'x']))).toThrow(/a raw type is one type in both languages/);
  expect(literalFor(2)).toBe('2');
  expect(literalFor('2xl')).toBe('"2xl"');
});

test('a number is a Double in both layers, which is not the row the unit bridge states', () => {
  expect(fieldTypes({ form: 'primitive', type: 'number' }, 'X.n')).toEqual({ kotlin: 'Double', swift: 'Double' });
  expect(fieldTypes({ form: 'primitive', type: 'string' }, 'X.s')).toEqual({ kotlin: 'String', swift: 'String' });
  expect(fieldTypes({ form: 'primitive', type: 'boolean' }, 'X.b')).toEqual({ kotlin: 'Boolean', swift: 'Bool' });
  expect(fieldTypes({ form: 'enum', type: 'ArenaTone' }, 'X.t')).toEqual({ kotlin: 'ArenaTone', swift: 'ArenaTone' });
  expect(fieldTypes({ form: 'array', of: 'number' }, 'X.v')).toEqual({ kotlin: 'List<Double>', swift: '[Double]' });
});

test('a form with no native shape throws where it is met rather than emitting nothing', () => {
  expect(() => fieldTypes({ form: 'consumerData' }, 'X.bag')).toThrow(/reaches no native shape/);
  expect(() => fieldTypes({ form: 'array', of: 'ArenaCrumb' }, 'X.rows')).toThrow(/R1/);
  expect(() => fieldTypes({ form: 'primitive', type: 'Date' }, 'X.at')).toThrow(/not a primitive this emit states/);
  expect(() => fieldTypes({ form: 'enum' }, 'X.t')).toThrow(/names no type/);
});

test('a rephrased description is what is owed, and every other one crosses verbatim', () => {
  expect(docTextFor('ArenaCrumb', 'label', 'What the crumb reads.')).toBe('What the crumb reads.');
  expect(docTextFor('ArenaCrumb', 'href', 'anything at all')).toBe(REPHRASED.get('ArenaCrumb.href')?.text);
  expect(docTextFor('ArenaTableSort', null, 'anything at all')).toBe(REPHRASED.get('ArenaTableSort')?.text);
});

test('a rephrasing fails when the text it was written against moves, which is what buys the carve-out', () => {
  const asDeclared = (key: string, was: string): ApiType[] => {
    const dot = key.indexOf('.');
    const type = dot === -1 ? key : key.slice(0, dot);
    const field = dot === -1 ? '' : key.slice(dot + 1);
    return field
      ? [{ name: type, kind: 'object', fields: { [field]: { form: 'primitive', type: 'string', description: was } } }]
      : [{ name: type, kind: 'enum', values: ['a'], description: was }];
  };
  const about = (key: string) => new RegExp(`\\b${key.replace(/\./g, "\\.")}(?![\\w.])`);
  for (const [key, { was }] of REPHRASED) {
    expect(staleRephrasedProblems(asDeclared(key, was)).filter((one) => about(key).test(one))).toEqual([]);
    const moved = staleRephrasedProblems(asDeclared(key, `${was} And one more sentence.`));
    expect(moved.filter((one) => about(key).test(one))[0]).toContain('decide again');
  }
  expect(staleRephrasedProblems([])[0]).toContain('declares no described type or field by that name');
  const same = 'Which column the rows are ordered by.';
  const rewritesNothing = new Map([['ArenaTableSort', { was: same, text: same, why: 'a reason' }]]);
  expect(staleRephrasedProblems(asDeclared('ArenaTableSort', same), rewritesNothing)[0]).toContain('rewrites nothing');
});

test('a case name for a value the payload no longer declares names nothing', () => {
  expect(staleCaseNameProblems([])[0]).toContain('no enum in the payload declares that value');
  const carried = [anEnum('ArenaSwitchSize', ['2xl']), anEnum('ArenaCatSlot', [1, 2, 3, 4, 5, 6, 7, 8])];
  expect(staleCaseNameProblems(carried)).toEqual([]);
});

test('what is owed is one entry per described node, keyed so two objects may both carry a label', () => {
  const owed = owedDocs([
    { name: 'ArenaCrumb', kind: 'object', fields: { label: { form: 'primitive', type: 'string', description: 'one' } } },
    { name: 'ArenaSegmentOption', kind: 'object', fields: { label: { form: 'primitive', type: 'string', description: 'two' } } },
  ]);
  expect(owed.get('ArenaCrumb.label')).toBe('one');
  expect(owed.get('ArenaSegmentOption.label')).toBe('two');
});
