/* What package.json declares, read once for the two gates that ask. A name a workflow hands a
 * runner and a name a document hands a reader are the same question over two sources, and a
 * second copy of the answer drifts the first time a script is renamed. */

import { join } from 'node:path';
import { readJson } from '../../utils/read-json.ts';
import { captured } from '../../utils/captured.ts';

export const PACKAGE_MANIFEST = 'package.json';

export const RUN_SCRIPT = /\bbun run ([A-Za-z0-9:._-]+)/g;

export function scriptNames(root: string) {
  const manifest = readJson<{ scripts?: Record<string, string> }>(join(root, PACKAGE_MANIFEST));
  return new Set(Object.keys(manifest.scripts ?? {}));
}

export function runScriptNames(text: string) {
  return [...text.matchAll(RUN_SCRIPT)].map((match) => captured(match));
}

export function undeclaredScriptProblems(where: string, names: readonly string[], declared: ReadonlySet<string>) {
  return names
    .filter((name) => !declared.has(name))
    .map((name) => `${where} types bun run ${name}, and ${PACKAGE_MANIFEST} declares no script by that name`);
}

export function zeroScriptProblem(declared: ReadonlySet<string>) {
  if (declared.size > 0) return null;
  return `${PACKAGE_MANIFEST} declares no script at all, so every name below is undeclared and the comparison holds over nothing`;
}
