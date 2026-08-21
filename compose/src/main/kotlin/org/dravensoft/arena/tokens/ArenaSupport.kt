package org.dravensoft.arena.tokens

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

@Immutable
public data class ArenaEasing(
    public val x1: Float,
    public val y1: Float,
    public val x2: Float,
    public val y2: Float,
) {
    public fun asEasing(): Easing = CubicBezierEasing(x1, y1, x2, y2)
}

@Immutable
public data class ArenaShadow(
    public val offsetX: Dp,
    public val offsetY: Dp,
    public val blur: Dp,
    public val color: Color,
)
