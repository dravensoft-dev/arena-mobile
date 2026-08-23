# scripts/check/

**A gate states one claim about the tree and fails when it stops being true.** They are
registered in `GATES` in `scripts/check/arena/check-all.ts`, which `bun run check` runs
unconditionally: one failure never stops the rest, so a full sweep reports every problem in
one pass rather than the first. That array is the count, and its suite asserts the number by
literal value; a figure written anywhere else would rot the next time a gate lands.

## The shape of a gate

Each is a `.ts` under `check/<domain>/`, with an npm script whose prefix names the phase
directory, and a sibling suite named for it, covering it. It exports its logic as pure functions
returning problem strings, and its private `main()` prints them and exits non-zero. That is
why a suite can assert on a gate's exception map by name without running the gate.

**A reason-carrying map is part of the gate, not documentation of it.** `UNMAPPED`,
`NOT_A_VALUE`, `SCOPES`, `EXEMPT`, `UNMARKED`, `UNTRACKED`, `SIZE_ALLOWANCE`, `DEPARTURES`,
`NEVER_SUBSCRIBES`, `NOT_YET_READ`, `CASE_NAMES`, `REPHRASED`, `OBLIGATIONS`, `BINDINGS`,
`COMPOSED`, `PAIRS`, `OWED`: each entry names a case and says why, as a string value rather than a
comment, and **a stale entry fails the gate itself**. That is what keeps an exception list from outliving the exception, and
it is why a debt lives beside its gate rather than in prose.

**A gate declares no `writes`, and `check:graph` fails one that does.** A gate that emits is
an artifact another gate can read, and a reader of a failed writer either runs against a stale
file or has to be stopped; either way a sweep stops reporting every problem in one pass, which
is the first thing this runner promises.

## A green run is only as good as what the gate looked at

**A gate that finds nothing reports zero violations either way**, and it does so behind a
plausible line of output. The shape is always one of two: **a lookup that cannot tell "absent"
from "not found"**, or **a path that narrows a run without narrowing what the run claims**.
Both have a remedy, and both are rules a new gate holds to:

- **Decide absence by walking the tree**, so "this layer does not carry it" and "this gate
  cannot find it" stop being the same value. `scripts/utils/walk-files.ts:walkFiles(dir, keep, base)`
  returns an empty array for a directory that is not there, which is exactly why every caller
  pairs it with the next rule.
- **Make a zero-result count an explicit failure** rather than a vacuous pass, as an exported
  pure function so the emptiness is a claim a suite can assert. Which gates carry one is a
  question for the tree and never for this page:

  ```bash
  grep -rl 'zero[A-Za-z]*Problem' scripts/check/*/check-*.ts | grep -v '\.test\.'
  ```

- **A declaration WIDER than the walk is the mirror defect.** A gate whose walk skips a
  directory excludes that directory in `reads`, or the declaration invents an edge over a tree
  the gate never visits. `scripts/check/arena/check-literals.ts` is the worked example: it skips every
  emitted file, so its `reads` carry the matching exclusions and no generator feeds it.
- **A gate has two existences, the file and every place that invokes it, and only the second
  is worth anything.** Adding a gate means adding it to `package.json` **and** to `GATES`.
  Citing a gate as evidence means confirming it is in `GATES` first.

When you write or move anything a gate resolves by path, the question is not "does it still
pass" but "how many things did it look at, and is that the number I expect". Every gate's pass
line names that number for exactly this reason.

## Exit 2 means SKIP, and a skip is never green

**A gate needing a toolchain this host may not carry declares it rather than assuming it.**
`check:kotlin` needs a JDK and `check:swift` needs Xcode, which installs on macOS alone. Where
the dependency is missing the gate calls
`scripts/lib/arena/check-vars.ts:cannotRun(gate, why, env)`, exits **2**, and `check-all`
marks it `SKIP` and reports the whole run **INCOMPLETE**.

**This repository declares itself NOT strict, which is where it parts company with Arena.**
Arena declares strict because every dependency it needs installs on every machine; here
`xcodebuild` does not, and a gate that is permanently red on a contributor's laptop stops
being read. `CI=true` makes a run strict with nothing to configure, so a missing toolchain is
a skip locally and a failure in a workflow, and the claim is only ever made where it can be.

**`cannotRun` is the one spelling of that decision.** A rule spelled once per gate is a rule
that holds for some of them: with each gate spelling its own answer, the same missing
dependency fails one and skips the next on identical settings.

## The four domains

**These counts are the one set in this repository written in prose and held by an assertion**,
so they are numbers rather than a command: `scripts/check/arena/check-all.test.ts` derives each
from `GATES` and fails this table when the two disagree.

| domain | gates | |
| --- | --- | --- |
| `contracts/` | 3 | the payload, and the field that pins it |
| `arena/` | 19 | two or more layers at once, or the repository root |
| `compose/` | 1 | the Compose layer |
| `swiftui/` | 1 | the SwiftUI layer |

**CI narrows a run by domain, never by gate name.** `check-all` takes `--domain=`, the jobs
partition `GATES`, and the suite asserts the partition, so a gate cannot join `GATES` and then
run in no job.

## Adding a gate

Put it in `check/<domain>/`, add it to `GATES` with its domain in the path, give it an npm
script, add a row to the count table above, and write the suite beside it. Then edit
`scripts/check/arena/check-all.test.ts`, which is a step rather than a consequence: it asserts
the gate list **by literal value**, so both the length and the array move in the same commit.

Two more are outside this file: **declare the node**, or name the gate in one of the two lists
in `scripts/graph/nodes.ts`, and then **edit the generator upstream of it**, because an edge is
declared downstream and a gate reading what a generator writes is named in that generator's
`feeds`. `scripts/graph/AGENTS.md` says how.

**A gate is finished when `scripts/check/arena/check-all.test.ts` and `check:graph` are both
green, and never when the paragraphs above read complete.**
