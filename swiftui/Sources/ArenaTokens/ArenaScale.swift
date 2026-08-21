#if canImport(UIKit)
import UIKit
#endif
import SwiftUI

public enum ArenaScale {
    public static let cap: CGFloat = 2

    public static func text(_ value: CGFloat) -> CGFloat {
        #if canImport(UIKit)
        return UIFontMetrics.default.scaledValue(for: value)
        #else
        return value
        #endif
    }

    public static func control(_ floor: CGFloat) -> CGFloat {
        min(text(floor), floor * cap)
    }

    public static func tracking(_ ratio: CGFloat, fontSize: CGFloat) -> CGFloat {
        ratio * fontSize
    }

    public static func lineSpacing(_ ratio: CGFloat, fontSize: CGFloat) -> CGFloat {
        (ratio * fontSize) - fontSize
    }
}
