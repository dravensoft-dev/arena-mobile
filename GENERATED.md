# What a machine writes, and what you do

**Before you edit a file in this tree, know which half of it is yours.** An edit to a
generated region survives until the next `bun run build` and then goes, and nothing fails in
between: the gates compare copies that still agree with each other, and the library that
compiles is the file the emit rewrote. A green board is not evidence that your edit is still
there.

## A file is one of three things

**Written by a machine, and its name says so.** `<stem>.generated.<ext>`. Never edit one,
never review one as though a person chose its wording, and never fix a defect in one: the
defect is in its source, and the next emit restores it. `check:generated` holds the naming.

**Written by a machine, and its name does not say so.** A file that can carry neither the
name nor a banner is named in `UNMARKED` in `scripts/check/arena/check-generated.ts`, with
the reason it can carry neither. `gradle/wrapper/gradle-wrapper.jar` is one: it is a binary,
and it is fetched from the Gradle distribution at the version
`gradle/wrapper/gradle-wrapper.properties` names rather than produced here.

**Written by a person, with a region a machine writes inside it.** This shape does not exist
here yet, and that is worth stating rather than leaving to be discovered: there is no marker
convention in this tree, so a file is wholly yours or wholly the emitter's.

## The emit is TRACKED, which is the opposite of what Arena does

Arena ignores everything a script writes under `frameworks/`, because a package is served
from a registry and CI rebuilds it from the tagged sources. **Here every emitted Kotlin and
Swift file is committed**, and it is the architecture rather than a preference: the property
this repository exists to hold is that a clone with no JS toolchain at all builds both
libraries, and that is only true while the emit stays committed. SwiftPM in particular
resolves a package from a git tag and runs nothing before compiling, so a tag whose emit is
missing serves a package that does not build.

`UNTRACKED` in `scripts/check/arena/check-generated.ts` names each generated output that is
git-ignored, with its reason. It holds `.contracts/`, which is reproducible from the pin over
HTTPS, and nothing else.

## Derive it rather than trusting this page

Which generators write where is declared by each generator in its own `node`, so the tree
answers the question and no list here can go short:

```bash
bun -e "
import { allNodes } from './scripts/graph/nodes.ts';
for (const { node } of await allNodes())
  for (const written of node.writes ?? []) console.log(node.name.padEnd(22), written);
"
```

Run it when a generator lands, when one moves, and the first time you touch a directory you
have not touched before.

## What it costs to guess wrong

**Editing a doc comment in an emitted source edits the wrong file.** The text above every
symbol there is that token's `$description` from the contract, and `check:doc-comments` fails
it the moment the two differ. The fix is Arena's contract and a raised pin, and the comment
follows on the next emit.

**Editing a value in an emitted source is the same mistake with a longer fuse**, because
`check:emit` compares the whole file and reports the first line that differs, so the edit is
found and the reason it was made is not.

**Restating in a hand-authored file what an emitted one already says** is how the two go out
of step. When you write in `compose/src/main/` or `swiftui/Sources/`, write what the emit
cannot: how a value is composed at runtime, what the platform obliges, what a cap costs.
Never the value.

## After you change anything a generator reads

`bun run build` runs every generator, and `git status --short` afterwards is the list of what
it decided to write. Two rules about that list, and both are load-bearing.

**A file you did not expect means a generator you did not know reads what you edited.** Read
it before committing; the surprise is the point of looking.

**A file you expected and did not get means the generator never saw your edit.** That is
nearly always a source in the wrong place rather than a generator at fault.
