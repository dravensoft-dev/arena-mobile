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
the token is not clearing it on screen. Compose says the touchable area is larger than the
drawing through `Modifier.minimumInteractiveComponentSize()` and through a hit area centred on
a smaller painted shape: a switch's pill stays at its drawn height and answers a thumb through
that box. Measure the box.

## What this layer does not carry

No component, and no answer to the style plugin tier. `explicitApi()` is on and
`allWarningsAsErrors` is set, so a public symbol without a visibility modifier and a warning
of any kind both fail the build rather than the review.
