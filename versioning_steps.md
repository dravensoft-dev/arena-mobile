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

A package publishing to Maven Central for the first time needs four moves made by hand, in
this order, and none of them is a script.

**The namespace.** An account on **central.sonatype.com**, then *View Namespaces* and
*Add Namespace* for `org.dravensoft`. The portal shows a verification key, and it goes into a
`TXT` record on the apex of `dravensoft.org`, which is the exact domain the namespace inverts
to. Nothing that serves a subdomain is touched, and an existing `TXT` there is not replaced:
several records with one name coexist and each verifier reads its own. Wait until
`dig +short TXT dravensoft.org` returns it before pressing *Verify Namespace*, because
verifying early caches the `NXDOMAIN` and the wait becomes the record's own time to live.

**The token.** *View Account*, then *Generate User Token*. The portal presents it as a Maven
`settings.xml` fragment and no such file exists here, because this repository publishes from
Gradle: what the fragment carries is the pair the next step wants.

**The key.** `gpg --full-generate-key`, RSA and RSA, 4096 bits, then the public half to a
keyserver. **Send it over `hkps`**, as `gpg --keyserver hkps://keyserver.ubuntu.com
--send-keys <fingerprint>`: the default is `hkp` on port 11371, which is commonly filtered,
and a send that never arrives reports nothing. Central accepts `keyserver.ubuntu.com`,
`keys.openpgp.org` and `pgp.mit.edu`, and the first is the one worth reaching, because
`keys.openpgp.org` withholds a key's identity until its address is verified and serves it with
no user id until then. Read back what a keyserver actually holds over HTTPS rather than with
`--recv-keys`, whose one error message covers both "it is not there" and "I could not reach
it":

```bash
curl -s "https://keyserver.ubuntu.com/pks/lookup?op=get&options=mr&search=0x<fingerprint>" \
  | gpg --show-keys
```

**The secrets.** Four, by the names `.github/workflows/maven-publish.yml` maps to the Gradle
properties the publish plugin reads:

| secret | what it holds |
|---|---|
| `CENTRAL_TOKEN_USERNAME` | the `username` from the portal's fragment |
| `CENTRAL_TOKEN_PASSWORD` | the `password` from it, which is shown once |
| `SIGNING_KEY` | `gpg --export-secret-keys --armor <fingerprint>`, with its header and footer lines |
| `SIGNING_PASSWORD` | the key's passphrase |

Shred the exported key afterwards. The copy that matters is in the keyring, and an export left
in a temporary directory is a private signing key any local account can read.

## 5. What the first release does not need

**A manual dispatch, unless the event is missed.** Every publish workflow is dispatchable by
hand, and `.github/workflows/AGENTS.md` says why that path has to exist: `workflow_run`
reaches only a workflow already registered on the default branch. What that does NOT mean is
that the first release always needs it. A push that lands the workflows on the default branch
and fires the guarded run in one go is answered normally, because the files are registered
before that run completes. Reach for `gh workflow run` when the run finished and nothing
followed it, not before.

**Anything at all for Swift.** SwiftPM resolves a package from the repository at a git tag, so
the tag pushed in step 3 is the whole of that release. There is no registry, no account and no
signature, and `Package.swift` carries no version for the same reason.

**A click, if you want none.** The deployment lands in the portal as `USER_MANAGED` and waits,
because `compose/build.gradle.kts` passes `automaticRelease = false`. Review it under
*Deployments* and press *Publish*; it reaches `repo1.maven.org` within the hour and the search
index later. Pass `automaticRelease = true` to give that up.
