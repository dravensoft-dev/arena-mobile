import { test, expect } from 'bun:test';
import {
  ABSENT_REASON, AFFORDANCES, DRAWN, answersOf, componentProblems, isAbsent, isDrawn,
  partitionProblems, presenceProblems, symbolProblems, vocabularyProblems, type Entry,
} from './affordance-bindings.ts';
import { LAYERS, type Layer } from './behaviour-obligations.ts';

const BUTTON = DRAWN.get('ArenaButton') as Entry;

test('AFFORDANCES states a capability per affordance, with no web in any of them', () => {
  expect([...AFFORDANCES.keys()].sort()).toEqual(['focus', 'hover', 'press']);
  for (const why of AFFORDANCES.values()) expect(why.length).toBeGreaterThan(0);
});

test('the register is keyed by the contract, so an absence is recorded rather than silent', () => {
  expect(ABSENT_REASON).toContain('recorded absence');
  const absent = [...DRAWN.values()].filter(isAbsent);
  expect(absent.length).toBe(DRAWN.size - 1);
  for (const entry of absent) expect(entry.absent).toBe(ABSENT_REASON);
});

test('the one drawn component draws focus and excepts the two the contract carries no value for', () => {
  const answers = answersOf(BUTTON);
  expect(Object.keys(answers).sort()).toEqual(['focus', 'hover', 'press']);
  const focus = answers.focus as { drawn: Record<Layer, string> };
  expect(isDrawn(focus)).toBe(true);
  for (const layer of LAYERS) expect(focus.drawn[layer].length).toBeGreaterThan(0);
  for (const key of ['hover', 'press']) {
    const answer = answers[key] as { excepted: string };
    expect(isDrawn(answer)).toBe(false);
    expect(answer.excepted).toContain('contract');
  }
});

test('a component the contract carries with no entry, and an entry with no component, both fail', () => {
  expect(componentProblems([...DRAWN.keys()])).toEqual([]);
  expect(componentProblems([...DRAWN.keys(), 'ArenaGhost'])[0]).toContain('silent hole');
  expect(componentProblems([...DRAWN.keys()].slice(1))[0]).toContain('Delete the entry');
});

test('an affordance nobody translated, and a translation nobody asks for, both fail', () => {
  expect(vocabularyProblems(['focus', 'hover', 'press'])).toEqual([]);
  expect(vocabularyProblems(['focus', 'hover', 'press', 'drag'])[0]).toContain('never translated');
  expect(vocabularyProblems(['focus', 'hover'])[0]).toContain('nothing is ever put in');
});

test('drawn and excepted partition the contract, and silence over one is the failure', () => {
  expect(partitionProblems('ArenaButton', BUTTON, ['focus', 'hover', 'press'])).toEqual([]);
  expect(partitionProblems('ArenaButton', BUTTON, ['focus', 'hover', 'press', 'drag'])[0])
    .toContain('neither drawn nor excepted');
  expect(partitionProblems('ArenaButton', BUTTON, ['focus', 'hover'])[0]).toContain('its contract does not declare');
  expect(partitionProblems('ArenaAlert', DRAWN.get('ArenaAlert') as Entry, ['focus'])).toEqual([]);
});

test('an answer drawn on one layer and named on neither is a symbol nothing can look for', () => {
  const halfway: Entry = { answers: { focus: { drawn: { compose: 'Modifier.onFocusChanged', swiftui: '' } } } };
  const problems = partitionProblems('ArenaGhost', halfway, ['focus']);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('swiftui');
});

test('a recorded absence and a drawn component each fail when the tree disagrees', () => {
  expect(presenceProblems('ArenaButton', BUTTON, new Set(LAYERS))).toEqual([]);
  expect(presenceProblems('ArenaButton', BUTTON, new Set())[0]).toContain('nobody draws');
  const absent = DRAWN.get('ArenaAlert') as Entry;
  expect(presenceProblems('ArenaAlert', absent, new Set())).toEqual([]);
  expect(presenceProblems('ArenaAlert', absent, new Set<Layer>(['compose']))[0]).toContain('outlived the component');
});

test('a symbol named here and written nowhere is the ring nobody sees', () => {
  expect(symbolProblems('ArenaButton', BUTTON, 'compose', '.onFocusChanged { focused = it.isFocused }')).toEqual([]);
  const problems = symbolProblems('ArenaButton', BUTTON, 'compose', 'public fun ArenaButton(');
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('the ring nobody sees');
  expect(symbolProblems('ArenaButton', BUTTON, 'compose', null)).toEqual([]);
});
