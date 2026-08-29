/* What each component of the pinned contract DRAWS for the three states a reader can put it in,
 * in each layer. Keyed by the CONTRACT and never by what this repository publishes, so the
 * register cannot be empty and a component the payload gains is a hole the gate reports. Arena
 * gets focus, hover and press from a browser drawing an element; neither toolkit has one, so each
 * is an obligation applied by hand here, and `drawn` and `excepted` PARTITION the affordances a
 * contract declares: silence upstream means the browser answered it and silence here would mean
 * nothing at all. */

import { sortedByCodeUnit } from '../../utils/compare.ts';
import { LAYERS, type Layer } from './behaviour-obligations.ts';
import { carries } from './native-symbol.ts';

export const AFFORDANCES = new Map<string, string>([
  ['focus', 'the control is the keyboard\'s current target, and what says so is drawn rather than inherited: a '
    + 'browser paints a ring over an element and neither toolkit paints anything at all'],
  ['hover', 'a pointer is over the control and has not activated it, which Android reports for a mouse or a stylus '
    + 'and iPadOS for a pointer, and a phone never reports'],
  ['press', 'the control is being activated, between the gesture starting and the gesture ending'],
]);

const NO_WASH = 'the pinned contract carries no hover value at all. What a control lightens with is a level or a '
  + 'soft, and OWED in scripts/check/arena/check-composition.ts names every one of them as a ratio Arena has not '
  + 'contracted yet, so drawing one here means inventing a value over a palette this repository consumes. The '
  + 'exception dies with the raised pin that brings the token in';

const NO_PRESSED = 'the same absence read at the moment of activation. A pressed control is drawn by holding an ink '
  + 'back or laying a wash over it, and both are the ratio the contract does not carry, so what this layer would '
  + 'reach for is a number authored here over a skin it consumes. The exception dies with the same raised pin the '
  + 'wash waits on';

export const ABSENT_REASON = 'this repository draws no such component yet, so no affordance of its contract has a '
  + 'surface to be drawn on. The entry is the recorded absence rather than a silent hole, and it dies when the '
  + 'component lands';

export type Answer = { drawn: Record<Layer, string> } | { excepted: string };
export type Entry = { absent: string } | { answers: Record<string, Answer> };

export const DRAWN = new Map<string, Entry>([
  ['ArenaActivityFeed', { absent: ABSENT_REASON }],
  ['ArenaAlert', { absent: ABSENT_REASON }],
  ['ArenaAppBar', { absent: ABSENT_REASON }],
  ['ArenaAppLogo', { absent: ABSENT_REASON }],
  ['ArenaAvatar', { absent: ABSENT_REASON }],
  ['ArenaBadge', { absent: ABSENT_REASON }],
  ['ArenaBarChart', { absent: ABSENT_REASON }],
  ['ArenaBoard', { absent: ABSENT_REASON }],
  ['ArenaBoardColumn', { absent: ABSENT_REASON }],
  ['ArenaBottomNav', { absent: ABSENT_REASON }],
  ['ArenaBottomNavItem', { absent: ABSENT_REASON }],
  ['ArenaBreadcrumbs', { absent: ABSENT_REASON }],
  ['ArenaBulkActionBar', { absent: ABSENT_REASON }],
  ['ArenaButton', {
    answers: {
      focus: { drawn: { compose: 'Modifier.onFocusChanged', swiftui: '.focused' } },
      hover: { excepted: NO_WASH },
      press: { excepted: NO_PRESSED },
    },
  }],
  ['ArenaCalendar', { absent: ABSENT_REASON }],
  ['ArenaCalendarEvent', { absent: ABSENT_REASON }],
  ['ArenaCard', { absent: ABSENT_REASON }],
  ['ArenaChartCard', { absent: ABSENT_REASON }],
  ['ArenaCheckbox', { absent: ABSENT_REASON }],
  ['ArenaCommandPalette', { absent: ABSENT_REASON }],
  ['ArenaConfirmDialog', { absent: ABSENT_REASON }],
  ['ArenaDialog', { absent: ABSENT_REASON }],
  ['ArenaDoughnutChart', { absent: ABSENT_REASON }],
  ['ArenaEmptyState', { absent: ABSENT_REASON }],
  ['ArenaErrorState', { absent: ABSENT_REASON }],
  ['ArenaFigure', { absent: ABSENT_REASON }],
  ['ArenaGrid', { absent: ABSENT_REASON }],
  ['ArenaHero', { absent: ABSENT_REASON }],
  ['ArenaHorizontalBarChart', { absent: ABSENT_REASON }],
  ['ArenaIconButton', { absent: ABSENT_REASON }],
  ['ArenaInput', { absent: ABSENT_REASON }],
  ['ArenaKeyValue', { absent: ABSENT_REASON }],
  ['ArenaLineChart', { absent: ABSENT_REASON }],
  ['ArenaMain', { absent: ABSENT_REASON }],
  ['ArenaMenu', { absent: ABSENT_REASON }],
  ['ArenaOnboarding', { absent: ABSENT_REASON }],
  ['ArenaPageHead', { absent: ABSENT_REASON }],
  ['ArenaPagination', { absent: ABSENT_REASON }],
  ['ArenaPeopleList', { absent: ABSENT_REASON }],
  ['ArenaPersonRow', { absent: ABSENT_REASON }],
  ['ArenaProgressBar', { absent: ABSENT_REASON }],
  ['ArenaPyramidChart', { absent: ABSENT_REASON }],
  ['ArenaRadarChart', { absent: ABSENT_REASON }],
  ['ArenaRadio', { absent: ABSENT_REASON }],
  ['ArenaRadioGroup', { absent: ABSENT_REASON }],
  ['ArenaScatterChart', { absent: ABSENT_REASON }],
  ['ArenaScroller', { absent: ABSENT_REASON }],
  ['ArenaScrollerItem', { absent: ABSENT_REASON }],
  ['ArenaSection', { absent: ABSENT_REASON }],
  ['ArenaSegmentedControl', { absent: ABSENT_REASON }],
  ['ArenaSelect', { absent: ABSENT_REASON }],
  ['ArenaSheet', { absent: ABSENT_REASON }],
  ['ArenaSideNav', { absent: ABSENT_REASON }],
  ['ArenaSideNavCollapsible', { absent: ABSENT_REASON }],
  ['ArenaSideNavItem', { absent: ABSENT_REASON }],
  ['ArenaSideNavSection', { absent: ABSENT_REASON }],
  ['ArenaSiteFooter', { absent: ABSENT_REASON }],
  ['ArenaSkeleton', { absent: ABSENT_REASON }],
  ['ArenaSkipLink', { absent: ABSENT_REASON }],
  ['ArenaSpinner', { absent: ABSENT_REASON }],
  ['ArenaStatCard', { absent: ABSENT_REASON }],
  ['ArenaSwitch', { absent: ABSENT_REASON }],
  ['ArenaTab', { absent: ABSENT_REASON }],
  ['ArenaTable', { absent: ABSENT_REASON }],
  ['ArenaTableCell', { absent: ABSENT_REASON }],
  ['ArenaTableRow', { absent: ABSENT_REASON }],
  ['ArenaTabs', { absent: ABSENT_REASON }],
  ['ArenaTag', { absent: ABSENT_REASON }],
  ['ArenaTextarea', { absent: ABSENT_REASON }],
  ['ArenaToast', { absent: ABSENT_REASON }],
  ['ArenaToastHost', { absent: ABSENT_REASON }],
  ['ArenaTooltip', { absent: ABSENT_REASON }],
  ['ArenaUnauthCard', { absent: ABSENT_REASON }],
]);

