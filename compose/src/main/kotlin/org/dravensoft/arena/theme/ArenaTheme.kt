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

public val LocalArenaColors: ProvidableCompositionLocal<ArenaColorScheme> =
    staticCompositionLocalOf { ArenaDarkColors }

public val LocalArenaDensity: ProvidableCompositionLocal<ArenaDensityScale> =
    staticCompositionLocalOf { ArenaComfortableDensity }

public object ArenaTheme {
    public val colors: ArenaColorScheme
        @Composable @ReadOnlyComposable get() = LocalArenaColors.current

    public val density: ArenaDensityScale
        @Composable @ReadOnlyComposable get() = LocalArenaDensity.current
}

@Composable
public fun ArenaTheme(
    colors: ArenaColorScheme = ArenaDarkColors,
    density: ArenaDensityScale = ArenaComfortableDensity,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(
        LocalArenaColors provides colors,
        LocalArenaDensity provides density,
        content = content,
    )
}
