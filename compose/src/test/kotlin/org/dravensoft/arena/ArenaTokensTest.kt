/* A dp and a point are both defined as one CSS pixel at 1x, so a fixed dimension crosses the
 * bridge numerically 1:1 and this is where that is stated once and held. The scales axis is
 * the other half: a dimension the reader's text setting moves arrives as sp and never as dp,
 * which no compiler can check because both are lengths. */

package org.dravensoft.arena

import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.dravensoft.arena.tokens.ArenaDarkColors
import org.dravensoft.arena.tokens.ArenaLightColors
import org.dravensoft.arena.tokens.ArenaTokens
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class ArenaTokensTest {
    @Test
    fun aFixedDimensionCrossesAtOneToOne() {
        assertEquals(16.dp, ArenaTokens.sp4)
        assertEquals(4.dp, ArenaTokens.sp1)
    }

    @Test
    fun aScalingDimensionArrivesAsSp() {
        assertEquals(15.sp, ArenaTokens.fsMd)
        assertEquals(16.sp, ArenaTokens.iconMd)
    }

    @Test
    fun theTwoThemesAreOneShapeAndNotOneValue() {
        assertNotEquals(ArenaDarkColors.base100, ArenaLightColors.base100)
        assertEquals(ArenaDarkColors::class, ArenaLightColors::class)
    }
}
