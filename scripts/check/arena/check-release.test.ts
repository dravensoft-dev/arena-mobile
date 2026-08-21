import { test, expect } from 'bun:test';
import { README_HEADING, packageSwiftProblems, readmeProblems, tagFor, tagProblems } from './check-release.ts';

test('the README pair is found by exact match, so the heading and the label are what must not move', () => {
  const readme = `${README_HEADING}\n- **arena-mobile**: 0.1.0\n`;
  expect(readmeProblems(readme, '0.1.0')).toEqual([]);
  expect(readmeProblems(readme, '0.2.0')[0]).toContain('says 0.1.0');
  expect(readmeProblems('- **arena-mobile**: 0.1.0\n', '0.1.0')[0]).toContain('no "## Latest project artifacts" heading');
  expect(readmeProblems(`${README_HEADING}\n- arena-mobile 0.1.0\n`, '0.1.0')[0]).toContain('must not be reworded');
});

test('Package.swift carries no version, because SwiftPM reads the tag', () => {
  expect(packageSwiftProblems('let package = Package(name: "ArenaTokens")')).toEqual([]);
  expect(packageSwiftProblems('version: "0.1.0"')[0]).toContain('SwiftPM reads the git tag');
});

test('before the tag exists the gate says so and hands over the command that creates it', () => {
  expect(tagFor('0.1.0')).toBe('v0.1.0');
  expect(tagProblems('0.1.0', ['v0.1.0'])).toEqual([]);
  expect(tagProblems('0.1.0', [])[0]).toContain('git tag -a v0.1.0');
});
