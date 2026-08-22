import { test, expect } from 'bun:test';
import {
  DENSITIES, THEMES, USER_SCALE_AXES, aliasTarget, collect, designSources,
  dimensions, inScope, resolveAliases, scopeOf, valueSources, type Token,
} from './payload.ts';

const manifest = (contracts: string[]) => ({ name: '@dravensoft/arena-contracts', version: '10.2.0', contracts });

test('$type is declared on a group and a leaf overrides it', () => {
  const tree = {
    dz: {
      $type: 'dimension',
      'ctl-h': { $value: { value: 40, unit: 'px' } },
      lh: { $type: 'number', $value: 1 },
    },
  };
  const found = collect(tree, [], 'contracts/design/spacing.json', {}, []);
  expect(found.find((one) => one.name === 'dz.ctl-h')?.type).toBe('dimension');
  expect(found.find((one) => one.name === 'dz.lh')?.type).toBe('number');
});

test('userScale inherits group to leaf, which DTCG admits and does not define', () => {
  const tree = {
    dz: {
      $type: 'dimension',
      $extensions: { 'com.dravensoft.arena': { userScale: 'fixed' } },
      'ctl-h': { $value: { value: 32, unit: 'px' } },
      text: { $value: { value: 13, unit: 'px' }, $extensions: { 'com.dravensoft.arena': { userScale: 'scales' } } },
    },
  };
  const found = collect(tree, [], 'contracts/design/density.compact.json', {}, []);
  expect(found.find((one) => one.name === 'dz.ctl-h')?.userScale).toBe('fixed');
  expect(found.find((one) => one.name === 'dz.text')?.userScale).toBe('scales');
  expect(USER_SCALE_AXES).toEqual(['scales', 'follows', 'fixed']);
});

test('the script flag and the cssUnit hint are read off the leaf', () => {
  const tree = { tint: { $type: 'number', soft: { $value: 12, $extensions: { 'com.dravensoft.arena': { cssUnit: '%', script: true } } } } };
  const [one] = collect(tree, [], 'contracts/design/effects.json', {}, []);
  expect(one.cssUnit).toBe('%');
  expect(one.script).toBe(true);
});

test('an alias resolves against the merged tree, because chart.json references what spacing.json holds', () => {
  const tokens: Token[] = [
    { path: ['sp', '2'], name: 'sp.2', file: 'a', scope: 'base', type: 'dimension', value: { value: 8, unit: 'px' } },
    { path: ['chart', 'pad'], name: 'chart.pad', file: 'b', scope: 'base', type: 'dimension', value: '{sp.2}' },
  ];
  const { resolved, errs } = resolveAliases(tokens);
  expect(errs).toEqual([]);
  expect(resolved.find((one) => one.name === 'chart.pad')?.value).toEqual({ value: 8, unit: 'px' });
  expect(aliasTarget('{sp.2}')).toBe('sp.2');
  expect(aliasTarget(8)).toBeNull();
});

test('an alias pointing outside the carried set and a cycle both fail rather than resolving to a string', () => {
  const missing: Token[] = [{ path: ['a'], name: 'a', file: 'x', scope: 'base', type: 'dimension', value: '{nowhere}' }];
  expect(resolveAliases(missing).errs[0]).toContain('does not declare');
  const loop: Token[] = [
    { path: ['a'], name: 'a', file: 'x', scope: 'base', type: 'dimension', value: '{b}' },
    { path: ['b'], name: 'b', file: 'x', scope: 'base', type: 'dimension', value: '{a}' },
  ];
  expect(resolveAliases(loop).errs[0]).toContain('a cycle');
});

test('a scope comes from the file, because two palettes declare the same names for two themes', () => {
  expect(scopeOf('contracts/design/palette.dark.json')).toBe('dark');
  expect(scopeOf('contracts/design/palette.light.json')).toBe('light');
  expect(scopeOf('contracts/design/density.compact.json')).toBe('compact');
  expect(scopeOf('contracts/design/spacing.json')).toBe('base');
  expect(THEMES).toEqual(['dark', 'light']);
  expect(DENSITIES).toEqual(['base', 'compact', 'comfortable']);
});

test('roles.json is a design source and not a value source, because none of it carries a $value', () => {
  const all = manifest(['contracts/design/roles.json', 'contracts/design/spacing.json', 'contracts/api/types/tone.json']);
  expect(designSources(all)).toEqual(['contracts/design/roles.json', 'contracts/design/spacing.json']);
  expect(valueSources(all)).toEqual(['contracts/design/spacing.json']);
});

test('the two filters read what they say they read', () => {
  const tokens: Token[] = [
    { path: ['a'], name: 'a', file: 'x', scope: 'dark', type: 'color', value: {} },
    { path: ['b'], name: 'b', file: 'x', scope: 'base', type: 'dimension', value: {} },
  ];
  expect(inScope(tokens, 'dark').map((one) => one.name)).toEqual(['a']);
  expect(dimensions(tokens).map((one) => one.name)).toEqual(['b']);
});

test('a family carrying a weight range surfaces it, and one without it surfaces nothing', () => {
  const tree = {
    font: {
      $type: 'fontFamily',
      display: {
        $value: ['Archivo', 'system-ui', 'sans-serif'],
        $extensions: { 'com.dravensoft.arena': { weights: [400, 900] } },
      },
      body: { $value: ['Familjen Grotesk', 'system-ui', 'sans-serif'] },
    },
  };
  const tokens = collect(tree, [], 'contracts/design/typography.json', {}, []);
  const byName = new Map(tokens.map((token) => [token.name, token]));
  expect(byName.get('font.display')?.weights).toEqual([400, 900]);
  expect(byName.get('font.body')?.weights).toBeUndefined();
});
