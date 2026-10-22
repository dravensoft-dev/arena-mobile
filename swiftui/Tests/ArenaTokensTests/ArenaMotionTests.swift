/* The policy states what each KIND of motion does rather than listing animations, which is why it
 * survives a toolkit with no media query, and the three classes answer three different ways. The
 * slowed step is a default and not a constant: the rotor passes its own, three times slower again,
 * and a member fixed to loopReduced would freeze that decision at the wrong call site. */

import Testing
import CoreGraphics
import Foundation
@testable import ArenaTokens

@Test func aWorkingLoopSlowsAndIsNeverFrozen() {
    #expect(ArenaMotion.working(ArenaTokens.loopSpin, reduced: false) == ArenaTokens.loopSpin)
    #expect(ArenaMotion.working(ArenaTokens.loopSpin, reduced: true) == ArenaTokens.loopReduced)
}

@Test func theRotorPassesItsOwnSlowedStepAtTheCallSite() {
    #expect(ArenaMotion.working(ArenaTokens.loopBrand, reduced: true, slowed: ArenaTokens.loopBrandReduced) == ArenaTokens.loopBrandReduced)
    #expect(ArenaMotion.working(ArenaTokens.loopBrand, reduced: false, slowed: ArenaTokens.loopBrandReduced) == ArenaTokens.loopBrand)
}

@Test func decorativeMotionStopsOutright() {
    #expect(ArenaMotion.decorative(false))
    #expect(!ArenaMotion.decorative(true))
}

@Test func anEntranceDropsItsTravelOntoTheContractedZero() {
    #expect(ArenaMotion.travel(ArenaTokens.sp4, reduced: false) == ArenaTokens.sp4)
    #expect(ArenaMotion.travel(ArenaTokens.sp4, reduced: true) == ArenaTokens.sp0)
}
