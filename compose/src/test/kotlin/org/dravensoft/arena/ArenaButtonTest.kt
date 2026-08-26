/* A composable is not reachable from a JVM suite: :compose:testDebugUnitTest renders nothing and
 * a rendering test needs ui-test with Robolectric or a device. So what a suite can hold is the
 * part that is a function of the scheme, and what the compile holds is that the drawing type
 * checks. The one claim the contract makes about appearance is here: danger stays an outline. */

package org.dravensoft.arena

import androidx.compose.ui.graphics.Color
import org.dravensoft.arena.api.ArenaButtonVariant
import org.dravensoft.arena.components.ArenaButtonPaint
import org.dravensoft.arena.tokens.ArenaDarkColors
import org.dravensoft.arena.tokens.ArenaLightColors
import org.dravensoft.arena.tokens.accent
import org.dravensoft.arena.tokens.borderStrong
import org.dravensoft.arena.tokens.danger
import org.dravensoft.arena.tokens.onAccent
import org.dravensoft.arena.tokens.surfaceCard
import org.dravensoft.arena.tokens.textStrong
import kotlin.test.Test
import kotlin.test.assertEquals

class ArenaButtonTest {
    @Test
    fun dangerIsAnOutlineAndNeverAFill() {
        for (colors in listOf(ArenaDarkColors, ArenaLightColors)) {
            assertEquals(Color.Transparent, ArenaButtonPaint.fill(ArenaButtonVariant.Danger, colors))
            assertEquals(colors.danger, ArenaButtonPaint.edge(ArenaButtonVariant.Danger, colors))
            assertEquals(colors.danger, ArenaButtonPaint.ink(ArenaButtonVariant.Danger, colors))
        }
    }

    @Test
    fun primaryIsTheOneVariantThatCarriesTheAccentAsAGround() {
        val colors = ArenaDarkColors
        assertEquals(colors.accent, ArenaButtonPaint.fill(ArenaButtonVariant.Primary, colors))
        assertEquals(colors.onAccent, ArenaButtonPaint.ink(ArenaButtonVariant.Primary, colors))
        assertEquals(colors.accent, ArenaButtonPaint.edge(ArenaButtonVariant.Primary, colors))
        for (variant in listOf(ArenaButtonVariant.Secondary, ArenaButtonVariant.Ghost, ArenaButtonVariant.Danger)) {
            assertEquals(false, ArenaButtonPaint.fill(variant, colors) == colors.accent)
        }
    }

    @Test
    fun aGhostDrawsNoGroundAndNoBoundary() {
        val colors = ArenaLightColors
        assertEquals(Color.Transparent, ArenaButtonPaint.fill(ArenaButtonVariant.Ghost, colors))
        assertEquals(Color.Transparent, ArenaButtonPaint.edge(ArenaButtonVariant.Ghost, colors))
        assertEquals(colors.textStrong, ArenaButtonPaint.ink(ArenaButtonVariant.Ghost, colors))
    }

    @Test
    fun secondaryIsTheSurfaceAndTheBoundaryThatCarriesMeaning() {
        val colors = ArenaDarkColors
        assertEquals(colors.surfaceCard, ArenaButtonPaint.fill(ArenaButtonVariant.Secondary, colors))
        assertEquals(colors.borderStrong, ArenaButtonPaint.edge(ArenaButtonVariant.Secondary, colors))
        assertEquals(colors.textStrong, ArenaButtonPaint.ink(ArenaButtonVariant.Secondary, colors))
    }
}
