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
| a component's members, or what a component binds | the two registers below, `scripts/lib/arena/component-members.ts` and `scripts/lib/arena/behaviour-bindings.ts`, and never the component's own source |
| a script, a gate or a generator | [`scripts/AGENTS.md`](./scripts/AGENTS.md), and [`scripts/check/AGENTS.md`](./scripts/check/AGENTS.md) for a gate |
| the tooling does not compile, or a script of mine is not being checked | [`scripts/AGENTS.md`](./scripts/AGENTS.md), for the project every script answers to and what it claims |
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
colon narrows a phase. `bun run check` runs every gate AND the suites, so one command is the
whole claim; `bun run test` runs the suites alone. One `bun run check` at a time.

## What this repository ships

Two libraries from one generated source set, and neither carries a skin. Arena's own palette and fonts arrive
as values because a token is a value; the register a product looks like is a style plugin's
answer, and the style plugin tier is web in mechanism and has no native counterpart here yet.
**A component draws over those values and is not one of them**: which components exist is a
question for the two source trees, and `bun run check:members` is what walks them.

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
that is not published yet is a recorded absence and never a hole.

**For a component this repository draws, a symbol a binding names is a symbol that layer's source
carries.** The check is the last member of the symbol at a word boundary, because a use site
spells `contentDescription` where the obligation names the property that holds it. `bun run
check:behaviour` holds all of it, and holds none of it by rendering anything: a symbol found in a
source is one that is WRITTEN, never one applied to the right node.

## What holds a seam no other gate reads

**The value tier is authored twice, once per layer, and until every file in it is claimed by
something the two copies can drift in silence.** `bun run check:seams` partitions it: each
authored source under a layer's `tokens/` and `theme/` is either handed to a gate that already
holds it, in `HELD_BY` in `scripts/check/arena/check-seams.ts` naming which gate and why, or held
by that gate itself. A file in neither is a failure, which is what makes the partition a claim
rather than a roster, and a seam one layer carries alone is one contract offering a consumer two
libraries.

**A gate named in `HELD_BY` is a gate `GATES` registers**, checked rather than assumed, because a
seam handed to a gate no sweep runs is a claim made by nobody.

**What is held here is the hand-declared numeric constant, and it is held by name and by value
rather than by body.** Arena compares two TypeScript copies, one by module-level declaration and
one by normalised function body, and neither ports: the layers here are Kotlin and Swift and
there is no shared text. What does cross is the name and the number, so `ArenaScale.CAP` and
`ArenaScale.cap` are one constant read under each language's own spelling, and a value declared
on one layer alone, or declared twice with two numbers, is what fails. **That is the cap**, which
is the one length in either library this repository states rather than reads, and a cap changed on
one side compiles, passes that layer's own suite, and ships two libraries from one contract.

`bun run check:literals` bans a design value written as a literal in an authored native source and
allows a cap, a divisor and a ratio as arithmetic; this is what holds those allowed constants equal
on both sides, so the two gates partition rather than overlap.

## What a subject owes a suite

**One contract, two layers, and a suite on one of them is a claim half the consumers cannot act
on.** `bun run check:suites` keys a coverage record `<subject>:<layer>` and decides absence by
walking both sides: the subjects come out of each layer's `tokens/` and `components/`, the suites
out of each layer's test root, so "this layer does not cover it" and "this gate could not find it"
stop being one value.

**An emitted source is not a subject.** `check:emit` holds it against a fresh emit, so a suite for
it would assert the emitter twice and fail for the emitter's reasons. Which partitions carry no
subject at all is stated rather than assumed: `OUTSIDE` in
`scripts/check/arena/check-suites.ts` names each with its reason, and its keys have to complement
the ones that do carry subjects, so a fifth partition cannot arrive without somebody deciding
whether what sits in it owes a suite.

**Both directions are asked.** A subject with no suite beside it is reported unless
`COVERED_ELSEWHERE` names the file whose assertions cover it, and a suite present on one layer with
no counterpart on the other is reported too, which is the half that hides: both layers are green
either way. An entry that outlives its asymmetry, because the subject grew a suite of its own,
fails rather than lingering.

## What a contracted affordance obliges

