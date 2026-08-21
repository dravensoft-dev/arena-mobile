import { test, expect } from 'bun:test';
import { COMPILE, DESTINATION, SCHEME, hostProblem } from './check-swift.ts';
import { isDeadline } from '../../lib/arena/deadline.ts';

test('the wait is a deadline carrying why it is that size, and never a bare number', () => {
  expect(isDeadline(COMPILE)).toBe(true);
  expect(COMPILE.why).toContain('macOS runner');
});

test('this claim is made on macOS and nowhere else, and the reason is the SDK and not a package', () => {
  expect(hostProblem('linux')).toContain('Apple SDKs alone');
  expect(hostProblem('win32')).toContain('Apple SDKs alone');
  expect(hostProblem('darwin', '/usr/bin/xcodebuild')).toBeNull();
});

test('macOS without Xcode is a different absence and says so', () => {
  expect(hostProblem('darwin', null)).toContain('not installed or not selected');
});

test('it builds for the iOS destination rather than for whatever the host is', () => {
  expect(DESTINATION).toContain('iOS');
  expect(SCHEME).toBe('ArenaTokens');
});
