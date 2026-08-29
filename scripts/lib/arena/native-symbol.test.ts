import { test, expect } from 'bun:test';
import { carries, spellingOf } from './native-symbol.ts';

test('a spelling is the last member of the symbol, whatever the register wrote around it', () => {
  expect(spellingOf('SemanticsProperties.ContentDescription')).toBe('ContentDescription');
  expect(spellingOf('.accessibilityAddTraits(.isButton)')).toBe('accessibilityAddTraits');
  expect(spellingOf('Role.Button')).toBe('Button');
  expect(spellingOf('Modifier.onFocusChanged')).toBe('onFocusChanged');
  expect(spellingOf('.focused')).toBe('focused');
});

test('a symbol is looked for as it is written, and otherwise by the member a use site spells', () => {
  expect(carries('    contentDescription = content', 'SemanticsProperties.ContentDescription')).toBe(true);
  expect(carries('.accessibilityAddTraits(.isButton)', '.accessibilityAddTraits(.isButton)')).toBe(true);
  expect(carries('public fun ArenaButton(', 'Role.Button')).toBe(false);
  expect(carries('        role = Role.Button', 'Role.Button')).toBe(true);
  expect(carries('    @FocusState private var focused: Bool', '.focused')).toBe(true);
  expect(carries('    .onFocusChanged { focused = it.isFocused }', 'Modifier.onFocusChanged')).toBe(true);
});

test('a spelling that is a substring of another word is not a symbol that is written', () => {
  expect(carries('let unfocusedThing = 1', '.focused')).toBe(false);
});
