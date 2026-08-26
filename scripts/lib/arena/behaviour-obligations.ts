/* What a behaviour requirement means with no browser. The KEY travels and the prose beside it
 * does not: a requirement's value names attributes and elements, and a platform with no
 * implicit mapping owes the capability underneath instead. So each entry restates the
 * capability with no web in it and each layer answers with a symbol or refuses with a reason,
 * and a refusal is inherited by every binding rather than retyped into each one.
 * A symbol here is one spelling per capability, and for a component this repository draws,
 * check:behaviour holds the binding that names it against that layer's own source. What no
 * grep reaches is whether the symbol was applied to the right node. */

import { sortedByCodeUnit } from '../../utils/compare.ts';
import { elementRoles, requirementKeys, type Pattern } from '../contracts/behaviour.ts';

export const LAYERS = ['compose', 'swiftui'] as const;
export type Layer = (typeof LAYERS)[number];

export type Answer = { symbol: string } | { refused: string };
export type Obligation = { capability: string } & Record<Layer, Answer>;

const NO_MACHINE_READER = 'nothing reads an application the way a crawler reads a document, so a machine-readable second '
  + 'copy of a structure the accessibility tree already exposes would be a copy with no reader, and one source per fact '
  + 'is the rule that copy would break';

export const ROLES = new Map<string, Record<Layer, string>>([
  ['alert', { compose: 'LiveRegionMode.Assertive', swiftui: 'AccessibilityNotification.Announcement' }],
  ['alertdialog', { compose: 'SemanticsPropertyReceiver.dialog', swiftui: '.accessibilityAddTraits(.isModal)' }],
  ['banner', { compose: 'SemanticsProperties.IsTraversalGroup', swiftui: '.accessibilityElement(children: .contain)' }],
  ['button', { compose: 'Role.Button', swiftui: '.accessibilityAddTraits(.isButton)' }],
  ['checkbox', { compose: 'Role.Checkbox', swiftui: '.accessibilityAddTraits(.isToggle)' }],
  ['combobox', { compose: 'Role.DropdownList', swiftui: '.accessibilityRepresentation' }],
  ['contentinfo', { compose: 'SemanticsProperties.IsTraversalGroup', swiftui: '.accessibilityElement(children: .contain)' }],
  ['dialog', { compose: 'SemanticsPropertyReceiver.dialog', swiftui: '.accessibilityAddTraits(.isModal)' }],
  ['group', { compose: 'SemanticsProperties.IsTraversalGroup', swiftui: '.accessibilityElement(children: .contain)' }],
  ['listbox', { compose: 'Modifier.selectableGroup', swiftui: '.accessibilityElement(children: .contain)' }],
  ['main', { compose: 'SemanticsProperties.TraversalIndex', swiftui: '.accessibilityElement(children: .contain)' }],
  ['navigation', { compose: 'SemanticsProperties.IsTraversalGroup', swiftui: '.accessibilityElement(children: .contain)' }],
  ['progressbar', { compose: 'SemanticsProperties.ProgressBarRangeInfo', swiftui: '.accessibilityValue' }],
  ['status', { compose: 'LiveRegionMode.Polite', swiftui: 'AccessibilityNotification.Announcement' }],
  ['switch', { compose: 'Role.Switch', swiftui: '.accessibilityAddTraits(.isToggle)' }],
  ['textbox', { compose: 'SemanticsProperties.EditableText', swiftui: '.accessibilityTextContentType' }],
  ['toolbar', { compose: 'SemanticsProperties.IsTraversalGroup', swiftui: '.accessibilityElement(children: .contain)' }],
  ['tooltip', { compose: 'SemanticsProperties.PaneTitle', swiftui: '.accessibilityHint' }],
]);

