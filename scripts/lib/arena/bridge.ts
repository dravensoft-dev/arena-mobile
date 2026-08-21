/* The unit bridge. Every mistake in it compiles, the screen draws, and the sizes are wrong by
 * a ratio nobody measured, so each rule is stated once here and read by both emitters.
 * Two transforms are declared rather than silent: a duration is authored in milliseconds and
 * Swift takes seconds, and a number carrying cssUnit "%" is authored as 12 and emitted as the
 * fraction both platforms actually multiply by. A plain number with no hint becomes a floating
 * value rather than an integer, because zIndex takes one on both toolkits and a bound takes a
 * one-word conversion either way; the alternative is a list of token names, which is a list. */

import type { Token } from '../contracts/payload.ts';

export type Emitted = {
  token: Token;
  identifier: string;
  kotlinType: string;
  kotlinLiteral: string;
  swiftType: string;
  swiftLiteral: string;
};

export const UNMAPPED = new Map<string, string>([
  ['shadow.1#spread', 'neither Compose nor SwiftUI draws a shadow spread, so the inset ring this negative value pulls back has no native counterpart and the shadow emits its offsets, blur and colour alone'],
  ['shadow.2#spread', 'neither Compose nor SwiftUI draws a shadow spread, so the inset ring this negative value pulls back has no native counterpart and the shadow emits its offsets, blur and colour alone'],
  ['shadow.3#spread', 'neither Compose nor SwiftUI draws a shadow spread, so the inset ring this negative value pulls back has no native counterpart and the shadow emits its offsets, blur and colour alone'],
]);

export const CSS_GENERIC_FAMILIES = new Set(['system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy']);

const SWIFT_WEIGHTS = new Map<number, string>([
  [100, '.ultraLight'], [200, '.thin'], [300, '.light'], [400, '.regular'],
  [500, '.medium'], [600, '.semibold'], [700, '.bold'], [800, '.heavy'], [900, '.black'],
]);

export function num(value: number) {
  if (!Number.isFinite(value)) throw new Error(`${value} is not a finite number and cannot be emitted`);
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(6)));
}

function kotlinFloat(value: number) {
  return `${num(value)}f`;
}

function dp(value: number) {
  return value < 0 ? `(${num(value)}).dp` : `${num(value)}.dp`;
}

function sp(value: number) {
  return value < 0 ? `(${num(value)}).sp` : `${num(value)}.sp`;
}

function em(value: number) {
  return value < 0 ? `(${num(value)}).em` : `${num(value)}.em`;
}

export function familyHead(value: unknown) {
  const list = Array.isArray(value) ? value.map(String) : [String(value)];
  const named = list.filter((one) => !CSS_GENERIC_FAMILIES.has(one));
  if (named.length === 0) {
    throw new Error(`a fontFamily of ${JSON.stringify(list)} names only CSS generic families, and none of them names anything on either platform`);
  }
  return named[0];
}

type ColorValue = { colorSpace: string; components: number[]; alpha?: number };
type LengthValue = { value: number; unit: string };

function lengthOf(value: unknown, where: string): number {
  const length = value as LengthValue;
  if (typeof length?.value !== 'number') throw new Error(`${where} carries no numeric value`);
  if (length.unit !== 'px') throw new Error(`${where} is authored in ${length.unit}, and the bridge is stated for px`);
  return length.value;
}

export function kotlinColor(value: unknown, where: string) {
  const color = value as ColorValue;
  if (color?.colorSpace !== 'srgb') throw new Error(`${where} declares colorSpace ${color?.colorSpace}, and the bridge is stated for srgb`);
  const [r, g, b] = color.components;
  const a = color.alpha ?? 1;
  return `Color(red = ${kotlinFloat(r)}, green = ${kotlinFloat(g)}, blue = ${kotlinFloat(b)}, alpha = ${kotlinFloat(a)})`;
}

export function swiftColor(value: unknown, where: string) {
  const color = value as ColorValue;
  if (color?.colorSpace !== 'srgb') throw new Error(`${where} declares colorSpace ${color?.colorSpace}, and the bridge is stated for srgb`);
  const [r, g, b] = color.components;
  const a = color.alpha ?? 1;
  return `Color(.sRGB, red: ${num(r)}, green: ${num(g)}, blue: ${num(b)}, opacity: ${num(a)})`;
}

