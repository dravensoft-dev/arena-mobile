# Contributing to arena-mobile

arena-mobile takes external pull requests. What follows is which changes go straight to one,
which start somewhere else, and what a change is not allowed to break.

## Where a change belongs

**A value belongs to Arena, not here.** A colour, a spacing step, a duration, a delay: all of
them are decided in the contract set this repository consumes. A pull request editing an
emitted Kotlin or Swift file is a pull request against a file the next emit rewrites. Open the
change upstream in [Arena](https://github.com/dravensoft-dev/arena); when it ships, raising
`arena-contracts-version` in `repo.config.json` here is the whole of the follow-up.

**A translation belongs here.** How a contract value becomes a native one, what unit an axis
obliges, how a theme or a density is provided, what a platform cannot express: those are this
repository's, and `scripts/lib/arena/bridge.ts` is where most of them are decided.

**A gate belongs here.** [`scripts/check/AGENTS.md`](./scripts/check/AGENTS.md) is the
checklist, and it is stated there only.

## What a change may not break

- **The two layers are peers and neither is the other's authority.** A fact recorded only as
  matching the other layer is a fact missing from a contract. Where Compose and SwiftUI
  differ, both answers are stated, each in its own layer's `AGENTS.md`.
- **A clone with no JS toolchain builds both libraries.** Every emitted file stays committed,
  and no native build gains a step that runs a script. [`GENERATED.md`](./GENERATED.md) has
  the argument.
- **A gate that finds nothing fails.** A change that narrows what a gate walks narrows what it
  claims, and both move together or neither does.
- **No value is expressed twice.** A number in a hand-authored native source is a copy of a
  token that stops moving when the token moves, and `check:literals` refuses it.
- **The tooling answers to a compiler.** `scripts/tsconfig.check.json` carries no allowance,
  and `check:script-types` asks both whether the project compiles and whether its globs reach
  every script on disk. A `?? ''` or a non-null `!` added to quiet it converts the question
  into a value nobody sees, and `scripts/utils/captured.ts` is what a capture read goes
  through instead.

## Before you open one

```bash
bun install
bun run build
bun run check
```

`check:kotlin` and `check:swift` report SKIP unless the host carries a JDK and Xcode, and the
run reports INCOMPLETE when they do. That is expected locally and is a failure in CI, where
`CI=true` makes the run strict. Compilation is proved by the pull request workflow on a Linux
runner and a macOS one, so a change that only compiles on your machine is caught there rather
than after merge.

## Commit and review

- English only, in code, comments, documents and commit messages.
- A commit message containing a backtick is written with a quoted here-doc, never with
  `git commit -m "…"`.
- A document cites code as `path/to/file:member(parameters)` and never by line number.
- History is never rewritten. A published tag is a promise about the tree it resolves to, and
  SwiftPM resolves a package from a tag directly.
