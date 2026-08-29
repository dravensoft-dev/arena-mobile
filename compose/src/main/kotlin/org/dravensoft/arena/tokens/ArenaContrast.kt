package org.dravensoft.arena.tokens

import androidx.compose.ui.unit.Dp

public object ArenaContrast {
    public fun border(increased: Boolean): Dp = if (increased) ArenaTokens.bwStrong else ArenaTokens.bw

    public fun focusWidth(increased: Boolean): Dp = if (increased) ArenaTokens.sp1 else ArenaTokens.focusWidth

    public fun scrimBlur(reduced: Boolean): Dp = if (reduced) ArenaTokens.sp0 else ArenaTokens.scrimBlur
}
