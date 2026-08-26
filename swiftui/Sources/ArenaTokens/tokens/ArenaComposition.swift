import SwiftUI

public extension Color {
    func held(_ ratio: CGFloat) -> Color {
        opacity(ratio)
    }
}

public extension ArenaColorScheme {
    var bg: Color { base100 }

    var surfaceCard: Color { base200 }

    var surfaceRaised: Color { base300 }

    var surfaceInput: Color { base300 }

    var border: Color { base300 }

    var borderStrong: Color { neutral }

    var textStrong: Color { baseContent }

    var accent: Color { primary }

    var onAccent: Color { primaryContent }

    var focusRing: Color { secondary }

    var danger: Color { error }

    var dangerFill: Color { errorFill }
}