**Every component contract declares an `affordances` array, and every one of the three is drawn by
a browser for free.** Neither toolkit draws any of them, so the inverse rule this page already
states applies whole: what a browser answers by rendering an element is an explicit obligation
here, applied by hand, on both layers. `DRAWN` in `scripts/lib/arena/affordance-bindings.ts`
partitions each contract's own array into what is drawn, naming the native symbol that draws it,
and what is excepted with its reason.

**`focus` is drawn, because every operand it needs is already contracted and already gated.** The
ring's colour is the `focusRing` alias `ArenaComposition` composes on both layers, its width is
what `ArenaContrast.focusWidth` returns and `check:contrast` holds against the spacing grid, and
its separation is an emitted token. The gutter it needs is reserved whether or not the control has
focus, so taking focus moves nothing on screen.

**`hover` and `press` are excepted, and the reason is the same absence read twice.** What a control
lightens with is a level or a soft, and `OWED` in `scripts/check/arena/check-composition.ts` names
every one of them as a ratio Arena has not contracted yet. Drawing either here means inventing a
value over a palette this repository consumes, which is the row the table above sends to Arena, so
both exceptions die with the raised pin that brings the token in.

`bun run check:affordances` holds it, and holds none of it by rendering anything: a symbol found in
a source is one that is WRITTEN, never one applied to the right node, which is the same admission
`check:behaviour` makes about a binding.

## Where a native source goes

**Both layers partition their sources the same four ways**, `tokens/`, `api/`, `components/` and
`theme/`, and the directory is part of what a file says about itself. With one component the
placement is obvious and the partition costs nothing; with thirty the directory is the only thing
a reader can consult before opening anything.

**What a file IS decides where it goes, and never where someone put it.** An emitted source sits
at the path its own generator declares, which is a claim `check:emit` cannot make: that gate
compares the target and never notices a second copy somewhere else, so a stray emit reads as
current forever. A stem the pinned contract carries as a component sits in `components/`.
Everything else authored sits in `tokens/`, so a new value needs no entry anywhere, and the one
subject that is neither a value nor a component is named in `PLACED` in
`scripts/check/arena/check-structure.ts` with its reason.

**The two layers are held to the same answer for the same subject**, because a subject placed one
way on Compose and another on SwiftUI is a tree that answers the placement question twice, and a
reader who learned it on one layer is wrong on the other. `bun run check:structure` holds all of
it, and a file loose in a layer's root or under a fifth directory is a named failure rather than
one the walk skips.

## What a workflow tells a runner

**A workflow is the one file in this tree GitHub reads and nothing here compiles**, so a name
that goes wrong in it goes wrong on a runner rather than on a laptop. `bun run check:workflow`
reads the `.yml` and asks four things of every job: a `bun run` name is a script
`package.json` declares, a script run by path is in the tree, a `--domain=` argument names a
member of `DOMAINS`, and every job a workflow declares sits in the `needs` of that workflow's
gate job.

**The gate job is the one carrying `if: always()`**, and never the one whose name ends in
`-gate`. That condition is what makes its result stand for the run: a job a routing decision
skips reports success to branch protection, so the only job worth requiring is the one no
routing decision can skip. A workflow declaring two of them is two gates that can disagree.

**A workflow that guards nothing carries no gate job**, and `NO_GATE` in
`scripts/check/arena/check-workflow.ts` names each with its reason. Both entries run on
`workflow_run` after another workflow reports success, which is an event branch protection
cannot require, and each declares a single job. An entry whose workflow leaves the tree, grows
a second job, or grows a gate job of its own is stale and fails.

## What a document hands a reader to type

**This repository leans on deriving a figure rather than writing one down**, which makes a
snippet that stops producing an answer its own chosen failure mode: it exits zero, prints
nothing, and the page around it goes on reading as current. `bun run check:vocabulary` runs
every fenced `bash` block a document hands a reader and holds it to answering, so an exit code
of zero is not enough and an empty answer is a failure.

**A block that cannot be run is named rather than skipped.** `ILLUSTRATIVE` in
`scripts/check/arena/check-vocabulary.ts` carries each with its reason, and there are three
reasons: it writes, it asks the network, or it carries a placeholder a reader substitutes. An
entry is addressed by its document and the position of the block in it, and it names the command
that block opens with, so an excuse that drifts onto a neighbour fails rather than excusing the
wrong one.

**The other half is the vocabulary itself.** Every `bun run` name a document types is a script
`package.json` declares, wherever the name sits, because a command copied out of prose is a
command a reader runs. `check:workflow` asks the same of a job, and the two share
`scripts/lib/arena/package-scripts.ts` so there is one answer.

