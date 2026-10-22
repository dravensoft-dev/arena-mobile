/* Nobody can set an accessibility setting from a test and everybody can pass the parameter, which
 * is the whole reason the seam takes one. Every value here is read out of ArenaTokens rather than
 * written as a number: a literal would pass while the contract moved underneath it. */

import Testing
import CoreGraphics
@testable import ArenaTokens

@Test func aBoundaryTakesTheStrongStepOnlyWhenTheReaderAskedForOne() {
    #expect(ArenaContrast.border(false) == ArenaTokens.bw)
    #expect(ArenaContrast.border(true) == ArenaTokens.bwStrong)
}

@Test func theRingWidensOntoTheSpacingGridAndNotOntoAWidthOfItsOwn() {
    #expect(ArenaContrast.focusWidth(false) == ArenaTokens.focusWidth)
    #expect(ArenaContrast.focusWidth(true) == ArenaTokens.sp1)
}

@Test func theScrimStopsBeingTranslucentOnItsOwnAxis() {
    #expect(ArenaContrast.scrimBlur(false) == ArenaTokens.scrimBlur)
    #expect(ArenaContrast.scrimBlur(true) == ArenaTokens.sp0)
}
