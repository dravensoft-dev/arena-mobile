/* The one place in this tree that counts `..` to reach the repository root. Everything else
 * imports the answer, because a script deriving the root from its own location breaks on a
 * move silently: the wrong path still exists. Moving THIS file is the one move needing care. */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
