import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { REGISTRY, RETRIES, RETRY, distOf, integrityProblems, packumentUrl, payloadProblems } from './fetch-contracts.ts';
import { PACKAGE_NAME } from '../../lib/contracts/payload.ts';

const manifest = (contracts: string[], version = '10.2.0') => ({ name: PACKAGE_NAME, version, contracts });

test('the version asked for is read out of the package document, and a version it does not carry is null', () => {
  expect(packumentUrl()).toBe(`${REGISTRY}/${PACKAGE_NAME}`);
  const dist = { tarball: 'https://example.test/a.tgz', integrity: 'sha512-AAAA' };
  expect(distOf({ versions: { '10.2.0': { dist } } }, '10.2.0')).toEqual(dist);
  expect(distOf({ versions: { '10.2.0': { dist } } }, '10.2.1')).toBe(null);
  expect(distOf({ versions: { '10.2.0': { dist: { tarball: 'x' } } } }, '10.2.0')).toBe(null);
});

test('a transient answer from the registry is retried by curl rather than failing the run', () => {
  expect(RETRY.slice(0, 2)).toEqual(['--retry', String(RETRIES)]);
  expect(RETRY).toContain('--max-time');
});

test('the tarball is verified against the digest the registry publishes for that exact version', () => {
  const body = Buffer.from('a payload');
  const digest = createHash('sha512').update(body).digest('base64');
  expect(integrityProblems(`sha512-${digest}`, body)).toEqual([]);
  const bad = integrityProblems(`sha512-${digest}`, Buffer.from('a different payload'));
  expect(bad[0]).toContain('substituted payload');
  expect(integrityProblems('nonsense', body)[0]).toContain('not <algorithm>-<base64>');
});

test('a payload that lost a file and one that gained a file are the same defect from opposite ends', () => {
  const declared = manifest(['contracts/design/a.json']);
  expect(payloadProblems(declared, ['contracts/design/a.json'], '10.2.0')).toEqual([]);
  expect(payloadProblems(declared, [], '10.2.0')[0]).toContain('in the catalogue and not in the payload');
  expect(payloadProblems(declared, ['contracts/design/a.json', 'contracts/design/b.json'], '10.2.0')[0])
    .toContain('in the payload and not in the catalogue');
});

test('an empty catalogue verifies an empty payload against itself, so it fails', () => {
  expect(payloadProblems(manifest([]), [], '10.2.0')[0]).toContain('empty catalogue');
});

test('a payload that is not the version asked for fails before anything is emitted from it', () => {
  expect(payloadProblems(manifest(['a'], '10.1.0'), ['a'], '10.2.0')[0]).toContain('the payload\'s own catalogue says 10.1.0');
});
