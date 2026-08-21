# The Compose layer

A Gradle library, `org.dravensoft.arena:arena-compose`, holding the emitted tokens and the
themes over them. It compiles against a JDK 21 toolchain, `compileSdk` 37 and `minSdk` 24,
each stated once in [`../gradle/libs.versions.toml`](../gradle/libs.versions.toml) and read
from there by [`compose/build.gradle.kts`](./build.gradle.kts).

**The artifact version is not stated here.** `settings.gradle.kts` reads it from
[`../repo.config.json`](../repo.config.json), which is the authority, so there is no second
number to keep in step.

## What is emitted and what is written

`src/main/kotlin/org/dravensoft/arena/tokens/` carries three emitted files and three authored
ones. The emitted three are the token object, the two colour schemes and the three density
scales; the authored three are `compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaSupport.kt`,
which holds the two composite types the emit constructs, and
`compose/src/main/kotlin/org/dravensoft/arena/tokens/ArenaScale.kt`, which holds the cap.
`compose/src/main/kotlin/org/dravensoft/arena/theme/ArenaTheme.kt` is authored and provides
both locals. [`../GENERATED.md`](../GENERATED.md) says how to tell them apart
without opening one.

**An authored source here carries no comment at all.** A fact about one of them belongs on
this page.

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
