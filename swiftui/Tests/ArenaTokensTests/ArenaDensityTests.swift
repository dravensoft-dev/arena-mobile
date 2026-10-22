/* Arena states no cap on user text scale and this repository must, because both platforms scale
 * text several times over at their accessibility sizes and a control that grows without bound
 * stops fitting a phone before an auditor ever sees it. ArenaScale.cap is 2, and it bounds the
 * geometry derived from a control floor while the text itself stays uncapped: ctlH is a floor the
 * content grows past, never a height text is fitted into. Comfortable is the touch density and
 * every rung of it clears the 44 points Apple asks; compact clears none of it and is the expert
 * density, for a reader pointing with a mouse. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func comfortableClearsApplesTouchFloor() {
    for rung in [ArenaDensityScale.comfortable.ctlHSm, ArenaDensityScale.comfortable.ctlH, ArenaDensityScale.comfortable.ctlHLg] {
        #expect(rung >= 44)
    }
}

@Test func compactIsNotOfferableToAThumb() {
    #expect(ArenaDensityScale.compact.ctlHSm < 44)
}

@Test func controlGeometryIsCappedAndTextIsNot() {
    #expect(ArenaScale.cap == 2)
    #expect(ArenaScale.control(48) <= 96)
    #expect(ArenaScale.control(48) >= 48)
}