export const OBLIGATIONS = new Map<string, Obligation>([
  ['alternative.jsonLd', {
    capability: 'a second expression of the structure the component already draws, serialised for a reader that never draws the interface at all',
    compose: { refused: NO_MACHINE_READER },
    swiftui: { refused: NO_MACHINE_READER },
  }],
  ['alternative.table', {
    capability: 'every plotted number is reachable without seeing the drawing',
    compose: { symbol: 'SemanticsProperties.ContentDescription' },
    swiftui: { symbol: '.accessibilityChartDescriptor' },
  }],
  ['content.noAutoDismiss', {
    capability: 'a transient surface does not withdraw itself while the reader is still reading it',
    compose: { symbol: 'LocalAccessibilityManager' },
    swiftui: { symbol: '.accessibilityVoiceOverEnabled' },
  }],
  ['focus.never', {
    capability: 'the surface never takes reading focus away from what the reader was on',
    compose: { symbol: 'Modifier.clearAndSetSemantics' },
    swiftui: { symbol: '.accessibilityHidden' },
  }],
  ['focus.onClose', {
    capability: 'closing returns reading focus to whatever opened the surface',
    compose: { symbol: 'FocusRequester.requestFocus' },
    swiftui: { symbol: '.accessibilityFocused' },
  }],
  ['focus.onOpen', {
    capability: 'opening moves reading focus into the surface rather than leaving it behind',
    compose: { symbol: 'FocusRequester.requestFocus' },
    swiftui: { symbol: '.accessibilityFocused' },
  }],
  ['focus.roving', {
    capability: 'the whole arrangement is one stop for a reader moving between components, and moving inside it never adds a second',
    compose: { symbol: 'Modifier.focusGroup' },
    swiftui: { symbol: '.accessibilityElement(children: .contain)' },
  }],
  ['focus.stop', {
    capability: 'the surface is one stop of its own for a reader moving between components',
    compose: { symbol: 'Modifier.focusable' },
    swiftui: { symbol: '.accessibilityElement(children: .combine)' },
  }],
  ['focus.target', {
    capability: 'a named part inside the surface is where reading focus lands',
    compose: { symbol: 'Modifier.focusRequester' },
    swiftui: { symbol: '.accessibilityFocused' },
  }],
  ['focus.trap', {
    capability: 'while the surface is up, nothing behind it is reachable',
    compose: { symbol: 'SemanticsPropertyReceiver.dialog' },
    swiftui: { symbol: '.accessibilityAddTraits(.isModal)' },
  }],
  ['focus.unaffected', {
    capability: 'the surface appears and disappears without moving reading focus at all',
    compose: { symbol: 'Modifier.clearAndSetSemantics' },
    swiftui: { symbol: '.accessibilityHidden' },
  }],
  ['keyboard.ArrowDown', {
    capability: 'the cursor moves one step forward along the arrangement that runs down the surface, clamping at the end',
    compose: { symbol: 'SemanticsActions.SetProgress' },
    swiftui: { symbol: '.accessibilityAdjustableAction' },
  }],
  ['keyboard.ArrowKeys', {
    capability: 'the cursor moves one cell in any direction and never past the edge',
    compose: { symbol: 'SemanticsProperties.CollectionItemInfo' },
    swiftui: { symbol: '.accessibilityAdjustableAction' },
  }],
  ['keyboard.ArrowLeft', {
    capability: 'the cursor moves one step back along the arrangement that runs across the surface, clamping at the start',
    compose: { symbol: 'SemanticsActions.SetProgress' },
    swiftui: { symbol: '.accessibilityAdjustableAction' },
  }],
  ['keyboard.ArrowRight', {
    capability: 'the cursor moves one step forward along the arrangement that runs across the surface, clamping at the end',
    compose: { symbol: 'SemanticsActions.SetProgress' },
    swiftui: { symbol: '.accessibilityAdjustableAction' },
  }],
  ['keyboard.ArrowUp', {
    capability: 'the cursor moves one step back along the arrangement that runs down the surface, clamping at the start',
    compose: { symbol: 'SemanticsActions.SetProgress' },
    swiftui: { symbol: '.accessibilityAdjustableAction' },
  }],
  ['keyboard.ControlEnd', {
    capability: 'the cursor jumps to the last position of the whole arrangement rather than of the current line',
    compose: { symbol: 'SemanticsActions.CustomActions' },
    swiftui: { symbol: '.accessibilityAction(named:)' },
  }],
  ['keyboard.ControlHome', {
    capability: 'the cursor jumps to the first position of the whole arrangement rather than of the current line',
    compose: { symbol: 'SemanticsActions.CustomActions' },
    swiftui: { symbol: '.accessibilityAction(named:)' },
  }],
  ['keyboard.End', {
    capability: 'the cursor jumps to the last position of the current line',
    compose: { symbol: 'SemanticsActions.CustomActions' },
    swiftui: { symbol: '.accessibilityAction(named:)' },
  }],
  ['keyboard.Enter', {
    capability: 'the control commits, which for a control with one effect is the same act as activating it',
    compose: { symbol: 'SemanticsActions.OnClick' },
    swiftui: { symbol: '.accessibilityAction' },
  }],
  ['keyboard.Escape', {
    capability: 'the surface is dismissed without committing anything',
    compose: { symbol: 'SemanticsActions.Dismiss' },
    swiftui: { symbol: '.accessibilityAction(.escape)' },
  }],
  ['keyboard.Home', {
    capability: 'the cursor jumps to the first position of the current line',
    compose: { symbol: 'SemanticsActions.CustomActions' },
    swiftui: { symbol: '.accessibilityAction(named:)' },
  }],
  ['keyboard.PageDown', {
    capability: 'the cursor jumps forward by a screenful rather than by a step',
    compose: { symbol: 'SemanticsActions.ScrollBy' },
    swiftui: { symbol: '.accessibilityScrollAction' },
  }],
  ['keyboard.PageUp', {
    capability: 'the cursor jumps back by a screenful rather than by a step',
    compose: { symbol: 'SemanticsActions.ScrollBy' },
    swiftui: { symbol: '.accessibilityScrollAction' },
  }],
  ['keyboard.Space', {
    capability: 'the control is activated, which for a two-state control is a toggle and for a button is a press',
    compose: { symbol: 'SemanticsActions.OnClick' },
    swiftui: { symbol: '.accessibilityAction' },
  }],
  ['keyboard.TypeAhead', {
    capability: 'a reader reaches a distant entry by naming it rather than by stepping to it',
    compose: { symbol: 'SemanticsActions.CustomActions' },
    swiftui: { symbol: '.accessibilityAction(named:)' },
  }],
  ['live.politeness', {
    capability: 'a change announces itself, and how much it interrupts is stated rather than left to the reader',
    compose: { symbol: 'SemanticsProperties.LiveRegion' },
    swiftui: { symbol: 'AccessibilityNotification.Announcement' },
  }],
  ['roles.activedescendant', {
    capability: 'the arrangement names which of its entries is current while the arrangement itself stays the thing being read',
    compose: { symbol: 'SemanticsProperties.Selected' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['roles.aria-modal', {
    capability: 'everything behind the surface is unreachable while it is up',
    compose: { symbol: 'SemanticsPropertyReceiver.dialog' },
    swiftui: { symbol: '.accessibilityAddTraits(.isModal)' },
  }],
  ['roles.article', {
    capability: 'each entry of a stream is one self-contained thing a reader moves between',
    compose: { symbol: 'SemanticsProperties.CollectionItemInfo' },
    swiftui: { symbol: '.accessibilityElement(children: .combine)' },
  }],
  ['roles.cell', {
    capability: 'a cell states its position in the arrangement, and a heading cell states that it names its row or column',
    compose: { symbol: 'SemanticsProperties.CollectionItemInfo' },
    swiftui: { symbol: '.accessibilityLabeledPair' },
  }],
  ['roles.controls', {
    capability: 'the control names the surface it opens and closes',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['roles.describedby', {
    capability: 'the control carries a second, longer description beside its name',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityHint' },
  }],
  ['roles.element', {
    capability: 'the component states what kind of thing it is, and the kind is read from the pattern element field',
    compose: { symbol: 'SemanticsProperties.Role' },
    swiftui: { symbol: '.accessibilityAddTraits' },
  }],
  ['roles.expanded', {
    capability: 'the control states whether the surface it owns is open or closed',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['roles.feed', {
    capability: 'a stream states that it is a stream and how many entries it currently holds',
    compose: { symbol: 'SemanticsProperties.CollectionInfo' },
    swiftui: { symbol: '.accessibilityElement(children: .contain)' },
  }],
  ['roles.graphic', {
    capability: 'the drawing is one thing a reader meets rather than a tree of parts nobody can interpret',
    compose: { symbol: 'Role.Image' },
    swiftui: { symbol: '.accessibilityAddTraits(.isImage)' },
  }],
  ['roles.grid', {
    capability: 'the arrangement states that it is two-dimensional, and how many rows and columns it holds',
    compose: { symbol: 'SemanticsProperties.CollectionInfo' },
    swiftui: { symbol: '.accessibilityElement(children: .contain)' },
  }],
  ['roles.group', {
    capability: 'a set of controls is read as one set rather than as unrelated neighbours',
    compose: { symbol: 'SemanticsProperties.IsTraversalGroup' },
    swiftui: { symbol: '.accessibilityElement(children: .contain)' },
  }],
  ['roles.haspopup', {
    capability: 'the control states that acting on it opens a surface rather than committing something',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityHint' },
  }],
  ['roles.item', {
    capability: 'each entry of an arrangement states that it belongs to it',
    compose: { symbol: 'SemanticsProperties.CollectionItemInfo' },
    swiftui: { symbol: '.accessibilityElement(children: .combine)' },
  }],
  ['roles.label', {
    capability: 'the component carries a name a reader hears, and the name is supplied rather than defaulted',
    compose: { symbol: 'SemanticsProperties.ContentDescription' },
    swiftui: { symbol: '.accessibilityLabel' },
  }],
  ['roles.option', {
    capability: 'each choice in a set of choices states that it is one, and whether it is taken',
    compose: { symbol: 'SemanticsProperties.Selected' },
    swiftui: { symbol: '.accessibilityAddTraits(.isSelected)' },
  }],
  ['roles.row', {
    capability: 'a row states that it groups the cells across it',
    compose: { symbol: 'SemanticsProperties.CollectionItemInfo' },
    swiftui: { symbol: '.accessibilityElement(children: .contain)' },
  }],
  ['roles.tab', {
    capability: 'a chooser in a set of choosers states that it is one, and whether its panel is the one showing',
    compose: { symbol: 'Role.Tab' },
    swiftui: { symbol: '.accessibilityAddTraits(.isSelected)' },
  }],
  ['roles.tablist', {
    capability: 'the set of choosers is read as one set',
    compose: { symbol: 'Modifier.selectableGroup' },
    swiftui: { symbol: '.accessibilityElement(children: .contain)' },
  }],
  ['roles.tabpanel', {
    capability: 'the panel states which chooser it belongs to',
    compose: { symbol: 'SemanticsProperties.PaneTitle' },
    swiftui: { symbol: '.accessibilityLabel' },
  }],
  ['states.busy', {
    capability: 'the component states that it is working and that what it shows is not final',
    compose: { symbol: 'SemanticsProperties.LiveRegion' },
    swiftui: { symbol: '.accessibilityAddTraits(.updatesFrequently)' },
  }],
  ['states.checked', {
    capability: 'a two-state control states which of its two states it is in',
    compose: { symbol: 'SemanticsProperties.ToggleableState' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.disabled', {
    capability: 'the control states that it cannot be operated, and stays readable while it says so',
    compose: { symbol: 'SemanticsProperties.Disabled' },
    swiftui: { symbol: '.accessibilityRemoveTraits' },
  }],
  ['states.multiline', {
    capability: 'a text field states that it takes more than one line',
    compose: { symbol: 'SemanticsProperties.EditableText' },
    swiftui: { symbol: '.accessibilityTextContentType' },
  }],
  ['states.multiselectable', {
    capability: 'a set of choices states that more than one of them can be taken at once',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.posinset', {
    capability: 'an entry states which one it is out of how many',
    compose: { symbol: 'SemanticsProperties.CollectionItemInfo' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.readonly', {
    capability: 'a field states that it can be read and not changed, which is not the same as being inoperable',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.required', {
    capability: 'a field states that it has to be answered before anything can be committed',
    compose: { symbol: 'SemanticsProperties.StateDescription' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.selected', {
    capability: 'an entry states that it is the taken one among its siblings',
    compose: { symbol: 'SemanticsProperties.Selected' },
    swiftui: { symbol: '.accessibilityAddTraits(.isSelected)' },
  }],
  ['states.valuemax', {
    capability: 'a measure states the top of its range',
    compose: { symbol: 'SemanticsProperties.ProgressBarRangeInfo' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.valuemin', {
    capability: 'a measure states the bottom of its range',
    compose: { symbol: 'SemanticsProperties.ProgressBarRangeInfo' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
  ['states.valuenow', {
    capability: 'a measure states where in its range it currently stands, or that it does not know',
    compose: { symbol: 'SemanticsProperties.ProgressBarRangeInfo' },
    swiftui: { symbol: '.accessibilityValue' },
  }],
]);

export function answerFor(key: string, layer: Layer): Answer {
  const obligation = OBLIGATIONS.get(key);
  if (!obligation) throw new Error(`${key} has no obligation entry, so no layer can answer it`);
  return obligation[layer];
}

export function isRefused(answer: Answer): answer is { refused: string } {
  return 'refused' in answer;
}

export function refusedKeys(layer: Layer) {
  return sortedByCodeUnit([...OBLIGATIONS]
    .filter(([, obligation]) => isRefused(obligation[layer]))
    .map(([key]) => key));
}

export function refusalReason(key: string, layer: Layer) {
  const obligation = OBLIGATIONS.get(key);
  if (!obligation) return null;
  const answer = obligation[layer];
  return isRefused(answer) ? answer.refused : null;
}

export function untranslatedProblems(patterns: Map<string, Pattern>) {
  return requirementKeys(patterns)
    .filter((key) => !OBLIGATIONS.has(key))
    .map((key) => `${key} is a requirement the pinned contract declares and reaches no native obligation, so a component binding a pattern that requires it has nothing to answer`);
}

export function staleObligationProblems(patterns: Map<string, Pattern>) {
  const declared = new Set(requirementKeys(patterns));
  return [...OBLIGATIONS.keys()]
    .filter((key) => !declared.has(key))
    .map((key) => `OBLIGATIONS translates ${key}, and no pattern declares it. A translation of a requirement nothing requires is a rule with no owner`);
}

export function unmappedRoleProblems(patterns: Map<string, Pattern>) {
  return elementRoles(patterns)
    .filter((role) => !ROLES.has(role))
    .map((role) => `${role} is an element field the pinned contract declares and reaches no native role`);
}

export function staleRoleProblems(patterns: Map<string, Pattern>) {
  const declared = new Set(elementRoles(patterns));
  return [...ROLES.keys()]
    .filter((role) => !declared.has(role))
    .map((role) => `ROLES translates the ${role} role, and no pattern names it in its element field`);
}
