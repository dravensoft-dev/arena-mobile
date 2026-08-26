# The SwiftUI layer

A Swift package target, `ArenaTokens`, holding the emitted tokens and the themes over them.
It builds with `swift-tools-version: 6.2` against the iOS 26 SDK, with a deployment target of
iOS 16.

**`Package.swift` is at the repository root and not here**, because SwiftPM resolves a package
from the root of a git repository and admits no package in a subdirectory. The target points
back into this directory by `path`, so the layout survives the constraint rather than being
reshaped by it.

**Nothing here states a version.** SwiftPM reads the git tag, so the tag IS the release and
`check:release` is what stops it from disagreeing with
[`../repo.config.json`](../repo.config.json).

## Why iOS 16 and not lower

`.tracking()` and `.kerning()` arrive in iOS 16, and they are what binds the `ls-*` tokens.
Below that the same value needs an `AttributedString` or a UIKit descriptor, which is real
code in exchange for a fraction of a percent of devices. Xcode 26 will build for iOS 15 and
tests none of it, so the floor is stated where it can be held rather than where it is merely
possible.

## What is emitted and what is written

`Sources/ArenaTokens/` carries the emitted sources beside the authored ones.
`swiftui/Sources/ArenaTokens/tokens/ArenaSupport.swift` holds the composite types the emit constructs
and the shadow modifier; `swiftui/Sources/ArenaTokens/tokens/ArenaScale.swift` holds the cap and the
two asymmetric conversions; `swiftui/Sources/ArenaTokens/theme/ArenaTheme.swift` holds both
environment keys. [`../GENERATED.md`](../GENERATED.md) says how to tell an emitted file from an
authored one without opening it.

## The target's name says a third of what it holds, and the directory says the rest

**This target carries the API vocabulary and the drawn components beside the values**, and it
partitions them the four ways the Compose layer already does:

```
swiftui/Sources/ArenaTokens/tokens/      the emitted values and the seams that compose them
swiftui/Sources/ArenaTokens/api/         the emitted enums and predefined objects a member takes
swiftui/Sources/ArenaTokens/components/  what this repository draws
swiftui/Sources/ArenaTokens/theme/       the environment keys the values reach a view by
```

**SwiftPM compiles a target from subdirectories with nothing declared**, so
[`../Package.swift`](../Package.swift) still points at the target root by `path`, the product is
still `ArenaTokens`, and `import ArenaTokens` is unchanged for anyone resolving a published tag.
A second target and a second product were the alternative to the partition, and what they buy is
a boundary nothing needs, since a type in `api/` reads no token and a component reads only this
target's own; what they cost is a second product a consumer resolves and a git tag that stops
being one promise about one package.

**Where a file goes is decided by what it IS and never by where someone put it.** An emitted
source sits at the path its own generator declares, a stem the contract carries as a component
sits in `components/`, and everything else authored sits in `tokens/` unless `PLACED` in
`scripts/check/arena/check-structure.ts` says otherwise with its reason. **A component is told
apart from a value by its stem being a component name the contract carries**, which is what
`bun run check:members` walks `components/` for, and `bun run check:structure` is what holds the
placement itself, on both layers at once.

## An enum arrives here cheaper than it arrives on Compose

Declaring the raw type is the whole of it: `RawRepresentable`, `CaseIterable` and a failable
`init?(rawValue:)` are synthesised, so a contract value round-trips with nothing written. The
Compose layer is handed none of the three and carries an emitted `from(value)` instead, which
is why [`../compose/AGENTS.md`](../compose/AGENTS.md) has a section about it and this one has a
sentence. **A struct is the mirror case and costs more here**: Swift synthesises its memberwise
initialiser at `internal`, so every emitted `public struct` carries an explicit public `init`
that a Kotlin `data class` never needs.

**An authored source here carries no comment at all.** A fact about one of them belongs on
this page.

## The two rows that are not symmetric with Compose

**`lineSpacing` is ADDITIONAL space.** Compose takes the whole line height, so a `lh` token
crosses as `lh × fs` there and as `(lh × fs) − fs` here.
`swiftui/Sources/ArenaTokens/tokens/ArenaScale.swift:lineSpacing` is the one place that subtraction
is written.

**Tracking is a point value.** Compose takes an `em` directly; here the same unitless token is
multiplied by the font size first, which
`swiftui/Sources/ArenaTokens/tokens/ArenaScale.swift:tracking` does.

Reading either of them off the other layer produces a value that compiles and is wrong by a
factor of the font size.

## An opacity multiplies, and the view modifier of that name is a third thing

`Color.opacity(_:)` multiplies the opacity the colour already carries, which is the whole of what
`swiftui/Sources/ArenaTokens/tokens/ArenaComposition.swift:held(_:)` does. Compose spells the same
operation as a copy over the alpha it reads, because a copy there replaces rather than multiplies,
so the two layers arrive at one colour by two different sentences.

