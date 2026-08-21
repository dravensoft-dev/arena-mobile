package org.dravensoft.arena.tokens

import androidx.compose.ui.unit.Dp
import kotlin.math.min

public object ArenaScale {
    public const val CAP: Float = 2f

    public fun textScale(fontScale: Float): Float = fontScale

    public fun controlScale(fontScale: Float): Float = min(fontScale, CAP)

    public fun control(floor: Dp, fontScale: Float): Dp = floor * controlScale(fontScale)
}
