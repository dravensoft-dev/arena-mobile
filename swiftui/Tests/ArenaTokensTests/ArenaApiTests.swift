/* The raw value is what Swift is handed and Kotlin is not: declaring the raw type gives this
 * layer CaseIterable and a failable init?(rawValue:) that nobody wrote, where the Kotlin side
 * carries an emitted from(value) doing the same work. What is worth holding here is the half
 * the contract owns rather than the half the compiler does: a case carries the contract's own
 * literal, so a reader walks back from an emitted case to the value that produced it. The
 * import is not @testable on purpose, since reaching these through the package's public face
 * is the claim. */

import Testing
import ArenaTokens

@Test func aCaseCarriesTheContractsOwnLiteralAndNotItsMangledName() {
    #expect(ArenaAlertTone.danger.rawValue == "danger")
    #expect(ArenaInputType.datetimeLocal.rawValue == "datetime-local")
    #expect(ArenaSwitchSize.size2xl.rawValue == "2xl")
    #expect(ArenaCatSlot.slot1.rawValue == 1)
    #expect(ArenaCatSlot.slot8.rawValue == 8)
}

@Test func aRawValueTheContractDoesNotDeclareInitialisesNothing() {
    #expect(ArenaAlertTone(rawValue: "danger") == .danger)
    #expect(ArenaAlertTone(rawValue: "chartreuse") == nil)
    #expect(ArenaInputType(rawValue: "datetimeLocal") == nil)
    #expect(ArenaCatSlot(rawValue: 9) == nil)
}

@Test func everyCaseIsReachedByItsOwnRawValue() {
    for one in ArenaAlertTone.allCases { #expect(ArenaAlertTone(rawValue: one.rawValue) == one) }
    for one in ArenaInputType.allCases { #expect(ArenaInputType(rawValue: one.rawValue) == one) }
    for one in ArenaSwitchSize.allCases { #expect(ArenaSwitchSize(rawValue: one.rawValue) == one) }
    for one in ArenaCatSlot.allCases { #expect(ArenaCatSlot(rawValue: one.rawValue) == one) }
}

@Test func anObjectIsConstructedThroughTheEmittedPublicInitialiser() {
    let crumb = ArenaCrumb(label: "Customers")
    #expect(crumb.label == "Customers")
    #expect(crumb.href == nil)
    #expect(ArenaCrumb(label: "Customers", href: "/customers").href == "/customers")
}
