package org.dravensoft.arena.tokens

import androidx.compose.runtime.Immutable
import androidx.compose.ui.text.font.FontFamily

@Immutable
public data class ArenaFonts(
    public val display: FontFamily,
    public val body: FontFamily,
    public val mono: FontFamily,
) {
    public companion object {
        public val System: ArenaFonts = ArenaFonts(
            display = FontFamily.Default,
            body = FontFamily.Default,
            mono = FontFamily.Monospace,
        )
    }
}
