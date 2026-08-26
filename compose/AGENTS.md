# The Compose layer

A Gradle library, `org.dravensoft.arena:arena-compose`, holding the emitted tokens and the
themes over them. It compiles against a JDK 21 toolchain, `compileSdk` 37 and `minSdk` 24,
each stated once in [`../gradle/libs.versions.toml`](../gradle/libs.versions.toml) and read
from there by [`compose/build.gradle.kts`](./build.gradle.kts).

**The artifact version is not stated here.** `settings.gradle.kts` reads it from
[`../repo.config.json`](../repo.config.json), which is the authority, so there is no second
number to keep in step.

## What is emitted and what is written

`src/main/kotlin/org/dravensoft/arena/tokens/` carries the emitted values beside the sources a
person wrote around them: `compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaSupport.kt`
holds the composite types the emit constructs and
`compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaScale.kt` holds the cap, while
`compose/src/main/kotlin/org/dravensoft/arena/theme/ArenaTheme.kt` provides both locals.

`src/main/kotlin/org/dravensoft/arena/api/` carries the API vocabulary and nothing authored:
the enums and predefined objects a component member takes, emitted from the contract by
`scripts/generate/arena/generate-api-types.ts`. **It is a package of its own and not a module
of its own**, because a type there reads no token, so there is nothing for a module boundary to
keep apart, and a second Maven artifact would make a release two acts instead of one.

[`../GENERATED.md`](../GENERATED.md) says how to tell an emitted file from an authored one
without opening it.

**An authored source here carries no comment at all.** A fact about one of them belongs on
this page.

## What an enum costs here that it does not cost on SwiftUI

An emitted `enum class` carries a `value` property and a `from(value)` companion, and both are
written by the emitter. Kotlin gives an enum `name`, `ordinal`, `entries` and a `valueOf` that
throws, and no notion of a raw value at all, where declaring a raw type on the SwiftUI side
hands that layer the value, the case list and a failable initialiser for nothing. So the same
contract is more Kotlin than Swift, and the extra Kotlin is not decoration: without it the two
layers would offer a consumer different capabilities from one contract.

**A closed set is an `enum class` and not a `@JvmInline value class`**, which is what Compose
itself reaches for in `TextAlign` and `KeyboardType`. AndroidX buys source compatibility with
that shape because it ships to a consumer base that cannot be recompiled; here the contract set
moves only when [`../repo.config.json`](../repo.config.json) raises the pin, and an `enum class`
buys an exhaustive `when` at every use site instead.

## What the axis obliges

A `dimension` on the `scales` axis is a `TextUnit` in `sp` and never a `Dp`. Nothing in the
compiler separates the two, because both are lengths, so `check:user-scale` is what holds it:
a scaling size emitted as `dp` compiles, draws, and stops answering the reader's text setting
with nothing reporting it.

A `number` carrying the `em` hint is a `TextUnit` in `em`, which `letterSpacing` accepts
directly. That is the row where the two platforms disagree: SwiftUI takes a point value, so
the same token is applied two different ways and neither layer is evidence about the other.

## A copy overwrites the alpha, so the composition multiplies first

`Color.copy(alpha = x)` replaces whatever alpha the colour was carrying. Every colour in the
emitted palette arrives opaque, so the difference is invisible over all of them, which is exactly
why it survives a review; the contracted scrim does not arrive opaque, and a layer that overwrites
there returns a scrim that is not one.
`compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaComposition.kt` multiplies the alpha the
colour already holds before it copies, so this layer and SwiftUI compose one colour rather than two.

A `Color` in the sRGB space packs as 32-bit ARGB, so a ratio round-trips through eight bits and a
half comes back as 128 parts in 255. A test comparing one asserts within a step of that ladder, and
`compose/src/test/kotlin/org/dravensoft/arena/ArenaCompositionTest.kt` carries the reason in the one
header a test file is allowed.

## The seam takes a face and never a name

Android resolves no bundled face from a family name, so the emitted `String` reaches a system
face or nothing at all. `compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaFonts.kt` is
where a consumer hands over what they built from `R.font`, provided the way the colours and the
density are, and the member is a resolved `FontFamily`.

**There is deliberately no resolution query here.** What arrives is already resolved, so nothing
can fail at draw time and there is nothing to ask. SwiftUI takes a name and therefore carries
one, which [`../swiftui/AGENTS.md`](../swiftui/AGENTS.md) states.

**The system default is not chosen here.** A contracted `fontFamily` carries a CSS generic tail
the emit drops, and that tail is the only statement anywhere about which face a family falls
back to, so `mono` falls back to `FontFamily.Monospace` and the other two to `FontFamily.Default`.
`check:fonts` measures each one against its own contracted tail.

