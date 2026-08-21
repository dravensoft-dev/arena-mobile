/* The one owner of process.platform. Everywhere else takes the answer as a parameter, which
 * is what makes a branch written for Windows testable from Linux: the machine a contributor
 * happens to own stops deciding which half of the tooling is covered. */

export type Host = 'linux' | 'darwin' | 'win32' | 'other';

export function hostOf(platform = process.platform): Host {
  if (platform === 'linux' || platform === 'darwin' || platform === 'win32') return platform;
  return 'other';
}

export const host = hostOf();

export function isMac(which: Host = host) {
  return which === 'darwin';
}
