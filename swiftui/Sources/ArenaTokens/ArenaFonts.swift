#if canImport(UIKit)
import UIKit
#endif
import SwiftUI

public enum ArenaFontFace: Equatable, Sendable {
    case system
    case monospaced
    case named(String)

    public func font(size: CGFloat) -> Font {
        switch self {
        case .system:
            return .system(size: size)
        case .monospaced:
            return .system(size: size, design: .monospaced)
        case .named(let name):
            return .custom(name, fixedSize: size)
        }
    }

    public var isResolved: Bool {
        switch self {
        case .system, .monospaced:
            return true
        case .named(let name):
            #if canImport(UIKit)
            return !UIFont.fontNames(forFamilyName: name).isEmpty
            #else
            return false
            #endif
        }
    }
}

public struct ArenaFonts: Equatable, Sendable {
    public let display: ArenaFontFace
    public let body: ArenaFontFace
    public let mono: ArenaFontFace

    public init(display: ArenaFontFace, body: ArenaFontFace, mono: ArenaFontFace) {
        self.display = display
        self.body = body
        self.mono = mono
    }

    public static let system = ArenaFonts(
        display: .system,
        body: .system,
        mono: .monospaced
    )

    public static let registered = ArenaFonts(
        display: .named(ArenaTokens.fontDisplay),
        body: .named(ArenaTokens.fontBody),
        mono: .named(ArenaTokens.fontMono)
    )

    public func unresolved() -> [String] {
        [display, body, mono].compactMap { face in
            guard case .named(let name) = face else { return nil }
            return face.isResolved ? nil : name
        }
    }
}
