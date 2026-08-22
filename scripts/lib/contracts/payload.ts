/* The payload's own vocabulary, and the three inheritances DTCG does not define for you.
 * $type is declared on a group and a leaf overrides it; userScale is Arena's own extension
 * and inherits the same way, which 2025.10 admits in section 6.3.2 without defining; and an
 * alias resolves against the MERGED tree rather than its own file, because chart.json
 * references {sp.2} and sp lives in spacing.json. Reading any of the three the other way
 * produces a tree that parses and is wrong. */

import { join } from 'node:path';
import { readJson } from '../../utils/read-json.ts';
import { byCodeUnit } from '../../utils/compare.ts';

export const PACKAGE_NAME = '@dravensoft/arena-contracts';
export const CONTRACTS_DIR = '.contracts';
export const MANIFEST = 'arena.contracts.json';
export const DESIGN_PREFIX = 'contracts/design/';
export const VENDOR = 'com.dravensoft.arena';

export type ContractManifest = { name: string; version: string; contracts: string[] };

export const THEMES = ['dark', 'light'] as const;
export const DENSITIES = ['base', 'compact', 'comfortable'] as const;
export type Theme = (typeof THEMES)[number];
export type Density = (typeof DENSITIES)[number];
export type Scope = 'base' | Theme | Exclude<Density, 'base'>;

export const SCOPES = new Map<string, Scope>([
  [`${DESIGN_PREFIX}palette.dark.json`, 'dark'],
  [`${DESIGN_PREFIX}palette.light.json`, 'light'],
  [`${DESIGN_PREFIX}density.compact.json`, 'compact'],
  [`${DESIGN_PREFIX}density.comfortable.json`, 'comfortable'],
]);

export function scopeOf(file: string): Scope {
  return SCOPES.get(file) ?? 'base';
}

export const USER_SCALE_AXES = ['scales', 'follows', 'fixed'] as const;
export type UserScale = (typeof USER_SCALE_AXES)[number];

export const NOT_A_VALUE = new Map<string, string>([
  [
    `${DESIGN_PREFIX}roles.json`,
    'every entry in it is a $type and a $description with no $value: these are the questions a style '
    + 'plugin answers, not values, and a target that emits them emits a name bound to nothing. The '
    + 'style plugin tier is web in mechanism and this milestone ships no native answer to it',
  ],
]);

export type Token = {
  path: string[];
  name: string;
  file: string;
  scope: Scope;
  type: string;
  value: unknown;
  description?: string;
  userScale?: UserScale;
  script?: boolean;
  cssUnit?: string;
  values?: string[];
  weights?: [number, number];
};

type Node = Record<string, unknown>;

function extensions(node: Node) {
  const all = node.$extensions as Record<string, Node> | undefined;
  return all?.[VENDOR] ?? {};
}

export function manifestPath(root: string) {
  return join(root, CONTRACTS_DIR, MANIFEST);
}

export function readManifest(root: string) {
  return readJson<ContractManifest>(manifestPath(root));
}

export function designSources(manifest: ContractManifest) {
  return manifest.contracts
    .filter((path) => path.startsWith(DESIGN_PREFIX))
    .sort(byCodeUnit);
}

export function valueSources(manifest: ContractManifest) {
  return designSources(manifest).filter((path) => !NOT_A_VALUE.has(path));
}

export function staleNotAValueProblems(manifest: ContractManifest) {
  const carried = new Set(designSources(manifest));
  return [...NOT_A_VALUE].flatMap(([path, why]) => (carried.has(path)
    ? []
    : [`NOT_A_VALUE excludes ${path}, and the payload does not carry it. An exclusion covering `
      + `nothing excludes nothing: ${why}`]));
}

export function collect(node: Node, trail: string[], file: string, inherited: Partial<Token>, into: Token[]) {
  const own = extensions(node);
  const context: Partial<Token> = {
    type: (node.$type as string) ?? inherited.type,
    userScale: (own.userScale as UserScale) ?? inherited.userScale,
  };
  if ('$value' in node) {
    into.push({
      path: trail,
      name: trail.join('.'),
      file,
      scope: scopeOf(file),
      type: context.type ?? 'unknown',
      value: node.$value,
      description: node.$description as string | undefined,
      userScale: context.userScale,
      script: own.script === true ? true : undefined,
      cssUnit: own.cssUnit as string | undefined,
      values: own.values as string[] | undefined,
      weights: own.weights as [number, number] | undefined,
    });
    return into;
  }
  for (const key of Object.keys(node).sort(byCodeUnit)) {
    if (key.startsWith('$')) continue;
    const child = node[key];
    if (typeof child !== 'object' || child === null || Array.isArray(child)) continue;
    collect(child as Node, [...trail, key], file, context, into);
  }
  return into;
}

export function loadTokens(root: string, manifest = readManifest(root)) {
  const tokens: Token[] = [];
  for (const source of valueSources(manifest)) {
    const tree = readJson<Node>(join(root, CONTRACTS_DIR, source));
    collect(tree, [], source, {}, tokens);
  }
  return tokens.sort((a, b) => byCodeUnit(a.name, b.name));
}

const ALIAS = /^\{([^}]+)\}$/;

export function aliasTarget(value: unknown) {
  if (typeof value !== 'string') return null;
  const match = ALIAS.exec(value.trim());
  return match ? match[1] : null;
}

export function resolveAliases(tokens: Token[]) {
  const byName = new Map(tokens.map((token) => [token.name, token]));
  const errs: string[] = [];
  const resolveOne = (token: Token, seen: string[]): unknown => {
    const target = aliasTarget(token.value);
    if (target === null) return token.value;
    if (seen.includes(target)) {
      errs.push(`${token.name} resolves through ${[...seen, target].join(' -> ')}, which is a cycle`);
      return token.value;
    }
    const next = byName.get(target);
    if (!next) {
      errs.push(`${token.name} aliases {${target}}, which the merged design tree does not declare`);
      return token.value;
    }
    return resolveOne(next, [...seen, target]);
  };
  const resolved = tokens.map((token) => ({ ...token, value: resolveOne(token, [token.name]) }));
  return { resolved, errs };
}

export function dimensions(tokens: Token[]) {
  return tokens.filter((token) => token.type === 'dimension');
}

export function inScope(tokens: Token[], scope: Scope) {
  return tokens.filter((token) => token.scope === scope);
}

export function staleScopeProblems(manifest: ContractManifest) {
  const carried = new Set(designSources(manifest));
  return [...SCOPES].flatMap(([file, scope]) => (carried.has(file)
    ? []
    : [`SCOPES binds ${file} to the ${scope} scope, and the payload does not carry it. A scope `
      + 'nothing occupies is a theme or a density this emit silently stops carrying']));
}
