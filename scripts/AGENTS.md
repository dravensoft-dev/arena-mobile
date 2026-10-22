# scripts/

The tooling, sorted so the path answers two questions before the file is opened: **what
phase** the script belongs to, and **what it is allowed to know about**.

```
scripts/
  utils/      pure functions that name nothing of Arena: a directory walk, a JSON read
  lib/        shared modules, and every test that covers one, beside it
  generate/   brings the contract payload in, and emits source from it
  check/      the gates
  ci/         what a runner asks: what to run, and what the suite reported
  graph/      what decides whether a step runs at all
```

**There is no `build/` phase, and the absence is a decision rather than an omission.** Arena
has one because it compiles JSX, TypeScript and a CSS layer into artifacts it ships. Nothing
here compiles into one: `check:script-types` spawns a compiler and the compiler emits nothing,
because a typecheck is a judgement rather than a build, and the two things that produce an
artifact are Gradle and SwiftPM, both reading committed sources. `bun run build` is the verb a
contributor types and it runs the graph, not a directory.

`utils/` and `graph/` have an `AGENTS.md` and no domain directories.
[`scripts/utils/AGENTS.md`](./utils/AGENTS.md) says what makes a module a util rather than a library,
and [`scripts/graph/AGENTS.md`](./graph/AGENTS.md) says how a step subscribes.

## The four domains

`lib/` and the phases holding domain directories all hold the same four, and **all four exist
even when empty**: a `.gitkeep` marks a combination nothing occupies yet, so the shape stays
legible rather than implied.

| domain | what a script there is allowed to read and write |
| --- | --- |
| `contracts` | the payload under `.contracts/`, and the field of `repo.config.json` that names it. The field is in the domain although it lives at the root, because a pin separated from what it pins is a pin nobody compares |
| `compose` | the `compose/` layer |
| `swiftui` | the `swiftui/` layer |
| `arena` | two or more layers at once, or the repository root |

**The domain is decided by what a script TOUCHES, never by what it is about.**
`scripts/generate/arena/generate-tokens.ts` reads the contract payload and would look like
`contracts` from its subject, and it writes into both native layers, so it is `arena`.

**A library that touches nothing is placed by the vocabulary it speaks**, because most of
`lib/` is pure functions and the reads-and-writes test cannot separate them.
`scripts/lib/contracts/payload.ts` opens files under `.contracts/` and every name in it is a DTCG one,
so it is `contracts`; `scripts/lib/arena/bridge.ts` opens nothing at all and speaks Kotlin and Swift
at once, so it is `arena`. Never place a library by **who imports it**.

## Rules a script here holds to

**Never count `..` to find the repository root.** Import `repoRoot` from
`scripts/lib/arena/repo-root.ts`. A script deriving the root from its own location breaks on a move,
silently, because the wrong path still exists. That module is the one place that counts, which
is why moving *it* is the one move needing care.

**A library never imports a gate.** `lib/` is the bottom of the graph, and a gate reaching
down is the only direction allowed. Across domains the same holds in both directions, because
a domain is a statement about subject matter and not a visibility boundary.

**Never read a spawned child's output through a pipe.** Take it from
`scripts/lib/arena/child-output.ts:runCapturing(binary, args, cwd, timeoutMs)`, which reads it from a
file. A child that writes its results and then exits, which every compiler here does, exits
before the tail of stdout has drained, and `spawnSync` reports that short read as a whole one:
status 0, no error, output simply missing its last lines. The loss is a race, so it survives
local runs and lands in CI.

**No script assumes one operating system, and `check:portability` holds it.** Every rule is a
ban with a named owner, so the question is never whether a construct is correct but where it
may live:

- **`process.platform` belongs to `scripts/lib/arena/platform.ts`.** Everywhere else takes the answer
  as a parameter, which is what makes a branch written for macOS testable from Linux: the
  machine a contributor happens to own stops deciding which half of the tooling is covered.
