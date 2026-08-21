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

`Sources/ArenaTokens/` carries three emitted files and three authored ones. The authored three
are `swiftui/Sources/ArenaTokens/ArenaSupport.swift`, holding the two composite types the emit
constructs and the shadow modifier; `swiftui/Sources/ArenaTokens/ArenaScale.swift`, holding
the cap and the two asymmetric conversions; and
`swiftui/Sources/ArenaTokens/ArenaTheme.swift`, holding both environment keys.
[`../GENERATED.md`](../GENERATED.md) says how to tell them apart without opening one.

**An authored source here carries no comment at all.** A fact about one of them belongs on
this page.

## The two rows that are not symmetric with Compose

**`lineSpacing` is ADDITIONAL space.** Compose takes the whole line height, so a `lh` token
crosses as `lh × fs` there and as `(lh × fs) − fs` here.
`swiftui/Sources/ArenaTokens/ArenaScale.swift:lineSpacing` is the one place that subtraction
is written.

**Tracking is a point value.** Compose takes an `em` directly; here the same unitless token is
multiplied by the font size first, which
`swiftui/Sources/ArenaTokens/ArenaScale.swift:tracking` does.

Reading either of them off the other layer produces a value that compiles and is wrong by a
factor of the font size.

## The axis, and the cap

A `dimension` on the `scales` axis emits as a bare `CGFloat` and is passed through
`swiftui/Sources/ArenaTokens/ArenaScale.swift:text` at the point of use, which is `UIFontMetrics` scaling. A `fixed` one is
points and is used as it arrives: a point and a dp are both defined as one CSS pixel at 1x, so
that row of the bridge crosses at 1:1 and a test holds it.

`ArenaScale.cap` in that file bounds the geometry derived from a control floor and leaves the text alone,
for the reason
`swiftui/Tests/ArenaTokensTests/ArenaTokensTests.swift` carries in its header.

## The touch target is the activation box and never the painted one

`.contentShape()` and a frame larger than the drawing are how this layer says the touchable
area is not the drawn one. Comfortable is the default density and every rung of it clears the
44 points Apple asks, which is a claim about the token and not yet about a screen.

## Increased contrast, and what is refused

Three cases have an answer and one does not: every `bw` role moves to `bw-strong`, the scrim's
blur goes to zero under Reduce Transparency, and the focus ring widens because it is drawn at
an ordinary border's width. The fourth, an accent drawn as ink, is the style plugin's answer
over a palette this layer does not know, and it is refused rather than faked. Read
`\.accessibilityContrast` from the environment and answer the three.
