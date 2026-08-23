# arena-mobile by Dravensoft

**Arena's design language on Jetpack Compose and on SwiftUI, generated from the contracts
Arena publishes.**

MIT License · Token-driven design system for Android and iOS.

## What you get

**Every value Arena decides, as a native constant.** Colour, type, spacing, radii, shadows,
motion and layering arrive as `Dp`, `TextUnit`, `Color`, `CGFloat` and `Font.Weight`, emitted
from [`@dravensoft/arena-contracts`](https://www.npmjs.com/package/@dravensoft/arena-contracts)
in strict DTCG 2025.10. No hex and no bare number sits in a component you write.

**What the reader's text setting does to a value, decided per value rather than per
platform.** Every dimension in the contract declares one of three axes, and the emit obeys it:
a size the reader scales arrives as `sp` on Compose and as a `CGFloat` you pass through
`UIFontMetrics` on SwiftUI, and a size that stays put arrives as `Dp` and as points. Nothing
is left to the target to guess, and `bun run check:user-scale` fails the day an axis stops
producing the unit it obliges.

**Two themes and three densities, as the platform's own idiom.** Dark first plus light, as a
`CompositionLocal` and as an `EnvironmentKey`. **Comfortable is the default**, because every
rung of it clears the 44 points Apple asks and its control height clears the 48 Android asks.
Compact clears neither and is the expert density, for a reader pointing with a mouse.

**The device's own geometry, composed rather than guessed.** A screen with a notch, a home
indicator or a cutout reports an inset, and Arena states the floor that applies when it reports
none. `ArenaSafeArea` composes the two, per edge, and the floor is a default a component pinned
to that edge can raise. The library asks the platform nothing: the inset is the toolkit's to
report, which keeps this a package of values.

```kotlin
val insets = WindowInsets.safeDrawing.asPaddingValues()

Modifier.padding(bottom = ArenaSafeArea.bottom(insets.calculateBottomPadding()))
```

```swift
GeometryReader { proxy in
    content.padding(.bottom, ArenaSafeArea.bottom(proxy.safeAreaInsets.bottom))
}
```

**The axes the system sets and the reader does not.** Increased contrast, reduced transparency
and reduced motion are settings a device reports and no token can hold. `ArenaContrast` moves a
boundary to the strong step of the ladder Arena already carries, widens the focus ring so it
still stands out once every border has thickened, and takes the scrim's blur to zero.
`ArenaMotion` slows a working loop rather than freezing it, because a stopped spinner reads as a
hung process; stops decorative motion outright; and drops an entrance's travel while keeping its
fade. The seams compose and the caller reads, so the toolkit reports the setting and the library
answers it.

```kotlin
val width = ArenaContrast.border(increased)
val spin = ArenaMotion.working(ArenaTokens.loopSpin, reduced)
```

```swift
let width = ArenaContrast.border(increased)
let spin = ArenaMotion.working(ArenaTokens.loopSpin, reduced: reduced)
```

**The scrim reads an axis of its own**, because the web folds transparency into one contrast
query and either platform here offers two switches a reader turns on independently. On SwiftUI the
three are `\.colorSchemeContrast`, `\.accessibilityReduceTransparency` and
`\.accessibilityReduceMotion`. On Compose the first is `UiModeManager.getContrast()`, which arrives
at API 34 over a `minSdk` of 24, the third is `Settings.Global.ANIMATOR_DURATION_SCALE`, and
Android publishes nothing for the second, so that one takes what your app decides. Each layer's
`AGENTS.md` says which and why the reading is yours.

**A build with no JavaScript in it.** The generator is the only thing that reads the contract
payload; Gradle and SwiftPM compile Kotlin and Swift that are already in the tree. A clone
with no Bun, no Node and no network builds both libraries.

## Install

**Gradle**

```kotlin
dependencies {
    implementation("org.dravensoft.arena:arena-compose:0.1.0")
}
```

**Swift Package Manager**

```swift
.package(url: "https://github.com/dravensoft-dev/arena-mobile", from: "0.1.0")
```

Then wrap your tree and read the values:

```kotlin
ArenaTheme(colors = ArenaDarkColors, density = ArenaComfortableDensity) {
    Text("Arena", fontSize = ArenaTokens.fsMd, color = ArenaTheme.colors.baseContent)
}
```

```swift
Text("Arena")
    .font(.system(size: ArenaScale.text(ArenaTokens.fsMd)))
    .foregroundStyle(colors.baseContent)
    .arenaTheme(colors: .dark, density: .comfortable)
```

## What it does not carry

**No component.** This milestone is the token language and the themes. A behaviour pattern is
an explicit obligation on a platform with no implicit ARIA mapping, and shipping a control
before that is written is shipping the half a browser used to do for free.

**No skin, and no style plugin.** Arena carries the language and never the appearance. The
style plugin tier is web in mechanism: the question Arena's role contract states ports and
the answer does not.

**No font binary, and a seam to hand one over.** A face is the skin tier, and the skin is the
consuming project's: Arena's own packages exclude the binaries for the same reason. The type
tokens name the families, registering them as an Android resource or an iOS `UIAppFonts` entry
is yours, and `ArenaFonts` is where a registered face reaches Arena's type roles. Until one
arrives both layers draw the system face, which is the generic each family's contracted
fallback names.

```kotlin
val archivo = FontFamily(Font(R.font.archivo))

ArenaTheme(fonts = ArenaFonts(display = archivo, body = familjenGrotesk, mono = splineSansMono)) {
    Text("Arena", fontFamily = ArenaTheme.fonts.display, fontSize = ArenaTokens.fsMd)
}
```

```swift
Text("Arena")
    .font(ArenaFonts.registered.display.font(size: ArenaScale.text(ArenaTokens.fsMd)))
    .arenaTheme(fonts: .registered)
```

On iOS a family name resolves against what the process registered and falls back to the system
face in silence, so `ArenaFonts.unresolved()` names the ones it did not find and a test of your
own asserts the registration happened:

```swift
#expect(ArenaFonts.registered.unresolved().isEmpty)
```

## Which version am I getting

The contract version this repository generates from is `arena-contracts-version` in
[`repo.config.json`](./repo.config.json), and it moves independently of the number below:
Arena and arena-mobile carry separate version lines and neither is derived from the other.

## Latest project artifacts
- **arena-mobile**: 0.1.0
- [Maven Central](https://central.sonatype.com/artifact/org.dravensoft.arena/arena-compose/versions)
- [npm contracts package](https://www.npmjs.com/package/@dravensoft/arena-contracts?activeTab=versions)

## Where to go next

**Working on arena-mobile itself.** [`AGENTS.md`](./AGENTS.md) is the root of that branch, and
everything below is reached through it.

- [`compose/AGENTS.md`](./compose/AGENTS.md) and [`swiftui/AGENTS.md`](./swiftui/AGENTS.md):
  the two layers, and what each platform obliges that the other does not.
- [`scripts/AGENTS.md`](./scripts/AGENTS.md): the generator and the gates.
- [`GENERATED.md`](./GENERATED.md): which half of a file is yours.
- [`DOUBTS.md`](./DOUBTS.md): what counts as a debt here, and where the records live.

## Contributing and security

arena-mobile takes pull requests from anyone. [`CONTRIBUTING.md`](./CONTRIBUTING.md) says
which changes go straight to one and which start upstream in Arena.
[`SECURITY.md`](./SECURITY.md) is where a vulnerability goes, and
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) is the Contributor Covenant this project holds to.

## About

Arena is the single interface language under which every Dravensoft software product is built,
published under the MIT License so that anyone else can build under it too.
