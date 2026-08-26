package org.dravensoft.arena.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
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
import org.dravensoft.arena.api.ArenaButtonVariant
import org.dravensoft.arena.api.ArenaControlSize
import org.dravensoft.arena.theme.ArenaTheme
import org.dravensoft.arena.tokens.ArenaColorScheme
import org.dravensoft.arena.tokens.ArenaContrast
import org.dravensoft.arena.tokens.ArenaControl
import org.dravensoft.arena.tokens.ArenaScale
import org.dravensoft.arena.tokens.ArenaTokens
import org.dravensoft.arena.tokens.accent
import org.dravensoft.arena.tokens.borderStrong
import org.dravensoft.arena.tokens.danger
import org.dravensoft.arena.tokens.focusRing
import org.dravensoft.arena.tokens.onAccent
import org.dravensoft.arena.tokens.surfaceCard
import org.dravensoft.arena.tokens.textStrong

public object ArenaButtonPaint {
    public fun fill(variant: ArenaButtonVariant, colors: ArenaColorScheme): Color = when (variant) {
        ArenaButtonVariant.Primary -> colors.accent
        ArenaButtonVariant.Secondary -> colors.surfaceCard
        ArenaButtonVariant.Ghost -> Color.Transparent
        ArenaButtonVariant.Danger -> Color.Transparent
    }

    public fun ink(variant: ArenaButtonVariant, colors: ArenaColorScheme): Color = when (variant) {
        ArenaButtonVariant.Primary -> colors.onAccent
        ArenaButtonVariant.Secondary -> colors.textStrong
        ArenaButtonVariant.Ghost -> colors.textStrong
        ArenaButtonVariant.Danger -> colors.danger
    }

    public fun edge(variant: ArenaButtonVariant, colors: ArenaColorScheme): Color = when (variant) {
        ArenaButtonVariant.Primary -> colors.accent
        ArenaButtonVariant.Secondary -> colors.borderStrong
        ArenaButtonVariant.Ghost -> Color.Transparent
        ArenaButtonVariant.Danger -> colors.danger
    }
}

@Composable
public fun ArenaButton(
    content: String,
    click: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ArenaButtonVariant = ArenaButtonVariant.Primary,
    size: ArenaControlSize = ArenaControlSize.Md,
    disabled: Boolean = false,
    loading: Boolean = false,
    full: Boolean = false,
    increasedContrast: Boolean = false,
    targetFloor: Dp? = null,
) {
    val colors = ArenaTheme.colors
    val density = ArenaTheme.density
    val inactive = disabled || loading
    val painted = ArenaScale.control(ArenaControl.height(size, density), LocalDensity.current.fontScale)
    val shape = RoundedCornerShape(ArenaControl.radius)
    val ring = ArenaContrast.focusWidth(increasedContrast)
    val gutter = ArenaTokens.focusOffset + ring
    var focused by remember { mutableStateOf(false) }
    Row(
        modifier = modifier
            .then(if (full) Modifier.fillMaxWidth() else Modifier)
            .onFocusChanged { focused = it.isFocused }
            .border(ring, if (focused) colors.focusRing else Color.Transparent, RoundedCornerShape(ArenaControl.radius + gutter))
            .padding(gutter)
            .sizeIn(minHeight = if (targetFloor == null) painted else ArenaControl.target(painted, targetFloor))
            .clip(shape)
            .background(ArenaButtonPaint.fill(variant, colors))
            .border(ArenaContrast.border(increasedContrast), ArenaButtonPaint.edge(variant, colors), shape)
            .clickable(enabled = !inactive, onClick = click)
            .padding(horizontal = ArenaControl.padding)
            .semantics {
                role = Role.Button
                contentDescription = content
                if (inactive) disabled()
                onClick { click(); true }
            },
        horizontalArrangement = Arrangement.spacedBy(ArenaControl.gap, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(
            text = content,
            style = TextStyle(
                color = ArenaButtonPaint.ink(variant, colors),
                fontSize = ArenaControl.text(size, density),
                fontWeight = ArenaControl.weight,
                fontFamily = ArenaTheme.fonts.body,
            ),
        )
    }
}
