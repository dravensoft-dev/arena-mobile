/* Robolectric lays a composable out on the JVM, so this suite measures a render rather than an
 * expression. @Config pins SDK 34 because the compileSdk this library builds against is ahead of
 * the android-all jar Robolectric resolves; it asks for a tall window because the matrix is drawn
 * in one composition and a node the window does not reach cannot be captured; and it asks for
 * xhdpi because a boundary one pixel wide is a run a one-pixel tolerance cannot tell from an
 * absent one. Every length is converted through the rule's own Density, and the probes read the
 * activation box's own capture, in which the painted rectangle sits inset by the gutter the focus
 * ring reserves. The paint claims below are a function of the scheme and need none of it. */

package org.dravensoft.arena

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.height
import androidx.compose.ui.unit.max
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.dravensoft.arena.api.ArenaButtonVariant
import org.dravensoft.arena.api.ArenaControlSize
import org.dravensoft.arena.components.ArenaButton
import org.dravensoft.arena.components.ArenaButtonPaint
import org.dravensoft.arena.theme.ArenaTheme
import org.dravensoft.arena.tokens.ArenaBaseDensity
import org.dravensoft.arena.tokens.ArenaComfortableDensity
import org.dravensoft.arena.tokens.ArenaContrast
import org.dravensoft.arena.tokens.ArenaControl
import org.dravensoft.arena.tokens.ArenaDarkColors
import org.dravensoft.arena.tokens.ArenaDensityScale
import org.dravensoft.arena.tokens.ArenaLightColors
import org.dravensoft.arena.tokens.ArenaScale
import org.dravensoft.arena.tokens.ArenaTokens
import org.dravensoft.arena.tokens.accent
import org.dravensoft.arena.tokens.bg
import org.dravensoft.arena.tokens.borderStrong
import org.dravensoft.arena.tokens.danger
import org.dravensoft.arena.tokens.onAccent
import org.dravensoft.arena.tokens.surfaceCard
import org.dravensoft.arena.tokens.textStrong
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@RunWith(AndroidJUnit4::class)
@Config(sdk = [34], qualifiers = "w411dp-h1600dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ArenaButtonTest {
    @get:Rule
    val compose = createComposeRule()

    private val TOUCH_FLOOR: Dp = 48.dp

    private val CASES = listOf(
        ArenaButtonVariant.Primary to ArenaControlSize.Sm,
        ArenaButtonVariant.Primary to ArenaControlSize.Md,
        ArenaButtonVariant.Primary to ArenaControlSize.Lg,
        ArenaButtonVariant.Secondary to ArenaControlSize.Sm,
        ArenaButtonVariant.Secondary to ArenaControlSize.Md,
        ArenaButtonVariant.Secondary to ArenaControlSize.Lg,
        ArenaButtonVariant.Ghost to ArenaControlSize.Sm,
        ArenaButtonVariant.Ghost to ArenaControlSize.Md,
        ArenaButtonVariant.Ghost to ArenaControlSize.Lg,
        ArenaButtonVariant.Danger to ArenaControlSize.Sm,
        ArenaButtonVariant.Danger to ArenaControlSize.Md,
        ArenaButtonVariant.Danger to ArenaControlSize.Lg,
    )

    private val colors = ArenaDarkColors

    private fun render(configurations: List<Triple<ArenaDensityScale, Dp?, Boolean>>) {
        compose.setContent {
            Column(modifier = Modifier.background(colors.bg)) {
                for ((density, floor, contrast) in configurations) {
                    ArenaTheme(colors = colors, density = density) {
                        for ((variant, size) in CASES) {
                            ArenaButton(
                                content = "Send",
                                click = {},
                                variant = variant,
                                size = size,
                                full = true,
                                increasedContrast = contrast,
                                targetFloor = floor,
                            )
                        }
                    }
                }
            }
        }
    }

    private fun controlAt(at: Int) = compose.onAllNodes(hasClickAction())[at]

    private fun pixelsAt(at: Int) = controlAt(at).captureToImage().toPixelMap()

    private fun isPainted(pixel: Color, fill: Color, edge: Color) = pixel == fill || pixel == edge

    private fun gutterPx(contrast: Boolean) = with(compose.density) {
        (ArenaTokens.focusOffset + ArenaContrast.focusWidth(contrast)).roundToPx()
    }

    private fun paintedRun(pixels: PixelMap, fill: Color, edge: Color): Int {
        val column = pixels.width / 2
        val rows = (0 until pixels.height).filter { isPainted(pixels[column, it], fill, edge) }
        return if (rows.isEmpty()) 0 else rows.last() - rows.first() + 1
    }

    @Test
    fun paintedHeightIsTheRungTheDensityNamesAndNeverTheFloor() {
        render(listOf(Triple(ArenaComfortableDensity, TOUCH_FLOOR, false)))
        for ((at, case) in CASES.withIndex()) {
            val (variant, size) = case
            if (variant == ArenaButtonVariant.Ghost) continue
            val pixels = pixelsAt(at)
            val paintedHeight = paintedRun(pixels, ArenaButtonPaint.fill(variant, colors), ArenaButtonPaint.edge(variant, colors))
            val rung = with(compose.density) {
                ArenaScale.control(ArenaControl.height(size, ArenaComfortableDensity), 1f).roundToPx()
            }
            assertTrue(
                abs(paintedHeight - rung) <= 1,
                "$variant $size draws $paintedHeight row(s) of its own paint and the rung it is born at is $rung, so the floor grew the drawing rather than the box",
            )
        }
    }

    @Test
    fun activationBoxIsTheRungComposedWithTheFloorTheCallerPasses() {
        val floors = listOf(null, TOUCH_FLOOR)
        render(floors.map { Triple(ArenaBaseDensity, it, false) })
        for ((configuration, floor) in floors.withIndex()) {
            for ((index, case) in CASES.withIndex()) {
                val (variant, size) = case
                val at = configuration * CASES.size + index
                val painted = ArenaScale.control(ArenaControl.height(size, ArenaBaseDensity), 1f)
                val activationBox = if (floor == null) painted else ArenaControl.target(painted, floor)
                val gutter = ArenaTokens.focusOffset + ArenaContrast.focusWidth(false)
                val offered = with(compose.density) { controlAt(at).getUnclippedBoundsInRoot().height.roundToPx() }
                val expected = with(compose.density) { max(activationBox, painted + gutter * 2).roundToPx() }
                assertEquals(
                    expected,
                    offered,
                    "$variant $size asked for ${floor ?: "no floor"} offers $offered and its seam composes $expected",
                )
            }
        }
    }

    @Test
    fun groundInkIsWhatThePaintNamesOrTheDeclaredGround() {
        render(listOf(Triple(ArenaComfortableDensity, null, false)))
        for ((at, case) in CASES.withIndex()) {
            val (variant, size) = case
            val pixels = pixelsAt(at)
            val fill = ArenaButtonPaint.fill(variant, colors)
            val inward = gutterPx(false) + with(compose.density) { ArenaControl.padding.roundToPx() } / 2
            val groundInk = pixels[inward, pixels.height / 2]
            assertEquals(
                if (fill == Color.Transparent) colors.bg else fill,
                groundInk,
                "$variant $size paints $groundInk past its boundary and short of its label, and ArenaButtonPaint.fill names $fill",
            )
        }
    }

    @Test
    fun boundaryWidthIsTheLadderTheContrastAxisNames() {
        val contrasts = listOf(false, true)
        render(contrasts.map { Triple(ArenaComfortableDensity, null, it) })
        for ((configuration, contrast) in contrasts.withIndex()) {
            for ((index, case) in CASES.withIndex()) {
                val (variant, size) = case
                if (variant == ArenaButtonVariant.Primary) continue
                val pixels = pixelsAt(configuration * CASES.size + index)
                val edge = ArenaButtonPaint.edge(variant, colors)
                val ladder = with(compose.density) { ArenaContrast.border(contrast).roundToPx() }
                val from = gutterPx(contrast)
                val row = pixels.height / 2
                val boundaryWidth = (from until minOf(from + ladder + 2, pixels.width)).count { pixels[it, row] == edge }
                val expected = if (edge == Color.Transparent) 0 else ladder
                assertTrue(
                    abs(boundaryWidth - expected) <= 1,
                    "$variant $size under increased contrast $contrast draws $boundaryWidth column(s) of its edge and ArenaContrast.border names $expected",
                )
            }
        }
    }

    @Test
    fun boundaryInkIsWhatThePaintNamesOrTheDeclaredGround() {
        render(listOf(Triple(ArenaComfortableDensity, null, false)))
        for ((at, case) in CASES.withIndex()) {
            val (variant, size) = case
            val pixels = pixelsAt(at)
            val edge = ArenaButtonPaint.edge(variant, colors)
            val ladder = with(compose.density) { ArenaContrast.border(false).roundToPx() }
            val inward = gutterPx(false) + if (edge == Color.Transparent) 0 else ladder / 2
            val boundaryInk = pixels[inward, pixels.height / 2]
            assertEquals(
                if (edge == Color.Transparent) colors.bg else edge,
                boundaryInk,
                "$variant $size draws $boundaryInk at its first column, and ArenaButtonPaint.edge names $edge",
            )
        }
    }

    @Test
    fun cornerRadiusIsTheStepTheControlRoleCollapsesOnto() {
        render(listOf(Triple(ArenaComfortableDensity, null, false)))
        for ((at, case) in CASES.withIndex()) {
            val (variant, size) = case
            if (variant == ArenaButtonVariant.Ghost) continue
            val pixels = pixelsAt(at)
            val fill = ArenaButtonPaint.fill(variant, colors)
            val edge = ArenaButtonPaint.edge(variant, colors)
            val from = gutterPx(false)
            val top = (0 until pixels.height).first { isPainted(pixels[pixels.width / 2, it], fill, edge) }
            val cornerRadius = (from until pixels.width).takeWhile { !isPainted(pixels[it, top], fill, edge) }.count()
            val step = with(compose.density) { ArenaControl.radius.roundToPx() }
            assertTrue(
                abs(cornerRadius - step) <= 1,
                "$variant $size leaves $cornerRadius column(s) unpainted at the top row of its rectangle and ArenaControl.radius names $step",
            )
        }
    }

    @Test
    fun dangerIsAnOutlineAndNeverAFill() {
        for (scheme in listOf(ArenaDarkColors, ArenaLightColors)) {
            assertEquals(Color.Transparent, ArenaButtonPaint.fill(ArenaButtonVariant.Danger, scheme))
            assertEquals(scheme.danger, ArenaButtonPaint.edge(ArenaButtonVariant.Danger, scheme))
            assertEquals(scheme.danger, ArenaButtonPaint.ink(ArenaButtonVariant.Danger, scheme))
        }
    }

    @Test
    fun primaryIsTheOneVariantThatCarriesTheAccentAsAGround() {
        assertEquals(colors.accent, ArenaButtonPaint.fill(ArenaButtonVariant.Primary, colors))
        assertEquals(colors.onAccent, ArenaButtonPaint.ink(ArenaButtonVariant.Primary, colors))
        assertEquals(colors.accent, ArenaButtonPaint.edge(ArenaButtonVariant.Primary, colors))
        for (variant in listOf(ArenaButtonVariant.Secondary, ArenaButtonVariant.Ghost, ArenaButtonVariant.Danger)) {
            assertEquals(false, ArenaButtonPaint.fill(variant, colors) == colors.accent)
        }
    }

    @Test
    fun aGhostDrawsNoGroundAndNoBoundary() {
        val scheme = ArenaLightColors
        assertEquals(Color.Transparent, ArenaButtonPaint.fill(ArenaButtonVariant.Ghost, scheme))
        assertEquals(Color.Transparent, ArenaButtonPaint.edge(ArenaButtonVariant.Ghost, scheme))
        assertEquals(scheme.textStrong, ArenaButtonPaint.ink(ArenaButtonVariant.Ghost, scheme))
    }

    @Test
    fun secondaryIsTheSurfaceAndTheBoundaryThatCarriesMeaning() {
        assertEquals(colors.surfaceCard, ArenaButtonPaint.fill(ArenaButtonVariant.Secondary, colors))
        assertEquals(colors.borderStrong, ArenaButtonPaint.edge(ArenaButtonVariant.Secondary, colors))
        assertEquals(colors.textStrong, ArenaButtonPaint.ink(ArenaButtonVariant.Secondary, colors))
    }
}
