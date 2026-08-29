package org.dravensoft.arena.tokens

import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.max
import org.dravensoft.arena.api.ArenaControlSize

public object ArenaControl {
    public val padding: Dp = ArenaTokens.sp3

    public val gap: Dp = ArenaTokens.sp2

    public val radius: Dp = ArenaTokens.rSm

    public val weight: FontWeight = ArenaTokens.fwSemibold

    public fun height(size: ArenaControlSize, density: ArenaDensityScale): Dp = when (size) {
        ArenaControlSize.Sm -> density.ctlHSm
        ArenaControlSize.Md -> density.ctlH
        ArenaControlSize.Lg -> density.ctlHLg
    }

    public fun text(size: ArenaControlSize, density: ArenaDensityScale): TextUnit = when (size) {
        ArenaControlSize.Sm -> density.textMd
        ArenaControlSize.Md -> density.text
        ArenaControlSize.Lg -> density.text
    }

    public fun target(painted: Dp, floor: Dp): Dp = max(floor, painted)
}
