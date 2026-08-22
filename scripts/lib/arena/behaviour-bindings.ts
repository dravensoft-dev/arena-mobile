/* What each component of the pinned contract binds, in each layer. Keyed by the CONTRACT and
 * never by what this repository publishes, so the register cannot be empty and a component the
 * payload gains is a hole the gate reports rather than a silence. `met` and `exceptions`
 * PARTITION the pattern's requirements: upstream an exception list is a subset and silence
 * means the browser met it, and here silence would mean nothing at all. */

import { sortedByCodeUnit } from '../../utils/compare.ts';
import { requirementsOf, type Pattern } from '../contracts/behaviour.ts';
import { LAYERS, refusalReason, type Layer } from './behaviour-obligations.ts';

export const REASONLESS_PATTERNS = ['absent', 'none'];

export type Added = {
  pattern: string;
  met?: Record<string, Partial<Record<Layer, string>>>;
  exceptions?: Record<string, string>;
};

export type LayerBinding = {
  pattern?: string;
  reason?: string;
  met?: Record<string, Partial<Record<Layer, string>>>;
  exceptions?: Record<string, string>;
  also?: Added[];
};

export type Entry = LayerBinding & Partial<Record<Layer, LayerBinding>> & { divergesFrom?: string };

export function bindingLayers(entry: Entry) {
  return LAYERS.map((layer) => ({ layer, ...((entry[layer] as LayerBinding | undefined) ?? entry) }));
}

function partitionProblems(where: string, binding: LayerBinding & { layer: Layer }, required: string[]) {
  const errs: string[] = [];
  const met = Object.keys(binding.met ?? {});
  const excepted = Object.keys(binding.exceptions ?? {});
  const declared = new Set([...met, ...excepted]);
  for (const key of met) {
    if (excepted.includes(key)) errs.push(`${where}: ${key} is both met and excepted, and a requirement is one or the other`);
  }
  for (const key of required) {
    if (!declared.has(key)) {
      errs.push(`${where}: ${key} is neither met nor excepted. Silence means the element met it upstream and means nothing here, so a binding partitions rather than lists`);
    }
  }
  for (const key of declared) {
    if (!required.includes(key)) errs.push(`${where}: names ${key}, which the ${binding.pattern} pattern does not require`);
  }
  for (const [key, answers] of Object.entries(binding.met ?? {})) {
    if (!answers[binding.layer]) errs.push(`${where}: claims ${key} met and names no ${binding.layer} symbol for it, so nothing can look for one`);
  }
  return errs;
}

function refusalProblems(where: string, binding: LayerBinding & { layer: Layer }, required: string[]) {
  const errs: string[] = [];
  for (const key of required) {
    const owned = refusalReason(key, binding.layer);
    if (owned === null) continue;
    const excuse = binding.exceptions?.[key];
    if (excuse === undefined) {
      errs.push(`${where}: ${key} is refused on ${binding.layer} and this binding does not except it: ${owned}`);
      continue;
    }
    if (excuse !== owned) {
      errs.push(`${where}: ${key} restates a reason the obligation map owns, so the two go stale apart. Inherit it rather than retyping it`);
    }
  }
  return errs;
}

export function bindingProblems(component: string, entry: Entry, patterns: Map<string, Pattern>) {
  const errs: string[] = [];
  for (const binding of bindingLayers(entry)) {
    const where = `${component}:${binding.layer}`;
    if (!binding.pattern) { errs.push(`${where}: declares no pattern`); continue; }
    const pattern = patterns.get(binding.pattern);
    if (!pattern) { errs.push(`${where}: names no pattern the pinned contract declares, "${binding.pattern}"`); continue; }
    const reasonless = REASONLESS_PATTERNS.includes(binding.pattern);
    if (reasonless && !binding.reason) {
      errs.push(`${where}: binding ${binding.pattern} requires a reason, because nothing recorded, verified inert and does not exist here have to read differently`);
    }
    if (!reasonless && binding.reason) {
      errs.push(`${where}: carries a reason and binds a real pattern, and a reason is what ${REASONLESS_PATTERNS.join(' and ')} take`);
    }
    if (reasonless && (binding.met || binding.exceptions)) {
      errs.push(`${where}: binding ${binding.pattern} has no requirement to meet or to except`);
      continue;
    }
    if (reasonless) continue;
    const required = requirementsOf(pattern);
    errs.push(...partitionProblems(where, binding, required));
    errs.push(...refusalProblems(where, binding, required));
    for (const added of binding.also ?? []) {
      const addedPattern = patterns.get(added.pattern);
      if (!addedPattern) { errs.push(`${where}: adds "${added.pattern}", which the pinned contract does not declare`); continue; }
      if (addedPattern.additive !== true) errs.push(`${where}: adds ${added.pattern}, which is not an additive pattern`);
      const addedWhere = `${where} also:${added.pattern}`;
      errs.push(...partitionProblems(addedWhere, { ...added, layer: binding.layer }, requirementsOf(addedPattern)));
      errs.push(...refusalProblems(addedWhere, { ...added, layer: binding.layer }, requirementsOf(addedPattern)));
    }
  }
  return sortedByCodeUnit(errs);
}

function addedSet(binding: LayerBinding) {
  return sortedByCodeUnit((binding.also ?? []).map((added) => added.pattern)).join(', ');
}

export function crossLayerProblems(component: string, entry: Entry) {
  const [first, second] = bindingLayers(entry);
  if (!first || !second) return [];
  const reasonless = REASONLESS_PATTERNS.includes(first.pattern ?? '') || REASONLESS_PATTERNS.includes(second.pattern ?? '');
  if (reasonless || entry.divergesFrom) return [];
  const errs: string[] = [];
  if (first.pattern !== second.pattern) {
    errs.push(`${component}: compose binds "${first.pattern}", swiftui binds "${second.pattern}", and neither declares divergesFrom.`
      + ' The PATTERN is the authority and neither layer is, so decide which is the defect');
  }
  if (addedSet(first) !== addedSet(second)) {
    errs.push(`${component}: compose adds "${addedSet(first)}", swiftui adds "${addedSet(second)}", and neither declares divergesFrom.`
      + ' An additive pattern one layer owes and the other does not moves nothing a person can see, which is why it is compared here');
  }
  return errs;
}

export function componentProblems(components: string[]) {
  const carried = new Set(components);
  const errs = components
    .filter((component) => !BINDINGS.has(component))
    .map((component) => `${component} is a component the pinned contract carries and has no entry in BINDINGS, which is the silent hole this register exists to stop`);
  for (const component of BINDINGS.keys()) {
    if (!carried.has(component)) errs.push(`BINDINGS declares ${component}, and the pinned contract carries no such component. Delete the entry`);
  }
  return sortedByCodeUnit(errs);
}

export const BINDINGS = new Map<string, Entry>([ /* Task 4 */ ]);
