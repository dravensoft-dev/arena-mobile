# Security policy

## Reporting a vulnerability

**Use GitHub's private vulnerability reporting.** Open
<https://github.com/dravensoft-dev/arena-mobile/security/advisories/new> and describe what you
found. The report is visible to the maintainers and to you, and nothing about it is public
until an advisory is published.

**Do not open a public issue for a vulnerability**, and do not describe one in a pull request.
An issue is world-readable the moment it exists.

Expect an acknowledgement within a few working days. If a fix is warranted, it ships in a
release and the advisory names the versions it affects.

## What is in scope

- The generator and the gates under `scripts/`, including how the contract payload is fetched
  and verified.
- The emitted Kotlin and Swift, and the hand-authored theme layers beside them.
- The build and publish workflows under `.github/workflows/`.

## What is not

- **The contract payload itself.** `@dravensoft/arena-contracts` is published from
  [Arena](https://github.com/dravensoft-dev/arena), and a defect in what it carries goes to
  that repository's own policy.
- **A consumer's application.** This repository ships values and themes; how a product uses
  them is that product's.

## Supply chain

The contract payload arrives over HTTPS from the npm registry at the exact version
`repo.config.json` pins, and
`scripts/generate/contracts/fetch-contracts.ts:integrityProblems(expected, tarball)` verifies
it against the digest the registry publishes for that version before anything is extracted.
The extracted tree is then compared against its own catalogue in both directions, so a payload
that lost a file and one that gained a file both fail.

**A pinned version below the first OIDC-published release carries no provenance attestation**,
and [`DOUBTS.md`](./DOUBTS.md) states what that costs and the command that re-derives it.
