/* A token path is not an identifier. `sp.0`, `r.2xl`, `shadow.1` and `dz.text-2xs` all carry
 * a leading digit or a hyphen somewhere, so every emitted name is mangled and two things have
 * to be true afterwards: no identifier starts with a digit, and no two distinct paths land on
 * the same one. check:collisions asserts both, over the emitted set rather than over a list. */

import { byCodeUnit } from '../../utils/compare.ts';

export const KOTLIN_KEYWORDS = new Set([
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in',
  'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw',
  'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while',
]);

export const SWIFT_KEYWORDS = new Set([
  'as', 'associatedtype', 'break', 'case', 'catch', 'class', 'continue', 'default', 'defer',
  'deinit', 'do', 'else', 'enum', 'extension', 'fallthrough', 'false', 'fileprivate', 'for',
  'func', 'guard', 'if', 'import', 'in', 'init', 'inout', 'internal', 'is', 'let', 'nil',
  'open', 'operator', 'precedencegroup', 'private', 'protocol', 'public', 'repeat',
  'rethrows', 'return', 'self', 'static', 'struct', 'subscript', 'super', 'switch',
  'throw', 'throws', 'true', 'try', 'typealias', 'var', 'where', 'while',
]);

export const RESERVED = new Set([...KOTLIN_KEYWORDS, ...SWIFT_KEYWORDS]);

function head(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function identifierFor(path: readonly string[]) {
  const words = path.flatMap((segment) => segment.split('-')).filter(Boolean);
  if (words.length === 0) return '';
  return words.map((word, index) => (index === 0 ? word : head(word))).join('');
}

export function typeNameFor(path: readonly string[]) {
  return head(identifierFor(path));
}

export function identifierProblems(named: { name: string; identifier: string }[]) {
  const errs: string[] = [];
  const byIdentifier = new Map<string, string[]>();
  for (const one of named) {
    byIdentifier.set(one.identifier, [...(byIdentifier.get(one.identifier) ?? []), one.name]);
    if (/^[0-9]/.test(one.identifier)) {
      errs.push(`${one.name} mangles to ${one.identifier}, which starts with a digit and compiles in neither language`);
    }
    if (RESERVED.has(one.identifier)) {
      errs.push(`${one.name} mangles to ${one.identifier}, which is a keyword in Kotlin or in Swift`);
    }
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(one.identifier)) {
      errs.push(`${one.name} mangles to ${JSON.stringify(one.identifier)}, which is not a bare identifier`);
    }
  }
  for (const [identifier, names] of byIdentifier) {
    if (names.length < 2) continue;
    errs.push(
      `${names.sort(byCodeUnit).join(' and ')} both mangle to ${identifier}. `
      + 'One of them silently overwrites the other, and the emitted file compiles either way',
    );
  }
  return errs.sort(byCodeUnit);
}
