import { test, expect } from 'bun:test';
import { carries, node, passLine, spellingOf, symbolProblems, zeroProblems } from './check-behaviour.ts';
import { BINDINGS, type Entry } from '../../lib/arena/behaviour-bindings.ts';

test('zero is a failure three times over, because a gate that walks nothing reports no gaps', () => {
  expect(zeroProblems({ patterns: 0, keys: 1, components: 1 })[0]).toContain('0 pattern');
  expect(zeroProblems({ patterns: 1, keys: 0, components: 1 })[0]).toContain('0 requirement key');
  expect(zeroProblems({ patterns: 1, keys: 1, components: 0 })[0]).toContain('0 component');
  expect(zeroProblems({ patterns: 1, keys: 1, components: 1 })).toEqual([]);
});

test('the gate declares no writes, because a gate that emits stops a sweep reporting every problem', () => {
  expect(node.writes).toEqual([]);
  expect(node.feeds).toEqual([]);
  expect(node.name).toBe('check:behaviour');
});

test('the pass line names what was looked at, and says what a green run does not claim', () => {
  const line = passLine({ patterns: 2, keys: 3, roles: 1, components: 5, published: 0, absences: 5, symbols: 4 });
  expect(line).toContain('0 published');
  expect(line).toContain('5 recorded absence');
  expect(line).toContain('4 symbol(s) found');
  expect(line).toContain('never that any component behaves');
  expect(line).toContain('never one applied to the right node');
});

test('a symbol is looked for as it is written, and otherwise by the member a use site spells', () => {
  expect(spellingOf('SemanticsProperties.ContentDescription')).toBe('ContentDescription');
  expect(spellingOf('.accessibilityAddTraits(.isButton)')).toBe('accessibilityAddTraits');
  expect(spellingOf('Role.Button')).toBe('Button');
  expect(carries('    contentDescription = content', 'SemanticsProperties.ContentDescription')).toBe(true);
  expect(carries('.accessibilityAddTraits(.isButton)', '.accessibilityAddTraits(.isButton)')).toBe(true);
  expect(carries('public fun ArenaButton(', 'Role.Button')).toBe(false);
  expect(carries('        role = Role.Button', 'Role.Button')).toBe(true);
});

test('a published binding naming a symbol nothing wrote is the hole the register exists to stop', () => {
  const entry = BINDINGS.get('ArenaButton') as Entry;
  expect(symbolProblems('ArenaButton', entry, 'compose', null)[0]).toContain('carries no source for it');
  expect(symbolProblems('ArenaButton', entry, 'compose', '')).toHaveLength(Object.keys(entry.met ?? {}).length);
  expect(symbolProblems('ArenaButton', entry, 'compose', '')[0]).toContain('carries no such symbol');
});
