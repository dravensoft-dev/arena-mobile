# What counts as a debt here, and where it goes

**A debt is paid, or made loud, before it is written down.**

This file is not a ledger. arena-mobile keeps no prose register of defects: what is actionable
is paid, and what is a standing limit or a settled decision lives in a place that fails when
it stops being true. What this page holds is the definition of a debt, and where the records
live.

## What counts

Something that is **wrong, incomplete, or unverified**, and that a reader would otherwise have
to rediscover. Three tests separate one from an ordinary imperfection:

1. **It is a claim about the tree**, not a preference. "SwiftUI has no shadow spread, so the
   inset ring the negative value pulls back is not drawn" is a debt; "this emitter could be
   shorter" is not.
2. **It survives the person who found it.** If reading the code answers it, the code is the
   record and there is nothing to file.
3. **It costs something specific**, and the cost is stated. A limit with no consequence is a
   fact, and a fact belongs in the normative document that describes the thing.

A **decision** is the other admissible shape: an option that was weighed and refused, recorded
so the next reader does not re-propose it. A decision without its reason is worthless, because
the reason is the whole entry.

## Where it goes, in order of preference

**Prefer any of these to a paragraph.** Each of them fails when it stops being true, and a
paragraph does not. That is the entire argument for this order:

1. **Pay it.** A defect that can be fixed is not debt; it is work.
2. **A gate, with a reason-carrying map.** `UNMAPPED`, `NOT_A_VALUE`, `SCOPES`, `EXEMPT`,
   `UNMARKED`, `UNTRACKED`, `SIZE_ALLOWANCE`: each entry names a case and says why, as a
   string value rather than a comment, and **a stale entry fails its own gate**. See
   [`scripts/check/AGENTS.md`](./scripts/check/AGENTS.md).
3. **A suite assertion.** A limit a test can pin is pinned. The cap on user text scale lives in
   `compose/src/test/kotlin/org/dravensoft/arena/ArenaDensityTest.kt` and in
   `swiftui/Tests/ArenaTokensTests/ArenaTokensTests.swift` for exactly that reason.
4. **The normative document for that layer.** [`AGENTS.md`](./AGENTS.md),
   [`compose/AGENTS.md`](./compose/AGENTS.md), [`swiftui/AGENTS.md`](./swiftui/AGENTS.md), or
   [`scripts/AGENTS.md`](./scripts/AGENTS.md).
5. **The one header `scripts/` and test files are allowed**, at most ten lines: a measurement,
   a vendor's behaviour, a pinned version, a constraint of a test environment.

**Sources under `compose/src/main/` and `swiftui/Sources/` that a person wrote carry no
comments at all**, and `check:docs` enforces it, so a fact about one of them goes to its
layer's `AGENTS.md`, never into the file. An emitted source is outside that rule and carries
the doc comment `check:doc-comments` holds equal to its contract.

## What this file is not

**It is not a changelog.** A fixed defect is neither wrong, incomplete nor unverified, and a
paragraph explaining how it was fixed is history. The commit log already holds that, and it
holds it better, because it is dated.

**It is not a home for prose that could be a check.** Prose is the cheapest place to put
something, which is exactly why it accumulates: nothing ever fails because a paragraph goes
false.

**It is not a substitute for reading.** An entry is a claim, and a claim about a file you have
not read is how any record goes quietly false. Three shapes recur, none findable by a keyword
query: a document describing ITSELF, a token or symbol name written into ANOTHER file's prose,
and a sibling cited by its bare filename.

## Filed

**The pinned contract version carries no provenance attestation.**
`@dravensoft/arena-contracts@10.2.0` was published by hand from the Arena repository, so npm
holds no signed statement about which workflow built it. What it costs: the integrity check in
`scripts/generate/contracts/fetch-contracts.ts:integrityProblems(expected, tarball)` proves
the tarball is the one the registry serves and proves nothing about who put it there. Every
version after it is published over OIDC by a trusted publisher and does carry one, so this
entry dies the day the pin moves. Re-derive with:

```bash
bun -e "const v=require('./repo.config.json')['arena-contracts-version']; \
  const r=await fetch('https://registry.npmjs.org/@dravensoft/arena-contracts/'+v); \
  console.log((await r.json()).dist.attestations ?? 'no attestations')"
```

**The font binaries are not carried and no target registers a face.** `font.display`,
`font.body` and `font.mono` emit the family NAME with the CSS generic tail dropped, which is
the whole of what a `fontFamily` value can say off the web. Arena ships `.woff2`, which loads
on neither platform. What it costs: a consumer that does not register Archivo, Familjen
Grotesk and Spline Sans Mono as an Android resource or an iOS `UIAppFonts` entry gets the
system face and no error, so the type scale is right and the type is not. Re-derive the names
with:

```bash
bun -e "import {tokensOf} from './scripts/generate/arena/generate-tokens.ts'; \
  for (const t of tokensOf()) if (t.type === 'fontFamily') console.log(t.name, t.value)"
```

**A shadow crosses without its spread.** Neither Compose nor SwiftUI draws one, and all three
of Arena's shadows carry a negative spread that pulls the shape back in. What it costs: an
emitted shadow reads larger than the web draws it, by the spread, and no gate can measure the
difference because there is no native value to compare against. It is named in `UNMAPPED` in
`scripts/lib/arena/bridge.ts`, with the reason, per member, and a member leaving the contract
fails that map rather than this page.
