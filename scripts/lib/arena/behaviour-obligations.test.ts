import { test, expect } from 'bun:test';
import {
  LAYERS, OBLIGATIONS, ROLES, answerFor, isRefused, refusedKeys,
  staleObligationProblems, staleRoleProblems, unmappedRoleProblems, untranslatedProblems,
} from './behaviour-obligations.ts';
import { type Pattern } from '../contracts/behaviour.ts';

const patterns = (over: Pattern[]) => new Map(over.map((p) => [p.name as string, p]));

const isSymbol = (answer: Parameters<typeof isRefused>[0]): answer is { symbol: string } => !isRefused(answer);

test('every key any pattern declares is translated, and every entry names a key some pattern declares', () => {
  const declared = patterns([{ name: 'x', requires: { 'roles.element': 'switch' } }]);
  expect(untranslatedProblems(declared)).toEqual([]);
  expect(staleObligationProblems(declared).length).toBeGreaterThan(0);
  expect(staleObligationProblems(declared)[0]).toContain('and no pattern declares it');
  expect(untranslatedProblems(patterns([{ name: 'x', requires: { 'roles.invented': 'x' } }]))[0])
    .toContain('reaches no native obligation');
});

test('a role is translated from the element field, in both directions', () => {
  expect(unmappedRoleProblems(patterns([{ name: 'x', element: 'switch', requires: { 'roles.element': 'switch' } }]))).toEqual([]);
  expect(unmappedRoleProblems(patterns([{ name: 'x', element: 'marquee', requires: { 'roles.element': 'marquee' } }]))[0])
    .toContain('reaches no native role');
  expect(staleRoleProblems(patterns([{ name: 'x', element: 'switch', requires: { 'roles.element': 'switch' } }])).length)
    .toBeGreaterThan(0);
});

test('every entry answers both layers, and an answer is a symbol or a refusal with a reason', () => {
  for (const [key, obligation] of OBLIGATIONS) {
    expect(obligation.capability.length).toBeGreaterThan(20);
    for (const layer of LAYERS) {
      const answer = answerFor(key, layer);
      expect(answer).toBeDefined();
      const isSymbol = 'symbol' in answer && answer.symbol.length > 0;
      const isRefusal = 'refused' in answer && answer.refused.length > 40;
      expect(isSymbol || isRefusal).toBe(true);
    }
  }
  for (const [, answers] of ROLES) for (const layer of LAYERS) expect(answers[layer].length).toBeGreaterThan(0);
});

test('a capability is stated with no web in it, so no capability names an attribute or an element', () => {
  const web = /aria-|<[a-z]+>|DOM|attribute/;
  for (const [, obligation] of OBLIGATIONS) {
    expect(obligation.capability).not.toMatch(web);
  }
});

test('a symbol is one spelling, because it is the key a grep over a source will use', () => {
  const composeSymbols = [
    ...[...ROLES.values()].map((answers) => answers.compose),
    ...[...OBLIGATIONS.values()].map((o) => o.compose).filter(isSymbol).map((a) => a.symbol),
  ];
  for (const symbol of composeSymbols) {
    expect(symbol).not.toMatch(/[{}]/);
    expect(symbol).not.toMatch(/=/);
  }
  const swiftSymbols = [
    ...[...ROLES.values()].map((answers) => answers.swiftui),
    ...[...OBLIGATIONS.values()].map((o) => o.swiftui).filter(isSymbol).map((a) => a.symbol),
  ];
  for (const symbol of swiftSymbols) expect(symbol).toMatch(/^(\.|[A-Z])/);
});

test('one concept is spelled one way across both maps, so a grep for it finds every source', () => {
  const byLower = new Map<string, Set<string>>();
  const collect = (symbol: string) => {
    const key = symbol.toLowerCase().replace(/[^a-z]/g, '');
    if (!byLower.has(key)) byLower.set(key, new Set());
    (byLower.get(key) as Set<string>).add(symbol);
  };
  for (const answers of ROLES.values()) { collect(answers.compose); collect(answers.swiftui); }
  for (const obligation of OBLIGATIONS.values()) {
    for (const layer of LAYERS) {
      const answer = obligation[layer];
      if (isSymbol(answer)) collect(answer.symbol);
    }
  }
  for (const [, spellings] of byLower) expect([...spellings]).toHaveLength(1);
});

test('the refused set is small, named, and readable per layer', () => {
  for (const layer of LAYERS) expect(refusedKeys(layer)).toContain('alternative.jsonLd');
});
