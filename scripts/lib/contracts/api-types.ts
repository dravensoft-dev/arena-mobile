/* The API contract's vocabulary, which is not the token tier's. A type is an enum or a
 * predefined object, and a field of an object is a primitive, an enum, or an array of one
 * primitive type: R1 upstream refuses the other six forms, so three rows and a refusal are the
 * whole of what arrives here. NOT_YET_READ names the half of contracts/api/ THIS EMIT does not
 * read, with the reason, so the absence is a record rather than a hole; the behaviour register
 * reads the component NAMES out of that same half, which is a different reader and not a
 * contradiction of the entry. */

import { join } from 'node:path';
import { readJson } from '../../utils/read-json.ts';
import { byCodeUnit, sortedByCodeUnit } from '../../utils/compare.ts';
import { CONTRACTS_DIR, readManifest, type ContractManifest } from './payload.ts';

export const API_PREFIX = 'contracts/api/';
export const TYPES_PREFIX = `${API_PREFIX}types/`;
export const COMPONENTS_PREFIX = `${API_PREFIX}components/`;
export const NAME_PREFIX = 'Arena';

export const PRIMITIVES = ['string', 'number', 'boolean'] as const;
export type Primitive = (typeof PRIMITIVES)[number];

export const FIELD_FORMS = ['primitive', 'enum', 'array'] as const;

export type ApiField = {
  form: string;
  type?: string;
  of?: string;
  required?: boolean;
  description?: string;
};

export type ApiType = {
  name: string;
  kind: string;
  description?: string;
  values?: (string | number)[];
  fields?: Record<string, ApiField>;
};

export const NOT_YET_READ = new Map<string, string>([
  [
    COMPONENTS_PREFIX,
    'a component contract states the members one component presents, and this repository publishes no '
    + 'component, so a member surface emitted now is one that would be rewritten rather than extended. '
    + 'What this emit does not read is that member surface; the component NAME is read, by the behaviour '
    + 'register, which keys itself by the contract so an unpublished component is a recorded absence '
    + 'rather than a hole. The first component landing here is what retires this entry',
  ],
]);

export function apiSources(manifest: ContractManifest) {
  return sortedByCodeUnit(manifest.contracts.filter((path) => path.startsWith(API_PREFIX)));
}

export function typeSources(manifest: ContractManifest) {
  return sortedByCodeUnit(manifest.contracts.filter((path) => path.startsWith(TYPES_PREFIX)));
}

export function staleNotYetReadProblems(manifest: ContractManifest) {
  const carried = apiSources(manifest);
  return [...NOT_YET_READ].flatMap(([prefix, why]) => (carried.some((path) => path.startsWith(prefix))
    ? []
    : [`NOT_YET_READ names ${prefix}, and the payload carries nothing under it. An absence covering `
      + `nothing records nothing: ${why}`]));
}

export function loadApiTypes(root: string, manifest = readManifest(root)) {
  return typeSources(manifest)
    .map((source) => readJson<ApiType>(join(root, CONTRACTS_DIR, source)))
    .sort((a, b) => byCodeUnit(a.name ?? '', b.name ?? ''));
}

export function isPrimitive(name: string | undefined): name is Primitive {
  return name !== undefined && (PRIMITIVES as readonly string[]).includes(name);
}

export function fieldEntries(fields: Record<string, ApiField> | undefined) {
  return Object.entries(fields ?? {});
}

export function requiredFirst(fields: Record<string, ApiField> | undefined) {
  const entries = fieldEntries(fields);
  return [
    ...entries.filter(([, field]) => field.required === true),
    ...entries.filter(([, field]) => field.required !== true),
  ];
}

function fieldProblems(type: ApiType, kindByName: Map<string, string>) {
  const errs: string[] = [];
  for (const [field, spec] of fieldEntries(type.fields)) {
    const where = `${type.name}.${field}`;
    if (spec.form === 'primitive') {
      if (!isPrimitive(spec.type)) errs.push(`${where}: "${spec.type}" is none of ${PRIMITIVES.join(', ')}`);
      continue;
    }
    if (spec.form === 'enum') {
      const kind = kindByName.get(spec.type ?? '');
      if (kind === undefined) errs.push(`${where}: names type "${spec.type}", which ${TYPES_PREFIX} does not declare`);
      else if (kind !== 'enum') errs.push(`${where}: "${spec.type}" is a ${kind}, used where an enum belongs`);
      continue;
    }
    if (spec.form === 'array') {
      if (!isPrimitive(spec.of)) {
        errs.push(`${where}: an array field is an array of primitives and "${spec.of}" is not one. R1, an object `
          + 'is pure data with known fields, and an array of objects reopens a nesting depth with no bottom');
      }
      continue;
    }
    errs.push(`${where}: form "${spec.form}" is none of ${FIELD_FORMS.join(', ')}, which is R1 and is refused by the `
      + 'contract before it reaches here. This emit states no native shape for it');
  }
  return errs;
}

export function structureProblems(types: ApiType[]) {
  const errs: string[] = [];
  const seen = new Set<string>();
  const kindByName = new Map(types.filter((type) => type.name).map((type) => [type.name, type.kind]));

  for (const type of types) {
    if (!type.name) { errs.push(`${TYPES_PREFIX}: a type declares no name`); continue; }
    if (!type.name.startsWith(NAME_PREFIX)) {
      errs.push(`${type.name}: does not start with ${NAME_PREFIX}, and every type reaches a consumer through the `
        + 'package root, where an unprefixed name collides with whatever that project already calls it');
    }
    if (seen.has(type.name)) errs.push(`${type.name}: declared twice`);
    seen.add(type.name);

    if (type.kind === 'enum') {
      if (!Array.isArray(type.values) || type.values.length === 0) {
        errs.push(`${type.name}: an enum is a closed set and this declares no values`);
      }
      continue;
    }
    if (type.kind !== 'object') { errs.push(`${type.name}: unknown kind "${type.kind}"`); continue; }
    errs.push(...fieldProblems(type, kindByName));
  }
  return sortedByCodeUnit(errs);
}