`View.opacity(_:)` is not a third spelling of it. It composites the whole subtree it wraps, so an
ink held back that way fades together with everything drawn beside it, which is a different picture.
A level is a colour that carries an alpha, never a modifier on the view that draws it.

## The seam takes a name, and a size arriving at it has already been scaled

A family registered through `UIAppFonts` or through the font manager resolves by name, so the
emitted constant is already the whole mechanism and
`swiftui/Sources/ArenaTokens/tokens/ArenaFonts.swift` takes a face that is a system generic or a name.
The Compose layer resolves no bundled face from a name and takes a `FontFamily` instead, which
[`../compose/AGENTS.md`](../compose/AGENTS.md) states.

**`Font.custom(_:size:)` scales with Dynamic Type on its own and `Font.system(size:)` does not.**
A size reaching this seam has already been through
`swiftui/Sources/ArenaTokens/tokens/ArenaScale.swift:text(_:)`, so it is resolved with
`Font.custom(_:fixedSize:)` and the type scale scales once. The obvious spelling scales it
twice here and once on Compose, from a call site that reads correctly on both, which is why
`check:fonts` refuses a `.custom(` that carries no `fixedSize:`.

**A name nobody registered falls back to the system face in silence**, which no gate on this
side can reach, because what is registered is a property of the consumer's process.
`swiftui/Sources/ArenaTokens/tokens/ArenaFonts.swift:unresolved()` names the families the process does
not resolve, so a consumer's own test asserts the registration rather than a reviewer noticing
the wrong face.

## `none` is a contract value and `Optional` already has one

Several emitted enums declare a case `none`, because `none` is a value the contract authors and
this layer carries what the contract says. `Optional` declares its own `none`, so for a member
typed `ArenaGridGap?` the leading-dot form `.none` resolves to the absent optional and not to the
enum case, and the two mean different things: one says the consumer stated no rhythm and the
other says they stated the rhythm that draws nothing. **Write the case in full**, as
`ArenaGridGap.none`, wherever the type is optional. Derive the set rather than reading it here:

```bash
bun -e "import {apiTypesOf} from './scripts/generate/arena/generate-api-types.ts'; \
  for (const t of apiTypesOf()) if ((t.values ?? []).includes('none')) console.log(t.name)"
```

The Compose layer has no version of this, since nothing there names absence with an entry, which
is why the rule is on this page and not in [`../AGENTS.md`](../AGENTS.md).

## The axis, and the cap

A `dimension` on the `scales` axis emits as a bare `CGFloat` and is passed through
`swiftui/Sources/ArenaTokens/tokens/ArenaScale.swift:text` at the point of use, which is `UIFontMetrics` scaling. A `fixed` one is
points and is used as it arrives: a point and a dp are both defined as one CSS pixel at 1x, so
that row of the bridge crosses at 1:1 and a test holds it.

`ArenaScale.cap` in that file bounds the geometry derived from a control floor and leaves the text alone,
for the reason
`swiftui/Tests/ArenaTokensTests/ArenaTokensTests.swift` carries in its header.

## The touch target is the activation box and never the painted one

`.contentShape()` and a frame larger than the drawing are how this layer says the touchable
area is not the drawn one. Comfortable is the default density and every rung of it clears the
44 points Apple asks, which is a claim about the token and not yet about a screen.
`ArenaControl.target(_:floor:)` composes the box and takes the floor from the caller, because 44
points is a constant of this platform rather than a value any contract carries, and a default
here would be the one length in this package written by hand.

## The safe area is applied before the seam sees it

SwiftUI insets a view by the safe area on its own, so `ArenaSafeArea` is for a view that has
ignored it: `.ignoresSafeArea()` and then a padding composed here. Applying both is padding the
same gutter twice.

**The number is a `GeometryProxy`'s and there is no environment key for it.** At the iOS
deployment target this package holds, `GeometryProxy.safeAreaInsets` is the whole of how a view
learns the inset, and `safeAreaPadding` is above that floor. **A proxy inside a view the parent
already inset reports zeros**, which reads as a device with no cutout and is not one, so the
reader goes where the safe area has not been consumed yet.

**`EdgeInsets` names the horizontal pair the way the seam does**, as leading and trailing,
already resolved for the reading direction, which is why `ArenaSafeArea.start(_:floor:)` takes
`safeAreaInsets.leading` with nothing converted between them.

## The three instruments, and none of them is a trait collection

`\.colorSchemeContrast` equal to `.increased` is increased contrast,
`\.accessibilityReduceTransparency` is the scrim's axis and `\.accessibilityReduceMotion` is the
motion policy's. All three are environment values a view reads and hands to `ArenaContrast` or to
`ArenaMotion`, which compose and never read.

**`accessibilityContrast` is UIKit's and not this layer's.** It is a `UITraitCollection` property,
and reaching for it here finds nothing under that name. What the three cases and the three classes
ARE is stated once on [`../AGENTS.md`](../AGENTS.md).