## The cap, and what it does not mean

`ArenaScale.CAP` bounds the geometry derived from a control floor and leaves the text alone.
Arena states no cap and both platforms scale text several times over at their accessibility
sizes, so a control that grows without bound stops fitting a phone before an auditor ever
sees it. The reason is held in
`compose/src/test/kotlin/org/dravensoft/arena/ArenaDensityTest.kt`,
where a stale copy of it fails.

**`fixed` does not mean the control never grows.** `ctlH` is a floor the content grows past,
never a height text is fitted into: a button holding scaled text becomes taller and never
shorter, and a layout that clamps it to the floor has read the axis backwards.

## The touch target is the activation box and never the painted one

Comfortable is the default density on the argument the README makes, and clearing a floor in
the token is not clearing it on screen. **The symbol that says it in one call,
`Modifier.minimumInteractiveComponentSize()`, is Material's**, and this library takes no Material
dependency, so the box is composed instead: `org.dravensoft.arena.tokens.ArenaControl` returns it
and a caller passes the floor, because 48dp is a constant of this platform rather than a value
any contract carries. A hit area centred on a smaller painted shape is the other half, for the
control whose paint is smaller than its target: a switch's pill stays at its drawn height and
answers a thumb through that box. Measure the box.

## The inset arrives from the caller, and `safeDrawing` is which one

`WindowInsets.safeDrawing` is the set to hand to
`org.dravensoft.arena.tokens.ArenaSafeArea`. Reading it here would put a layout container inside
a seam of values and would have this library decide, once, which window a consumer's inset comes
from. That is why the seam takes the value rather than reading it, and it is the reason a
consumer writes `WindowInsets.safeDrawing.asPaddingValues().calculateBottomPadding()` at the call
site. What [`compose/build.gradle.kts`](./build.gradle.kts) depends on is derived rather than
listed here, and the file itself is the list.

**`safeDrawing` reports nothing until the app has gone edge to edge.** An activity that has not
called `enableEdgeToEdge` has its insets consumed by the decor, so every edge arrives as zero and
what applies is the floor. Nothing fails, nothing warns, and the layout is correct for an app
drawing inside the system bars, which is the point: the floor is the value for a device that
reports none.

**The horizontal pair is `start` and `end` here as well.** `PaddingValues` resolves them with
`calculateStartPadding(layoutDirection)`, so the value the seam returns is applied without
anybody converting a side by hand.

## The contrast axis arrives late and the transparency axis never arrives

`UiModeManager.getContrast()` is how Android reports increased contrast, and it returns a float
in `[-1, 1]` where zero is the default. **It arrives at API 34 and `minSdk` here is 24**, so which
reading counts as increased, and what a caller passes below 34, are the caller's decisions:
`ArenaContrast` takes a boolean because Arena's question is binary and the value it answers with
is a step of a two-step ladder, and a seam interpolating between contracted steps would author a
value this library consumes.

**Android publishes no reduce-transparency setting at all**, so `ArenaContrast.scrimBlur(reduced)`
has no instrument behind it on this layer today. The member exists anyway, because one a layer
lacks offers a consumer two libraries from one contract, and a caller with no signal passes false.

Reduced motion is `Settings.Global.ANIMATOR_DURATION_SCALE`, which reads zero when the reader has
turned animations off. It needs a `ContentResolver`, which is another reason the reading is the
caller's and the composition is the library's.

What the three cases and the three classes ARE is stated once on [`../AGENTS.md`](../AGENTS.md).

## The focus ring is drawn here, and `onFocusChanged` is what reports it

`Modifier.clickable` already makes a control focusable and already refuses focus when it is
disabled, so nothing here adds a `focusable()` of its own; what is added is a
`Modifier.onFocusChanged` above it in the chain, since a focus observer has to sit before the
focus target it observes. The ring is a second `border` over a gutter the control pays whether it
has focus or not, so taking focus moves nothing.

## What this layer draws, and what it still does not carry

`org.dravensoft.arena.components` is where a drawn component lives, and everything under
`tokens/` stays a value or a composition over one. The style plugin tier has no answer here and
the control roles are collapsed onto contracted steps instead, which
[`../AGENTS.md`](../AGENTS.md) states once for both layers.

**Material3 is refused.** A second design system carrying its own theme, inside one that is not
it, buys a handful of modifiers and a shape scale this library already has from the contract.
`androidx.compose.foundation` is where the drawing comes from.

`explicitApi()` is on and `allWarningsAsErrors` is set, so a public symbol without a visibility
modifier and a warning of any kind both fail the build rather than the review.
