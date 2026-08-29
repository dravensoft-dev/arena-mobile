import CoreGraphics

public enum ArenaContrast {
    public static func border(_ increased: Bool) -> CGFloat { increased ? ArenaTokens.bwStrong : ArenaTokens.bw }

    public static func focusWidth(_ increased: Bool) -> CGFloat { increased ? ArenaTokens.sp1 : ArenaTokens.focusWidth }

    public static func scrimBlur(_ reduced: Bool) -> CGFloat { reduced ? ArenaTokens.sp0 : ArenaTokens.scrimBlur }
}
