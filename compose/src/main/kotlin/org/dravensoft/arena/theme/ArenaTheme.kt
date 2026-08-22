package org.dravensoft.arena.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import org.dravensoft.arena.tokens.ArenaColorScheme
import org.dravensoft.arena.tokens.ArenaComfortableDensity
import org.dravensoft.arena.tokens.ArenaDarkColors
import org.dravensoft.arena.tokens.ArenaDensityScale
import org.dravensoft.arena.tokens.ArenaFonts

public val LocalArenaColors: ProvidableCompositionLocal<ArenaColorScheme> =
    staticCompositionLocalOf { ArenaDarkColors }

public val LocalArenaDensity: ProvidableCompositionLocal<ArenaDensityScale> =
    staticCompositionLocalOf { ArenaComfortableDensity }

public val LocalArenaFonts: ProvidableCompositionLocal<ArenaFonts> =
    staticCompositionLocalOf { ArenaFonts.System }

public object ArenaTheme {
    public val colors: ArenaColorScheme
        @Composable @ReadOnlyComposable get() = LocalArenaColors.current

    public val density: ArenaDensityScale
        @Composable @ReadOnlyComposable get() = LocalArenaDensity.current

    public val fonts: ArenaFonts
        @Composable @ReadOnlyComposable get() = LocalArenaFonts.current
}

@Composable
public fun ArenaTheme(
    colors: ArenaColorScheme = ArenaDarkColors,
    density: ArenaDensityScale = ArenaComfortableDensity,
    fonts: ArenaFonts = ArenaFonts.System,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(
        LocalArenaColors provides colors,
        LocalArenaDensity provides density,
        LocalArenaFonts provides fonts,
        content = content,
    )
}