**What the gate declares reading is the documents and never what a block reads.** A block
spawns a child whose reads are that script's own declaration, so widening this node to cover
them would invent an edge over a tree this gate never opens.

## Where a concept lives

**A concept written in the same words on two pages is edited on one of them, and both go on
reading as current.** `bun run check:duplication` holds that it has one home. The unit is a
normalised sentence long enough that a heading cannot collide by accident, compared across every
pair of documents through an index, with a fenced block and a heading cut before anything is
compared: a heading names a section, and two pages answering one question for two layers name
their sections alike on purpose.

**A sentence naming another document is a pointer to a home and passes; one naming none is a
second home and fails.** That separation is structural rather than a roster: the copy that is
not the home is the one that says where the home is, which is the sentence a reader is served by
finding twice. What the gate cannot tell is whether the page a pointer names is where the thing
is actually stated, which is the admission `check:behaviour` makes about a symbol found in a
source.

**`SECOND_HOME` in `scripts/check/arena/check-duplication.ts` is empty, and the emptiness is
the claim.** Every repetition this tree carries is a pointer, so there is nothing to excuse, and
an entry whose sentence falls back to one page fails as a stale one.

## What a component's members are

**A component contract is read when the register publishes the component, and excluded when the
register records it absent**, which is what `scripts/lib/arena/component-surface.ts` states. No
prefix and no roster decides it, so the exclusion goes stale the moment a binding moves rather
than being kept in step by hand.

**What a member becomes is data, and the two directions are separate questions.**
`scripts/lib/arena/component-members.ts` answers both. `MEMBERS` partitions a contract's member
list into the ones reaching a native parameter, under a name both layers spell the same way, and
the ones excepted with the reason they do not cross. `BEYOND` names every parameter that answers
no member, which is either an idiom of one toolkit or an axis a seam here takes from a caller
because no library on this side reads a device.

**A member that does not cross is excepted and never dropped**, for the reason a behaviour
requirement is excepted rather than omitted: silence upstream means the browser answered it, and
silence here would mean nothing at all.

**A member is a name, a type and a default, and all three are held.** A contract states
`"type": "ArenaButtonVariant"` and `"default": "primary"` beside the member, and a default changed
on one layer alone otherwise passes every gate in the tree and hands two consumers two different
controls. The two are DERIVED from the contract rather than written down beside the parameter
name: `scripts/lib/arena/api-emit.ts:fieldTypes(field, where)` already answers the Kotlin and the
Swift type of every form the contract types by type, and
`scripts/lib/arena/api-emit.ts:enumCases(type)` already answers how each layer spells each case, so
a second copy here would drift the first time a form changes. `NATIVE_FORMS` in
`scripts/lib/arena/component-members.ts` carries the two forms the contract types by FORM instead,
a slot and an event, and `DERIVED_DEFAULT` beside it names a default reached through a constant
rather than a literal. It is empty, and the emptiness is the claim.

`bun run check:members` holds it, over the components it finds by walking the two source trees
rather than by a list, so a component that lands and registers nothing is a failure. **What a
green run does not say is that the component draws what the contract describes**: what it says is
that the surface a consumer calls matches the surface the contract declares.

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
grounds Arena set those bars against. `COMPOSED` in `scripts/check/arena/check-composition.ts` carries
why a member is gated or only reported, and `OWED` beside it names every ratio the contract does not
hold yet, with the token asked for, failing the moment a raised pin brings one in.

**A bar this repository cannot raise is recorded rather than lowered.** A control draws a boundary
here now, so WCAG 1.4.11 reaches the members it is drawn in, and the pinned palette answers two of
them below that bar. Raising it means repainting a palette this repository consumes rather than
tightening a mapping it wrote, so `UNMET` beside `COMPOSED` names each one with its bar and its
reason, and an entry whose member starts clearing the bar is stale and fails.

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

## What an accessibility axis the system sets is

**Three settings a reader turns on and this repository cannot see.** Whether they asked for a
stronger interface, for less translucency, or for less movement is reported by a device and held
by no token: each has no value until there is one, the same way an inset has none until there is
a screen. Arena composes the first two in a stylesheet the contract set does not carry and states
the third as a policy, and both halves cross here.

