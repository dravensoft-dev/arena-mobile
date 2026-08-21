import SwiftUI

private struct ArenaColorSchemeKey: EnvironmentKey {
    static let defaultValue = ArenaColorScheme.dark
}

private struct ArenaDensityScaleKey: EnvironmentKey {
    static let defaultValue = ArenaDensityScale.comfortable
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
}

public extension View {
    func arenaTheme(
        colors: ArenaColorScheme = .dark,
        density: ArenaDensityScale = .comfortable
    ) -> some View {
        environment(\.arenaColors, colors)
            .environment(\.arenaDensity, density)
    }
}