- **A path that leaves this process goes through `toPosix`, a repo-relative one through
  `relPosix`, and one compared against another through `isInside`**, all three in
  `scripts/utils/posix-path.ts`. A string prefix is wrong in one of two directions: without a separator
  boundary it lets `/repo-evil` pass as `/repo`, and with a hardcoded `'/'` it refuses every
  nested path on Windows.
- **A binary is spawned by resolved path**, never a bare name.
  `scripts/lib/arena/host-binary.ts:findHostBinary(name, which, path)` is how one is found, and
  returning `null` is how a gate learns this host cannot run it.
- **Ordering that reaches a file is by code unit**, through `scripts/utils/compare.ts`.
  `localeCompare` puts `a` before `B` under en-US and after it by code unit, so an emitter
  writes two different files on two machines and the `git diff --exit-code` in every workflow
  calls the second one an emit out of step.
- **A gate that cannot run says so in one spelling.** `scripts/lib/arena/check-vars.ts:cannotRun`.
  Why one spelling rather than each gate's own is stated once on
  [`scripts/check/AGENTS.md`](./check/AGENTS.md).

**A wait's bound is a `deadline` and never a bare number**, declared in the file that owns the
wait. `scripts/lib/arena/deadline.ts` carries the argument, and `check:deadlines` holds it.

**Every script here answers to a compiler.** `scripts/tsconfig.check.json` is the project, it
carries no allowance and no relaxation, and `check:script-types` makes two claims about it: that
it compiles, and that its globs reach every `.ts` on disk under this directory. The second is
the one that goes wrong quietly, because a project whose globs match nothing compiles nothing
and reports clean. A capture read after a match goes through
`scripts/utils/captured.ts:captured(match, index)`, which fails at the read, rather than through
`?? ''`, which turns a pattern that lost its group into an empty string nobody ever sees.

**A file a script writes is named `<stem>.generated.<ext>`**, so the name says so and no
reader has to open it. Whether it is tracked is the separate question
[`../GENERATED.md`](../GENERATED.md) answers, and here the answer is that **everything the
emitter writes is tracked**, because a clone with no JS toolchain has to build both libraries.

**A script under `generate/` or `check/` does no work when it is imported.** The graph
collects a node by importing the script that declares it, so the work goes in `main()` behind
`scripts/utils/main-module.ts:isMainModule(url, argv)`.

**A test lives beside what it tests**, in the same directory, which for a `lib/` module means
the same domain and not merely somewhere under `lib/`.

**A file here may carry one header comment, at most ten lines.** Anything that will not fit
goes in the gate's own reason strings.

## Adding a gate

The checklist is [`scripts/check/AGENTS.md`](./check/AGENTS.md)'s and it is stated there only, since a
list of registrations copied into a second page is the copy that ends up one registration
short. What this level owns is why the grid exists: `check-all` asserts every gate names one
of the four domains, so a gate landing outside it fails rather than running unnoticed.

## Running them

`bun run check` runs every gate and then the suites, without stopping at the first failure, so
one sweep reports every problem rather than the first and a contributor's one command proves
what they read it as proving. `bun run test` runs the suites alone.

**A run narrowed by `--domain=` leaves the suites to the job that owns them**, and `--no-tests`
opts out of a full one. That is why the workflows need no edit: each job already narrows, and
the tooling job runs `bun run test` itself. An argument outside that set is a failure rather
than a shrug, because `--no-test` silently ignored is a flag that runs the tests it was typed
to skip.

**When it is expected: once, when a change is finished, and not before every commit.** The
individual gates are cheap and stay available per commit.

**Two gates need a toolchain this host may not have.** `check:kotlin` needs a JDK and
`check:swift` needs Xcode. Where the dependency is missing the gate exits 2 and is reported
`SKIP`, and the whole run reports INCOMPLETE. `CI=true` makes the run strict and turns each
skip into a failure, which is why a release is cut from a green CI run and not a local one.
