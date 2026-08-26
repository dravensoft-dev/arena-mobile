import CoreGraphics
import SwiftUI

public enum ArenaControl {
    public static let padding: CGFloat = ArenaTokens.sp3

    public static let gap: CGFloat = ArenaTokens.sp2

    public static let radius: CGFloat = ArenaTokens.rSm

    public static let weight: Font.Weight = ArenaTokens.fwSemibold

    public static func height(_ size: ArenaControlSize, _ density: ArenaDensityScale) -> CGFloat {
        switch size {
        case .sm: density.ctlHSm
        case .md: density.ctlH
        case .lg: density.ctlHLg
        }
    }

    public static func text(_ size: ArenaControlSize, _ density: ArenaDensityScale) -> CGFloat {
        switch size {
        case .sm: density.textMd
        case .md: density.text
        case .lg: density.text
        }
    }

    public static func target(_ painted: CGFloat, floor: CGFloat) -> CGFloat { max(floor, painted) }
}
