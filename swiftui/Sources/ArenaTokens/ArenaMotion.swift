import CoreGraphics
import Foundation

public enum ArenaMotion {
    public static func working(_ loop: TimeInterval, reduced: Bool, slowed: TimeInterval = ArenaTokens.loopReduced) -> TimeInterval { reduced ? slowed : loop }

    public static func decorative(_ reduced: Bool) -> Bool { !reduced }

    public static func travel(_ distance: CGFloat, reduced: Bool) -> CGFloat { reduced ? ArenaTokens.sp0 : distance }
}
