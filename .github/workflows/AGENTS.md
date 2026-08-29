# .github/workflows/

One guards a pull request, one guards `main`, one guards `develop`, one publishes the Maven
artifact and one writes a release page. `ls .github/workflows/*.yml` is what says how many; a
number no assertion holds is the defect that rule exists to stop.

```
pull_request -> main|develop   arena-mobile PR
push to develop                arena-mobile develop
push to main                   arena-mobile main
   |
   +-- on success              Publish arena-compose   asks the guard first
   +-- on success              Release notes           describes the tag this commit reaches
```

**There is no publish workflow for the Swift package, and the absence is the design.** SwiftPM
resolves a package from the repository at a git tag, so pushing the tag IS the Swift release.
Nothing has to run, which is also why `Package.swift` carries no version: there is no second
number for a workflow to stamp.

## Every job runs `build:release`, never `build`

Locally the build is free to keep what nothing has moved under. In a workflow that would be
the wrong kind of green: the step after it proves the emit idempotent with
`git diff --exit-code`, and a build that did nothing satisfies that by doing nothing.

## The fan-out, and why three jobs

```
build              bun run build:release, then git diff --exit-code
   |
   +-- test-tooling    ubuntu   the contracts and arena domains, and the suites
   +-- test-compose    ubuntu   the compose domain, on a JDK 21 toolchain
   +-- test-swiftui    macOS    the swiftui domain, which runs nowhere else
   |
pr-gate            the only required check, and it waits for every job above
```

**`test-swiftui` is on macOS because SwiftUI ships in the Apple SDKs alone**, and it is the
one place `check:swift` can make its claim at all. A macOS runner bills several times a Linux
one, which is the reason the partition is by domain: the expensive job runs one gate.

**`pr-gate` is the single required check.** A job skipped by an `if` reports success to branch
protection, so requiring `test-compose` directly would be satisfied by a run that never
started it. `pr-gate` runs with `always()` and reads `needs.*.result`, which no routing
decision can skip. It is green when every result is `success` or `skipped`, and red on
`failure` or `cancelled`. Being the single required check makes its `needs` list the whole
gate, so a job added to this file and not to that list runs and is not required.

## Strictness is automatic

GitHub sets `CI=true`, which `scripts/lib/arena/check-vars.ts:isStrict(env)` reads, so a gate
whose toolchain is missing fails instead of skipping. There is nothing to configure and
nothing to remember: a runner without a JDK is a red run rather than an INCOMPLETE one, which
is the whole reason this repository declares itself not strict everywhere else.

## The guard, and its two questions

`scripts/ci/arena/publish-guard.ts:decide(version, published, movedPaths)` asks them in order.
Is the version in `repo.config.json` already on Maven Central? Then there is nothing to do,
which is almost every push. Otherwise, has anything the artifact carries moved since the tag
of the version that **is** published?

**The baseline is that tag rather than the previous commit**, and that matters: the artifact
can change in one commit and the bump land in another, so asking only about this push would
mean the change is never published at all. What the artifact carries is `PACKAGE_INPUTS` in
that file, beside the guard that reads it.

**An empty list of paths stops the run.** `git` reads no pathspec as every path, so a guard
whose own query died would answer "everything moved" and republish a tree nothing touched.
`movedSince` throws rather than returning an empty answer for that reason.

**Whatever it answers, the guard writes that answer to the run summary**: the version on the
registry, the version in this tree, the decision, and the reason for it. The common answer is
that there is nothing to publish, and an answer readable only by opening a log is one nobody
reads.

## The bootstrap gap

**Each publish is dispatchable by hand, and that path exists because the automatic one has a
gap nothing in this repository can close.** `workflow_run` reaches only a workflow already
registered on the default branch, so the push that first puts one there cannot dispatch it,
and re-running that push replays the original event rather than asking the question again. A
release whose event is missed that way has no other way through.

A manual run is safe for the same reason an automatic one is: the guard and
`scripts/check/arena/check-release.ts` both run, so the answer to "is there anything to
publish" is reached identically whoever asked.

**The first publish also needs three moves no script can make**, and `versioning_steps.md`
carries them: the Central Portal account, the DNS-verified namespace, and the GPG key in the
repository secrets.

## What reads this directory

`check:docs` reads every `.md` here and holds it to the size limit and the punctuation rule,
the same as anywhere else in the tree. `check:workflow` reads the `.yml`: every `bun run` name
a job types is a script `package.json` declares, every script it runs by path is in the tree,
every `--domain=` names a domain, and every job declared here sits in the `needs` of this
workflow's gate job, which is the sentence above held rather than written down.
