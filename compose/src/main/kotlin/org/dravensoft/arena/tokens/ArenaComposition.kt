package org.dravensoft.arena.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.copy

public fun Color.held(ratio: Float): Color = copy(alpha = alpha * ratio)

public val ArenaColorScheme.bg: Color get() = base100

public val ArenaColorScheme.surfaceCard: Color get() = base200

public val ArenaColorScheme.surfaceRaised: Color get() = base300

public val ArenaColorScheme.surfaceInput: Color get() = base300

public val ArenaColorScheme.border: Color get() = base300

public val ArenaColorScheme.borderStrong: Color get() = neutral

public val ArenaColorScheme.textStrong: Color get() = baseContent

public val ArenaColorScheme.accent: Color get() = primary

public val ArenaColorScheme.onAccent: Color get() = primaryContent

public val ArenaColorScheme.focusRing: Color get() = secondary

public val ArenaColorScheme.danger: Color get() = error

public val ArenaColorScheme.dangerFill: Color get() = errorFill
