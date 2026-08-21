/* Swift compiles for iOS, and the tests beside it pass. This gate runs on macOS and nowhere
 * else, and the reason is not a missing package: SwiftUI ships in the Apple SDKs alone, so
 * Swift on Linux compiles the language and cannot compile this target at all. The destination
 * is a concrete simulator resolved at run time rather than a generic one, because a generic
 * destination builds and refuses to test, and the name of a simulator a runner happens to
 * carry is a fact about that runner rather than one worth writing down. */

import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { runCapturing } from '../../lib/arena/child-output.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { deadline } from '../../lib/arena/deadline.ts';
import { hostOf, isMac } from '../../lib/arena/platform.ts';

export const LIST = deadline(
  'check-swift:simctl',
  120_000,
  'simctl enumerates every runtime and device the runner carries, which is a cold read of a large directory the first time it is asked',
);

export const COMPILE = deadline(
  'check-swift:xcodebuild',
  1_200_000,
  'xcodebuild resolves the package, boots one simulator and compiles one target; the span is for a macOS runner whose disk is shared with every other job on the host',
);

export const SCHEME = 'ArenaTokens';

export const node = {
  name: 'check:swift',
  reads: ['swiftui/**', 'Package.swift'],
  writes: [],
  feeds: [],
};

export function hostProblem(which = hostOf(), xcodebuild: string | null = null) {
  if (!isMac(which)) {
    return `this host is ${which} and SwiftUI ships in the Apple SDKs alone, so no Swift toolchain anywhere else compiles this target`;
  }
  if (!xcodebuild) return 'this host is macOS and supplies no xcodebuild, so Xcode is not installed or not selected';
  return null;
}

type Device = { udid: string; name: string; isAvailable?: boolean };

export function pickSimulator(listing: string) {
  const devices = (JSON.parse(listing) as { devices?: Record<string, Device[]> }).devices ?? {};
  const runtimes = Object.keys(devices)
    .map((key) => ({ key, version: /iOS-(\d+)-(\d+)/.exec(key) }))
    .filter((one): one is { key: string; version: RegExpExecArray } => one.version !== null)
    .sort((a, b) => (Number(b.version[1]) - Number(a.version[1])) || (Number(b.version[2]) - Number(a.version[2])));
  for (const runtime of runtimes) {
    const found = (devices[runtime.key] ?? [])
      .filter((device) => device.isAvailable !== false && device.name.startsWith('iPhone'));
    if (found.length === 0) continue;
    const version = `${runtime.version[1]}.${runtime.version[2]}`;
    return { udid: found[0].udid, label: `${found[0].name}, iOS ${version}` };
  }
  return null;
}

function main() {
  const which = hostOf();
  const xcodebuild = isMac(which) ? findHostBinary('xcodebuild') : null;
  const missing = hostProblem(which, xcodebuild);
  if (missing) cannotRun('check-swift', missing);

  const xcrun = findHostBinary('xcrun');
  if (!xcrun) cannotRun('check-swift', 'this host supplies no xcrun, so no simulator can be resolved');
  const listing = runCapturing(xcrun as string, ['simctl', 'list', 'devices', 'available', '--json'], root, LIST.ms);
  if (listing.status !== 0) {
    console.error(`check-swift: simctl exited ${listing.status}\n${listing.output}`);
    process.exit(1);
  }
  const simulator = pickSimulator(listing.output);
  if (!simulator) {
    cannotRun('check-swift', 'this host carries no available iPhone simulator, and a generic destination builds without testing');
  }

  const destination = `platform=iOS Simulator,id=${(simulator as { udid: string }).udid}`;
  const child = runCapturing(
    xcodebuild as string,
    ['-scheme', SCHEME, '-destination', destination, 'build', 'test', '-quiet'],
    root,
    COMPILE.ms,
  );
  if (child.status !== 0) {
    console.error(`check-swift: xcodebuild exited ${child.status} building ${SCHEME} on ${(simulator as { label: string }).label}\n`);
    console.error(child.output);
    process.exit(1);
  }
  console.log(`check-swift: ${SCHEME} builds and tests on ${(simulator as { label: string }).label}, so the emitted Swift compiles against the iOS SDK`);
}

if (isMainModule(import.meta.url)) main();
