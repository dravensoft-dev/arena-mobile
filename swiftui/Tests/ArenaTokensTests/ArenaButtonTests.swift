/* A View's drawing is not reachable from this suite: xcodebuild builds and tests, and what it
 * runs is swift-testing rather than anything that lays a view out. So what a suite holds is the
 * part that is a function of the scheme, and what the compile holds is that the drawing type
 * checks. The one claim the contract makes about appearance is here: danger stays an outline. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func dangerIsAnOutlineAndNeverAFill() {
    for colors in [ArenaColorScheme.dark, .light] {
        #expect(ArenaButtonPaint.fill(.danger, colors) == Color.clear)
        #expect(ArenaButtonPaint.edge(.danger, colors) == colors.danger)
        #expect(ArenaButtonPaint.ink(.danger, colors) == colors.danger)
    }
}

@Test func primaryIsTheOneVariantThatCarriesTheAccentAsAGround() {
    let colors = ArenaColorScheme.dark
    #expect(ArenaButtonPaint.fill(.primary, colors) == colors.accent)
    #expect(ArenaButtonPaint.ink(.primary, colors) == colors.onAccent)
    #expect(ArenaButtonPaint.edge(.primary, colors) == colors.accent)
    for variant in [ArenaButtonVariant.secondary, .ghost, .danger] {
        #expect(ArenaButtonPaint.fill(variant, colors) != colors.accent)
    }
}

@Test func aGhostDrawsNoGroundAndNoBoundary() {
    let colors = ArenaColorScheme.light
    #expect(ArenaButtonPaint.fill(.ghost, colors) == Color.clear)
    #expect(ArenaButtonPaint.edge(.ghost, colors) == Color.clear)
    #expect(ArenaButtonPaint.ink(.ghost, colors) == colors.textStrong)
}

@Test func secondaryIsTheSurfaceAndTheBoundaryThatCarriesMeaning() {
    let colors = ArenaColorScheme.dark
    #expect(ArenaButtonPaint.fill(.secondary, colors) == colors.surfaceCard)
    #expect(ArenaButtonPaint.edge(.secondary, colors) == colors.borderStrong)
    #expect(ArenaButtonPaint.ink(.secondary, colors) == colors.textStrong)
}
