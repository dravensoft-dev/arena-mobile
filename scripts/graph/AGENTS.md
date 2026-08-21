# scripts/graph/

**What decides whether a step runs, and in what order.** Flat, with no domain directories,
because a graph module speaks every domain at once: what a node reads is the contract payload,
both native layers and the repository root together, so its domain would be `arena` throughout
and the directory would say nothing.

| module | answers |
| --- | --- |
| `scripts/graph/pathspecs.ts` | `matchesSpec(spec, path)`, `coversPath(specs, path)`, `overlap(one, other)`, `meetsReads(written, reads)`, `specsMeet(writes, reads)` |
| `scripts/graph/nodes.ts` | the set itself: `collectedScripts(root)` walks the phases that declare steps and `allNodes(root)` imports each and keeps what exports a node. `NEVER_SUBSCRIBES` and `NOT_YET_SUBSCRIBED` say what is out |
| `scripts/graph/graph.ts` | the algebra over the declared set: `needsOf(nodes)`, `subscriptionProblems(nodes)`, `duplicateWriters(nodes)`, `topoOrder(nodes)`. Resolution is handed in, so it holds no table and imports no script |
| `scripts/graph/run-build.ts` | the build, in the order the graph derives |

## A script subscribes by editing itself

```ts
export const node = {
  name: 'generate:tokens',
  reads: [`${CONTRACTS_DIR}/arena.contracts.json`, `${CONTRACTS_DIR}/contracts/design/**`],
  writes: TARGETS,
  feeds: ['check:emit', 'check:coverage', 'check:collisions'],
};
```

`name` is the npm script, `reads` are the source pathspecs, `writes` are the artifacts, and
`feeds` are the nodes that consume them. **Edges are declared downstream.** Everything reading
the other direction goes through `scripts/graph/graph.ts:needsOf(nodes)`, so a node is added by
editing one file.

**The declaration reuses the constants the script already has**, which is the whole reason it
lives in the script and not in a table: a target list written twice drifts the first time one
of them gains an entry. It is also why `allNodes` imports rather than reading the text, and
why a script under a collected phase does no work when it is imported.

`check:graph` joins the two halves. If B's `reads` meet A's `writes`, A lists B in `feeds`, and
nothing else does. A `feeds` entry no artifact carries fails as well: an edge nobody maintains
is the same defect read backwards.

**A spec opening with a bang excludes**, which is how a node claims a directory of authored
sources without claiming the emitted files beside them. **An exclusion counts when a meet is
decided**, and it has to: a gate that skips a directory and does not exclude it declares an
edge over a tree it never visits, and nothing else would ever report that.

**Both sides of a meet may be globs**, so `overlap` compares each spec against the other's
literal prefix rather than treating one of them as a path. A write that names a whole payload,
as `generate:contracts` does, is a glob on the producing side.

## What is out, and why

Two lists say so, both keyed by path, both carrying a reason per entry, and `check:graph`
fails an entry naming a file that is not there.

`NEVER_SUBSCRIBES` holds the runner, the release gate and `check:graph` itself. The last of
those is the one worth understanding: collecting it would have it import itself while its own
`main` is running, and a top-level await on a module already being evaluated never resolves,
so the gate hangs rather than failing. **Nothing in that list is imported at all.**

`NOT_YET_SUBSCRIBED` is **empty**, and it stays that way. Adoption is safe in the sense that a
step arriving without a node cannot go quietly green, and never in the sense that a step is
allowed to arrive without one.

## What this level does not carry yet

**There is no fingerprint cache, and its absence is a decision rather than an omission.**
Arena keeps a stamp per node so a gate whose inputs have not moved is reported CACHED, which
is worth having when a sweep opens a browser and compares pages pixel for pixel. Every step
here is a JSON read and a string comparison, and the two expensive ones spawn a compiler that
keeps its own build cache already. A cache would add a second source of truth about whether a
step ran, in exchange for nothing measurable, so `bun run build --force` is accepted and
changes nothing.

**A failure stops the build.** `scripts/graph/run-build.ts` runs the generators in topological
order and exits on the first non-zero status, because every step after a failed generator reads
what that generator did not write. Gates are the opposite and never stop each other, which is
what `scripts/check/AGENTS.md` means by one sweep reporting every problem.
