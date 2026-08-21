import { test, expect } from 'bun:test';
import { pinProblems } from './check-pin.ts';
import { PACKAGE_NAME } from '../../lib/contracts/payload.ts';
import { configProblems } from '../../lib/arena/repo-config.ts';

test('three sources agreeing is the only clean answer', () => {
  expect(pinProblems('10.2.0', '10.2.0', '10.2.0', PACKAGE_NAME)).toEqual([]);
});

test('a stale payload is named as such rather than reported as a version mismatch nobody can act on', () => {
  const errs = pinProblems('10.3.0', '10.2.0', '10.2.0', PACKAGE_NAME);
  expect(errs).toHaveLength(2);
  expect(errs[0]).toContain('generate:contracts');
});

test('a payload that is not the pinned package fails before any version is compared', () => {
  expect(pinProblems('10.2.0', '10.2.0', '10.2.0', '@someone/else')[0]).toContain('@someone/else');
});

test('repo.config.json holds two semantic versions and no field nothing reads', () => {
  expect(configProblems({ version: '0.1.0', 'arena-contracts-version': '10.2.0' })).toEqual([]);
  expect(configProblems({ version: '0.1.0' })[0]).toContain('arena-contracts-version');
  expect(configProblems({ version: 'latest', 'arena-contracts-version': '10.2.0' })[0]).toContain('not a semantic version');
  const extra = configProblems({ version: '0.1.0', 'arena-contracts-version': '10.2.0', colour: 'red' } as never);
  expect(extra[0]).toContain('a field nothing reads is a field nothing holds true');
});
