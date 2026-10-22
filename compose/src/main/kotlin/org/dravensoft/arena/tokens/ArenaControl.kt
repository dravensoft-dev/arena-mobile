package org.dravensoft.arena.tokens

import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.max

public object ArenaControl {
    public val padding: Dp = ArenaTokens.sp3

    public val gap: Dp = ArenaTokens.sp2

    public val radius: Dp = ArenaTokens.rSm

    public val weight: FontWeight = ArenaTokens.fwSemibold

    public fun height(density: ArenaDensityScale): Dp = density.ctlH

    public fun text(density: ArenaDensityScale): TextUnit = density.text

    public fun target(painted: Dp, floor: Dp): Dp = max(floor, painted)
}
