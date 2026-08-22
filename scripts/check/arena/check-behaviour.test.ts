import { test, expect } from 'bun:test';
import { componentNames, node, passLine, zeroProblems } from './check-behaviour.ts';
import { COMPONENTS_PREFIX } from '../../lib/contracts/api-types.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.2', contracts });

test('zero is a failure three times over, because a gate that walks nothing reports no gaps', () => {
  expect(zeroProblems({ patterns: 0, keys: 1, components: 1 })[0]).toContain('0 pattern');
  expect(zeroProblems({ patterns: 1, keys: 0, components: 1 })[0]).toContain('0 requirement key');
  expect(zeroProblems({ patterns: 1, keys: 1, components: 0 })[0]).toContain('0 component');
  expect(zeroProblems({ patterns: 1, keys: 1, components: 1 })).toEqual([]);
});

test('the component names come off the catalogue and not off the disk', () => {
  expect(componentNames(manifest([`${COMPONENTS_PREFIX}ArenaButton.json`, 'contracts/design/spacing.json'])))
    .toEqual(['ArenaButton']);
});

test('the gate declares no writes, because a gate that emits stops a sweep reporting every problem', () => {
  expect(node.writes).toEqual([]);
  expect(node.feeds).toEqual([]);
  expect(node.name).toBe('check:behaviour');
});

test('the pass line names what was looked at, and says what a green run does not claim', () => {
  const line = passLine({ patterns: 2, keys: 3, roles: 1, components: 5, published: 0, absences: 5 });
  expect(line).toContain('0 published');
  expect(line).toContain('5 recorded absence');
  expect(line).toContain('never that any component behaves');
  expect(line).toContain('is not a symbol anything here compiled');
});
