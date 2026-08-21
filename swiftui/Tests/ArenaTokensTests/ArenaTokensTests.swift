/* Arena states no cap on user text scale and this repository must, because both platforms
 * scale text several times over at their accessibility sizes and a control that grows without
 * bound stops fitting a phone before an auditor ever sees it. ArenaScale.cap is 2, and it
 * bounds the geometry derived from a control floor while the text itself stays uncapped.
 * The two asymmetric rows of the bridge are held here as well: lineSpacing is ADDITIONAL
 * space on SwiftUI where Compose takes the whole line height, and tracking is a point value
 * where Compose takes an em, so the same token is applied two different ways. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func aFixedDimensionCrossesAtOneToOne() {
    #expect(ArenaTokens.sp4 == 16)
    #expect(ArenaTokens.sp1 == 4)
}

@Test func comfortableClearsApplesTouchFloor() {
    for rung in [ArenaDensityScale.comfortable.ctlHSm, ArenaDensityScale.comfortable.ctlH, ArenaDensityScale.comfortable.ctlHLg] {
        #expect(rung >= 44)
    }
}

@Test func compactIsNotOfferableToAThumb() {
    #expect(ArenaDensityScale.compact.ctlHSm < 44)
}

@Test func controlGeometryIsCapped() {
    #expect(ArenaScale.cap == 2)
    #expect(ArenaScale.control(48) <= 96)
}

@Test func lineSpacingIsAdditionalAndTrackingIsPoints() {
    #expect(ArenaScale.lineSpacing(1.5, fontSize: 16) == 8)
    #expect(abs(ArenaScale.tracking(ArenaTokens.lsLabel, fontSize: 50) - 11) < 0.0001)
}

@Test func theTwoThemesAreOneShapeAndNotOneValue() {
    #expect(ArenaColorScheme.dark.base100 != ArenaColorScheme.light.base100)
}
