/* The behaviour contract's vocabulary, which is neither the token tier's nor the API type's.
 * A pattern is a name, a cited source and a flat map of dotted requirement keys, and the flat
 * shape is load-bearing: an exception names exactly one requirement, so one exception cannot
 * quietly excuse three. `element` is the role as a field rather than as prose, which is what
 * lets a target with no browser apply it without parsing the sentence beside it. */

import { join } from 'node:path';
import { readJson } from '../../utils/read-json.ts';
import { byCodeUnit, sortedByCodeUnit } from '../../utils/compare.ts';
import { CONTRACTS_DIR, readManifest, type ContractManifest } from './payload.ts';

export const BEHAVIOUR_PREFIX = 'contracts/behaviour/';
export const ROLES_FAMILY = 'roles';
export const ELEMENT_REQUIREMENT = 'roles.element';

export type Pattern = {
  name?: string;
  source?: string;
  description?: string;
  element?: string;
  additive?: true;
  requires?: Record<string, unknown>;
};

export function patternSources(manifest: ContractManifest) {
  return sortedByCodeUnit(manifest.contracts.filter((path) => path.startsWith(BEHAVIOUR_PREFIX)));
}

export function loadPatterns(root: string, manifest = readManifest(root)) {
  const found = new Map<string, Pattern>();
  for (const source of patternSources(manifest)) {
    const pattern = readJson<Pattern>(join(root, CONTRACTS_DIR, source));
    found.set(pattern.name ?? source, pattern);
  }
  return found;
}

export function requirementsOf(pattern: Pattern) {
  return sortedByCodeUnit(Object.keys(pattern.requires ?? {}));
}

export function requirementKeys(patterns: Map<string, Pattern>) {
  const keys = new Set<string>();
  for (const pattern of patterns.values()) for (const key of requirementsOf(pattern)) keys.add(key);
  return [...keys].sort(byCodeUnit);
}

export function elementRoles(patterns: Map<string, Pattern>) {
  const roles = new Set<string>();
  for (const pattern of patterns.values()) if (pattern.element) roles.add(pattern.element);
  return [...roles].sort(byCodeUnit);
}

function requirementProblems(pattern: Pattern, where: string) {
  const errs: string[] = [];
  const requires = pattern.requires;
  if (requires === undefined) return [`${where}: declares no requires map, and a pattern with no requirements says so with an empty one`];
  for (const key of Object.keys(requires)) {
    if (!key.includes('.')) {
      errs.push(`${where}: requirement "${key}" is not a dotted key, and the dotted shape is what makes an exception name exactly one requirement`);
    }
  }
  return errs;
}

function elementProblems(pattern: Pattern, where: string) {
  const requiresElement = ELEMENT_REQUIREMENT in (pattern.requires ?? {});
  if (requiresElement && !pattern.element) {
    return [`${where}: requires ${ELEMENT_REQUIREMENT} and names no element field, so the role is only readable out of the prose beside it`];
  }
  if (!requiresElement && pattern.element) {
    return [`${where}: names an element field and requires no ${ELEMENT_REQUIREMENT}, so the field states a role nothing asks for`];
  }
  return [];
}

function additiveProblems(pattern: Pattern, where: string) {
  if (!('additive' in pattern)) return [];
  const errs: string[] = [];
  if (pattern.additive !== true) {
    errs.push(`${where}: additive is present and not true, which reads as a decision somebody made when the only decision available is whether the key is there`);
  }
  if (!pattern.description) {
    errs.push(`${where}: an additive pattern carries no description, and it is bound alongside another rather than instead of one, so nothing else says why a component owes both`);
  }
  for (const key of requirementsOf(pattern)) {
    if (key.split('.')[0] === ROLES_FAMILY) {
      errs.push(`${where}: an additive pattern requires nothing in the roles family, and this one requires ${key}. There is one answer per render to what a component IS`);
    }
  }
  return errs;
}

export function structureProblems(patterns: Pattern[]) {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    const where = pattern.name ?? BEHAVIOUR_PREFIX;
    if (!pattern.name) { errs.push(`${BEHAVIOUR_PREFIX}: a pattern declares no name`); continue; }
    if (seen.has(pattern.name)) errs.push(`${pattern.name}: declared twice`);
    seen.add(pattern.name);
    if (!pattern.source) errs.push(`${where}: cites no source, and every pattern names what it was adopted from or says there is nothing to adopt`);
    if (!pattern.description) errs.push(`${where}: carries no description`);
    errs.push(...requirementProblems(pattern, where));
    errs.push(...elementProblems(pattern, where));
    errs.push(...additiveProblems(pattern, where));
  }
  return sortedByCodeUnit(errs);
}
