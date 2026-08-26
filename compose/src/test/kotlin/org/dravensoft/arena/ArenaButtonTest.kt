/* Robolectric lays a composable out on the JVM, so this suite measures a render rather than an
 * expression. @Config pins SDK 34 because the compileSdk this library builds against is ahead of
 * the android-all jar Robolectric resolves, and a targetSdk it cannot boot fails every test here
 * for a reason that has nothing to do with the claim. The drawing is measured off the activation
 * box's own capture, as the extent of the control's fill down the middle column, because a single
 * pixel above the rung reads the gutter the focus ring reserves and passes whatever is drawn. The
 * paint claims below are a function of the scheme and need none of it. */

package org.dravensoft.arena

import androidx.compose.foundation.layout.Box
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.height
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.dravensoft.arena.api.ArenaButtonVariant
import org.dravensoft.arena.api.ArenaControlSize
import org.dravensoft.arena.components.ArenaButton
import org.dravensoft.arena.components.ArenaButtonPaint
import org.dravensoft.arena.theme.ArenaTheme
import org.dravensoft.arena.tokens.ArenaBaseDensity
import org.dravensoft.arena.tokens.ArenaControl
import org.dravensoft.arena.tokens.ArenaDarkColors
import org.dravensoft.arena.tokens.ArenaScale
import org.dravensoft.arena.tokens.ArenaLightColors
import org.dravensoft.arena.tokens.accent
import org.dravensoft.arena.tokens.borderStrong
import org.dravensoft.arena.tokens.danger
import org.dravensoft.arena.tokens.onAccent
import org.dravensoft.arena.tokens.surfaceCard
import org.dravensoft.arena.tokens.textStrong
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@RunWith(AndroidJUnit4::class)
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ArenaButtonTest {
    @get:Rule
    val compose = createComposeRule()

    private val TOUCH_FLOOR: Dp = 48.dp

    @Test
    fun aControlWithNoFloorOffersTheRungItsDensityNames() {
        compose.setContent {
            ArenaTheme(density = ArenaBaseDensity) {
                ArenaButton(content = "Send", click = {}, size = ArenaControlSize.Sm)
            }
        }
        val height = compose.onNode(hasClickAction()).getUnclippedBoundsInRoot().height
        assertTrue(
            height < TOUCH_FLOOR,
            "the small rung of the base ladder is below the floor, and a control offering it without being asked has grown a default: $height",
        )
    }

    @Test
    fun aControlAskedForAFloorOffersItToAThumb() {
        compose.setContent {
            ArenaTheme(density = ArenaBaseDensity) {
                ArenaButton(content = "Send", click = {}, size = ArenaControlSize.Sm, targetFloor = TOUCH_FLOOR)
            }
        }
        compose.onNode(hasClickAction()).assertHeightIsAtLeast(TOUCH_FLOOR)
    }

    @Test
    fun theBoxIsOfferedWithoutTheControlBeingDrawnThatLarge() {
        compose.setContent {
            ArenaTheme(density = ArenaBaseDensity) {
                Box {
                    ArenaButton(content = "Send", click = {}, size = ArenaControlSize.Sm, targetFloor = TOUCH_FLOOR)
                }
            }
        }
        val pixels = compose.onNode(hasClickAction()).captureToImage().toPixelMap()
        val fill = ArenaButtonPaint.fill(ArenaButtonVariant.Primary, ArenaDarkColors)
        val middle = pixels.width / 2
        val rows = (0 until pixels.height).filter { pixels[middle, it] == fill }
        val drawn = rows.last() - rows.first() + 1
        val rung = with(compose.density) {
            ArenaScale.control(ArenaControl.height(ArenaControlSize.Sm, ArenaBaseDensity), 1f).roundToPx()
        }
        val floor = with(compose.density) { TOUCH_FLOOR.roundToPx() }
        assertTrue(
            drawn <= rung + 2,
            "the control draws $drawn row(s) of its own fill and its rung is $rung, so the floor grew the drawing rather than the box",
        )
        assertTrue(
            drawn < floor,
            "the control draws $drawn row(s) and the floor is $floor, so what a thumb is offered is what a reader is shown",
        )
    }

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
