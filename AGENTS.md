# arena-mobile, for whoever changes it

**Arena's design language on Compose and on SwiftUI.** Every value here is generated from
[`@dravensoft/arena-contracts`](https://www.npmjs.com/package/@dravensoft/arena-contracts),
the neutral contract set Arena publishes, at the version
[`repo.config.json`](./repo.config.json) pins. The repository itself is not a package: what
it publishes is `org.dravensoft.arena:arena-compose` on Maven Central and the `ArenaTokens`
Swift package a git tag serves.

**The property everything rests on: a clone with no JS toolchain at all builds both
libraries.** The generator is the only thing that touches the contract payload, and Gradle
and SwiftPM see Kotlin and Swift that are already emitted and committed. If a native build
ends up needing Bun, the arrangement is wrong and nothing else here matters.

This file routes. Read only what your task needs.

## Where each decision goes

The first row is not indexed by what you are changing, because a reader arriving with a
symptom does not know yet what they are changing.

| I am here because | Start at |
|---|---|
| something is wrong and I do not know which layer owns it | [`DOUBTS.md`](./DOUBTS.md), for what counts as a debt and which record beats a paragraph |
| a value is wrong, missing, or should be something else | Arena, not here. A value is a contract, and this repository consumes contracts it does not author. Raise `arena-contracts-version` in [`repo.config.json`](./repo.config.json) once the value ships |
| a token reaches no native symbol, or reaches the wrong unit | [`scripts/AGENTS.md`](./scripts/AGENTS.md), then `scripts/lib/arena/bridge.ts:bridge(token, identifier)`, which is the whole unit bridge |
| the emitted Kotlin or Swift is shaped wrong | the generator that writes it, `scripts/generate/arena/generate-tokens.ts` for a value and `scripts/generate/arena/generate-api-types.ts` for a type, and never the emitted file |
| a theme, a density, or what a user's text setting does to a value | [`compose/AGENTS.md`](./compose/AGENTS.md) or [`swiftui/AGENTS.md`](./swiftui/AGENTS.md) |
| a script, a gate or a generator | [`scripts/AGENTS.md`](./scripts/AGENTS.md), and [`scripts/check/AGENTS.md`](./scripts/check/AGENTS.md) for a gate |
| whether a step runs at all | [`scripts/graph/AGENTS.md`](./scripts/graph/AGENTS.md) |
| a release | [`versioning_steps.md`](./versioning_steps.md), then [`.github/workflows/AGENTS.md`](./.github/workflows/AGENTS.md) |
| documentation | the Documentation rules below |
| I am about to write down that something is wrong | [`DOUBTS.md`](./DOUBTS.md) |

**Nothing below the table routes.** What follows binds a change here whatever it is, so it is
read once and not per task.

**Whether the file in front of you is yours to edit is asked before every row rather than by
one of them.** [`GENERATED.md`](./GENERATED.md) is read before the edit and not after the
gate, because an edit to a generated region survives until the next emit and then goes, with
nothing failing in between.

**A fresh clone fetches before it emits.** `bun install && bun run build` resolves the pin,
brings the payload over HTTPS and rebuilds every generated file. A clone that only wants the
libraries needs none of it: `./gradlew :compose:assemble` and `swift build` read what is
committed.

**The commands that run this repository are the scripts whose name carries no colon**, and a
colon narrows a phase. One `bun run check` at a time.

## What this repository ships

Two libraries from one generated source set, and neither carries a skin. Arena's own palette and fonts arrive
as values because a token is a value; the register a product looks like is a style plugin's
answer, and the style plugin tier is web in mechanism and has no native counterpart here yet.

**A published tag is a promise about the tree it resolves to, so history is never rewritten.**
`git filter-repo` and every equivalent are refused outright whatever a repository-size
argument says. That matters more here than upstream, because SwiftPM resolves a package from
a tag directly rather than from a registry: rewriting one moves a dependency under a consumer
with no version number changing.

## What a behaviour requirement obliges here

**Arena's rule that a requirement met by an element's own native semantics counts as met does
not travel, and its inverse is what binds both layers here.** A browser's accessibility mapping
answers a requirement for free; neither toolkit has one, so a requirement met upstream by
rendering a native element is an explicit obligation on this side, applied by hand, in both
layers. A binding here that matches its web counterpart is a binding to read again.

**So a binding partitions rather than lists.** Every requirement of the pattern a component
binds is either met, naming the native symbol that meets it, or excepted with a reason.
Upstream an exception list is a subset and silence over a requirement means the element met it.
Silence here would mean nothing at all, which is the ambiguity this tier exists to end.

**The translation is by requirement key and the answers are data.**
`scripts/lib/arena/behaviour-obligations.ts` states the capability each key names, with no web
in it, and each layer's answer, which is a native symbol or a refusal carrying its reason. A
refusal is inherited by every binding rather than retyped into each one, so it goes stale in one
place. `scripts/lib/arena/behaviour-bindings.ts` is what each component of the contract binds,
and it is keyed by the contract rather than by what this repository publishes, so a component
that is not published yet is a recorded absence and never a hole. `bun run check:behaviour`
holds all of it, and holds none of it by rendering anything.

## What a colour composed at runtime is

**Arena composes its held-back inks and its soft washes in a stylesheet the contract set does not
carry**, as `color-mix(in oklab, C N%, transparent)`. That expression returns C at alpha N and
nothing else: a mix against transparent is performed on premultiplied components, transparent
premultiplies to nothing, and the result un-premultiplies back to C's own coordinates. The space
the expression names therefore decides nothing, which is why no colour-space conversion appears
anywhere on this side and why neither toolkit being able to mix in oklab is not the obstacle it
looks like. Arena's own text-contrast gate already reads it that way: it parses the percentage
out and hands it to a plain sRGB lerp.

**So a composed colour is an alpha the toolkit composites at paint**, and never a value computed
ahead of time. A precomputed ramp is refused, and the reason is not its cost: a ramp has to name
the ground it was computed against, and the expression it replaces names none. One ink draws over
the page, a card, a panel, a field, a wash and the scrim, and defers to the compositor in every
one of them, so a table of pre-composited values answers one of those and answers the rest with
the wrong colour. A ramp is also a table of values this repository would be authoring over a skin
it consumes, which the row above sends to Arena.

**An alias names the job a colour does and never its position in the palette.** A second spelling
of one job does not cross, and two jobs reading one token both do, because they share a value and
never a meaning: a skin moving one token moves a field's fill and a border together, and that
mapping is what is being ported rather than a coincidence. A name identical to an emitted member
renames nothing and is not an alias at all.

`bun run check:composition` holds it: the two layers compose the same members, every alias resolves
to a member the emitted scheme declares, and every ink either layer names clears its bar over the
grounds Arena set those bars against. `ROLES` in `scripts/check/arena/check-composition.ts` carries
why a member is gated or only reported, and `OWED` beside it names every ratio the contract does not
hold yet, with the token asked for, failing the moment a raised pin brings one in.

## What the device's own geometry is

**Arena composes the device's own geometry in the same stylesheet the contract set does not
carry**, as `max(var(--sp-3), env(safe-area-inset-bottom))` and three siblings. `env()` is a
value and a unit to nobody: it has none until there is a screen, so there is nothing for DTCG to
hold and nothing for the emit to carry. What crosses is the expression and the floor, and both
toolkits report the inset better than a browser does.

**So the library composes and never reads the device.** `ArenaSafeArea` on each layer takes the
inset the caller already has and returns it composed with the floor, and asking the platform is
the caller's. Reading it here would add a Compose artifact this repository does not depend on,
put a layout container inside a package of values on the SwiftUI side, and replace an expression
a test can measure with one that needs a screen.

**A floor is what applies when the device reports nothing, and a floor of nothing is a floor.**
Only the bottom edge carries a step, because a bar flush against the foot of a screen is
unreachable rather than merely tight; the other three carry zero, which is Arena stating that
those edges owe nothing rather than Arena saying nothing about them.

**A component pinned to a viewport edge pays that edge's inset itself, and the frame a consumer
draws around Arena pays for what it draws.** The seam is declared for the reason `--z-nav` and
`--layout-bar` are: the shell a consumer builds is part of the system, and the alternative is
every consumer inventing the expression. **The floor is a default and not a constant**, because a
component may need more than the system reports, which is what Arena's own skip link does.

**It is not theme state, so it travels through no theme.** `colors`, `density` and `fonts` reach
a tree through `ArenaTheme` and through the SwiftUI environment because each is a decision the
consumer makes once about how Arena looks. Geometry is not one: it changes with the screen, the
orientation and the window, and the toolkit already publishes it on a channel built for that. A
composition local or an environment key here would be a second and staler copy of it, so the
seam carries no provider, no local and no key.

**The two horizontal edges are `start` and `end` and not `left` and `right`.** The web names them
physically because CSS resolves the reading direction itself; here the value goes straight to a
padding API and both padding APIs are already relative to it.

`bun run check:environment` holds it: both layers carry the same edges over the same floors, each
floor is the emitted identifier of the token named rather than one that merely looks right, every
floor is on the `fixed` axis because a gutter grows with no reader's text setting, and the body
composes rather than replaces. `FLOORS` in `scripts/check/arena/check-environment.ts` carries why
each edge floors where it does.

## Where a new document goes

**The contributor branch is this file**, and it answers [the convention published for that
name](https://agents.md): a file at the root of the repository, that name exactly, plain
Markdown with no required field and no schema, a page per level resolved by proximity so the
closest to the file being edited wins, and a command an agent runs because a page listed it.

**A level is reachable by a link and not only by being nearest**, which is stricter than the
convention rather than different from it: proximity hands an agent the closest page and hands
a reader nothing, so `check:agents` holds every level here to a chain of links from this one.

**There is one branch, and that is a departure from Arena with a reason.** Arena routes two
audiences because it ships a design language to people who will never change it. This
repository has no consumer branch until it has consumers, and inventing one early is a second
router that can disagree with the first. [`CLAUDE.md`](./CLAUDE.md) is a real file carrying no
rule of its own, so a harness that loads it and nothing else still lands here.

**A rule binding more than one layer is this page's, stated once**; a rule binding one layer
is that layer's own `AGENTS.md`, in its own idiom.

## Documentation rules

- **Every `.md` file stays under 60,000 characters**, and **an allowance is not an exemption**:
  a document holding a raised limit is still measured against it, and one that falls back
  inside the shared limit **fails as a stale allowance**, so the pressure to decompose it
  returns rather than ending. `SIZE_ALLOWANCE` in `scripts/check/arena/check-docs.ts` is
  empty, and the emptiness is the claim.
- **No document here carries a literal count of anything**, only the command that produces it.
  The one exception is a figure an assertion derives and fails on. A number nothing holds is
  the defect this rule exists to stop.
- **Documentation punctuates with a colon, a comma, a semicolon or a full stop, never with an
  em dash.** A dash pair enclosing an aside becomes commas, or parentheses where commas would
  nest; a dash that amplifies or introduces a list becomes a colon; a dash marking a turn
  becomes a semicolon or a second sentence. An en dash between two numbers is a range and
  stays. The rule reaches prose only, so a fence and a code span keep what the code they quote
  contains.
- **Documentation is written in the present tense** and describes what this repository is,
  never what it was, when a part of it arrived, or which part is newest. **No released version
  other than this one exists on the page.** A reader on this tree cannot act on any of it, and
  a reader arriving from an older one is served by the version number and by the commit log,
  which is dated and is where the history already is.
- **A debt is written in the present tense as well, and it goes to [`DOUBTS.md`](./DOUBTS.md).**
- **A document cites code as `path/to/file:member(parameters)` and never by line number.** A
  line moves under the next edit and takes every citation with it in silence, while a member
  carries its own address: `scripts/utils/compare.ts:byCodeUnit(a, b)` still resolves after
  the file is reordered around it. `check:citations` holds both halves.
- **The best comment is the one not written.** A method carries its own context through its
  name. The only exception is `scripts/` and test files, which may carry **one** comment,
  inline or block, as a file header, **at most 10 lines**. Files a script generates are
  outside the rule entirely and keep their comments.
- **A contracted token's own doc is the one carve-out, and it earns it by being held.** In an
  emitted source, the KDoc above a `public val` and the `///` above a `public let` are exempt,
  because `check:doc-comments` fails one whose text is not that token's `$description` and
  fails one on a symbol no contract names. A comment a gate keeps equal to its source cannot
  go quietly false, which is the whole reason the rule exists. **That shape and no other**, and
  the emitter writes them so nobody types one. **Sources under `compose/src/main/` and
  `swiftui/Sources/` that a person wrote carry no comment at all.**
- Knowledge a rename cannot express, such as a measurement, a vendor's behaviour, a pinned
  version or a constraint of a test environment, goes in the one header `scripts/` and test
  files are allowed, or in a gate's own reason string. **Somewhere a stale copy of it fails
  something.**

`bun run check:docs` holds the size rule, the punctuation rule and the comment rule, and
`bun run check:citations` holds every path a document names to existing. **The present-tense
rule is the one no gate holds**, because nothing mechanical can judge it.

## Conventions

- **English only.** All code, comments, docs and UI copy are in English.
- **Two indent widths, and the split is deliberate.** Two spaces for TypeScript, JSON and
  Markdown, four for `.kt`, `.kts` and `.swift`, because an emitted native source has to read
  as native to the person reviewing it. [`.editorconfig`](./.editorconfig) states both.
- **Specs and implementation plans live under `docs/superpowers/`** (`specs/`, `plans/`),
  dated `YYYY-MM-DD-<name>.md`, git-ignored, and **deleted once executed**, which is why a
  debt filed in one dies with it and why a document citing one is a citation that was
  condemned when it was written.
- **The design rules themselves are not here.** No gradients, no emoji, danger as an outline,
  one primary accent: every one of them is decided in [Arena's design contract](https://github.com/dravensoft-dev/arena/blob/main/contracts/design/AGENTS.md).
  A second copy on this page is the copy with no owner.
- **A commit message containing a backtick is written with a quoted here-doc**, never
  `git commit -m "…"`. A backtick inside a double-quoted shell string opens command
  substitution and is silently spliced away: the message lands with the name it was quoting
  missing, and nothing errors.
- **A wait is for a condition, and the span beside it is a deadline rather than a schedule.**
  Every deadline is declared with `scripts/lib/arena/deadline.ts:deadline(name, ms, why)` in
  the file that owns the wait, never as a bare number, and a suite's budget is derived with
  `scripts/lib/arena/deadline.ts:budgetFor(...spent)`. A duration is a statement about the
  machine that measured it, and a Gradle or `xcodebuild` invocation is exactly the shape this
  rule was written for. `bun run check:deadlines` holds both halves.
- **Two gates cannot run on every host, and the repository declares itself NOT strict.**
  `check:kotlin` needs a JDK and `check:swift` needs Xcode, which installs on macOS alone.
  Where the dependency is missing the gate exits 2, `check-all` marks it `SKIP`, and the whole
  run reports **INCOMPLETE** rather than passing. `CI=true` turns every skip back into a
  failure, so a workflow is strict with nothing to configure. Arena declares the opposite
  value for the opposite reason: every dependency it needs installs on every machine.

## Debt

**A debt is paid, or made loud, before it is written down.** [`DOUBTS.md`](./DOUBTS.md)
states what counts as one and where the records that are not prose live: a reason-carrying map
beside its gate, a suite assertion, a normative `AGENTS.md`. Prefer any of those to a
paragraph: each of them fails when it stops being true, and a paragraph does not.

**A claim about a file you have not READ is how a document goes quietly false**, and "I
grepped it" is not sufficient evidence, because a query answers where a name appears and never
what the file around it says.
