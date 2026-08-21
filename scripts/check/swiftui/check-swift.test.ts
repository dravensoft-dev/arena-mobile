import { test, expect } from 'bun:test';
import { COMPILE, LIST, SCHEME, hostProblem, pickSimulator } from './check-swift.ts';
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

test('the destination is a concrete simulator, because a generic one builds and refuses to test', () => {
  const listing = JSON.stringify({
    devices: {
      'com.apple.CoreSimulator.SimRuntime.iOS-18-4': [{ udid: 'OLD', name: 'iPhone 16', isAvailable: true }],
      'com.apple.CoreSimulator.SimRuntime.iOS-26-1': [{ udid: 'NEW', name: 'iPhone 17', isAvailable: true }],
      'com.apple.CoreSimulator.SimRuntime.watchOS-26-0': [{ udid: 'W', name: 'Apple Watch', isAvailable: true }],
    },
  });
  expect(pickSimulator(listing)).toEqual({ udid: 'NEW', label: 'iPhone 17, iOS 26.1' });
  expect(SCHEME).toBe('ArenaTokens');
  expect(LIST.why).toContain('runtime');
});

test('an unavailable device and a runtime with no iPhone are both passed over', () => {
  const listing = JSON.stringify({
    devices: {
      'com.apple.CoreSimulator.SimRuntime.iOS-26-1': [{ udid: 'X', name: 'iPhone 17', isAvailable: false }],
      'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [{ udid: 'Y', name: 'iPhone 16', isAvailable: true }],
    },
  });
  expect(pickSimulator(listing)?.udid).toBe('Y');
  expect(pickSimulator(JSON.stringify({ devices: {} }))).toBeNull();
});
