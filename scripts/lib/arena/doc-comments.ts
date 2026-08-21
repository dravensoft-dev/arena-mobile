/* Reads a doc comment back out of an emitted file, so a gate can hold it equal to the
 * $description it came from. That equality is what earns the carve-out: KDoc and /// press
 * against the rule that the best comment is the one not written, and a comment a gate keeps
 * equal to its source cannot go quietly false. Adopting the carve-out without this reader is
 * adopting an ordinary comment with a longer syntax. */

import { flatten } from './emit.ts';

const KOTLIN_DECL = /^\s{4}public val ([A-Za-z][A-Za-z0-9]*)\s*:/;
const SWIFT_DECL = /^\s{4}public (?:static )?let ([A-Za-z][A-Za-z0-9]*)\s*:/;

export function kotlinDocs(source: string) {
  const found = new Map<string, string>();
  let pending: string[] | null = null;
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('/**')) {
      pending = [line.replace(/^\/\*\*/, '').replace(/\*\/$/, '')];
      if (line.endsWith('*/') && line.length > 4) continue;
      if (!line.endsWith('*/')) continue;
    } else if (pending !== null && !line.startsWith('/**')) {
      if (line === '*/') continue;
      if (line.startsWith('*')) { pending.push(line.replace(/^\*\s?/, '')); continue; }
    }
    const declared = KOTLIN_DECL.exec(raw);
    if (declared) {
      if (pending !== null) found.set(declared[1], flatten(pending.join(' ')));
      pending = null;
      continue;
    }
    if (line !== '' && !line.startsWith('*') && !line.startsWith('/**')) pending = null;
  }
  return found;
}

export function swiftDocs(source: string) {
  const found = new Map<string, string>();
  let pending: string[] = [];
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('///')) {
      pending.push(line.replace(/^\/\/\/\s?/, ''));
      continue;
    }
    const declared = SWIFT_DECL.exec(raw);
    if (declared) {
      if (pending.length) found.set(declared[1], flatten(pending.join(' ')));
      pending = [];
      continue;
    }
    if (line !== '') pending = [];
  }
  return found;
}

export function docProblems(file: string, found: Map<string, string>, owed: Map<string, string>) {
  const errs: string[] = [];
  for (const [identifier, text] of found) {
    const expected = owed.get(identifier);
    if (expected === undefined) {
      errs.push(`${file} documents ${identifier}, which no contract names`);
      continue;
    }
    if (expected === '') {
      errs.push(`${file} documents ${identifier}, and its contract carries no $description to derive it from`);
      continue;
    }
    if (text !== expected) {
      errs.push(`${file}'s doc for ${identifier} is not its contract's $description. Edit the contract, not this file`);
    }
  }
  for (const [identifier, expected] of owed) {
    if (expected !== '' && !found.has(identifier)) {
      errs.push(`${file} declares ${identifier} with no doc comment, and its contract carries a $description`);
    }
  }
  return errs;
}