**The web has one query where this has two settings.** `prefers-contrast` covers the scrim as
well, and Arena's own stylesheet names the reason in its comment, as what iOS calls Reduce
Transparency. A browser offers one query; either platform here offers two switches a reader turns
on independently, so the boundary and the focus ring read increased contrast and the scrim reads
reduced transparency.

**So the library composes and never reads the device**, for every reason `ArenaSafeArea` carries:
the axis arrives as a parameter and the seam returns the value composed with it. That is also
what makes the claim checkable, because nobody can set an accessibility setting from a test and
anybody can pass a boolean. Which instrument a caller reads is that layer's own, on
[`compose/AGENTS.md`](./compose/AGENTS.md) and [`swiftui/AGENTS.md`](./swiftui/AGENTS.md).

**Increased contrast has three cases and Arena answers each with a step it already carries.** A
boundary that carries meaning thickens, from `bw` to `bw-strong`, because WCAG 1.4.11 measures a
control's boundary and a hairline is the first thing that reader is asking about. The focus ring
widens onto the first step of the spacing grid, because it is drawn at an ordinary border's width
and would otherwise stop standing out at the moment every border thickens. And the scrim's
backdrop blur goes to the zero step, which is the whole of what Reduce Transparency asks for.

**The first case is six questions upstream and one here.** Arena moves six `bw` roles to one
value, and this repository carries no role tier: the six names are that tier asking a boundary's
question six times, and what a target without it answers is the question itself, which step a
boundary takes. Both operands are contracted and emitted, so the collapse is a mapping and never
a debt.

**The fourth case is refused and the refusal is held rather than written down.** An accent drawn
as ink is a style plugin's answer over a palette the kernel does not know, so Arena will not
reassign it and this repository, carrying no plugin tier at all, refuses harder.
`bun run check:contrast` fails a layer that grows a member for it.

**Reduced motion is a policy and not a stylesheet, which is why it survives a toolkit with no
media query.** It states what each KIND of motion does rather than listing animations. Motion
that reports work slows and is never frozen, because a stopped spinner reads as a hung process.
Purely decorative motion stops outright. An entrance keeps its fade and drops its travel, since
the movement is the vestibular trigger and the fade is the meaning. **The three classes return
three kinds of answer and the seam does not pretend otherwise**: a duration of zero over an
infinite loop is not a flat surface, and the time axis carries no contracted zero the way the
length axis carries one.

**The slowed step is a default and not a constant**, the way a safe-area floor is: the brand
mark's own step is three times slower again and reaches the seam as an argument, because the
rotor is a call site and the policy has three classes. The contrast seam takes no default at all,
because its pair is the contracted ladder itself and a default there would hand a call site its
own two widths, which is the role tier arriving by the back door.

`bun run check:contrast` and `bun run check:motion` hold it: both layers carry the same members,
each over the operand the composition or the policy names, on a length or a duration no reader's
text setting moves, and the body composes rather than replaces. `CASES` and `AXES` in
`scripts/check/arena/check-contrast.ts` and `CLASSES` in `scripts/check/arena/check-motion.ts`
carry why each case and each class answers the way it does. **What no gate here reaches is which
instrument a consumer reads**, because that lives in the consumer's process, which is the same
boundary `swiftui/Sources/ArenaTokens/tokens/ArenaFonts.swift:unresolved()` already admits.

## What a control's geometry is

**Arena asks a control's questions in a tier this repository does not carry.** `pad-control-x`,
`gap-control`, `r-control` and `fw-control` are keys in `.contracts/contracts/design/roles.json`, and every
entry in that file is a `$type` and a `$description` with no `$value` at all: a question a style
plugin answers rather than a value. `NOT_A_VALUE` in `scripts/lib/contracts/payload.ts` excludes it
from the emit for exactly that reason, so nothing about the tier can cross as a value.

**So a control's geometry collapses onto the contracted step each role states it is born at.** That
is the move the boundary ladder already forced: a target with no role tier answers the question the
name asks rather than the name, and both operands are contracted, so the collapse is a mapping and
never a debt. `ArenaControl` on each layer carries it. The height and the text step are not part of
it: they come off the density scale, so a control re-densifies without the seam saying so.

**The room a control gives its content is one value and not one per rung.** Arena spends the
contracted step at its smallest control and a literal at the other two, and a literal is a stylesheet
the payload does not carry; two steps invented here would be this repository authoring over a tier it
consumes, which is the row the table above sends to Arena.

