import { test, expect } from 'bun:test';
import {
  BINDINGS, REASONLESS_PATTERNS, bindingLayers, bindingProblems, componentProblems, crossLayerProblems, type Entry,
} from './behaviour-bindings.ts';
import { type Pattern } from '../contracts/behaviour.ts';

const patterns = new Map<string, Pattern>([
  ['switch', { name: 'switch', element: 'switch', requires: { 'roles.element': 'switch', 'keyboard.Space': 'toggle' } }],
  ['checkbox', { name: 'checkbox', element: 'checkbox', requires: { 'roles.element': 'checkbox' } }],
  ['none', { name: 'none', requires: {} }],
  ['absent', { name: 'absent', requires: {} }],
  ['structured-data', { name: 'structured-data', additive: true, description: 'a second expression', requires: { 'alternative.jsonLd': 'a serialisation' } }],
  ['figure-with-data-table', { name: 'figure-with-data-table', requires: { 'alternative.jsonLd': 'a serialisation' } }],
]);

const shipped = (over: Record<string, unknown> = {}): Entry => ({
  pattern: 'switch',
  met: {
    'roles.element': { compose: 'Role.Switch', swiftui: '.accessibilityAddTraits(.isToggle)' },
    'keyboard.Space': { compose: 'SemanticsActions.OnClick', swiftui: '.accessibilityAction' },
  },
  exceptions: {},
  ...over,
}) as Entry;

const absent: Entry = { pattern: 'absent', reason: 'this layer publishes no component at all yet, and the register records that rather than leaving a hole' };

test('a flat entry normalises to one binding per layer, so no consumer tests for the split', () => {
  expect(bindingLayers(absent).map((b) => b.layer)).toEqual(['compose', 'swiftui']);
  const split = { compose: absent, swiftui: shipped() } as unknown as Entry;
  expect(bindingLayers(split).map((b) => b.pattern)).toEqual(['absent', 'switch']);
});

test('met and exceptions partition the pattern requirements, with no overlap and no remainder', () => {
  expect(bindingProblems('ArenaSwitch', shipped(), patterns)).toEqual([]);
  const missing = shipped({ met: { 'roles.element': { compose: 'Role.Switch', swiftui: '.accessibilityAddTraits(.isToggle)' } } });
  expect(bindingProblems('ArenaSwitch', missing, patterns)[0]).toContain('is neither met nor excepted');
  const both = shipped({ exceptions: { 'keyboard.Space': 'not reached' } });
  expect(bindingProblems('ArenaSwitch', both, patterns)[0]).toContain('is both met and excepted');
  const extra = shipped({ exceptions: { 'roles.expanded': 'not reached' } });
  expect(bindingProblems('ArenaSwitch', extra, patterns).join(' ')).toContain('the switch pattern does not require');
});

test('a met that names no symbol for its layer leaves nothing to look for', () => {
  const halfNamed = shipped({
    met: {
      'roles.element': { compose: 'Role.Switch' },
      'keyboard.Space': { compose: 'SemanticsActions.OnClick', swiftui: '.accessibilityAction' },
    },
  });
  expect(bindingProblems('ArenaSwitch', halfNamed, patterns).join(' ')).toContain('names no swiftui symbol');
});

test('a reason is present exactly when the pattern is none or absent', () => {
  expect(REASONLESS_PATTERNS).toEqual(['absent', 'none']);
  expect(bindingProblems('ArenaGhost', absent, patterns)).toEqual([]);
  expect(bindingProblems('ArenaGhost', { pattern: 'absent' } as Entry, patterns)[0]).toContain('requires a reason');
  expect(bindingProblems('ArenaSwitch', shipped({ reason: 'because' }), patterns)[0]).toContain('carries a reason');
  expect(bindingProblems('ArenaGhost', { ...absent, met: {} } as Entry, patterns)[0]).toContain('has no requirement to meet');
});

test('none is a real inert component and absent is no component, and both are reachable', () => {
  const inert: Entry = { pattern: 'none', reason: 'a bordered surface with nothing on it a user can act on' };
  expect(bindingProblems('ArenaCard', inert, patterns)).toEqual([]);
  expect(bindingProblems('ArenaCard', { pattern: 'none' } as Entry, patterns)[0]).toContain('requires a reason');
  expect(crossLayerProblems('ArenaCard', { compose: inert, swiftui: absent } as unknown as Entry)).toEqual([]);
});

test('a pattern nothing declares is named rather than passed over', () => {
  expect(bindingProblems('ArenaGhost', { pattern: 'invented', reason: 'x' } as Entry, patterns)[0])
    .toContain('names no pattern the pinned contract declares');
});

test('a requirement the map refuses on a layer is excepted there, and the reason is inherited', () => {
  const chart = { pattern: 'figure-with-data-table', met: {}, exceptions: {} } as Entry;
  const unexcepted = bindingProblems('ArenaBarChart', chart, patterns).join(' ');
  expect(unexcepted).toContain('is refused on');
  expect(unexcepted).toContain('is neither met nor excepted');
  const excepted = { pattern: 'figure-with-data-table', met: {}, exceptions: { 'alternative.jsonLd': 'my own words' } } as Entry;
  expect(bindingProblems('ArenaBarChart', excepted, patterns)[0]).toContain('restates a reason the obligation map owns');
});

test('an added pattern is additive, and its exceptions answer to its own requirements', () => {
  const added = shipped({ also: [{ pattern: 'structured-data', met: {}, exceptions: {} }] });
  expect(bindingProblems('ArenaSwitch', added, patterns).join(' ')).toContain('is refused on');
  const notAdditive = shipped({ also: [{ pattern: 'checkbox', met: {}, exceptions: {} }] });
  expect(bindingProblems('ArenaSwitch', notAdditive, patterns).join(' ')).toContain('is not an additive pattern');
});

test('two differing real patterns need a declared divergence, and absent against one does not', () => {
  expect(crossLayerProblems('ArenaSwitch', { compose: shipped(), swiftui: absent } as unknown as Entry)).toEqual([]);
  const disagree = { compose: shipped(), swiftui: shipped({ pattern: 'checkbox' }) } as unknown as Entry;
  expect(crossLayerProblems('ArenaSwitch', disagree)[0]).toContain('decide which is the defect');
  expect(crossLayerProblems('ArenaSwitch', { ...disagree, divergesFrom: 'the platform control is a checkbox here' } as unknown as Entry)).toEqual([]);
});

test('an additive pattern one layer owes and the other does not is a divergence too', () => {
  const withAlso = shipped({ also: [{ pattern: 'structured-data', met: {}, exceptions: {} }] });
  expect(crossLayerProblems('ArenaSwitch', { compose: withAlso, swiftui: shipped() } as unknown as Entry)[0])
    .toContain('moves nothing a person can see');
  expect(crossLayerProblems('ArenaSwitch', { compose: withAlso, swiftui: withAlso } as unknown as Entry)).toEqual([]);
});

test('the register is held to the payload in both directions', () => {
  expect(componentProblems(['ArenaInventedComponent'])[0]).toContain('has no entry in BINDINGS');
  expect(componentProblems([]).join(' ')).toContain('Delete the entry');
});
