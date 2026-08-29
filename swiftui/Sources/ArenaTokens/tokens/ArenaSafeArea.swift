import CoreGraphics

public enum ArenaSafeArea {
    public static func top(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp0) -> CGFloat { max(floor, inset) }

    public static func end(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp0) -> CGFloat { max(floor, inset) }

    public static func bottom(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp3) -> CGFloat { max(floor, inset) }

    public static func start(_ inset: CGFloat, floor: CGFloat = ArenaTokens.sp0) -> CGFloat { max(floor, inset) }
}