**The activation box takes its floor as an argument and carries no default**, which is where it parts
from `ArenaSafeArea`. A safe-area floor is a contracted step and this floor is a constant of a
platform, 48dp on one side and 44pt on the other, so a default would be the one length in either
library written by hand rather than read from the emit. Which floor a caller passes is that layer's
own, and no density clears both floors at every rung: comfortable clears the Apple floor throughout and
stands level with it at the smallest rung, where it misses the Android floor.

## What a drawn control offers a thumb

**A control that clears a floor in the token has not cleared it on screen.** The activation box is the
painted rung composed with a floor the caller passes, and every claim made about it so far is a claim
about a function: what a suite measures is the paint a function returns and what a gate greps is a
symbol in a source. Whether a DRAWN control offers that box to a thumb is a different question, and the
only instrument that answers it is a render.

**So each layer measures a render, in the test target its own gate already builds and runs.** No job
and no runner is added: the Compose suite lays a composable out on the JVM and the SwiftUI suite hosts a
View on the simulator `check:swift` already boots. Which instrument each reaches for is that layer's
own, on [`compose/AGENTS.md`](./compose/AGENTS.md) and [`swiftui/AGENTS.md`](./swiftui/AGENTS.md).

**A control paints at its rung and activates at the box around it.** Growing the paint with the floor
draws a control the density did not ask for, so the box is centred on the drawing and the drawing keeps
the height the scale names. Each suite asserts three things: a control with no floor offers the rung, a
control asked for a floor offers it, and the pixel inside the box and above the rung is not the
control's own fill, which is what says the box is not the drawing.

**A floor is a constant of a platform, so it is written by hand, and what holds two hand-written copies
equal is a gate.** `bun run check:target` states each floor once, reads the copy the measuring suite
declares, and fails when the two disagree, which is the technique `check:seams` applies to the cap. It
ties each floor to the comfortable rung whose own `$description` argues it, so a ladder that drops below
the floor it argues for fails rather than drifting. And it partitions what is drawn: every component
either tree carries is measured on both layers or excepted in `UNBOXED` in
`scripts/check/arena/check-target.ts` with its reason. That map is empty, and the emptiness is the
claim, because a geometry that cannot take a floor lands with the component that asks it rather than
being excused before it exists.

**Three things stay out, and each is out for a reason rather than by omission.** What Android's own
dispatch does with the box is not reached, because the Compose instrument answers the toolkit's
hit-test surface rather than the view hierarchy's, which the SwiftUI instrument does not share since a
simulator hit test is UIKit's own. Whether a consumer passes a floor at all is not reached either: it
is the caller's, so a control drawn without one offers its painted box, and that is the boundary
`swiftui/Sources/ArenaTokens/tokens/ArenaFonts.swift:unresolved()` already admits about a registered
family. And what a gate here says about a suite is that it exists and which number it measures against,
never that it measured the right node, which is the admission `check:behaviour` makes about a symbol
found in a source; what closes that gap is that the measuring runs inside `check:kotlin` and
`check:swift`.

`bun run check:control` holds it: every control role the pinned contract declares is either collapsed
onto a contracted step by both seams or answered elsewhere with its reason, each rung reads the density
member the scale names, a length sits on the fixed axis and a label on the scales axis, and the body
composes rather than replaces. `COLLAPSED` in `scripts/check/arena/check-control.ts` carries why each
role answers the way it does, and a role the payload adds lands in that partition rather than in a
silence.

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
- **Two gates cannot run on every host, and the repository declares itself NOT strict.** Which
  two they are and what each needs is stated once on
  [`scripts/check/AGENTS.md`](./scripts/check/AGENTS.md).
  Where the dependency is missing the gate exits 2, `check-all` marks it `SKIP`, and the whole
  run reports **INCOMPLETE** rather than passing. `CI=true` turns every skip back into a
  failure, so a workflow is strict with nothing to configure. Arena declares the opposite
  value for the opposite reason: every dependency it needs installs on every machine.

## Debt

**What counts as a debt, where its record goes, and why any record that fails beats a
paragraph, is stated once on [`DOUBTS.md`](./DOUBTS.md).**

**A claim about a file you have not READ is how a document goes quietly false**, and "I
grepped it" is not sufficient evidence, because a query answers where a name appears and never
what the file around it says.
