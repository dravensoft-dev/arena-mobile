/* What both API emitters agree on. Two maps carry the whole of what a machine cannot decide:
 * CASE_NAMES names a contract value whose mangling is no identifier, because the emitter
 * refuses to invent a spelling a consumer will type; REPHRASED names a description that states
 * something false off the web, and each entry carries the contract's text verbatim so that
 * rewording it upstream fails the entry rather than passing under it. Every other description
 * crosses unchanged, which is what earns an emitted doc comment its carve-out at all. */

import { byCodeUnit, sortedByCodeUnit } from '../../utils/compare.ts';
import { identifierFor, typeNameFor } from './identifier.ts';
import { fieldEntries, isPrimitive, type ApiField, type ApiType } from '../contracts/api-types.ts';

const A_LEADING_DIGIT = 'and a case name is one a consumer types, so the emitter refuses to invent one';

export const CASE_NAMES = new Map<string, { name: string; why: string }>([
  ['ArenaCatSlot.1', { name: 'slot1', why: `the ramp is authored as a bare 1, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.2', { name: 'slot2', why: `the ramp is authored as a bare 2, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.3', { name: 'slot3', why: `the ramp is authored as a bare 3, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.4', { name: 'slot4', why: `the ramp is authored as a bare 4, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.5', { name: 'slot5', why: `the ramp is authored as a bare 5, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.6', { name: 'slot6', why: `the ramp is authored as a bare 6, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.7', { name: 'slot7', why: `the ramp is authored as a bare 7, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaCatSlot.8', { name: 'slot8', why: `the ramp is authored as a bare 8, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names slots, so the stem does` }],
  ['ArenaSwitchSize.2xl', { name: 'size2xl', why: `the step above xl is authored 2xl, which mangles to an identifier starting with a digit, ${A_LEADING_DIGIT}. The type names sizes, so the stem does, and the sibling steps stay sm through xl` }],
]);

export const REPHRASED = new Map<string, { was: string; text: string; why: string }>([
  [
    "ArenaActivityItem.dateTime",
    {
      was: "The same moment as an ISO 8601 string, which turns the row's time into a real <time datetime> a machine can read. Present, Arena wraps its own text in that element; absent, the text is drawn as before. Two fields rather than one because time is what a reader sees and is deliberately whatever the consumer preformatted, up to \"3 min ago\", which no parser can resolve to a date. The pair is what lets Arena emit the element itself, which is the only way it can: a field inside an array of predefined objects can only be a primitive, so a consumer cannot place markup inside one row of a list Arena renders, and the convention that says so is not being lifted here.",
      text: "The same moment as an ISO 8601 string, which is the machine-readable half of what the row shows. Present, the row carries it beside its own text; absent, the text is drawn as before. Two fields rather than one because time is what a reader sees and is deliberately whatever the consumer preformatted, up to \"3 min ago\", which no parser can resolve to a date. The pair is what lets Arena carry the timestamp itself, which is the only way it can: a field inside an array of predefined objects can only be a primitive, so a consumer cannot place their own content inside one row of a list Arena renders, and the convention that says so is not being lifted here.",
      why: "the pair exists so a machine can read the moment, and the web says that with a <time datetime> element this layer neither renders nor has. The timestamp beside the text is what travels; the element does not",
    },
  ],
  [
    "ArenaCatSlot",
    {
      was: "A slot in the categorical ramp, in fixed order and never cycled. Colour here means which thing, never what state. The same ramp the charts use (identity is one system across Arena, not one per component), but typed as an enum only here: ArenaBarChart.slot, ArenaBarChart.slots, ArenaLineChart.slot and ArenaDoughnutChart.slots still declare a bare number, which their runtime clamp (arenaCatColor()) makes safe rather than correct, and narrowing them is an open contract change and not a fact this type states. The bound is not authored here either: it is the count of --color-cat-* slots in contracts/design/palette.dark.json, and check:script-tokens fails if this set stops matching it.",
      text: "A slot in the categorical ramp, in fixed order and never cycled. Colour here means which thing, never what state. The same ramp the charts use (identity is one system across Arena, not one per component), but typed as an enum only here: a chart's own slot members still declare a bare number, which their runtime clamp makes safe rather than correct, and narrowing them is an open contract change and not a fact this type states. The bound is not authored here either: it is the count of categorical slots the palette declares, and the contract fails if this set stops matching it.",
      why: "three of the names in it are Arena's own repository rather than the design language: arenaCatColor() is a script symbol, check:script-tokens is a gate, and contracts/design/palette.dark.json is a path nobody installing this package can open. Every claim the sentence makes is true here, so each name is replaced by the thing it named",
    },
  ],
  [
    "ArenaCommand.route",
    {
      was: "Where running this command goes. Present, the row renders an <a> and is openable in a new tab, middle-clickable and copyable, which a keyboard accelerator over a list of destinations should be: the same split, and the same reason, as ArenaSideNavItem.href. It keeps role=\"option\", because the listbox pattern the palette binds requires that of every row, so a screen reader announces it as an option rather than as a link; the trade is deliberate, since losing the option role would break arrow navigation for every row in the list. A primary click with no modifier and Enter both cancel the anchor and report through `run`, which is what makes the two agree; ctrl, meta, shift, alt and a middle click open the destination themselves, emit nothing and leave the palette open, because the reader asked for a second place to look rather than to leave this one.",
      text: "Where running this command goes. Present, the row is a navigation target in its own right, which a keyboard accelerator over a list of destinations should be: the same split, and the same reason, as ArenaSideNavItem.href. It stays an option in the list, because the listbox pattern the palette binds requires that of every row, so a reader is told it is an option rather than a destination; the trade is deliberate, since losing that would break arrow navigation for every row in the list. A primary activation cancels the navigation and reports through `run`, which is what makes the pointer and the keyboard agree; a gesture asking for the destination somewhere else opens it there, emits nothing and leaves the palette open, because the reader asked for a second place to look rather than to leave this one.",
      why: "the sentence turns on an <a>, a new tab, a middle click and role=\"option\": one element and two gestures no phone has, and one ARIA attribute this layer does not write. The split it describes is the part that survives",
    },
  ],
  [
    "ArenaControlSize",
    {
      was: "The three-step size scale shared by Arena's controls. What each step measures is the component's own decision and only some of them re-densify: ArenaButton and ArenaIconButton take their heights from the density tokens, so they shrink with the rows around them inside .arena-compact, while ArenaProgressBar's thickness and ArenaSpinner's diameter are spacing and icon tokens that .arena-compact does not redefine. The enum is shared because all four implement the same three steps, not because they resolve them the same way.",
      text: "The three-step size scale shared by Arena's controls. What each step measures is the component's own decision and only some of them re-densify: ArenaButton and ArenaIconButton take their heights from the density tokens, so they shrink with the rows around them in the compact density, while ArenaProgressBar's thickness and ArenaSpinner's diameter are spacing and icon tokens the compact density does not redefine. The enum is shared because all four implement the same three steps, not because they resolve them the same way.",
      why: ".arena-compact is the CSS class the web layer switches density with, and the same switch here is ArenaCompactDensity. The claim is identical and the name of the mechanism is not",
    },
  ],
  [
    "ArenaCrumb.href",
    {
      was: "Where it goes. Absent on the last entry, the current location. A primary click with no modifier is cancelled and reported through `navigate`, so a router owns it; a modified or middle click is the browser's and reports nothing.",
      text: "Where it goes. Absent on the last entry, the current location. A primary activation is cancelled and reported through `navigate`, so a router owns it.",
      why: "the clause that goes names a modifier-key click and a middle click, and a phone has neither. What is left is the half that survives the platform: an activation reports, and the destination is the router's",
    },
  ],
  [
    "ArenaHeadingLevel",
    {
      was: "Which rung of the document outline a title takes. Arena already declares a title ladder, hero over page head over section over card, and that ladder was a visual register alone: a style plugin re-pitches the four as a unit, while a reader walking headings met whichever element each component had settled on for itself, which was one level deep or none at all. This is the same ladder said as structure. The value names the element and nothing else, because the class that styles a title is the same at every value, so choosing a level costs no appearance and check:pixel-parity is what holds that. Each component defaults to its own rung, so a card inside a section nests with nobody saying so, and the member is there for the screens where the default rung is the wrong one. `none` draws the title with no heading at all, for a title that labels a surface rather than naming a region; a component whose title is required refuses `none` at runtime, since a title required because it names the thing it draws cannot also be told the name is not one.",
      text: "Which rung of the document outline a title takes. Arena already declares a title ladder, hero over page head over section over card, and that ladder was a visual register alone: a style plugin re-pitches the four as a unit, while a reader walking headings met whichever rung each component had settled on for itself, which was one level deep or none at all. This is the same ladder said as structure. The value names the outline rung and nothing else, because a title is styled the same at every value, so choosing a level costs no appearance and a gate is what holds that. Each component defaults to its own rung, so a card inside a section nests with nobody saying so, and the member is there for the screens where the default rung is the wrong one. `none` draws the title with no heading at all, for a title that labels a surface rather than naming a region; a component whose title is required refuses `none` at runtime, since a title required because it names the thing it draws cannot also be told the name is not one.",
      why: "it names the element a value picks and cites check:pixel-parity, a gate in the Arena repository comparing two rendered web layers. The ladder is structure on every platform and those two names for the web's version of it are not",
    },
  ],
  [
    "ArenaKeyValueRow.term",
    {
      was: "What the row is about, rendered as a real dt.",
      text: "What the row is about, and it names the value beside it.",
      why: "a <dt> is the element the web layer renders. The claim worth keeping is that the term labels its value rather than merely sitting next to it, which is what a reader on any platform is owed",
    },
  ],
  [
    "ArenaKeyValueRow.value",
    {
      was: "The answer, rendered as a real dd.",
      text: "The answer, and it is described by the term beside it.",
      why: "a <dd> is the element the web layer renders, and what travels is the association between the two rather than the tag that carries it",
    },
  ],
  [
    "ArenaMenuItem.icon",
    {
      was: "A Phosphor class name drawn before the label -- Arena draws the <i>, the consumer names the glyph.",
      text: "A Phosphor class name drawn before the label: Arena draws the glyph, the consumer names it.",
      why: "the <i> is the element the web layer renders. The division it illustrates, Arena draws and the consumer names, is the settled convention itself and stays",
    },
  ],
  [
    "ArenaOnboardingAnchor",
    {
      was: "Where the coachmark attaches: the two viewport coordinates it positions from. A DOMRect is structurally assignable to it, so a consumer passes getBoundingClientRect() directly. Declared as its own object rather than taken as a DOMRect because a contract states no platform's own types, and because these are the only two fields ArenaOnboarding reads.",
      text: "Where the coachmark attaches: the two viewport coordinates it positions from. Declared as its own object rather than borrowed from a platform, because a contract states no platform's own types, and because these are the only two fields ArenaOnboarding reads.",
      why: "DOMRect and getBoundingClientRect() are a web API, and the sentence about them is an instruction a consumer here cannot follow. Why the type exists at all is platform-neutral and is what stays",
    },
  ],
  [
    "ArenaTableColumn.width",
    {
      was: "A CSS width for the column. Omit to let the table distribute.",
      text: "A fixed width for the column. Omit to let the table distribute.",
      why: "a CSS width is a string this layer can neither parse nor apply, and this member is one of the five the index already holds open for that reason",
    },
  ],
  [
    "ArenaTableSlice",
    {
      was: "Where the projected rows sit inside a longer list. The grid pattern's source page applies `aria-rowcount` and `aria-rowindex` whenever rows are not present in the DOM, and a render that projects part of a list is that condition, so this is what those two attributes carry. Bound, it answers them whatever the consumer slices by. Absent with `page` bound, they are derived from the page, because a page IS a slice and stating it twice is how the two disagree. Absent with `page` absent, the projected rows are the whole list and neither attribute is written, which is the same answer the source page gives for a grid holding every row it has.",
      text: "Where the projected rows sit inside a longer list. A reader is told the size of the whole collection and the position of each row within it whenever the rows on screen are only part of it, and a render that projects part of a list is that condition, so this is what those two announcements carry. Bound, it answers them whatever the consumer slices by. Absent with `page` bound, they are derived from the page, because a page IS a slice and stating it twice is how the two disagree. Absent with `page` absent, the projected rows are the whole list and neither is announced, which is the same answer the pattern gives for a grid holding every row it has.",
      why: "aria-rowcount and aria-rowindex are attributes this layer does not write, and the DOM is not what holds the rows here. Each is replaced by the announcement it produces, which is the part a component on this platform still owes",
    },
  ],
  [
    "ArenaTableSlice.offset",
    {
      was: "How many rows of the whole list come before the first row projected here, counting from 0, so a window at the top of the list passes 0. `aria-rowindex` is 1-based and the header row takes 1, so ArenaTable does that arithmetic rather than the consumer: an offset that already counted from 1 is counted twice, and the reader is told a position one row past where they are.",
      text: "How many rows of the whole list come before the first row projected here, counting from 0, so a window at the top of the list passes 0. The announced position is 1-based and the header row takes 1, so ArenaTable does that arithmetic rather than the consumer: an offset that already counted from 1 is counted twice, and the reader is told a position one row past where they are.",
      why: "aria-rowindex is the attribute the web layer writes, and the off-by-one it warns about is a fact about the announcement rather than about the attribute",
    },
  ],
  [
    "ArenaTableSlice.total",
    {
      was: "How many rows the whole list holds, counting the ones nobody projected and not the header row, which ArenaTable adds itself because `aria-rowcount` counts it. `-1` is the answer for a list whose length is not known yet, which is the source page's own sentinel for it and reaches the attribute unchanged: a feed that loads as it scrolls says -1 rather than a number it would have to invent and correct.",
      text: "How many rows the whole list holds, counting the ones nobody projected and not the header row, which ArenaTable adds itself because the announced count includes it. `-1` is the answer for a list whose length is not known yet, and it reaches the announcement unchanged: a feed that loads as it scrolls says -1 rather than a number it would have to invent and correct.",
      why: "aria-rowcount is the attribute the web layer writes. The arithmetic and the sentinel both travel, and the attribute does not",
    },
  ],
  [
    "ArenaTableSort",
    {
      was: "Which column the rows are ordered by, and which way. Controlled: ArenaTable draws the affordance and sets aria-sort, and the consumer does the ordering, because ArenaTable does not hold the rows and pretending otherwise would be the error. Absent, no header is a sort target however many columns declare `sortable`.",
      text: "Which column the rows are ordered by, and which way. Controlled: ArenaTable draws the affordance and announces the order, and the consumer does the ordering, because ArenaTable does not hold the rows and pretending otherwise would be the error. Absent, no header is a sort target however many columns declare `sortable`.",
      why: "aria-sort is the attribute the web layer writes, and what a component here owes is the announcement rather than the attribute",
    },
  ],
]);

const PRIMITIVE_TYPES = new Map([
  ['string', { kotlin: 'String', swift: 'String' }],
  ['number', { kotlin: 'Double', swift: 'Double' }],
  ['boolean', { kotlin: 'Boolean', swift: 'Bool' }],
]);

const BARE = /^[A-Za-z][A-Za-z0-9]*$/;

export function caseStemFor(type: string, value: string | number) {
  const named = CASE_NAMES.get(`${type}.${value}`);
  if (named) return named.name;
  const stem = identifierFor([String(value)]);
  if (!BARE.test(stem)) {
    throw new Error(
      `${type} declares the value ${JSON.stringify(value)}, which mangles to ${JSON.stringify(stem)} and is no bare `
      + 'identifier, so it compiles in neither language. Name it in CASE_NAMES in '
      + 'scripts/lib/arena/api-emit.ts with the stem and the reason',
    );
  }
  return stem;
}

export function kotlinCase(stem: string) {
  return typeNameFor([stem]);
}

export function swiftCase(stem: string) {
  return stem;
}

export function rawTypes(type: ApiType) {
  const values = type.values ?? [];
  const numeric = values.filter((one) => typeof one === 'number').length;
  if (numeric === values.length) return { kotlin: 'Int', swift: 'Int' };
  if (numeric === 0) return { kotlin: 'String', swift: 'String' };
  throw new Error(`${type.name} mixes numeric and string values, and a raw type is one type in both languages`);
}

export function literalFor(value: string | number) {
  return typeof value === 'number' ? String(value) : JSON.stringify(value);
}

export function fieldTypes(field: ApiField, where: string) {
  if (field.form === 'primitive') {
    const found = PRIMITIVE_TYPES.get(field.type ?? '');
    if (!found) throw new Error(`${where}: "${field.type}" is not a primitive this emit states`);
    return found;
  }
  if (field.form === 'enum') {
    if (!field.type) throw new Error(`${where}: an enum field names no type`);
    return { kotlin: field.type, swift: field.type };
  }
  if (field.form === 'array') {
    if (!isPrimitive(field.of)) {
      throw new Error(`${where}: an array field is an array of primitives and "${field.of}" is not one. R1, an object is pure data with known fields`);
    }
    const found = PRIMITIVE_TYPES.get(field.of) as { kotlin: string; swift: string };
    return { kotlin: `List<${found.kotlin}>`, swift: `[${found.swift}]` };
  }
  throw new Error(
    `${where}: form "${field.form}" reaches no native shape, and R1 refuses it inside a predefined object before `
    + 'it gets here. Nothing is emitted for a form this bridge does not state',
  );
}

export function keyFor(type: string, field: string | null) {
  return field === null ? type : `${type}.${field}`;
}

export function docTextFor(type: string, field: string | null, description: string | undefined) {
  const named = REPHRASED.get(keyFor(type, field));
  return named ? named.text : description;
}

export function describedEntries(types: ApiType[]) {
  const owed = new Map<string, string>();
  for (const type of types) {
    if (type.description) owed.set(type.name, type.description);
    for (const [field, spec] of fieldEntries(type.fields)) {
      if (spec.description) owed.set(keyFor(type.name, field), spec.description);
    }
  }
  return owed;
}

export function owedDocs(types: ApiType[]) {
  const owed = new Map<string, string>();
  for (const [key, description] of describedEntries(types)) {
    const dot = key.indexOf('.');
    const type = dot === -1 ? key : key.slice(0, dot);
    const field = dot === -1 ? null : key.slice(dot + 1);
    owed.set(key, docTextFor(type, field, description) as string);
  }
  return owed;
}

export function staleCaseNameProblems(types: ApiType[], named = CASE_NAMES) {
  const declared = new Set<string>();
  for (const type of types) {
    for (const value of type.values ?? []) declared.add(`${type.name}.${value}`);
  }
  return sortedByCodeUnit([...named].flatMap(([key, { why }]) => (declared.has(key)
    ? []
    : [`CASE_NAMES names ${key}, and no enum in the payload declares that value. A name for a case that is not `
      + `there names nothing: ${why}`])));
}

export function staleRephrasedProblems(types: ApiType[], rephrased = REPHRASED) {
  const owed = describedEntries(types);
  return sortedByCodeUnit([...rephrased].flatMap(([key, { was, text, why }]) => {
    const now = owed.get(key);
    if (now === undefined) {
      return [`REPHRASED names ${key}, and the payload declares no described type or field by that name: ${why}`];
    }
    if (now !== was) {
      return [`REPHRASED rewrites ${key}, and the contract no longer says what the entry was written against. `
        + `Read the new description and decide again rather than carrying the old decision forward: ${why}`];
    }
    if (text === was) {
      return [`REPHRASED rewrites ${key} into what it already says, so it rewrites nothing: ${why}`];
    }
    return [];
  }));
}

export function enumCases(type: ApiType) {
  return (type.values ?? []).map((value) => {
    const stem = caseStemFor(type.name, value);
    return { value, stem, kotlin: kotlinCase(stem), swift: swiftCase(stem), literal: literalFor(value) };
  });
}

export function sortedTypes(types: ApiType[]) {
  return [...types].sort((a, b) => byCodeUnit(a.name, b.name));
}
