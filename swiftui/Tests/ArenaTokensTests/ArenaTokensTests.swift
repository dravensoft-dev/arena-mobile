/* The two asymmetric rows of the bridge, held on the layer that carries the asymmetry:
 * lineSpacing is ADDITIONAL space on SwiftUI where Compose takes the whole line height, and
 * tracking is a point value where Compose takes an em, so the same token is applied two
 * different ways and reading either off the other layer produces a value that compiles and is
 * wrong by a factor of the font size. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func aFixedDimensionCrossesAtOneToOne() {
    #expect(ArenaTokens.sp4 == 16)
    #expect(ArenaTokens.sp1 == 4)
}

@Test func lineSpacingIsAdditionalAndTrackingIsPoints() {
    #expect(ArenaScale.lineSpacing(1.5, fontSize: 16) == 8)
    #expect(abs(ArenaScale.tracking(ArenaTokens.lsLabel, fontSize: 50) - 11) < 0.0001)
}

@Test func theTwoThemesAreOneShapeAndNotOneValue() {
    #expect(ArenaColorScheme.dark.base100 != ArenaColorScheme.light.base100)
}
