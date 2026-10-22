/* How a register naming a native symbol is held against the source that should carry it. The
 * check is the last member of the symbol at a word boundary, because a use site spells
 * contentDescription where an obligation names the property that holds it, and .focused where a
 * declaration spells @FocusState. Nothing here renders, so what a present symbol says is that it
 * is WRITTEN and never that it is applied to the right node. */

export function spellingOf(symbol: string) {
  const head = symbol.replace(/^\./, '').split('(')[0] as string;
  return head.slice(head.lastIndexOf('.') + 1);
}

export function carries(source: string, symbol: string) {
  if (source.includes(symbol)) return true;
  const spelling = spellingOf(symbol);
  return spelling.length > 0 && new RegExp(`\\b${spelling}\\b`, 'i').test(source);
}
