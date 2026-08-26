import SwiftUI

public enum ArenaButtonPaint {
    public static func fill(_ variant: ArenaButtonVariant, _ colors: ArenaColorScheme) -> Color {
        switch variant {
        case .primary: colors.accent
        case .secondary: colors.surfaceCard
        case .ghost: Color.clear
        case .danger: Color.clear
        }
    }

    public static func ink(_ variant: ArenaButtonVariant, _ colors: ArenaColorScheme) -> Color {
        switch variant {
        case .primary: colors.onAccent
        case .secondary: colors.textStrong
        case .ghost: colors.textStrong
        case .danger: colors.danger
        }
    }

    public static func edge(_ variant: ArenaButtonVariant, _ colors: ArenaColorScheme) -> Color {
        switch variant {
        case .primary: colors.accent
        case .secondary: colors.borderStrong
        case .ghost: Color.clear
        case .danger: colors.danger
        }
    }
}

public struct ArenaButton: View {
    @Environment(\.arenaColors) private var colors
    @Environment(\.arenaDensity) private var density
    @Environment(\.arenaFonts) private var fonts
    @FocusState private var focused: Bool

    private let content: String
    private let click: () -> Void
    private let variant: ArenaButtonVariant
    private let size: ArenaControlSize
    private let disabled: Bool
    private let loading: Bool
    private let full: Bool
    private let increasedContrast: Bool
    private let targetFloor: CGFloat?

    public init(
        _ content: String,
        variant: ArenaButtonVariant = .primary,
        size: ArenaControlSize = .md,
        disabled: Bool = false,
        loading: Bool = false,
        full: Bool = false,
        increasedContrast: Bool = false,
        targetFloor: CGFloat? = nil,
        click: @escaping () -> Void
    ) {
        self.content = content
        self.variant = variant
        self.size = size
        self.disabled = disabled
        self.loading = loading
        self.full = full
        self.increasedContrast = increasedContrast
        self.targetFloor = targetFloor
        self.click = click
    }

    private var inactive: Bool { disabled || loading }

    private var painted: CGFloat { ArenaScale.control(ArenaControl.height(size, density)) }

    private var box: CGFloat {
        guard let floor = targetFloor else { return painted }
        return ArenaControl.target(painted, floor: floor)
    }

    private var shape: RoundedRectangle { RoundedRectangle(cornerRadius: ArenaControl.radius) }

    private var ring: CGFloat { ArenaContrast.focusWidth(increasedContrast) }

    private var gutter: CGFloat { ArenaTokens.focusOffset + ring }

    private var ringShape: RoundedRectangle { RoundedRectangle(cornerRadius: ArenaControl.radius + gutter) }

    public var body: some View {
        Button(action: click) {
            HStack(spacing: ArenaControl.gap) {
                Text(content)
                    .font(fonts.body.font(size: ArenaScale.text(ArenaControl.text(size, density))))
                    .fontWeight(ArenaControl.weight)
                    .foregroundStyle(ArenaButtonPaint.ink(variant, colors))
            }
            .frame(maxWidth: full ? .infinity : nil, minHeight: box)
            .padding(.horizontal, ArenaControl.padding)
            .background(shape.fill(ArenaButtonPaint.fill(variant, colors)))
            .overlay(shape.strokeBorder(ArenaButtonPaint.edge(variant, colors), lineWidth: ArenaContrast.border(increasedContrast)))
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .focused($focused)
        .padding(gutter)
        .overlay(ringShape.strokeBorder(focused ? colors.focusRing : Color.clear, lineWidth: ring))
        .disabled(inactive)
        .accessibilityLabel(content)
        .accessibilityAddTraits(.isButton)
        .accessibilityRemoveTraits(inactive ? .isButton : [])
        .accessibilityAction { click() }
    }
}
