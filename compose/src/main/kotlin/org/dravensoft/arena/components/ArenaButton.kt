package org.dravensoft.arena.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import org.dravensoft.arena.theme.ArenaTheme
import org.dravensoft.arena.tokens.ArenaColorScheme
import org.dravensoft.arena.tokens.ArenaContrast
import org.dravensoft.arena.tokens.ArenaControl
import org.dravensoft.arena.tokens.ArenaScale
import org.dravensoft.arena.tokens.ArenaTokens
import org.dravensoft.arena.tokens.accent
import org.dravensoft.arena.tokens.danger
import org.dravensoft.arena.tokens.focusRing
import org.dravensoft.arena.tokens.onAccent

public object ArenaButtonPaint {
    public fun fill(destructive: Boolean, colors: ArenaColorScheme): Color =
        if (destructive) Color.Transparent else colors.accent

    public fun ink(destructive: Boolean, colors: ArenaColorScheme): Color =
        if (destructive) colors.danger else colors.onAccent

    public fun edge(destructive: Boolean, colors: ArenaColorScheme): Color =
        if (destructive) colors.danger else colors.accent
}

@Composable
public fun ArenaButton(
    content: String,
    click: () -> Unit,
    modifier: Modifier = Modifier,
    destructive: Boolean = false,
    disabled: Boolean = false,
    loading: Boolean = false,
    increasedContrast: Boolean = false,
    targetFloor: Dp? = null,
) {
    val colors = ArenaTheme.colors
    val density = ArenaTheme.density
    val inactive = disabled || loading
    val painted = ArenaScale.control(ArenaControl.height(density), LocalDensity.current.fontScale)
    val box = if (targetFloor == null) painted else ArenaControl.target(painted, targetFloor)
    val shape = RoundedCornerShape(ArenaControl.radius)
    val ring = ArenaContrast.focusWidth(increasedContrast)
    val gutter = ArenaTokens.focusOffset + ring
    var focused by remember { mutableStateOf(false) }
    Box(
        modifier = modifier
            .onFocusChanged { focused = it.isFocused }
            .sizeIn(minHeight = box)
            .clickable(enabled = !inactive, onClick = click)
            .semantics {
                role = Role.Button
                contentDescription = content
                if (inactive) disabled()
                onClick { click(); true }
            },
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier = Modifier
                    .border(ring, if (focused) colors.focusRing else Color.Transparent, RoundedCornerShape(ArenaControl.radius + gutter))
                .padding(gutter)
                .sizeIn(minHeight = painted)
                .clip(shape)
                .background(ArenaButtonPaint.fill(destructive, colors))
                .border(ArenaContrast.border(increasedContrast), ArenaButtonPaint.edge(destructive, colors), shape)
                .padding(horizontal = ArenaControl.padding),
            horizontalArrangement = Arrangement.spacedBy(ArenaControl.gap, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                text = content,
                style = TextStyle(
                    color = ArenaButtonPaint.ink(destructive, colors),
                    fontSize = ArenaControl.text(density),
                    fontWeight = ArenaControl.weight,
                    fontFamily = ArenaTheme.fonts.body,
                ),
            )
        }
    }
}
