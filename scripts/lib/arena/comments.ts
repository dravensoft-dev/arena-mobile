/* Finds comments by lexing rather than by matching, because a slash-slash inside a string, a
 * regex or a template literal is not a comment, and a rule that cannot tell them apart either
 * reports the wrong file or excuses the right one. The three languages this reads all use the
 * same two comment forms and the same three quote characters, so one lexer answers for
 * TypeScript, Kotlin and Swift; what differs between them is which files the rule reaches,
 * and that is the gate's question and not this module's. */

export type Comment = { text: string; line: number; block: boolean; leading: boolean };

const QUOTES = new Set(['"', "'", '`']);

const BEFORE_REGEX = new Set([...'([{,;:=!&|?+-*%~^<>', '']);
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'do', 'else', 'yield', 'await']);

export function startsRegex(before: string) {
  const trimmed = before.replace(/\s+$/, '');
  const last = trimmed.slice(-1);
  if (BEFORE_REGEX.has(last)) return true;
  const word = /([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(trimmed);
  return word !== null && KEYWORDS_BEFORE_REGEX.has(word[1]);
}

export function comments(source: string, regexLiterals = true) {
  const found: Comment[] = [];
  let line = 1;
  let index = 0;
  let codeSinceNewline = false;
  while (index < source.length) {
    const here = source[index];
    if (here === '\n') {
      line += 1;
      codeSinceNewline = false;
      index += 1;
      continue;
    }
    if (QUOTES.has(here)) {
      const quote = here;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') index += 1;
        if (source[index] === '\n') line += 1;
        index += 1;
      }
      index += 1;
      codeSinceNewline = true;
      continue;
    }
    if (here === '/' && regexLiterals && source[index + 1] !== '/' && source[index + 1] !== '*'
      && startsRegex(source.slice(0, index))) {
      index += 1;
      while (index < source.length && source[index] !== '/' && source[index] !== '\n') {
        if (source[index] === '\\') index += 1;
        if (source[index] === '[') {
          while (index < source.length && source[index] !== ']' && source[index] !== '\n') {
            if (source[index] === '\\') index += 1;
            index += 1;
          }
        }
        index += 1;
      }
      index += 1;
      codeSinceNewline = true;
      continue;
    }
    if (here === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\n', index);
      const stop = end === -1 ? source.length : end;
      found.push({ text: source.slice(index, stop), line, block: false, leading: !codeSinceNewline });
      index = stop;
      continue;
    }
    if (here === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      const text = source.slice(index, stop);
      found.push({ text, line, block: true, leading: !codeSinceNewline });
      line += text.split('\n').length - 1;
      index = stop;
      continue;
    }
    if (here.trim() !== '') codeSinceNewline = true;
    index += 1;
  }
  return found;
}

export function isPragma(text: string) {
  return /^\/[/*]\s*(@ts-|eslint-|prettier-|swiftlint:|ktlint-|noinspection)/.test(text);
}

export function lineCount(text: string) {
  return text.split('\n').length;
}

export const SHEBANG = /^#![^\n]*\n/;

export function bodyAfterShebang(source: string) {
  return source.replace(SHEBANG, '');
}

export function fencesAndSpans(markdown: string) {
  const masked: string[] = [];
  let inFence: string | null = null;
  for (const line of markdown.split('\n')) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (inFence === null) inFence = fence[1][0].repeat(fence[1].length);
      else if (fence[1][0] === inFence[0] && fence[1].length >= inFence.length) inFence = null;
      masked.push('');
      continue;
    }
    masked.push(inFence !== null ? '' : line.replace(/`[^`]*`/g, ''));
  }
  return masked;
}
