import { test, expect } from 'bun:test';
import {
  aliasesIn, contrastProblems, measured, OWED, PAIRS, pairProblems, parityProblems,
  resolutionProblems, COMPOSED, UNMET, staleComposedProblems, staleOwedProblems, unmetProblems,
  zeroCompositionProblem, zeroMeasuredProblem,
} from './check-composition.ts';

const KOTLIN = [
  'public val ArenaColorScheme.bg: Color get() = base100',
  'public val ArenaColorScheme.textStrong: Color get() = baseContent',
].join('\n');

const SWIFT = [
  '    var bg: Color { base100 }',
  '    var textStrong: Color { baseContent }',
].join('\n');

test('both idioms read as the same set of aliases', () => {
  expect(aliasesIn(KOTLIN)).toEqual(new Map([['bg', 'base100'], ['textStrong', 'baseContent']]));
  expect(aliasesIn(SWIFT)).toEqual(new Map([['bg', 'base100'], ['textStrong', 'baseContent']]));
});

test('a member one layer offers and the other does not is the failure nothing else reports', () => {
  expect(parityProblems(aliasesIn(KOTLIN), aliasesIn(SWIFT))).toEqual([]);
  const missing = parityProblems(aliasesIn(KOTLIN), new Map([['bg', 'base100']]));
  expect(missing).toHaveLength(1);
  expect(missing[0]).toContain('textStrong');
});

test('an alias pointing at a member the scheme does not declare fails', () => {
  const members = new Set(['base100', 'baseContent']);
  expect(resolutionProblems(aliasesIn(KOTLIN), members)).toEqual([]);
  const wrong = resolutionProblems(new Map([['bg', 'base999']]), members);
  expect(wrong[0]).toContain('base999');
});

test('every alias says whether it is ink or ground, and one that does not fails', () => {
  for (const name of aliasesIn(KOTLIN).keys()) expect(COMPOSED.has(name)).toBe(true);
  const orphan = resolutionProblems(new Map([['mystery', 'base100']]), new Set(['base100']));
  expect(orphan[0]).toContain('mystery');
});

test('an ink that cannot be read on a ground it is drawn over fails', () => {
  const colours = {
    base100: [0.05, 0.05, 0.05] as [number, number, number],
    baseContent: [0.06, 0.06, 0.06] as [number, number, number],
  };
  const aliases = new Map([['bg', 'base100'], ['textStrong', 'baseContent']]);
  const problems = contrastProblems(aliases, colours, 'dark');
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('textStrong');
  expect(problems[0]).toContain('4.5');
});

test('a content colour illegible on the fill this table maps it onto fails', () => {
  const colours = {
    primary: [0.71, 0.16, 0.13] as [number, number, number],
    primaryContent: [0.72, 0.17, 0.14] as [number, number, number],
  };
  const aliases = new Map([['accent', 'primary'], ['onAccent', 'primaryContent']]);
  expect(PAIRS.length).toBeGreaterThan(0);
  const problems = pairProblems(aliases, colours, 'dark');
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('onAccent');
  expect(problems[0]).toContain('accent');
});

test('a ground Arena set no bar against is carried with its reason and never swept', () => {
  const raised = COMPOSED.get('surfaceRaised');
  const input = COMPOSED.get('surfaceInput');
  const fill = COMPOSED.get('dangerFill');
  for (const role of [raised, input, fill]) {
    expect(role?.kind).toBe('ground');
    expect(role?.kind === 'ground' && role.swept).toBe(false);
    expect(role?.why.length).toBeGreaterThan(0);
  }
  const bg = COMPOSED.get('bg');
  expect(bg?.kind).toBe('ground');
  expect(bg?.kind === 'ground' && bg.swept).toBe(true);
});

test('a separator is reported and not gated, because 1.4.11 measures a control boundary', () => {
  for (const name of ['border', 'borderStrong', 'accent', 'focusRing']) {
    const role = COMPOSED.get(name);
    expect(role?.kind).toBe('ink');
    expect(role?.kind === 'ink' && role.gate).toBeNull();
    expect(role?.why).toContain('NOT GATED');
  }
});

test('a table with every member reported and none gated measures nothing and fails', () => {
  const aliases = new Map([['bg', 'base100'], ['textStrong', 'baseContent']]);
  expect(measured(aliases)).toBe(1 * 1 + PAIRS.length);
  expect(zeroMeasuredProblem(measured(new Map([['bg', 'base100']])) - PAIRS.length)).toContain('measured 0 inks');
  expect(zeroMeasuredProblem(1)).toBeNull();
});

test('an entry outliving the member it describes fails, and the map holds itself', () => {
  const whole = new Map([...COMPOSED.keys()].map((name) => [name, 'base100']));
  expect(staleComposedProblems(whole)).toEqual([]);
  const shrunk = new Map(whole);
  shrunk.delete('danger');
  const stale = staleComposedProblems(shrunk);
  expect(stale).toHaveLength(1);
  expect(stale[0]).toContain('danger');
  expect(stale[0]).toContain('neither layer composes');
});

test('the map of what waits on a pin fails the moment the pin brings it', () => {
  expect(OWED.size).toBeGreaterThan(0);
  expect(staleOwedProblems([])).toEqual([]);
  const [firstOwed] = [...OWED.keys()];
  expect(firstOwed).toBeDefined();
  const arrived = staleOwedProblems([{ name: firstOwed ?? '' }]);
  expect(arrived).toHaveLength(1);
  expect(arrived[0]).toContain('is now carried by the pinned contract');
});

test('a run that measured nothing is a failure and not a pass', () => {
  expect(zeroCompositionProblem(0)).toContain('0 composition');
  expect(zeroCompositionProblem(1)).toBeNull();
});

test('a bar the palette does not clear is recorded, and the record dies when the palette clears it', () => {
  const aliases = new Map([['bg', 'base100'], ['borderStrong', 'neutral'], ['accent', 'primary']]);
  const dim = { dark: { base100: [0, 0, 0] as const, neutral: [0.05, 0.05, 0.05] as const, primary: [0.05, 0.05, 0.05] as const } };
  expect(unmetProblems(aliases, dim as never)).toEqual([]);
  const bright = { dark: { base100: [0, 0, 0] as const, neutral: [1, 1, 1] as const, primary: [1, 1, 1] as const } };
  expect(unmetProblems(aliases, bright as never)).toHaveLength(UNMET.size);
  expect(unmetProblems(aliases, bright as never)[0]).toContain('Gate it in COMPOSED and delete the entry');
  expect(unmetProblems(new Map([['bg', 'base100']]), dim as never)[0]).toContain('a bar is recorded over nothing');
});

test('every bar the palette does not clear says why it is not raised here', () => {
  for (const [name, unmet] of UNMET) {
    expect(COMPOSED.has(name)).toBe(true);
    expect(unmet.gate).toBeGreaterThan(0);
    expect(unmet.why.length).toBeGreaterThan(120);
  }
});
