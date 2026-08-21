import { test, expect } from 'bun:test';
import { COMPILE, TASKS, toolchainProblem, wrapperFor } from './check-kotlin.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { isDeadline } from '../../lib/arena/deadline.ts';

test('the wait is a deadline carrying why it is that size, and never a bare number', () => {
  expect(isDeadline(COMPILE)).toBe(true);
  expect(COMPILE.why).toContain('cold runner');
});

test('the gate assembles what ships and runs the suite where AGP 9 creates one', () => {
  expect(TASKS).toEqual([':compose:assembleRelease', ':compose:testDebugUnitTest']);
});

test('the wrapper is in the tree, and a build that resolves its own Gradle is one nobody pinned', () => {
  expect(wrapperFor(repoRoot, 'linux')).not.toBeNull();
  expect(wrapperFor(repoRoot, 'win32')).not.toBeNull();
  expect(wrapperFor('/nowhere')).toBeNull();
  expect(toolchainProblem('/usr/bin/java', null)).toContain('nobody pinned');
});

test('a missing JDK is a fact this gate states rather than a spawn that fails', () => {
  expect(toolchainProblem(null, '/repo/gradlew')).toContain('no java');
  expect(toolchainProblem('/usr/bin/java', '/repo/gradlew')).toBeNull();
});
