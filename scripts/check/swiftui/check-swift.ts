/* Swift compiles for iOS, and the tests beside it pass. This gate runs on macOS and nowhere
 * else, and the reason is not a missing package: SwiftUI ships in the Apple SDKs alone, so
 * Swift on Linux compiles the language and cannot compile this target at all. Everywhere else
 * it exits 2 and the sweep reports INCOMPLETE; a workflow sets CI=true and the same absence
 * fails, which is why the macOS job is the only place this claim is ever made. */

import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { runCapturing } from '../../lib/arena/child-output.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { deadline } from '../../lib/arena/deadline.ts';
import { hostOf, isMac } from '../../lib/arena/platform.ts';

export const COMPILE = deadline(
  'check-swift:xcodebuild',
  1_200_000,
  'xcodebuild resolves the package, boots no simulator for a build-only action, and compiles one target; the span is for a macOS runner whose disk is shared with every other job on the host',
);

export const DESTINATION = 'generic/platform=iOS Simulator';
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

function main() {
  const which = hostOf();
  const xcodebuild = isMac(which) ? findHostBinary('xcodebuild') : null;
  const missing = hostProblem(which, xcodebuild);
  if (missing) cannotRun('check-swift', missing);

  const args = ['-scheme', SCHEME, '-destination', DESTINATION, 'build', 'test', '-quiet'];
  const child = runCapturing(xcodebuild as string, args, root, COMPILE.ms);
  if (child.status !== 0) {
    console.error(`check-swift: xcodebuild exited ${child.status} building ${SCHEME} for ${DESTINATION}\n`);
    console.error(child.output);
    process.exit(1);
  }
  console.log(`check-swift: ${SCHEME} builds and tests for ${DESTINATION}, so the emitted Swift compiles against the iOS SDK`);
}

if (isMainModule(import.meta.url)) main();
