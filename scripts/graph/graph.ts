/* The algebra over the declared set, holding no table and importing no script. Edges are
 * declared downstream only: a producer names what it feeds, and everything reading the other
 * direction goes through needsOf, so a step is added by editing one file. */

import { byCodeUnit } from '../utils/compare.ts';
import { specsMeet } from './pathspecs.ts';
import type { Node } from './nodes.ts';

export function needsOf(nodes: readonly Node[]) {
  const needs = new Map<string, Set<string>>(nodes.map((node) => [node.name, new Set<string>()]));
  for (const node of nodes) {
    for (const fed of node.feeds) needs.get(fed)?.add(node.name);
  }
  return needs;
}

export function subscriptionProblems(nodes: readonly Node[]) {
  const errs: string[] = [];
  const byName = new Map(nodes.map((node) => [node.name, node]));
  for (const producer of nodes) {
    for (const consumer of nodes) {
      if (producer.name === consumer.name) continue;
      const meets = specsMeet(producer.writes, consumer.reads);
      const declared = producer.feeds.includes(consumer.name);
      if (meets && !declared) {
        errs.push(`${consumer.name} reads what ${producer.name} writes, and ${producer.name} does not list it in feeds`);
      }
      if (!meets && declared) {
        errs.push(`${producer.name} lists ${consumer.name} in feeds, and nothing it writes meets what ${consumer.name} reads`);
      }
    }
    for (const fed of producer.feeds) {
      if (!byName.has(fed)) errs.push(`${producer.name} feeds ${fed}, which no script declares`);
      if (fed === producer.name) errs.push(`${producer.name} feeds itself`);
    }
    if (producer.name.startsWith('check:') && producer.writes.length > 0) {
      errs.push(`${producer.name} is a gate and declares writes. A gate that emits is an artifact another gate reads, and a sweep then stops reporting every problem in one pass`);
    }
  }
  return errs.sort(byCodeUnit);
}

export function duplicateWriters(nodes: readonly Node[]) {
  const owners = new Map<string, string[]>();
  for (const node of nodes) {
    for (const written of node.writes) owners.set(written, [...(owners.get(written) ?? []), node.name]);
  }
  return [...owners]
    .filter(([, who]) => who.length > 1)
    .map(([path, who]) => `${path} is written by ${who.sort(byCodeUnit).join(' and ')}, so the order decides what it holds`)
    .sort(byCodeUnit);
}

export function topoOrder(nodes: readonly Node[]) {
  const needs = needsOf(nodes);
  const done = new Set<string>();
  const order: Node[] = [];
  let moved = true;
  while (moved) {
    moved = false;
    for (const node of nodes) {
      if (done.has(node.name)) continue;
      if ([...(needs.get(node.name) ?? [])].some((one) => !done.has(one))) continue;
      done.add(node.name);
      order.push(node);
      moved = true;
    }
  }
  const unresolved = nodes.filter((node) => !done.has(node.name)).map((node) => node.name).sort(byCodeUnit);
  return { order, unresolved };
}
