/* Writes the API vocabulary both native builds compile: one file per layer, holding every enum
 * and every predefined object the pinned contract declares. It is a second emitter over a
 * second vocabulary rather than a widening of the first, because a token carries a unit and one
 * of these carries none, and the two languages disagree about what an enum is worth: Swift
 * synthesises the raw value, the case list and a failable initialiser, and Kotlin synthesises
 * none of the three, so what is written here on the Kotlin side is what Swift is given. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, MANIFEST, readManifest } from '../../lib/contracts/payload.ts';
import {
  TYPES_PREFIX, loadApiTypes, requiredFirst, staleNotYetReadProblems, structureProblems, type ApiType,
} from '../../lib/contracts/api-types.ts';
import {
  enumCases, fieldTypes, rawTypes, staleCaseNameProblems, staleRephrasedProblems, docTextFor,
} from '../../lib/arena/api-emit.ts';
import { API_COMMAND, API_SUBJECT, banner, kdoc, tripleSlash } from '../../lib/arena/emit.ts';
import { SWIFT_DIR } from './generate-tokens.ts';

export const KOTLIN_API_DIR = 'compose/src/main/kotlin/org/dravensoft/arena/api';
export const KOTLIN_API_PACKAGE = 'org.dravensoft.arena.api';

export const API_TARGETS = [
  `${KOTLIN_API_DIR}/ArenaApi.generated.kt`,
  `${SWIFT_DIR}/ArenaApi.generated.swift`,
];

export const node = {
  name: 'generate:api-types',
  reads: [`${CONTRACTS_DIR}/${MANIFEST}`, `${CONTRACTS_DIR}/${TYPES_PREFIX}**`],
  writes: API_TARGETS,
  feeds: ['check:collisions', 'check:doc-comments', 'check:emit', 'check:generated', 'check:kotlin', 'check:swift'],
};

const doc = (type: ApiType, field: string | null, description: string | undefined) => docTextFor(type.name, field, description);

function kotlinEnum(type: ApiType) {
  const raw = rawTypes(type).kotlin;
  const cases = enumCases(type);
  const entries = cases.map((one, index) => `    ${one.kotlin}(${one.literal})${index === cases.length - 1 ? ';' : ','}`);
  return [
    ...kdoc(doc(type, null, type.description), ''),
    `public enum class ${type.name}(public val value: ${raw}) {`,
    ...entries,
    '',
    '    public companion object {',
    `        public fun from(value: ${raw}): ${type.name}? = entries.firstOrNull { it.value == value }`,
    '    }',
    '}',
  ];
}

function kotlinObject(type: ApiType) {
  const fields = requiredFirst(type.fields).map(([name, spec]) => {
    const { kotlin } = fieldTypes(spec, `${type.name}.${name}`);
    const optional = spec.required === true ? '' : '? = null';
    return [
      ...kdoc(doc(type, name, spec.description), '    '),
      `    public val ${name}: ${kotlin}${optional},`,
    ];
  });
  return [
    ...kdoc(doc(type, null, type.description), ''),
    `public data class ${type.name}(`,
    ...fields.flat(),
    ')',
  ];
}

function swiftEnum(type: ApiType) {
  const raw = rawTypes(type).swift;
  return [
    ...tripleSlash(doc(type, null, type.description), ''),
    `public enum ${type.name}: ${raw}, CaseIterable, Sendable {`,
    ...enumCases(type).map((one) => `    case ${one.swift} = ${one.literal}`),
    '}',
  ];
}

function swiftObject(type: ApiType) {
  const fields = requiredFirst(type.fields).map(([name, spec]) => ({
    name,
    spec,
    swift: fieldTypes(spec, `${type.name}.${name}`).swift,
    optional: spec.required !== true,
  }));
  const members = fields.flatMap((one) => [
    ...tripleSlash(doc(type, one.name, one.spec.description), '    '),
    `    public let ${one.name}: ${one.swift}${one.optional ? '?' : ''}`,
  ]);
  const parameters = fields.map((one, index) => {
    const tail = index === fields.length - 1 ? '' : ',';
    return `        ${one.name}: ${one.swift}${one.optional ? '? = nil' : ''}${tail}`;
  });
  const initialiser = fields.length === 0
    ? ['    public init() {}']
    : ['    public init(', ...parameters, '    ) {', ...fields.map((one) => `        self.${one.name} = ${one.name}`), '    }'];
  return [
    ...tripleSlash(doc(type, null, type.description), ''),
    `public struct ${type.name}: Sendable {`,
    ...members,
    '',
    ...initialiser,
    '}',
  ];
}

function render(types: ApiType[], head: string[], one: (type: ApiType) => string[]) {
  const body = types.flatMap((type) => ['', ...one(type)]);
  return [...head, ...body, ''].join('\n');
}

export function emitApi(types: ApiType[]) {
  const kotlinHead = [banner('/*', API_COMMAND, API_SUBJECT), '', `package ${KOTLIN_API_PACKAGE}`];
  const swiftHead = [banner('//', API_COMMAND, API_SUBJECT)];
  const files = new Map<string, string>();
  files.set(API_TARGETS[0], render(types, kotlinHead, (type) => (type.kind === 'enum' ? kotlinEnum(type) : kotlinObject(type))));
  files.set(API_TARGETS[1], render(types, swiftHead, (type) => (type.kind === 'enum' ? swiftEnum(type) : swiftObject(type))));
  return files;
}

export function apiTypesOf(root = repoRoot) {
  return loadApiTypes(root, readManifest(root));
}

export function payloadProblems(types: ApiType[], root = repoRoot) {
  return [
    ...structureProblems(types),
    ...staleNotYetReadProblems(readManifest(root)),
    ...staleCaseNameProblems(types),
    ...staleRephrasedProblems(types),
  ];
}

function main() {
  const types = apiTypesOf();
  const problems = payloadProblems(types);
  if (problems.length) {
    console.error(`generate-api-types: ${problems.length} problem(s) in the pinned payload\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  const files = emitApi(types);
  for (const [target, body] of files) {
    const full = join(repoRoot, target);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  const lines = [...files.values()].reduce((count, body) => count + body.split('\n').length, 0);
  console.log(`generate-api-types: ${types.length} type(s) emitted into ${files.size} file(s), ${lines} line(s) in total`);
}

if (isMainModule(import.meta.url)) main();
