/* Which component contracts a reader on this side owes, decided by the behaviour register
 * rather than by a prefix. A component contract is READ when BINDINGS publishes the component,
 * and excluded when the register records it absent, inheriting that entry's own reason rather
 * than restating it. A roster of the unpublished ones would be a list nothing fails over; the
 * register already fails when a binding moves, so the exclusion goes stale with it. Nothing
 * here reads a member: what it states is who owes one, and MEMBERS is the reader that owes it. */

import { sortedByCodeUnit } from '../../utils/compare.ts';
import { componentNameOf, componentSources } from '../contracts/api-types.ts';
import type { ContractManifest } from '../contracts/payload.ts';
import { BINDINGS, absenceReasonOf, type Entry } from './behaviour-bindings.ts';
import { MEMBERS } from './component-members.ts';

export function publishedIn(manifest: ContractManifest, register: Map<string, Entry> = BINDINGS) {
  return sortedByCodeUnit(componentSources(manifest)
    .filter((source) => register.has(componentNameOf(source)))
    .filter((source) => absenceReasonOf(componentNameOf(source), register) === null));
}

export function excludedIn(manifest: ContractManifest, register: Map<string, Entry> = BINDINGS) {
  return sortedByCodeUnit(componentSources(manifest)
    .filter((source) => absenceReasonOf(componentNameOf(source), register) !== null));
}

export function surfaceProblems(manifest: ContractManifest, register: Map<string, Entry> = BINDINGS) {
  return sortedByCodeUnit(componentSources(manifest).flatMap((source) => {
    const component = componentNameOf(source);
    if (!register.has(component)) {
      return [`${source} is a component contract the behaviour register does not name, so nothing here `
        + 'decides whether its member surface is owed or excused. The register is where that answer lives'];
    }
    if (absenceReasonOf(component, register) !== null) return [];
    if (MEMBERS.has(component)) return [];
    return [`${source} names a component the behaviour register publishes, and MEMBERS opens no member surface `
      + 'for it. The members a consumer calls it with would be held by nothing, which is the hole the exclusion '
      + 'existed to keep out'];
  }));
}