export function isDrawn(answer: Answer): answer is { drawn: Record<Layer, string> } {
  return 'drawn' in answer;
}

export function isAbsent(entry: Entry): entry is { absent: string } {
  return 'absent' in entry;
}

export function answersOf(entry: Entry) {
  return isAbsent(entry) ? {} : entry.answers;
}

export function componentProblems(components: readonly string[], register = DRAWN) {
  const carried = new Set(components);
  return sortedByCodeUnit([
    ...components.filter((component) => !register.has(component))
      .map((component) => `${component} is a component the pinned contract carries and has no entry in DRAWN, which `
        + 'is the silent hole this register exists to stop'),
    ...[...register.keys()].filter((component) => !carried.has(component))
      .map((component) => `DRAWN declares ${component} and the pinned contract carries no such component. Delete the entry`),
  ]);
}

export function vocabularyProblems(declared: readonly string[], known = AFFORDANCES) {
  const asked = new Set(declared);
  return sortedByCodeUnit([
    ...declared.filter((affordance) => !known.has(affordance))
      .map((affordance) => `${affordance} is an affordance the pinned contract declares and AFFORDANCES states no `
        + 'capability for it, so a register answers a word this repository never translated'),
    ...[...known.keys()].filter((affordance) => !asked.has(affordance))
      .map((affordance) => `AFFORDANCES states ${affordance} and no component contract declares it, so a capability `
        + 'is translated for a state nothing is ever put in'),
  ]);
}

export function partitionProblems(component: string, entry: Entry, declared: readonly string[]) {
  if (isAbsent(entry)) return [];
  const answers = entry.answers;
  const answered = Object.keys(answers);
  return sortedByCodeUnit([
    ...declared.filter((affordance) => !answered.includes(affordance))
      .map((affordance) => `${component}: ${affordance} is neither drawn nor excepted. Upstream an exception list is `
        + 'a subset and silence means the element answered it; here silence means nothing at all, which is the '
        + 'ambiguity this register exists to end'),
    ...answered.filter((affordance) => !declared.includes(affordance))
      .map((affordance) => `${component}: names ${affordance}, which its contract does not declare, so the component `
        + 'draws a state its contract never asked it to'),
    ...Object.entries(answers).flatMap(([affordance, answer]) => (isDrawn(answer)
      ? LAYERS.filter((layer) => !answer.drawn[layer])
        .map((layer) => `${component}: claims ${affordance} drawn and names no ${layer} symbol for it, so nothing `
          + 'can look for one')
      : [])),
  ]);
}

export function presenceProblems(component: string, entry: Entry, drawnBy: ReadonlySet<Layer>) {
  if (isAbsent(entry) && drawnBy.size > 0) {
    return [`DRAWN records ${component} absent and ${[...drawnBy].join(' and ')} carries a source for it. `
      + 'The recorded absence outlived the component, so answer its affordances rather than recording it missing'];
  }
  if (!isAbsent(entry) && drawnBy.size === 0) {
    return [`DRAWN answers the affordances of ${component} and neither layer carries a source for it, so a partition `
      + 'is held over a component nobody draws'];
  }
  return [];
}

export function symbolProblems(component: string, entry: Entry, layer: Layer, source: string | null) {
  if (source === null) return [];
  return sortedByCodeUnit(Object.entries(answersOf(entry)).flatMap(([affordance, answer]) => {
    if (!isDrawn(answer)) return [];
    const symbol = answer.drawn[layer];
    if (carries(source, symbol)) return [];
    return [`${component}:${layer} claims ${affordance} drawn by ${symbol}, and that source carries no such symbol. `
      + 'A browser draws all three for free and neither toolkit draws any of them, so an affordance named here and '
      + 'written nowhere is the ring nobody sees'];
  }));
}
