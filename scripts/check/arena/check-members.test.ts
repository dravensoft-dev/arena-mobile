import { test, expect } from 'bun:test';
import {
  SIGNATURES, memberNamesOf, node, parametersIn, zeroDrawnProblem, zeroMemberProblem,
} from './check-members.ts';
import { drawnComponents, layerCoverageProblems } from '../../lib/arena/component-sources.ts';
import {
  BEYOND, MEMBERS, isAnswered, parameterProblems, partitionProblems, staleComponentProblems,
  staleExtraProblems,
} from '../../lib/arena/component-members.ts';

const kotlin = [
  'public fun ArenaButton(',
  '    content: String,',
  '    click: () -> Unit,',
  '    modifier: Modifier = Modifier,',
  ') {',
  '    val painted: Dp = 0.dp',
].join('\n');

const swift = [
  '    public init(',
  '        _ content: String,',
  '        variant: ArenaButtonVariant = .primary,',
  '        click: @escaping () -> Void',
  '    ) {',
  '        self.content = content',
].join('\n');

const declared = [...(MEMBERS.get('ArenaButton') as Map<string, unknown>).keys()];

test('a signature is read to its closing bracket and no further, on either idiom', () => {
  expect([...parametersIn(kotlin, SIGNATURES.compose.opens('ArenaButton'), SIGNATURES.compose.parameter)])
    .toEqual(['content', 'click', 'modifier']);
  expect([...parametersIn(swift, SIGNATURES.swiftui.opens('ArenaButton'), SIGNATURES.swiftui.parameter)])
    .toEqual(['content', 'variant', 'click']);
  expect([...parametersIn(kotlin, SIGNATURES.compose.opens('ArenaCard'), SIGNATURES.compose.parameter)]).toEqual([]);
});

test('the members come off the contract, and the register partitions them', () => {
  expect(memberNamesOf({ api: { size: {}, content: {} } })).toEqual(['content', 'size']);
  expect(partitionProblems('ArenaButton', declared)).toEqual([]);
  expect(partitionProblems('ArenaButton', [...declared, 'href'])[0]).toContain('neither answers nor excepts');
  expect(partitionProblems('ArenaButton', declared.filter((one) => one !== 'form'))[0])
    .toContain('declares no such member');
  expect(partitionProblems('ArenaCard', ['content'])[0]).toContain('opens no member surface for it');
});

test('an answered member is a parameter on both layers, and a parameter answering none is authored', () => {
  const answered = new Set([...(MEMBERS.get('ArenaButton') as Map<string, { parameter?: string }>).values()]
    .filter(isAnswered).map((answer) => answer.parameter));
  expect(parameterProblems('ArenaButton', new Set([...answered, 'increasedContrast', 'targetFloor']), 'swiftui')).toEqual([]);
  expect(parameterProblems('ArenaButton', new Set([...answered, 'modifier']), 'compose')).toEqual([]);
  expect(parameterProblems('ArenaButton', new Set([...answered, 'modifier']), 'swiftui')[0])
    .toContain('answers no member of its contract and is not named in BEYOND');
  expect(parameterProblems('ArenaButton', new Set(), 'compose')).toHaveLength(answered.size);
});

test('a parameter no layer takes any more is a reason nobody can act on', () => {
  const both = new Map([['compose', new Set(['modifier', 'increasedContrast', 'targetFloor'])],
    ['swiftui', new Set(['increasedContrast', 'targetFloor'])]] as const);
  expect(staleExtraProblems('ArenaButton', both)).toEqual([]);
  expect(staleExtraProblems('ArenaButton', new Map([['compose', new Set(['modifier'])]] as const)).at(-1))
    .toContain('no layer that owes it takes one');
  expect([...(BEYOND.get('ArenaButton') as Map<string, { why: string }>).values()].every((extra) => extra.why.length > 60)).toBe(true);
});

test('a register entry for a component neither layer draws is a partition nobody calls', () => {
  expect(staleComponentProblems(['ArenaButton'])).toEqual([]);
  expect(staleComponentProblems([])[0]).toContain('neither layer carries a source for it');
});

test('a component drawn on one layer alone is reported from the side that is missing it', () => {
  const byLayer = new Map([['compose', new Map([['ArenaButton', 'a.kt']])], ['swiftui', new Map()]] as const);
  expect(drawnComponents(byLayer)).toEqual(['ArenaButton']);
  expect(layerCoverageProblems('ArenaButton', byLayer)[0]).toContain('not on swiftui');
});

test('zero is a failure, because a gate that walked nothing reports no gaps', () => {
  expect(zeroDrawnProblem(0)).toContain('draws nothing');
  expect(zeroDrawnProblem(1)).toBeNull();
  expect(zeroMemberProblem('ArenaButton', 0)).toContain('closes by answering nothing');
  expect(zeroMemberProblem('ArenaButton', 1)).toBeNull();
});

test('the gate declares no writes, because a gate that emits stops a sweep reporting every problem', () => {
  expect(node.writes).toEqual([]);
  expect(node.feeds).toEqual([]);
  expect(node.name).toBe('check:members');
});
