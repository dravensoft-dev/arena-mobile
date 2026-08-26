/* Writes the six token sources both native builds compile, driven by the payload catalogue
 * rather than by a directory walk. Everything it writes is TRACKED, which is the opposite of
 * what Arena does with its own emit: the property this repository holds is that a clone with
 * no JS toolchain at all builds both libraries, and that is only true while these files stay
 * committed. GENERATED.md carries the rest of that argument. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { CONTRACTS_DIR, DENSITIES, loadTokens, readManifest, resolveAliases, THEMES, type Token } from '../../lib/contracts/payload.ts';
import { staleUnmappedProblems, type Emitted } from '../../lib/arena/bridge.ts';
import { dirFor } from '../../lib/arena/layer-trees.ts';
import {
  banner, densityTokens, docTextFor, kdoc, scaleTokens, shapeProblems, staleRephrasedProblems,
  themeTokens, tripleSlash,
} from '../../lib/arena/emit.ts';

export const KOTLIN_DIR = dirFor('compose', 'tokens');
export const SWIFT_DIR = dirFor('swiftui', 'tokens');
export const KOTLIN_PACKAGE = 'org.dravensoft.arena.tokens';

export const TARGETS = [
  `${KOTLIN_DIR}/ArenaTokens.generated.kt`,
  `${KOTLIN_DIR}/ArenaColors.generated.kt`,
  `${KOTLIN_DIR}/ArenaDensity.generated.kt`,
  `${SWIFT_DIR}/ArenaTokens.generated.swift`,
  `${SWIFT_DIR}/ArenaColors.generated.swift`,
  `${SWIFT_DIR}/ArenaDensity.generated.swift`,
] as const;

export const node = {
  name: 'generate:tokens',
  reads: [`${CONTRACTS_DIR}/arena.contracts.json`, `${CONTRACTS_DIR}/contracts/design/**`],
  writes: [...TARGETS],
  feeds: ['check:emit', 'check:coverage', 'check:collisions', 'check:doc-comments', 'check:generated', 'check:structure', 'check:kotlin', 'check:swift'],
};

const KOTLIN_IMPORTS = new Map([
  ['Color', 'androidx.compose.ui.graphics.Color'],
  ['FontWeight', 'androidx.compose.ui.text.font.FontWeight'],
  ['Dp', 'androidx.compose.ui.unit.Dp'],
  ['TextUnit', 'androidx.compose.ui.unit.TextUnit'],
]);

const KOTLIN_UNIT_IMPORTS = new Map([
  ['.dp', 'androidx.compose.ui.unit.dp'],
  ['.sp', 'androidx.compose.ui.unit.sp'],
  ['.em', 'androidx.compose.ui.unit.em'],
]);

function kotlinHeader(fields: Emitted[], extra: string[] = []) {
  const needed = new Set(extra);
  for (const field of fields) {
    const own = KOTLIN_IMPORTS.get(field.kotlinType);
    if (own) needed.add(own);
    for (const [suffix, path] of KOTLIN_UNIT_IMPORTS) {
      if (field.kotlinLiteral.includes(suffix)) needed.add(path);
    }
  }
  const imports = [...needed].sort();
  return [banner('/*'), '', `package ${KOTLIN_PACKAGE}`, '', ...imports.map((one) => `import ${one}`), ''].join('\n');
}

function kotlinObject(fields: Emitted[]) {
  const body = fields.flatMap((field) => [
    ...kdoc(docTextFor(field.token.name, field.token.description), '    '),
    `    public val ${field.identifier}: ${field.kotlinType} = ${field.kotlinLiteral}`,
  ]);
  return [kotlinHeader(fields), 'public object ArenaTokens {', ...body, '}', ''].join('\n');
}

function kotlinRecord(name: string, fields: Emitted[], instances: { name: string; fields: Emitted[] }[]) {
  const members = fields.flatMap((field, index) => [
    ...kdoc(docTextFor(field.token.name, field.token.description), '    '),
    `    public val ${field.identifier}: ${field.kotlinType}${index === fields.length - 1 ? '' : ','}`,
  ]);
  const bodies = instances.flatMap((instance) => [
    '',
    `public val ${instance.name}: ${name} = ${name}(`,
    ...instance.fields.map((field) => `    ${field.identifier} = ${field.kotlinLiteral},`),
    ')',
  ]);
  return [
    kotlinHeader(fields, ['androidx.compose.runtime.Immutable']),
    '@Immutable',
    `public data class ${name}(`,
    ...members,
    ')',
    ...bodies,
    '',
  ].join('\n');
}

function swiftHeader() {
  return [banner('//'), '', 'import Foundation', 'import SwiftUI', ''].join('\n');
}

function swiftEnum(fields: Emitted[]) {
  const body = fields.flatMap((field) => [
    ...tripleSlash(docTextFor(field.token.name, field.token.description), '    '),
    `    public static let ${field.identifier}: ${field.swiftType} = ${field.swiftLiteral}`,
  ]);
  return [swiftHeader(), 'public enum ArenaTokens {', ...body, '}', ''].join('\n');
}

function swiftRecord(name: string, fields: Emitted[], instances: { name: string; fields: Emitted[] }[]) {
  const members = fields.flatMap((field) => [
    ...tripleSlash(docTextFor(field.token.name, field.token.description), '    '),
    `    public let ${field.identifier}: ${field.swiftType}`,
  ]);
  const parameters = fields.map((field, index) => `        ${field.identifier}: ${field.swiftType}${index === fields.length - 1 ? '' : ','}`);
  const assignments = fields.map((field) => `        self.${field.identifier} = ${field.identifier}`);
  const bodies = instances.flatMap((instance) => [
    `    public static let ${instance.name} = ${name}(`,
    ...instance.fields.map((field, index) => `        ${field.identifier}: ${field.swiftLiteral}${index === instance.fields.length - 1 ? '' : ','}`),
    '    )',
    '',
  ]);
  return [
    swiftHeader(),
    `public struct ${name}: Sendable {`,
    ...members,
    '',
    '    public init(',
    ...parameters,
    '    ) {',
    ...assignments,
    '    }',
    '}',
    '',
    `extension ${name} {`,
    ...bodies.slice(0, -1),
    '}',
    '',
  ].join('\n');
}

export function emitAll(tokens: Token[]) {
  const scales = scaleTokens(tokens);
  const themes = THEMES.map((theme) => ({ name: theme, fields: themeTokens(tokens, theme) }));
  const densities = DENSITIES.map((density) => ({ name: density, fields: densityTokens(tokens, density) }));
  const [firstTheme] = themes;
  const [firstDensity] = densities;
  if (!firstTheme || !firstDensity) {
    throw new Error('emitAll: THEMES and DENSITIES each name at least one entry, and the record '
      + 'the emit builds takes its field list from the first of them');
  }
  const files = new Map<string, string>();
  files.set(TARGETS[0], kotlinObject(scales));
  files.set(TARGETS[1], kotlinRecord('ArenaColorScheme', firstTheme.fields, themes.map((one) => ({
    name: `Arena${one.name.charAt(0).toUpperCase()}${one.name.slice(1)}Colors`,
    fields: one.fields,
  }))));
  files.set(TARGETS[2], kotlinRecord('ArenaDensityScale', firstDensity.fields, densities.map((one) => ({
    name: `Arena${one.name.charAt(0).toUpperCase()}${one.name.slice(1)}Density`,
    fields: one.fields,
  }))));
  files.set(TARGETS[3], swiftEnum(scales));
  files.set(TARGETS[4], swiftRecord('ArenaColorScheme', firstTheme.fields, themes));
  files.set(TARGETS[5], swiftRecord('ArenaDensityScale', firstDensity.fields, densities));
  return files;
}

export function tokensOf(root = repoRoot) {
  const manifest = readManifest(root);
  const { resolved, errs } = resolveAliases(loadTokens(root, manifest));
  if (errs.length) {
    throw new Error(`${errs.length} alias problem(s) in the pinned payload:\n  ${errs.join('\n  ')}`);
  }
  return resolved;
}

function main() {
  const tokens = tokensOf();
  const problems = [...shapeProblems(tokens), ...staleUnmappedProblems(tokens), ...staleRephrasedProblems(tokens)];
  if (problems.length) {
    console.error(`generate-tokens: ${problems.length} problem(s) in the pinned payload\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  const files = emitAll(tokens);
  for (const [target, body] of files) {
    const full = join(repoRoot, target);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  const values = [...files.values()].reduce((count, body) => count + body.split('\n').length, 0);
  console.log(`generate-tokens: ${tokens.length} token(s) emitted into ${files.size} file(s), ${values} line(s) in total`);
}

if (isMainModule(import.meta.url)) main();
