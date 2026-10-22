/* The activation box takes its floor as an argument and carries no default. The floor a platform
 * asks for is a constant of that platform, 44pt here and 48dp on Android, and every other length
 * in this package is read from the emit; a default would be the one value written by hand. Which
 * rungs stand above those floors is ArenaTokensTests' claim and not this file's. */

import Testing
import CoreGraphics
@testable import ArenaTokens

@Test func aControlReDensifiesRungForRung() {
    for density in [ArenaDensityScale.base, .compact, .comfortable] {
        #expect(ArenaControl.height(.sm, density) == density.ctlHSm)
        #expect(ArenaControl.height(.md, density) == density.ctlH)
        #expect(ArenaControl.height(.lg, density) == density.ctlHLg)
    }
}

@Test func theSmallRungDropsATextStepAndTheOtherTwoShareOne() {
    let density = ArenaDensityScale.comfortable
    #expect(ArenaControl.text(.sm, density) == density.textMd)
    #expect(ArenaControl.text(.md, density) == density.text)
    #expect(ArenaControl.text(.lg, density) == density.text)
}

@Test func theRoomAControlGivesItsContentIsContractedAndNotPerRung() {
    #expect(ArenaControl.padding == ArenaTokens.sp3)
    #expect(ArenaControl.gap == ArenaTokens.sp2)
    #expect(ArenaControl.radius == ArenaTokens.rSm)
    #expect(ArenaControl.weight == ArenaTokens.fwSemibold)
}

@Test func theActivationBoxIsTheFloorWhereThePaintIsSmallerAndThePaintWhereItIsNot() {
    let floor: CGFloat = 44
    #expect(ArenaControl.target(ArenaDensityScale.compact.ctlHSm, floor: floor) == floor)
    #expect(ArenaControl.target(ArenaDensityScale.comfortable.ctlHLg, floor: floor) == ArenaDensityScale.comfortable.ctlHLg)
}
