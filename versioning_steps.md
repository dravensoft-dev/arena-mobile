# A release, in order

The order the moves are made in. Every step below is a step because skipping it fails
something or, worse, fails nothing.

## 1. Change the version everywhere it is stated

**This comes first, before any build**: the Gradle artifact is stamped from
[`repo.config.json`](./repo.config.json), so a build that runs before the bump packs the OLD
version and `check:release` reports the difference in the next step.

The version is stated in three places and no more, which is itself the design: Gradle reads
`repo.config.json` in `settings.gradle.kts` rather than holding a copy, and `Package.swift`
carries no version at all because SwiftPM reads the tag.

| Where | What to change |
|---|---|
| `repo.config.json` | the `version` member, which is the authority every other surface is compared against |
| `README.md` | the `- **arena-mobile**: x.y.z` line under the `## Latest project artifacts` heading |
| the git tag | `vx.y.z`, in step 3 |

`scripts/check/arena/check-release.ts` finds the README pair by exact regex, so the heading
and the label are the parts that must not be reworded.

**`arena-contracts-version` is a different number and moves for a different reason.** It is
the contract set the emit is generated from, and raising it is a change to what this
repository ships rather than to how it is numbered. Arena and arena-mobile carry independent
version lines, and neither is derived from the other.

## 2. Rebuild and prove it

```bash
bun run build:release
bun run check
```

`build:release` forces every step and asserts a full run, so a build that kept a cached
answer fails on its own account rather than satisfying the next step by doing nothing.

**A release is the one run where a wrong declaration has to surface**, because it is the run
nothing downstream re-checks. Expect `check:swift` to report SKIP unless you are on macOS, and
expect the summary to read INCOMPLETE when it does. A release is cut from a green CI run and
not from a local one.

## 3. Tag it, and land it on `main`

```bash
git tag -a vx.y.z -m "arena-mobile vx.y.z"
bun scripts/check/arena/check-release.ts
git push origin main --follow-tags
```

`scripts/check/arena/check-release.ts` is run by path and has no npm script on purpose: between releases the tag
for the current version does not exist yet, so adding it to `GATES` would redden every push
that is not a release. Before the tag it reports every other check PASS and `tag exists` FAIL
with the `git tag -a` line; after it, every check PASS.

**You never run a publish command.** The Maven artifact is published by CI from a run of the
workflow that fires on a push to `main`, so a release where the artifact moved and nobody
published is the release working.

**The branch is not incidental.** A tag pushed to any other branch is verified by nothing
downstream and publishes nothing, and no step in CI reports the omission: the release simply
does not happen.

**SwiftPM needs nothing beyond the tag.** A Swift package is resolved from the repository at
a git tag, so pushing the tag IS the Swift release. That is also why `Package.swift` carries
no version: there is no second number to keep in step, and `check:release` is what stops the
tag and `repo.config.json` from disagreeing.

## 4. The bootstrap, which nothing here can take for you

A package publishing to Maven Central for the first time needs three moves made by hand, and
none of them is a script:

1. An account on **central.sonatype.com**, and the `org.dravensoft` namespace verified with a
   TXT record on `dravensoft.org`.
2. A **GPG** key: generated, its public half on a keyserver, its private half and passphrase
   in the repository secrets beside the Central token.
3. **The first publish dispatched by hand.** `workflow_run` reaches only a workflow already
   registered on the default branch, so the push that first puts one there cannot dispatch it,
   and re-running that push replays the original event rather than asking the question again.

[`.github/workflows/AGENTS.md`](./.github/workflows/AGENTS.md) states the gap and what the
guard asks once it is closed.
