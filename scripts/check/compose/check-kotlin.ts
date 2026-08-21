/* Kotlin compiles, and the unit tests beside it pass. This is one of the two gates that
 * cannot run on every host: it needs a JDK, and the Gradle wrapper downloads the distribution
 * on first use. Where the JDK is missing it exits 2 and the sweep reports INCOMPLETE, and a
 * workflow sets CI=true so the same absence is a failure there. The deadline is generous by
 * intent, because the first run on a cold runner fetches a distribution over the network. */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { findHostBinary } from '../../lib/arena/host-binary.ts';
import { runCapturing } from '../../lib/arena/child-output.ts';
import { cannotRun } from '../../lib/arena/check-vars.ts';
import { deadline } from '../../lib/arena/deadline.ts';
import { hostOf } from '../../lib/arena/platform.ts';

export const COMPILE = deadline(
  'check-kotlin:gradle',
  1_800_000,
  'a cold runner downloads the Gradle distribution, then the Android and Compose artifacts, before it compiles anything; the compile itself is seconds and the fetch is what the span is for',
);

export const TASKS = [':compose:assembleRelease', ':compose:testReleaseUnitTest'];

export const node = {
  name: 'check:kotlin',
  reads: [
    'compose/**', '!compose/build/**',
    'gradle/**', 'settings.gradle.kts', 'gradle.properties', 'repo.config.json',
  ],
  writes: [],
  feeds: [],
};

export function wrapperFor(root_: string, which = hostOf()) {
  const name = which === 'win32' ? 'gradlew.bat' : 'gradlew';
  const path = join(root_, name);
  return existsSync(path) ? path : null;
}

export function toolchainProblem(java: string | null, wrapper: string | null) {
  if (!wrapper) return 'the tree carries no Gradle wrapper, and a build that resolves its own Gradle is a build nobody pinned';
  if (!java) return 'this host supplies no java, and Gradle needs one';
  return null;
}

function main() {
  const wrapper = wrapperFor(root);
  const java = findHostBinary('java');
  const missing = toolchainProblem(java, wrapper);
  if (missing) cannotRun('check-kotlin', missing);

  const child = runCapturing(wrapper as string, [...TASKS, '--console=plain'], root, COMPILE.ms);
  if (child.status !== 0) {
    console.error(`check-kotlin: gradle exited ${child.status} running ${TASKS.join(' ')}\n`);
    console.error(child.output);
    process.exit(1);
  }
  console.log(`check-kotlin: ${TASKS.length} Gradle task(s) green, so the emitted Kotlin compiles and the suite beside it passes`);
}

if (isMainModule(import.meta.url)) main();
