package org.dravensoft.arena.tokens

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.max

public object ArenaSafeArea {
    public fun top(inset: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, inset)

    public fun end(inset: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, inset)

    public fun bottom(inset: Dp, floor: Dp = ArenaTokens.sp3): Dp = max(floor, inset)

    public fun start(inset: Dp, floor: Dp = ArenaTokens.sp0): Dp = max(floor, inset)
}
