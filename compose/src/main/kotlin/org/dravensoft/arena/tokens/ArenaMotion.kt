package org.dravensoft.arena.tokens

import androidx.compose.ui.unit.Dp

public object ArenaMotion {
    public fun working(loop: Int, reduced: Boolean, slowed: Int = ArenaTokens.loopReduced): Int = if (reduced) slowed else loop

    public fun decorative(reduced: Boolean): Boolean = !reduced

    public fun travel(distance: Dp, reduced: Boolean): Dp = if (reduced) ArenaTokens.sp0 else distance
}
