import SwiftUI

public struct ArenaEasing: Sendable, Equatable {
    public let x1: CGFloat
    public let y1: CGFloat
    public let x2: CGFloat
    public let y2: CGFloat

    public init(x1: CGFloat, y1: CGFloat, x2: CGFloat, y2: CGFloat) {
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
    }

    public func animation(duration: TimeInterval) -> Animation {
        .timingCurve(x1, y1, x2, y2, duration: duration)
    }
}

public struct ArenaShadow: Sendable, Equatable {
    public let offsetX: CGFloat
    public let offsetY: CGFloat
    public let blur: CGFloat
    public let color: Color

    public init(offsetX: CGFloat, offsetY: CGFloat, blur: CGFloat, color: Color) {
        self.offsetX = offsetX
        self.offsetY = offsetY
        self.blur = blur
        self.color = color
    }
}

public extension View {
    func arenaShadow(_ shadow: ArenaShadow) -> some View {
        self.shadow(color: shadow.color, radius: shadow.blur / 2, x: shadow.offsetX, y: shadow.offsetY)
    }
}
