/* SwiftUI applies the safe area itself, so a value reaching this seam comes from a view that
 * ignored it, and the number is a GeometryProxy's. The composition is a max and never a
 * replacement: returning the inset alone loses the floor on every device with no cutout, and
 * returning the floor alone loses the home indicator on every device that has one. */

import Testing
import CoreGraphics
@testable import ArenaTokens

@Test func aDeviceReportingNothingGetsTheFloorTheContractNames() {
    #expect(ArenaSafeArea.bottom(ArenaTokens.sp0) == ArenaTokens.sp3)
    #expect(ArenaSafeArea.top(ArenaTokens.sp0) == ArenaTokens.sp0)
    #expect(ArenaSafeArea.start(ArenaTokens.sp0) == ArenaTokens.sp0)
    #expect(ArenaSafeArea.end(ArenaTokens.sp0) == ArenaTokens.sp0)
}

@Test func anInsetDeeperThanTheFloorIsWhatApplies() {
    #expect(ArenaSafeArea.bottom(ArenaTokens.sp8) == ArenaTokens.sp8)
    #expect(ArenaSafeArea.top(ArenaTokens.sp8) == ArenaTokens.sp8)
    #expect(ArenaSafeArea.start(ArenaTokens.sp8) == ArenaTokens.sp8)
    #expect(ArenaSafeArea.end(ArenaTokens.sp8) == ArenaTokens.sp8)
}

@Test func anInsetShallowerThanTheFloorDoesNotLowerIt() {
    #expect(ArenaSafeArea.bottom(ArenaTokens.sp1) == ArenaTokens.sp3)
}

@Test func aCallerRaisesTheFloorAndTheCompositionIsUnchanged() {
    #expect(ArenaSafeArea.top(ArenaTokens.sp0, floor: ArenaTokens.sp4) == ArenaTokens.sp4)
    #expect(ArenaSafeArea.top(ArenaTokens.sp8, floor: ArenaTokens.sp4) == ArenaTokens.sp8)
}
