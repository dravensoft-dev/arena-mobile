/* What each member of a published component's contract becomes, per layer. A member either
 * reaches a native parameter under a name both layers spell the same way, or it is excepted
 * with the reason it does not cross, and the two PARTITION the contract's own member list: a
 * member named in neither is the silence this register exists to end. BEYOND is the other
 * direction, for a parameter no member asks for, which is either an idiom of one toolkit or an
 * axis this repository's seams take from a caller because no library here reads a device. */

import { sortedByCodeUnit } from '../../utils/compare.ts';
import { LAYERS, type Layer } from './behaviour-obligations.ts';

export type Answer = { parameter: string } | { excepted: string };

export type Extra = { why: string; layer?: Layer };

const NO_FORM = 'a form submission mechanism: the member names a field of an HTML form and what it '
  + 'answers is what a browser posts. Neither toolkit has a form to belong to, so the member reaches '
  + 'no parameter rather than reaching a parameter that does nothing';

const NO_ICON = 'a Phosphor class name, which is a font a stylesheet names and neither toolkit reads. '
  + 'What an icon IS on this side is an open question and not this component\'s to settle, so the '
  + 'member is excepted and the exception dies with the answer';

export const MEMBERS = new Map<string, Map<string, Answer>>([
  ['ArenaButton', new Map<string, Answer>([
    ['content', { parameter: 'content' }],
    ['variant', { parameter: 'variant' }],
    ['size', { parameter: 'size' }],
    ['loading', { parameter: 'loading' }],
    ['full', { parameter: 'full' }],
    ['disabled', { parameter: 'disabled' }],
    ['click', { parameter: 'click' }],
    ['icon', { excepted: NO_ICON }],
    ['iconRight', { excepted: NO_ICON }],
    ['type', { excepted: NO_FORM }],
    ['name', { excepted: NO_FORM }],
    ['value', { excepted: NO_FORM }],
    ['form', { excepted: NO_FORM }],
    ['autoFocus', {
      excepted: 'focus on appearance is a decision about a screen rather than about a control. Both toolkits '
        + 'hand the caller what moves it, a requester on one side and a focus state on the other, and a control '
        + 'that takes focus because a member said so takes that decision from the screen that placed it',
    }],
    ['tabStop', {
      excepted: 'a tab sequence belongs to a document and neither toolkit has one. What the member answers '
        + 'upstream is whether a control is reached from the page order; here the order is the accessibility '
        + "tree's, and a composite that manages its own focus says so on the composite and never on each child",
    }],
  ])],
]);

export const BEYOND = new Map<string, Map<string, Extra>>([
  ['ArenaButton', new Map<string, Extra>([
    ['modifier', {
      layer: 'compose',
      why: 'the Compose convention, and the reason it is not a member: a caller places, sizes and decorates a '
        + 'composable through it, so the library does not grow a parameter for each of those',
    }],
    ['increasedContrast', {
      why: 'the accessibility axis, which arrives as a parameter because no library here reads a device. That is '
        + 'the seam ArenaContrast states, and a control drawing a boundary is the first thing it applies to',
    }],
    ['targetFloor', {
      why: "the platform's own minimum touch target, a constant of a platform rather than a value the contract "
        + 'carries, so it arrives from the caller the way a safe-area inset does',
    }],
  ])],
]);

export function isAnswered(answer: Answer): answer is { parameter: string } {
  return 'parameter' in answer;
}

export function partitionProblems(component: string, declared: readonly string[]) {
  const answers = MEMBERS.get(component);
  if (!answers) {
    return [`${component} carries a native source and MEMBERS opens no member surface for it, so the members a `
      + 'consumer calls it with are held by nothing'];
  }
  return sortedByCodeUnit([
    ...declared.filter((member) => !answers.has(member)).map((member) => `${component}.${member} is a member the `
      + 'pinned contract declares and MEMBERS neither answers nor excepts. Silence over a member is the ambiguity this register exists to end'),
    ...[...answers.keys()].filter((member) => !declared.includes(member)).map((member) => `${component}.${member} is `
      + 'named in MEMBERS and the pinned contract declares no such member. Delete the entry'),
  ]);
}

export function parameterProblems(component: string, parameters: ReadonlySet<string>, layer: Layer) {
  const answers = MEMBERS.get(component) ?? new Map<string, Answer>();
  const extras = BEYOND.get(component) ?? new Map<string, Extra>();
  const owed = [...answers].flatMap(([member, answer]) => (isAnswered(answer) ? [[member, answer.parameter] as const] : []));
  return sortedByCodeUnit([
    ...owed.filter(([, parameter]) => !parameters.has(parameter))
      .map(([member, parameter]) => `${component} on ${layer} declares no ${parameter} parameter, and MEMBERS answers `
        + `${member} with one. A member answered on one layer and not on the other offers a consumer two libraries`),
    ...[...parameters].filter((parameter) => !owed.some(([, answered]) => answered === parameter))
      .filter((parameter) => {
        const extra = extras.get(parameter);
        return extra === undefined || (extra.layer !== undefined && extra.layer !== layer);
      })
      .map((parameter) => `${component} on ${layer} takes a ${parameter} parameter that answers no member of its `
        + 'contract and is not named in BEYOND, so the surface has grown a decision this repository authored'),
  ]);
}

export function staleExtraProblems(component: string, byLayer: ReadonlyMap<Layer, ReadonlySet<string>>) {
  const extras = BEYOND.get(component) ?? new Map<string, Extra>();
  return sortedByCodeUnit([...extras].flatMap(([parameter, extra]) => {
    const layers = extra.layer === undefined ? LAYERS : [extra.layer];
    const carried = layers.some((layer) => byLayer.get(layer)?.has(parameter) === true);
    return carried ? [] : [`BEYOND names ${component}.${parameter}, and no layer that owes it takes one: ${extra.why}`];
  }));
}

export function staleComponentProblems(carried: readonly string[]) {
  return sortedByCodeUnit([...MEMBERS.keys()]
    .filter((component) => !carried.includes(component))
    .map((component) => `MEMBERS opens the member surface of ${component}, and neither layer carries a source for it. `
      + 'A member surface nothing draws is a partition of a contract nobody calls'));
}
