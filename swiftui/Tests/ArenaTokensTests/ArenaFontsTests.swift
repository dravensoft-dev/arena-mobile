/* A named face resolves against what the process registered, so the seam here takes a name and
 * the emitted constant already is one. Font.custom(_:size:) scales with Dynamic Type relative
 * to the body style on its own, and the size arriving at the seam has already been through
 * ArenaScale.text, so the fixed-size spelling is the one that scales the type scale once. */

import Testing
import SwiftUI
@testable import ArenaTokens

@Test func theSystemDefaultIsTheGenericTheContractedTailNames() {
    #expect(ArenaFonts.system.display == .system)
    #expect(ArenaFonts.system.body == .system)
    #expect(ArenaFonts.system.mono == .monospaced)
}

@Test func registeredReadsTheEmittedNamesRatherThanRetypingOne() {
    #expect(ArenaFonts.registered.display == .named(ArenaTokens.fontDisplay))
    #expect(ArenaFonts.registered.body == .named(ArenaTokens.fontBody))
    #expect(ArenaFonts.registered.mono == .named(ArenaTokens.fontMono))
}

@Test func aGenericAlwaysResolvesAndAnUnregisteredNameNeverDoes() {
    let absent = "A Family No Process Registers"
    #expect(ArenaFontFace.system.isResolved)
    #expect(ArenaFontFace.monospaced.isResolved)
    #expect(!ArenaFontFace.named(absent).isResolved)
    #expect(ArenaFonts.system.unresolved().isEmpty)
    #expect(ArenaFonts(display: .named(absent), body: .system, mono: .monospaced).unresolved() == [absent])
}
