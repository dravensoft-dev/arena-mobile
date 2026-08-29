import SwiftUI

private struct ArenaColorSchemeKey: EnvironmentKey {
    static let defaultValue = ArenaColorScheme.dark
}

private struct ArenaDensityScaleKey: EnvironmentKey {
    static let defaultValue = ArenaDensityScale.comfortable
}

private struct ArenaFontsKey: EnvironmentKey {
    static let defaultValue = ArenaFonts.system
}

public extension EnvironmentValues {
    var arenaColors: ArenaColorScheme {
        get { self[ArenaColorSchemeKey.self] }
        set { self[ArenaColorSchemeKey.self] = newValue }
    }

    var arenaDensity: ArenaDensityScale {
        get { self[ArenaDensityScaleKey.self] }
        set { self[ArenaDensityScaleKey.self] = newValue }
    }

    var arenaFonts: ArenaFonts {
        get { self[ArenaFontsKey.self] }
        set { self[ArenaFontsKey.self] = newValue }
    }
}

public extension View {
    func arenaTheme(
        colors: ArenaColorScheme = .dark,
        density: ArenaDensityScale = .comfortable,
        fonts: ArenaFonts = .system
    ) -> some View {
        environment(\.arenaColors, colors)
            .environment(\.arenaDensity, density)
            .environment(\.arenaFonts, fonts)
    }
}
