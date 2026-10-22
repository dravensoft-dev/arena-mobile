/* Compose's Color.copy overwrites the alpha it is given and SwiftUI's Color.opacity multiplies
 * the one the colour already carries, so held multiplies on both sides and the two layers
 * compose one colour rather than two. Over an opaque base the difference is invisible, which
 * is why it survives a review: every palette colour arrives at alpha 1 and the contracted
 * scrim does not. The tolerance is one part in 255 because a Color in the sRGB space packs as
 * 32-bit ARGB, so an alpha round-trips through eight bits and a half comes back as 128/255. */

package org.dravensoft.arena

import androidx.compose.ui.graphics.Color
import org.dravensoft.arena.tokens.ArenaDarkColors
import org.dravensoft.arena.tokens.ArenaLightColors
import org.dravensoft.arena.tokens.ArenaTokens
import org.dravensoft.arena.tokens.accent
import org.dravensoft.arena.tokens.bg
import org.dravensoft.arena.tokens.danger
import org.dravensoft.arena.tokens.held
import org.dravensoft.arena.tokens.surfaceCard
import org.dravensoft.arena.tokens.textStrong
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ArenaCompositionTest {
    private val step = 1f / 255f

    @Test
    fun heldMultipliesTheAlphaRatherThanReplacingIt() {
        val half = Color(red = 1f, green = 1f, blue = 1f, alpha = 0.5f)
        assertEquals(half.alpha * 0.5f, half.held(0.5f).alpha, step)
        assertTrue(half.held(0.5f).alpha < half.alpha * 0.75f)
        assertEquals(0.5f, Color.White.held(0.5f).alpha, step)
    }

    @Test
    fun heldChangesNothingButTheAlpha() {
        val held = ArenaDarkColors.textStrong.held(ArenaTokens.tintSoft)
        assertEquals(ArenaDarkColors.baseContent.red, held.red, step)
        assertEquals(ArenaDarkColors.baseContent.green, held.green, step)
        assertEquals(ArenaDarkColors.baseContent.blue, held.blue, step)
        assertTrue(held.alpha < ArenaDarkColors.baseContent.alpha)
    }

    @Test
    fun anAliasNamesAJobAndCarriesNoValueOfItsOwn() {
        assertEquals(ArenaDarkColors.base100, ArenaDarkColors.bg)
        assertEquals(ArenaDarkColors.base200, ArenaDarkColors.surfaceCard)
        assertEquals(ArenaDarkColors.baseContent, ArenaDarkColors.textStrong)
        assertEquals(ArenaDarkColors.primary, ArenaDarkColors.accent)
        assertEquals(ArenaDarkColors.error, ArenaDarkColors.danger)
        assertEquals(ArenaLightColors.base200, ArenaLightColors.surfaceCard)
    }
}
