/* SwiftUI's Color.opacity multiplies the opacity the colour already carries and Compose's
 * Color.copy overwrites it, so held is the multiplication on both sides and a call site never
 * chooses which one it meant. View.opacity is a third operation and not a third spelling: it
 * composites the whole subtree it wraps, so an ink held back that way fades together with
 * everything drawn beside it. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func anAliasNamesAJobAndCarriesNoValueOfItsOwn() {
    #expect(ArenaColorScheme.dark.bg == ArenaColorScheme.dark.base100)
    #expect(ArenaColorScheme.dark.surfaceCard == ArenaColorScheme.dark.base200)
    #expect(ArenaColorScheme.dark.textStrong == ArenaColorScheme.dark.baseContent)
    #expect(ArenaColorScheme.dark.accent == ArenaColorScheme.dark.primary)
    #expect(ArenaColorScheme.dark.danger == ArenaColorScheme.dark.error)
    #expect(ArenaColorScheme.light.surfaceCard == ArenaColorScheme.light.base200)
}

@Test func heldIsTheOpacityTheColourAlreadyCarriesTimesTheRatio() {
    let held = ArenaColorScheme.dark.textStrong.held(ArenaTokens.tintSoft)
    #expect(held == ArenaColorScheme.dark.baseContent.opacity(ArenaTokens.tintSoft))
    #expect(held != ArenaColorScheme.dark.textStrong)
}
