import { test, expect } from 'bun:test';
import {
  SIGNATURES, memberNamesOf, node, parametersIn, zeroDrawnProblem, zeroMemberProblem,
} from './check-members.ts';
import { drawnComponents, layerCoverageProblems } from '../../lib/arena/component-sources.ts';
import {
  BEYOND, DERIVED_DEFAULT, MEMBERS, NATIVE_FORMS, acceptedDefaults, expectedType, isAnswered,
  parameterProblems, partitionProblems, shapeProblems, staleComponentProblems, staleDerivedProblems,
  staleExtraProblems,
} from '../../lib/arena/component-members.ts';
import type { ApiType, ComponentMember } from '../../lib/contracts/api-types.ts';

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
  expect([...parametersIn(kotlin, SIGNATURES.compose.opens('ArenaButton'), SIGNATURES.compose.parameter).keys()])
    .toEqual(['content', 'click', 'modifier']);
  expect([...parametersIn(swift, SIGNATURES.swiftui.opens('ArenaButton'), SIGNATURES.swiftui.parameter).keys()])
    .toEqual(['content', 'variant', 'click']);
  expect(parametersIn(kotlin, SIGNATURES.compose.opens('ArenaCard'), SIGNATURES.compose.parameter).size).toBe(0);
});

test('a parameter carries its type and its default, or the absence of one', () => {
  const compose = parametersIn(kotlin, SIGNATURES.compose.opens('ArenaButton'), SIGNATURES.compose.parameter);
  expect(compose.get('content')).toEqual({ type: 'String', default: null });
  expect(compose.get('modifier')).toEqual({ type: 'Modifier', default: 'Modifier' });
  const swiftui = parametersIn(swift, SIGNATURES.swiftui.opens('ArenaButton'), SIGNATURES.swiftui.parameter);
  expect(swiftui.get('variant')).toEqual({ type: 'ArenaButtonVariant', default: '.primary' });
  expect(swiftui.get('click')).toEqual({ type: '@escaping () -> Void', default: null });
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
  const answers = MEMBERS.get('ArenaButton');
  expect(answers).toBeDefined();
  const answered = new Set([...(answers ?? new Map()).values()]
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

const VARIANT: ApiType = {
  name: 'ArenaButtonVariant',
  kind: 'enum',
  values: ['primary', 'secondary', 'ghost', 'danger'],
};

const ENUM_MEMBER: ComponentMember = { form: 'enum', type: 'ArenaButtonVariant', default: 'primary' };
const FLAG: ComponentMember = { form: 'primitive', type: 'boolean', default: false };
const SLOT: ComponentMember = { form: 'slot' };

test('the two forms the contract types by form are the only ones written down', () => {
  expect([...NATIVE_FORMS.keys()].sort()).toEqual(['event', 'slot']);
  expect(NATIVE_FORMS.get('event')).toEqual({ compose: '() -> Unit', swiftui: '@escaping () -> Void' });
});

test('a type comes off the contract for every form the contract types by type', () => {
  expect(expectedType(FLAG, 'ArenaButton.full', 'compose')).toBe('Boolean');
  expect(expectedType(FLAG, 'ArenaButton.full', 'swiftui')).toBe('Bool');
  expect(expectedType(ENUM_MEMBER, 'ArenaButton.variant', 'compose')).toBe('ArenaButtonVariant');
  expect(expectedType(SLOT, 'ArenaButton.content', 'swiftui')).toBe('String');
});

test('an enum default is spelled the way each language spells its own case', () => {
  expect(acceptedDefaults('variant', ENUM_MEMBER, [VARIANT], 'compose')).toEqual(['ArenaButtonVariant.Primary']);
  expect(acceptedDefaults('variant', ENUM_MEMBER, [VARIANT], 'swiftui'))
    .toEqual(['.primary', 'ArenaButtonVariant.primary']);
  expect(acceptedDefaults('full', FLAG, [], 'compose')).toEqual(['false']);
  expect(acceptedDefaults('content', SLOT, [], 'compose')).toEqual([]);
});

test('a type, a default and a missing default are each reported against the contract', () => {
  const right = { type: 'ArenaButtonVariant', default: 'ArenaButtonVariant.Primary' };
  expect(shapeProblems('ArenaButton', 'variant', ENUM_MEMBER, right, [VARIANT], 'compose')).toEqual([]);

  const wrongType = { type: 'String', default: 'ArenaButtonVariant.Primary' };
  expect(shapeProblems('ArenaButton', 'variant', ENUM_MEMBER, wrongType, [VARIANT], 'compose')[0])
    .toContain('two libraries from one contract');

  const wrongDefault = { type: 'ArenaButtonVariant', default: 'ArenaButtonVariant.Danger' };
  expect(shapeProblems('ArenaButton', 'variant', ENUM_MEMBER, wrongDefault, [VARIANT], 'compose')[0])
    .toContain('two different controls');

  const noDefault = { type: 'ArenaButtonVariant', default: null };
  expect(shapeProblems('ArenaButton', 'variant', ENUM_MEMBER, noDefault, [VARIANT], 'compose')[0])
    .toContain('compiles on one layer and not the other');

  const invented = { type: 'String', default: '""' };
  expect(shapeProblems('ArenaButton', 'content', SLOT, invented, [], 'compose')[0])
    .toContain('declares no default for it');
});

test('the swiftui case is accepted written short or written in full', () => {
  const short = { type: 'ArenaButtonVariant', default: '.primary' };
  const full = { type: 'ArenaButtonVariant', default: 'ArenaButtonVariant.primary' };
  expect(shapeProblems('ArenaButton', 'variant', ENUM_MEMBER, short, [VARIANT], 'swiftui')).toEqual([]);
  expect(shapeProblems('ArenaButton', 'variant', ENUM_MEMBER, full, [VARIANT], 'swiftui')).toEqual([]);
});

test('DERIVED_DEFAULT is empty, and its emptiness is the claim', () => {
  expect(DERIVED_DEFAULT.size).toBe(0);
  expect(staleDerivedProblems(new Set(['variant']))).toEqual([]);
});
