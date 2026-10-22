/* The two composite types the emit constructs, held for what they carry rather than for what they
 * hold: the values themselves are check:emit's, against a fresh emit. The four control points
 * reach the timing curve in order, and a shadow compares on all four of its fields. The blur the
 * type carries is the contract's own, and the halving into a SwiftUI shadow radius lives in
 * arenaShadow and never in the value, so a consumer reading ArenaShadow.blur reads what Arena
 * states rather than what this toolkit takes. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func anEasingBecomesATimingCurveOfTheSameFourPoints() {
    let easing = ArenaEasing(x1: 0.2, y1: 0.9, x2: 0.1, y2: 1)
    #expect(easing.animation(duration: ArenaTokens.durMid)
            == Animation.timingCurve(0.2, 0.9, 0.1, 1, duration: ArenaTokens.durMid))
}

@Test func aShadowComparesOnAllFourFieldsAndNotOnThree() {
    let one = ArenaShadow(offsetX: 0, offsetY: ArenaTokens.sp1, blur: ArenaTokens.sp2, color: .black)
    #expect(one == ArenaShadow(offsetX: 0, offsetY: ArenaTokens.sp1, blur: ArenaTokens.sp2, color: .black))
    #expect(one != ArenaShadow(offsetX: 0, offsetY: ArenaTokens.sp2, blur: ArenaTokens.sp2, color: .black))
    #expect(one != ArenaShadow(offsetX: 0, offsetY: ArenaTokens.sp1, blur: ArenaTokens.sp3, color: .black))
}

@Test func aShadowStoresTheBlurItWasGivenAndHalvesNothing() {
    #expect(ArenaShadow(offsetX: 0, offsetY: 0, blur: ArenaTokens.sp4, color: .black).blur == ArenaTokens.sp4)
}
