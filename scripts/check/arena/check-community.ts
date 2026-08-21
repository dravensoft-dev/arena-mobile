/* The outward-facing files are present, and the one sentence about external contributions is
 * stated in exactly one of them. Four documents restating a policy in four wordings is the
 * state this exists to prevent: a rule with more than one home is the one that goes stale in
 * the other, and every template links it for exactly that reason. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { sortedByCodeUnit } from '../../utils/compare.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { documents } from './check-docs.ts';

export const POLICY = 'takes external pull requests';
export const CONTRIBUTING = 'CONTRIBUTING.md';
export const SECURITY = 'SECURITY.md';
export const CONFIG = '.github/ISSUE_TEMPLATE/config.yml';
export const PR_TEMPLATE = '.github/pull_request_template.md';

export const OUTWARD = new Map<string, string>([
  [CONTRIBUTING, 'the one home of the contribution policy every template points at'],
  [SECURITY, 'where a vulnerability goes, and the only page that may describe the private route'],
  ['CODE_OF_CONDUCT.md', 'the Contributor Covenant this project holds to, with a real contact on it'],
  [PR_TEMPLATE, 'what a pull request is asked for, which routes to the policy rather than restating it'],
  [CONFIG, 'what turns a blank issue off and points a question somewhere a person reads it'],
  ['.github/ISSUE_TEMPLATE/bug.yml', 'a defect, with the fields that make one reproducible'],
  ['.github/ISSUE_TEMPLATE/translation.yml', 'a value that crosses to a native type wrongly, which is this repository\'s own kind of report'],
]);

export const node = {
  name: 'check:community',
  reads: [CONTRIBUTING, SECURITY, 'CODE_OF_CONDUCT.md', '.github/**'],
  writes: [],
  feeds: [],
};

export function zeroScanProblem(found: readonly string[]) {
  if (found.length > 0) return null;
  return 'found 0 documents, so the policy below is stated in no file and this gate cannot tell that from a clean pass';
}

export function missingProblems(root_: string) {
  return [...OUTWARD].flatMap(([rel, why]) => (existsSync(join(root_, rel))
    ? []
    : [`${rel} is not in the tree: ${why}`]));
}

export function policyProblems(found: readonly string[], read: (rel: string) => string, phrase = POLICY) {
  const states = found.filter((rel) => read(rel).includes(phrase));
  if (states.length === 1 && states[0] === CONTRIBUTING) return [];
  if (states.length === 0) {
    return [`no document states "${phrase}", so the policy every template points at is not written down`];
  }
  return [
    `"${phrase}" is stated in ${states.length} document(s), ${sortedByCodeUnit(states).join(', ')}. It belongs to `
    + `${CONTRIBUTING} alone: a rule with more than one home is the one that goes stale in the other, and the `
    + 'templates link it for exactly that reason',
  ];
}

export function templateProblems(template: string) {
  return template.includes(CONTRIBUTING)
    ? []
    : [`${PR_TEMPLATE} does not name ${CONTRIBUTING}, so it either restates the policy or leaves a contributor to find it`];
}

export function securityProblems(security: string) {
  return /private vulnerability reporting/i.test(security)
    ? []
    : [`${SECURITY} does not name private vulnerability reporting, and a public issue is world-readable the moment it exists`];
}

export function configProblems(config: string) {
  const errs: string[] = [];
  if (!/blank_issues_enabled:\s*false/.test(config)) {
    errs.push(`${CONFIG} does not set blank_issues_enabled to false, so a report can arrive with none of the fields a template asks for`);
  }
  return errs;
}

function main() {
  const found = documents(root);
  const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
  const zero = zeroScanProblem(found);
  const missing = missingProblems(root);
  const errs = [
    ...(zero ? [zero] : []),
    ...missing,
    ...policyProblems(found, read),
    ...(missing.length === 0 ? [
      ...templateProblems(read(PR_TEMPLATE)),
      ...securityProblems(read(SECURITY)),
      ...configProblems(read(CONFIG)),
    ] : []),
  ];
  if (errs.length) {
    console.error(`check-community: ${errs.length} problem(s)\n`);
    for (const problem of errs) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-community: ${OUTWARD.size} outward-facing file(s) present, and the policy stated once, in ${CONTRIBUTING}`,
  );
}

if (isMainModule(import.meta.url)) main();
