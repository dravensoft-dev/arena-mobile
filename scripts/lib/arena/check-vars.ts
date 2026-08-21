/* The one spelling of "this gate cannot run here". A rule spelled once per gate is a rule
 * that holds for some of them: with each gate spelling its own answer, the same missing
 * dependency fails one and skips the next on identical settings. Unlike Arena this repository
 * declares itself NOT strict, because xcodebuild does not install on every machine and a gate
 * that is permanently red stops being read; CI=true turns every skip back into a failure. */

export const STRICT_VAR = 'ARENA_MOBILE_CHECK_STRICT';
export const SKIP_EXIT_CODE = 2;

export function isStrict(env: NodeJS.ProcessEnv = process.env) {
  if (env.CI === 'true') return true;
  return env[STRICT_VAR] === '1';
}

export function skipExitCode(env: NodeJS.ProcessEnv = process.env) {
  return isStrict(env) ? 1 : SKIP_EXIT_CODE;
}

export function cannotRun(gate: string, why: string, env: NodeJS.ProcessEnv = process.env): never {
  const code = skipExitCode(env);
  const verdict = code === 1 ? 'and this run is strict, so that is a failure' : 'so this gate is skipped';
  console.error(`${gate}: cannot run here, ${why}, ${verdict}`);
  process.exit(code);
}