export function bridge(token: Token, identifier: string): Emitted {
  const where = token.name;
  const base = { token, identifier };
  switch (token.type) {
    case 'dimension': {
      const px = lengthOf(token.value, where);
      if (token.userScale === 'scales') {
        return { ...base, kotlinType: 'TextUnit', kotlinLiteral: sp(px), swiftType: 'CGFloat', swiftLiteral: num(px) };
      }
      return { ...base, kotlinType: 'Dp', kotlinLiteral: dp(px), swiftType: 'CGFloat', swiftLiteral: num(px) };
    }
    case 'color':
      return { ...base, kotlinType: 'Color', kotlinLiteral: kotlinColor(token.value, where), swiftType: 'Color', swiftLiteral: swiftColor(token.value, where) };
    case 'duration': {
      const ms = lengthOf({ ...(token.value as LengthValue), unit: 'px' }, where);
      const authored = token.value as LengthValue;
      if (authored.unit !== 'ms') throw new Error(`${where} is a duration authored in ${authored.unit}, and the bridge is stated for ms`);
      return { ...base, kotlinType: 'Int', kotlinLiteral: num(ms), swiftType: 'TimeInterval', swiftLiteral: num(ms / 1000) };
    }
    case 'cubicBezier': {
      const curve = token.value as number[];
      if (curve.length !== 4) throw new Error(`${where} is a cubicBezier of ${curve.length} numbers`);
      return {
        ...base,
        kotlinType: 'ArenaEasing',
        kotlinLiteral: `ArenaEasing(${curve.map(kotlinFloat).join(', ')})`,
        swiftType: 'ArenaEasing',
        swiftLiteral: `ArenaEasing(x1: ${num(curve[0])}, y1: ${num(curve[1])}, x2: ${num(curve[2])}, y2: ${num(curve[3])})`,
      };
    }
    case 'fontFamily': {
      const head = familyHead(token.value);
      return { ...base, kotlinType: 'String', kotlinLiteral: JSON.stringify(head), swiftType: 'String', swiftLiteral: JSON.stringify(head) };
    }
    case 'fontWeight': {
      const weight = token.value as number;
      const swift = SWIFT_WEIGHTS.get(weight);
      if (!swift) throw new Error(`${where} is fontWeight ${weight}, which Font.Weight does not name`);
      return { ...base, kotlinType: 'FontWeight', kotlinLiteral: `FontWeight(${num(weight)})`, swiftType: 'Font.Weight', swiftLiteral: swift };
    }
    case 'shadow': {
      const shadow = token.value as Record<string, unknown>;
      for (const member of ['spread', 'inset']) {
        if (member in shadow && !UNMAPPED.has(`${where}#${member}`)) {
          throw new Error(`${where} carries ${member}, which no native shadow draws, and UNMAPPED does not name it`);
        }
      }
      const kotlin = `ArenaShadow(offsetX = ${dp(lengthOf(shadow.offsetX, `${where}.offsetX`))}, offsetY = ${dp(lengthOf(shadow.offsetY, `${where}.offsetY`))}, blur = ${dp(lengthOf(shadow.blur, `${where}.blur`))}, color = ${kotlinColor(shadow.color, `${where}.color`)})`;
      const swift = `ArenaShadow(offsetX: ${num(lengthOf(shadow.offsetX, `${where}.offsetX`))}, offsetY: ${num(lengthOf(shadow.offsetY, `${where}.offsetY`))}, blur: ${num(lengthOf(shadow.blur, `${where}.blur`))}, color: ${swiftColor(shadow.color, `${where}.color`)})`;
      return { ...base, kotlinType: 'ArenaShadow', kotlinLiteral: kotlin, swiftType: 'ArenaShadow', swiftLiteral: swift };
    }
    case 'number': {
      const value = token.value as number;
      if (token.cssUnit === 'em') {
        return { ...base, kotlinType: 'TextUnit', kotlinLiteral: em(value), swiftType: 'CGFloat', swiftLiteral: num(value) };
      }
      if (token.cssUnit === '%') {
        return { ...base, kotlinType: 'Float', kotlinLiteral: kotlinFloat(value / 100), swiftType: 'CGFloat', swiftLiteral: num(value / 100) };
      }
      if (token.cssUnit !== undefined) {
        throw new Error(`${where} carries cssUnit ${token.cssUnit}, which the bridge does not state`);
      }
      return { ...base, kotlinType: 'Float', kotlinLiteral: kotlinFloat(value), swiftType: 'Double', swiftLiteral: num(value) };
    }
    default:
      throw new Error(`${where} is $type ${token.type}, which the bridge does not state. Add the row or record it in UNMAPPED`);
  }
}

export function staleUnmappedProblems(tokens: Token[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  return [...UNMAPPED].flatMap(([key, why]) => {
    const [name, member] = key.split('#', 2);
    const token = byName.get(name);
    if (!token) return [`UNMAPPED names ${key}, and the payload carries no token ${name}: ${why}`];
    if (member && !(member in (token.value as Record<string, unknown>))) {
      return [`UNMAPPED names ${key}, and ${name} carries no ${member} member: ${why}`];
    }
    return [];
  });
}
